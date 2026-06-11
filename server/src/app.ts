import express from 'express';
import path from 'path';
import cors from 'cors';
import helmet from 'helmet';
import authRoutes from './routes/auth.routes';
import eventRoutes from './routes/event.routes';
import stubRoutes from './routes/stub.routes';
import reactionRoutes from './routes/reaction.routes';
import socialRoutes from './routes/social.routes';
import feedRoutes from './routes/feed.routes';
import discoveryRoutes from './routes/discovery.routes';
import importRoutes from './routes/import.routes';
import ogRoutes from './routes/og.routes';
import billingRoutes from './routes/billing.routes';
import yearInReviewRoutes from './routes/year-in-review.routes';
import collectionRoutes from './routes/collection.routes';
import milestoneRoutes from './routes/milestone.routes';
import userRoutes from './routes/user.routes';
import uploadRoutes from './routes/upload.routes';
import mediaRoutes from './routes/media.routes';
import inboundRoutes from './routes/inbound.routes';
import { optionalAuth } from './middleware/auth';
import { errorHandler, notFound } from './middleware/errorHandler';
import passport from './middleware/passport';
import { prisma } from './lib/prisma';
import { redis } from './lib/redis';
import { config } from './config';

export function createApp() {
  const app = express();

  app.use(helmet());
  app.use(
    cors({
      origin: (origin, cb) => {
        // Allow same-origin / non-browser requests (no Origin header) and the configured client.
        // Disallowed origins get no CORS headers (browser blocks them) rather than a 500.
        cb(null, !origin || origin === config.clientUrl);
      },
    }),
  );
  app.use(express.json({ limit: '10mb' }));
  app.use(passport.initialize());

  app.use('/api/auth', authRoutes);
  app.use('/api/events', eventRoutes);
  app.use('/api/stubs', stubRoutes);
  app.use('/api/stubs', reactionRoutes);
  app.use('/api/social', socialRoutes);
  app.use('/api/feed', feedRoutes);
  app.use('/api/discover', discoveryRoutes);
  app.use('/api/import', importRoutes);
  app.use('/og', ogRoutes);
  app.use('/api/billing', billingRoutes);
  app.use('/api/year-in-review', yearInReviewRoutes);
  app.use('/api/collections', collectionRoutes);
  app.use('/api/milestones', milestoneRoutes);
  app.use('/api/users', userRoutes);
  app.use('/api/upload', uploadRoutes);
  app.use('/media', mediaRoutes);
  app.use('/api/inbound', inboundRoutes);

  // Serve client build in production
  if (config.nodeEnv === 'production') {
    const clientDist = path.resolve(__dirname, '../../client/dist');
    app.use('/stub', express.static(clientDist));
    app.get('/stub/*', (_req, res) => {
      res.sendFile(path.join(clientDist, 'index.html'));
    });
    // Redirect root to /stub/
    app.get('/', (_req, res) => {
      res.redirect('/stub/');
    });
  }

  app.get('/health', async (_req, res) => {
    const checks: Record<string, string> = {};

    try {
      await prisma.$queryRaw`SELECT 1`;
      checks.database = 'ok';
    } catch {
      checks.database = 'error';
    }

    try {
      await redis.ping();
      checks.redis = 'ok';
    } catch {
      checks.redis = 'unavailable';
    }

    // Redis is optional/degradable; only a DB failure makes the app unhealthy
    // (otherwise a Redis blip would fail Railway's healthcheck and restart-loop).
    const healthy = checks.database === 'ok';
    res.status(healthy ? 200 : 503).json({ status: healthy ? 'ok' : 'degraded', checks });
  });

  app.use(notFound);
  app.use(errorHandler);

  return app;
}
