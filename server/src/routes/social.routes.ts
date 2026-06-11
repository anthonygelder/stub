import { Router } from 'express';
import { z } from 'zod';
import { authenticate, AuthRequest, optionalAuth } from '../middleware/auth';
import { asyncHandler } from '../middleware/asyncHandler';
import * as socialService from '../services/social.service';

const router = Router();

const followSchema = z.object({ handle: z.string().min(1) });

router.post('/follow', authenticate, asyncHandler(async (req: AuthRequest, res) => {
  const { handle } = followSchema.parse(req.body);
  res.status(201).json(await socialService.followUser(req.userId!, handle));
}));

router.post('/unfollow', authenticate, asyncHandler(async (req: AuthRequest, res) => {
  const { handle } = followSchema.parse(req.body);
  res.json(await socialService.unfollowUser(req.userId!, handle));
}));

router.get('/following', authenticate, asyncHandler(async (req: AuthRequest, res) => {
  res.json(await socialService.getFollowing(req.userId!));
}));

router.get('/followers', authenticate, asyncHandler(async (req: AuthRequest, res) => {
  res.json(await socialService.getFollowers(req.userId!));
}));

router.get('/:handle/follow-stats', optionalAuth, asyncHandler(async (req, res) => {
  res.json(await socialService.getFollowStats(req.params.handle));
}));

export default router;
