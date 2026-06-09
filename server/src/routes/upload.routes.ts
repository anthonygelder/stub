import { Router } from 'express';
import { authenticate, AuthRequest } from '../middleware/auth';
import { prisma } from '../lib/prisma';
import fs from 'fs';
import path from 'path';

const router = Router();
const UPLOAD_DIR = path.join(__dirname, '..', '..', 'data', 'uploads');

if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });

router.post('/proof/:stubId', authenticate, async (req: AuthRequest, res) => {
  try {
    const stubId = req.params.stubId;
    const stub = await prisma.stub.findFirst({ where: { id: stubId, userId: req.userId } });
    if (!stub) return res.status(404).json({ error: 'Stub not found' });

    // For simplicity, accept base64 image in JSON body
    const { image } = req.body;
    if (!image) return res.status(400).json({ error: 'Image data required' });

    const buffer = Buffer.from(image, 'base64');
    const filename = `proof-${stubId}-${Date.now()}.png`;
    const filePath = path.join(UPLOAD_DIR, filename);
    fs.writeFileSync(filePath, buffer);

    await prisma.stub.update({
      where: { id: stubId },
      data: { proofUrl: filePath, verificationStatus: 'proof_uploaded' },
    });

    res.status(201).json({ proofUrl: filePath, verificationStatus: 'proof_uploaded' });
  } catch (err) { console.error(err); res.status(500).json({ error: 'Internal server error' }); }
});

router.post('/photo/:stubId', authenticate, async (req: AuthRequest, res) => {
  try {
    const stubId = req.params.stubId;
    const stub = await prisma.stub.findFirst({ where: { id: stubId, userId: req.userId } });
    if (!stub) return res.status(404).json({ error: 'Stub not found' });

    const { image } = req.body;
    if (!image) return res.status(400).json({ error: 'Image data required' });

    const buffer = Buffer.from(image, 'base64');
    const filename = `photo-${stubId}-${Date.now()}.png`;
    const filePath = path.join(UPLOAD_DIR, filename);
    fs.writeFileSync(filePath, buffer);

    await prisma.stub.update({ where: { id: stubId }, data: { photoUrl: filePath } });
    res.status(201).json({ photoUrl: filePath });
  } catch (err) { console.error(err); res.status(500).json({ error: 'Internal server error' }); }
});

router.get('/verify/:stubId', async (req, res) => {
  try {
    const stub = await prisma.stub.findUnique({
      where: { id: req.params.stubId },
      select: { verificationStatus: true, proofUrl: true },
    });
    if (!stub) return res.status(404).json({ error: 'Stub not found' });
    res.json(stub);
  } catch (err) { console.error(err); res.status(500).json({ error: 'Internal server error' }); }
});

export default router;
