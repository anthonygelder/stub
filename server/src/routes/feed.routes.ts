import { Router } from 'express';
import { authenticate, AuthRequest } from '../middleware/auth';
import * as feedService from '../services/feed.service';

const router = Router();

router.get('/', authenticate, async (req: AuthRequest, res) => {
  try {
    const cursor = req.query.cursor ? parseInt(req.query.cursor as string) : undefined;
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 20;
    const feed = await feedService.getFeedForUser(req.userId!, cursor, Math.min(limit, 50));
    res.json(feed);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
