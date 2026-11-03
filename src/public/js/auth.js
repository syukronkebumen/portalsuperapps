(function () {
  function readCookie(name) {
    const match = document.cookie.match(new RegExp('(?:^|;\\s*)' + name + '=([^;]*)'));
    return match ? decodeURIComponent(match[1]) : '';
  }

  function decodeEmail(token) {
    try {
      const payload = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
      const json = decodeURIComponent(
        atob(payload)
          .split('')
          .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join(''),
      );
      return String(JSON.parse(json).email || '');
    } catch {
      return '';
    }
  }

  window.Auth = {
    getToken() {
      const local = localStorage.getItem('portal_token');
      if (local) return local;
      const cookie = readCookie('portal_token');
      if (cookie) {
        localStorage.setItem('portal_token', cookie);
        return cookie;
      }
      return '';
    },
    getEmail() {
      const local = localStorage.getItem('portal_email');
      if (local) return local;
      const token = this.getToken();
      const email = token ? decodeEmail(token) : '';
      if (email) localStorage.setItem('portal_email', email);
      return email;
    },
    setSession(token, email) {
      localStorage.setItem('portal_token', token);
      localStorage.setItem('portal_email', email || decodeEmail(token) || '');
      document.cookie = `portal_token=${encodeURIComponent(token)}; path=/; max-age=${60 * 60 * 8}; SameSite=Lax`;
    },
    clear() {
      localStorage.removeItem('portal_token');
      localStorage.removeItem('portal_email');
      document.cookie = 'portal_token=; path=/; max-age=0; SameSite=Lax';
    },
    isLoggedIn() {
      return Boolean(this.getToken());
    },
    guardAdmin() {
      if (!this.isLoggedIn()) {
        window.location.replace('/login');
        return false;
      }
      return true;
    },
  };
})();
