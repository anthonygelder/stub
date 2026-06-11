import { Router } from 'express';
import { authenticate, AuthRequest } from '../middleware/auth';
import { asyncHandler } from '../middleware/asyncHandler';
import * as feedService from '../services/feed.service';

const router = Router();

router.get('/', authenticate, asyncHandler(async (req: AuthRequest, res) => {
  const cursor = req.query.cursor ? parseInt(req.query.cursor as string) : undefined;
  const limit = req.query.limit ? parseInt(req.query.limit as string) : 20;
  res.json(await feedService.getFeedForUser(req.userId!, cursor, Math.min(limit, 50)));
}));

export default router;
