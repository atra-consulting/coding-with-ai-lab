import { Router, Request, Response, NextFunction } from 'express';
import { requireAuth, requirePermission } from '../middleware/auth.js';
import { savedReportService } from '../services/savedReportService.js';
import { validate, SavedReportCreateSchema } from '../utils/validation.js';

const router = Router();
const PERM = 'AUSWERTUNGEN';

// GET /api/saved-reports — per-user list
router.get(
  '/',
  requireAuth,
  requirePermission(PERM),
  (req: Request, res: Response, next: NextFunction): void => {
    try {
      const benutzerId = req.currentUser!.id;
      res.json(savedReportService.getByBenutzer(benutzerId));
    } catch (err) {
      next(err);
    }
  }
);

// POST /api/saved-reports
router.post(
  '/',
  requireAuth,
  requirePermission(PERM),
  (req: Request, res: Response, next: NextFunction): void => {
    try {
      const benutzerId = req.currentUser!.id;
      const dto = validate(SavedReportCreateSchema, req.body);
      res.status(201).json(savedReportService.create(benutzerId, dto));
    } catch (err) {
      next(err);
    }
  }
);

// PUT /api/saved-reports/:id
router.put(
  '/:id',
  requireAuth,
  requirePermission(PERM),
  (req: Request, res: Response, next: NextFunction): void => {
    try {
      const id = parseInt(req.params['id'], 10);
      const benutzerId = req.currentUser!.id;
      const dto = validate(SavedReportCreateSchema, req.body);
      res.json(savedReportService.update(id, benutzerId, dto));
    } catch (err) {
      next(err);
    }
  }
);

// DELETE /api/saved-reports/:id
router.delete(
  '/:id',
  requireAuth,
  requirePermission(PERM),
  (req: Request, res: Response, next: NextFunction): void => {
    try {
      const id = parseInt(req.params['id'], 10);
      const benutzerId = req.currentUser!.id;
      savedReportService.delete(id, benutzerId);
      res.status(204).send();
    } catch (err) {
      next(err);
    }
  }
);

export default router;
