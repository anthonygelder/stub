import { Router } from 'express';
import { z } from 'zod';
import { authenticate, AuthRequest } from '../middleware/auth';
import { asyncHandler } from '../middleware/asyncHandler';
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

router.post('/batch', authenticate, asyncHandler(async (req: AuthRequest, res) => {
  const { source, items } = batchSchema.parse(req.body);
  res.status(201).json(await importService.importEvents(req.userId!, source, items));
}));

router.get('/drafts', authenticate, asyncHandler(async (req: AuthRequest, res) => {
  res.json(await importService.getDraftStubs(req.userId!));
}));

router.post('/:stubId/publish', authenticate, asyncHandler(async (req: AuthRequest, res) => {
  res.json(await importService.publishStub(req.userId!, req.params.stubId));
}));

router.delete('/:stubId/reject', authenticate, asyncHandler(async (req: AuthRequest, res) => {
  res.json(await importService.rejectStub(req.userId!, req.params.stubId));
}));

router.get('/stats', authenticate, asyncHandler(async (req: AuthRequest, res) => {
  res.json(await importService.getImportStats(req.userId!));
}));

export default router;
