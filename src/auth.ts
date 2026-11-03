import type { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import type { SignOptions } from 'jsonwebtoken';
import { config } from './config.js';

export interface AuthenticatedRequest extends Request {
  user?: { email: string };
}

export function requireAuth(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
  const authorization = req.headers.authorization;
  const token = authorization?.startsWith('Bearer ') ? authorization.slice(7) : undefined;
  const user = verifyToken(token);

  if (!user) {
    res.status(401).json({ message: token ? 'Invalid or expired token' : 'Authentication required' });
    return;
  }

  req.user = user;
  next();
}

export function verifyToken(token: string | undefined): { email: string } | null {
  if (!token || !config.jwtSecret) return null;
  try {
    const payload = jwt.verify(token, config.jwtSecret) as jwt.JwtPayload;
    return { email: String(payload.email ?? '') };
  } catch {
    return null;
  }
}

export function createToken(email: string): string {
  if (!config.jwtSecret) {
    throw new Error('JWT_SECRET is not configured');
  }

  const expiresIn = config.jwtExpiresIn as NonNullable<SignOptions['expiresIn']>;
  const options: SignOptions = { expiresIn };
  return jwt.sign({ email }, config.jwtSecret, options);
}

export function verifyPageToken(token: string | undefined): boolean {
  return verifyToken(token) !== null;
}
