import { Router } from 'express';
import { z } from 'zod';
import * as authService from '../services/auth.service';
import { authenticate, AuthRequest } from '../middleware/auth';
import { asyncHandler } from '../middleware/asyncHandler';
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

router.post('/register', authLimiter, asyncHandler(async (req, res) => {
  const data = registerSchema.parse(req.body);
  res.status(201).json(await authService.register(data));
}));

router.post('/login', strictAuthLimiter, asyncHandler(async (req, res) => {
  const data = loginSchema.parse(req.body);
  res.json(await authService.login(data));
}));

router.post('/refresh', authLimiter, asyncHandler(async (req, res) => {
  const { refreshToken } = req.body;
  if (!refreshToken) {
    return res.status(400).json({ error: 'Refresh token required' });
  }
  res.json(await authService.refreshAccessToken(refreshToken));
}));

router.get('/me', authenticate, asyncHandler(async (req: AuthRequest, res) => {
  res.json(await authService.getUserById(req.userId!));
}));

// Exchange a single-use OAuth code (from the callback redirect) for tokens.
router.post('/exchange', authLimiter, asyncHandler(async (req, res) => {
  const { code } = req.body;
  if (!code || typeof code !== 'string') {
    return res.status(400).json({ error: 'Code required' });
  }
  res.json(await authService.exchangeOAuthCode(code));
}));

// Revoke the server-side refresh token so it can't be reused after logout.
router.post('/logout', authenticate, asyncHandler(async (req: AuthRequest, res) => {
  await authService.logout(req.userId!);
  res.json({ success: true });
}));

// Google OAuth
router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }));
router.get(
  '/google/callback',
  passport.authenticate('google', { session: false, failureRedirect: '/login' }),
  asyncHandler(async (req, res) => {
    const user = req.user as any;
    // Hand the client a single-use code instead of tokens-in-URL.
    const code = await authService.createOAuthCode(user.id);
    res.redirect(`${appConfig.clientUrl}/stub/oauth?code=${code}`);
  }),
);

// Apple OAuth scaffold
router.get('/apple', (_req, res) => {
  res.json({ error: 'Apple OAuth not configured. Set APPLE_CLIENT_ID, APPLE_TEAM_ID, APPLE_KEY_ID, and APPLE_PRIVATE_KEY.' });
});

export default router;
