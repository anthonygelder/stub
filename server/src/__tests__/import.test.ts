import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import { createApp } from '../app';
import { prisma } from '../lib/prisma';

const app = createApp();
let token: string;

beforeEach(async () => {
  await prisma.collectionStub.deleteMany();
  await prisma.collection.deleteMany();
  await prisma.corroboration.deleteMany();
  await prisma.reaction.deleteMany();
  await prisma.stub.deleteMany();
  await prisma.event.deleteMany();
  await prisma.follow.deleteMany();
  await prisma.user.deleteMany();

  const res = await request(app).post('/api/auth/register').send({
    email: 'import@test.com', handle: 'importer', displayName: 'Importer', password: 'password123',
  });
  token = res.body.accessToken;
});

describe('POST /api/import/batch', () => {
  it('should import items as drafts', async () => {
    const res = await request(app).post('/api/import/batch').set('Authorization', `Bearer ${token}`).send({
      source: 'wallet_apple',
      items: [
        { type: 'concert', title: 'Imported Concert', venueName: 'Import Arena', eventDate: '2024-08-01T00:00:00Z' },
        { type: 'sports', title: 'Imported Game', venueName: 'Stadium', eventDate: '2024-08-02T00:00:00Z' },
      ],
    });
    expect(res.status).toBe(201);
    expect(res.body.stubs.length).toBe(2);
    expect(res.body.stats.created).toBe(2);
    // Verify drafts
    expect(res.body.stubs[0].isDraft).toBe(true);
    expect(res.body.stubs[0].importSource).toBe('wallet_apple');
  });
});

describe('GET /api/import/drafts', () => {
  it('should list draft stubs', async () => {
    await request(app).post('/api/import/batch').set('Authorization', `Bearer ${token}`).send({
      source: 'email', items: [{ type: 'concert', title: 'Draft Event', eventDate: '2024-06-01T00:00:00Z' }],
    });
    const res = await request(app).get('/api/import/drafts').set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.length).toBe(1);
    expect(res.body[0].isDraft).toBe(true);
  });
});

describe('POST /api/import/:stubId/publish', () => {
  it('should publish a draft stub', async () => {
    const imp = await request(app).post('/api/import/batch').set('Authorization', `Bearer ${token}`).send({
      source: 'email', items: [{ type: 'comedy', title: 'To Publish', eventDate: '2024-05-01T00:00:00Z' }],
    });
    const stubId = imp.body.stubs[0].id;
    const res = await request(app).post(`/api/import/${stubId}/publish`).set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.isDraft).toBe(false);
    expect(res.body.visibility).toBe('public');
  });
});

describe('DELETE /api/import/:stubId/reject', () => {
  it('should reject and delete a draft stub', async () => {
    const imp = await request(app).post('/api/import/batch').set('Authorization', `Bearer ${token}`).send({
      source: 'email', items: [{ type: 'concert', title: 'To Reject', eventDate: '2024-04-01T00:00:00Z' }],
    });
    const stubId = imp.body.stubs[0].id;
    const res = await request(app).delete(`/api/import/${stubId}/reject`).set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.rejected).toBe(stubId);

    // Verify it's gone
    const drafts = await request(app).get('/api/import/drafts').set('Authorization', `Bearer ${token}`);
    expect(drafts.body.length).toBe(0);
  });
});

describe('GET /api/import/stats', () => {
  it('should return import stats by source', async () => {
    await request(app).post('/api/import/batch').set('Authorization', `Bearer ${token}`).send({
      source: 'wallet_apple', items: [{ type: 'concert', title: 'S1', eventDate: '2024-01-01T00:00:00Z' }],
    });
    const res = await request(app).get('/api/import/stats').set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.bySource.wallet_apple.total).toBe(1);
  });
});
