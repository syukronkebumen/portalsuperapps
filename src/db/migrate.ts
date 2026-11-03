import { DataTypes, QueryTypes } from 'sequelize';
import { pathToFileURL } from 'node:url';
import { sequelize } from '../database.js';
import type { Migration } from './types.js';
import { createBannersTable } from './migrations/001-create-banners.js';
import { createUsersTable } from './migrations/002-create-users.js';

const migrations: Migration[] = [createBannersTable, createUsersTable];

async function ensureMigrationsTable(): Promise<void> {
  const queryInterface = sequelize.getQueryInterface();
  if (await queryInterface.tableExists('migrations')) return;

  await queryInterface.createTable('migrations', {
    id: {
      type: DataTypes.BIGINT.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
      allowNull: false,
    },
    name: {
      type: DataTypes.STRING(255),
      allowNull: false,
      unique: true,
    },
    applied_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
  });
}

async function appliedMigrationNames(): Promise<Set<string>> {
  const rows = await sequelize.query<{ name: string }>('SELECT `name` FROM `migrations`', {
    type: QueryTypes.SELECT,
  });
  return new Set(rows.map((row) => row.name));
}

export async function runMigrations(direction: 'up' | 'down' = 'up'): Promise<void> {
  const queryInterface = sequelize.getQueryInterface();
  await ensureMigrationsTable();

  const applied = await appliedMigrationNames();
  const rollback = direction === 'down';
  const pending = migrations.filter((migration) =>
    rollback ? applied.has(migration.name) : !applied.has(migration.name),
  );

  for (const migration of pending) {
    console.log(`${rollback ? 'Rollback' : 'Menjalankan'} migration ${migration.name}...`);
    if (rollback) {
      await migration.down(queryInterface);
      await sequelize.query('DELETE FROM `migrations` WHERE `name` = ?', {
        replacements: [migration.name],
      });
    } else {
      await migration.up(queryInterface);
      await sequelize.query('INSERT INTO `migrations` (`name`, `applied_at`) VALUES (?, ?)', {
        replacements: [migration.name, new Date()],
      });
    }
  }

  if (pending.length === 0) console.log('Tidak ada migration yang perlu dijalankan.');
}

const isMainModule =
  process.argv[1] !== undefined && import.meta.url === pathToFileURL(process.argv[1]).href;

if (isMainModule) {
  sequelize
    .authenticate()
    .then(() => runMigrations())
    .then(() => sequelize.close())
    .then(() => console.log('Migration selesai.'))
    .catch((error: unknown) => {
      console.error('Migration gagal:', error);
      process.exit(1);
    });
}
