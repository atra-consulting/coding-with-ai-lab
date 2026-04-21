import { Router, Request, Response, NextFunction } from 'express';
import { requireAuth, requirePermission } from '../middleware/auth.js';
import { adresseService } from '../services/adresseService.js';
import { parsePaginationParams, parseSort } from '../utils/pagination.js';
import { validate, AdresseCreateSchema } from '../utils/validation.js';

const router = Router();

// GET /api/adressen/all
router.get(
  '/all',
  requireAuth,
  (_req: Request, res: Response, next: NextFunction): void => {
    try {
      res.json(adresseService.listAll());
    } catch (err) {
      next(err);
    }
  }
);

// GET /api/adressen/map-markers — must come before /:id so Express doesn't match the path param
router.get(
  '/map-markers',
  requireAuth,
  requirePermission('MAP_VIEW'),
  (_req: Request, res: Response, next: NextFunction): void => {
    try {
      res.json(adresseService.listMapMarkers());
    } catch (err) {
      next(err);
    }
  }
);

// GET /api/adressen — paginated
router.get(
  '/',
  requireAuth,
  (req: Request, res: Response, next: NextFunction): void => {
    try {
      const { page, size } = parsePaginationParams(req.query as Record<string, unknown>);
      const sort = parseSort(
        req.query['sort'] as string | string[] | undefined,
        'city',
        'ASC',
        'adresse'
      );
      res.json(adresseService.findAll(page, size, sort));
    } catch (err) {
      next(err);
    }
  }
);

// GET /api/adressen/:id
router.get(
  '/:id',
  requireAuth,
  (req: Request, res: Response, next: NextFunction): void => {
    try {
      const id = parseInt(req.params['id'], 10);
      res.json(adresseService.findById(id));
    } catch (err) {
      next(err);
    }
  }
);

// POST /api/adressen
router.post(
  '/',
  requireAuth,
  (req: Request, res: Response, next: NextFunction): void => {
    try {
      const dto = validate(AdresseCreateSchema, req.body);
      res.status(201).json(adresseService.create(dto));
    } catch (err) {
      next(err);
    }
  }
);

// PUT /api/adressen/:id
router.put(
  '/:id',
  requireAuth,
  (req: Request, res: Response, next: NextFunction): void => {
    try {
      const id = parseInt(req.params['id'], 10);
      const dto = validate(AdresseCreateSchema, req.body);
      res.json(adresseService.update(id, dto));
    } catch (err) {
      next(err);
    }
  }
);

// DELETE /api/adressen/:id
router.delete(
  '/:id',
  requireAuth,
  (req: Request, res: Response, next: NextFunction): void => {
    try {
      const id = parseInt(req.params['id'], 10);
      adresseService.delete(id);
      res.status(204).send();
    } catch (err) {
      next(err);
    }
  }
);

export default router;
