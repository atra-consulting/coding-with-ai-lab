import { Router, Request, Response } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { personService } from '../services/personService.js';
import { parsePaginationParams, parseSort } from '../utils/pagination.js';
import { validate, PersonCreateSchema } from '../utils/validation.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const router = Router();

// GET /api/personen/all
router.get(
  '/all',
  requireAuth,
  asyncHandler(async (req: Request, res: Response) => {
    const abteilungIdRaw = parseInt(req.query['abteilungId'] as string, 10);
    const abteilungId = isNaN(abteilungIdRaw) || abteilungIdRaw <= 0 ? undefined : abteilungIdRaw;
    res.json(await personService.listAll(abteilungId));
  }),
);

// GET /api/personen — paginated + search
router.get(
  '/',
  requireAuth,
  asyncHandler(async (req: Request, res: Response) => {
    const { page, size } = parsePaginationParams(req.query as Record<string, unknown>);
    const sort = parseSort(
      req.query['sort'] as string | string[] | undefined,
      'lastName',
      'ASC',
      'person',
    );
    const search = req.query['search'] as string | undefined;
    const abteilungIdRaw = parseInt(req.query['abteilungId'] as string, 10);
    const abteilungId = isNaN(abteilungIdRaw) || abteilungIdRaw <= 0 ? undefined : abteilungIdRaw;
    res.json(await personService.findAll(search, page, size, sort, abteilungId));
  }),
);

// GET /api/personen/:id
router.get(
  '/:id',
  requireAuth,
  asyncHandler(async (req: Request, res: Response) => {
    const id = parseInt(req.params['id'] as string, 10);
    res.json(await personService.findById(id));
  }),
);

// POST /api/personen
router.post(
  '/',
  requireAuth,
  asyncHandler(async (req: Request, res: Response) => {
    const dto = validate(PersonCreateSchema, req.body);
    res.status(201).json(await personService.create(dto));
  }),
);

// PUT /api/personen/:id
router.put(
  '/:id',
  requireAuth,
  asyncHandler(async (req: Request, res: Response) => {
    const id = parseInt(req.params['id'] as string, 10);
    const dto = validate(PersonCreateSchema, req.body);
    res.json(await personService.update(id, dto));
  }),
);

// DELETE /api/personen/:id
router.delete(
  '/:id',
  requireAuth,
  asyncHandler(async (req: Request, res: Response) => {
    const id = parseInt(req.params['id'] as string, 10);
    await personService.delete(id);
    res.status(204).send();
  }),
);

export default router;
