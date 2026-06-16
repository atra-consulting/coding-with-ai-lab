/**
 * Playwright API tests for the cron routes.
 *
 * Covers:
 *   GET  /api/cron/agent-tasks         — auth gates, manual tick (FAILED dispatch / SKIPPED), single-flight, orphan expiry
 *   POST /api/cron/runs/:id/complete   — happy path, 404, 400 validation
 *   GET  /api/cron/runs                — auth gates, Spring-Page shape
 *   GET  /api/cron/jobs                — auth gate, shape, solve-tasks entry
 *
 * Authorization matrix:
 *   GET  /api/cron/agent-tasks         — requireCronAuth: CRON_SECRET bearer OR admin session
 *   POST /api/cron/runs/:id/complete   — requireAgentToken (AGENT_API_TOKEN bearer)
 *   GET  /api/cron/runs                — requireAuth + requireRole('ADMIN')
 *   GET  /api/cron/jobs                — requireAuth + requireRole('ADMIN')
 *
 * Env-variable notes:
 *   CRON_SECRET is NOT set by globalSetup. The cron bearer-auth path is therefore
 *   always disabled; MANUAL (admin session) is the only working auth path for
 *   GET /api/cron/agent-tasks in these tests.
 *
 *   GH_DISPATCH_TOKEN is NOT set. When OPEN tasks exist and the tick proceeds to
 *   dispatch, dispatchWorkflow() throws → the run is recorded as FAILED.
 *   This is the deterministic "tick proceeds" path asserted below.
 *
 * Cleanup strategy:
 *   resetDatabase() is called in each beforeAll/beforeEach that needs a clean
 *   agent_task state. Because resetDatabase() does NOT touch cron_run rows we
 *   delete them explicitly in suites that insert or trigger them.
 */
import { test, expect, request as playwrightRequest, type APIRequestContext } from '@playwright/test';
import { resetDatabase, loginCtx } from './helpers.js';
import { client } from '../config/db.js';
import { createRun } from '../services/cronService.js';
import { TEST_AGENT_TOKEN } from './globalSetup.js';

const BASE_URL = 'http://localhost:7070';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface CronRunDTO {
  id: number;
  job: string;
  status: string;
  trigger: string;
  startedAt: string;
  finishedAt: string | null;
  durationMs: number | null;
  result: string | null;
  githubRunUrl: string | null;
  error: string | null;
}

interface PageResult<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
  first: boolean;
  last: boolean;
}

interface CronJobWithLastRun {
  name: string;
  schedule: string;
  description: string;
  dispatchEventType: string;
  lastRun: CronRunDTO | null;
}

// ---------------------------------------------------------------------------
// Shared context factories
// ---------------------------------------------------------------------------

/** Anonymous context — no session, no token. */
async function anonCtx(): Promise<APIRequestContext> {
  return playwrightRequest.newContext({ baseURL: BASE_URL });
}

/** Agent context — carries the AGENT_API_TOKEN bearer token used by /runs/:id/complete. */
async function agentCtx(): Promise<APIRequestContext> {
  return playwrightRequest.newContext({
    baseURL: BASE_URL,
    extraHTTPHeaders: { Authorization: `Bearer ${TEST_AGENT_TOKEN}` },
  });
}

// ---------------------------------------------------------------------------
// DB helpers (used in test setup)
// ---------------------------------------------------------------------------

/** Delete all rows from cron_run. Returns the count deleted. */
async function clearCronRuns(): Promise<void> {
  await client.execute({ sql: 'DELETE FROM cron_run', args: [] });
}

// ---------------------------------------------------------------------------
// Suite 1: Auth gates
// ---------------------------------------------------------------------------

