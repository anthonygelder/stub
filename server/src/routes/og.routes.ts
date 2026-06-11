import { Router } from 'express';
import { prisma } from '../lib/prisma';
import { asyncHandler } from '../middleware/asyncHandler';
import { renderOGImage } from '../services/render.service';
import { storage } from '../lib/storage';

const router = Router();
const CACHE_MAX_AGE = 24 * 60 * 60; // seconds

router.get('/:stubId', asyncHandler(async (req, res) => {
  const stubId = req.params.stubId;
  const cacheKey = `images/og-${stubId}.png`;

  // Serve from cache if present
  const cached = await storage.get(cacheKey);
  if (cached) {
    res.setHeader('Content-Type', 'image/png');
    res.setHeader('Cache-Control', `public, max-age=${CACHE_MAX_AGE}`);
    return res.send(cached);
  }

  // Generate a new OG image
  const stub = await prisma.stub.findUnique({
    where: { id: stubId },
    include: { event: true, user: { select: { displayName: true, handle: true } } },
  });

  if (!stub) {
    res.setHeader('Content-Type', 'image/png');
    return res.status(404).send('Not found');
  }

  const buffer = await renderOGImage({
    eventTitle: stub.event.title,
    eventType: stub.event.type,
    venueName: stub.event.venueName || undefined,
    venueCity: stub.event.venueCity || undefined,
    eventDate: stub.event.eventDate.toISOString(),
    seat: (stub.personalData as any)?.seat,
    userName: stub.user.displayName,
    userHandle: stub.user.handle,
    stubNumber: stub.event.stubCount,
  });

  await storage.put(cacheKey, buffer, 'image/png');

  res.setHeader('Content-Type', 'image/png');
  res.setHeader('Cache-Control', `public, max-age=${CACHE_MAX_AGE}`);
  res.send(buffer);
}));

export default router;
