import { Router } from 'express';
import { optionalAuth } from '../middleware/auth';
import { getMilestones } from '../services/milestone.service';

const router = Router();

router.get('/:handle', optionalAuth, async (req, res) => {
  try { res.json(await getMilestones(req.params.handle)); }
  catch (err: any) { if (err.message === 'USER_NOT_FOUND') return res.status(404).json({ error: 'Not found' }); console.error(err); res.status(500).json({ error: 'Internal server error' }); }
});

export default router;
