import { createApp } from './app';
import { config } from './config';
import { connectRedis, redis } from './lib/redis';
import { prisma } from './lib/prisma';
import { logger } from './lib/logger';

const app = createApp();

// Connect Redis
connectRedis().then(() => logger.info('Redis connected')).catch(err => logger.warn('Redis unavailable', { error: err.message }));

const server = app.listen(config.port, () => {
  logger.info('Server running', { port: config.port, env: config.nodeEnv });
});

// Graceful shutdown — Railway sends SIGTERM on deploy/restart.
async function shutdown(signal: string) {
  logger.info('Shutting down', { signal });
  server.close(async () => {
    try { await prisma.$disconnect(); } catch { /* noop */ }
    try { await redis.quit(); } catch { /* noop */ }
    process.exit(0);
  });
  // Force exit if connections don't drain in time.
  setTimeout(() => process.exit(1), 10000).unref();
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
