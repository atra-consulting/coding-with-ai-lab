import { Request, Response, NextFunction } from 'express';
import { findById, CrmUser } from '../config/users.js';
import { UnauthorizedError } from '../utils/errors.js';

// Augment express-session SessionData to include userId
declare module 'express-session' {
  interface SessionData {
    userId?: number;
  }
}

// Augment Express Request to include currentUser
declare module 'express' {
  interface Request {
    currentUser?: CrmUser;
  }
}

export function requireAuth(req: Request, _res: Response, next: NextFunction): void {
  const userId = req.session.userId;
  if (!userId) {
    next(new UnauthorizedError('Nicht authentifiziert'));
    return;
  }
  const user = findById(userId);
  if (!user) {
    // Session references a user that no longer exists (shouldn't happen with hardcoded users)
    req.session.destroy(() => {});
    next(new UnauthorizedError('Nicht authentifiziert'));
    return;
  }
  req.currentUser = user;
  next();
}
