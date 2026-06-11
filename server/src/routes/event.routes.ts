import { Router } from 'express';
import { z } from 'zod';
import { authenticate, AuthRequest, optionalAuth } from '../middleware/auth';
import { asyncHandler } from '../middleware/asyncHandler';
import * as eventService from '../services/event.service';

const router = Router();

const createEventSchema = z.object({
  type: z.enum(['concert', 'flight', 'sports', 'comedy', 'theater', 'custom']),
  title: z.string().min(1),
  subtitle: z.string().optional(),
  venueName: z.string().optional(),
  venueCity: z.string().optional(),
  venueCountry: z.string().optional(),
  eventDate: z.string().datetime(),
  eventTime: z.string().optional(),
  externalSource: z.string().optional(),
  externalId: z.string().optional(),
  metadata: z.record(z.any()).optional(),
});

router.post('/', authenticate, asyncHandler(async (req: AuthRequest, res) => {
  const data = createEventSchema.parse(req.body);
  const result = await eventService.findOrCreateEvent(data);
  if (result.matched) {
    return res.json({ ...result.event, matched: true });
  }
  if (result.candidates) {
    return res.json({ candidates: result.candidates });
  }
  res.status(201).json(result.event);
}));

router.get('/search', optionalAuth, asyncHandler(async (req, res) => {
  const q = req.query.q as string;
  if (!q || q.length < 2) {
    return res.status(400).json({ error: 'Query must be at least 2 characters' });
  }
  res.json(await eventService.searchEvents(q));
}));

router.get('/:id', optionalAuth, asyncHandler(async (req, res) => {
  const event = await eventService.getEventById(req.params.id);
  if (!event) return res.status(404).json({ error: 'Event not found' });
  res.json(event);
}));

export default router;
