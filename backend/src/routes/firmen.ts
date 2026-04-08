import { Router, Request, Response, NextFunction } from 'express';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { firmaService } from '../services/firmaService.js';
import { personService } from '../services/personService.js';
import { abteilungService } from '../services/abteilungService.js';
import { parsePaginationParams, parseSort } from '../utils/pagination.js';
import { validate, FirmaCreateSchema } from '../utils/validation.js';

const router = Router();
const ROLES = ['ADMIN', 'VERTRIEB', 'PERSONAL'];

// GET /api/firmen/all — non-paginated list
router.get(
  '/all',
  requireAuth,
  requireRole(...ROLES),
  (_req: Request, res: Response, next: NextFunction): void => {
    try {
      res.json(firmaService.listAll());
    } catch (err) {
      next(err);
    }
  }
);

// GET /api/firmen — paginated + search
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
        'firma'
      );
      const search = req.query['search'] as string | undefined;
      res.json(firmaService.findAll(search, page, size, sort));
    } catch (err) {
      next(err);
    }
  }
);

// GET /api/firmen/:id/personen — paginated personen for a firma
router.get(
  '/:id/personen',
  requireAuth,
  requireRole(...ROLES),
  (req: Request, res: Response, next: NextFunction): void => {
    try {
      const id = parseInt(req.params['id'], 10);
      const { page, size } = parsePaginationParams(req.query as Record<string, unknown>);
      res.json(personService.findByFirmaId(id, page, size));
    } catch (err) {
      next(err);
    }
  }
);

// GET /api/firmen/:id/abteilungen — paginated abteilungen for a firma
router.get(
  '/:id/abteilungen',
  requireAuth,
  requireRole(...ROLES),
  (req: Request, res: Response, next: NextFunction): void => {
    try {
      const id = parseInt(req.params['id'], 10);
      const { page, size } = parsePaginationParams(req.query as Record<string, unknown>);
      res.json(abteilungService.findByFirmaId(id, page, size));
    } catch (err) {
      next(err);
    }
  }
);

// GET /api/firmen/:id
router.get(
  '/:id',
  requireAuth,
  requireRole(...ROLES),
  (req: Request, res: Response, next: NextFunction): void => {
    try {
      const id = parseInt(req.params['id'], 10);
      res.json(firmaService.findById(id));
    } catch (err) {
      next(err);
    }
  }
);

// POST /api/firmen
router.post(
  '/',
  requireAuth,
  requireRole(...ROLES),
  (req: Request, res: Response, next: NextFunction): void => {
    try {
      const dto = validate(FirmaCreateSchema, req.body);
      res.status(201).json(firmaService.create(dto));
    } catch (err) {
      next(err);
    }
  }
);

// PUT /api/firmen/:id
router.put(
  '/:id',
  requireAuth,
  requireRole(...ROLES),
  (req: Request, res: Response, next: NextFunction): void => {
    try {
      const id = parseInt(req.params['id'], 10);
      const dto = validate(FirmaCreateSchema, req.body);
      res.json(firmaService.update(id, dto));
    } catch (err) {
      next(err);
    }
  }
);

// DELETE /api/firmen/:id
router.delete(
  '/:id',
  requireAuth,
  requireRole(...ROLES),
  (req: Request, res: Response, next: NextFunction): void => {
    try {
      const id = parseInt(req.params['id'], 10);
      firmaService.delete(id);
      res.status(204).send();
    } catch (err) {
      next(err);
    }
  }
);

export default router;
