import { Router, Request, Response, NextFunction } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { personService } from '../services/personService.js';
import { parsePaginationParams, parseSort } from '../utils/pagination.js';
import { validate, PersonCreateSchema } from '../utils/validation.js';

const router = Router();

// GET /api/personen/all
router.get(
  '/all',
  requireAuth,
  (_req: Request, res: Response, next: NextFunction): void => {
    try {
      res.json(personService.listAll());
    } catch (err) {
      next(err);
    }
  }
);

// GET /api/personen — paginated + search
router.get(
  '/',
  requireAuth,
  (req: Request, res: Response, next: NextFunction): void => {
    try {
      const { page, size } = parsePaginationParams(req.query as Record<string, unknown>);
      const sort = parseSort(
        req.query['sort'] as string | string[] | undefined,
        'lastName',
        'ASC',
        'person'
      );
      const search = req.query['search'] as string | undefined;
      res.json(personService.findAll(search, page, size, sort));
    } catch (err) {
      next(err);
    }
  }
);

// GET /api/personen/:id
router.get(
  '/:id',
  requireAuth,
  (req: Request, res: Response, next: NextFunction): void => {
    try {
      const id = parseInt(req.params['id'], 10);
      res.json(personService.findById(id));
    } catch (err) {
      next(err);
    }
  }
);

// POST /api/personen
router.post(
  '/',
  requireAuth,
  (req: Request, res: Response, next: NextFunction): void => {
    try {
      const dto = validate(PersonCreateSchema, req.body);
      res.status(201).json(personService.create(dto));
    } catch (err) {
      next(err);
    }
  }
);

// PUT /api/personen/:id
router.put(
  '/:id',
  requireAuth,
  (req: Request, res: Response, next: NextFunction): void => {
    try {
      const id = parseInt(req.params['id'], 10);
      const dto = validate(PersonCreateSchema, req.body);
      res.json(personService.update(id, dto));
    } catch (err) {
      next(err);
    }
  }
);

// DELETE /api/personen/:id
router.delete(
  '/:id',
  requireAuth,
  (req: Request, res: Response, next: NextFunction): void => {
    try {
      const id = parseInt(req.params['id'], 10);
      personService.delete(id);
      res.status(204).send();
    } catch (err) {
      next(err);
    }
  }
);

export default router;
