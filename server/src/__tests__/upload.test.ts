import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import { createApp } from '../app';
import { prisma } from '../lib/prisma';

const app = createApp();

async function clean() {
  await prisma.collectionStub.deleteMany();
  await prisma.collection.deleteMany();
  await prisma.reaction.deleteMany();
  await prisma.stub.deleteMany();
  await prisma.corroboration.deleteMany();
  await prisma.event.deleteMany();
  await prisma.follow.deleteMany();
  await prisma.user.deleteMany();
}

async function setup() {
  const reg = await request(app).post('/api/auth/register').send({
    email: 'up@stub.app', handle: 'uptest', displayName: 'Up', password: 'password123',
  });
  const token = reg.body.accessToken;
  const stub = await request(app)
    .post('/api/stubs')
    .set('Authorization', `Bearer ${token}`)
    .send({ type: 'concert', title: 'Upload Test', eventDate: '2024-01-01T00:00:00Z' });
  return { token, stubId: stub.body.stub.id };
}

describe('Upload validation', () => {
  beforeEach(clean);

  it('rejects a non-image payload', async () => {
    const { token, stubId } = await setup();
    const notImage = Buffer.from('this is plain text, not an image').toString('base64');

    const res = await request(app)
      .post(`/api/upload/photo/${stubId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ image: notImage });

    expect(res.status).toBe(400);
  });

  it('accepts a valid PNG and stores a /media URL', async () => {
    const { token, stubId } = await setup();
    // Valid PNG magic-byte signature.
    const png = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0, 0, 0]).toString('base64');

    const res = await request(app)
      .post(`/api/upload/photo/${stubId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ image: png });

    expect(res.status).toBe(201);
    expect(res.body.photoUrl).toMatch(/^\/media\/uploads\//);
  });
});
