import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import { createApp } from '../app';
import { prisma } from '../lib/prisma';
import { redis } from '../lib/redis';

const app = createApp();

beforeEach(async () => {
  await prisma.corroboration.deleteMany();
  await prisma.reaction.deleteMany();
  await prisma.stub.deleteMany();
  await prisma.event.deleteMany();
  await prisma.follow.deleteMany();
  await prisma.user.deleteMany();
  await redis.flushall();
});

describe('Corroboration detection', () => {
  it('should promote event to tier 2 when 3+ users stub it', async () => {
    // Create 3 users and stub the same event
    const users = [];
    for (let i = 0; i < 3; i++) {
      const res = await request(app).post('/api/auth/register').send({
        email: `corroborate${i}@test.com`, handle: `corroborate${i}`, displayName: `User ${i}`, password: 'password123',
      });
      users.push(res.body.accessToken);
    }

    for (const token of users) {
      await request(app).post('/api/stubs').set('Authorization', `Bearer ${token}`).send({
        type: 'concert', title: 'Corroborated Event', venueName: 'Shared Venue', venueCity: 'Shared City',
        eventDate: '2024-06-01T00:00:00Z',
      });
    }

    // Check the event was promoted
    const events = await prisma.event.findMany({ where: { title: 'Corroborated Event' } });
    expect(events.length).toBe(1);
    expect(events[0].tier).toBe(2);

    // Check corroboration record
    const corr = await prisma.corroboration.findUnique({ where: { eventId: events[0].id } });
    expect(corr).toBeDefined();
    expect(corr!.userIds.length).toBe(3);
  });

  it('should not promote when only 2 users stub', async () => {
    const users = [];
    for (let i = 0; i < 2; i++) {
      const res = await request(app).post('/api/auth/register').send({
        email: `low${i}@test.com`, handle: `low${i}`, displayName: `Low ${i}`, password: 'password123',
      });
      users.push(res.body.accessToken);
    }

    for (const token of users) {
      await request(app).post('/api/stubs').set('Authorization', `Bearer ${token}`).send({
        type: 'concert', title: 'Low Count Event', eventDate: '2024-07-01T00:00:00Z',
      });
    }

    const events = await prisma.event.findMany({ where: { title: 'Low Count Event' } });
    expect(events[0].tier).toBe(3);
  });
});