test.describe('Auth gates', () => {
  let admin: APIRequestContext;
  let user: APIRequestContext;
  let anon: APIRequestContext;
  let agent: APIRequestContext;

  test.beforeAll(async () => {
    admin = await loginCtx('admin', 'admin123');
    user = await loginCtx('user', 'test123');
    anon = await anonCtx();
    agent = await agentCtx();
  });

  test.afterAll(async () => {
    await admin.dispose();
    await user.dispose();
    await anon.dispose();
    await agent.dispose();
  });

  // ── GET /api/cron/agent-tasks ─────────────────────────────────────────────

  test('GET /api/cron/agent-tasks: no CRON_SECRET header + no admin session → 401', async () => {
    // CRON_SECRET is unset in test env, so the bearer path never succeeds.
    // anon has neither a session cookie nor any Authorization header.
    const resp = await anon.get('/api/cron/agent-tasks');
    expect(resp.status()).toBe(401);
  });

  // ── POST /api/cron/runs/:id/complete ─────────────────────────────────────

  test('POST /api/cron/runs/1/complete: no agent token → 401', async () => {
    const resp = await anon.post('/api/cron/runs/1/complete', {
      data: {
        status: 'SUCCESS',
        tasksSolved: 0,
        tasksRejected: 0,
        githubRunUrl: 'https://github.com/x/y/actions/runs/1',
      },
    });
    expect(resp.status()).toBe(401);
  });

  // ── GET /api/cron/runs ────────────────────────────────────────────────────

  test('GET /api/cron/runs: anonymous → 401', async () => {
    const resp = await anon.get('/api/cron/runs');
    expect(resp.status()).toBe(401);
  });

  test('GET /api/cron/runs: user session (no ADMIN role) → 403', async () => {
    // `user` holds only the USER role, not ADMIN.
    const resp = await user.get('/api/cron/runs');
    expect(resp.status()).toBe(403);
  });

  // ── GET /api/cron/jobs ────────────────────────────────────────────────────

  test('GET /api/cron/jobs: anonymous → 401', async () => {
    const resp = await anon.get('/api/cron/jobs');
    expect(resp.status()).toBe(401);
  });

  test('GET /api/cron/jobs: user session (no ADMIN role) → 403', async () => {
    const resp = await user.get('/api/cron/jobs');
    expect(resp.status()).toBe(403);
  });
});

// ---------------------------------------------------------------------------
// Suite 2: Manual tick — deterministic FAILED path (OPEN tasks exist, no GH token)
// ---------------------------------------------------------------------------
//
// DECISION: We assert the FAILED dispatch path.
//
// Rationale: After resetDatabase() the fixture seeds 16 OPEN agent tasks (4 per
// source). GH_DISPATCH_TOKEN is unset in the test env. When the tick finds OPEN
// tasks it creates a RUNNING row and fires dispatchWorkflow(), which throws
// immediately. The run is then recorded as FAILED. This is deterministic and
// requires no extra setup — no need to drain tasks first.
//
test.describe('Manual tick — FAILED dispatch path', () => {
  let admin: APIRequestContext;

  test.beforeAll(async () => {
    await resetDatabase();
    await clearCronRuns();
    admin = await loginCtx('admin', 'admin123');
  });

  test.afterAll(async () => {
    await clearCronRuns();
    await admin.dispose();
  });

  test('admin session GET /api/cron/agent-tasks → 200 with cron_run object', async () => {
    const resp = await admin.get('/api/cron/agent-tasks');

    await test.step('HTTP status is 200 (always — Vercel cron contract)', () => {
      // The route always returns 200 regardless of outcome so Vercel does not
      // auto-retry on error. The actual outcome lives in the cron_run object.
      expect(resp.status()).toBe(200);
    });

    const body = await resp.json() as CronRunDTO;

    await test.step('response has a numeric id', () => {
      expect(typeof body.id).toBe('number');
      expect(body.id).toBeGreaterThan(0);
    });

    await test.step('job is solve-tasks', () => {
      expect(body.job).toBe('solve-tasks');
    });

    await test.step('trigger is MANUAL (admin session path)', () => {
      expect(body.trigger).toBe('MANUAL');
    });

    await test.step('startedAt is an ISO-8601 string', () => {
      expect(typeof body.startedAt).toBe('string');
      expect(body.startedAt.length).toBeGreaterThan(0);
    });
  });

  test('run status is FAILED (dispatch throws because GH_DISPATCH_TOKEN is unset)', async () => {
    // Re-use same endpoint — it will be skipped this time if a RUNNING run from
    // the previous test is still alive; however markFailed() is synchronous, so
    // by the time the first test returned the run is already FAILED. A fresh
    // call will therefore NOT be skipped and will again end up FAILED.
    const resp = await admin.get('/api/cron/agent-tasks');
    expect(resp.status()).toBe(200);

    const body = await resp.json() as CronRunDTO;

    await test.step('status is FAILED', () => {
      expect(body.status).toBe('FAILED');
    });

    await test.step('finishedAt is set', () => {
      expect(typeof body.finishedAt).toBe('string');
      expect((body.finishedAt as string).length).toBeGreaterThan(0);
    });

    await test.step('error field contains a message', () => {
      expect(typeof body.error).toBe('string');
      expect((body.error as string).length).toBeGreaterThan(0);
    });
  });
});

// ---------------------------------------------------------------------------
// Suite 3: Single-flight SKIP — a RUNNING row blocks a second tick
// ---------------------------------------------------------------------------

