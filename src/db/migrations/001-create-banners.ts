import { DataTypes } from 'sequelize';
import type { Migration } from '../types.js';

export const createBannersTable: Migration = {
  name: '001-create-banners',
  async up(queryInterface) {
    if (await queryInterface.tableExists('banners')) return;

    await queryInterface.createTable('banners', {
      id: {
        type: DataTypes.BIGINT.UNSIGNED,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false,
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
      image_url: {
        type: DataTypes.STRING(2048),
        allowNull: false,
      },
      created_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
      updated_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
    });
  },
  async down(queryInterface) {
    await queryInterface.dropTable('banners');
  },
};
