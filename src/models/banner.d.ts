import { Model } from 'sequelize';
import type { InferAttributes, InferCreationAttributes, CreationOptional } from 'sequelize';
export type BannerCollection = 'main' | 'promotion';
export declare class Banner extends Model<InferAttributes<Banner>, InferCreationAttributes<Banner>> {
    id: CreationOptional<number>;
    collection: BannerCollection;
    title: string;
    description: string;
    imageUrl: string;
    readonly createdAt: CreationOptional<Date>;
    readonly updatedAt: CreationOptional<Date>;
}
//# sourceMappingURL=banner.d.ts.map