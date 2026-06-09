import { Router } from 'express';
import { authenticate, AuthRequest } from '../middleware/auth';
import * as billingService from '../services/billing.service';

const router = Router();

router.post('/create-checkout', authenticate, async (req: AuthRequest, res) => {
  try {
    const result = await billingService.createCheckoutSession(req.userId!);
    res.json(result);
  } catch (err: any) {
    if (err.message === 'Already on Stub+') return res.status(400).json({ error: err.message });
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/portal', authenticate, async (req: AuthRequest, res) => {
  try {
    const result = await billingService.createPortalSession(req.userId!);
    res.json(result);
  } catch (err) { console.error(err); res.status(500).json({ error: 'Internal server error' }); }
});

router.post('/webhook', async (req, res) => {
  try {
    const signature = req.headers['stripe-signature'] as string;
    const result = await billingService.handleWebhook(req.body, signature);
    res.json(result);
  } catch (err) { console.error(err); res.status(400).json({ error: 'Webhook error' }); }
});

export default router;
