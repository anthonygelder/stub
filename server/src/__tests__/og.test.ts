import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import { createApp } from '../app';
import { prisma } from '../lib/prisma';
import fs from 'fs';
import path from 'path';

const app = createApp();

beforeEach(async () => {
  await prisma.corroboration.deleteMany();
  await prisma.reaction.deleteMany();
  await prisma.stub.deleteMany();
  await prisma.event.deleteMany();
  await prisma.follow.deleteMany();
  await prisma.user.deleteMany();

  // Clean OG cache
  const imgDir = path.join(__dirname, '..', '..', 'data', 'images');
  if (fs.existsSync(imgDir)) {
    const files = fs.readdirSync(imgDir).filter(f => f.startsWith('og-'));
    files.forEach(f => fs.unlinkSync(path.join(imgDir, f)));
  }
});

describe('GET /og/:stubId', () => {
  it('should return a PNG image for a valid stub', async () => {
    const res = await request(app).post('/api/auth/register').send({
      email: 'og@test.com', handle: 'ogtest', displayName: 'OG Test', password: 'password123',
    });
    const token = res.body.accessToken;

    const stub = await request(app).post('/api/stubs').set('Authorization', `Bearer ${token}`).send({
      type: 'concert', title: 'OG Test Concert', venueName: 'OG Venue', eventDate: '2024-10-01T00:00:00Z',
    });
    const stubId = stub.body.stub.id;

    const ogRes = await request(app).get(`/og/${stubId}`);
    expect(ogRes.status).toBe(200);
    expect(ogRes.headers['content-type']).toContain('image/png');
    expect(ogRes.body.length).toBeGreaterThan(1000);
  });

  it('should return 404 for non-existent stub', async () => {
    const ogRes = await request(app).get('/og/nonexistent-id');
    expect(ogRes.status).toBe(404);
  });
});
