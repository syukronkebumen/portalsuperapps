import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../database.js';
export class Banner extends Model {
}
Banner.init({
    id: {
        type: DataTypes.BIGINT.UNSIGNED,
        autoIncrement: true,
        primaryKey: true,
    },
    collection: {
        type: DataTypes.ENUM('main', 'promotion'),
        allowNull: false,
    },
    title: {
        type: DataTypes.STRING(255),
        allowNull: false,
    },
    description: {
        type: DataTypes.TEXT,
        allowNull: false,
    },
    imageUrl: {
        type: DataTypes.STRING(2048),
        allowNull: false,
        field: 'image_url',
    },
    createdAt: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
        field: 'created_at',
    },
    updatedAt: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
        field: 'updated_at',
    },
}, {
    sequelize,
    tableName: 'banners',
    timestamps: true,
    underscored: true,
});
//# sourceMappingURL=banner.js.map