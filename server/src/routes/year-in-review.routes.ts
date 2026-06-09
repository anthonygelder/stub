import { Router } from 'express';
import { authenticate, AuthRequest } from '../middleware/auth';
import { generateYearInReview } from '../services/year-in-review.service';
import { prisma } from '../lib/prisma';
import fs from 'fs';
import path from 'path';

const router = Router();
const IMAGE_DIR = path.join(__dirname, '..', '..', 'data', 'images');

router.get('/:year', authenticate, async (req: AuthRequest, res) => {
  try {
    const year = parseInt(req.params.year);
    const user = await prisma.user.findUnique({ where: { id: req.userId }, select: { planTier: true } });
    const isPremium = user?.planTier === 'plus';
    const buffer = await generateYearInReview(req.userId!, year, isPremium);
    res.setHeader('Content-Type', 'image/png');
    res.send(buffer);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to generate' });
  }
});

export default router;
