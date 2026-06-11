import { Router } from 'express';
import { authenticate, AuthRequest } from '../middleware/auth';
import { asyncHandler } from '../middleware/asyncHandler';
import { generateYearInReview } from '../services/year-in-review.service';
import { prisma } from '../lib/prisma';

const router = Router();

router.get('/:year', authenticate, asyncHandler(async (req: AuthRequest, res) => {
  const year = parseInt(req.params.year);
  const user = await prisma.user.findUnique({ where: { id: req.userId }, select: { planTier: true } });
  const isPremium = user?.planTier === 'plus';
  const buffer = await generateYearInReview(req.userId!, year, isPremium);
  res.setHeader('Content-Type', 'image/png');
  res.send(buffer);
}));

export default router;
