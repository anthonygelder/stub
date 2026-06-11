import { Router } from 'express';
import path from 'path';
import { storage } from '../lib/storage';
import { asyncHandler } from '../middleware/asyncHandler';

const router = Router();

const CONTENT_TYPES: Record<string, string> = {
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
};

// Serves blobs from the local storage driver. (With the S3 driver, public URLs
// point straight at the bucket and this route is unused.)
router.get('/*', asyncHandler(async (req, res) => {
  const key = (req.params as Record<string, string>)[0];
  // Reject path traversal / absolute keys.
  if (!key || key.includes('..') || key.startsWith('/')) {
    return res.status(400).json({ error: 'Invalid path' });
  }

  const buffer = await storage.get(key);
  if (!buffer) return res.status(404).json({ error: 'Not found' });

  const type = CONTENT_TYPES[path.extname(key).toLowerCase()] || 'application/octet-stream';
  res.setHeader('Content-Type', type);
  res.setHeader('Cache-Control', 'public, max-age=86400');
  res.send(buffer);
}));

export default router;
