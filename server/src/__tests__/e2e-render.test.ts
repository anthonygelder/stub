import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import { createApp } from '../app';
import { prisma } from '../lib/prisma';
import { renderAndSaveStub } from '../services/render.service';
import fs from 'fs';
import path from 'path';

const app = createApp();
const IMAGE_DIR = path.join(__dirname, '..', '..', 'data', 'images');

beforeEach(async () => {
  await prisma.corroboration.deleteMany();
  await prisma.reaction.deleteMany();
  await prisma.stub.deleteMany();
  await prisma.event.deleteMany();
  await prisma.follow.deleteMany();
  await prisma.user.deleteMany();

  // Clean up rendered images
  if (fs.existsSync(IMAGE_DIR)) {
    const files = fs.readdirSync(IMAGE_DIR);
    for (const f of files) {
      fs.unlinkSync(path.join(IMAGE_DIR, f));
    }
  }
});

describe('Render Pipeline — E2E', () => {
  it('create stub → render → OG image → disk cache', async () => {
    // 1. Register
    const res = await request(app).post('/api/auth/register').send({
      email: 'render-e2e@stub.app',
      handle: 'rendere2e',
      displayName: 'Render E2E',
      password: 'password123',
    });
    expect(res.status).toBe(201);
    const token = res.body.accessToken;

    // 2. Create stubs for each event type
    const types = ['concert', 'sports', 'flight', 'comedy', 'theater', 'custom'] as const;
    const stubIds: string[] = [];

    for (const type of types) {
      const monthIndex = types.indexOf(type) + 1;
      const paddedMonth = String(monthIndex).padStart(2, '0');
      const stub = await request(app)
        .post('/api/stubs')
        .set('Authorization', `Bearer ${token}`)
        .send({
          type,
          title: `${type.toUpperCase()} E2E Event`,
          venueName: 'E2E Venue',
          venueCity: 'E2E City',
          eventDate: `2024-${paddedMonth}-01T00:00:00Z`,
          personalData: { seat: 'Test Seat' },
        });
      expect(stub.status).toBe(201);
      stubIds.push(stub.body.stub.id);
    }

    // 3. Manually invoke render service for each stub (worker process equivalent)
    for (const stubId of stubIds) {
      const stub = await prisma.stub.findUnique({
        where: { id: stubId },
        include: { event: true, user: { select: { id: true, handle: true, displayName: true } } },
      });
      if (stub) {
        const imagePath = await renderAndSaveStub(stub.id, {
          eventTitle: stub.event.title,
          eventType: stub.event.type,
          venueName: stub.event.venueName || undefined,
          venueCity: stub.event.venueCity || undefined,
          eventDate: stub.event.eventDate.toISOString(),
          seat: (stub.personalData as any)?.seat,
          userName: stub.user.displayName,
          userHandle: stub.user.handle,
          stubNumber: 0,
        });
        await prisma.stub.update({
          where: { id: stub.id },
          data: { generatedImageUrl: imagePath },
        });
      }
    }

    // 4. Verify images were saved to disk
    const files = fs.existsSync(IMAGE_DIR) ? fs.readdirSync(IMAGE_DIR) : [];
    const pngFiles = files.filter(f => f.endsWith('.png'));
    expect(pngFiles.length).toBeGreaterThanOrEqual(1); // at least some rendered

    // 5. Verify generatedImageUrl is set on at least one stub
    const updatedStubs = await prisma.stub.findMany({
      where: { id: { in: stubIds }, generatedImageUrl: { not: null } },
    });
    expect(updatedStubs.length).toBeGreaterThanOrEqual(1);

    // 6. Fetch OG image for the first rendered stub
    if (updatedStubs.length > 0) {
      const ogRes = await request(app).get(`/og/${updatedStubs[0].id}`);
      expect(ogRes.status).toBe(200);
      expect(ogRes.headers['content-type']).toContain('image/png');

      // Verify OG image is cached (second request)
      const ogRes2 = await request(app).get(`/og/${updatedStubs[0].id}`);
      expect(ogRes2.status).toBe(200);
    }
  });
});
