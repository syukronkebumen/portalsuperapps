import { type BannerCollection } from './models/banner.js';
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
export declare function listMainBanner(): Promise<BannerDTO[]>;
export declare function listPromotionBanners(): Promise<BannerDTO[]>;
export declare function getBanner(collection: BannerCollection, id: string): Promise<BannerDTO | null>;
export declare function createBanner(collection: BannerCollection, input: BannerInput): Promise<BannerDTO>;
export declare function updateBanner(collection: BannerCollection, id: string, input: Partial<BannerInput>): Promise<BannerDTO | null>;
export declare function deleteBanner(collection: BannerCollection, id: string): Promise<BannerDTO | null>;
//# sourceMappingURL=banner-store.d.ts.map