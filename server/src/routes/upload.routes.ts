import { Router } from 'express';
import { authenticate, AuthRequest } from '../middleware/auth';
import { asyncHandler } from '../middleware/asyncHandler';
import { uploadLimiter } from '../middleware/rateLimiter';
import { prisma } from '../lib/prisma';
import { storage } from '../lib/storage';

const router = Router();

const MAX_BYTES = 5 * 1024 * 1024; // 5 MB

// Carries its own HTTP status so the central error handler maps it to 400.
class ImageError extends Error {
  statusCode = 400;
  code = 'INVALID_IMAGE';
}

function detectImage(buffer: Buffer): { ext: string; contentType: string } | null {
  if (
    buffer.length >= 8 &&
    buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4e && buffer[3] === 0x47
  ) {
    return { ext: 'png', contentType: 'image/png' };
  }
  if (buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return { ext: 'jpg', contentType: 'image/jpeg' };
  }
  if (
    buffer.length >= 12 &&
    buffer.toString('ascii', 0, 4) === 'RIFF' &&
    buffer.toString('ascii', 8, 12) === 'WEBP'
  ) {
    return { ext: 'webp', contentType: 'image/webp' };
  }
  return null;
}

// Decodes a base64 (or data-URL) image, enforcing size and verifying it is a
// real PNG/JPEG/WEBP via magic bytes (not just a trusted extension).
function decodeImage(image: unknown): { buffer: Buffer; ext: string; contentType: string } {
  if (typeof image !== 'string' || image.length === 0) {
    throw new ImageError('Image data required');
  }
  const base64 = image.includes(',') ? image.slice(image.indexOf(',') + 1) : image;
  const buffer = Buffer.from(base64, 'base64');
  if (buffer.length === 0) throw new ImageError('Invalid image data');
  if (buffer.length > MAX_BYTES) throw new ImageError('Image too large (max 5MB)');
  const detected = detectImage(buffer);
  if (!detected) throw new ImageError('Unsupported image type (png, jpeg, or webp only)');
  return { buffer, ...detected };
}

router.post('/proof/:stubId', authenticate, uploadLimiter, asyncHandler(async (req: AuthRequest, res) => {
  const stubId = req.params.stubId;
  const stub = await prisma.stub.findFirst({ where: { id: stubId, userId: req.userId } });
  if (!stub) return res.status(404).json({ error: 'Stub not found' });

  const decoded = decodeImage(req.body?.image);
  const proofUrl = await storage.put(
    `uploads/proof-${stubId}-${Date.now()}.${decoded.ext}`,
    decoded.buffer,
    decoded.contentType,
  );

  await prisma.stub.update({
    where: { id: stubId },
    data: { proofUrl, verificationStatus: 'proof_uploaded' },
  });

  res.status(201).json({ proofUrl, verificationStatus: 'proof_uploaded' });
}));

router.post('/photo/:stubId', authenticate, uploadLimiter, asyncHandler(async (req: AuthRequest, res) => {
  const stubId = req.params.stubId;
  const stub = await prisma.stub.findFirst({ where: { id: stubId, userId: req.userId } });
  if (!stub) return res.status(404).json({ error: 'Stub not found' });

  const decoded = decodeImage(req.body?.image);
  const photoUrl = await storage.put(
    `uploads/photo-${stubId}-${Date.now()}.${decoded.ext}`,
    decoded.buffer,
    decoded.contentType,
  );

  await prisma.stub.update({ where: { id: stubId }, data: { photoUrl } });
  res.status(201).json({ photoUrl });
}));

router.get('/verify/:stubId', asyncHandler(async (req, res) => {
  const stub = await prisma.stub.findUnique({
    where: { id: req.params.stubId },
    select: { verificationStatus: true, proofUrl: true },
  });
  if (!stub) return res.status(404).json({ error: 'Stub not found' });
  res.json(stub);
}));

export default router;
