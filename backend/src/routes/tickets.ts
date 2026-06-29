import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { requireAgentToken, requireAgentTokenOrAdminSession } from '../middleware/agentAuth.js';
import { ticketService } from '../services/ticketService.js';
import { parsePaginationParams, parseSort } from '../utils/pagination.js';
import { validate } from '../utils/validation.js';
import { ValidationError } from '../utils/errors.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import {
  TICKET_TYPE,
  TICKET_STATUS,
  TICKET_OWNER,
} from '../db/schema/enums.js';

const router = Router();

// ─── Zod schemas ──────────────────────────────────────────────────────────────

const AskBodySchema = z.object({
  question: z.string().min(1, 'Frage ist erforderlich'),
});

const DoneBodySchema = z.object({
  comment: z.string().optional(),
});

const WontDoBodySchema = z.object({
  comment: z.string().optional(),
});

const CommentBodySchema = z.object({
  body: z.string().min(1, 'Kommentar-Text ist erforderlich'),
  handBackToAi: z.boolean().optional(),
});

const CreateBodySchema = z.object({
  type: z.enum(TICKET_TYPE, { errorMap: () => ({ message: 'Ungültiger Ticket-Typ' }) }),
  title: z.string().min(1, 'Titel ist erforderlich'),
  body: z.string().min(1, 'Beschreibung ist erforderlich'),
});

const StatusBodySchema = z.object({
  status: z.enum(TICKET_STATUS, { errorMap: () => ({ message: 'Ungültiger Status' }) }),
});

const OwnerBodySchema = z.object({
  owner: z.enum(TICKET_OWNER, { errorMap: () => ({ message: 'Ungültiger Eigentümer' }) }),
});

// ─── Agent endpoints ──────────────────────────────────────────────────────────

// GET /api/tickets/next
// Claim oldest TODO+AI ticket. Optional ?type filter.
router.get(
  '/next',
  requireAgentToken,
  asyncHandler(async (req: Request, res: Response) => {
    const typeParam = req.query['type'] as string | undefined;

    if (typeParam !== undefined && !(TICKET_TYPE as readonly string[]).includes(typeParam)) {
      throw new ValidationError(`Ungültiger Ticket-Typ: ${typeParam}`, {
        type: `Ungültiger Ticket-Typ: ${typeParam}`,
      });
    }

    const ticket = await ticketService.findNext(typeParam);
    if (!ticket) {
      res.status(204).send();
      return;
    }
    res.json(ticket);
  }),
);

// ─── Admin literal-path endpoints (must come before /:id) ─────────────────────

// GET /api/tickets/board
router.get(
  '/board',
  requireAuth,
  requireRole('ADMIN'),
  asyncHandler(async (_req: Request, res: Response) => {
    res.json(await ticketService.getBoard());
  }),
);

// GET /api/tickets/summary
router.get(
  '/summary',
  requireAuth,
  requireRole('ADMIN'),
  asyncHandler(async (_req: Request, res: Response) => {
    res.json(await ticketService.getSummary());
  }),
);

// POST /api/tickets/reset
router.post(
  '/reset',
  requireAuth,
  requireRole('ADMIN'),
  asyncHandler(async (_req: Request, res: Response) => {
    const count = await ticketService.resetAll();
    res.json({ seeded: count });
  }),
);

