import { Request, Response, NextFunction } from 'express';
import {
  NotFoundError,
  ValidationError,
  ConflictError,
  UnauthorizedError,
  ForbiddenError,
} from '../utils/errors.js';

// Strips trailing 'Z' to match Java's LocalDateTime format
function timestamp(): string {
  return new Date().toISOString().replace(/Z$/, '');
}

// 4-argument signature is required for Express to treat this as an error handler
export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _next: NextFunction,
): void {
  if (err instanceof ValidationError) {
    res.status(400).json({
      status: 400,
      message: err.message,
      timestamp: timestamp(),
      fieldErrors: err.fieldErrors,
    });
    return;
  }

  if (err instanceof UnauthorizedError) {
    res.status(401).json({
      status: 401,
      message: err.message,
      timestamp: timestamp(),
      fieldErrors: {},
    });
    return;
  }

  if (err instanceof ForbiddenError) {
    res.status(403).json({
      status: 403,
      message: err.message,
      timestamp: timestamp(),
      fieldErrors: {},
    });
    return;
  }

  if (err instanceof NotFoundError) {
    res.status(404).json({
      status: 404,
      message: err.message,
      timestamp: timestamp(),
      fieldErrors: {},
    });
    return;
  }

  if (err instanceof ConflictError) {
    res.status(409).json({
      status: 409,
      message: err.message,
      timestamp: timestamp(),
      fieldErrors: {},
    });
    return;
  }

  // Unexpected error
  const message =
    err instanceof Error ? err.message : 'Interner Serverfehler';
  console.error('Unhandled error:', err);
  res.status(500).json({
    status: 500,
    message,
    timestamp: timestamp(),
    fieldErrors: {},
  });
}
