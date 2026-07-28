import { Request, Response, NextFunction, RequestHandler } from 'express';

/**
 * Wraps an async Express handler so that rejected Promises are forwarded to
 * the next() error-handler chain (Express 4 does not do this automatically).
 * Errors reach middleware/errorHandler.ts which emits { status, message,
 * timestamp, fieldErrors }.
 */
export function asyncHandler(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<unknown>,
): RequestHandler {
  return (req: Request, res: Response, next: NextFunction): void => {
    fn(req, res, next).catch(next);
  };
}
