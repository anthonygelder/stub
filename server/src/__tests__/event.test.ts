import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import { createApp } from '../app';
import { prisma } from '../lib/prisma';

const app = createApp();

let token: string;

beforeEach(async () => {
  await prisma.collectionStub.deleteMany();
  await prisma.collection.deleteMany();
  await prisma.reaction.deleteMany();
  await prisma.stub.deleteMany();
  await prisma.event.deleteMany();
  await prisma.follow.deleteMany();
  await prisma.user.deleteMany();

  const res = await request(app).post('/api/auth/register').send({
    email: 'event-test@example.com', handle: 'eventtest', displayName: 'Event Tester', password: 'password123',
  });
  token = res.body.accessToken;
});

describe('POST /api/events', () => {
  it('should create a new event', async () => {
    const res = await request(app)
      .post('/api/events')
      .set('Authorization', `Bearer ${token}`)
      .send({
        type: 'concert',
        title: 'Taylor Swift Eras Tour',
        venueName: 'SoFi Stadium',
        venueCity: 'Los Angeles',
        venueCountry: 'US',
        eventDate: '2024-08-05T00:00:00Z',
      });

    expect(res.status).toBe(201);
    expect(res.body.title).toBe('Taylor Swift Eras Tour');
    expect(res.body.tier).toBe(3);
  });

  it('should return existing event when exact match found', async () => {
    const first = await request(app)
      .post('/api/events')
      .set('Authorization', `Bearer ${token}`)
      .send({
        type: 'concert', title: 'Coldplay World Tour',
        venueName: 'Wembley Stadium', venueCity: 'London', venueCountry: 'UK',
        eventDate: '2024-07-12T00:00:00Z',
      });
    expect(first.status).toBe(201);
    const firstId = first.body.id;

    const second = await request(app)
      .post('/api/events')
      .set('Authorization', `Bearer ${token}`)
      .send({
        type: 'concert', title: 'Coldplay World Tour',
        venueName: 'Wembley Stadium', venueCity: 'London', venueCountry: 'UK',
        eventDate: '2024-07-12T00:00:00Z',
      });

    expect(second.status).toBe(200);
    expect(second.body.id).toBe(firstId);
    expect(second.body.matched).toBe(true);
  });

  it('should return candidates when fuzzy match found (50-84 score)', async () => {
    await request(app)
      .post('/api/events')
      .set('Authorization', `Bearer ${token}`)
      .send({
        type: 'concert', title: 'Metallica M72 Tour',
        venueName: 'AT&T Stadium', venueCity: 'Dallas', venueCountry: 'US',
        eventDate: '2024-08-15T00:00:00Z',
      });

    const res = await request(app)
      .post('/api/events')
      .set('Authorization', `Bearer ${token}`)
      .send({
        type: 'concert', title: 'Metallica M72 Tour',
        venueName: 'AT&T Stadium', venueCity: 'Dallas', venueCountry: 'US',
        eventDate: '2024-08-16T00:00:00Z',
      });

    expect(res.status).toBe(200);
    expect(res.body.candidates).toBeDefined();
    expect(res.body.candidates.length).toBeGreaterThanOrEqual(1);
  });
});

describe('GET /api/events/search', () => {
  it('should search events by title', async () => {
    await request(app)
      .post('/api/events')
      .set('Authorization', `Bearer ${token}`)
      .send({
        type: 'concert', title: 'Beyonce Renaissance Tour',
        venueName: 'MetLife Stadium', venueCity: 'New York', venueCountry: 'US',
        eventDate: '2024-06-01T00:00:00Z',
      });

    const res = await request(app)
      .get('/api/events/search?q=Beyonce')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.length).toBeGreaterThanOrEqual(1);
    expect(res.body[0].title).toContain('Beyonce');
  });
});
