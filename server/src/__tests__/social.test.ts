import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import { createApp } from '../app';
import { prisma } from '../lib/prisma';

const app = createApp();

let tokenA: string, tokenB: string;

beforeEach(async () => {
  await prisma.reaction.deleteMany();
  await prisma.stub.deleteMany();
  await prisma.corroboration.deleteMany();
  await prisma.event.deleteMany();
  await prisma.follow.deleteMany();
  await prisma.user.deleteMany();

  const a = await request(app).post('/api/auth/register').send({
    email: 'a@test.com', handle: 'usera', displayName: 'User A', password: 'password123',
  });
  tokenA = a.body.accessToken;

  const b = await request(app).post('/api/auth/register').send({
    email: 'b@test.com', handle: 'userb', displayName: 'User B', password: 'password123',
  });
  tokenB = b.body.accessToken;
});

describe('POST /api/social/follow', () => {
  it('should follow another user', async () => {
    const res = await request(app)
      .post('/api/social/follow')
      .set('Authorization', `Bearer ${tokenA}`)
      .send({ handle: 'userb' });
    expect(res.status).toBe(201);
  });

  it('should reject following self', async () => {
    const res = await request(app)
      .post('/api/social/follow')
      .set('Authorization', `Bearer ${tokenA}`)
      .send({ handle: 'usera' });
    expect(res.status).toBe(400);
  });

  it('should reject duplicate follow', async () => {
    await request(app).post('/api/social/follow').set('Authorization', `Bearer ${tokenA}`).send({ handle: 'userb' });
    const res = await request(app).post('/api/social/follow').set('Authorization', `Bearer ${tokenA}`).send({ handle: 'userb' });
    expect(res.status).toBe(409);
  });
});

describe('POST /api/social/unfollow', () => {
  it('should unfollow a user', async () => {
    await request(app).post('/api/social/follow').set('Authorization', `Bearer ${tokenA}`).send({ handle: 'userb' });
    const res = await request(app)
      .post('/api/social/unfollow')
      .set('Authorization', `Bearer ${tokenA}`)
      .send({ handle: 'userb' });
    expect(res.status).toBe(200);
  });
});

describe('GET /api/social/following', () => {
  it('should list users I follow', async () => {
    await request(app).post('/api/social/follow').set('Authorization', `Bearer ${tokenA}`).send({ handle: 'userb' });
    const res = await request(app).get('/api/social/following').set('Authorization', `Bearer ${tokenA}`);
    expect(res.status).toBe(200);
    expect(res.body.length).toBe(1);
    expect(res.body[0].handle).toBe('userb');
  });
});

describe('GET /api/social/followers', () => {
  it('should list my followers', async () => {
    await request(app).post('/api/social/follow').set('Authorization', `Bearer ${tokenA}`).send({ handle: 'userb' });
    const res = await request(app).get('/api/social/followers').set('Authorization', `Bearer ${tokenB}`);
    expect(res.status).toBe(200);
    expect(res.body.length).toBe(1);
    expect(res.body[0].handle).toBe('usera');
  });
});

describe('GET /api/social/:handle/follow-stats', () => {
  it('should return follower and following counts', async () => {
    await request(app).post('/api/social/follow').set('Authorization', `Bearer ${tokenA}`).send({ handle: 'userb' });
    const res = await request(app).get('/api/social/userb/follow-stats');
    expect(res.status).toBe(200);
    expect(res.body.followers).toBe(1);
    expect(res.body.following).toBe(0);
  });
});
