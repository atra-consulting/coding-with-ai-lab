import { Router, Request, Response, NextFunction } from 'express';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { abteilungService } from '../services/abteilungService.js';
import { parsePaginationParams, parseSort } from '../utils/pagination.js';
import { validate, AbteilungCreateSchema } from '../utils/validation.js';

const router = Router();
const ROLES = ['ADMIN', 'VERTRIEB', 'PERSONAL'];

// GET /api/abteilungen/all
router.get(
  '/all',
  requireAuth,
  requireRole(...ROLES),
  (_req: Request, res: Response, next: NextFunction): void => {
    try {
      res.json(abteilungService.listAll());
    } catch (err) {
      next(err);
    }
  }
);

// GET /api/abteilungen/firma/:firmaId — non-paginated list for a firma
// MUST be before /:id to avoid collision
router.get(
  '/firma/:firmaId',
  requireAuth,
  requireRole(...ROLES),
  (req: Request, res: Response, next: NextFunction): void => {
    try {
      const firmaId = parseInt(req.params['firmaId'], 10);
      res.json(abteilungService.findByFirmaIdAll(firmaId));
    } catch (err) {
      next(err);
    }
  }
);

// GET /api/abteilungen — paginated
router.get(
  '/',
  requireAuth,
  requireRole(...ROLES),
  (req: Request, res: Response, next: NextFunction): void => {
    try {
      const { page, size } = parsePaginationParams(req.query as Record<string, unknown>);
      const sort = parseSort(
        req.query['sort'] as string | string[] | undefined,
        'name',
        'ASC',
        'abteilung'
      );
      res.json(abteilungService.findAll(page, size, sort));
    } catch (err) {
      next(err);
    }
  }
);

// GET /api/abteilungen/:id/personen — paginated personen for an abteilung
router.get(
  '/:id/personen',
  requireAuth,
  requireRole(...ROLES),
  (req: Request, res: Response, next: NextFunction): void => {
    try {
      const id = parseInt(req.params['id'], 10);
      const { page, size } = parsePaginationParams(req.query as Record<string, unknown>);
      res.json(abteilungService.findPersonenByAbteilungId(id, page, size));
    } catch (err) {
      next(err);
    }
  }
);

// GET /api/abteilungen/:id
router.get(
  '/:id',
  requireAuth,
  requireRole(...ROLES),
  (req: Request, res: Response, next: NextFunction): void => {
    try {
      const id = parseInt(req.params['id'], 10);
      res.json(abteilungService.findById(id));
    } catch (err) {
      next(err);
    }
  }
);

// POST /api/abteilungen
router.post(
  '/',
  requireAuth,
  requireRole(...ROLES),
  (req: Request, res: Response, next: NextFunction): void => {
    try {
      const dto = validate(AbteilungCreateSchema, req.body);
      res.status(201).json(abteilungService.create(dto));
    } catch (err) {
      next(err);
    }
  }
);

// PUT /api/abteilungen/:id
router.put(
  '/:id',
  requireAuth,
  requireRole(...ROLES),
  (req: Request, res: Response, next: NextFunction): void => {
    try {
      const id = parseInt(req.params['id'], 10);
      const dto = validate(AbteilungCreateSchema, req.body);
      res.json(abteilungService.update(id, dto));
    } catch (err) {
      next(err);
    }
  }
);

// DELETE /api/abteilungen/:id
router.delete(
  '/:id',
  requireAuth,
  requireRole(...ROLES),
  (req: Request, res: Response, next: NextFunction): void => {
    try {
      const id = parseInt(req.params['id'], 10);
      abteilungService.delete(id);
      res.status(204).send();
    } catch (err) {
      next(err);
    }
  }
);

export default router;
