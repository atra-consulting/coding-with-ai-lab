import { Router, Request, Response, NextFunction } from 'express';
import { timingSafeEqual, createHash } from 'node:crypto';

// Augment Express Request with cronTrigger so we can type it without casts
declare module 'express' {
  interface Request {
    cronTrigger?: string;
  }
}
import { requireAgentToken } from '../middleware/agentAuth.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { findById } from '../config/users.js';
import { UnauthorizedError } from '../utils/errors.js';
import { validate } from '../utils/validation.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { parsePaginationParams, parseSort } from '../utils/pagination.js';
import {
  createRun,
  recordSkip,
  markFailed,
  completeRun,
  isRunInProgress,
  listRuns,
  deriveJobsWithLastRun,
  CompleteRunBodySchema,
} from '../services/cronService.js';
import { agentTaskService } from '../services/agentTaskService.js';
import { dispatchWorkflow } from '../utils/githubDispatch.js';

const router = Router();

// ─── requireCronAuth ──────────────────────────────────────────────────────────
//
// Accepts EITHER:
//   • Path 1 (CRON):   Authorization: Bearer <CRON_SECRET> — for Vercel cron.
//                      Uses timingSafeEqual (consistent with requireAgentToken).
//                      Disabled when CRON_SECRET env var is not set.
//   • Path 2 (MANUAL): Valid admin session (userId → findById → roles includes 'ADMIN').
//                      Sets req.currentUser for downstream middleware compatibility.
//
// In both cases, (req as any).cronTrigger is set to 'CRON' or 'MANUAL'.
//
async function requireCronAuth(req: Request, _res: Response, next: NextFunction): Promise<void> {
  // ── Path 1: CRON_SECRET bearer token ──────────────────────────────────────
  const cronSecret = process.env['CRON_SECRET'];
  const authHeader = req.headers['authorization'];

  if (cronSecret && authHeader && authHeader.startsWith('Bearer ')) {
    const incoming = authHeader.slice(7);
    // Use SHA-256 hashes so both buffers are the same length (timingSafeEqual
    // requires equal-length buffers).
    const expectedHash = createHash('sha256').update(cronSecret).digest();
    const incomingHash = createHash('sha256').update(incoming).digest();

    if (timingSafeEqual(expectedHash, incomingHash)) {
      req.cronTrigger = 'CRON';
      next();
      return;
    }
  }

  // ── Path 2: Admin session ──────────────────────────────────────────────────
  const userId = req.session.userId;
  if (userId) {
    const user = findById(userId);
    if (user && user.roles.includes('ADMIN')) {
      req.currentUser = user;
      req.cronTrigger = 'MANUAL';
      next();
      return;
    }
  }

  // ── Neither path succeeded ─────────────────────────────────────────────────
  next(new UnauthorizedError('Nicht authentifiziert oder kein CRON_SECRET / Admin-Session'));
}

// ─── GET /api/cron/agent-tasks ────────────────────────────────────────────────
//
// Triggered by Vercel cron (every 10 min) or by an admin clicking "Run now".
//
// ALWAYS responds 200, even on errors — a 4xx/5xx response would cause
// Vercel cron to auto-retry the request, potentially creating duplicate
// RUNNING rows. All outcomes (SKIPPED, RUNNING+dispatched, FAILED) are
// encoded in the returned CronRunDTO.
//
router.get(
  '/agent-tasks',
  requireCronAuth as (req: Request, res: Response, next: NextFunction) => void,
  asyncHandler(async (req: Request, res: Response) => {
    const trigger = req.cronTrigger ?? 'MANUAL';

    // Single-flight guard: skip if another run is already RUNNING
    if (await isRunInProgress('solve-tasks')) {
      const run = await recordSkip('solve-tasks', trigger, 'Another run is already RUNNING');
      res.status(200).json(run);
      return;
    }

    // Skip if there are no OPEN agent tasks
    const summary = await agentTaskService.getSummary();
    const hasOpen = summary.some((s) => s.openCount > 0);
    if (!hasOpen) {
      const run = await recordSkip('solve-tasks', trigger, 'No OPEN agent tasks');
      res.status(200).json(run);
      return;
    }

    // Create the RUNNING row, then fire the GitHub dispatch
    const run = await createRun('solve-tasks', trigger);

    try {
      await dispatchWorkflow('solve-agent-tasks', { cronRunId: run.id });
      res.status(200).json(run);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      const failedRun = await markFailed(run.id, message);
      res.status(200).json(failedRun);
    }
  }),
);

// ─── GET /api/cron/github-issues ──────────────────────────────────────────────
//
// Triggered by the daily issue-runner cron or by an admin clicking
// "Issue Runner ausführen". Fires the autonomous GitHub-issue agent
// (repository_dispatch: solve-github-issues), which selects ONE issue from org
// Project board #7 and decides solve-or-pause.
//
// Unlike /agent-tasks, this endpoint cannot cheaply pre-check whether there is
// work to do — issue selection (label/Status rules) happens inside the workflow,
// which no-ops gracefully when nothing matches. So we always dispatch (subject to
// the single-flight guard) and let the workflow decide.
//
// ALWAYS responds 200 — same rationale as /agent-tasks (avoid Vercel cron retries).
//
router.get(
  '/github-issues',
  requireCronAuth as (req: Request, res: Response, next: NextFunction) => void,
  asyncHandler(async (req: Request, res: Response) => {
    const trigger = req.cronTrigger ?? 'MANUAL';

    // Single-flight guard: skip if another run is already RUNNING
    if (await isRunInProgress('solve-issues')) {
      const run = await recordSkip('solve-issues', trigger, 'Another run is already RUNNING');
      res.status(200).json(run);
      return;
    }

    // Create the RUNNING row, then fire the GitHub dispatch
    const run = await createRun('solve-issues', trigger);

    try {
      await dispatchWorkflow('solve-github-issues', { cronRunId: run.id });
      res.status(200).json(run);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      const failedRun = await markFailed(run.id, message);
      res.status(200).json(failedRun);
    }
  }),
);

// ─── POST /api/cron/runs/:id/complete ─────────────────────────────────────────
//
// Called by the GitHub Actions workflow when it finishes draining tasks.
// Protected by the same AGENT_API_TOKEN bearer token as the agent-task routes.
//
router.post(
  '/runs/:id/complete',
  requireAgentToken,
  asyncHandler(async (req: Request, res: Response) => {
    const id = parseInt(req.params['id'] as string, 10);
    const body = validate(CompleteRunBodySchema, req.body);
    const run = await completeRun(id, body);
    res.json(run);
  }),
);

// ─── GET /api/cron/runs ───────────────────────────────────────────────────────
//
// Paginated history of cron runs. Admin only.
// Query params: page, size, sort (default: startedAt,DESC), job (optional filter).
//
router.get(
  '/runs',
  requireAuth,
  requireRole('ADMIN'),
  asyncHandler(async (req: Request, res: Response) => {
    const { page, size } = parsePaginationParams(req.query as Record<string, unknown>);
    const sort = parseSort(
      req.query['sort'] as string | string[] | undefined,
      'startedAt',
      'DESC',
      'cronRun',
    );
    const job = req.query['job'] as string | undefined;
    res.json(await listRuns(job, page, size, sort));
  }),
);

// ─── GET /api/cron/jobs ───────────────────────────────────────────────────────
//
// List of all configured cron jobs with their latest run attached. Admin only.
//
router.get(
  '/jobs',
  requireAuth,
  requireRole('ADMIN'),
  asyncHandler(async (_req: Request, res: Response) => {
    res.json(await deriveJobsWithLastRun());
  }),
);

export default router;
