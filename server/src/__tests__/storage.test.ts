import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { createApp } from '../app';
import { storage } from '../lib/storage';

const app = createApp();

describe('Storage (local driver) + /media route', () => {
  it('round-trips put/get/exists and returns a /media URL', async () => {
    const key = `images/test-${Date.now()}.png`;
    const buf = Buffer.from([0x89, 0x50, 0x4e, 0x47, 1, 2, 3, 4]);

    const url = await storage.put(key, buf, 'image/png');
    expect(url).toBe(`/media/${key}`);
    expect(await storage.exists(key)).toBe(true);

    const got = await storage.get(key);
    expect(got?.equals(buf)).toBe(true);
  });

  it('serves a stored file via GET /media/:key', async () => {
    const key = `images/served-${Date.now()}.png`;
    const buf = Buffer.from([0x89, 0x50, 0x4e, 0x47, 9, 9, 9, 9]);
    await storage.put(key, buf, 'image/png');

    const res = await request(app).get(`/media/${key}`);
    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toContain('image/png');
  });

  it('404s for a missing key', async () => {
    const res = await request(app).get(`/media/images/missing-${Date.now()}.png`);
    expect(res.status).toBe(404);
  });
});
