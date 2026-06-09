import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config';
import { prisma } from '../lib/prisma';

export interface AuthRequest extends Request {
  userId?: string;
}

export function authenticate(req: AuthRequest, res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing or invalid authorization header' });
  }

  const token = header.slice(7);
  try {
    const payload = jwt.verify(token, config.jwtSecret) as { sub: string };
    req.userId = payload.sub;
    next();
  } catch {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}

export function optionalAuth(req: AuthRequest, _res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (header?.startsWith('Bearer ')) {
    const token = header.slice(7);
    try {
      const payload = jwt.verify(token, config.jwtSecret) as { sub: string };
      req.userId = payload.sub;
    } catch {
      // Token invalid, continue without auth
    }
  }
  next();
}

export function requirePlan(plan: string) {
  return async (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.userId) return res.status(401).json({ error: 'Authentication required' });
    const user = await prisma.user.findUnique({ where: { id: req.userId }, select: { planTier: true } });
    if (!user) return res.status(401).json({ error: 'User not found' });
    if (user.planTier !== plan) {
      return res.status(403).json({ error: `Requires ${plan} plan`, code: 'PLAN_REQUIRED' });
    }
    next();
  };
}
