import type { NextFunction, Request, Response } from 'express';
export interface AuthenticatedRequest extends Request {
    user?: {
        email: string;
    };
}
export declare function requireAuth(req: AuthenticatedRequest, res: Response, next: NextFunction): void;
export declare function verifyToken(token: string | undefined): {
    email: string;
} | null;
export declare function createToken(email: string): string;
export declare function verifyPageToken(token: string | undefined): boolean;
//# sourceMappingURL=auth.d.ts.map