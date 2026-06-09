import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import { createApp } from '../app';
import { prisma } from '../lib/prisma';

const app = createApp();

let tokenA: string;

beforeEach(async () => {
  await prisma.reaction.deleteMany();
  await prisma.stub.deleteMany();
  await prisma.event.deleteMany();
  await prisma.follow.deleteMany();
  await prisma.user.deleteMany();

  const a = await request(app).post('/api/auth/register').send({
    email: 'a@test.com', handle: 'discA', displayName: 'Disc A', password: 'password123',
  });
  tokenA = a.body.accessToken;

  // Create some events with stubs
  for (let i = 0; i < 3; i++) {
    await request(app).post('/api/stubs').set('Authorization', `Bearer ${tokenA}`).send({
      type: 'concert', title: `Trending Event ${i}`, eventDate: new Date().toISOString(),
    });
  }
});

describe('GET /api/discover/trending', () => {
  it('should return trending events', async () => {
    const res = await request(app).get('/api/discover/trending');
    expect(res.status).toBe(200);
    expect(res.body.length).toBeGreaterThanOrEqual(1);
  });
});

describe('GET /api/discover/shared/:handle', () => {
  it('should find shared events between two users', async () => {
    // User A creates a stub with an external ID for exact matching
    const extId = `shared-test-${Date.now()}`;
    await request(app).post('/api/stubs').set('Authorization', `Bearer ${tokenA}`).send({
      type: 'concert',
      title: 'Shared Concert',
      eventDate: new Date().toISOString(),
      externalSource: 'test',
      externalId: extId,
    });

    // User B creates a stub with the same external ID — matches exactly
    const b = await request(app).post('/api/auth/register').send({
      email: 'b@test.com', handle: 'discB', displayName: 'Disc B', password: 'password123',
    });
    await request(app).post('/api/stubs').set('Authorization', `Bearer ${b.body.accessToken}`).send({
      type: 'concert',
      title: 'Shared Concert',
      eventDate: new Date().toISOString(),
      externalSource: 'test',
      externalId: extId,
    });

    const res = await request(app).get('/api/discover/shared/discB?with=discA');
    expect(res.status).toBe(200);
    expect(res.body.length).toBeGreaterThanOrEqual(1);
  });
});

describe('GET /api/discover/from/:eventId', () => {
  it('should show who else was at an event', async () => {
    const events = await prisma.event.findMany({ take: 1 });
    const res = await request(app).get(`/api/discover/from/${events[0].id}`);
    expect(res.status).toBe(200);
    expect(res.body.attendees.length).toBeGreaterThanOrEqual(1);
    expect(res.body.count).toBeGreaterThanOrEqual(1);
  });
});
