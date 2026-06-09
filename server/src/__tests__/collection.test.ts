import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import { createApp } from '../app';
import { prisma } from '../lib/prisma';

const app = createApp();

beforeEach(async () => {
  await prisma.corroboration.deleteMany(); await prisma.reaction.deleteMany();
  await prisma.stub.deleteMany(); await prisma.event.deleteMany();
  await prisma.follow.deleteMany(); await prisma.collection.deleteMany(); await prisma.user.deleteMany();
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
});
