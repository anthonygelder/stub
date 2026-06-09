import { Router } from 'express';
import { optionalAuth } from '../middleware/auth';
import { getPublicStubsByHandle } from '../services/stub.service';
import { getPublicCollections } from '../services/collection.service';

const router = Router();

router.get('/:handle/stubs', optionalAuth, async (req, res) => {
  try {
    const stubs = await getPublicStubsByHandle(req.params.handle);
    res.json(stubs.map((s: any) => ({
      id: s.id,
      personalData: s.personalData,
      visibility: s.visibility,
      createdAt: s.createdAt,
      event: s.event,
    })));
  } catch (err: any) {
    if (err.message === 'USER_NOT_FOUND') return res.status(404).json({ error: 'User not found' });
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/:handle/collections', optionalAuth, async (req, res) => {
  try {
    const collections = await getPublicCollections(req.params.handle);
    res.json(collections);
  } catch (err: any) {
    if (err.message === 'USER_NOT_FOUND') return res.status(404).json({ error: 'User not found' });
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
