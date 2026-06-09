import { Router } from 'express';
import { z } from 'zod';
import { authenticate, AuthRequest, optionalAuth } from '../middleware/auth';
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

router.post('/', authenticate, async (req: AuthRequest, res) => {
  try {
    const data = createEventSchema.parse(req.body);
    const result = await eventService.findOrCreateEvent(data);
    if (result.matched) {
      return res.json({ ...result.event, matched: true });
    }
    if (result.candidates) {
      return res.json({ candidates: result.candidates });
    }
    res.status(201).json(result.event);
  } catch (err: any) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation failed', details: err.errors });
    }
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/search', optionalAuth, async (req, res) => {
  try {
    const q = req.query.q as string;
    if (!q || q.length < 2) {
      return res.status(400).json({ error: 'Query must be at least 2 characters' });
    }
    const events = await eventService.searchEvents(q);
    res.json(events);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/:id', optionalAuth, async (req, res) => {
  try {
    const event = await eventService.getEventById(req.params.id);
    if (!event) return res.status(404).json({ error: 'Event not found' });
    res.json(event);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
