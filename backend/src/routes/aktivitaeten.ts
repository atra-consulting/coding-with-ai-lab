import { Router, Request, Response, NextFunction } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { aktivitaetService } from '../services/aktivitaetService.js';
import { parsePaginationParams, parseSort } from '../utils/pagination.js';
import { validate, AktivitaetCreateSchema } from '../utils/validation.js';

const router = Router();

// GET /api/aktivitaeten/all
router.get(
  '/all',
  requireAuth,
  (_req: Request, res: Response, next: NextFunction): void => {
    try {
      res.json(aktivitaetService.listAll());
    } catch (err) {
      next(err);
    }
  }
);

// GET /api/aktivitaeten — paginated, default sort datum desc
router.get(
  '/',
  requireAuth,
  (req: Request, res: Response, next: NextFunction): void => {
    try {
      const { page, size } = parsePaginationParams(req.query as Record<string, unknown>);
      const sort = parseSort(
        req.query['sort'] as string | string[] | undefined,
        'datum',
        'DESC',
        'aktivitaet'
      );
      res.json(aktivitaetService.findAll(page, size, sort));
    } catch (err) {
      next(err);
    }
  }
);

// GET /api/aktivitaeten/:id
router.get(
  '/:id',
  requireAuth,
  (req: Request, res: Response, next: NextFunction): void => {
    try {
      const id = parseInt(req.params['id'], 10);
      res.json(aktivitaetService.findById(id));
    } catch (err) {
      next(err);
    }
  }
);

// POST /api/aktivitaeten
router.post(
  '/',
  requireAuth,
  (req: Request, res: Response, next: NextFunction): void => {
    try {
      const dto = validate(AktivitaetCreateSchema, req.body);
      res.status(201).json(aktivitaetService.create(dto));
    } catch (err) {
      next(err);
    }
  }
);

// PUT /api/aktivitaeten/:id
router.put(
  '/:id',
  requireAuth,
  (req: Request, res: Response, next: NextFunction): void => {
    try {
      const id = parseInt(req.params['id'], 10);
      const dto = validate(AktivitaetCreateSchema, req.body);
      res.json(aktivitaetService.update(id, dto));
    } catch (err) {
      next(err);
    }
  }
);

// DELETE /api/aktivitaeten/:id
router.delete(
  '/:id',
  requireAuth,
  (req: Request, res: Response, next: NextFunction): void => {
    try {
      const id = parseInt(req.params['id'], 10);
      aktivitaetService.delete(id);
      res.status(204).send();
    } catch (err) {
      next(err);
    }
  }
);

export default router;
