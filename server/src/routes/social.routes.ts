import { Router } from 'express';
import { z } from 'zod';
import { authenticate, AuthRequest, optionalAuth } from '../middleware/auth';
import * as socialService from '../services/social.service';

const router = Router();

const followSchema = z.object({ handle: z.string().min(1) });

router.post('/follow', authenticate, async (req: AuthRequest, res) => {
  try {
    const { handle } = followSchema.parse(req.body);
    const result = await socialService.followUser(req.userId!, handle);
    res.status(201).json(result);
  } catch (err: any) {
    if (err instanceof z.ZodError) return res.status(400).json({ error: 'Validation failed', details: err.errors });
    if (err instanceof socialService.SocialError) return res.status(err.statusCode).json({ error: err.message, code: err.code });
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/unfollow', authenticate, async (req: AuthRequest, res) => {
  try {
    const { handle } = followSchema.parse(req.body);
    const result = await socialService.unfollowUser(req.userId!, handle);
    res.json(result);
  } catch (err: any) {
    if (err instanceof z.ZodError) return res.status(400).json({ error: 'Validation failed', details: err.errors });
    if (err instanceof socialService.SocialError) return res.status(err.statusCode).json({ error: err.message, code: err.code });
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/following', authenticate, async (req: AuthRequest, res) => {
  try {
    const users = await socialService.getFollowing(req.userId!);
    res.json(users);
  } catch (err) { console.error(err); res.status(500).json({ error: 'Internal server error' }); }
});

router.get('/followers', authenticate, async (req: AuthRequest, res) => {
  try {
    const users = await socialService.getFollowers(req.userId!);
    res.json(users);
  } catch (err) { console.error(err); res.status(500).json({ error: 'Internal server error' }); }
});

router.get('/:handle/follow-stats', optionalAuth, async (req, res) => {
  try {
    const stats = await socialService.getFollowStats(req.params.handle);
    res.json(stats);
  } catch (err: any) {
    if (err instanceof socialService.SocialError) return res.status(err.statusCode).json({ error: err.message, code: err.code });
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
