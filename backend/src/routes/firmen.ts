import { Router, Request, Response } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { firmaService } from '../services/firmaService.js';
import { personService } from '../services/personService.js';
import { abteilungService } from '../services/abteilungService.js';
import { parsePaginationParams, parseSort } from '../utils/pagination.js';
import { validate, FirmaCreateSchema } from '../utils/validation.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const router = Router();

// GET /api/firmen/all — non-paginated list
router.get(
  '/all',
  requireAuth,
  asyncHandler(async (_req: Request, res: Response) => {
    const favoritenOnly = _req.query['favoritenOnly'] === 'true';
    res.json(await firmaService.listAll(favoritenOnly));
  }),
);

// GET /api/firmen — paginated + search
router.get(
  '/',
  requireAuth,
  asyncHandler(async (req: Request, res: Response) => {
    const { page, size } = parsePaginationParams(req.query as Record<string, unknown>);
    const sort = parseSort(
      req.query['sort'] as string | string[] | undefined,
      'name',
      'ASC',
      'firma',
    );
    const search = req.query['search'] as string | undefined;
    const favoritenOnly = req.query['favoritenOnly'] === 'true';
    res.json(await firmaService.findAll(search, page, size, sort, favoritenOnly));
  }),
);

// GET /api/firmen/:id/personen — paginated personen for a firma
router.get(
  '/:id/personen',
  requireAuth,
  asyncHandler(async (req: Request, res: Response) => {
    const id = parseInt(req.params['id'] as string, 10);
    const { page, size } = parsePaginationParams(req.query as Record<string, unknown>);
    res.json(await personService.findByFirmaId(id, page, size));
  }),
);

// GET /api/firmen/:id/abteilungen — paginated abteilungen for a firma
router.get(
  '/:id/abteilungen',
  requireAuth,
  asyncHandler(async (req: Request, res: Response) => {
    const id = parseInt(req.params['id'] as string, 10);
    const { page, size } = parsePaginationParams(req.query as Record<string, unknown>);
    res.json(await abteilungService.findByFirmaId(id, page, size));
  }),
);

// PATCH /api/firmen/:id/favorit — toggle favorite status
router.patch(
  '/:id/favorit',
  requireAuth,
  asyncHandler(async (req: Request, res: Response) => {
    const id = parseInt(req.params['id'] as string, 10);
    res.json(await firmaService.toggleFavorit(id));
  }),
);

// GET /api/firmen/:id
router.get(
  '/:id',
  requireAuth,
  asyncHandler(async (req: Request, res: Response) => {
    const id = parseInt(req.params['id'] as string, 10);
    res.json(await firmaService.findById(id));
  }),
);

// POST /api/firmen
router.post(
  '/',
  requireAuth,
  asyncHandler(async (req: Request, res: Response) => {
    const dto = validate(FirmaCreateSchema, req.body);
    res.status(201).json(await firmaService.create(dto));
  }),
);

// PUT /api/firmen/:id
router.put(
  '/:id',
  requireAuth,
  asyncHandler(async (req: Request, res: Response) => {
    const id = parseInt(req.params['id'] as string, 10);
    const dto = validate(FirmaCreateSchema, req.body);
    res.json(await firmaService.update(id, dto));
  }),
);

// DELETE /api/firmen/:id
router.delete(
  '/:id',
  requireAuth,
  asyncHandler(async (req: Request, res: Response) => {
    const id = parseInt(req.params['id'] as string, 10);
    await firmaService.delete(id);
    res.status(204).send();
  }),
);

export default router;
