(function () {
  if (!window.Auth.guardAdmin()) return;
  sessionStorage.removeItem('portal_auth_attempts');

  const LIMITS = { main: 1, promotions: 3 };
  const TITLES = { main: 'Banner Utama', promotions: 'Banner Promosi' };
  const SECTION_TITLES = {
    dashboard: 'Dashboard',
    main: 'Banner Utama',
    promotions: 'Banner Promosi',
  };

  const state = { main: [], promotions: [] };
  let pendingDelete = null;

  const $ = (id) => document.getElementById(id);
  const toastEl = $('app-toast');
  const toast = bootstrap.Toast.getOrCreateInstance(toastEl, { delay: 3200 });
  const bannerModal = bootstrap.Modal.getOrCreateInstance($('banner-modal'));
  const deleteModal = bootstrap.Modal.getOrCreateInstance($('delete-modal'));

  /* ---------- Utilities ---------- */
  function escapeHtml(value) {
    return String(value ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function showToast(message) {
    $('app-toast-message').textContent = message;
    toast.show();
  }

  function showFormError(message) {
    const box = $('banner-form-alert');
    if (!message) {
      box.classList.add('d-none');
      return;
    }
    box.textContent = message;
    box.classList.remove('d-none');
  }

  function formatDate(iso) {
    if (!iso) return '–';
    const date = new Date(iso);
    if (Number.isNaN(date.getTime())) return '–';
    return date.toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' });
  }

  function initials(email) {
    const name = (email || 'admin').split('@')[0];
    return name.charAt(0).toUpperCase();
  }

  async function api(path, options = {}) {
    const response = await fetch(path, {
      ...options,
      headers: { Authorization: `Bearer ${window.Auth.getToken()}`, ...(options.headers || {}) },
    });

    if (response.status === 401) {
      window.Auth.clear();
      window.location.replace('/login');
      throw new Error('Sesi berakhir, silakan masuk kembali.');
    }

    const data = response.status === 204 ? null : await response.json().catch(() => null);
    if (!response.ok) {
      throw new Error((data && data.message) || 'Terjadi kesalahan pada server.');
    }
    return data;
  }

  /* ---------- Navigation ---------- */
  function showSection(name) {
    document.querySelectorAll('.content-section').forEach((section) => section.classList.remove('active'));
    document.querySelectorAll('.sidebar .nav-link[data-section]').forEach((link) => {
      link.classList.toggle('active', link.dataset.section === name);
    });
    const target = $(`section-${name}`);
    if (target) target.classList.add('active');
    $('page-title').textContent = SECTION_TITLES[name] || 'Dashboard';
    closeSidebar();
  }

  document.querySelectorAll('[data-section]').forEach((link) => {
    link.addEventListener('click', (event) => {
      event.preventDefault();
      showSection(link.dataset.section);
    });
  });

  document.querySelectorAll('[data-section-link]').forEach((button) => {
    button.addEventListener('click', () => showSection(button.dataset.sectionLink));
  });

  /* ---------- Sidebar (mobile) ---------- */
  const sidebar = $('sidebar');
  const backdrop = $('sidebar-backdrop');

  function openSidebar() {
    sidebar.classList.add('is-open');
    backdrop.hidden = false;
    requestAnimationFrame(() => backdrop.classList.add('show'));
  }

  function closeSidebar() {
    if (window.innerWidth >= 992) return;
    sidebar.classList.remove('is-open');
    backdrop.classList.remove('show');
    setTimeout(() => {
      backdrop.hidden = true;
    }, 250);
  }

  $('sidebar-toggle').addEventListener('click', openSidebar);
  backdrop.addEventListener('click', closeSidebar);
  window.addEventListener('resize', () => {
    if (window.innerWidth >= 992) {
      sidebar.classList.remove('is-open');
      backdrop.classList.remove('show');
      backdrop.hidden = true;
    }
  });

  /* ---------- Rendering ---------- */
  function bannerCard(banner, collection) {
    const image = banner.imageUrl
      ? `<img src="${escapeHtml(banner.imageUrl)}" class="banner-thumb" alt="${escapeHtml(banner.title)}" loading="lazy" />`
      : `<div class="banner-placeholder"><i class="bi bi-image"></i></div>`;

    return `
      <div class="col-md-6 col-xl-4" data-id="${escapeHtml(banner.id)}">
        <div class="card panel-card h-100">
          <div class="card-body d-flex flex-column">
            ${image}
            <div class="d-flex justify-content-between align-items-start mt-3 mb-1">
              <h3 class="h6 fw-bold mb-0 text-truncate">${escapeHtml(banner.title)}</h3>
              <span class="badge text-bg-light border">${escapeHtml(collection === 'main' ? 'Utama' : 'Promosi')}</span>
            </div>
            <p class="text-muted small mb-2" style="min-height:2.6em">${escapeHtml(banner.description)}</p>
            <div class="banner-meta mb-3">
              <div><i class="bi bi-calendar3 me-1"></i>Dibuat ${formatDate(banner.createdAt)}</div>
              <div><i class="bi bi-pencil-square me-1"></i>Diubah ${formatDate(banner.updatedAt)}</div>
            </div>
            <div class="mt-auto d-flex gap-2">
              <button class="btn btn-sm btn-outline-primary flex-grow-1" data-action="edit">
                <i class="bi bi-pencil me-1"></i>Ubah
              </button>
              <button class="btn btn-sm btn-outline-danger flex-grow-1" data-action="delete">
                <i class="bi bi-trash me-1"></i>Hapus
              </button>
            </div>
          </div>
        </div>
      </div>`;
  }

  function emptyState(collection) {
    const limit = LIMITS[collection];
    return `
      <div class="col-12">
        <div class="empty-state p-4 text-center">
          <i class="bi bi-inbox fs-1 text-muted"></i>
          <p class="fw-semibold mb-1 mt-2">Belum ada banner</p>
          <p class="text-muted small mb-0">Maksimal ${limit} ${TITLES[collection].toLowerCase()} dapat dibuat.</p>
        </div>
      </div>`;
  }

  function previewCard(banner) {
    if (!banner) {
      return `<div class="empty-state p-3 text-center text-muted small">Belum ada banner.</div>`;
    }
    const image = banner.imageUrl
      ? `<img src="${escapeHtml(banner.imageUrl)}" class="banner-thumb" alt="${escapeHtml(banner.title)}" loading="lazy" />`
      : `<div class="banner-placeholder"><i class="bi bi-image"></i></div>`;
    return `
      ${image}
      <div class="fw-semibold mt-2 text-truncate">${escapeHtml(banner.title)}</div>
      <div class="text-muted small text-truncate">${escapeHtml(banner.description)}</div>`;
  }

  function previewList(banners) {
    if (!banners.length) return `<div class="empty-state p-3 text-center text-muted small">Belum ada banner.</div>`;
    return `<div class="row g-3">${banners
      .map((banner) => `<div class="col-12">${previewCard(banner)}</div>`)
      .join('')}</div>`;
  }

  function render() {
    const main = state.main;
    const promo = state.promotions;

    $('stat-main').textContent = `${main.length}/${LIMITS.main}`;
    $('stat-promo').textContent = `${promo.length}/${LIMITS.promotions}`;
    $('stat-total').textContent = main.length + promo.length;

    $('preview-main').innerHTML = previewList(main);
    $('preview-promo').innerHTML = previewList(promo);

    $('list-main').innerHTML = main.length
      ? main.map((banner) => bannerCard(banner, 'main')).join('')
      : emptyState('main');
    $('list-promo').innerHTML = promo.length
      ? promo.map((banner) => bannerCard(banner, 'promotions')).join('')
      : emptyState('promotions');

    $('btn-add-main').disabled = main.length >= LIMITS.main;
    $('btn-add-promo').disabled = promo.length >= LIMITS.promotions;

    bindCardActions('list-main', 'main');
    bindCardActions('list-promo', 'promotions');
  }

  function bindCardActions(containerId, collection) {
    const container = $(containerId);
    container.querySelectorAll('[data-action]').forEach((button) => {
      button.addEventListener('click', () => {
        const card = button.closest('[data-id]');
        const id = card && card.dataset.id;
        const banner = state[collection].find((item) => item.id === id);
        if (!banner) return;
        if (button.dataset.action === 'edit') openEditModal(collection, banner);
        else openDeleteModal(collection, banner);
      });
    });
  }

  /* ---------- Data loading ---------- */
  async function loadAll() {
    try {
      const [main, promotions] = await Promise.all([
        api('/api/banners/main'),
        api('/api/banners/promotions'),
      ]);
      state.main = main;
      state.promotions = promotions;
      $('global-alert').classList.add('d-none');
      render();
    } catch (error) {
      const box = $('global-alert');
      box.textContent = error.message;
      box.classList.remove('d-none');
    }
  }

  /* ---------- Create / Edit ---------- */
  function resetPreview() {
    $('banner-preview-wrap').classList.add('d-none');
    $('banner-preview').removeAttribute('src');
    $('banner-preview-meta').textContent = '';
  }

  function openAddModal(collection) {
    $('banner-form').reset();
    $('banner-id').value = '';
    $('banner-collection').value = collection;
    $('banner-modal-title').textContent = `Tambah ${TITLES[collection]}`;
    $('banner-image').required = true;
    $('banner-image').parentElement.classList.remove('d-none');
    resetPreview();
    showFormError('');
    bannerModal.show();
  }

  function openEditModal(collection, banner) {
    $('banner-form').reset();
    $('banner-id').value = banner.id;
    $('banner-collection').value = collection;
    $('banner-modal-title').textContent = `Ubah ${TITLES[collection]}`;
    $('banner-title').value = banner.title;
    $('banner-description').value = banner.description;
    $('banner-image').required = false;
    $('banner-image').parentElement.classList.remove('d-none');
    if (banner.imageUrl) {
      $('banner-preview').src = banner.imageUrl;
      $('banner-preview-meta').textContent = 'Gambar saat ini';
      $('banner-preview-wrap').classList.remove('d-none');
    } else {
      resetPreview();
    }
    showFormError('');
    bannerModal.show();
  }

  $('btn-add-main').addEventListener('click', () => openAddModal('main'));
  $('btn-add-promo').addEventListener('click', () => openAddModal('promotions'));

  $('banner-image').addEventListener('change', function () {
    const file = this.files && this.files[0];
    if (!file) {
      resetPreview();
      return;
    }
    if (!['image/jpeg', 'image/png'].includes(file.type)) {
      showFormError('Format gambar harus JPG atau PNG.');
      this.value = '';
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      showFormError('Ukuran gambar maksimal 2MB.');
      this.value = '';
      return;
    }
    showFormError('');
    const reader = new FileReader();
    reader.onload = (event) => {
      $('banner-preview').src = event.target.result;
      $('banner-preview-meta').textContent = file.name;
      $('banner-preview-wrap').classList.remove('d-none');
    };
    reader.readAsDataURL(file);
  });

  $('banner-form').addEventListener('submit', async (event) => {
    event.preventDefault();
    showFormError('');

    const id = $('banner-id').value;
    const collection = $('banner-collection').value;
    const title = $('banner-title').value.trim();
    const description = $('banner-description').value.trim();
    const file = $('banner-image').files && $('banner-image').files[0];

    if (!title || !description) {
      showFormError('Judul dan deskripsi wajib diisi.');
      return;
    }
    if (!id && !file) {
      showFormError('Gambar wajib dipilih.');
      return;
    }

    const formData = new FormData();
    formData.append('title', title);
    formData.append('description', description);
    if (file) formData.append('image', file);

    const submit = $('banner-submit');
    const spinner = $('banner-spinner');
    submit.disabled = true;
    spinner.classList.remove('d-none');

    try {
      if (id) {
        await api(`/api/banners/${collection}/${id}`, { method: 'PUT', body: formData });
        showToast('Banner berhasil diperbarui.');
      } else {
        await api(`/api/banners/${collection}`, { method: 'POST', body: formData });
        showToast('Banner berhasil ditambahkan.');
      }
      bannerModal.hide();
      await loadAll();
    } catch (error) {
      showFormError(error.message);
    } finally {
      submit.disabled = false;
      spinner.classList.add('d-none');
    }
  });

  /* ---------- Delete ---------- */
  function openDeleteModal(collection, banner) {
    pendingDelete = { collection, id: banner.id, title: banner.title };
    deleteModal.show();
  }

  $('confirm-delete').addEventListener('click', async () => {
    if (!pendingDelete) return;
    const button = $('confirm-delete');
    const spinner = $('delete-spinner');
    button.disabled = true;
    spinner.classList.remove('d-none');

    try {
      await api(`/api/banners/${pendingDelete.collection}/${pendingDelete.id}`, { method: 'DELETE' });
      deleteModal.hide();
      showToast('Banner berhasil dihapus.');
      pendingDelete = null;
      await loadAll();
    } catch (error) {
      showToast(error.message);
    } finally {
      button.disabled = false;
      spinner.classList.add('d-none');
    }
  });

  /* ---------- Account ---------- */
  const email = window.Auth.getEmail();
  $('user-email').textContent = email || 'admin';
  $('avatar-chip').textContent = initials(email);

  $('logout-link').addEventListener('click', (event) => {
    event.preventDefault();
    window.Auth.clear();
    window.location.replace('/login');
  });

  loadAll();
})();
