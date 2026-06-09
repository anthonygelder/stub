import { Router } from 'express';
import { z } from 'zod';
import { authenticate, AuthRequest, optionalAuth } from '../middleware/auth';
import * as stubService from '../services/stub.service';

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

router.post('/', authenticate, async (req: AuthRequest, res) => {
  try {
    const data = createStubSchema.parse(req.body);
    const stub = await stubService.createStub(req.userId!, data);
    res.status(201).json({ stub: { id: stub.id, personalData: stub.personalData, visibility: stub.visibility, createdAt: stub.createdAt }, event: stub.event });
  } catch (err: any) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation failed', details: err.errors });
    }
    if (err.message === 'EVENT_CANDIDATES') {
      return res.status(409).json({ error: 'Multiple event candidates found. Please confirm the event.', code: 'EVENT_CANDIDATES' });
    }
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/', authenticate, async (req: AuthRequest, res) => {
  try {
    const stubs = await stubService.getUserStubs(req.userId!);
    res.json(stubs.map(s => ({
      id: s.id,
      personalData: s.personalData,
      visibility: s.visibility,
      createdAt: s.createdAt,
      event: s.event,
    })));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/:id', optionalAuth, async (req, res) => {
  try {
    const stub = await stubService.getStubById(req.params.id);
    if (stub.visibility === 'private' && stub.userId !== (req as any).userId) {
      return res.status(404).json({ error: 'Stub not found' });
    }
    res.json(stub);
  } catch (err: any) {
    if (err.message === 'STUB_NOT_FOUND') {
      return res.status(404).json({ error: 'Stub not found' });
    }
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
