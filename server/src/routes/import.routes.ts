import { Router } from 'express';
import { z } from 'zod';
import { authenticate, AuthRequest } from '../middleware/auth';
import * as importService from '../services/import.service';

const router = Router();

const importItemSchema = z.object({
  type: z.enum(['concert', 'flight', 'sports', 'comedy', 'theater', 'custom']),
  title: z.string().min(1),
  venueName: z.string().optional(),
  venueCity: z.string().optional(),
  venueCountry: z.string().optional(),
  eventDate: z.string().datetime(),
  eventTime: z.string().optional(),
  personalData: z.record(z.any()).optional(),
  externalSource: z.string().optional(),
  externalId: z.string().optional(),
  metadata: z.record(z.any()).optional(),
});

const batchSchema = z.object({
  source: z.enum(['wallet_apple', 'wallet_google', 'email', 'manual']),
  items: z.array(importItemSchema).min(1).max(100),
});

router.post('/batch', authenticate, async (req: AuthRequest, res) => {
  try {
    const { source, items } = batchSchema.parse(req.body);
    const result = await importService.importEvents(req.userId!, source, items);
    res.status(201).json(result);
  } catch (err: any) {
    if (err instanceof z.ZodError) return res.status(400).json({ error: 'Validation failed', details: err.errors });
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/drafts', authenticate, async (req: AuthRequest, res) => {
  try {
    const drafts = await importService.getDraftStubs(req.userId!);
    res.json(drafts);
  } catch (err) { console.error(err); res.status(500).json({ error: 'Internal server error' }); }
});

router.post('/:stubId/publish', authenticate, async (req: AuthRequest, res) => {
  try {
    const stub = await importService.publishStub(req.userId!, req.params.stubId);
    res.json(stub);
  } catch (err: any) {
    if (err.message === 'DRAFT_NOT_FOUND') return res.status(404).json({ error: 'Draft not found' });
    console.error(err); res.status(500).json({ error: 'Internal server error' });
  }
});

router.delete('/:stubId/reject', authenticate, async (req: AuthRequest, res) => {
  try {
    const result = await importService.rejectStub(req.userId!, req.params.stubId);
    res.json(result);
  } catch (err: any) {
    if (err.message === 'DRAFT_NOT_FOUND') return res.status(404).json({ error: 'Draft not found' });
    console.error(err); res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/stats', authenticate, async (req: AuthRequest, res) => {
  try {
    const stats = await importService.getImportStats(req.userId!);
    res.json(stats);
  } catch (err) { console.error(err); res.status(500).json({ error: 'Internal server error' }); }
});

export default router;
