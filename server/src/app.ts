import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import authRoutes from './routes/auth.routes';
import eventRoutes from './routes/event.routes';
import stubRoutes from './routes/stub.routes';
import reactionRoutes from './routes/reaction.routes';
import socialRoutes from './routes/social.routes';
import feedRoutes from './routes/feed.routes';
import discoveryRoutes from './routes/discovery.routes';
import { optionalAuth } from './middleware/auth';
import { errorHandler, notFound } from './middleware/errorHandler';
import { getPublicStubsByHandle } from './services/stub.service';

export function createApp() {
  const app = express();

  app.use(helmet());
  app.use(cors());
  app.use(express.json());

  app.use('/api/auth', authRoutes);
  app.use('/api/events', eventRoutes);
  app.use('/api/stubs', stubRoutes);
  app.use('/api/stubs', reactionRoutes);
  app.use('/api/social', socialRoutes);
  app.use('/api/feed', feedRoutes);
  app.use('/api/discover', discoveryRoutes);

  // User profile routes
  app.get('/api/users/:handle/stubs', optionalAuth, async (req, res) => {
    try {
      const stubs = await getPublicStubsByHandle(req.params.handle);
      res.json(stubs.map((s: any) => ({
        id: s.id,
        personalData: s.personalData,
        visibility: s.visibility,
        createdAt: s.createdAt,
        event: s.event,
      })));
    } catch (err: any) {
      if (err.message === 'USER_NOT_FOUND') {
        return res.status(404).json({ error: 'User not found' });
      }
      console.error(err);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  app.get('/health', (_req, res) => {
    res.json({ status: 'ok' });
  });

  app.use(notFound);
  app.use(errorHandler);

  return app;
}
