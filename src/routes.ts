import { existsSync, readFileSync, unlinkSync } from 'node:fs';
import { join } from 'node:path';
import { randomUUID } from 'node:crypto';
import type { NextFunction, Request, Response } from 'express';
import { Router } from 'express';
import multer from 'multer';
import {
  createBanner,
  deleteBanner,
  getBanner,
  listMainBanner,
  listPromotionBanners,
  updateBanner,
} from './banner-store.js';
import { requireAuth } from './auth.js';

export const router = Router();

const uploadsDirectory = join(process.cwd(), 'uploads');
const allowedMimeTypes = new Set(['image/jpeg', 'image/png']);

const upload = multer({
  storage: multer.diskStorage({
    destination: uploadsDirectory,
    filename(request, file, callback) {
      const extension = file.mimetype === 'image/png' ? '.png' : '.jpg';
      callback(null, `${randomUUID()}${extension}`);
    },
  }),
  limits: { fileSize: 2 * 1024 * 1024 },
  fileFilter(_request, file, callback) {
    callback(null, allowedMimeTypes.has(file.mimetype));
  },
});

function asyncRoute(handler: (req: Request, res: Response, next: NextFunction) => Promise<void>) {
  return (req: Request, res: Response, next: NextFunction) => {
    void handler(req, res, next).catch(next);
  };
}

function removeUploadedFile(filePath: string | undefined): void {
  if (filePath && existsSync(filePath)) unlinkSync(filePath);
}

function imageUrl(request: Request, filename: string): string {
  return `${request.protocol}://${request.get('host')}/uploads/${filename}`;
}

function routeParam(request: Request, name: string): string {
  const value = request.params[name];
  return Array.isArray(value) ? value[0] ?? '' : value ?? '';
}

type BannerCollection = 'main' | 'promotion';

function parseCollection(request: Request, response: Response): BannerCollection | null {
  const collection = routeParam(request, 'collection');
  if (collection === 'main') return 'main';
  if (collection === 'promotions') return 'promotion';

  response.status(400).json({ message: "Collection must be 'main' or 'promotions'" });
  return null;
}

function imageHasValidSignature(filePath: string): boolean {
  const content = readFileSync(filePath);
  const png = content.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]));
  const jpeg = content[0] === 0xff && content[1] === 0xd8 && content[2] === 0xff;
  return png || jpeg;
}

router.get('/main', asyncRoute(async (_request, response) => {
  response.json(await listMainBanner());
}));

router.get('/promotions', asyncRoute(async (_request, response) => {
  response.json(await listPromotionBanners());
}));

router.get('/:collection/:id', asyncRoute(async (request, response) => {
  const collection = parseCollection(request, response);
  if (!collection) return;
  const banner = await getBanner(collection, routeParam(request, 'id'));
  response.status(banner ? 200 : 404).json(banner ?? { message: 'Banner not found' });
}));

router.post('/:collection',
  requireAuth,
  upload.single('image'),
  asyncRoute(async (request, response) => {
    const collection = parseCollection(request, response);
    if (!collection) {
      removeUploadedFile(request.file?.path);
      return;
    }
    const file = request.file;

    if (!request.body.title || !request.body.description || !file) {
      removeUploadedFile(file?.path);
      response.status(400).json({ message: 'Title, description, and image are required' });
      return;
    }
    if (!imageHasValidSignature(file.path)) {
      removeUploadedFile(file.path);
      response.status(400).json({ message: 'Image must be a valid JPG or PNG file' });
      return;
    }

    const existing = collection === 'main' ? await listMainBanner() : await listPromotionBanners();
    if ((collection === 'main' && existing.length >= 1) || (collection === 'promotion' && existing.length >= 3)) {
      removeUploadedFile(file.path);
      response.status(409).json({
        message: collection === 'main' ? 'Main banner already exists' : 'A maximum of 3 promotion banners is allowed',
      });
      return;
    }

    const banner = await createBanner(collection, {
      title: String(request.body.title).trim(),
      description: String(request.body.description).trim(),
      imageUrl: imageUrl(request, file.filename),
    });
    response.status(201).json(banner);
  }));

router.put('/:collection/:id',
  requireAuth,
  upload.single('image'),
  asyncRoute(async (request, response) => {
    const collection = parseCollection(request, response);
    if (!collection) {
      removeUploadedFile(request.file?.path);
      return;
    }
    const file = request.file;

    if (file && !imageHasValidSignature(file.path)) {
      removeUploadedFile(file.path);
      response.status(400).json({ message: 'Image must be a valid JPG or PNG file' });
      return;
    }

    const input: { title?: string; description?: string; imageUrl?: string } = {};
    if (typeof request.body.title === 'string') input.title = request.body.title.trim();
    if (typeof request.body.description === 'string') input.description = request.body.description.trim();
    if (file) input.imageUrl = imageUrl(request, file.filename);

    const current = await getBanner(collection, routeParam(request, 'id'));
    if (!current) {
      removeUploadedFile(file?.path);
      response.status(404).json({ message: 'Banner not found' });
      return;
    }

    const banner = await updateBanner(collection, routeParam(request, 'id'), input);
    if (file && current.imageUrl !== banner?.imageUrl) {
      const oldImageName = current.imageUrl.split('/uploads/')[1];
      if (oldImageName) removeUploadedFile(join(uploadsDirectory, oldImageName));
    }
    response.json(banner);
  }));

router.delete('/:collection/:id', requireAuth, asyncRoute(async (request, response) => {
  const collection = parseCollection(request, response);
  if (!collection) return;
  const banner = await deleteBanner(collection, routeParam(request, 'id'));
  if (!banner) {
    response.status(404).json({ message: 'Banner not found' });
    return;
  }

  const imageName = banner.imageUrl.split('/uploads/')[1];
  if (imageName) removeUploadedFile(join(uploadsDirectory, imageName));
  response.status(204).send();
}));
