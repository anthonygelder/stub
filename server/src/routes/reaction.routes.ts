import { Router } from 'express';
import { z } from 'zod';
import { authenticate, AuthRequest, optionalAuth } from '../middleware/auth';
import * as reactionService from '../services/reaction.service';

const router = Router({ mergeParams: true });

const reactSchema = z.object({ type: z.enum(['was_there', 'jealous', 'want_to_go']) });

router.post('/:stubId/reactions', authenticate, async (req: AuthRequest, res) => {
  try {
    const { type } = reactSchema.parse(req.body);
    const result = await reactionService.toggleReaction(req.userId!, req.params.stubId, type);
    res.status(result.removed ? 200 : 201).json(result);
  } catch (err: any) {
    if (err instanceof z.ZodError) return res.status(400).json({ error: 'Invalid reaction type' });
    if (err.message === 'STUB_NOT_FOUND') return res.status(404).json({ error: 'Stub not found' });
    if (err.message === 'INVALID_REACTION_TYPE') return res.status(400).json({ error: 'Invalid reaction type' });
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/:stubId/reactions', optionalAuth, async (req, res) => {
  try {
    const reactions = await reactionService.getReactions(req.params.stubId);
    res.json(reactions);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/:stubId/reactions/me', authenticate, async (req: AuthRequest, res) => {
  try {
    const myType = await reactionService.getMyReaction(req.userId!, req.params.stubId);
    res.json({ type: myType });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
