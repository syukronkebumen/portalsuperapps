import { Banner } from './models/banner.js';
function serialize(row) {
    return {
        id: String(row.id),
        title: row.title,
        description: row.description,
        imageUrl: row.imageUrl,
        createdAt: row.createdAt?.toISOString() ?? '',
        updatedAt: row.updatedAt?.toISOString() ?? '',
    };
}
function parseId(id) {
    const value = Number(id);
    return Number.isInteger(value) && value > 0 ? value : null;
}
export async function listMainBanner() {
    const rows = await Banner.findAll({
        where: { collection: 'main' },
        limit: 1,
        order: [['id', 'ASC']],
    });
    return rows.map(serialize);
}
export async function listPromotionBanners() {
    const rows = await Banner.findAll({
        where: { collection: 'promotion' },
        limit: 3,
        order: [['id', 'ASC']],
    });
    return rows.map(serialize);
}
export async function getBanner(collection, id) {
    const numericId = parseId(id);
    if (numericId === null)
        return null;
    const row = await Banner.findOne({ where: { id: numericId, collection } });
    return row ? serialize(row) : null;
}
export async function createBanner(collection, input) {
    const row = await Banner.create({ collection, ...input });
    return serialize(row);
}
export async function updateBanner(collection, id, input) {
    const numericId = parseId(id);
    if (numericId === null)
        return null;
    const row = await Banner.findOne({ where: { id: numericId, collection } });
    if (!row)
        return null;
    await row.update(input);
    return serialize(row);
}
export async function deleteBanner(collection, id) {
    const numericId = parseId(id);
    if (numericId === null)
        return null;
    const row = await Banner.findOne({ where: { id: numericId, collection } });
    if (!row)
        return null;
    const banner = serialize(row);
    await row.destroy();
    return banner;
}
//# sourceMappingURL=banner-store.js.map