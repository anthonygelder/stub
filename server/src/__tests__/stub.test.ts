import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import { createApp } from '../app';
import { prisma } from '../lib/prisma';

const app = createApp();

let token: string;
let userId: string;

beforeEach(async () => {
  await prisma.reaction.deleteMany();
  await prisma.stub.deleteMany();
  await prisma.corroboration.deleteMany();
  await prisma.event.deleteMany();
  await prisma.follow.deleteMany();
  await prisma.user.deleteMany();

  const res = await request(app).post('/api/auth/register').send({
    email: 'stub-test@example.com', handle: 'stubtest', displayName: 'Stub Tester', password: 'password123',
  });
  token = res.body.accessToken;
  userId = res.body.user.id;
});

describe('POST /api/stubs', () => {
  it('should create a stub linked to an event', async () => {
    const res = await request(app)
      .post('/api/stubs')
      .set('Authorization', `Bearer ${token}`)
      .send({
        type: 'concert',
        title: 'Radiohead Live',
        venueName: 'Madison Square Garden',
        venueCity: 'New York',
        venueCountry: 'US',
        eventDate: '2024-09-20T00:00:00Z',
        personalData: {
          seat: 'Section 104, Row J, Seat 7',
          companions: 'with Sarah and Mike',
        },
      });

    expect(res.status).toBe(201);
    expect(res.body.stub).toBeDefined();
    expect(res.body.stub.personalData.seat).toBe('Section 104, Row J, Seat 7');
    expect(res.body.event).toBeDefined();
  });

  it('should reject unauthenticated requests', async () => {
    const res = await request(app).post('/api/stubs').send({
      type: 'concert', title: 'Test', eventDate: '2024-01-01T00:00:00Z',
    });
    expect(res.status).toBe(401);
  });
});

describe('GET /api/stubs', () => {
  it('should list user stubs ordered by newest first', async () => {
    await request(app).post('/api/stubs').set('Authorization', `Bearer ${token}`).send({
      type: 'concert', title: 'First', eventDate: '2024-01-01T00:00:00Z',
    });
    await request(app).post('/api/stubs').set('Authorization', `Bearer ${token}`).send({
      type: 'sports', title: 'Second', eventDate: '2024-02-01T00:00:00Z',
    });

    const res = await request(app)
      .get('/api/stubs')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.length).toBe(2);
    expect(res.body[0].event.title).toBe('Second');
    expect(res.body[1].event.title).toBe('First');
  });

  it('should return empty array for new user', async () => {
    const res = await request(app)
      .get('/api/stubs')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });
});

describe('GET /api/stubs/:id', () => {
  it('should get a single stub with event data', async () => {
    const createRes = await request(app).post('/api/stubs').set('Authorization', `Bearer ${token}`).send({
      type: 'comedy', title: 'Stand Up Night', eventDate: '2024-03-15T00:00:00Z',
    });
    const stubId = createRes.body.stub.id;

    const res = await request(app)
      .get(`/api/stubs/${stubId}`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.id).toBe(stubId);
    expect(res.body.event.title).toBe('Stand Up Night');
  });
});

describe('GET /api/users/:handle/stubs', () => {
  it('should get public stubs for a user by handle', async () => {
    await request(app).post('/api/stubs').set('Authorization', `Bearer ${token}`).send({
      type: 'concert', title: 'Public Event', eventDate: '2024-05-01T00:00:00Z',
    });

    const res = await request(app).get('/api/users/stubtest/stubs');

    expect(res.status).toBe(200);
    expect(res.body.length).toBe(1);
    expect(res.body[0].event.title).toBe('Public Event');
  });
});
