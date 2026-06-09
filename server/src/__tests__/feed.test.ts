import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import { createApp } from '../app';
import { prisma } from '../lib/prisma';
import { redis } from '../lib/redis';

const app = createApp();

let tokenA: string, tokenB: string;

beforeEach(async () => {
  await prisma.collectionStub.deleteMany();
  await prisma.collection.deleteMany();
  await prisma.reaction.deleteMany();
  await prisma.stub.deleteMany();
  await prisma.corroboration.deleteMany();
  await prisma.event.deleteMany();
  await prisma.follow.deleteMany();
  await prisma.user.deleteMany();
  await redis.flushall();

  const a = await request(app).post('/api/auth/register').send({
    email: 'a@test.com', handle: 'feeduserA', displayName: 'Feed A', password: 'password123',
  });
  tokenA = a.body.accessToken;

  const b = await request(app).post('/api/auth/register').send({
    email: 'b@test.com', handle: 'feeduserB', displayName: 'Feed B', password: 'password123',
  });
  tokenB = b.body.accessToken;

  // A follows B
  await request(app).post('/api/social/follow').set('Authorization', `Bearer ${tokenA}`).send({ handle: 'feeduserB' });
});

describe('GET /api/feed', () => {
  it('should return empty feed when no stubs from followed users', async () => {
    const res = await request(app).get('/api/feed').set('Authorization', `Bearer ${tokenA}`);
    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });

  it('should show stubs from followed users', async () => {
    await request(app).post('/api/stubs').set('Authorization', `Bearer ${tokenB}`).send({
      type: 'concert', title: 'Feed Concert', eventDate: '2024-01-01T00:00:00Z',
    });

    const res = await request(app).get('/api/feed').set('Authorization', `Bearer ${tokenA}`);
    expect(res.status).toBe(200);
    expect(res.body.length).toBe(1);
    expect(res.body[0].event.title).toBe('Feed Concert');
  });

  it('should not show stubs from non-followed users', async () => {
    // Create user C who A does NOT follow
    const c = await request(app).post('/api/auth/register').send({
      email: 'c@test.com', handle: 'feeduserC', displayName: 'Feed C', password: 'password123',
    });
    await request(app).post('/api/stubs').set('Authorization', `Bearer ${c.body.accessToken}`).send({
      type: 'sports', title: 'Not Followed', eventDate: '2024-02-01T00:00:00Z',
    });

    const res = await request(app).get('/api/feed').set('Authorization', `Bearer ${tokenA}`);
    expect(res.body.length).toBe(0);
  });
});
