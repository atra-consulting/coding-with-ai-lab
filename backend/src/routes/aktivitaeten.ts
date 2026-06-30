import { Router, Request, Response } from 'express';
import { AKTIVITAET_TYP, type AktivitaetTyp } from '../db/schema/enums.js';
import { requireAuth } from '../middleware/auth.js';
import { aktivitaetService } from '../services/aktivitaetService.js';
import { parsePaginationParams, parseSort } from '../utils/pagination.js';
import { validate, AktivitaetCreateSchema } from '../utils/validation.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ValidationError } from '../utils/errors.js';

const router = Router();

// GET /api/aktivitaeten/all
router.get(
  '/all',
  requireAuth,
  asyncHandler(async (_req: Request, res: Response) => {
    res.json(await aktivitaetService.listAll());
  }),
);

// GET /api/aktivitaeten — paginated, default sort datum desc
router.get(
  '/',
  requireAuth,
  asyncHandler(async (req: Request, res: Response) => {
    const { page, size } = parsePaginationParams(req.query as Record<string, unknown>);
    const sort = parseSort(
      req.query['sort'] as string | string[] | undefined,
      'datum',
      'DESC',
      'aktivitaet',
    );
    const firmaIdRaw = parseInt(req.query['firmaId'] as string, 10);
    const firmaId = isNaN(firmaIdRaw) || firmaIdRaw <= 0 ? undefined : firmaIdRaw;
    const typRaw = req.query['typ'];
    const typStr = typeof typRaw === 'string' ? typRaw : undefined;
    if (typStr !== undefined && !(AKTIVITAET_TYP as readonly string[]).includes(typStr)) {
      throw new ValidationError('Ungültiger typ-Wert', { typ: `Erlaubte Werte: ${AKTIVITAET_TYP.join(', ')}` });
    }
    const typ = typStr as AktivitaetTyp | undefined;
    const search = typeof req.query['search'] === 'string' ? req.query['search'] : undefined;
    res.json(await aktivitaetService.findAll(page, size, sort, firmaId, typ, search));
  }),
);

// GET /api/aktivitaeten/:id
router.get(
  '/:id',
  requireAuth,
  asyncHandler(async (req: Request, res: Response) => {
    const id = parseInt(req.params['id'] as string, 10);
    res.json(await aktivitaetService.findById(id));
  }),
);

// POST /api/aktivitaeten
router.post(
  '/',
  requireAuth,
  asyncHandler(async (req: Request, res: Response) => {
    const dto = validate(AktivitaetCreateSchema, req.body);
    res.status(201).json(await aktivitaetService.create(dto));
  }),
);

// PUT /api/aktivitaeten/:id
router.put(
  '/:id',
  requireAuth,
  asyncHandler(async (req: Request, res: Response) => {
    const id = parseInt(req.params['id'] as string, 10);
    const dto = validate(AktivitaetCreateSchema, req.body);
    res.json(await aktivitaetService.update(id, dto));
  }),
);

// DELETE /api/aktivitaeten/:id
router.delete(
  '/:id',
  requireAuth,
  asyncHandler(async (req: Request, res: Response) => {
    const id = parseInt(req.params['id'] as string, 10);
    await aktivitaetService.delete(id);
    res.status(204).send();
  }),
);

export default router;
