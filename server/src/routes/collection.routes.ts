import { Router } from 'express';
import { z } from 'zod';
import { authenticate, AuthRequest, optionalAuth } from '../middleware/auth';
import * as collectionService from '../services/collection.service';

const router = Router();

router.post('/', authenticate, async (req: AuthRequest, res) => {
  try {
    const { title, description } = z.object({ title: z.string().min(1), description: z.string().optional() }).parse(req.body);
    const col = await collectionService.createCollection(req.userId!, title, description);
    res.status(201).json(col);
  } catch (err: any) {
    if (err instanceof z.ZodError) return res.status(400).json({ error: 'Validation failed' });
    console.error(err); res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/', authenticate, async (req: AuthRequest, res) => {
  try { res.json(await collectionService.getMyCollections(req.userId!)); }
  catch (err) { console.error(err); res.status(500).json({ error: 'Internal server error' }); }
});

router.put('/:id', authenticate, async (req: AuthRequest, res) => {
  try {
    const { title, description } = req.body;
    const col = await collectionService.updateCollection(req.userId!, req.params.id, { title, description });
    res.json(col);
  } catch (err: any) {
    if (err.message === 'NOT_FOUND') return res.status(404).json({ error: 'Not found' });
    console.error(err); res.status(500).json({ error: 'Internal server error' });
  }
});

router.delete('/:id', authenticate, async (req: AuthRequest, res) => {
  try {
    await collectionService.deleteCollection(req.userId!, req.params.id);
    res.json({ deleted: true });
  } catch (err: any) {
    if (err.message === 'NOT_FOUND') return res.status(404).json({ error: 'Not found' });
    console.error(err); res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/:id/stubs', authenticate, async (req: AuthRequest, res) => {
  try {
    const { stubId } = z.object({ stubId: z.string() }).parse(req.body);
    await collectionService.addStubToCollection(req.userId!, req.params.id, stubId);
    res.status(201).json({ added: true });
  } catch (err: any) {
    if (err instanceof z.ZodError) return res.status(400).json({ error: 'Validation failed' });
    if (err.message === 'NOT_FOUND') return res.status(404).json({ error: 'Not found' });
    console.error(err); res.status(500).json({ error: 'Internal server error' });
  }
});

router.delete('/:id/stubs/:stubId', authenticate, async (req: AuthRequest, res) => {
  try {
    await collectionService.removeStubFromCollection(req.userId!, req.params.id, req.params.stubId);
    res.json({ removed: true });
  } catch (err: any) {
    if (err.message === 'NOT_FOUND') return res.status(404).json({ error: 'Not found' });
    console.error(err); res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/:id/stubs', optionalAuth, async (req, res) => {
  try {
    const stubs = await collectionService.getCollectionStubs(req.params.id);
    res.json(stubs);
  } catch (err) { console.error(err); res.status(500).json({ error: 'Internal server error' }); }
});

export default router;
