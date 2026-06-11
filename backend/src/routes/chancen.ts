import { Router, Request, Response } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { chanceService } from '../services/chanceService.js';
import { parsePaginationParams, parseSort } from '../utils/pagination.js';
import { validate, ChanceCreateSchema } from '../utils/validation.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const router = Router();

// GET /api/chancen/all
router.get(
  '/all',
  requireAuth,
  asyncHandler(async (_req: Request, res: Response) => {
    res.json(await chanceService.listAll());
  }),
);

// GET /api/chancen — paginated
router.get(
  '/',
  requireAuth,
  asyncHandler(async (req: Request, res: Response) => {
    const { page, size } = parsePaginationParams(req.query as Record<string, unknown>);
    const sort = parseSort(
      req.query['sort'] as string | string[] | undefined,
      'createdAt',
      'DESC',
      'chance',
    );
    res.json(await chanceService.findAll(page, size, sort));
  }),
);

// GET /api/chancen/:id
router.get(
  '/:id',
  requireAuth,
  asyncHandler(async (req: Request, res: Response) => {
    const id = parseInt(req.params['id'] as string, 10);
    res.json(await chanceService.findById(id));
  }),
);

// POST /api/chancen
router.post(
  '/',
  requireAuth,
  asyncHandler(async (req: Request, res: Response) => {
    const dto = validate(ChanceCreateSchema, req.body);
    res.status(201).json(await chanceService.create(dto));
  }),
);

// PUT /api/chancen/:id
router.put(
  '/:id',
  requireAuth,
  asyncHandler(async (req: Request, res: Response) => {
    const id = parseInt(req.params['id'] as string, 10);
    const dto = validate(ChanceCreateSchema, req.body);
    res.json(await chanceService.update(id, dto));
  }),
);

// DELETE /api/chancen/:id
router.delete(
  '/:id',
  requireAuth,
  asyncHandler(async (req: Request, res: Response) => {
    const id = parseInt(req.params['id'] as string, 10);
    await chanceService.delete(id);
    res.status(204).send();
  }),
);

export default router;
