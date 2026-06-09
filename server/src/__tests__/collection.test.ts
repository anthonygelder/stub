import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import { createApp } from '../app';
import { prisma } from '../lib/prisma';

const app = createApp();

beforeEach(async () => {
  await prisma.collectionStub.deleteMany();
  await prisma.collection.deleteMany();
  await prisma.corroboration.deleteMany();
  await prisma.reaction.deleteMany();
  await prisma.stub.deleteMany();
  await prisma.event.deleteMany();
  await prisma.follow.deleteMany();
  await prisma.user.deleteMany();
});

describe('Collections', () => {
  it('create, list, update, delete', async () => {
    const res = await request(app).post('/api/auth/register').send({
      email: 'col@test.com', handle: 'coltest', displayName: 'Col', password: 'password123',
    });
    const token = res.body.accessToken;

    const create = await request(app).post('/api/collections').set('Authorization', `Bearer ${token}`).send({ title: 'Summer 2024' });
    expect(create.status).toBe(201);

    const list = await request(app).get('/api/collections').set('Authorization', `Bearer ${token}`);
    expect(list.body.length).toBe(1);

    const update = await request(app).put(`/api/collections/${create.body.id}`).set('Authorization', `Bearer ${token}`).send({ title: 'Best of 2024' });
    expect(update.status).toBe(200);

    const del = await request(app).delete(`/api/collections/${create.body.id}`).set('Authorization', `Bearer ${token}`);
    expect(del.status).toBe(200);
  });

  it('add, list, and remove stubs from collection', async () => {
    // Register user
    const res = await request(app).post('/api/auth/register').send({
      email: 'colstub@test.com', handle: 'colstub', displayName: 'ColStub', password: 'password123',
    });
    const token = res.body.accessToken;

    // Create a collection
    const col = await request(app).post('/api/collections').set('Authorization', `Bearer ${token}`).send({ title: 'Favorites' });
    expect(col.status).toBe(201);
    const collectionId = col.body.id;

    // Create an event and stub
    const stub = await request(app).post('/api/stubs').set('Authorization', `Bearer ${token}`).send({
      type: 'concert',
      title: 'Test Concert',
      eventDate: '2025-06-15T20:00:00.000Z',
      visibility: 'public',
    });
    expect(stub.status).toBe(201);
    const stubId = stub.body.stub.id;

    // Add stub to collection
    const add = await request(app).post(`/api/collections/${collectionId}/stubs`).set('Authorization', `Bearer ${token}`).send({ stubId });
    expect(add.status).toBe(201);
    expect(add.body.added).toBe(true);

    // List stubs in collection
    const list = await request(app).get(`/api/collections/${collectionId}/stubs`);
    expect(list.status).toBe(200);
    expect(list.body.length).toBe(1);
    expect(list.body[0].id).toBe(stubId);

    // Remove stub from collection
    const remove = await request(app).delete(`/api/collections/${collectionId}/stubs/${stubId}`).set('Authorization', `Bearer ${token}`);
    expect(remove.status).toBe(200);
    expect(remove.body.removed).toBe(true);

    // List should be empty after removal
    const listAfter = await request(app).get(`/api/collections/${collectionId}/stubs`);
    expect(listAfter.status).toBe(200);
    expect(listAfter.body.length).toBe(0);
  });

  it('returns 404 when adding stub to nonexistent collection', async () => {
    const res = await request(app).post('/api/auth/register').send({
      email: 'nf2@test.com', handle: 'notfound2', displayName: 'NF', password: 'password123',
    });
    const token = res.body.accessToken;

    const add = await request(app).post('/api/collections/nonexistent-id/stubs').set('Authorization', `Bearer ${token}`).send({ stubId: 'some-stub-id' });
    expect(add.status).toBe(404);
  });

  it('returns 400 when adding stub without stubId', async () => {
    const res = await request(app).post('/api/auth/register').send({
      email: 'val@test.com', handle: 'valtest', displayName: 'Val', password: 'password123',
    });
    const token = res.body.accessToken;

    const col = await request(app).post('/api/collections').set('Authorization', `Bearer ${token}`).send({ title: 'Test' });
    const add = await request(app).post(`/api/collections/${col.body.id}/stubs`).set('Authorization', `Bearer ${token}`).send({});
    expect(add.status).toBe(400);
  });
});
