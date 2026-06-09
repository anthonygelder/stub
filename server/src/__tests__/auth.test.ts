import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import { createApp } from '../app';
import { prisma } from '../lib/prisma';

const app = createApp();

describe('POST /api/auth/register', () => {
  beforeEach(async () => {
    await prisma.user.deleteMany();
  });

  it('should register a new user and return tokens', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        email: 'test@example.com',
        handle: 'testuser',
        displayName: 'Test User',
        password: 'password123',
      });

    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('accessToken');
    expect(res.body).toHaveProperty('refreshToken');
    expect(res.body.user.email).toBe('test@example.com');
    expect(res.body.user.handle).toBe('testuser');
  });

  it('should reject duplicate email', async () => {
    await request(app).post('/api/auth/register').send({
      email: 'dup@example.com', handle: 'user1', displayName: 'U1', password: 'password123',
    });
    const res = await request(app).post('/api/auth/register').send({
      email: 'dup@example.com', handle: 'user2', displayName: 'U2', password: 'password123',
    });
    expect(res.status).toBe(409);
  });

  it('should reject duplicate handle', async () => {
    await request(app).post('/api/auth/register').send({
      email: 'a@example.com', handle: 'same', displayName: 'A', password: 'password123',
    });
    const res = await request(app).post('/api/auth/register').send({
      email: 'b@example.com', handle: 'same', displayName: 'B', password: 'password123',
    });
    expect(res.status).toBe(409);
  });
});

describe('POST /api/auth/login', () => {
  beforeEach(async () => {
    await prisma.user.deleteMany();
    await request(app).post('/api/auth/register').send({
      email: 'login@example.com', handle: 'logintest', displayName: 'Login Test',
      password: 'password123',
    });
  });

  it('should login with correct credentials', async () => {
    const res = await request(app).post('/api/auth/login').send({
      email: 'login@example.com', password: 'password123',
    });
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('accessToken');
  });

  it('should reject wrong password', async () => {
    const res = await request(app).post('/api/auth/login').send({
      email: 'login@example.com', password: 'wrong',
    });
    expect(res.status).toBe(401);
  });
});

describe('GET /api/auth/me', () => {
  it('should return current user when authenticated', async () => {
    const registerRes = await request(app).post('/api/auth/register').send({
      email: 'me@example.com', handle: 'metest', displayName: 'Me', password: 'password123',
    });
    const token = registerRes.body.accessToken;
    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.email).toBe('me@example.com');
  });

  it('should reject unauthenticated request', async () => {
    const res = await request(app).get('/api/auth/me');
    expect(res.status).toBe(401);
  });
});
