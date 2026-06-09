import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import { createApp } from '../app';
import { prisma } from '../lib/prisma';

const app = createApp();

describe('Core Loop — E2E', () => {
  beforeEach(async () => {
    await prisma.stub.deleteMany();
    await prisma.event.deleteMany();
    await prisma.user.deleteMany();
  });

  it('register → create stub → view profile wall', async () => {
    // 1. Register
    const registerRes = await request(app).post('/api/auth/register').send({
      email: 'e2e@stub.app',
      handle: 'e2etest',
      displayName: 'E2E User',
      password: 'password123',
    });
    expect(registerRes.status).toBe(201);
    const token = registerRes.body.accessToken;
    expect(token).toBeDefined();

    // 2. Create first stub
    const stub1 = await request(app)
      .post('/api/stubs')
      .set('Authorization', `Bearer ${token}`)
      .send({
        type: 'concert',
        title: 'E2E Concert',
        venueName: 'Test Arena',
        venueCity: 'Test City',
        eventDate: '2024-06-15T00:00:00Z',
        personalData: { seat: 'GA Floor' },
      });
    expect(stub1.status).toBe(201);
    expect(stub1.body.stub).toBeDefined();
    expect(stub1.body.event.title).toBe('E2E Concert');

    // 3. Create second stub (same event — should dedup)
    const stub2 = await request(app)
      .post('/api/stubs')
      .set('Authorization', `Bearer ${token}`)
      .send({
        type: 'concert',
        title: 'E2E Concert',
        venueName: 'Test Arena',
        venueCity: 'Test City',
        eventDate: '2024-06-15T00:00:00Z',
        personalData: { companions: 'with friends' },
      });
    expect(stub2.status).toBe(201);

    // 4. View own stubs — should have 2
    const ownStubs = await request(app)
      .get('/api/stubs')
      .set('Authorization', `Bearer ${token}`);
    expect(ownStubs.status).toBe(200);
    expect(ownStubs.body.length).toBe(2);

    // 5. View public profile wall
    const profileRes = await request(app).get('/api/users/e2etest/stubs');
    expect(profileRes.status).toBe(200);
    expect(profileRes.body.length).toBe(2);

    // 6. Verify event was deduplicated (both stubs point to same event)
    expect(stub1.body.event.id).toBe(stub2.body.event.id);

    // 7. Verify me endpoint works
    const meRes = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${token}`);
    expect(meRes.status).toBe(200);
    expect(meRes.body.handle).toBe('e2etest');
  });
});
