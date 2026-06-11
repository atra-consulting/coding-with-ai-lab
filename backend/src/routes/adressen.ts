import { Router, Request, Response } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { adresseService } from '../services/adresseService.js';
import { parsePaginationParams, parseSort } from '../utils/pagination.js';
import { validate, AdresseCreateSchema } from '../utils/validation.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const router = Router();

// GET /api/adressen/all
router.get(
  '/all',
  requireAuth,
  asyncHandler(async (_req: Request, res: Response) => {
    res.json(await adresseService.listAll());
  }),
);

// GET /api/adressen — paginated
router.get(
  '/',
  requireAuth,
  asyncHandler(async (req: Request, res: Response) => {
    const { page, size } = parsePaginationParams(req.query as Record<string, unknown>);
    const sort = parseSort(
      req.query['sort'] as string | string[] | undefined,
      'city',
      'ASC',
      'adresse',
    );
    res.json(await adresseService.findAll(page, size, sort));
  }),
);

// GET /api/adressen/:id
router.get(
  '/:id',
  requireAuth,
  asyncHandler(async (req: Request, res: Response) => {
    const id = parseInt(req.params['id'] as string, 10);
    res.json(await adresseService.findById(id));
  }),
);

// POST /api/adressen
router.post(
  '/',
  requireAuth,
  asyncHandler(async (req: Request, res: Response) => {
    const dto = validate(AdresseCreateSchema, req.body);
    res.status(201).json(await adresseService.create(dto));
  }),
);

// PUT /api/adressen/:id
router.put(
  '/:id',
  requireAuth,
  asyncHandler(async (req: Request, res: Response) => {
    const id = parseInt(req.params['id'] as string, 10);
    const dto = validate(AdresseCreateSchema, req.body);
    res.json(await adresseService.update(id, dto));
  }),
);

// DELETE /api/adressen/:id
router.delete(
  '/:id',
  requireAuth,
  asyncHandler(async (req: Request, res: Response) => {
    const id = parseInt(req.params['id'] as string, 10);
    await adresseService.delete(id);
    res.status(204).send();
  }),
);

export default router;
