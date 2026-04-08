import { Router, Request, Response, NextFunction } from 'express';
import { requireAuth, requirePermission } from '../middleware/auth.js';
import { vertragService } from '../services/vertragService.js';
import { parsePaginationParams, parseSort } from '../utils/pagination.js';
import { validate, VertragCreateSchema } from '../utils/validation.js';

const router = Router();
const PERM = 'VERTRAEGE';

// GET /api/vertraege/all
router.get(
  '/all',
  requireAuth,
  requirePermission(PERM),
  (_req: Request, res: Response, next: NextFunction): void => {
    try {
      res.json(vertragService.listAll());
    } catch (err) {
      next(err);
    }
  }
);

// GET /api/vertraege — paginated
router.get(
  '/',
  requireAuth,
  requirePermission(PERM),
  (req: Request, res: Response, next: NextFunction): void => {
    try {
      const { page, size } = parsePaginationParams(req.query as Record<string, unknown>);
      const sort = parseSort(
        req.query['sort'] as string | string[] | undefined,
        'createdAt',
        'DESC',
        'vertrag'
      );
      res.json(vertragService.findAll(page, size, sort));
    } catch (err) {
      next(err);
    }
  }
);

// GET /api/vertraege/:id
router.get(
  '/:id',
  requireAuth,
  requirePermission(PERM),
  (req: Request, res: Response, next: NextFunction): void => {
    try {
      const id = parseInt(req.params['id'], 10);
      res.json(vertragService.findById(id));
    } catch (err) {
      next(err);
    }
  }
);

// POST /api/vertraege
router.post(
  '/',
  requireAuth,
  requirePermission(PERM),
  (req: Request, res: Response, next: NextFunction): void => {
    try {
      const dto = validate(VertragCreateSchema, req.body);
      res.status(201).json(vertragService.create(dto));
    } catch (err) {
      next(err);
    }
  }
);

// PUT /api/vertraege/:id
router.put(
  '/:id',
  requireAuth,
  requirePermission(PERM),
  (req: Request, res: Response, next: NextFunction): void => {
    try {
      const id = parseInt(req.params['id'], 10);
      const dto = validate(VertragCreateSchema, req.body);
      res.json(vertragService.update(id, dto));
    } catch (err) {
      next(err);
    }
  }
);

// DELETE /api/vertraege/:id
router.delete(
  '/:id',
  requireAuth,
  requirePermission(PERM),
  (req: Request, res: Response, next: NextFunction): void => {
    try {
      const id = parseInt(req.params['id'], 10);
      vertragService.delete(id);
      res.status(204).send();
    } catch (err) {
      next(err);
    }
  }
);

export default router;