test.describe('Manual tick — single-flight SKIP', () => {
  let admin: APIRequestContext;
  let runningRunId: number;

  test.beforeAll(async () => {
    await clearCronRuns();
    admin = await loginCtx('admin', 'admin123');

    // Insert a RUNNING row directly via the service so the tick sees it in-flight.
    // createRun() uses the live DB client — same connection the backend uses —
    // so the row is immediately visible to the next request.
    const run = await createRun('solve-tasks', 'CRON');
    runningRunId = run.id;
  });

  test.afterAll(async () => {
    await clearCronRuns();
    await admin.dispose();
  });

  test('tick while a RUNNING row exists → 200 with status SKIPPED', async () => {
    const resp = await admin.get('/api/cron/agent-tasks');
    expect(resp.status()).toBe(200);

    const body = await resp.json() as CronRunDTO;

    await test.step('status is SKIPPED', () => {
      expect(body.status).toBe('SKIPPED');
    });

    await test.step('job is solve-tasks', () => {
      expect(body.job).toBe('solve-tasks');
    });

    await test.step('trigger is MANUAL', () => {
      expect(body.trigger).toBe('MANUAL');
    });

    await test.step('result contains skipReason', () => {
      // result is JSON: { "skipReason": "Another run is already RUNNING" }
      expect(typeof body.result).toBe('string');
      const parsed = JSON.parse(body.result as string) as { skipReason: string };
      expect(typeof parsed.skipReason).toBe('string');
      expect(parsed.skipReason.length).toBeGreaterThan(0);
    });
  });

  test('the original RUNNING row id is still the one we inserted', () => {
    // Just a guard to confirm setup was correct.
    expect(runningRunId).toBeGreaterThan(0);
  });
});

