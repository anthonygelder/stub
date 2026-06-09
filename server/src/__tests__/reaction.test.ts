import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import { createApp } from '../app';
import { prisma } from '../lib/prisma';

const app = createApp();

let token: string;
let stubId: string;

beforeEach(async () => {
  await prisma.collectionStub.deleteMany();
  await prisma.collection.deleteMany();
  await prisma.reaction.deleteMany();
  await prisma.stub.deleteMany();
  await prisma.corroboration.deleteMany();
  await prisma.event.deleteMany();
  await prisma.follow.deleteMany();
  await prisma.user.deleteMany();

  const res = await request(app).post('/api/auth/register').send({
    email: 'react@test.com', handle: 'reactuser', displayName: 'React User', password: 'password123',
  });
  token = res.body.accessToken;

  const stubRes = await request(app).post('/api/stubs').set('Authorization', `Bearer ${token}`).send({
    type: 'concert', title: 'Test Concert', eventDate: '2024-01-01T00:00:00Z',
  });
  stubId = stubRes.body.stub.id;
});

describe('POST /api/stubs/:id/reactions', () => {
  it('should add a reaction', async () => {
    const res = await request(app)
      .post(`/api/stubs/${stubId}/reactions`)
      .set('Authorization', `Bearer ${token}`)
      .send({ type: 'was_there' });
    expect(res.status).toBe(201);
    expect(res.body.type).toBe('was_there');
  });

  it('should toggle off on re-reaction', async () => {
    await request(app).post(`/api/stubs/${stubId}/reactions`).set('Authorization', `Bearer ${token}`).send({ type: 'was_there' });
    const res = await request(app).post(`/api/stubs/${stubId}/reactions`).set('Authorization', `Bearer ${token}`).send({ type: 'was_there' });
    expect(res.status).toBe(200);
    expect(res.body.removed).toBe(true);
  });
});

describe('GET /api/stubs/:id/reactions', () => {
  it('should get reaction counts grouped by type', async () => {
    await request(app).post(`/api/stubs/${stubId}/reactions`).set('Authorization', `Bearer ${token}`).send({ type: 'was_there' });
    await request(app).post(`/api/stubs/${stubId}/reactions`).set('Authorization', `Bearer ${token}`).send({ type: 'jealous' });

    const res = await request(app).get(`/api/stubs/${stubId}/reactions`);
    expect(res.status).toBe(200);
    expect(res.body.counts.was_there).toBe(1);
    expect(res.body.counts.jealous).toBe(1);
  });
});
