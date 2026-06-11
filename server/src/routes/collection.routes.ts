import { Router } from 'express';
import { z } from 'zod';
import { authenticate, AuthRequest, optionalAuth } from '../middleware/auth';
import { asyncHandler } from '../middleware/asyncHandler';
import * as collectionService from '../services/collection.service';

const router = Router();

router.post('/', authenticate, asyncHandler(async (req: AuthRequest, res) => {
  const { title, description } = z.object({ title: z.string().min(1), description: z.string().optional() }).parse(req.body);
  res.status(201).json(await collectionService.createCollection(req.userId!, title, description));
}));

router.get('/', authenticate, asyncHandler(async (req: AuthRequest, res) => {
  res.json(await collectionService.getMyCollections(req.userId!));
}));

router.put('/:id', authenticate, asyncHandler(async (req: AuthRequest, res) => {
  const { title, description } = req.body;
  res.json(await collectionService.updateCollection(req.userId!, req.params.id, { title, description }));
}));

router.delete('/:id', authenticate, asyncHandler(async (req: AuthRequest, res) => {
  await collectionService.deleteCollection(req.userId!, req.params.id);
  res.json({ deleted: true });
}));

router.post('/:id/stubs', authenticate, asyncHandler(async (req: AuthRequest, res) => {
  const { stubId } = z.object({ stubId: z.string() }).parse(req.body);
  await collectionService.addStubToCollection(req.userId!, req.params.id, stubId);
  res.status(201).json({ added: true });
}));

router.delete('/:id/stubs/:stubId', authenticate, asyncHandler(async (req: AuthRequest, res) => {
  await collectionService.removeStubFromCollection(req.userId!, req.params.id, req.params.stubId);
  res.json({ removed: true });
}));

router.get('/:id/stubs', optionalAuth, asyncHandler(async (req, res) => {
  res.json(await collectionService.getCollectionStubs(req.params.id));
}));

export default router;
