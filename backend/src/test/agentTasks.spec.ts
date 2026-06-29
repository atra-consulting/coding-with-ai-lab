/**
 * Playwright API tests for the agent-tasks routes.
 *
 * Covers (Phase 6 / PRD-AUTONOMOUS-TASK-SOURCES):
 *   GET  /api/agent-tasks/next       — happy path, drain source, validation
 *   POST /api/agent-tasks/:id/reject — happy path, validation, conflict states
 *   POST /api/agent-tasks/:id/done   — happy path, conflict states
 *   GET  /api/agent-tasks            — pagination, role auth
 *   GET  /api/agent-tasks/summary    — shape, role auth
 *   POST /api/agent-tasks/reset      — resets all to OPEN, role auth
 *
 * Authorization matrix:
 *   - Agent endpoints (/next, /:id/reject, /:id/done): require Bearer token
 *   - Admin session endpoints (/list, /summary, /reset): require ADMIN role
 *   - user (test123) has USER role only → 403 on admin endpoints
 *
 * NOTE: The "unset AGENT_API_TOKEN → 401" case requires a backend started
 * without the env var.  That is not testable in this suite because the token
 * is set globally via globalSetup.  A separate integration run or a manual
 * check is required for that path.
 *
 * Fixture ids (from fixture.json):
 *   EMAIL        → ids 1-4
 *   GITHUB_ISSUE → ids 5-8
 *   APP_LOG      → ids 9-12
 *   ERROR_REPORT → ids 13-16
 */
import { test, expect, request as playwrightRequest, type APIRequestContext } from '@playwright/test';
import { resetDatabase, loginCtx } from './helpers.js';
import { TEST_AGENT_TOKEN } from './globalSetup.js';

