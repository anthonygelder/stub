import { Router } from 'express';
import { optionalAuth } from '../middleware/auth';
import * as discoveryService from '../services/discovery.service';

const router = Router();

router.get('/trending', optionalAuth, async (req, res) => {
  try {
    const events = await discoveryService.getTrendingEvents();
    res.json(events);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/shared/:handle', optionalAuth, async (req, res) => {
  try {
    const myHandle = req.query.with as string;
    if (!myHandle) return res.status(400).json({ error: '?with=handle is required' });
    const shared = await discoveryService.getSharedEvents(myHandle, req.params.handle);
    res.json(shared);
  } catch (err: any) {
    if (err.message === 'USER_NOT_FOUND') return res.status(404).json({ error: 'User not found' });
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/from/:eventId', optionalAuth, async (req, res) => {
  try {
    const result = await discoveryService.getWhoElseWasThere(req.params.eventId);
    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
