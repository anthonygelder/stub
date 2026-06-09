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

describe('Social Loop — E2E', () => {
  it('follow → stub → feed → react → corroborate → discover', async () => {
    // 1. Create 3 users
    const users: { token: string; handle: string }[] = [];
    for (const name of ['alice', 'bob', 'carol']) {
      const res = await request(app).post('/api/auth/register').send({
        email: `${name}@e2e.social`,
        handle: name,
        displayName: name.toUpperCase(),
        password: 'password123',
      });
      expect(res.status).toBe(201);
      users.push({ token: res.body.accessToken, handle: name });
    }

    // 2. Alice follows Bob and Carol
    await request(app)
      .post('/api/social/follow')
      .set('Authorization', `Bearer ${users[0].token}`)
      .send({ handle: 'bob' });
    await request(app)
      .post('/api/social/follow')
      .set('Authorization', `Bearer ${users[0].token}`)
      .send({ handle: 'carol' });

    // 3. Bob logs a stub
    const bobStub = await request(app)
      .post('/api/stubs')
      .set('Authorization', `Bearer ${users[1].token}`)
      .send({
        type: 'concert',
        title: 'Social Test Concert',
        venueName: 'Social Arena',
        venueCity: 'Social City',
        eventDate: '2024-08-01T00:00:00Z',
      });
    expect(bobStub.status).toBe(201);

    // 4. Alice's feed should show Bob's stub
    const feed = await request(app)
      .get('/api/feed')
      .set('Authorization', `Bearer ${users[0].token}`);
    expect(feed.status).toBe(200);
    expect(feed.body.length).toBe(1);
    expect(feed.body[0].event.title).toBe('Social Test Concert');

    // 5. Alice reacts to Bob's stub
    const reactRes = await request(app)
      .post(`/api/stubs/${bobStub.body.stub.id}/reactions`)
      .set('Authorization', `Bearer ${users[0].token}`)
      .send({ type: 'was_there' });
    expect(reactRes.status).toBe(201);

    // 6. Carol also stubs the same event
    await request(app)
      .post('/api/stubs')
      .set('Authorization', `Bearer ${users[2].token}`)
      .send({
        type: 'concert',
        title: 'Social Test Concert',
        venueName: 'Social Arena',
        venueCity: 'Social City',
        eventDate: '2024-08-01T00:00:00Z',
      });

    // 7. At this point only 2 users stubbed (bob + carol) — tier should still be 3
    //    Alice only reacted, which doesn't count as a stub.
    //    Need Alice to also stub so we have 3 distinct stubs for tier 2 promotion.
    await request(app)
      .post('/api/stubs')
      .set('Authorization', `Bearer ${users[0].token}`)
      .send({
        type: 'concert',
        title: 'Social Test Concert',
        venueName: 'Social Arena',
        venueCity: 'Social City',
        eventDate: '2024-08-01T00:00:00Z',
      });

    // 8. Check corroboration — event should be tier 2
    const events = await prisma.event.findMany({
      where: { title: 'Social Test Concert' },
    });
    expect(events.length).toBe(1);
    expect(events[0].tier).toBe(2);

    // 9. Discovery — trending should include the event
    const trending = await request(app).get('/api/discover/trending');
    expect(trending.status).toBe(200);
    expect(trending.body.some((e: any) => e.title === 'Social Test Concert')).toBe(
      true,
    );

    // 10. Discovery — who else was there
    const whoElse = await request(app).get(
      `/api/discover/from/${events[0].id}`,
    );
    expect(whoElse.status).toBe(200);
    expect(whoElse.body.count).toBeGreaterThanOrEqual(3);
  });
});
