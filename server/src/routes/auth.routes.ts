import { Router } from 'express';
import { z } from 'zod';
import * as authService from '../services/auth.service';
import jwt from 'jsonwebtoken';
import { authenticate, AuthRequest } from '../middleware/auth';
import { authLimiter, strictAuthLimiter } from '../middleware/rateLimiter';
import passport from '../middleware/passport';
import { config as appConfig } from '../config';

const router = Router();

const registerSchema = z.object({
  email: z.string().email(),
  handle: z.string().min(3).max(30).regex(/^[a-zA-Z0-9_]+$/),
  displayName: z.string().min(1).max(100),
  password: z.string().min(8),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

router.post('/register', authLimiter, async (req, res) => {
  try {
    const data = registerSchema.parse(req.body);
    const result = await authService.register(data);
    res.status(201).json(result);
  } catch (err: any) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation failed', details: err.errors });
    }
    if (err instanceof authService.AuthError) {
      return res.status(err.statusCode).json({ error: err.message, code: err.code });
    }
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/login', strictAuthLimiter, async (req, res) => {
  try {
    const data = loginSchema.parse(req.body);
    const result = await authService.login(data);
    res.json(result);
  } catch (err: any) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation failed', details: err.errors });
    }
    if (err instanceof authService.AuthError) {
      return res.status(err.statusCode).json({ error: err.message, code: err.code });
    }
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/refresh', authLimiter, async (req, res) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) {
      return res.status(400).json({ error: 'Refresh token required' });
    }
    const tokens = await authService.refreshAccessToken(refreshToken);
    res.json(tokens);
  } catch (err: any) {
    if (err instanceof authService.AuthError) {
      return res.status(err.statusCode).json({ error: err.message, code: err.code });
    }
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/me', authenticate, async (req: AuthRequest, res) => {
  try {
    const user = await authService.getUserById(req.userId!);
    res.json(user);
  } catch (err: any) {
    if (err instanceof authService.AuthError) {
      return res.status(err.statusCode).json({ error: err.message, code: err.code });
    }
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Google OAuth
router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }));
router.get('/google/callback', passport.authenticate('google', { session: false, failureRedirect: '/login' }), (req, res) => {
  const user = req.user as any;
  const accessToken = jwt.sign({ sub: user.id }, appConfig.jwtSecret, { expiresIn: '15m' });
  const refreshToken = jwt.sign({ sub: user.id, type: 'refresh' }, appConfig.jwtRefreshSecret, { expiresIn: '7d' });
  res.redirect(`${appConfig.clientUrl}/oauth?accessToken=${accessToken}&refreshToken=${refreshToken}&handle=${user.handle}`);
});

// Apple OAuth scaffold
router.get('/apple', (req, res) => {
  res.json({ error: 'Apple OAuth not configured. Set APPLE_CLIENT_ID, APPLE_TEAM_ID, APPLE_KEY_ID, and APPLE_PRIVATE_KEY.' });
});

export default router;
