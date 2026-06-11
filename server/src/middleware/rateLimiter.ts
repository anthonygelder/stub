import rateLimit, { Store } from 'express-rate-limit';
import { RedisStore } from 'rate-limit-redis';
import { redis } from '../lib/redis';

// Default to express-rate-limit's in-memory store, which always works (per
// instance) and never blocks requests if Redis is down. Opt in to a shared
// Redis store only with RATE_LIMIT_REDIS=true (for multi-instance deployments
// with a confirmed-reachable Redis).
function makeStore(): Store | undefined {
  if (process.env.RATE_LIMIT_REDIS !== 'true') return undefined;
  try {
    return new RedisStore({
      // ioredis: redis.call(cmd, ...args)
      sendCommand: (...args: string[]) => redis.call(args[0], ...args.slice(1)) as Promise<any>,
      prefix: 'rl:',
    });
  } catch {
    return undefined;
  }
}

export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // 20 requests per window
  standardHeaders: true,
  legacyHeaders: false,
  store: makeStore(),
  message: { error: 'Too many requests, please try again later.' },
});

export const strictAuthLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5, // 5 attempts per 15 min for login specifically
  standardHeaders: true,
  legacyHeaders: false,
  store: makeStore(),
  message: { error: 'Too many login attempts, please try again later.' },
});

export const uploadLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30, // 30 uploads per 15 min
  standardHeaders: true,
  legacyHeaders: false,
  store: makeStore(),
  message: { error: 'Too many uploads, please try again later.' },
});
