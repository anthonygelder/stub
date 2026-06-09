import { createApp } from './app';
import { config } from './config';
import { connectRedis } from './lib/redis';
import { logger } from './lib/logger';

const app = createApp();

// Connect Redis
connectRedis().then(() => logger.info('Redis connected')).catch(err => logger.warn('Redis unavailable', { error: err.message }));

app.listen(config.port, () => {
  logger.info('Server running', { port: config.port, env: config.nodeEnv });
});
