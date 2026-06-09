import { Router } from 'express';
import fs from 'fs';
import path from 'path';
import { prisma } from '../lib/prisma';
import { renderOGImage } from '../services/render.service';

const router = Router();
const IMAGE_DIR = path.join(__dirname, '..', '..', 'data', 'images');
const CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours

router.get('/:stubId', async (req, res) => {
  try {
    const stubId = req.params.stubId;
    const cachePath = path.join(IMAGE_DIR, `og-${stubId}.png`);

    // Check disk cache
    if (fs.existsSync(cachePath)) {
      const stat = fs.statSync(cachePath);
      if (Date.now() - stat.mtimeMs < CACHE_TTL) {
        res.setHeader('Content-Type', 'image/png');
        res.setHeader('Cache-Control', `public, max-age=${CACHE_TTL / 1000}`);
        return fs.createReadStream(cachePath).pipe(res);
      }
    }

    // Generate new OG image
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

    // Save to cache
    fs.writeFileSync(cachePath, buffer);

    res.setHeader('Content-Type', 'image/png');
    res.setHeader('Cache-Control', `public, max-age=${CACHE_TTL / 1000}`);
    res.send(buffer);
  } catch (err) {
    console.error('OG image error:', err);
    res.status(500).json({ error: 'Failed to generate image' });
  }
});

export default router;
