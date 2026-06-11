import { Request, Response, NextFunction, RequestHandler } from 'express';

// Wraps an async route handler so thrown/rejected errors are forwarded to the
// central error handler instead of being swallowed (and avoids per-route try/catch).
export function asyncHandler(fn: (req: any, res: Response, next: NextFunction) => Promise<unknown>): RequestHandler {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}
