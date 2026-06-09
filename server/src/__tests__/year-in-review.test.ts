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

describe('GET /api/year-in-review/:year', () => {
  it('should return a PNG for a year with stubs', async () => {
    const res = await request(app).post('/api/auth/register').send({
      email: 'yir@test.com', handle: 'yirtest', displayName: 'YIR', password: 'password123',
    });
    const token = res.body.accessToken;

    await request(app).post('/api/stubs').set('Authorization', `Bearer ${token}`).send({
      type: 'concert', title: 'YIR Concert', eventDate: `${new Date().getFullYear()}-06-01T00:00:00Z`,
    });

    const yirRes = await request(app).get(`/api/year-in-review/${new Date().getFullYear()}`).set('Authorization', `Bearer ${token}`);
    expect(yirRes.status).toBe(200);
    expect(yirRes.headers['content-type']).toContain('image/png');
  });
});
