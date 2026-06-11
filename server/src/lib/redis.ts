import Redis from 'ioredis';
import { config } from '../config';

export const redis = new Redis(config.redis.url, {
  maxRetriesPerRequest: 3,
  lazyConnect: true,
});

redis.on('error', (err) => {
  console.warn('Redis connection error:', err.message);
});

export async function connectRedis() {
  await redis.connect();
  await redis.ping();
}

export async function addToFeed(userId: string, stubId: string, timestamp: number) {
  const key = `feed:${userId}`;
  await redis.zadd(key, timestamp, stubId);
  await redis.zremrangebyrank(key, 0, -501);
}

export async function getFeed(userId: string, cursor?: number, limit = 20) {
  const key = `feed:${userId}`;
  if (cursor) {
    return redis.zrevrangebyscore(key, cursor - 1, '-inf', 'LIMIT', 0, limit);
  }
  return redis.zrevrange(key, 0, limit - 1);
}

export async function cacheEvent(eventId: string, data: any, ttl = 3600) {
  await redis.setex(`event:${eventId}`, ttl, JSON.stringify(data));
}

export async function getCachedEvent(eventId: string) {
  const raw = await redis.get(`event:${eventId}`);
  return raw ? JSON.parse(raw) : null;
}

// Single-use OAuth exchange codes — avoids putting tokens in the redirect URL.
export async function storeOAuthCode(code: string, userId: string, ttlSec = 60) {
  await redis.setex(`oauth_code:${code}`, ttlSec, userId);
}

export async function consumeOAuthCode(code: string): Promise<string | null> {
  // GETDEL is atomic, so a code can only be redeemed once.
  return redis.getdel(`oauth_code:${code}`);
}

export async function incrementCorroborationCount(eventId: string) {
  return redis.incr(`corroboration:${eventId}`);
}

export async function getCorroborationCount(eventId: string) {
  const count = await redis.get(`corroboration:${eventId}`);
  return count ? parseInt(count) : 0;
}
