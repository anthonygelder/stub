import { Router } from 'express';
import { z } from 'zod';
import { authenticate, AuthRequest, optionalAuth } from '../middleware/auth';
import { asyncHandler } from '../middleware/asyncHandler';
import * as reactionService from '../services/reaction.service';

const router = Router({ mergeParams: true });

const reactSchema = z.object({ type: z.enum(['was_there', 'jealous', 'want_to_go']) });

router.post('/:stubId/reactions', authenticate, asyncHandler(async (req: AuthRequest, res) => {
  const { type } = reactSchema.parse(req.body);
  const result = await reactionService.toggleReaction(req.userId!, req.params.stubId, type);
  res.status(result.removed ? 200 : 201).json(result);
}));

router.get('/:stubId/reactions', optionalAuth, asyncHandler(async (req, res) => {
  res.json(await reactionService.getReactions(req.params.stubId));
}));

router.get('/:stubId/reactions/me', authenticate, asyncHandler(async (req: AuthRequest, res) => {
  res.json({ type: await reactionService.getMyReaction(req.userId!, req.params.stubId) });
}));

export default router;
