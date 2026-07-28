import { Router, Request, Response } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { szenarioService } from '../services/szenarioService.js';
import { validate, SzenarioSchema } from '../utils/validation.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const router = Router();

// GET /api/szenarien
router.get(
  '/',
  requireAuth,
  asyncHandler(async (_req: Request, res: Response) => {
    res.json(await szenarioService.list());
  }),
);

// GET /api/szenarien/:id
router.get(
  '/:id',
  requireAuth,
  asyncHandler(async (req: Request, res: Response) => {
    const id = parseInt(req.params['id'] as string, 10);
    res.json(await szenarioService.findById(id));
  }),
);

// POST /api/szenarien
router.post(
  '/',
  requireAuth,
  asyncHandler(async (req: Request, res: Response) => {
    const dto = validate(SzenarioSchema, req.body);
    res.status(201).json(await szenarioService.create(dto));
  }),
);

// PUT /api/szenarien/:id
router.put(
  '/:id',
  requireAuth,
  asyncHandler(async (req: Request, res: Response) => {
    const id = parseInt(req.params['id'] as string, 10);
    const dto = validate(SzenarioSchema, req.body);
    res.json(await szenarioService.update(id, dto));
  }),
);

// DELETE /api/szenarien/:id
router.delete(
  '/:id',
  requireAuth,
  asyncHandler(async (req: Request, res: Response) => {
    const id = parseInt(req.params['id'] as string, 10);
    await szenarioService.delete(id);
    res.status(204).send();
  }),
);

export default router;
