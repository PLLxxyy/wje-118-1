import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { JwtPayload } from '../types';

const JWT_SECRET = 'marathon-volunteer-secret-2026';

export function generateToken(payload: JwtPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
}

export function authMiddleware(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: '未登录，请先登录' });
    return;
  }

  const token = authHeader.substring(7);
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload;
    (req as any).user = decoded;
    next();
  } catch {
    res.status(401).json({ error: '登录已过期，请重新登录' });
  }
}

export function organizerMiddleware(req: Request, res: Response, next: NextFunction): void {
  const user = (req as any).user as JwtPayload;
  if (user.role !== 'organizer' && user.role !== 'admin') {
    res.status(403).json({ error: '需要赛事方权限' });
    return;
  }
  next();
}

export function adminMiddleware(req: Request, res: Response, next: NextFunction): void {
  const user = (req as any).user as JwtPayload;
  if (user.role !== 'admin') {
    res.status(403).json({ error: '需要管理员权限' });
    return;
  }
  next();
}
