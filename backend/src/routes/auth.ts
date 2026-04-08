import { Router, Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import { findByBenutzername } from '../config/users.js';
import { requireAuth } from '../middleware/auth.js';
import { UnauthorizedError } from '../utils/errors.js';

const router = Router();

// POST /api/auth/login
router.post('/login', (req: Request, res: Response, next: NextFunction): void => {
  try {
    const { benutzername, passwort } = req.body as {
      benutzername?: string;
      passwort?: string;
    };

    if (!benutzername || !passwort) {
      next(new UnauthorizedError('Ungültige Anmeldedaten'));
      return;
    }

    const user = findByBenutzername(benutzername);
    if (!user) {
      next(new UnauthorizedError('Ungültige Anmeldedaten'));
      return;
    }

    const passwordValid = bcrypt.compareSync(passwort, user.passwordHash);
    if (!passwordValid) {
      next(new UnauthorizedError('Ungültige Anmeldedaten'));
      return;
    }

    // Regenerate session to prevent fixation attacks
    req.session.regenerate((err) => {
      if (err) {
        next(err);
        return;
      }
      req.session.userId = user.id;
      res.json({
        benutzername: user.benutzername,
        vorname: user.vorname,
        nachname: user.nachname,
        rollen: user.roles.map((r) => `ROLE_${r}`),
      });
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/auth/logout
router.post('/logout', (req: Request, res: Response, next: NextFunction): void => {
  req.session.destroy((err) => {
    if (err) {
      next(err);
      return;
    }
    res.clearCookie('JSESSIONID');
    res.json({});
  });
});

// GET /api/auth/me
router.get('/me', requireAuth, (req: Request, res: Response): void => {
  const user = req.currentUser!;
  res.json({
    id: user.id,
    benutzername: user.benutzername,
    vorname: user.vorname,
    nachname: user.nachname,
    email: `${user.benutzername}@crm.local`,
    rollen: user.roles.map((r) => `ROLE_${r}`),
    permissions: user.permissions,
  });
});

// POST /api/auth/test-login — only available in non-production (for Playwright tests)
if (process.env['NODE_ENV'] !== 'production') {
  router.post('/test-login', (req: Request, res: Response, next: NextFunction): void => {
    try {
      const { benutzername } = req.body as { benutzername?: string };

      if (!benutzername) {
        next(new UnauthorizedError('benutzername required'));
        return;
      }

      const user = findByBenutzername(benutzername);
      if (!user) {
        next(new UnauthorizedError('Benutzer nicht gefunden'));
        return;
      }

      req.session.regenerate((err) => {
        if (err) {
          next(err);
          return;
        }
        req.session.userId = user.id;
        res.json({
          benutzername: user.benutzername,
          vorname: user.vorname,
          nachname: user.nachname,
          rollen: user.roles.map((r) => `ROLE_${r}`),
        });
      });
    } catch (err) {
      next(err);
    }
  });
} else {
  // In production, return 404 for test-login
  router.post('/test-login', (_req: Request, res: Response): void => {
    res.status(404).json({ status: 404, message: 'Not found' });
  });
}

export default router;
