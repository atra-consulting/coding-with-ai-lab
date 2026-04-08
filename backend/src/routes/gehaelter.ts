import { Router, Request, Response, NextFunction } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { gehaltService } from '../services/gehaltService.js';
import { parsePaginationParams, parseSort } from '../utils/pagination.js';
import { validate, GehaltCreateSchema } from '../utils/validation.js';

const router = Router();

// GET /api/gehaelter/all
router.get(
  '/all',
  requireAuth,
  (_req: Request, res: Response, next: NextFunction): void => {
    try {
      res.json(gehaltService.listAll());
    } catch (err) {
      next(err);
    }
  }
);

// GET /api/gehaelter — paginated
router.get(
  '/',
  requireAuth,
  (req: Request, res: Response, next: NextFunction): void => {
    try {
      const { page, size } = parsePaginationParams(req.query as Record<string, unknown>);
      const sort = parseSort(
        req.query['sort'] as string | string[] | undefined,
        'effectiveDate',
        'DESC',
        'gehalt'
      );
      res.json(gehaltService.findAll(page, size, sort));
    } catch (err) {
      next(err);
    }
  }
);

// GET /api/gehaelter/:id
router.get(
  '/:id',
  requireAuth,
  (req: Request, res: Response, next: NextFunction): void => {
    try {
      const id = parseInt(req.params['id'], 10);
      res.json(gehaltService.findById(id));
    } catch (err) {
      next(err);
    }
  }
);

// POST /api/gehaelter
router.post(
  '/',
  requireAuth,
  (req: Request, res: Response, next: NextFunction): void => {
    try {
      const dto = validate(GehaltCreateSchema, req.body);
      res.status(201).json(gehaltService.create(dto));
    } catch (err) {
      next(err);
    }
  }
);

// PUT /api/gehaelter/:id
router.put(
  '/:id',
  requireAuth,
  (req: Request, res: Response, next: NextFunction): void => {
    try {
      const id = parseInt(req.params['id'], 10);
      const dto = validate(GehaltCreateSchema, req.body);
      res.json(gehaltService.update(id, dto));
    } catch (err) {
      next(err);
    }
  }
);

// DELETE /api/gehaelter/:id
router.delete(
  '/:id',
  requireAuth,
  (req: Request, res: Response, next: NextFunction): void => {
    try {
      const id = parseInt(req.params['id'], 10);
      gehaltService.delete(id);
      res.status(204).send();
    } catch (err) {
      next(err);
    }
  }
);

export default router;
