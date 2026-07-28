import { Router, Request, Response } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { abteilungService } from '../services/abteilungService.js';
import { parsePaginationParams, parseSort } from '../utils/pagination.js';
import { validate, AbteilungCreateSchema } from '../utils/validation.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const router = Router();

// GET /api/abteilungen/all
router.get(
  '/all',
  requireAuth,
  asyncHandler(async (_req: Request, res: Response) => {
    res.json(await abteilungService.listAll());
  }),
);

// GET /api/abteilungen/firma/:firmaId — non-paginated list for a firma
// MUST be before /:id to avoid collision
router.get(
  '/firma/:firmaId',
  requireAuth,
  asyncHandler(async (req: Request, res: Response) => {
    const firmaId = parseInt(req.params['firmaId'] as string, 10);
    res.json(await abteilungService.findByFirmaIdAll(firmaId));
  }),
);

// GET /api/abteilungen — paginated
router.get(
  '/',
  requireAuth,
  asyncHandler(async (req: Request, res: Response) => {
    const { page, size } = parsePaginationParams(req.query as Record<string, unknown>);
    const sort = parseSort(
      req.query['sort'] as string | string[] | undefined,
      'name',
      'ASC',
      'abteilung',
    );
    res.json(await abteilungService.findAll(page, size, sort));
  }),
);

// GET /api/abteilungen/:id/personen — paginated personen for an abteilung
router.get(
  '/:id/personen',
  requireAuth,
  asyncHandler(async (req: Request, res: Response) => {
    const id = parseInt(req.params['id'] as string, 10);
    const { page, size } = parsePaginationParams(req.query as Record<string, unknown>);
    res.json(await abteilungService.findPersonenByAbteilungId(id, page, size));
  }),
);

// GET /api/abteilungen/:id
router.get(
  '/:id',
  requireAuth,
  asyncHandler(async (req: Request, res: Response) => {
    const id = parseInt(req.params['id'] as string, 10);
    res.json(await abteilungService.findById(id));
  }),
);

// POST /api/abteilungen
router.post(
  '/',
  requireAuth,
  asyncHandler(async (req: Request, res: Response) => {
    const dto = validate(AbteilungCreateSchema, req.body);
    res.status(201).json(await abteilungService.create(dto));
  }),
);

// PUT /api/abteilungen/:id
router.put(
  '/:id',
  requireAuth,
  asyncHandler(async (req: Request, res: Response) => {
    const id = parseInt(req.params['id'] as string, 10);
    const dto = validate(AbteilungCreateSchema, req.body);
    res.json(await abteilungService.update(id, dto));
  }),
);

// DELETE /api/abteilungen/:id
router.delete(
  '/:id',
  requireAuth,
  asyncHandler(async (req: Request, res: Response) => {
    const id = parseInt(req.params['id'] as string, 10);
    await abteilungService.delete(id);
    res.status(204).send();
  }),
);

export default router;
