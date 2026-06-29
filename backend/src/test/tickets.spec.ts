/**
 * Playwright API tests for the tickets routes.
 *
 * Covers (PRD-KANBAN-TICKET-SYSTEM):
 *   GET  /api/tickets/next            — claim, type filter, 204 exhausted
 *   POST /api/tickets/:id/done        — happy path, 409 wrong state, 404 missing
 *   POST /api/tickets/:id/ask         — happy path, 400 empty question, 409 wrong state
 *   POST /api/tickets/:id/comments    — add HUMAN comment, handBackToAi flow
 *   POST /api/tickets/:id/wont-do     — owner=HUMAN only, 409 on owner=AI
 *   PATCH /api/tickets/:id/status     — drag-drop semantics, solution management
 *   PATCH /api/tickets/:id/owner      — flip owner only
 *   POST /api/tickets                 — create defaults
 *   GET  /api/tickets                 — paginated list + filters
 *   GET  /api/tickets/:id             — detail with comments
 *   GET  /api/tickets/board           — four-column board with commentCount
 *   GET  /api/tickets/summary         — counts by status/type/owner/solution
 *   POST /api/tickets/reset           — deletes and reseeds 12 tickets
 *
 * Authorization matrix:
 *   - Agent endpoints (/next, /:id/done, /:id/ask): require Bearer token
 *   - Admin session endpoints: require ADMIN role (user=USER gets 403)
 *
 * Seeded state (after POST /reset or fresh DB):
 *   Ids 1-12; 7,9,11 → ON_HOLD + owner=HUMAN + 1 AGENT comment each.
 *   Others (1-6,8,10,12) → TODO + owner=AI. Types: 8,10=CHORE, rest=FEATURE.
 *   All solution=null.
 */
import { test, expect, request as playwrightRequest, type APIRequestContext } from '@playwright/test';
import { loginCtx } from './helpers.js';
import { TEST_AGENT_TOKEN } from './globalSetup.js';

const BASE_URL = 'http://localhost:7070';

// ─── Types ────────────────────────────────────────────────────────────────────

interface TicketComment {
  id: number;
  ticketId: number;
  author: string;
  authorName: string | null;
  body: string;
  createdAt: string;
}

interface Ticket {
  id: number;
  owner: string;
  type: string;
  title: string;
  body: string;
  status: string;
  solution: string | null;
  pickedUpAt: string | null;
  resolvedAt: string | null;
  createdAt: string;
  updatedAt: string;
  comments: TicketComment[];
}

interface TicketListItem {
  id: number;
  owner: string;
  type: string;
  title: string;
  status: string;
  solution: string | null;
  commentCount: number;
}

interface TicketBoard {
  TODO: TicketListItem[];
  IN_PROGRESS: TicketListItem[];
  ON_HOLD: TicketListItem[];
  DONE: TicketListItem[];
}

