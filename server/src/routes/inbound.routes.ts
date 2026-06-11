import { Router } from 'express';
import multer from 'multer';
import { asyncHandler } from '../middleware/asyncHandler';
import { ingestInboundEmail } from '../services/inbound.service';

const router = Router();
// Memory storage; we only read text fields. `.none()` parses multipart/form-data
// (e.g. SendGrid Inbound Parse) and transparently skips non-multipart requests,
// so JSON callers still work via the global express.json() parser.
const upload = multer();

// Adapter seam: normalize provider field names into a common shape. SendGrid
// Inbound Parse already uses to/from/subject/text; others are mapped here.
function normalize(body: any) {
  return {
    to: body?.to || body?.recipient || body?.To || '',
    from: body?.from || body?.sender || body?.From || '',
    subject: body?.subject || body?.Subject || '',
    text: body?.text || body?.['body-plain'] || body?.plain || '',
  };
}

router.post('/', upload.none(), asyncHandler(async (req, res) => {
  // Read the secret at request time (supports rotation and keeps tests simple).
  const expected = process.env.INBOUND_WEBHOOK_SECRET;
  if (!expected) {
    return res.status(503).json({ error: 'Inbound email not configured' });
  }
  const provided = req.header('x-webhook-secret') || (req.query.token as string | undefined);
  if (provided !== expected) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const result = await ingestInboundEmail(normalize(req.body));
  res.json(result);
}));

export default router;
