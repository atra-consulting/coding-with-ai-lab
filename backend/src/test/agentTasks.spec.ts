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
 *   EMAIL        → ids 1-4, 17-18, 23
 *   GITHUB_ISSUE → ids 5-8
 *   APP_LOG      → ids 9-12, 19-20
 *   ERROR_REPORT → ids 13-16, 21-22
 *
 * PORT-FEEDBACK-TICKETS-APIS additions (bottom of this file): the derived,
 * never-stored `ticketId` field on GET /:id, the paginated list, and
 * GET /next — linked ticket wins, unlinked reports null (using a freshly
 * INSERTed throwaway agent_task row, never a seeded id, so the assertion
 * holds regardless of what earlier tests in this file already linked),
 * newest-ticket-wins when two tickets point at the same feedback item,
 * deleting the linked ticket clears the derived field again, and a direct
 * SQL DELETE of the linked feedback row leaves the ticket intact with its
 * agentTaskId cleared by ON DELETE SET NULL.
 */
import { test, expect, request as playwrightRequest, type APIRequestContext } from '@playwright/test';
import { resetDatabase, loginCtx } from './helpers.js';
import { TEST_AGENT_TOKEN } from './globalSetup.js';
import { client } from '../config/db.js';

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
  ticketId: number | null;
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

  test('repeated calls return distinct EMAIL tasks; after all 7 claimed → 204', async () => {
    // Reset so we start fresh with 7 OPEN EMAIL tasks
    await resetDatabase();

    const ids: number[] = [];
    for (let i = 0; i < 7; i++) {
      const resp = await agent.get('/api/agent-tasks/next?source=EMAIL');

      await test.step(`call ${i + 1} returns 200`, () => {
        expect(resp.status()).toBe(200);
      });

      const body = await resp.json() as AgentTaskDTO;
      ids.push(body.id);
    }

    await test.step('all 7 ids are distinct', () => {
      const unique = new Set(ids);
      expect(unique.size).toBe(7);
    });

    // 8th call: no OPEN EMAIL tasks remain → 204
    const exhaustedResp = await agent.get('/api/agent-tasks/next?source=EMAIL');
    await test.step('8th call returns 204 (no content)', () => {
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

  test('admin session → 200 with valid pagination shape and 23 total tasks', async () => {
    const resp = await admin.get('/api/agent-tasks');

    await test.step('status 200', () => {
      expect(resp.status()).toBe(200);
    });

    const body = await resp.json() as PageResult<AgentTaskDTO>;

    await test.step('content is an array', () => {
      expect(Array.isArray(body.content)).toBe(true);
    });

    await test.step('totalElements is 23 (fixture seed count)', () => {
      expect(body.totalElements).toBe(23);
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

    await test.step('fresh DB: OPEN counts match seed (GITHUB_ISSUE has 4, EMAIL has 7, others have 6)', () => {
      for (const entry of body) {
        const expectedOpen = entry.source === 'GITHUB_ISSUE' ? 4 : entry.source === 'EMAIL' ? 7 : 6;
        expect(entry.openCount).toBe(expectedOpen);
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

    await test.step('reset count equals total tasks (23)', () => {
      expect(resetBody.reset).toBe(23);
    });

    // After reset, all tasks should be OPEN
    const postSummaryResp = await admin.get('/api/agent-tasks/summary');
    expect(postSummaryResp.status()).toBe(200);
    const postSummary = await postSummaryResp.json() as SummaryDTO[];

    await test.step('after reset: OPEN counts match seed (GITHUB_ISSUE has 4, EMAIL has 7, others have 6)', () => {
      for (const entry of postSummary) {
        const expectedOpen = entry.source === 'GITHUB_ISSUE' ? 4 : entry.source === 'EMAIL' ? 7 : 6;
        expect(entry.openCount).toBe(expectedOpen);
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

// ---------------------------------------------------------------------------
// Suite: POST /api/agent-tasks/:id/start
// ---------------------------------------------------------------------------

test.describe('POST /api/agent-tasks/:id/start', () => {
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

  test('start an OPEN task → 200, status IN_PROGRESS, pickedUpAt is a non-null string', async () => {
    const resp = await agent.post('/api/agent-tasks/1/start');

    await test.step('status 200', () => {
      expect(resp.status()).toBe(200);
    });

    const body = await resp.json() as AgentTaskDTO;

    await test.step('status is IN_PROGRESS', () => {
      expect(body.status).toBe('IN_PROGRESS');
    });

    await test.step('pickedUpAt is a non-empty string', () => {
      expect(typeof body.pickedUpAt).toBe('string');
      expect((body.pickedUpAt as string).length).toBeGreaterThan(0);
    });

    await test.step('id matches the requested task', () => {
      expect(body.id).toBe(1);
    });
  });

  test('start verifies the mutation persisted — re-fetch shows IN_PROGRESS', async () => {
    const startResp = await agent.post('/api/agent-tasks/2/start');
    expect(startResp.status()).toBe(200);

    // Re-fetch via GET /:id (agent token allows this)
    const getResp = await agent.get('/api/agent-tasks/2');
    expect(getResp.status()).toBe(200);

    const body = await getResp.json() as AgentTaskDTO;
    expect(body.status).toBe('IN_PROGRESS');
    expect(typeof body.pickedUpAt).toBe('string');
  });

  test('start an already IN_PROGRESS task → 409', async () => {
    // Move task 1 to IN_PROGRESS via /start
    const firstResp = await agent.post('/api/agent-tasks/1/start');
    expect(firstResp.status()).toBe(200);

    // Attempt to start the same task again
    const secondResp = await agent.post('/api/agent-tasks/1/start');
    expect(secondResp.status()).toBe(409);
  });

  test('start a DONE task → 409', async () => {
    // Mark task 1 as DONE via the done endpoint
    const doneResp = await agent.post('/api/agent-tasks/1/done', { data: {} });
    expect(doneResp.status()).toBe(200);

    // Attempt to start a DONE task
    const startResp = await agent.post('/api/agent-tasks/1/start');
    expect(startResp.status()).toBe(409);
  });

  test('start a REJECTED task → 409', async () => {
    // Reject task 1 first
    const rejectResp = await agent.post('/api/agent-tasks/1/reject', {
      data: { comment: 'Rejecting before start attempt' },
    });
    expect(rejectResp.status()).toBe(200);

    // Attempt to start the REJECTED task
    const startResp = await agent.post('/api/agent-tasks/1/start');
    expect(startResp.status()).toBe(409);
  });

  test('unknown id → 404', async () => {
    const resp = await agent.post('/api/agent-tasks/99999/start');
    expect(resp.status()).toBe(404);
  });

  test('no auth header from localhost → 200 (localhost bypass)', async () => {
    // AGENT_AUTH_ALLOW_LOOPBACK is enabled by default (.env.example).
    // Requests from localhost without a token are allowed through requireAgentToken.
    const resp = await anon.post('/api/agent-tasks/1/start');
    expect(resp.status()).toBe(200);
  });

  test('wrong Bearer token → 401', async () => {
    const resp = await wrong.post('/api/agent-tasks/1/start');
    expect(resp.status()).toBe(401);
  });

  test('no token + X-Forwarded-For header from localhost → 401 (bypass refused, proxy header present)', async () => {
    const proxyCtx = await playwrightRequest.newContext({
      baseURL: BASE_URL,
      extraHTTPHeaders: { 'X-Forwarded-For': '10.0.0.1' },
    });
    try {
      const resp = await proxyCtx.post('/api/agent-tasks/1/start');
      expect(resp.status()).toBe(401);
    } finally {
      await proxyCtx.dispose();
    }
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// PORT-FEEDBACK-TICKETS-APIS — derived ticketId field
// ═══════════════════════════════════════════════════════════════════════════
//
// AgentTaskDTO.ticketId is derived on every read via a correlated subquery
// against ticket.agentTaskId — never stored on agent_task itself. Covered
// here: GET /:id (linked, unlinked, ticket-deleted, feedback-row-deleted),
// the newest-wins tie-break when two tickets link the same feedback item,
// the paginated list, and GET /next.

// ─── Suite: Derived ticketId — GET /:id and GET / (list) ─────────────────────

test.describe('Derived ticketId — GET /:id and GET / (list)', () => {
  let admin: APIRequestContext;

  test.beforeAll(async () => {
    await resetDatabase();
    admin = await loginCtx('admin', 'admin123');
  });

  test.afterAll(async () => {
    await admin.dispose();
  });

  test('feedback item with a linked ticket reports that ticket', async () => {
    const createResp = await admin.post('/api/tickets', {
      data: { type: 'FEATURE', title: 'Linked to feedback 1', body: 'Body text.', agentTaskId: 1 },
    });
    expect(createResp.status()).toBe(201);
    const ticket = await createResp.json() as { id: number };

    const resp = await admin.get('/api/agent-tasks/1');
    expect(resp.status()).toBe(200);
    const body = await resp.json() as AgentTaskDTO;
    expect(body.ticketId).toBe(ticket.id);
  });

  test('feedback item with no linked ticket reports ticketId === null (fresh, unlinked row)', async () => {
    // Mint a throwaway agent_task row directly, scoped to this one test.
    // resetDatabase() never touches ticket/ticket_comment (see helpers.ts), so
    // tickets created by earlier tests in this file persist for the rest of
    // the run. Reusing a seeded id (e.g. 4 or 9) here would risk a false
    // pass/fail depending on execution order — a freshly INSERTed row is
    // provably unlinked regardless of what ran before it.
    const now = new Date().toISOString();
    const insertResult = await client.execute({
      sql: `INSERT INTO agent_task (source, title, body, status, createdAt, updatedAt)
            VALUES ('EMAIL', 'Throwaway unlinked task', 'Body text.', 'OPEN', ?, ?)
            RETURNING id`,
      args: [now, now],
    });
    const row = insertResult.rows[0] as unknown as { id: number };
    const freshId = row.id;

    const resp = await admin.get(`/api/agent-tasks/${freshId}`);
    expect(resp.status()).toBe(200);
    const body = await resp.json() as AgentTaskDTO;
    expect(body.ticketId).toBeNull();
  });

  test('two tickets pointing at one feedback item → the newest wins', async () => {
    // Seeded id 2 — self-healing via the id DESC tie-break regardless of
    // execution order, so reusing a seeded id here is safe.
    const olderResp = await admin.post('/api/tickets', {
      data: { type: 'FEATURE', title: 'Older link', body: 'Body text.', agentTaskId: 2 },
    });
    expect(olderResp.status()).toBe(201);
    const olderTicket = await olderResp.json() as { id: number };

    const newerResp = await admin.post('/api/tickets', {
      data: { type: 'FEATURE', title: 'Newer link', body: 'Body text.', agentTaskId: 2 },
    });
    expect(newerResp.status()).toBe(201);
    const newerTicket = await newerResp.json() as { id: number };

    const resp = await admin.get('/api/agent-tasks/2');
    expect(resp.status()).toBe(200);
    const body = await resp.json() as AgentTaskDTO;

    await test.step('newest ticket wins', () => { expect(body.ticketId).toBe(newerTicket.id); });
    await test.step('not the older ticket', () => { expect(body.ticketId).not.toBe(olderTicket.id); });
  });

  test('deleting the linked ticket via direct SQL → feedback item reports null again', async () => {
    const createResp = await admin.post('/api/tickets', {
      data: { type: 'BUG', title: 'To be deleted', body: 'Body text.', agentTaskId: 3 },
    });
    expect(createResp.status()).toBe(201);
    const ticket = await createResp.json() as { id: number };

    const before = await admin.get('/api/agent-tasks/3');
    const beforeBody = await before.json() as AgentTaskDTO;
    expect(beforeBody.ticketId).toBe(ticket.id);

    await client.execute({ sql: 'DELETE FROM ticket WHERE id = ?', args: [ticket.id] });

    const after = await admin.get('/api/agent-tasks/3');
    expect(after.status()).toBe(200);
    const afterBody = await after.json() as AgentTaskDTO;
    expect(afterBody.ticketId).toBeNull();
  });

  test('ticketId appears on every item of the paginated list', async () => {
    const resp = await admin.get('/api/agent-tasks');
    expect(resp.status()).toBe(200);
    const body = await resp.json() as PageResult<AgentTaskDTO>;
    expect(body.content.length).toBeGreaterThan(0);
    for (const item of body.content) {
      expect('ticketId' in item).toBe(true);
    }
  });
});

// ─── Suite: Derived ticketId — GET /next ─────────────────────────────────────

test.describe('Derived ticketId — GET /next', () => {
  let agent: APIRequestContext;
  let admin: APIRequestContext;

  test.beforeAll(async () => {
    await resetDatabase();
    agent = await agentCtx();
    admin = await loginCtx('admin', 'admin123');
  });

  test.afterAll(async () => {
    await agent.dispose();
    await admin.dispose();
  });

  test('ticketId appears on the claimed task and matches the linked ticket', async () => {
    // Drain all 4 seeded GITHUB_ISSUE tasks (OPEN after resetDatabase()) so
    // the freshly inserted, freshly linked row below is the only claimable
    // GITHUB_ISSUE task left — /next claims oldest-first by createdAt, and
    // our fresh row would otherwise sort last.
    for (let i = 0; i < 4; i++) {
      const resp = await agent.get('/api/agent-tasks/next?source=GITHUB_ISSUE');
      expect(resp.status()).toBe(200);
    }

    const now = new Date().toISOString();
    const insertResult = await client.execute({
      sql: `INSERT INTO agent_task (source, title, body, status, createdAt, updatedAt)
            VALUES ('GITHUB_ISSUE', 'Claimable and linked', 'Body text.', 'OPEN', ?, ?)
            RETURNING id`,
      args: [now, now],
    });
    const row = insertResult.rows[0] as unknown as { id: number };
    const feedbackId = row.id;

    const createResp = await admin.post('/api/tickets', {
      data: { type: 'FEATURE', title: 'Linked to claimable feedback', body: 'Body.', agentTaskId: feedbackId },
    });
    expect(createResp.status()).toBe(201);
    const ticket = await createResp.json() as { id: number };

    const claimResp = await agent.get('/api/agent-tasks/next?source=GITHUB_ISSUE');
    expect(claimResp.status()).toBe(200);
    const claimed = await claimResp.json() as AgentTaskDTO;

    await test.step('claimed the freshly linked task', () => { expect(claimed.id).toBe(feedbackId); });
    await test.step('ticketId matches the linked ticket', () => { expect(claimed.ticketId).toBe(ticket.id); });
  });
});

// ─── Suite: direct SQL DELETE of the linked feedback row ─────────────────────

test.describe('Direct SQL DELETE of the linked feedback row (ON DELETE SET NULL)', () => {
  let admin: APIRequestContext;

  test.beforeAll(async () => {
    await resetDatabase();
    admin = await loginCtx('admin', 'admin123');
  });

  test.afterAll(async () => {
    await admin.dispose();
  });

  test('deleting the linked feedback row: ticket survives, agentTaskId becomes null, ticket is not deleted', async () => {
    // The test runner's `client` connection is separate from the backend's
    // own connection and never runs runMigrations(), so PRAGMA foreign_keys
    // is not guaranteed ON here. ON DELETE SET NULL will not fire without
    // this explicit pragma on this connection.
    await client.execute('PRAGMA foreign_keys = ON');

    // Mint a throwaway agent_task row so this destructive test does not
    // disturb a seeded id relied on by other tests in this file.
    const now = new Date().toISOString();
    const insertResult = await client.execute({
      sql: `INSERT INTO agent_task (source, title, body, status, createdAt, updatedAt)
            VALUES ('APP_LOG', 'To be deleted directly', 'Body text.', 'OPEN', ?, ?)
            RETURNING id`,
      args: [now, now],
    });
    const row = insertResult.rows[0] as unknown as { id: number };
    const feedbackId = row.id;

    const createResp = await admin.post('/api/tickets', {
      data: { type: 'CHORE', title: 'Linked to a doomed feedback row', body: 'Body.', agentTaskId: feedbackId },
    });
    expect(createResp.status()).toBe(201);
    const ticket = await createResp.json() as { id: number; agentTaskId: number | null };
    expect(ticket.agentTaskId).toBe(feedbackId);

    await client.execute({ sql: 'DELETE FROM agent_task WHERE id = ?', args: [feedbackId] });

    const ticketResp = await admin.get(`/api/tickets/${ticket.id}`);
    expect(ticketResp.status()).toBe(200);
    const persisted = await ticketResp.json() as { id: number; agentTaskId: number | null };

    await test.step('ticket still exists (not cascade-deleted)', () => {
      expect(persisted.id).toBe(ticket.id);
    });
    await test.step('agentTaskId is now null', () => {
      expect(persisted.agentTaskId).toBeNull();
    });
  });
});
