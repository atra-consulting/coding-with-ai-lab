import { Request, Response, NextFunction } from 'express';
import { findById, CrmUser } from '../config/users.js';
import { UnauthorizedError, ForbiddenError } from '../utils/errors.js';

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

export function requireRole(...roles: string[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const user = req.currentUser;
    if (!user) {
      next(new UnauthorizedError('Nicht authentifiziert'));
      return;
    }
    const hasRole = roles.some((role) => user.roles.includes(role));
    if (!hasRole) {
      next(new ForbiddenError('Zugriff verweigert'));
      return;
    }
    next();
  };
}

export function requirePermission(...perms: string[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const user = req.currentUser;
    if (!user) {
      next(new UnauthorizedError('Nicht authentifiziert'));
      return;
    }
    const hasPerm = perms.every((perm) => user.permissions.includes(perm));
    if (!hasPerm) {
      next(new ForbiddenError('Zugriff verweigert'));
      return;
    }
    next();
  };
}
