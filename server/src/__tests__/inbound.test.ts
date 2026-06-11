import { describe, it, expect, beforeAll, beforeEach } from 'vitest';
import request from 'supertest';
import { createApp } from '../app';
import { prisma } from '../lib/prisma';

const app = createApp();
const SECRET = 'test-inbound-secret';

beforeAll(() => {
  process.env.INBOUND_WEBHOOK_SECRET = SECRET;
});

async function clean() {
  await prisma.collectionStub.deleteMany();
  await prisma.collection.deleteMany();
  await prisma.reaction.deleteMany();
  await prisma.stub.deleteMany();
  await prisma.corroboration.deleteMany();
  await prisma.event.deleteMany();
  await prisma.follow.deleteMany();
  await prisma.user.deleteMany();
}

async function registerUser() {
  const reg = await request(app).post('/api/auth/register').send({
    email: 'inbound@stub.app', handle: 'inbounduser', displayName: 'Inbound User', password: 'password123',
  });
  const user = await prisma.user.findUnique({
    where: { id: reg.body.user.id },
    select: { emailForwardAddress: true },
  });
  return { token: reg.body.accessToken, forwardAddress: user!.emailForwardAddress };
}

const ticketmasterEmail = {
  from: 'tickets@ticketmaster.com',
  subject: 'Your tickets are confirmed',
  text: 'Event: Test Concert\nVenue: The Forum\nDate: August 5, 2024\nSeat: A12',
};

describe('POST /api/inbound', () => {
  beforeEach(clean);

  it('rejects requests without the secret', async () => {
    const res = await request(app).post('/api/inbound').send({ to: 'x@stub.app', ...ticketmasterEmail });
    expect(res.status).toBe(401);
  });

  it('rejects requests with a wrong secret', async () => {
    const res = await request(app)
      .post('/api/inbound')
      .set('x-webhook-secret', 'nope')
      .send({ to: 'x@stub.app', ...ticketmasterEmail });
    expect(res.status).toBe(401);
  });

  it('creates a draft stub from a forwarded ticket email', async () => {
    const { token, forwardAddress } = await registerUser();

    const res = await request(app)
      .post('/api/inbound')
      .set('x-webhook-secret', SECRET)
      .send({ to: `Inbound User <${forwardAddress}>`, ...ticketmasterEmail });

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ matched: true, parsed: true, drafts: 1 });

    // The stub shows up in the user's draft review queue.
    const drafts = await request(app).get('/api/import/drafts').set('Authorization', `Bearer ${token}`);
    expect(drafts.status).toBe(200);
    expect(drafts.body.length).toBe(1);
    expect(drafts.body[0].event.title).toBe('Test Concert');
  });

  it('ignores email to an unknown recipient', async () => {
    const res = await request(app)
      .post('/api/inbound')
      .set('x-webhook-secret', SECRET)
      .send({ to: 'nobody.0000@stub.app', ...ticketmasterEmail });

    expect(res.status).toBe(200);
    expect(res.body.matched).toBe(false);
  });
});
