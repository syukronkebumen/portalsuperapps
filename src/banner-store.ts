import { Banner, type BannerCollection } from './models/banner.js';

export interface BannerInput {
  title: string;
  description: string;
  imageUrl: string;
}

export interface BannerDTO extends BannerInput {
  id: string;
  createdAt: string;
  updatedAt: string;
}

export type { BannerCollection };

function serialize(row: Banner): BannerDTO {
  return {
    id: String(row.id),
    title: row.title,
    description: row.description,
    imageUrl: row.imageUrl,
    createdAt: row.createdAt?.toISOString() ?? '',
    updatedAt: row.updatedAt?.toISOString() ?? '',
  };
}

function parseId(id: string): number | null {
  const value = Number(id);
  return Number.isInteger(value) && value > 0 ? value : null;
}

export async function listMainBanner(): Promise<BannerDTO[]> {
  const rows = await Banner.findAll({
    where: { collection: 'main' },
    limit: 1,
    order: [['id', 'ASC']],
  });
  return rows.map(serialize);
}

export async function listPromotionBanners(): Promise<BannerDTO[]> {
  const rows = await Banner.findAll({
    where: { collection: 'promotion' },
    limit: 3,
    order: [['id', 'ASC']],
  });
  return rows.map(serialize);
}

export async function getBanner(collection: BannerCollection, id: string): Promise<BannerDTO | null> {
  const numericId = parseId(id);
  if (numericId === null) return null;

  const row = await Banner.findOne({ where: { id: numericId, collection } });
  return row ? serialize(row) : null;
}

export async function createBanner(collection: BannerCollection, input: BannerInput): Promise<BannerDTO> {
  const row = await Banner.create({ collection, ...input });
  return serialize(row);
}

export async function updateBanner(
  collection: BannerCollection,
  id: string,
  input: Partial<BannerInput>,
): Promise<BannerDTO | null> {
  const numericId = parseId(id);
  if (numericId === null) return null;

  const row = await Banner.findOne({ where: { id: numericId, collection } });
  if (!row) return null;

  await row.update(input);
  return serialize(row);
}

export async function deleteBanner(collection: BannerCollection, id: string): Promise<BannerDTO | null> {
  const numericId = parseId(id);
  if (numericId === null) return null;

  const row = await Banner.findOne({ where: { id: numericId, collection } });
  if (!row) return null;

  const banner = serialize(row);
  await row.destroy();
  return banner;
}
