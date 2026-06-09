import { createApp } from './app';
import { config } from './config';
import { connectRedis } from './lib/redis';

const app = createApp();

// Connect Redis
connectRedis().then(() => console.log('Redis connected')).catch(err => console.warn('Redis unavailable:', err.message));

app.listen(config.port, () => {
  console.log(`Stub server running on port ${config.port} [${config.nodeEnv}]`);
});
