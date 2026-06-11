import { Router } from 'express';
import { optionalAuth } from '../middleware/auth';
import { asyncHandler } from '../middleware/asyncHandler';
import { getPublicStubsByHandle } from '../services/stub.service';
import { getPublicCollections } from '../services/collection.service';

const router = Router();

router.get('/:handle/stubs', optionalAuth, asyncHandler(async (req, res) => {
  const stubs = await getPublicStubsByHandle(req.params.handle);
  res.json(stubs.map((s: any) => ({
    id: s.id,
    personalData: s.personalData,
    visibility: s.visibility,
    createdAt: s.createdAt,
    event: s.event,
  })));
}));

router.get('/:handle/collections', optionalAuth, asyncHandler(async (req, res) => {
  res.json(await getPublicCollections(req.params.handle));
}));

export default router;
