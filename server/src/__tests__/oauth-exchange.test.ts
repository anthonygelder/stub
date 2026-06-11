import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import { createApp } from '../app';
import { prisma } from '../lib/prisma';
import * as authService from '../services/auth.service';

const app = createApp();

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

describe('OAuth code exchange', () => {
  beforeEach(clean);

  it('exchanges a valid single-use code for tokens, then rejects reuse', async () => {
    const reg = await request(app).post('/api/auth/register').send({
      email: 'ex@stub.app', handle: 'extest', displayName: 'Ex', password: 'password123',
    });
    const userId = reg.body.user.id;
    const code = await authService.createOAuthCode(userId);

    const res = await request(app).post('/api/auth/exchange').send({ code });
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('accessToken');
    expect(res.body.user.id).toBe(userId);

    // Single-use: a second exchange with the same code fails.
    const res2 = await request(app).post('/api/auth/exchange').send({ code });
    expect(res2.status).toBe(400);
  });

  it('rejects an invalid code', async () => {
    const res = await request(app).post('/api/auth/exchange').send({ code: 'does-not-exist' });
    expect(res.status).toBe(400);
  });
});

describe('Logout revocation', () => {
  beforeEach(clean);

  it('revokes the refresh token so it can no longer be used', async () => {
    const reg = await request(app).post('/api/auth/register').send({
      email: 'lo@stub.app', handle: 'lotest', displayName: 'Lo', password: 'password123',
    });
    const { accessToken, refreshToken } = reg.body;

    // Refresh works before logout.
    const before = await request(app).post('/api/auth/refresh').send({ refreshToken });
    expect(before.status).toBe(200);

    const lo = await request(app)
      .post('/api/auth/logout')
      .set('Authorization', `Bearer ${accessToken}`);
    expect(lo.status).toBe(200);

    // The original refresh token is now revoked. (Use the token from the
    // pre-logout refresh, which was the live one when logout cleared it.)
    const after = await request(app)
      .post('/api/auth/refresh')
      .send({ refreshToken: before.body.refreshToken });
    expect(after.status).toBe(401);
  });
});
