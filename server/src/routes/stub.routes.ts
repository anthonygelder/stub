import { Router } from 'express';
import { z } from 'zod';
import { authenticate, AuthRequest, optionalAuth } from '../middleware/auth';
import { asyncHandler } from '../middleware/asyncHandler';
import * as stubService from '../services/stub.service';
import { fanoutOnStubCreate } from '../services/feed.service';

const router = Router();

const createStubSchema = z.object({
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
  personalData: z.record(z.any()).optional(),
  visibility: z.enum(['public', 'followers', 'private']).optional(),
  designTemplateId: z.string().optional(),
});

router.post('/', authenticate, asyncHandler(async (req: AuthRequest, res) => {
  const data = createStubSchema.parse(req.body);
  const stub = await stubService.createStub(req.userId!, data);
  res.status(201).json({ stub: { id: stub.id, personalData: stub.personalData, visibility: stub.visibility, createdAt: stub.createdAt }, event: stub.event });
  fanoutOnStubCreate(req.userId!, stub.id).catch(err => console.error('Fan-out failed:', err));
}));

router.get('/', authenticate, asyncHandler(async (req: AuthRequest, res) => {
  const stubs = await stubService.getUserStubs(req.userId!);
  res.json(stubs.map(s => ({
    id: s.id,
    personalData: s.personalData,
    visibility: s.visibility,
    createdAt: s.createdAt,
    event: s.event,
  })));
}));

router.get('/:id', optionalAuth, asyncHandler(async (req: AuthRequest, res) => {
  const stub = await stubService.getStubById(req.params.id);
  if (stub.visibility === 'private' && stub.userId !== req.userId) {
    throw new Error('STUB_NOT_FOUND');
  }
  res.json(stub);
}));

export default router;
