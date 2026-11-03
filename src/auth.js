import jwt from 'jsonwebtoken';
import { config } from './config.js';
export function requireAuth(req, res, next) {
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
export function verifyToken(token) {
    if (!token || !config.jwtSecret)
        return null;
    try {
        const payload = jwt.verify(token, config.jwtSecret);
        return { email: String(payload.email ?? '') };
    }
    catch {
        return null;
    }
}
export function createToken(email) {
    if (!config.jwtSecret) {
        throw new Error('JWT_SECRET is not configured');
    }
    const expiresIn = config.jwtExpiresIn;
    const options = { expiresIn };
    return jwt.sign({ email }, config.jwtSecret, options);
}
export function verifyPageToken(token) {
    return verifyToken(token) !== null;
}
//# sourceMappingURL=auth.js.map