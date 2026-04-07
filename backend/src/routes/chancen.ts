import { Router, Request, Response, NextFunction } from 'express';
import { requireAuth, requirePermission } from '../middleware/auth.js';
import { chanceService } from '../services/chanceService.js';
import { parsePaginationParams, parseSort } from '../utils/pagination.js';
import { validate, ChanceCreateSchema } from '../utils/validation.js';

const router = Router();
const PERM = 'CHANCEN';

// GET /api/chancen/all
router.get(
  '/all',
  requireAuth,
  requirePermission(PERM),
  (_req: Request, res: Response, next: NextFunction): void => {
    try {
      res.json(chanceService.listAll());
    } catch (err) {
      next(err);
    }
  }
);

// GET /api/chancen/board/summary — BEFORE /:id
router.get(
  '/board/summary',
  requireAuth,
  requirePermission(PERM),
  (_req: Request, res: Response, next: NextFunction): void => {
    try {
      res.json(chanceService.getBoardSummary());
    } catch (err) {
      next(err);
    }
  }
);

// GET /api/chancen/phase/:phase — BEFORE /:id
router.get(
  '/phase/:phase',
  requireAuth,
  requirePermission(PERM),
  (req: Request, res: Response, next: NextFunction): void => {
    try {
      const phase = req.params['phase'];
      const { page, size } = parsePaginationParams(req.query as Record<string, unknown>);
      const sort = parseSort(
        req.query['sort'] as string | string[] | undefined,
        'createdAt',
        'DESC',
        'chance'
      );
      res.json(chanceService.findByPhase(phase, page, size, sort));
    } catch (err) {
      next(err);
    }
  }
);

// GET /api/chancen — paginated
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
        'chance'
      );
      res.json(chanceService.findAll(page, size, sort));
    } catch (err) {
      next(err);
    }
  }
);

// PUT /api/chancen/:id/phase — phase-only update
router.put(
  '/:id/phase',
  requireAuth,
  requirePermission(PERM),
  (req: Request, res: Response, next: NextFunction): void => {
    try {
      const id = parseInt(req.params['id'], 10);
      const { phase } = req.body as { phase: string };
      res.json(chanceService.updatePhase(id, phase));
    } catch (err) {
      next(err);
    }
  }
);

// GET /api/chancen/:id
router.get(
  '/:id',
  requireAuth,
  requirePermission(PERM),
  (req: Request, res: Response, next: NextFunction): void => {
    try {
      const id = parseInt(req.params['id'], 10);
      res.json(chanceService.findById(id));
    } catch (err) {
      next(err);
    }
  }
);

// POST /api/chancen
router.post(
  '/',
  requireAuth,
  requirePermission(PERM),
  (req: Request, res: Response, next: NextFunction): void => {
    try {
      const dto = validate(ChanceCreateSchema, req.body);
      res.status(201).json(chanceService.create(dto));
    } catch (err) {
      next(err);
    }
  }
);

// PUT /api/chancen/:id
router.put(
  '/:id',
  requireAuth,
  requirePermission(PERM),
  (req: Request, res: Response, next: NextFunction): void => {
    try {
      const id = parseInt(req.params['id'], 10);
      const dto = validate(ChanceCreateSchema, req.body);
      res.json(chanceService.update(id, dto));
    } catch (err) {
      next(err);
    }
  }
);

// DELETE /api/chancen/:id
router.delete(
  '/:id',
  requireAuth,
  requirePermission(PERM),
  (req: Request, res: Response, next: NextFunction): void => {
    try {
      const id = parseInt(req.params['id'], 10);
      chanceService.delete(id);
      res.status(204).send();
    } catch (err) {
      next(err);
    }
  }
);

export default router;
