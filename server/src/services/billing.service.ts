import { prisma } from '../lib/prisma';
import { config } from '../config';

// Mock Stripe client — swap with real Stripe when keys are available
const stripe = {
  checkout: {
    sessions: {
      create: async (params: any) => {
        // In production, this calls Stripe API
        return { url: `https://checkout.stripe.com/mock-session`, id: `cs_mock_${Date.now()}` };
      },
    },
  },
  billingPortal: {
    sessions: {
      create: async (params: any) => {
        return { url: `https://billing.stripe.com/mock-portal` };
      },
    },
  },
  webhooks: {
    constructEvent: (body: any, sig: string, secret: string) => {
      return body; // In production, verifies signature
    },
  },
};

const PRICE_ID = process.env.STRIPE_PRICE_ID || 'price_mock_monthly';

export async function createCheckoutSession(userId: string) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new Error('User not found');
  if (user.planTier === 'plus') throw new Error('Already on Stub+');

  const session = await stripe.checkout.sessions.create({
    mode: 'subscription',
    line_items: [{ price: PRICE_ID, quantity: 1 }],
    success_url: `${config.clientUrl}/settings?billing=success`,
    cancel_url: `${config.clientUrl}/settings?billing=cancelled`,
    client_reference_id: userId,
  });

  return { url: session.url };
}

export async function createPortalSession(userId: string) {
  const session = await stripe.billingPortal.sessions.create({
    customer: userId,
    return_url: `${config.clientUrl}/settings`,
  });
  return { url: session.url };
}

export async function handleWebhook(body: any, signature: string) {
  const event = stripe.webhooks.constructEvent(body, signature, process.env.STRIPE_WEBHOOK_SECRET || 'mock');

  switch (event.type) {
    case 'checkout.session.completed': {
      const userId = event.data.object.client_reference_id;
      if (userId) {
        await prisma.user.update({ where: { id: userId }, data: { planTier: 'plus' } });
      }
      break;
    }
    case 'customer.subscription.deleted': {
      // Find user by customer ID and downgrade
      const customerId = event.data.object.customer;
      const user = await prisma.user.findFirst({ where: { id: customerId } });
      if (user && user.planTier === 'plus') {
        await prisma.user.update({ where: { id: user.id }, data: { planTier: 'free' } });
      }
      break;
    }
  }

  return { received: true };
}
