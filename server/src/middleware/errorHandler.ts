import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { logger } from '../lib/logger';

// Service layer throws `new Error('CODE')`; map those to HTTP statuses + messages.
const CODE_STATUS: Record<string, number> = {
  NOT_FOUND: 404,
  USER_NOT_FOUND: 404,
  STUB_NOT_FOUND: 404,
  DRAFT_NOT_FOUND: 404,
  EVENT_CANDIDATES: 409,
  INVALID_REACTION_TYPE: 400,
};

const CODE_MESSAGE: Record<string, string> = {
  NOT_FOUND: 'Not found',
  USER_NOT_FOUND: 'User not found',
  STUB_NOT_FOUND: 'Stub not found',
  DRAFT_NOT_FOUND: 'Draft not found',
  EVENT_CANDIDATES: 'Multiple event candidates found. Please confirm the event.',
  INVALID_REACTION_TYPE: 'Invalid reaction type',
};

export function errorHandler(err: any, _req: Request, res: Response, _next: NextFunction) {
  // Zod validation failures
  if (err instanceof ZodError) {
    return res.status(400).json({ error: 'Validation failed', details: err.errors });
  }

  // Malformed JSON body (express.json)
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({ error: 'Invalid JSON' });
  }

  // Known service error codes
  const codeStatus = CODE_STATUS[err.message];
  if (codeStatus) {
    return res.status(codeStatus).json({ error: CODE_MESSAGE[err.message], code: err.message });
  }

  // Typed errors that carry their own status (e.g. AuthError)
  if (typeof err.statusCode === 'number') {
    return res.status(err.statusCode).json({ error: err.message, code: err.code });
  }

  // Unexpected — log full detail server-side, return a generic message.
  logger.error('Unhandled error', { message: err.message, stack: err.stack });
  const status = err.status || 500;
  res.status(status).json({
    error: status < 500 ? err.message : 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
}

export function notFound(_req: Request, res: Response) {
  res.status(404).json({ error: 'Not found' });
}