// ---------------------------------------------------------------------------
// Suite 4: Orphan/staleness guard
// ---------------------------------------------------------------------------
//
// A RUNNING row whose startedAt is > 30 minutes in the past must be expired
// (FAILED with "Orphaned" error) by the next tick. The tick must then NOT be
// SKIPPED — it proceeds to dispatch (which fails without a GH token → FAILED).
//
test.describe('Orphan / staleness guard', () => {
  let admin: APIRequestContext;

  test.beforeAll(async () => {
    await resetDatabase(); // ensure OPEN tasks exist so the tick proceeds
    await clearCronRuns();
    admin = await loginCtx('admin', 'admin123');

    // Insert a RUNNING row with startedAt 31 minutes ago (past the 30-min cutoff).
    const staleStart = new Date(Date.now() - 31 * 60 * 1000).toISOString();
    await client.execute({
      sql: `INSERT INTO cron_run (job, status, "trigger", startedAt)
            VALUES ('solve-tasks', 'RUNNING', 'CRON', ?)`,
      args: [staleStart],
    });
  });

  test.afterAll(async () => {
    await clearCronRuns();
    await admin.dispose();
  });

  test('tick expires the stale RUNNING row and does not return SKIPPED', async () => {
    const resp = await admin.get('/api/cron/agent-tasks');
    expect(resp.status()).toBe(200);

    const body = await resp.json() as CronRunDTO;

    await test.step('tick result is NOT SKIPPED (stale row was expired)', () => {
      // The orphan guard runs inside isRunInProgress(), which expires old rows
      // before counting active ones. So the stale row is already FAILED by the
      // time the count query runs, and the tick proceeds.
      expect(body.status).not.toBe('SKIPPED');
    });

    await test.step('tick result is FAILED (no GH token)', () => {
      // With OPEN tasks and no GH_DISPATCH_TOKEN the dispatch throws → FAILED.
      expect(body.status).toBe('FAILED');
    });
  });

  test('the previously-RUNNING stale row is now FAILED (not RUNNING)', async () => {
    // Verify directly in the DB that the orphan was expired.
    const result = await client.execute({
      sql: `SELECT COUNT(*) AS cnt FROM cron_run WHERE status = 'RUNNING' AND job = 'solve-tasks'`,
      args: [],
    });
    const row = result.rows[0] as unknown as { cnt: number };

    expect(Number(row.cnt)).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// Suite 5: POST /api/cron/runs/:id/complete
// ---------------------------------------------------------------------------

test.describe('POST /api/cron/runs/:id/complete', () => {
  let agent: APIRequestContext;
  let runId: number;

  test.beforeAll(async () => {
    await clearCronRuns();
    agent = await agentCtx();

    // Insert a fresh RUNNING row to complete in the happy-path test.
    const run = await createRun('solve-tasks', 'CRON');
    runId = run.id;
  });

  test.afterAll(async () => {
    await clearCronRuns();
    await agent.dispose();
  });

  test('happy path: complete a RUNNING run → 200 with SUCCESS status and all fields', async () => {
    const resp = await agent.post(`/api/cron/runs/${runId}/complete`, {
      data: {
        status: 'SUCCESS',
        tasksSolved: 2,
        tasksRejected: 1,
        githubRunUrl: 'https://github.com/x/y/actions/runs/1',
      },
    });

    await test.step('HTTP status 200', () => {
      expect(resp.status()).toBe(200);
    });

    const body = await resp.json() as CronRunDTO;

    await test.step('run status is SUCCESS', () => {
      expect(body.status).toBe('SUCCESS');
    });

    await test.step('finishedAt is a non-empty string', () => {
      expect(typeof body.finishedAt).toBe('string');
      expect((body.finishedAt as string).length).toBeGreaterThan(0);
    });

    await test.step('durationMs is a non-negative number', () => {
      expect(typeof body.durationMs).toBe('number');
      expect(body.durationMs as number).toBeGreaterThanOrEqual(0);
    });

    await test.step('result contains tasksSolved and tasksRejected', () => {
      expect(typeof body.result).toBe('string');
      const parsed = JSON.parse(body.result as string) as {
        tasksSolved: number;
        tasksRejected: number;
      };
      expect(parsed.tasksSolved).toBe(2);
      expect(parsed.tasksRejected).toBe(1);
    });

    await test.step('githubRunUrl matches the submitted value', () => {
      expect(body.githubRunUrl).toBe('https://github.com/x/y/actions/runs/1');
    });

    await test.step('id matches the run we created', () => {
      expect(body.id).toBe(runId);
    });
  });

  test('unknown id (999999) → 404', async () => {
    const resp = await agent.post('/api/cron/runs/999999/complete', {
      data: {
        status: 'SUCCESS',
        tasksSolved: 0,
        tasksRejected: 0,
        githubRunUrl: 'https://github.com/x/y/actions/runs/1',
      },
    });
    expect(resp.status()).toBe(404);
  });

  test('missing required field githubRunUrl → 400', async () => {
    // Create a fresh run so we have a valid id; the validation failure happens
    // before the DB update so the run remains RUNNING after this call.
    const newRun = await createRun('solve-tasks', 'CRON');

    const resp = await agent.post(`/api/cron/runs/${newRun.id}/complete`, {
      data: {
        status: 'SUCCESS',
        tasksSolved: 0,
        tasksRejected: 0,
        // githubRunUrl intentionally omitted
      },
    });

    await test.step('HTTP status 400', () => {
      expect(resp.status()).toBe(400);
    });

    const body = await resp.json() as {
      status: number;
      message: string;
      timestamp: string;
      fieldErrors: Record<string, string>;
    };

    await test.step('fieldErrors is present', () => {
      expect(typeof body.fieldErrors).toBe('object');
      expect(body.fieldErrors).not.toBeNull();
    });
  });

  test('invalid status value → 400 with fieldErrors', async () => {
    const newRun = await createRun('solve-tasks', 'CRON');

    const resp = await agent.post(`/api/cron/runs/${newRun.id}/complete`, {
      data: {
        status: 'NOPE', // not SUCCESS or FAILED
        tasksSolved: 0,
        tasksRejected: 0,
        githubRunUrl: 'https://github.com/x/y/actions/runs/2',
      },
    });

    await test.step('HTTP status 400', () => {
      expect(resp.status()).toBe(400);
    });

    const body = await resp.json() as {
      status: number;
      fieldErrors: Record<string, string>;
    };

    await test.step('fieldErrors is present', () => {
      expect(typeof body.fieldErrors).toBe('object');
      expect(body.fieldErrors).not.toBeNull();
    });
  });
});

// ---------------------------------------------------------------------------
// Suite 6a: GET /api/cron/runs — Spring-Page shape
// ---------------------------------------------------------------------------

test.describe('GET /api/cron/runs', () => {
  let admin: APIRequestContext;

  test.beforeAll(async () => {
    await clearCronRuns();
    // Seed a couple of runs so the list is non-empty.
    await createRun('solve-tasks', 'MANUAL');
    await createRun('solve-tasks', 'CRON');
    admin = await loginCtx('admin', 'admin123');
  });

  test.afterAll(async () => {
    await clearCronRuns();
    await admin.dispose();
  });

  test('admin session → 200 with valid Spring-Page shape', async () => {
    const resp = await admin.get('/api/cron/runs');
    expect(resp.status()).toBe(200);

    const body = await resp.json() as PageResult<CronRunDTO>;

    await test.step('content is an array', () => {
      expect(Array.isArray(body.content)).toBe(true);
    });

    await test.step('totalElements is a non-negative integer', () => {
      expect(Number.isInteger(body.totalElements)).toBe(true);
      expect(body.totalElements).toBeGreaterThanOrEqual(0);
    });

    await test.step('totalPages is a positive integer', () => {
      expect(Number.isInteger(body.totalPages)).toBe(true);
      expect(body.totalPages).toBeGreaterThan(0);
    });

    await test.step('size is a positive integer', () => {
      expect(Number.isInteger(body.size)).toBe(true);
      expect(body.size).toBeGreaterThan(0);
    });

    await test.step('number is 0 (first page, 0-indexed)', () => {
      expect(body.number).toBe(0);
    });

    await test.step('first is true', () => {
      expect(body.first).toBe(true);
    });

    await test.step('last field is a boolean', () => {
      expect(typeof body.last).toBe('boolean');
    });

    await test.step('totalElements reflects the seeded runs (at least 2)', () => {
      expect(body.totalElements).toBeGreaterThanOrEqual(2);
    });
  });

  test('content rows have expected CronRunDTO fields', async () => {
    const resp = await admin.get('/api/cron/runs');
    const body = await resp.json() as PageResult<CronRunDTO>;
    const first = body.content[0];

    await test.step('id is a positive number', () => {
      expect(typeof first.id).toBe('number');
      expect(first.id).toBeGreaterThan(0);
    });

    await test.step('job is solve-tasks', () => {
      expect(first.job).toBe('solve-tasks');
    });

    await test.step('status is a string', () => {
      expect(typeof first.status).toBe('string');
    });

    await test.step('trigger is a string', () => {
      expect(typeof first.trigger).toBe('string');
    });

    await test.step('startedAt is a non-empty string', () => {
      expect(typeof first.startedAt).toBe('string');
      expect(first.startedAt.length).toBeGreaterThan(0);
    });
  });
});

// ---------------------------------------------------------------------------
// Suite 6b: GET /api/cron/jobs — job-level view
// ---------------------------------------------------------------------------

test.describe('GET /api/cron/jobs', () => {
  let admin: APIRequestContext;

  test.beforeAll(async () => {
    await clearCronRuns();
    admin = await loginCtx('admin', 'admin123');
  });

  test.afterAll(async () => {
    await clearCronRuns();
    await admin.dispose();
  });

  test('admin session → 200 with an array containing the solve-tasks job', async () => {
    const resp = await admin.get('/api/cron/jobs');
    expect(resp.status()).toBe(200);

    const body = await resp.json() as CronJobWithLastRun[];

    await test.step('body is an array', () => {
      expect(Array.isArray(body)).toBe(true);
    });

    await test.step('array contains at least one entry', () => {
      expect(body.length).toBeGreaterThanOrEqual(1);
    });

    const solveJob = body.find((j) => j.name === 'solve-tasks');

    await test.step('solve-tasks entry is present', () => {
      expect(solveJob).toBeDefined();
    });

    await test.step('solve-tasks has a schedule string', () => {
      expect(typeof solveJob!.schedule).toBe('string');
      expect(solveJob!.schedule.length).toBeGreaterThan(0);
    });

    await test.step('solve-tasks has a description string', () => {
      expect(typeof solveJob!.description).toBe('string');
    });

    await test.step('solve-tasks has a dispatchEventType string', () => {
      expect(typeof solveJob!.dispatchEventType).toBe('string');
    });

    await test.step('lastRun is null (no runs seeded)', () => {
      // We cleared cron_run in beforeAll so no runs exist yet.
      expect(solveJob!.lastRun).toBeNull();
    });
  });

  test('lastRun is populated after a run exists', async () => {
    // Insert a run, then re-fetch.
    const run = await createRun('solve-tasks', 'MANUAL');

    const resp = await admin.get('/api/cron/jobs');
    expect(resp.status()).toBe(200);

    const body = await resp.json() as CronJobWithLastRun[];
    const solveJob = body.find((j) => j.name === 'solve-tasks');

    await test.step('lastRun is not null', () => {
      expect(solveJob!.lastRun).not.toBeNull();
    });

    await test.step('lastRun.id matches the run we inserted', () => {
      expect(solveJob!.lastRun!.id).toBe(run.id);
    });

    await test.step('lastRun.status is RUNNING', () => {
      expect(solveJob!.lastRun!.status).toBe('RUNNING');
    });
  });
});
