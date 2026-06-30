import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { requireAgentToken, requireAgentTokenOrAdminSession } from '../middleware/agentAuth.js';
import { agentTaskService } from '../services/agentTaskService.js';
import { parsePaginationParams, parseSort } from '../utils/pagination.js';
import { validate } from '../utils/validation.js';
import { ValidationError } from '../utils/errors.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { AGENT_TASK_SOURCE, AGENT_TASK_STATUS } from '../db/schema/enums.js';

const router = Router();

const RejectBodySchema = z.object({
  comment: z.string().min(1),
});

const DoneBodySchema = z.object({
  comment: z.string().optional(),
});

// GET /api/agent-tasks/next
router.get(
  '/next',
  requireAgentToken,
  asyncHandler(async (req: Request, res: Response) => {
    const source = req.query['source'] as string | undefined;
    if (!source) {
      throw new ValidationError('source ist erforderlich', { source: 'source ist erforderlich' });
    }
    if (!(AGENT_TASK_SOURCE as readonly string[]).includes(source)) {
      throw new ValidationError(`Ungültige source: ${source}`, {
        source: `Ungültige source: ${source}`,
      });
    }
    const task = await agentTaskService.findNext(source);
    if (!task) {
      res.status(204).send();
      return;
    }
    res.json(task);
  }),
);

// GET /api/agent-tasks/summary
router.get(
  '/summary',
  requireAuth,
  requireRole('ADMIN'),
  asyncHandler(async (_req: Request, res: Response) => {
    res.json(await agentTaskService.getSummary());
  }),
);

// POST /api/agent-tasks/reset
router.post(
  '/reset',
  requireAuth,
  requireRole('ADMIN'),
  asyncHandler(async (_req: Request, res: Response) => {
    const count = await agentTaskService.resetAll();
    res.json({ reset: count });
  }),
);

// POST /api/agent-tasks/:id/start
router.post(
  '/:id/start',
  requireAgentToken,
  asyncHandler(async (req: Request, res: Response) => {
    const id = parseInt(req.params['id'] as string, 10);
    res.json(await agentTaskService.start(id));
  }),
);

// POST /api/agent-tasks/:id/reject
router.post(
  '/:id/reject',
  requireAgentToken,
  asyncHandler(async (req: Request, res: Response) => {
    const id = parseInt(req.params['id'] as string, 10);
    const dto = validate(RejectBodySchema, req.body);
    res.json(await agentTaskService.reject(id, dto.comment));
  }),
);

// POST /api/agent-tasks/:id/done
router.post(
  '/:id/done',
  requireAgentToken,
  asyncHandler(async (req: Request, res: Response) => {
    const id = parseInt(req.params['id'] as string, 10);
    const dto = validate(DoneBodySchema, req.body);
    res.json(await agentTaskService.done(id, dto.comment));
  }),
);

// GET /api/agent-tasks/:id
router.get(
  '/:id',
  requireAgentTokenOrAdminSession,
  asyncHandler(async (req: Request, res: Response) => {
    const id = parseInt(req.params['id'] as string, 10);
    res.json(await agentTaskService.findById(id));
  }),
);

// GET /api/agent-tasks
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
      'agentTask',
    );
    const sourceParam = req.query['source'] as string | undefined;
    const statusParam = req.query['status'] as string | undefined;

    if (sourceParam !== undefined && !(AGENT_TASK_SOURCE as readonly string[]).includes(sourceParam)) {
      throw new ValidationError(`Ungültige source: ${sourceParam}`, {
        source: `Ungültige source: ${sourceParam}`,
      });
    }
    if (statusParam !== undefined && !(AGENT_TASK_STATUS as readonly string[]).includes(statusParam)) {
      throw new ValidationError(`Ungültiger status: ${statusParam}`, {
        status: `Ungültiger status: ${statusParam}`,
      });
    }

    const filters = {
      source: sourceParam,
      status: statusParam,
    };
    res.json(await agentTaskService.findAll(filters, page, size, sort));
  }),
);

export default router;