interface TicketSummary {
  byStatus: Record<string, number>;
  byType: Record<string, number>;
  byOwner: Record<string, number>;
  bySolution: Record<string, number>;
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

interface ErrorBody {
  status: number;
  message: string;
  timestamp: string;
  fieldErrors: Record<string, string>;
}

// ─── Context factories ────────────────────────────────────────────────────────

async function agentCtx(): Promise<APIRequestContext> {
  return playwrightRequest.newContext({
    baseURL: BASE_URL,
    extraHTTPHeaders: { Authorization: `Bearer ${TEST_AGENT_TOKEN}` },
  });
}

async function anonCtx(): Promise<APIRequestContext> {
  return playwrightRequest.newContext({ baseURL: BASE_URL });
}

async function wrongTokenCtx(): Promise<APIRequestContext> {
  return playwrightRequest.newContext({
    baseURL: BASE_URL,
    extraHTTPHeaders: { Authorization: 'Bearer wrong-token-for-tickets' },
  });
}

// ─── Ticket reset helper ──────────────────────────────────────────────────────

/**
 * Reset ticket state via the API endpoint.
 * Requires an admin context. Asserts 200 so tests fail clearly if reset breaks.
 */
async function resetTickets(admin: APIRequestContext): Promise<void> {
  const resp = await admin.post('/api/tickets/reset');
  if (resp.status() !== 200) {
    throw new Error(`POST /api/tickets/reset failed: ${resp.status()} ${await resp.text()}`);
  }
}

// ─── Suite: Auth matrix — agent endpoints ────────────────────────────────────

test.describe('Auth matrix — agent endpoints', () => {
  let anon: APIRequestContext;
  let wrong: APIRequestContext;
  let admin: APIRequestContext;

  test.beforeAll(async () => {
    anon = await anonCtx();
    wrong = await wrongTokenCtx();
    admin = await loginCtx('admin', 'admin123');
    await resetTickets(admin);
  });

  test.afterAll(async () => {
    await anon.dispose();
    await wrong.dispose();
    await admin.dispose();
  });

  // GET /next
  test('GET /next without token from localhost → 200 (localhost bypass)', async () => {
    const resp = await anon.get('/api/tickets/next');
    expect(resp.status()).toBe(200);
  });

  test('GET /next with wrong token → 401', async () => {
    const resp = await wrong.get('/api/tickets/next');
    expect(resp.status()).toBe(401);
  });

  // POST /:id/done
  test('POST /:id/done without token from localhost → 200 (localhost bypass)', async () => {
    const resp = await anon.post('/api/tickets/1/done', { data: {} });
    expect(resp.status()).toBe(200);
  });

  test('POST /:id/done with wrong token → 401', async () => {
    const resp = await wrong.post('/api/tickets/1/done', { data: {} });
    expect(resp.status()).toBe(401);
  });

  // POST /:id/ask
  test('POST /:id/ask without token from localhost → 409 (auth bypassed, wrong state)', async () => {
    const resp = await anon.post('/api/tickets/1/ask', { data: { question: 'What?' } });
    expect(resp.status()).toBe(409);
  });

  test('POST /:id/ask with wrong token → 401', async () => {
    const resp = await wrong.post('/api/tickets/1/ask', { data: { question: 'What?' } });
    expect(resp.status()).toBe(401);
  });
});

// ─── Suite: Auth matrix — admin endpoints ────────────────────────────────────

test.describe('Auth matrix — admin endpoints', () => {
  let anon: APIRequestContext;
  let user: APIRequestContext;
  let agent: APIRequestContext;
  let admin: APIRequestContext;

  test.beforeAll(async () => {
    anon = await anonCtx();
    user = await loginCtx('user', 'test123');
    agent = await agentCtx();
    admin = await loginCtx('admin', 'admin123');
    await resetTickets(admin);
  });

  test.afterAll(async () => {
    await anon.dispose();
    await user.dispose();
    await agent.dispose();
    await admin.dispose();
  });

  // GET /board
  test('GET /board without session → 401', async () => {
    const resp = await anon.get('/api/tickets/board');
    expect(resp.status()).toBe(401);
  });

  test('GET /board with USER role → 403', async () => {
    const resp = await user.get('/api/tickets/board');
    expect(resp.status()).toBe(403);
  });

  test('GET /board with agent token only (no session) → 401', async () => {
    const resp = await agent.get('/api/tickets/board');
    expect(resp.status()).toBe(401);
  });

  // GET /summary
  test('GET /summary without session → 401', async () => {
    const resp = await anon.get('/api/tickets/summary');
    expect(resp.status()).toBe(401);
  });

  test('GET /summary with USER role → 403', async () => {
    const resp = await user.get('/api/tickets/summary');
    expect(resp.status()).toBe(403);
  });

  // POST /reset
  test('POST /reset without session → 401', async () => {
    const resp = await anon.post('/api/tickets/reset');
    expect(resp.status()).toBe(401);
  });

  test('POST /reset with USER role → 403', async () => {
    const resp = await user.post('/api/tickets/reset');
    expect(resp.status()).toBe(403);
  });

  // GET /
  test('GET / without session → 401', async () => {
    const resp = await anon.get('/api/tickets');
    expect(resp.status()).toBe(401);
  });

  test('GET / with USER role → 403', async () => {
    const resp = await user.get('/api/tickets');
    expect(resp.status()).toBe(403);
  });

  // POST / (create)
  test('POST / without session → 401', async () => {
    const resp = await anon.post('/api/tickets', { data: { type: 'FEATURE', title: 'T', body: 'B' } });
    expect(resp.status()).toBe(401);
  });

  test('POST / with USER role → 403', async () => {
    const resp = await user.post('/api/tickets', { data: { type: 'FEATURE', title: 'T', body: 'B' } });
    expect(resp.status()).toBe(403);
  });

  // GET /:id
  test('GET /:id without session → 401', async () => {
    const resp = await anon.get('/api/tickets/1');
    expect(resp.status()).toBe(401);
  });

  test('GET /:id with USER role → 403', async () => {
    const resp = await user.get('/api/tickets/1');
    expect(resp.status()).toBe(403);
  });

  // PATCH /:id/status
  test('PATCH /:id/status without session → 401', async () => {
    const resp = await anon.patch('/api/tickets/1/status', { data: { status: 'TODO' } });
    expect(resp.status()).toBe(401);
  });

  test('PATCH /:id/status with USER role → 403', async () => {
    const resp = await user.patch('/api/tickets/1/status', { data: { status: 'TODO' } });
    expect(resp.status()).toBe(403);
  });

  // PATCH /:id/owner
  test('PATCH /:id/owner without session → 401', async () => {
    const resp = await anon.patch('/api/tickets/1/owner', { data: { owner: 'AI' } });
    expect(resp.status()).toBe(401);
  });

  test('PATCH /:id/owner with USER role → 403', async () => {
    const resp = await user.patch('/api/tickets/1/owner', { data: { owner: 'AI' } });
    expect(resp.status()).toBe(403);
  });

  // POST /:id/wont-do
  test('POST /:id/wont-do without session → 401', async () => {
    const resp = await anon.post('/api/tickets/7/wont-do', { data: {} });
    expect(resp.status()).toBe(401);
  });

  test('POST /:id/wont-do with USER role → 403', async () => {
    const resp = await user.post('/api/tickets/7/wont-do', { data: {} });
    expect(resp.status()).toBe(403);
  });

  // POST /:id/comments
  test('POST /:id/comments without session → 401', async () => {
    const resp = await anon.post('/api/tickets/1/comments', { data: { body: 'Hello' } });
    expect(resp.status()).toBe(401);
  });

  test('POST /:id/comments with USER role → 403', async () => {
    const resp = await user.post('/api/tickets/1/comments', { data: { body: 'Hello' } });
    expect(resp.status()).toBe(403);
  });
});

// ─── Suite: GET /api/tickets/next ────────────────────────────────────────────

test.describe('GET /api/tickets/next', () => {
  let agent: APIRequestContext;
  let admin: APIRequestContext;

  test.beforeAll(async () => {
    admin = await loginCtx('admin', 'admin123');
    await resetTickets(admin);
    agent = await agentCtx();
  });

  test.afterAll(async () => {
    await agent.dispose();
    await admin.dispose();
  });

  test('claims oldest TODO+owner=AI ticket, returns 200 with IN_PROGRESS status', async () => {
    // After reset: tickets 1-6,8,10,12 are TODO+AI. Oldest by createdAt is ticket 1.
    const resp = await agent.get('/api/tickets/next');

    await test.step('status 200', () => {
      expect(resp.status()).toBe(200);
    });

    const body = await resp.json() as Ticket;

    await test.step('status flipped to IN_PROGRESS', () => {
      expect(body.status).toBe('IN_PROGRESS');
    });

    await test.step('owner remains AI', () => {
      expect(body.owner).toBe('AI');
    });

    await test.step('pickedUpAt is set (non-empty ISO string)', () => {
      expect(typeof body.pickedUpAt).toBe('string');
      expect((body.pickedUpAt as string).length).toBeGreaterThan(0);
    });

    await test.step('oldest eligible ticket (id=1) is claimed first', () => {
      expect(body.id).toBe(1);
    });

    await test.step('response includes comments array', () => {
      expect(Array.isArray(body.comments)).toBe(true);
    });
  });

  test('second call returns next distinct TODO+AI ticket', async () => {
    // This test depends on the previous test having claimed ticket 1 (IN_PROGRESS).
    // The suite uses beforeAll (not beforeEach), so state persists between tests.
    // After reset: ids 1-6,8,10,12 are TODO+AI ordered by createdAt ASC.
    // First test claimed id=1. This call must claim id=2 (next oldest).
    const resp = await agent.get('/api/tickets/next');
    expect(resp.status()).toBe(200);
    const body = await resp.json() as Ticket;
    // Seed order: ticket 2 is the second-oldest TODO+AI ticket after ticket 1 is claimed.
    expect(body.id).toBe(2);
    expect(body.status).toBe('IN_PROGRESS');
  });

  test('type=CHORE filter claims a CHORE ticket', async () => {
    // Reset first to guarantee a clean slate independent of prior claims in this suite.
    // After reset: tickets 8 and 10 are TODO+AI+CHORE. Oldest is ticket 8.
    await resetTickets(admin);
    const resp = await agent.get('/api/tickets/next?type=CHORE');
    expect(resp.status()).toBe(200);
    const body = await resp.json() as Ticket;
    expect(body.type).toBe('CHORE');
    expect(body.id).toBe(8); // oldest CHORE ticket by createdAt
    expect(body.status).toBe('IN_PROGRESS');
  });

  test('returns 204 when no eligible TODO+AI ticket remains of requested type', async () => {
    // Reset then claim all CHOREs (ids 8 and 10)
    await resetTickets(admin);
    await agent.get('/api/tickets/next?type=CHORE'); // claim 8
    await agent.get('/api/tickets/next?type=CHORE'); // claim 10
    const resp = await agent.get('/api/tickets/next?type=CHORE');
    expect(resp.status()).toBe(204);
  });

  test('invalid type value → 400 with fieldErrors.type', async () => {
    const resp = await agent.get('/api/tickets/next?type=NOPE');
    await test.step('status 400', () => { expect(resp.status()).toBe(400); });
    const body = await resp.json() as ErrorBody;
    await test.step('fieldErrors.type present', () => {
      expect(typeof body.fieldErrors?.['type']).toBe('string');
    });
  });

  test('ON_HOLD+owner=HUMAN tickets are never claimed by /next', async () => {
    // After reset, tickets 7, 9, 11 are ON_HOLD+HUMAN. They must never be returned.
    await resetTickets(admin);

    // Drain all 9 TODO+AI tickets
    for (let i = 0; i < 9; i++) {
      await agent.get('/api/tickets/next');
    }

    // Next call must return 204, not one of the HUMAN tickets
    const resp = await agent.get('/api/tickets/next');
    expect(resp.status()).toBe(204);
  });
});

// ─── Suite: POST /api/tickets/:id/done ───────────────────────────────────────

test.describe('POST /api/tickets/:id/done', () => {
  let agent: APIRequestContext;
  let admin: APIRequestContext;

  test.beforeEach(async () => {
    admin = await loginCtx('admin', 'admin123');
    await resetTickets(admin);
    agent = await agentCtx();
  });

  test.afterEach(async () => {
    await agent.dispose();
    await admin.dispose();
  });

  test('done from IN_PROGRESS → status DONE, solution DONE, resolvedAt set', async () => {
    // Claim ticket 1 first
    const claimResp = await agent.get('/api/tickets/next');
    expect(claimResp.status()).toBe(200);
    const claimed = await claimResp.json() as Ticket;

    const resp = await agent.post(`/api/tickets/${claimed.id}/done`, { data: {} });

    await test.step('status 200', () => { expect(resp.status()).toBe(200); });

    const body = await resp.json() as Ticket;

    await test.step('status is DONE', () => { expect(body.status).toBe('DONE'); });
    await test.step('solution is DONE', () => { expect(body.solution).toBe('DONE'); });
    await test.step('resolvedAt is set', () => {
      expect(typeof body.resolvedAt).toBe('string');
      expect((body.resolvedAt as string).length).toBeGreaterThan(0);
    });

    // Side-effect: re-fetch and confirm persisted fields match mutation response
    const persisted = await (await admin.get(`/api/tickets/${claimed.id}`)).json() as Ticket;
    await test.step('persisted status is DONE', () => { expect(persisted.status).toBe('DONE'); });
    await test.step('persisted solution is DONE', () => { expect(persisted.solution).toBe('DONE'); });
    await test.step('persisted resolvedAt matches response', () => {
      expect(persisted.resolvedAt).toBe(body.resolvedAt);
    });
  });

  test('done with optional comment → AGENT comment stored in thread', async () => {
    const claimResp = await agent.get('/api/tickets/next');
    const claimed = await claimResp.json() as Ticket;

    const resp = await agent.post(`/api/tickets/${claimed.id}/done`, {
      data: { comment: 'Implemented successfully' },
    });
    expect(resp.status()).toBe(200);
    const body = await resp.json() as Ticket;

    await test.step('comment appears in thread', () => {
      const agentComments = body.comments.filter((c) => c.author === 'AGENT');
      const found = agentComments.some((c) => c.body === 'Implemented successfully');
      expect(found).toBe(true);
    });
  });

  test('done on a TODO ticket (not IN_PROGRESS) → 409', async () => {
    // Ticket 1 is TODO+AI after reset, not IN_PROGRESS
    const resp = await agent.post('/api/tickets/1/done', { data: {} });
    expect(resp.status()).toBe(409);
  });

  test('done on an ON_HOLD ticket → 409', async () => {
    // Ticket 7 is ON_HOLD+HUMAN after reset
    const resp = await agent.post('/api/tickets/7/done', { data: {} });
    expect(resp.status()).toBe(409);
  });

  test('done on unknown id → 404', async () => {
    const resp = await agent.post('/api/tickets/99999/done', { data: {} });
    expect(resp.status()).toBe(404);
  });

  test('done on a 409-state ticket does NOT create an orphan comment', async () => {
    // Ticket 1 is TODO (not IN_PROGRESS) → will yield 409
    const before = await (await admin.get('/api/tickets/1')).json() as Ticket;
    const commentCountBefore = before.comments.length;

    const resp = await agent.post('/api/tickets/1/done', { data: { comment: 'orphan?' } });
    expect(resp.status()).toBe(409);

    const after = await (await admin.get('/api/tickets/1')).json() as Ticket;
    expect(after.comments.length).toBe(commentCountBefore);
  });
});

// ─── Suite: POST /api/tickets/:id/ask ────────────────────────────────────────

test.describe('POST /api/tickets/:id/ask', () => {
  let agent: APIRequestContext;
  let admin: APIRequestContext;

  test.beforeEach(async () => {
    admin = await loginCtx('admin', 'admin123');
    await resetTickets(admin);
    agent = await agentCtx();
  });

  test.afterEach(async () => {
    await agent.dispose();
    await admin.dispose();
  });

  test('ask from IN_PROGRESS → ON_HOLD, owner=HUMAN, AGENT comment created', async () => {
    // Claim a ticket first
    const claimResp = await agent.get('/api/tickets/next');
    expect(claimResp.status()).toBe(200);
    const claimed = await claimResp.json() as Ticket;

    const resp = await agent.post(`/api/tickets/${claimed.id}/ask`, {
      data: { question: 'What format should the output be?' },
    });

    await test.step('status 200', () => { expect(resp.status()).toBe(200); });

    const body = await resp.json() as Ticket;

    await test.step('status is ON_HOLD', () => { expect(body.status).toBe('ON_HOLD'); });
    await test.step('owner is HUMAN', () => { expect(body.owner).toBe('HUMAN'); });
    await test.step('AGENT comment with question is in the thread', () => {
      const agentComment = body.comments.find(
        (c) => c.author === 'AGENT' && c.body === 'What format should the output be?',
      );
      expect(agentComment).toBeDefined();
    });

    // Side-effect: re-fetch and confirm persisted fields match mutation response
    const persisted = await (await admin.get(`/api/tickets/${claimed.id}`)).json() as Ticket;
    await test.step('persisted status is ON_HOLD', () => { expect(persisted.status).toBe('ON_HOLD'); });
    await test.step('persisted owner is HUMAN', () => { expect(persisted.owner).toBe('HUMAN'); });
    await test.step('persisted AGENT comment present', () => {
      const agentComment = persisted.comments.find(
        (c) => c.author === 'AGENT' && c.body === 'What format should the output be?',
      );
      expect(agentComment).toBeDefined();
    });
  });

  test('ask with empty question → 400 with fieldErrors.question', async () => {
    const claimResp = await agent.get('/api/tickets/next');
    const claimed = await claimResp.json() as Ticket;

    const resp = await agent.post(`/api/tickets/${claimed.id}/ask`, {
      data: { question: '' },
    });

    await test.step('status 400', () => { expect(resp.status()).toBe(400); });
    const body = await resp.json() as ErrorBody;
    await test.step('fieldErrors.question present', () => {
      expect(typeof body.fieldErrors?.['question']).toBe('string');
    });
  });

  test('ask with missing question field → 400', async () => {
    const claimResp = await agent.get('/api/tickets/next');
    const claimed = await claimResp.json() as Ticket;

    const resp = await agent.post(`/api/tickets/${claimed.id}/ask`, { data: {} });
    expect(resp.status()).toBe(400);
  });

  test('ask on a TODO ticket (not IN_PROGRESS) → 409', async () => {
    // Ticket 1 is TODO after reset
    const resp = await agent.post('/api/tickets/1/ask', {
      data: { question: 'What format?' },
    });
    expect(resp.status()).toBe(409);
  });

  test('ask on an ON_HOLD ticket → 409', async () => {
    // Ticket 7 is ON_HOLD
    const resp = await agent.post('/api/tickets/7/ask', {
      data: { question: 'Another question?' },
    });
    expect(resp.status()).toBe(409);
  });

  test('ask on unknown id → 404', async () => {
    const resp = await agent.post('/api/tickets/99999/ask', {
      data: { question: 'Does this exist?' },
    });
    expect(resp.status()).toBe(404);
  });

  test('ask on a 409-state ticket does NOT create an orphan comment', async () => {
    // Ticket 1 is TODO (not IN_PROGRESS) → will yield 409
    const before = await (await admin.get('/api/tickets/1')).json() as Ticket;
    const commentCountBefore = before.comments.length;

    const resp = await agent.post('/api/tickets/1/ask', {
      data: { question: 'Orphan question?' },
    });
    expect(resp.status()).toBe(409);

    const after = await (await admin.get('/api/tickets/1')).json() as Ticket;
    expect(after.comments.length).toBe(commentCountBefore);
  });
});

// ─── Suite: End-to-end answer/handback flow ───────────────────────────────────

test.describe('Answer/handback flow: claim → ask → answer → re-claim', () => {
  let agent: APIRequestContext;
  let admin: APIRequestContext;

  test.beforeAll(async () => {
    admin = await loginCtx('admin', 'admin123');
    await resetTickets(admin);
    agent = await agentCtx();
  });

  test.afterAll(async () => {
    await agent.dispose();
    await admin.dispose();
  });

  test('full lifecycle returns correct state and comment thread at each step', async () => {
    // Step 1: claim ticket 1 (oldest TODO+AI)
    const claimResp = await agent.get('/api/tickets/next');
    expect(claimResp.status()).toBe(200);
    const claimed = await claimResp.json() as Ticket;
    const ticketId = claimed.id;

    await test.step('claimed ticket is IN_PROGRESS, owner=AI', () => {
      expect(claimed.status).toBe('IN_PROGRESS');
      expect(claimed.owner).toBe('AI');
    });

    // Step 2: ask — hands back to human
    const askResp = await agent.post(`/api/tickets/${ticketId}/ask`, {
      data: { question: 'Which CSV delimiter should we use?' },
    });
    expect(askResp.status()).toBe(200);
    const afterAsk = await askResp.json() as Ticket;

    await test.step('after ask: ON_HOLD, owner=HUMAN', () => {
      expect(afterAsk.status).toBe('ON_HOLD');
      expect(afterAsk.owner).toBe('HUMAN');
    });

    await test.step('after ask: AGENT comment with question in thread', () => {
      const agentComment = afterAsk.comments.find(
        (c) => c.author === 'AGENT' && c.body === 'Which CSV delimiter should we use?',
      );
      expect(agentComment).toBeDefined();
    });

    // Step 3: human answers with handBackToAi=true
    const answerResp = await admin.post(`/api/tickets/${ticketId}/comments`, {
      data: { body: 'Use semicolon for German Excel compatibility.', handBackToAi: true },
    });
    expect(answerResp.status()).toBe(200);
    const afterAnswer = await answerResp.json() as Ticket;

    await test.step('after handback: status=TODO, owner=AI', () => {
      expect(afterAnswer.status).toBe('TODO');
      expect(afterAnswer.owner).toBe('AI');
    });

    await test.step('after handback: solution cleared', () => {
      expect(afterAnswer.solution).toBeNull();
    });

    await test.step('after handback: HUMAN comment in thread', () => {
      const humanComment = afterAnswer.comments.find(
        (c) => c.author === 'HUMAN' && c.body === 'Use semicolon for German Excel compatibility.',
      );
      expect(humanComment).toBeDefined();
    });

    // Step 4: re-claim via /next — must include full thread oldest-first
    // First reset claimed tickets so this specific one is available again without draining all
    // (ticketId=1 is now TODO+AI again after handback)
    const reclaimResp = await agent.get('/api/tickets/next');
    expect(reclaimResp.status()).toBe(200);
    const reclaimed = await reclaimResp.json() as Ticket;

    await test.step('re-claimed ticket is the same ticket (id matches)', () => {
      expect(reclaimed.id).toBe(ticketId);
    });

    await test.step('re-claimed ticket is IN_PROGRESS', () => {
      expect(reclaimed.status).toBe('IN_PROGRESS');
    });

    await test.step('re-claimed pickedUpAt is a non-empty string', () => {
      expect(typeof reclaimed.pickedUpAt).toBe('string');
      expect((reclaimed.pickedUpAt as string).length).toBeGreaterThan(0);
    });

    await test.step('full comment thread returned oldest-first', () => {
      expect(reclaimed.comments.length).toBeGreaterThanOrEqual(2);
      // First comment should be the AGENT question
      const firstComment = reclaimed.comments[0];
      expect(firstComment.author).toBe('AGENT');
      // Second should be HUMAN answer
      const secondComment = reclaimed.comments[1];
      expect(secondComment.author).toBe('HUMAN');
    });

    await test.step('comments are oldest-first (ascending createdAt)', () => {
      for (let i = 1; i < reclaimed.comments.length; i++) {
        const prev = reclaimed.comments[i - 1].createdAt;
        const curr = reclaimed.comments[i].createdAt;
        expect(prev <= curr).toBe(true);
      }
    });
  });
});

// ─── Suite: POST /api/tickets/:id/wont-do ────────────────────────────────────

test.describe('POST /api/tickets/:id/wont-do', () => {
  let admin: APIRequestContext;

  test.beforeEach(async () => {
    admin = await loginCtx('admin', 'admin123');
    await resetTickets(admin);
  });

  test.afterEach(async () => {
    await admin.dispose();
  });

  test('wont-do on owner=HUMAN ticket → DONE, solution=WONT_DO, resolvedAt set', async () => {
    // Ticket 7 is ON_HOLD+HUMAN after reset
    const resp = await admin.post('/api/tickets/7/wont-do', { data: {} });

    await test.step('status 200', () => { expect(resp.status()).toBe(200); });

    const body = await resp.json() as Ticket;
    await test.step('status is DONE', () => { expect(body.status).toBe('DONE'); });
    await test.step('solution is WONT_DO', () => { expect(body.solution).toBe('WONT_DO'); });
    await test.step('resolvedAt is set', () => {
      expect(typeof body.resolvedAt).toBe('string');
      expect((body.resolvedAt as string).length).toBeGreaterThan(0);
    });

    // Side-effect: re-fetch and confirm persisted fields match mutation response
    const persisted = await (await admin.get('/api/tickets/7')).json() as Ticket;
    await test.step('persisted status is DONE', () => { expect(persisted.status).toBe('DONE'); });
    await test.step('persisted solution is WONT_DO', () => { expect(persisted.solution).toBe('WONT_DO'); });
    await test.step('persisted resolvedAt matches response', () => {
      expect(persisted.resolvedAt).toBe(body.resolvedAt);
    });
  });

  test('wont-do with optional comment → HUMAN comment stored', async () => {
    const resp = await admin.post('/api/tickets/7/wont-do', {
      data: { comment: 'Descoped for this release.' },
    });
    expect(resp.status()).toBe(200);
    const body = await resp.json() as Ticket;

    const humanComment = body.comments.find(
      (c) => c.author === 'HUMAN' && c.body === 'Descoped for this release.',
    );
    expect(humanComment).toBeDefined();
  });

  test('wont-do on owner=AI ticket → 409 with status field in error body', async () => {
    // Ticket 1 is TODO+AI after reset
    const resp = await admin.post('/api/tickets/1/wont-do', { data: {} });
    expect(resp.status()).toBe(409);
    const body = await resp.json() as ErrorBody;
    expect(body.status).toBe(409);
  });

  test('wont-do on already-DONE ticket → 409', async () => {
    // Mark ticket 7 as wont-do first
    const first = await admin.post('/api/tickets/7/wont-do', { data: {} });
    expect(first.status()).toBe(200);

    // Try again on the now-DONE ticket
    const second = await admin.post('/api/tickets/7/wont-do', { data: {} });
    expect(second.status()).toBe(409);
  });

  test('wont-do on unknown id → 404', async () => {
    const resp = await admin.post('/api/tickets/99999/wont-do', { data: {} });
    expect(resp.status()).toBe(404);
  });

  test('no agent endpoint for wont-do — agent token returns 401 (no session)', async () => {
    const agent = await agentCtx();
    const resp = await agent.post('/api/tickets/7/wont-do', { data: {} });
    // agent context has no session cookie → 401
    expect(resp.status()).toBe(401);
    await agent.dispose();
  });
});

// ─── Suite: PATCH /api/tickets/:id/status ────────────────────────────────────

test.describe('PATCH /api/tickets/:id/status', () => {
  let admin: APIRequestContext;

  test.beforeEach(async () => {
    admin = await loginCtx('admin', 'admin123');
    await resetTickets(admin);
  });

  test.afterEach(async () => {
    await admin.dispose();
  });

  test('move to IN_PROGRESS → status changed, owner unchanged', async () => {
    const resp = await admin.patch('/api/tickets/1/status', { data: { status: 'IN_PROGRESS' } });
    expect(resp.status()).toBe(200);
    const body = await resp.json() as Ticket;
    expect(body.status).toBe('IN_PROGRESS');
    expect(body.owner).toBe('AI'); // owner never changed
    expect(body.solution).toBeNull();

    // Side-effect: re-fetch and confirm persisted status
    const persisted = await (await admin.get('/api/tickets/1')).json() as Ticket;
    expect(persisted.status).toBe('IN_PROGRESS');
    expect(persisted.owner).toBe('AI');
  });

  test('move into DONE → status=DONE, solution=DONE, resolvedAt set', async () => {
    const resp = await admin.patch('/api/tickets/1/status', { data: { status: 'DONE' } });
    expect(resp.status()).toBe(200);
    const body = await resp.json() as Ticket;

    await test.step('status is DONE', () => { expect(body.status).toBe('DONE'); });
    await test.step('solution is DONE', () => { expect(body.solution).toBe('DONE'); });
    await test.step('resolvedAt is set', () => {
      expect(typeof body.resolvedAt).toBe('string');
      expect((body.resolvedAt as string).length).toBeGreaterThan(0);
    });
    await test.step('owner unchanged', () => { expect(body.owner).toBe('AI'); });
  });

  test('move out of DONE → solution cleared, resolvedAt cleared', async () => {
    // First move to DONE
    await admin.patch('/api/tickets/1/status', { data: { status: 'DONE' } });

    // Then drag back out to IN_PROGRESS
    const resp = await admin.patch('/api/tickets/1/status', { data: { status: 'IN_PROGRESS' } });
    expect(resp.status()).toBe(200);
    const body = await resp.json() as Ticket;

    await test.step('status is IN_PROGRESS', () => { expect(body.status).toBe('IN_PROGRESS'); });
    await test.step('solution cleared', () => { expect(body.solution).toBeNull(); });
    await test.step('resolvedAt cleared', () => { expect(body.resolvedAt).toBeNull(); });
    await test.step('owner unchanged', () => { expect(body.owner).toBe('AI'); });
  });

  test('move a HUMAN-owned ticket to DONE → solution=DONE, owner stays HUMAN', async () => {
    // Ticket 7 is ON_HOLD+HUMAN
    const resp = await admin.patch('/api/tickets/7/status', { data: { status: 'DONE' } });
    expect(resp.status()).toBe(200);
    const body = await resp.json() as Ticket;
    expect(body.status).toBe('DONE');
    expect(body.solution).toBe('DONE');
    expect(body.owner).toBe('HUMAN'); // owner never changed
  });

  test('invalid status value → 400 with fieldErrors.status', async () => {
    const resp = await admin.patch('/api/tickets/1/status', { data: { status: 'BOGUS' } });
    await test.step('status 400', () => { expect(resp.status()).toBe(400); });
    const body = await resp.json() as ErrorBody;
    await test.step('fieldErrors.status present', () => {
      expect(typeof body.fieldErrors?.['status']).toBe('string');
    });
  });

  test('unknown id → 404', async () => {
    const resp = await admin.patch('/api/tickets/99999/status', { data: { status: 'TODO' } });
    expect(resp.status()).toBe(404);
  });
});

// ─── Suite: PATCH /api/tickets/:id/owner ─────────────────────────────────────

test.describe('PATCH /api/tickets/:id/owner', () => {
  let admin: APIRequestContext;

  test.beforeEach(async () => {
    admin = await loginCtx('admin', 'admin123');
    await resetTickets(admin);
  });

  test.afterEach(async () => {
    await admin.dispose();
  });

  test('flip AI → HUMAN: owner changes, status and solution unchanged', async () => {
    const resp = await admin.patch('/api/tickets/1/owner', { data: { owner: 'HUMAN' } });
    expect(resp.status()).toBe(200);
    const body = await resp.json() as Ticket;
    expect(body.owner).toBe('HUMAN');
    expect(body.status).toBe('TODO'); // status unchanged
    expect(body.solution).toBeNull();

    // Side-effect: re-fetch and confirm persisted owner
    const persisted = await (await admin.get('/api/tickets/1')).json() as Ticket;
    expect(persisted.owner).toBe('HUMAN');
    expect(persisted.status).toBe('TODO');
  });

  test('flip HUMAN → AI: owner changes', async () => {
    // Ticket 7 is HUMAN-owned
    const resp = await admin.patch('/api/tickets/7/owner', { data: { owner: 'AI' } });
    expect(resp.status()).toBe(200);
    const body = await resp.json() as Ticket;
    expect(body.owner).toBe('AI');
    expect(body.status).toBe('ON_HOLD'); // status unchanged
  });

  test('invalid owner value → 400 with fieldErrors.owner', async () => {
    const resp = await admin.patch('/api/tickets/1/owner', { data: { owner: 'ROBOT' } });
    await test.step('status 400', () => { expect(resp.status()).toBe(400); });
    const body = await resp.json() as ErrorBody;
    await test.step('fieldErrors.owner present', () => {
      expect(typeof body.fieldErrors?.['owner']).toBe('string');
    });
  });

  test('unknown id → 404', async () => {
    const resp = await admin.patch('/api/tickets/99999/owner', { data: { owner: 'AI' } });
    expect(resp.status()).toBe(404);
  });
});

// ─── Suite: POST /api/tickets (create) ───────────────────────────────────────

test.describe('POST /api/tickets', () => {
  let admin: APIRequestContext;

  test.beforeAll(async () => {
    admin = await loginCtx('admin', 'admin123');
    await resetTickets(admin);
  });

  test.afterAll(async () => {
    await admin.dispose();
  });

  test('create with valid payload → 201, owner=HUMAN, status=TODO, solution=null', async () => {
    const resp = await admin.post('/api/tickets', {
      data: { type: 'BUG', title: 'Test Bug Ticket', body: 'Reproduction steps here.' },
    });

    await test.step('status 201', () => { expect(resp.status()).toBe(201); });

    const body = await resp.json() as Ticket;

    await test.step('owner defaults to HUMAN', () => { expect(body.owner).toBe('HUMAN'); });
    await test.step('status defaults to TODO', () => { expect(body.status).toBe('TODO'); });
    await test.step('solution is null', () => { expect(body.solution).toBeNull(); });
    await test.step('type is BUG', () => { expect(body.type).toBe('BUG'); });
    await test.step('title stored', () => { expect(body.title).toBe('Test Bug Ticket'); });
    await test.step('id is a positive integer', () => {
      expect(typeof body.id).toBe('number');
      expect(body.id).toBeGreaterThan(0);
    });
    await test.step('comments is empty array', () => {
      expect(Array.isArray(body.comments)).toBe(true);
      expect(body.comments.length).toBe(0);
    });
  });

  test('bad type value → 400 with fieldErrors.type', async () => {
    const resp = await admin.post('/api/tickets', {
      data: { type: 'INVALID', title: 'T', body: 'B' },
    });
    await test.step('status 400', () => { expect(resp.status()).toBe(400); });
    const body = await resp.json() as ErrorBody;
    await test.step('fieldErrors.type present', () => {
      expect(typeof body.fieldErrors?.['type']).toBe('string');
    });
  });

  test('missing title → 400 with fieldErrors', async () => {
    const resp = await admin.post('/api/tickets', {
      data: { type: 'FEATURE', body: 'B' },
    });
    expect(resp.status()).toBe(400);
  });

  test('missing body → 400 with fieldErrors', async () => {
    const resp = await admin.post('/api/tickets', {
      data: { type: 'FEATURE', title: 'T' },
    });
    expect(resp.status()).toBe(400);
  });
});

// ─── Suite: GET /api/tickets (list) ──────────────────────────────────────────

test.describe('GET /api/tickets', () => {
  let admin: APIRequestContext;

  test.beforeAll(async () => {
    admin = await loginCtx('admin', 'admin123');
    await resetTickets(admin);
  });

  test.afterAll(async () => {
    await admin.dispose();
  });

  test('returns 200 with Spring-Data page shape and 12 total elements', async () => {
    const resp = await admin.get('/api/tickets');

    await test.step('status 200', () => { expect(resp.status()).toBe(200); });

    const body = await resp.json() as PageResult<TicketListItem>;

    await test.step('totalElements is 12 (seeded count)', () => {
      expect(body.totalElements).toBe(12);
    });
    await test.step('content is an array', () => {
      expect(Array.isArray(body.content)).toBe(true);
    });
    await test.step('number is 0 (first page, 0-indexed)', () => {
      expect(body.number).toBe(0);
    });
    await test.step('first is true', () => {
      expect(body.first).toBe(true);
    });
    await test.step('size is a positive integer', () => {
      expect(body.size).toBeGreaterThan(0);
    });
    await test.step('totalPages is a positive integer', () => {
      expect(body.totalPages).toBeGreaterThan(0);
    });
    await test.step('last reflects whether this is the last page', () => {
      // With 12 elements on one page (default size >= 12), last should be true
      expect(typeof body.last).toBe('boolean');
      // If all fit on first page, last === true
      if (body.totalElements <= body.size) {
        expect(body.last).toBe(true);
      }
    });
  });

  test('filter by status=ON_HOLD returns only ON_HOLD tickets', async () => {
    const resp = await admin.get('/api/tickets?status=ON_HOLD');
    expect(resp.status()).toBe(200);
    const body = await resp.json() as PageResult<TicketListItem>;

    await test.step('totalElements is 3 (7,9,11 are ON_HOLD)', () => {
      expect(body.totalElements).toBe(3);
    });
    await test.step('all content items have status ON_HOLD', () => {
      for (const item of body.content) {
        expect(item.status).toBe('ON_HOLD');
      }
    });
  });

  test('filter by owner=AI returns only AI-owned tickets', async () => {
    const resp = await admin.get('/api/tickets?owner=AI');
    expect(resp.status()).toBe(200);
    const body = await resp.json() as PageResult<TicketListItem>;
    await test.step('totalElements is 9 (tickets 1-6,8,10,12)', () => {
      expect(body.totalElements).toBe(9);
    });
    for (const item of body.content) {
      expect(item.owner).toBe('AI');
    }
  });

  test('filter by type=CHORE returns only CHORE tickets', async () => {
    const resp = await admin.get('/api/tickets?type=CHORE');
    expect(resp.status()).toBe(200);
    const body = await resp.json() as PageResult<TicketListItem>;
    await test.step('totalElements is 2 (tickets 8 and 10)', () => {
      expect(body.totalElements).toBe(2);
    });
    for (const item of body.content) {
      expect(item.type).toBe('CHORE');
    }
  });

  test('invalid status param → 400 with fieldErrors.status', async () => {
    const resp = await admin.get('/api/tickets?status=BOGUS');
    await test.step('status 400', () => { expect(resp.status()).toBe(400); });
    const body = await resp.json() as ErrorBody;
    expect(typeof body.fieldErrors?.['status']).toBe('string');
  });

  test('invalid type param → 400 with fieldErrors.type', async () => {
    const resp = await admin.get('/api/tickets?type=NOPE');
    await test.step('status 400', () => { expect(resp.status()).toBe(400); });
    const body = await resp.json() as ErrorBody;
    expect(typeof body.fieldErrors?.['type']).toBe('string');
  });

  test('invalid owner param → 400 with fieldErrors.owner', async () => {
    const resp = await admin.get('/api/tickets?owner=ROBOT');
    await test.step('status 400', () => { expect(resp.status()).toBe(400); });
    const body = await resp.json() as ErrorBody;
    expect(typeof body.fieldErrors?.['owner']).toBe('string');
  });
});

// ─── Suite: GET /api/tickets/:id ─────────────────────────────────────────────

test.describe('GET /api/tickets/:id', () => {
  let admin: APIRequestContext;

  test.beforeAll(async () => {
    admin = await loginCtx('admin', 'admin123');
    await resetTickets(admin);
  });

  test.afterAll(async () => {
    await admin.dispose();
  });

  test('existing AI-owned ticket → 200 with correct shape', async () => {
    const resp = await admin.get('/api/tickets/1');
    expect(resp.status()).toBe(200);
    const body = await resp.json() as Ticket;
    expect(body.id).toBe(1);
    expect(body.owner).toBe('AI');
    expect(body.status).toBe('TODO');
    expect(Array.isArray(body.comments)).toBe(true);
    expect(body.comments.length).toBe(0); // ticket 1 has no seeded comments
  });

  test('ON_HOLD ticket includes its seeded AGENT comment', async () => {
    // Ticket 7 has 1 seeded AGENT comment
    const resp = await admin.get('/api/tickets/7');
    expect(resp.status()).toBe(200);
    const body = await resp.json() as Ticket;
    expect(body.status).toBe('ON_HOLD');
    expect(body.owner).toBe('HUMAN');
    expect(body.comments.length).toBe(1);
    expect(body.comments[0].author).toBe('AGENT');
  });

  test('unknown id → 404', async () => {
    const resp = await admin.get('/api/tickets/99999');
    expect(resp.status()).toBe(404);
  });
});

// ─── Suite: GET /api/tickets/board ───────────────────────────────────────────

test.describe('GET /api/tickets/board', () => {
  let admin: APIRequestContext;

  test.beforeAll(async () => {
    admin = await loginCtx('admin', 'admin123');
    await resetTickets(admin);
  });

  test.afterAll(async () => {
    await admin.dispose();
  });

  test('returns all four column arrays with correct counts', async () => {
    const resp = await admin.get('/api/tickets/board');

    await test.step('status 200', () => { expect(resp.status()).toBe(200); });

    const body = await resp.json() as TicketBoard;

    await test.step('TODO has 9 tickets (1-6,8,10,12)', () => {
      expect(body.TODO.length).toBe(9);
    });
    await test.step('IN_PROGRESS is empty', () => {
      expect(body.IN_PROGRESS.length).toBe(0);
    });
    await test.step('ON_HOLD has 3 tickets (7,9,11)', () => {
      expect(body.ON_HOLD.length).toBe(3);
    });
    await test.step('DONE is empty', () => {
      expect(body.DONE.length).toBe(0);
    });
  });

  test('each ticket includes commentCount', async () => {
    const resp = await admin.get('/api/tickets/board');
    const body = await resp.json() as TicketBoard;

    await test.step('TODO tickets have commentCount=0', () => {
      for (const t of body.TODO) {
        expect(typeof t.commentCount).toBe('number');
        expect(t.commentCount).toBe(0);
      }
    });

    await test.step('ON_HOLD tickets (7,9,11) have commentCount=1', () => {
      for (const t of body.ON_HOLD) {
        expect(t.commentCount).toBe(1);
      }
    });
  });

  test('board items include owner, type, and solution fields', async () => {
    const resp = await admin.get('/api/tickets/board');
    const body = await resp.json() as TicketBoard;

    // All TODO items should be AI-owned
    for (const t of body.TODO) {
      expect(t.owner).toBe('AI');
      expect(t.solution).toBeNull();
    }
    // All ON_HOLD items should be HUMAN-owned
    for (const t of body.ON_HOLD) {
      expect(t.owner).toBe('HUMAN');
    }
  });
});

// ─── Suite: GET /api/tickets/summary ─────────────────────────────────────────

test.describe('GET /api/tickets/summary', () => {
  let admin: APIRequestContext;

  test.beforeAll(async () => {
    admin = await loginCtx('admin', 'admin123');
    await resetTickets(admin);
  });

  test.afterAll(async () => {
    await admin.dispose();
  });

  test('returns correct counts on fresh seeded data', async () => {
    const resp = await admin.get('/api/tickets/summary');

    await test.step('status 200', () => { expect(resp.status()).toBe(200); });

    const body = await resp.json() as TicketSummary;

    await test.step('byStatus has all four keys', () => {
      expect(typeof body.byStatus['TODO']).toBe('number');
      expect(typeof body.byStatus['IN_PROGRESS']).toBe('number');
      expect(typeof body.byStatus['ON_HOLD']).toBe('number');
      expect(typeof body.byStatus['DONE']).toBe('number');
    });

    await test.step('byStatus.TODO is 9', () => {
      expect(body.byStatus['TODO']).toBe(9);
    });

    await test.step('byStatus.ON_HOLD is 3', () => {
      expect(body.byStatus['ON_HOLD']).toBe(3);
    });

    await test.step('byStatus.IN_PROGRESS is 0', () => {
      expect(body.byStatus['IN_PROGRESS']).toBe(0);
    });

    await test.step('byStatus.DONE is 0', () => {
      expect(body.byStatus['DONE']).toBe(0);
    });

    await test.step('byType has FEATURE, BUG, CHORE keys', () => {
      expect(typeof body.byType['FEATURE']).toBe('number');
      expect(typeof body.byType['BUG']).toBe('number');
      expect(typeof body.byType['CHORE']).toBe('number');
    });

    await test.step('byType.CHORE is 2 (tickets 8 and 10)', () => {
      expect(body.byType['CHORE']).toBe(2);
    });

    await test.step('byType.FEATURE is 10 (12 total - 2 CHORE)', () => {
      expect(body.byType['FEATURE']).toBe(10);
    });

    await test.step('byOwner has AI and HUMAN keys', () => {
      expect(typeof body.byOwner['AI']).toBe('number');
      expect(typeof body.byOwner['HUMAN']).toBe('number');
    });

    await test.step('byOwner.AI is 9', () => {
      expect(body.byOwner['AI']).toBe(9);
    });

    await test.step('byOwner.HUMAN is 3 (tickets 7,9,11)', () => {
      expect(body.byOwner['HUMAN']).toBe(3);
    });

    await test.step('bySolution has DONE and WONT_DO keys', () => {
      expect(typeof body.bySolution['DONE']).toBe('number');
      expect(typeof body.bySolution['WONT_DO']).toBe('number');
    });

    await test.step('bySolution.DONE is 0 on fresh seed', () => {
      expect(body.bySolution['DONE']).toBe(0);
    });

    await test.step('bySolution.WONT_DO is 0 on fresh seed', () => {
      expect(body.bySolution['WONT_DO']).toBe(0);
    });
  });
});

// ─── Suite: POST /api/tickets/reset ──────────────────────────────────────────

test.describe('POST /api/tickets/reset', () => {
  let admin: APIRequestContext;
  let agent: APIRequestContext;

  test.beforeAll(async () => {
    admin = await loginCtx('admin', 'admin123');
    await resetTickets(admin);
    agent = await agentCtx();
  });

  test.afterAll(async () => {
    await admin.dispose();
    await agent.dispose();
  });

  test('reset returns 200 with seeded count of 12', async () => {
    // Mutate state before reset to prove it actually resets
    const claimResp = await agent.get('/api/tickets/next');
    expect(claimResp.status()).toBe(200);

    const resetResp = await admin.post('/api/tickets/reset');

    await test.step('status 200', () => { expect(resetResp.status()).toBe(200); });

    const body = await resetResp.json() as { seeded: number };

    await test.step('response has seeded key', () => {
      expect(typeof body.seeded).toBe('number');
    });

    await test.step('seeded count is 12', () => {
      expect(body.seeded).toBe(12);
    });
  });

  test('after reset: board shows 9 TODO and 3 ON_HOLD', async () => {
    await admin.post('/api/tickets/reset');
    const boardResp = await admin.get('/api/tickets/board');
    const board = await boardResp.json() as TicketBoard;
    expect(board.TODO.length).toBe(9);
    expect(board.ON_HOLD.length).toBe(3);
    expect(board.IN_PROGRESS.length).toBe(0);
    expect(board.DONE.length).toBe(0);
  });

  test('after reset: ON_HOLD tickets (7,9,11) each have 1 seeded AGENT comment', async () => {
    await admin.post('/api/tickets/reset');

    for (const id of [7, 9, 11]) {
      const resp = await admin.get(`/api/tickets/${id}`);
      expect(resp.status()).toBe(200);
      const ticket = await resp.json() as Ticket;
      await test.step(`ticket ${id} has status ON_HOLD`, () => {
        expect(ticket.status).toBe('ON_HOLD');
      });
      await test.step(`ticket ${id} has owner HUMAN`, () => {
        expect(ticket.owner).toBe('HUMAN');
      });
      await test.step(`ticket ${id} has exactly 1 comment`, () => {
        expect(ticket.comments.length).toBe(1);
      });
      await test.step(`ticket ${id} comment is from AGENT`, () => {
        expect(ticket.comments[0].author).toBe('AGENT');
      });
    }
  });

  test('after reset: mutations from previous tests are gone', async () => {
    // Create a new ticket to confirm it disappears after reset
    const createResp = await admin.post('/api/tickets', {
      data: { type: 'BUG', title: 'Transient ticket', body: 'Should vanish after reset.' },
    });
    expect(createResp.status()).toBe(201);

    await admin.post('/api/tickets/reset');

    const listResp = await admin.get('/api/tickets');
    const list = await listResp.json() as PageResult<TicketListItem>;

    // After reset, only 12 seeded tickets remain
    expect(list.totalElements).toBe(12);
  });

  test('user role on reset → 403', async () => {
    const userCtx = await loginCtx('user', 'test123');
    const resp = await userCtx.post('/api/tickets/reset');
    expect(resp.status()).toBe(403);
    await userCtx.dispose();
  });
});

// ─── Suite: Validation — bad enum values ─────────────────────────────────────

test.describe('Validation — bad enum values', () => {
  let admin: APIRequestContext;

  test.beforeAll(async () => {
    admin = await loginCtx('admin', 'admin123');
    await resetTickets(admin);
  });

  test.afterAll(async () => {
    await admin.dispose();
  });

  test('PATCH /status with invalid status → 400', async () => {
    const resp = await admin.patch('/api/tickets/1/status', { data: { status: 'NOPE' } });
    expect(resp.status()).toBe(400);
    const body = await resp.json() as ErrorBody;
    expect(typeof body.fieldErrors).toBe('object');
  });

  test('PATCH /owner with invalid owner → 400', async () => {
    const resp = await admin.patch('/api/tickets/1/owner', { data: { owner: 'NOPE' } });
    expect(resp.status()).toBe(400);
    const body = await resp.json() as ErrorBody;
    expect(typeof body.fieldErrors).toBe('object');
  });

  test('POST / with invalid type → 400', async () => {
    const resp = await admin.post('/api/tickets', {
      data: { type: 'INVALID_TYPE', title: 'T', body: 'B' },
    });
    expect(resp.status()).toBe(400);
    const body = await resp.json() as ErrorBody;
    expect(typeof body.fieldErrors).toBe('object');
  });

  test('GET /?type=BAD → 400', async () => {
    const resp = await admin.get('/api/tickets?type=BAD');
    expect(resp.status()).toBe(400);
  });

  test('GET /?status=BAD → 400', async () => {
    const resp = await admin.get('/api/tickets?status=BAD');
    expect(resp.status()).toBe(400);
  });

  test('GET /?owner=BAD → 400', async () => {
    const resp = await admin.get('/api/tickets?owner=BAD');
    expect(resp.status()).toBe(400);
  });

  test('GET /next?type=BAD → 400', async () => {
    const agent = await agentCtx();
    const resp = await agent.get('/api/tickets/next?type=BAD');
    expect(resp.status()).toBe(400);
    await agent.dispose();
  });

  test('POST /:id/comments with empty body → 400', async () => {
    const resp = await admin.post('/api/tickets/1/comments', { data: { body: '' } });
    expect(resp.status()).toBe(400);
    const body = await resp.json() as ErrorBody;
    expect(typeof body.fieldErrors).toBe('object');
  });
});

// ─── Suite: POST /:id/comments with handBackToAi:false ───────────────────────

test.describe('POST /:id/comments — handBackToAi:false leaves status/owner unchanged', () => {
  let admin: APIRequestContext;

  test.beforeEach(async () => {
    admin = await loginCtx('admin', 'admin123');
    await resetTickets(admin);
  });

  test.afterEach(async () => {
    await admin.dispose();
  });

  test('comment on ON_HOLD/owner=HUMAN ticket with handBackToAi:false → status and owner unchanged', async () => {
    // Ticket 7 is ON_HOLD+HUMAN after reset
    const before = await (await admin.get('/api/tickets/7')).json() as Ticket;
    const commentCountBefore = before.comments.length;

    const resp = await admin.post('/api/tickets/7/comments', {
      data: { body: 'Still looking into this.', handBackToAi: false },
    });

    await test.step('response is 200', () => { expect(resp.status()).toBe(200); });

    const body = await resp.json() as Ticket;

    await test.step('status remains ON_HOLD', () => { expect(body.status).toBe('ON_HOLD'); });
    await test.step('owner remains HUMAN', () => { expect(body.owner).toBe('HUMAN'); });
    await test.step('comment count increased by 1', () => {
      expect(body.comments.length).toBe(commentCountBefore + 1);
    });
    await test.step('new comment is from HUMAN with correct body', () => {
      const newComment = body.comments.find(
        (c) => c.author === 'HUMAN' && c.body === 'Still looking into this.',
      );
      expect(newComment).toBeDefined();
    });

    // Side-effect: re-fetch and confirm status/owner persisted unchanged
    const persisted = await (await admin.get('/api/tickets/7')).json() as Ticket;
    await test.step('persisted status is still ON_HOLD', () => { expect(persisted.status).toBe('ON_HOLD'); });
    await test.step('persisted owner is still HUMAN', () => { expect(persisted.owner).toBe('HUMAN'); });
    await test.step('persisted comment count matches', () => {
      expect(persisted.comments.length).toBe(commentCountBefore + 1);
    });
  });
});

// ─── Suite: POST /:id/comments handBackToAi guard ────────────────────────────

test.describe('POST /:id/comments — handBackToAi guard (only ON_HOLD+HUMAN allowed)', () => {
  let admin: APIRequestContext;

  test.beforeEach(async () => {
    admin = await loginCtx('admin', 'admin123');
    await resetTickets(admin);
  });

  test.afterEach(async () => {
    await admin.dispose();
  });

  test('handBackToAi:true on a DONE ticket → 409, ticket stays DONE', async () => {
    // Create a fresh ticket (HUMAN+TODO), then drag it to DONE via PATCH /status
    const createResp = await admin.post('/api/tickets', {
      data: { type: 'BUG', title: 'Will be done', body: 'To be resolved.' },
    });
    expect(createResp.status()).toBe(201);
    const created = await createResp.json() as Ticket;
    const ticketId = created.id;

    // Move to DONE
    const doneResp = await admin.patch(`/api/tickets/${ticketId}/status`, {
      data: { status: 'DONE' },
    });
    expect(doneResp.status()).toBe(200);

    // Attempt hand-back — must be rejected
    const resp = await admin.post(`/api/tickets/${ticketId}/comments`, {
      data: { body: 'Trying to resurrect.', handBackToAi: true },
    });

    await test.step('response is 409', () => { expect(resp.status()).toBe(409); });

    // Confirm ticket is still DONE (not resurrected to TODO)
    const persisted = await (await admin.get(`/api/tickets/${ticketId}`)).json() as Ticket;
    await test.step('ticket status is still DONE', () => { expect(persisted.status).toBe('DONE'); });
    // POST /api/tickets creates owner=HUMAN; PATCH /status never changes owner
    await test.step('ticket owner is still HUMAN (unchanged)', () => { expect(persisted.owner).toBe('HUMAN'); });
  });

  test('handBackToAi:true on a TODO ticket (owner=HUMAN) → 409', async () => {
    // Create ticket: starts as HUMAN+TODO
    const createResp = await admin.post('/api/tickets', {
      data: { type: 'FEATURE', title: 'Human TODO', body: 'Not on hold.' },
    });
    expect(createResp.status()).toBe(201);
    const created = await createResp.json() as Ticket;
    const ticketId = created.id;

    // Verify it is TODO+HUMAN
    expect(created.status).toBe('TODO');
    expect(created.owner).toBe('HUMAN');

    // Attempt hand-back on a TODO ticket — must be rejected (not ON_HOLD)
    const resp = await admin.post(`/api/tickets/${ticketId}/comments`, {
      data: { body: 'Hand back attempt on TODO.', handBackToAi: true },
    });

    await test.step('response is 409', () => { expect(resp.status()).toBe(409); });

    // Ticket must remain untouched
    const persisted = await (await admin.get(`/api/tickets/${ticketId}`)).json() as Ticket;
    await test.step('ticket status is still TODO', () => { expect(persisted.status).toBe('TODO'); });
    await test.step('ticket owner is still HUMAN', () => { expect(persisted.owner).toBe('HUMAN'); });
  });

  test('lifecycle: claim → ask → ON_HOLD+HUMAN → handBackToAi:true → TODO+AI (happy path still works)', async () => {
    // Step 1: claim a TODO+AI ticket
    const agent = await agentCtx();
    const claimResp = await agent.get('/api/tickets/next');
    expect(claimResp.status()).toBe(200);
    const claimed = await claimResp.json() as Ticket;
    const ticketId = claimed.id;

    // Step 2: ask → ON_HOLD+HUMAN
    const askResp = await agent.post(`/api/tickets/${ticketId}/ask`, {
      data: { question: 'Which approach do you prefer?' },
    });
    expect(askResp.status()).toBe(200);
    const afterAsk = await askResp.json() as Ticket;
    expect(afterAsk.status).toBe('ON_HOLD');
    expect(afterAsk.owner).toBe('HUMAN');

    // Step 3: human answers with handBackToAi:true — must succeed (guard passes)
    const answerResp = await admin.post(`/api/tickets/${ticketId}/comments`, {
      data: { body: 'Use approach B.', handBackToAi: true },
    });

    await test.step('response is 200', () => { expect(answerResp.status()).toBe(200); });

    const afterHandback = await answerResp.json() as Ticket;

    await test.step('status is TODO after handback', () => { expect(afterHandback.status).toBe('TODO'); });
    await test.step('owner is AI after handback', () => { expect(afterHandback.owner).toBe('AI'); });
    await test.step('solution is cleared', () => { expect(afterHandback.solution).toBeNull(); });

    await agent.dispose();
  });

  test('plain comment WITHOUT handBackToAi works on any status (TODO, DONE)', async () => {
    // Ticket 1 is TODO+AI after reset — plain comment must work
    const resp1 = await admin.post('/api/tickets/1/comments', {
      data: { body: 'Note on TODO ticket.' },
    });
    await test.step('plain comment on TODO → 200', () => { expect(resp1.status()).toBe(200); });

    // Move ticket 1 to DONE, then add another plain comment
    await admin.patch('/api/tickets/1/status', { data: { status: 'DONE' } });
    const resp2 = await admin.post('/api/tickets/1/comments', {
      data: { body: 'Note on DONE ticket.' },
    });
    await test.step('plain comment on DONE → 200', () => { expect(resp2.status()).toBe(200); });
  });
});
