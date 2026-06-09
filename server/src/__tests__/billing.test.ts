import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import { createApp } from '../app';
import { prisma } from '../lib/prisma';

const app = createApp();

beforeEach(async () => {
  await prisma.corroboration.deleteMany();
  await prisma.reaction.deleteMany();
  await prisma.stub.deleteMany();
  await prisma.event.deleteMany();
  await prisma.follow.deleteMany();
  await prisma.user.deleteMany();
});

describe('POST /api/billing/create-checkout', () => {
  it('should create a checkout session for free user', async () => {
    const res = await request(app).post('/api/auth/register').send({
      email: 'bill@test.com', handle: 'billtest', displayName: 'Bill', password: 'password123',
    });
    const token = res.body.accessToken;

    const checkout = await request(app).post('/api/billing/create-checkout').set('Authorization', `Bearer ${token}`);
    expect(checkout.status).toBe(200);
    expect(checkout.body.url).toBeDefined();
  });

  it('should reject if already plus', async () => {
    const res = await request(app).post('/api/auth/register').send({
      email: 'plus@test.com', handle: 'plustest', displayName: 'Plus', password: 'password123',
    });
    const token = res.body.accessToken;
    await prisma.user.update({ where: { handle: 'plustest' }, data: { planTier: 'plus' } });

    const checkout = await request(app).post('/api/billing/create-checkout').set('Authorization', `Bearer ${token}`);
    expect(checkout.status).toBe(400);
  });
});

describe('POST /api/billing/webhook', () => {
  it('should process checkout.session.completed and upgrade plan', async () => {
    const res = await request(app).post('/api/auth/register').send({
      email: 'webhook@test.com', handle: 'webhook', displayName: 'Webhook', password: 'password123',
    });
    const userId = res.body.user.id;

    await request(app).post('/api/billing/webhook').send({
      type: 'checkout.session.completed',
      data: { object: { client_reference_id: userId } },
    });

    const user = await prisma.user.findUnique({ where: { id: userId } });
    expect(user?.planTier).toBe('plus');
  });
});
