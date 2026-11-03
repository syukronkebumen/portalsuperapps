import { hash } from 'bcryptjs';
import { config } from '../../config.js';
import { User } from '../../models/user.js';
import type { Seeder } from '../types.js';

export const adminUserSeeder: Seeder = {
  name: '001-admin-user',
  async run() {
    const email = (config.adminEmail || 'admin@example.com').trim();
    const password = config.adminPassword || 'change-this-password';

    const existing = await User.findOne({ where: { email } });
    if (existing) {
      console.log(`User admin "${email}" sudah ada, dilewati.`);
      return;
    }

    await User.create({
      name: 'Administrator',
      email,
      password: await hash(password, 10),
    });
    console.log(`User admin "${email}" berhasil dibuat.`);
  },
};
