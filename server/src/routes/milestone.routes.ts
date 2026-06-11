import { Router } from 'express';
import { optionalAuth } from '../middleware/auth';
import { asyncHandler } from '../middleware/asyncHandler';
import { getMilestones } from '../services/milestone.service';

const router = Router();

router.get('/:handle', optionalAuth, asyncHandler(async (req, res) => {
  res.json(await getMilestones(req.params.handle));
}));

export default router;