// GET /api/tickets
router.get(
  '/',
  requireAuth,
  requireRole('ADMIN'),
  asyncHandler(async (req: Request, res: Response) => {
    const { page, size } = parsePaginationParams(req.query as Record<string, unknown>);
    const sort = parseSort(
      req.query['sort'] as string | string[] | undefined,
      'createdAt',
      'DESC',
      'ticket',
    );

    const typeParam = req.query['type'] as string | undefined;
    const statusParam = req.query['status'] as string | undefined;
    const ownerParam = req.query['owner'] as string | undefined;

    if (typeParam !== undefined && !(TICKET_TYPE as readonly string[]).includes(typeParam)) {
      throw new ValidationError(`Ungültiger Ticket-Typ: ${typeParam}`, {
        type: `Ungültiger Ticket-Typ: ${typeParam}`,
      });
    }
    if (statusParam !== undefined && !(TICKET_STATUS as readonly string[]).includes(statusParam)) {
      throw new ValidationError(`Ungültiger Status: ${statusParam}`, {
        status: `Ungültiger Status: ${statusParam}`,
      });
    }
    if (ownerParam !== undefined && !(TICKET_OWNER as readonly string[]).includes(ownerParam)) {
      throw new ValidationError(`Ungültiger Eigentümer: ${ownerParam}`, {
        owner: `Ungültiger Eigentümer: ${ownerParam}`,
      });
    }

    const filters = { type: typeParam, status: statusParam, owner: ownerParam };
    res.json(await ticketService.findAll(filters, page, size, sort));
  }),
);

// POST /api/tickets  (create)
router.post(
  '/',
  requireAuth,
  requireRole('ADMIN'),
  asyncHandler(async (req: Request, res: Response) => {
    const dto = validate(CreateBodySchema, req.body);
    const ticket = await ticketService.create(dto);
    res.status(201).json(ticket);
  }),
);

// ─── Parameterised endpoints ──────────────────────────────────────────────────

// GET /api/tickets/:id
router.get(
  '/:id',
  requireAgentTokenOrAdminSession,
  asyncHandler(async (req: Request, res: Response) => {
    const id = parseInt(req.params['id'] as string, 10);
    res.json(await ticketService.findById(id));
  }),
);

// PATCH /api/tickets/:id/status
router.patch(
  '/:id/status',
  requireAuth,
  requireRole('ADMIN'),
  asyncHandler(async (req: Request, res: Response) => {
    const id = parseInt(req.params['id'] as string, 10);
    const dto = validate(StatusBodySchema, req.body);
    res.json(await ticketService.setStatus(id, dto.status));
  }),
);

// PATCH /api/tickets/:id/owner
router.patch(
  '/:id/owner',
  requireAuth,
  requireRole('ADMIN'),
  asyncHandler(async (req: Request, res: Response) => {
    const id = parseInt(req.params['id'] as string, 10);
    const dto = validate(OwnerBodySchema, req.body);
    res.json(await ticketService.setOwner(id, dto.owner));
  }),
);

// POST /api/tickets/:id/done  (agent)
router.post(
  '/:id/done',
  requireAgentToken,
  asyncHandler(async (req: Request, res: Response) => {
    const id = parseInt(req.params['id'] as string, 10);
    const dto = validate(DoneBodySchema, req.body);
    res.json(await ticketService.done(id, dto.comment));
  }),
);

// POST /api/tickets/:id/ask  (agent)
router.post(
  '/:id/ask',
  requireAgentToken,
  asyncHandler(async (req: Request, res: Response) => {
    const id = parseInt(req.params['id'] as string, 10);
    const dto = validate(AskBodySchema, req.body);
    res.json(await ticketService.ask(id, dto.question));
  }),
);

// POST /api/tickets/:id/wont-do  (admin only)
router.post(
  '/:id/wont-do',
  requireAuth,
  requireRole('ADMIN'),
  asyncHandler(async (req: Request, res: Response) => {
    const id = parseInt(req.params['id'] as string, 10);
    const dto = validate(WontDoBodySchema, req.body);
    res.json(await ticketService.wontDo(id, dto.comment));
  }),
);

// POST /api/tickets/:id/comments  (admin only)
router.post(
  '/:id/comments',
  requireAuth,
  requireRole('ADMIN'),
  asyncHandler(async (req: Request, res: Response) => {
    const id = parseInt(req.params['id'] as string, 10);
    const dto = validate(CommentBodySchema, req.body);
    res.json(await ticketService.addComment(id, dto.body, dto.handBackToAi));
  }),
);

export default router;
