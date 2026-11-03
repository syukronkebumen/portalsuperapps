import express, { type NextFunction, type Request, type Response } from 'express';
import multer from 'multer';
import { compare } from 'bcryptjs';
import { existsSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { config } from './config.js';
import { sequelize } from './database.js';
import { createToken, verifyPageToken, verifyToken } from './auth.js';
import { runMigrations } from './db/migrate.js';
import { router } from './routes.js';
import { User } from './models/user.js';
import './models/banner.js';

const app = express();
const port = config.port;

const projectRoot = dirname(fileURLToPath(import.meta.url));
const viewsDirectory = join(projectRoot, 'views');
const publicDirectory = join(projectRoot, 'public');

if (!existsSync(join(process.cwd(), 'uploads'))) mkdirSync(join(process.cwd(), 'uploads'));

app.set('view engine', 'ejs');
app.set('views', viewsDirectory);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(join(process.cwd(), 'uploads')));
app.use(express.static(publicDirectory));
app.use('/vendor/bootstrap', express.static(join(process.cwd(), 'node_modules/bootstrap/dist')));
app.use('/vendor/bootstrap-icons', express.static(join(process.cwd(), 'node_modules/bootstrap-icons/font')));

function readCookie(request: Request, name: string): string | undefined {
  const header = request.headers.cookie;
  if (!header) return undefined;
  for (const part of header.split(';')) {
    const [key, ...value] = part.trim().split('=');
    if (key === name) return decodeURIComponent(value.join('='));
  }
  return undefined;
}

app.get('/login', (request: Request, response: Response) => {
  if (verifyPageToken(readCookie(request, 'portal_token'))) {
    response.redirect('/admin');
    return;
  }
  response.render('login');
});

app.get('/admin', (request: Request, response: Response) => {
  if (!verifyPageToken(readCookie(request, 'portal_token'))) {
    response.redirect('/login');
    return;
  }
  response.render('admin');
});

app.post('/api/auth/login', async (request: Request, response: Response) => {
  const email = String(request.body.email ?? '').trim();
  const password = String(request.body.password ?? '');

  if (!config.jwtSecret) {
    response.status(500).json({ message: 'Authentication is not configured' });
    return;
  }

  const user = email ? await User.findOne({ where: { email } }) : null;
  const passwordMatches = user ? await compare(password, user.password) : false;
  if (!user || !passwordMatches) {
    response.status(401).json({ message: 'Invalid email or password' });
    return;
  }

  response.json({ token: createToken(user.email) });
});

app.get('/api/auth/me', (request: Request, response: Response) => {
  const authorization = request.headers.authorization;
  const token = authorization?.startsWith('Bearer ') ? authorization.slice(7) : undefined;
  const user = verifyToken(token);
  if (!user) {
    response.status(401).json({ message: 'Invalid or expired token' });
    return;
  }
  response.json({ email: user.email });
});

app.use('/api/banners', router);

app.get('/', (_request: Request, response: Response) => {
  response.redirect('/login');
});

app.get('/api', (_request: Request, response: Response) => {
  response.json({ name: 'Portal Super Apps API', version: '1.0.0' });
});

app.use((error: unknown, _request: Request, response: Response, _next: NextFunction) => {
  if (error instanceof multer.MulterError && error.code === 'LIMIT_FILE_SIZE') {
    response.status(413).json({ message: 'Image size must not exceed 2MB' });
    return;
  }
  console.error(error);
  response.status(500).json({ message: 'Internal server error' });
});

async function start(): Promise<void> {
  await sequelize.authenticate();
  await runMigrations();
  console.log('Database MySQL terhubung & migrasi selesai dijalankan.');

  app.listen(port, () => {
    console.log(`Server berjalan di http://localhost:${port}`);
  });
}

start().catch((error) => {
  console.error('Gagal menjalankan server:', error);
  process.exit(1);
});
