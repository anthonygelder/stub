import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { redis, connectRedis, addToFeed, getFeed, cacheEvent, getCachedEvent, incrementCorroborationCount, getCorroborationCount } from '../lib/redis';

beforeAll(async () => {
  try { await connectRedis(); } catch { /* redis optional in this env */ }
});

afterAll(async () => {
  await redis.quit();
});

describe('Redis client', () => {
  it('should connect and respond to ping', async () => {
    const pong = await redis.ping();
    expect(pong).toBe('PONG');
  });
});

describe('feed helpers', () => {
  it('should add and retrieve feed items', async () => {
    await redis.del('feed:test-user');
    await addToFeed('test-user', 'stub-1', 1000);
    await addToFeed('test-user', 'stub-2', 2000);
    await addToFeed('test-user', 'stub-3', 3000);

    const feed = await getFeed('test-user', undefined, 2);
    expect(feed).toEqual(['stub-3', 'stub-2']);
  });
});

describe('cache helpers', () => {
  it('should cache and retrieve event data', async () => {
    await cacheEvent('ev-1', { title: 'Test Event' });
    const cached = await getCachedEvent('ev-1');
    expect(cached).toEqual({ title: 'Test Event' });
  });
});

describe('corroboration counter', () => {
  it('should increment and get corroboration count', async () => {
    await redis.del('corroboration:test-ev');
    await incrementCorroborationCount('test-ev');
    await incrementCorroborationCount('test-ev');
    const count = await getCorroborationCount('test-ev');
    expect(count).toBe(2);
  });
});
