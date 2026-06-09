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

describe('Import Loop — E2E', () => {
  it('import → review → publish → verify', async () => {
    // 1. Register
    const res = await request(app).post('/api/auth/register').send({
      email: 'e2e-import@stub.app', handle: 'e2eimport', displayName: 'E2E Importer', password: 'password123',
    });
    const token = res.body.accessToken;

    // 2. Import batch
    const imp = await request(app).post('/api/import/batch').set('Authorization', `Bearer ${token}`).send({
      source: 'wallet_apple',
      items: [
        { type: 'concert', title: 'Import Test Concert', venueName: 'Test Arena', eventDate: '2024-09-01T00:00:00Z', personalData: { seat: 'VIP' } },
        { type: 'sports', title: 'Import Test Game', venueName: 'Stadium', eventDate: '2024-09-02T00:00:00Z' },
        { type: 'flight', title: 'LAX → JFK', eventDate: '2024-09-03T00:00:00Z', personalData: { flightNumber: 'AA100' } },
      ],
    });
    expect(imp.status).toBe(201);
    expect(imp.body.stubs.length).toBe(3);
    expect(imp.body.stats.created).toBe(3);

    // 3. Check drafts
    const drafts = await request(app).get('/api/import/drafts').set('Authorization', `Bearer ${token}`);
    expect(drafts.status).toBe(200);
    expect(drafts.body.length).toBe(3);

    // 4. Publish first draft
    const stub1 = imp.body.stubs[0].id;
    const pub = await request(app).post(`/api/import/${stub1}/publish`).set('Authorization', `Bearer ${token}`);
    expect(pub.status).toBe(200);
    expect(pub.body.isDraft).toBe(false);

    // 5. Publish second draft
    const stub2 = imp.body.stubs[1].id;
    await request(app).post(`/api/import/${stub2}/publish`).set('Authorization', `Bearer ${token}`);

    // 6. Reject third draft
    const stub3 = imp.body.stubs[2].id;
    await request(app).delete(`/api/import/${stub3}/reject`).set('Authorization', `Bearer ${token}`);

    // 7. Verify profile — should have 2 stubs (not the rejected one)
    const profile = await request(app).get('/api/users/e2eimport/stubs');
    expect(profile.status).toBe(200);
    expect(profile.body.length).toBe(2);

    // 8. Verify import stats
    const stats = await request(app).get('/api/import/stats').set('Authorization', `Bearer ${token}`);
    expect(stats.status).toBe(200);
    expect(stats.body.bySource.wallet_apple.published).toBe(2);
    expect(stats.body.bySource.wallet_apple.drafts).toBe(0); // all processed
  });
});
