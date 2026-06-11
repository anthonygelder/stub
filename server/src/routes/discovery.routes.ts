import { Router } from 'express';
import { optionalAuth } from '../middleware/auth';
import { asyncHandler } from '../middleware/asyncHandler';
import * as discoveryService from '../services/discovery.service';

const router = Router();

router.get('/trending', optionalAuth, asyncHandler(async (_req, res) => {
  res.json(await discoveryService.getTrendingEvents());
}));

router.get('/shared/:handle', optionalAuth, asyncHandler(async (req, res) => {
  const myHandle = req.query.with as string;
  if (!myHandle) return res.status(400).json({ error: '?with=handle is required' });
  res.json(await discoveryService.getSharedEvents(myHandle, req.params.handle));
}));

router.get('/from/:eventId', optionalAuth, asyncHandler(async (req, res) => {
  res.json(await discoveryService.getWhoElseWasThere(req.params.eventId));
}));

export default router;
