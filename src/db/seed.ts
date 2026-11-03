import { pathToFileURL } from 'node:url';
import { sequelize } from '../database.js';
import type { Seeder } from './types.js';
import { adminUserSeeder } from './seeders/001-admin-user.js';

const seeders: Seeder[] = [adminUserSeeder];

export async function runSeeders(): Promise<void> {
  for (const seeder of seeders) {
    console.log(`Menjalankan seeder ${seeder.name}...`);
    await seeder.run();
  }
}

const isMainModule =
  process.argv[1] !== undefined && import.meta.url === pathToFileURL(process.argv[1]).href;

if (isMainModule) {
  sequelize
    .authenticate()
    .then(() => runSeeders())
    .then(() => sequelize.close())
    .then(() => console.log('Seeder selesai.'))
    .catch((error: unknown) => {
      console.error('Seeder gagal:', error);
      process.exit(1);
    });
}