const BASE_URL = 'http://localhost:7070';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface AgentTaskDTO {
  id: number;
  source: string;
  title: string;
  body: string;
  status: string;
  comment: string | null;
  metadata: string | null;
  pickedUpAt: string | null;
  resolvedAt: string | null;
  createdAt: string;
  updatedAt: string;
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

interface SummaryDTO {
  source: string;
  openCount: number;
  inProgressCount: number;
  doneCount: number;
  rejectedCount: number;
}

interface ErrorBody {
  status: number;
  message: string;
  timestamp: string;
  fieldErrors: Record<string, string>;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Create a plain (no-session) context pre-configured with the agent Bearer token. */
async function agentCtx(): Promise<APIRequestContext> {
  return playwrightRequest.newContext({
    baseURL: BASE_URL,
    extraHTTPHeaders: { Authorization: `Bearer ${TEST_AGENT_TOKEN}` },
  });
}

/** Create a plain anonymous context with no credentials. */
async function anonCtx(): Promise<APIRequestContext> {
  return playwrightRequest.newContext({ baseURL: BASE_URL });
}

/** Create a context using an obviously wrong Bearer token. */
async function wrongTokenCtx(): Promise<APIRequestContext> {
  return playwrightRequest.newContext({
    baseURL: BASE_URL,
    extraHTTPHeaders: { Authorization: 'Bearer wrong-token-999' },
  });
}

// ---------------------------------------------------------------------------
// Suite: GET /api/agent-tasks/next
// ---------------------------------------------------------------------------

test.describe('GET /api/agent-tasks/next', () => {
  let agent: APIRequestContext;
  let anon: APIRequestContext;
  let wrong: APIRequestContext;

  test.beforeAll(async () => {
    await resetDatabase();
    agent = await agentCtx();
    anon = await anonCtx();
    wrong = await wrongTokenCtx();
  });

  test.afterAll(async () => {
    await agent.dispose();
    await anon.dispose();
    await wrong.dispose();
  });

  test('valid token + source=EMAIL → 200, status IN_PROGRESS, source EMAIL, pickedUpAt set', async () => {
    const resp = await agent.get('/api/agent-tasks/next?source=EMAIL');

    await test.step('status 200', () => {
      expect(resp.status()).toBe(200);
    });

    const body = await resp.json() as AgentTaskDTO;

    await test.step('task status is IN_PROGRESS', () => {
      expect(body.status).toBe('IN_PROGRESS');
    });

    await test.step('task source is EMAIL', () => {
      expect(body.source).toBe('EMAIL');
    });

    await test.step('pickedUpAt is a non-empty string', () => {
      expect(typeof body.pickedUpAt).toBe('string');
      expect((body.pickedUpAt as string).length).toBeGreaterThan(0);
    });

    await test.step('id is a positive integer', () => {
      expect(typeof body.id).toBe('number');
      expect(body.id).toBeGreaterThan(0);
    });
  });

  test('repeated calls return distinct EMAIL tasks; after all 4 claimed → 204', async () => {
    // Reset so we start fresh with 4 OPEN EMAIL tasks (ids 1-4)
    await resetDatabase();

    const ids: number[] = [];
    for (let i = 0; i < 4; i++) {
      const resp = await agent.get('/api/agent-tasks/next?source=EMAIL');

      await test.step(`call ${i + 1} returns 200`, () => {
        expect(resp.status()).toBe(200);
      });

      const body = await resp.json() as AgentTaskDTO;
      ids.push(body.id);
    }

    await test.step('all 4 ids are distinct', () => {
      const unique = new Set(ids);
      expect(unique.size).toBe(4);
    });

    // 5th call: no OPEN EMAIL tasks remain → 204
    const exhaustedResp = await agent.get('/api/agent-tasks/next?source=EMAIL');
    await test.step('5th call returns 204 (no content)', () => {
      expect(exhaustedResp.status()).toBe(204);
    });
  });

  test('missing source param → 400 with fieldErrors.source', async () => {
    const resp = await agent.get('/api/agent-tasks/next');

    await test.step('status 400', () => {
      expect(resp.status()).toBe(400);
    });

    const body = await resp.json() as ErrorBody;

    await test.step('fieldErrors.source is present', () => {
      expect(typeof body.fieldErrors?.['source']).toBe('string');
    });
  });

  test('unknown source value → 400 with fieldErrors.source', async () => {
    const resp = await agent.get('/api/agent-tasks/next?source=NOPE');

    await test.step('status 400', () => {
      expect(resp.status()).toBe(400);
    });

    const body = await resp.json() as ErrorBody;

    await test.step('fieldErrors.source is present', () => {
      expect(typeof body.fieldErrors?.['source']).toBe('string');
    });
  });

  test('no auth header from localhost → 200 (localhost bypass)', async () => {
    // Prior tests exhaust all EMAIL tasks; reset so one is available.
    await resetDatabase();
    const resp = await anon.get('/api/agent-tasks/next?source=EMAIL');
    expect(resp.status()).toBe(200);
  });

  test('wrong Bearer token → 401', async () => {
    const resp = await wrong.get('/api/agent-tasks/next?source=EMAIL');
    expect(resp.status()).toBe(401);
  });

  test('no token + X-Forwarded-For header from localhost → 401 (bypass refused, proxy header present)', async () => {
    // Even from loopback, the bypass is refused when a forwarding header is present.
    // No resetDatabase() needed: requireAgentToken fires before any DB query,
    // so 401 is returned regardless of whether tasks remain.
    const proxyCtx = await playwrightRequest.newContext({
      baseURL: BASE_URL,
      extraHTTPHeaders: { 'X-Forwarded-For': '10.0.0.1' },
    });
    try {
      const resp = await proxyCtx.get('/api/agent-tasks/next?source=EMAIL');
      expect(resp.status()).toBe(401);
    } finally {
      await proxyCtx.dispose();
    }
  });
});

// ---------------------------------------------------------------------------
// Suite: GET /api/agent-tasks/:id
// ---------------------------------------------------------------------------

test.describe('GET /api/agent-tasks/:id', () => {
  let agent: APIRequestContext;
  let anon: APIRequestContext;
  let admin: APIRequestContext;
  let user: APIRequestContext;

  test.beforeEach(async () => {
    await resetDatabase();
    agent = await agentCtx();
    anon = await anonCtx();
    admin = await loginCtx('admin', 'admin123');
    user = await loginCtx('user', 'test123');
  });

  test.afterEach(async () => {
    await agent.dispose();
    await anon.dispose();
    await admin.dispose();
    await user.dispose();
  });

  test('agent token → 200 with task body', async () => {
    const resp = await agent.get('/api/agent-tasks/1');
    expect(resp.status()).toBe(200);
    const body = await resp.json() as AgentTaskDTO;
    expect(body.id).toBe(1);
    expect(typeof body.source).toBe('string');
    expect(typeof body.title).toBe('string');
  });

  test('admin session → 200 with task body', async () => {
    const resp = await admin.get('/api/agent-tasks/1');
    expect(resp.status()).toBe(200);
    const body = await resp.json() as AgentTaskDTO;
    expect(body.id).toBe(1);
  });

  test('no token from localhost → 200 (loopback bypass)', async () => {
    const resp = await anon.get('/api/agent-tasks/1');
    expect(resp.status()).toBe(200);
  });

  test('USER role from localhost → 200 (loopback bypass, no auth header)', async () => {
    const resp = await user.get('/api/agent-tasks/1');
    expect(resp.status()).toBe(200);
  });

  test('wrong token → 401', async () => {
    const wrong = await wrongTokenCtx();
    const resp = await wrong.get('/api/agent-tasks/1');
    expect(resp.status()).toBe(401);
    await wrong.dispose();
  });

  test('USER session with X-Forwarded-For (loopback bypass disabled) → 403', async () => {
    // Simulates a non-loopback request: bypass fires only when no forwarding header is present.
    const resp = await user.get('/api/agent-tasks/1', {
      headers: { 'X-Forwarded-For': '10.0.0.1' },
    });
    expect(resp.status()).toBe(403);
  });

  test('unknown id → 404', async () => {
    const resp = await agent.get('/api/agent-tasks/99999');
    expect(resp.status()).toBe(404);
  });
});

// ---------------------------------------------------------------------------
// Suite: POST /api/agent-tasks/:id/reject
// ---------------------------------------------------------------------------

test.describe('POST /api/agent-tasks/:id/reject', () => {
  let agent: APIRequestContext;
  let anon: APIRequestContext;
  let wrong: APIRequestContext;

  test.beforeEach(async () => {
    await resetDatabase();
    agent = await agentCtx();
    anon = await anonCtx();
    wrong = await wrongTokenCtx();
  });

  test.afterEach(async () => {
    await agent.dispose();
    await anon.dispose();
    await wrong.dispose();
  });

  test('reject an OPEN task → 200, status REJECTED, comment stored, resolvedAt set', async () => {
    // Use task id 1 (EMAIL, OPEN after reset)
    const resp = await agent.post('/api/agent-tasks/1/reject', {
      data: { comment: 'Task is outside scope' },
    });

    await test.step('status 200', () => {
      expect(resp.status()).toBe(200);
    });

    const body = await resp.json() as AgentTaskDTO;

    await test.step('status is REJECTED', () => {
      expect(body.status).toBe('REJECTED');
    });

    await test.step('comment is stored', () => {
      expect(body.comment).toBe('Task is outside scope');
    });

    await test.step('resolvedAt is a non-empty string', () => {
      expect(typeof body.resolvedAt).toBe('string');
      expect((body.resolvedAt as string).length).toBeGreaterThan(0);
    });
  });

  test('reject an IN_PROGRESS task → 200, status REJECTED', async () => {
    // Claim task first to put it IN_PROGRESS
    const nextResp = await agent.get('/api/agent-tasks/next?source=EMAIL');
    expect(nextResp.status()).toBe(200);
    const task = await nextResp.json() as AgentTaskDTO;

    const resp = await agent.post(`/api/agent-tasks/${task.id}/reject`, {
      data: { comment: 'Rejecting in-progress task' },
    });

    await test.step('status 200', () => {
      expect(resp.status()).toBe(200);
    });

    const body = await resp.json() as AgentTaskDTO;

    await test.step('status is REJECTED', () => {
      expect(body.status).toBe('REJECTED');
    });
  });

  test('missing comment → 400 with fieldErrors', async () => {
    const resp = await agent.post('/api/agent-tasks/1/reject', {
      data: {},
    });

    await test.step('status 400', () => {
      expect(resp.status()).toBe(400);
    });

    const body = await resp.json() as ErrorBody;

    await test.step('fieldErrors object is present', () => {
      expect(typeof body.fieldErrors).toBe('object');
      expect(body.fieldErrors).not.toBeNull();
    });
  });

  test('empty comment → 400 with fieldErrors', async () => {
    const resp = await agent.post('/api/agent-tasks/1/reject', {
      data: { comment: '' },
    });

    await test.step('status 400', () => {
      expect(resp.status()).toBe(400);
    });

    const body = await resp.json() as ErrorBody;

    await test.step('fieldErrors object is present', () => {
      expect(typeof body.fieldErrors).toBe('object');
      expect(body.fieldErrors).not.toBeNull();
    });
  });

  test('reject an already-REJECTED task → 409', async () => {
    // Reject task 1 first
    const firstResp = await agent.post('/api/agent-tasks/1/reject', {
      data: { comment: 'First rejection' },
    });
    expect(firstResp.status()).toBe(200);

    // Attempt second reject
    const secondResp = await agent.post('/api/agent-tasks/1/reject', {
      data: { comment: 'Second rejection attempt' },
    });

    expect(secondResp.status()).toBe(409);
  });

  test('reject a DONE task → 409', async () => {
    // Mark task 1 as DONE first
    const doneResp = await agent.post('/api/agent-tasks/1/done', {
      data: {},
    });
    expect(doneResp.status()).toBe(200);

    // Attempt to reject
    const rejectResp = await agent.post('/api/agent-tasks/1/reject', {
      data: { comment: 'Cannot reject done task' },
    });

    expect(rejectResp.status()).toBe(409);
  });

  test('no auth header from localhost → 200 (localhost bypass)', async () => {
    const resp = await anon.post('/api/agent-tasks/1/reject', {
      data: { comment: 'Test' },
    });
    expect(resp.status()).toBe(200);
  });

  test('wrong Bearer token → 401', async () => {
    const resp = await wrong.post('/api/agent-tasks/1/reject', {
      data: { comment: 'Test' },
    });
    expect(resp.status()).toBe(401);
  });
});

// ---------------------------------------------------------------------------
// Suite: POST /api/agent-tasks/:id/done
// ---------------------------------------------------------------------------

test.describe('POST /api/agent-tasks/:id/done', () => {
  let agent: APIRequestContext;
  let anon: APIRequestContext;
  let wrong: APIRequestContext;

  test.beforeEach(async () => {
    await resetDatabase();
    agent = await agentCtx();
    anon = await anonCtx();
    wrong = await wrongTokenCtx();
  });

  test.afterEach(async () => {
    await agent.dispose();
    await anon.dispose();
    await wrong.dispose();
  });

  test('done on OPEN task with comment → 200, status DONE, comment stored', async () => {
    const resp = await agent.post('/api/agent-tasks/1/done', {
      data: { comment: 'Completed successfully' },
    });

    await test.step('status 200', () => {
      expect(resp.status()).toBe(200);
    });

    const body = await resp.json() as AgentTaskDTO;

    await test.step('status is DONE', () => {
      expect(body.status).toBe('DONE');
    });

    await test.step('comment is stored', () => {
      expect(body.comment).toBe('Completed successfully');
    });

    await test.step('resolvedAt is set', () => {
      expect(typeof body.resolvedAt).toBe('string');
      expect((body.resolvedAt as string).length).toBeGreaterThan(0);
    });
  });

  test('done with no comment → 200, status DONE', async () => {
    const resp = await agent.post('/api/agent-tasks/2/done', {
      data: {},
    });

    await test.step('status 200', () => {
      expect(resp.status()).toBe(200);
    });

    const body = await resp.json() as AgentTaskDTO;

    await test.step('status is DONE', () => {
      expect(body.status).toBe('DONE');
    });
  });

  test('done on an already-DONE task → 409', async () => {
    // Mark task 1 as DONE
    const firstResp = await agent.post('/api/agent-tasks/1/done', { data: {} });
    expect(firstResp.status()).toBe(200);

    // Attempt second done
    const secondResp = await agent.post('/api/agent-tasks/1/done', { data: {} });

    expect(secondResp.status()).toBe(409);
  });

  test('done on a REJECTED task → 409', async () => {
    // Reject task 1 first
    const rejectResp = await agent.post('/api/agent-tasks/1/reject', {
      data: { comment: 'Rejecting first' },
    });
    expect(rejectResp.status()).toBe(200);

    // Attempt done
    const doneResp = await agent.post('/api/agent-tasks/1/done', { data: {} });

    expect(doneResp.status()).toBe(409);
  });

  test('no auth header from localhost → 200 (localhost bypass)', async () => {
    const resp = await anon.post('/api/agent-tasks/1/done', { data: {} });
    expect(resp.status()).toBe(200);
  });

  test('wrong Bearer token → 401', async () => {
    const resp = await wrong.post('/api/agent-tasks/1/done', { data: {} });
    expect(resp.status()).toBe(401);
  });
});

// ---------------------------------------------------------------------------
// Suite: GET /api/agent-tasks (list, paginated)
// ---------------------------------------------------------------------------

test.describe('GET /api/agent-tasks', () => {
  let admin: APIRequestContext;
  let user: APIRequestContext;
  let anon: APIRequestContext;
  let agent: APIRequestContext;

  test.beforeAll(async () => {
    await resetDatabase();
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

  test('admin session → 200 with valid pagination shape and 16 total tasks', async () => {
    const resp = await admin.get('/api/agent-tasks');

    await test.step('status 200', () => {
      expect(resp.status()).toBe(200);
    });

    const body = await resp.json() as PageResult<AgentTaskDTO>;

    await test.step('content is an array', () => {
      expect(Array.isArray(body.content)).toBe(true);
    });

    await test.step('totalElements is 16 (fixture seed count)', () => {
      expect(body.totalElements).toBe(16);
    });

    await test.step('number is 0 (first page, 0-indexed)', () => {
      expect(body.number).toBe(0);
    });

    await test.step('first is true', () => {
      expect(body.first).toBe(true);
    });

    await test.step('size is a positive integer', () => {
      expect(Number.isInteger(body.size)).toBe(true);
      expect(body.size).toBeGreaterThan(0);
    });

    await test.step('totalPages is a positive integer', () => {
      expect(Number.isInteger(body.totalPages)).toBe(true);
      expect(body.totalPages).toBeGreaterThan(0);
    });
  });

  test('user session (no ADMIN role) → 403', async () => {
    const resp = await user.get('/api/agent-tasks');
    expect(resp.status()).toBe(403);
  });

  test('no session (anonymous) → 401', async () => {
    const resp = await anon.get('/api/agent-tasks');
    expect(resp.status()).toBe(401);
  });

  test('agent Bearer token (no session) → 401', async () => {
    // The list endpoint uses requireAuth (session-based), not requireAgentToken.
    // A Bearer-only agent context has no session cookie, so should get 401.
    const resp = await agent.get('/api/agent-tasks');
    expect(resp.status()).toBe(401);
  });

  test('invalid source param → 400 with fieldErrors.source', async () => {
    const resp = await admin.get('/api/agent-tasks?source=NOPE');

    await test.step('status 400', () => {
      expect(resp.status()).toBe(400);
    });

    const body = await resp.json() as ErrorBody;

    await test.step('fieldErrors.source is present', () => {
      expect(typeof body.fieldErrors?.['source']).toBe('string');
    });
  });

  test('invalid status param → 400 with fieldErrors.status', async () => {
    const resp = await admin.get('/api/agent-tasks?status=NOPE');

    await test.step('status 400', () => {
      expect(resp.status()).toBe(400);
    });

    const body = await resp.json() as ErrorBody;

    await test.step('fieldErrors.status is present', () => {
      expect(typeof body.fieldErrors?.['status']).toBe('string');
    });
  });
});

// ---------------------------------------------------------------------------
// Suite: GET /api/agent-tasks/summary
// ---------------------------------------------------------------------------

test.describe('GET /api/agent-tasks/summary', () => {
  let admin: APIRequestContext;
  let user: APIRequestContext;
  let anon: APIRequestContext;

  test.beforeAll(async () => {
    await resetDatabase();
    admin = await loginCtx('admin', 'admin123');
    user = await loginCtx('user', 'test123');
    anon = await anonCtx();
  });

  test.afterAll(async () => {
    await admin.dispose();
    await user.dispose();
    await anon.dispose();
  });

  test('admin session → 200 with array of 4 source summaries', async () => {
    const resp = await admin.get('/api/agent-tasks/summary');

    await test.step('status 200', () => {
      expect(resp.status()).toBe(200);
    });

    const body = await resp.json() as SummaryDTO[];

    await test.step('body is an array with 4 elements', () => {
      expect(Array.isArray(body)).toBe(true);
      expect(body.length).toBe(4);
    });

    await test.step('each entry has source, openCount, inProgressCount, doneCount, rejectedCount', () => {
      for (const entry of body) {
        expect(typeof entry.source).toBe('string');
        expect(entry.source.length).toBeGreaterThan(0);
        expect(typeof entry.openCount).toBe('number');
        expect(typeof entry.inProgressCount).toBe('number');
        expect(typeof entry.doneCount).toBe('number');
        expect(typeof entry.rejectedCount).toBe('number');
      }
    });

    await test.step('all 4 known sources are represented', () => {
      const sources = body.map((e) => e.source);
      expect(sources).toContain('EMAIL');
      expect(sources).toContain('GITHUB_ISSUE');
      expect(sources).toContain('APP_LOG');
      expect(sources).toContain('ERROR_REPORT');
    });

    await test.step('fresh DB: each source has 4 OPEN tasks and 0 otherwise', () => {
      for (const entry of body) {
        expect(entry.openCount).toBe(4);
        expect(entry.inProgressCount).toBe(0);
        expect(entry.doneCount).toBe(0);
        expect(entry.rejectedCount).toBe(0);
      }
    });
  });

  test('user session (no ADMIN role) → 403', async () => {
    const resp = await user.get('/api/agent-tasks/summary');
    expect(resp.status()).toBe(403);
  });

  test('no session (anonymous) → 401', async () => {
    const resp = await anon.get('/api/agent-tasks/summary');
    expect(resp.status()).toBe(401);
  });
});

// ---------------------------------------------------------------------------
// Suite: POST /api/agent-tasks/reset
// ---------------------------------------------------------------------------

test.describe('POST /api/agent-tasks/reset', () => {
  let admin: APIRequestContext;
  let user: APIRequestContext;
  let anon: APIRequestContext;
  let agent: APIRequestContext;

  test.beforeAll(async () => {
    await resetDatabase();
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

  test('admin → 200 {reset: N} and summary shows all tasks OPEN afterwards', async () => {
    // First, mutate some tasks via the agent endpoints so reset has something to do
    const claimResp = await agent.get('/api/agent-tasks/next?source=EMAIL');
    expect(claimResp.status()).toBe(200);
    const claimedTask = await claimResp.json() as AgentTaskDTO;

    const doneResp = await agent.post(`/api/agent-tasks/${claimedTask.id}/done`, { data: {} });
    expect(doneResp.status()).toBe(200);

    // Verify at least one task is no longer OPEN (proves reset will actually do something)
    const preSummaryResp = await admin.get('/api/agent-tasks/summary');
    expect(preSummaryResp.status()).toBe(200);
    const preSummary = await preSummaryResp.json() as SummaryDTO[];
    const emailPre = preSummary.find((s) => s.source === 'EMAIL');
    expect(emailPre?.doneCount).toBeGreaterThan(0);

    // Now reset
    const resetResp = await admin.post('/api/agent-tasks/reset');

    await test.step('reset status 200', () => {
      expect(resetResp.status()).toBe(200);
    });

    const resetBody = await resetResp.json() as { reset: number };

    await test.step('reset body has numeric reset count', () => {
      expect(typeof resetBody.reset).toBe('number');
    });

    await test.step('reset count equals total tasks (16)', () => {
      expect(resetBody.reset).toBe(16);
    });

    // After reset, all tasks should be OPEN
    const postSummaryResp = await admin.get('/api/agent-tasks/summary');
    expect(postSummaryResp.status()).toBe(200);
    const postSummary = await postSummaryResp.json() as SummaryDTO[];

    await test.step('after reset: all sources show 4 OPEN, 0 in other statuses', () => {
      for (const entry of postSummary) {
        expect(entry.openCount).toBe(4);
        expect(entry.inProgressCount).toBe(0);
        expect(entry.doneCount).toBe(0);
        expect(entry.rejectedCount).toBe(0);
      }
    });
  });

  test('user session (no ADMIN role) → 403', async () => {
    const resp = await user.post('/api/agent-tasks/reset');
    expect(resp.status()).toBe(403);
  });

  test('no session (anonymous) → 401', async () => {
    const resp = await anon.post('/api/agent-tasks/reset');
    expect(resp.status()).toBe(401);
  });
});
