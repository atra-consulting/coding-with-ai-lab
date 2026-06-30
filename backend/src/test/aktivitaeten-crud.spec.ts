/**
 * Playwright API tests for the Aktivitaeten CRUD routes.
 *
 * Covers:
 *   GET  /api/aktivitaeten/all   — 200, array, datum DESC sort order
 *   GET  /api/aktivitaeten       — 200, pagination shape, datum DESC sort order
 *   POST /api/aktivitaeten       — 201, response shape, id stored for later tests
 *   GET  /api/aktivitaeten/:id   — 200 for created record
 *   PUT  /api/aktivitaeten/:id   — 200, change reflected by subsequent GET
 *   DELETE /api/aktivitaeten/:id — 204; subsequent GET → 404
 *   GET  /api/aktivitaeten/99999 — 404 with standard error body
 *   GET  /api/aktivitaeten (anon) — 401
 *   GET  /api/aktivitaeten/all (anon) — 401
 */
import { test, expect, request as playwrightRequest } from '@playwright/test';
import type { APIRequestContext } from '@playwright/test';
import { resetDatabase, loginCtx } from './helpers.js';

const BASE_URL = 'http://localhost:7070';

// ---------------------------------------------------------------------------
// Suite-level state
// ---------------------------------------------------------------------------

let adminCtx: APIRequestContext;
let anonCtx: APIRequestContext;

// Tracks the aktivitaet created in POST test so later tests can reference it.
// Left undefined until POST succeeds — later tests skip themselves if it is
// missing, so a failure in POST reports as one failure, not four.
let createdId: number | undefined;

// ---------------------------------------------------------------------------
// Setup / teardown
// ---------------------------------------------------------------------------

test.beforeAll(async () => {
  await resetDatabase();
  adminCtx = await loginCtx('admin', 'admin123');
  anonCtx = await playwrightRequest.newContext({ baseURL: BASE_URL });
});

test.afterAll(async () => {
  await adminCtx.dispose();
  await anonCtx.dispose();
});

// ---------------------------------------------------------------------------
// GET /api/aktivitaeten/all — full list, datum DESC
// ---------------------------------------------------------------------------
test('GET /api/aktivitaeten/all returns 200 and is sorted datum descending', async () => {
  const resp = await adminCtx.get('/api/aktivitaeten/all');

  await test.step('status 200', () => {
    expect(resp.status()).toBe(200);
  });

  const body = await resp.json() as Array<{ id: number; datum: string }>;

  await test.step('body is an array', () => {
    expect(Array.isArray(body)).toBe(true);
  });

  await test.step('array is non-empty (fixture data present)', () => {
    expect(body.length).toBeGreaterThan(0);
  });

  await test.step('adjacent pairs are sorted datum descending', () => {
    for (let i = 0; i < body.length - 1; i++) {
      expect(body[i].datum >= body[i + 1].datum).toBe(true);
    }
  });
});

// ---------------------------------------------------------------------------
// GET /api/aktivitaeten — paginated, datum DESC
// ---------------------------------------------------------------------------
test('GET /api/aktivitaeten returns 200 with valid pagination shape and default sort datum descending', async () => {
  const resp = await adminCtx.get('/api/aktivitaeten');

  await test.step('status 200', () => {
    expect(resp.status()).toBe(200);
  });

  const body = await resp.json() as {
    content: Array<{ datum: string }>;
    totalElements: number;
    totalPages: number;
    size: number;
    number: number;
    first: boolean;
    last: boolean;
  };

  await test.step('content is an array', () => {
    expect(Array.isArray(body.content)).toBe(true);
  });

  await test.step('totalElements > 0 (fixture data present)', () => {
    expect(body.totalElements).toBeGreaterThan(0);
  });

  await test.step('totalPages > 0', () => {
    expect(body.totalPages).toBeGreaterThan(0);
  });

  await test.step('size > 0', () => {
    expect(body.size).toBeGreaterThan(0);
  });

  await test.step('number is 0 (first page, 0-indexed)', () => {
    expect(body.number).toBe(0);
  });

  await test.step('first is boolean', () => {
    expect(typeof body.first).toBe('boolean');
  });

  await test.step('last is boolean', () => {
    expect(typeof body.last).toBe('boolean');
  });

  await test.step('adjacent pairs in content are sorted datum descending', () => {
    expect(body.content.length).toBeGreaterThan(1);
    for (let i = 0; i < body.content.length - 1; i++) {
      expect(body.content[i].datum >= body.content[i + 1].datum).toBe(true);
    }
  });
});

// ---------------------------------------------------------------------------
// POST /api/aktivitaeten — create
// ---------------------------------------------------------------------------
test('POST /api/aktivitaeten creates and returns 201', async () => {
  const resp = await adminCtx.post('/api/aktivitaeten', {
    data: {
      typ: 'ANRUF',
      subject: 'Test Aktivitaet Playwright',
      datum: '2025-06-15T10:00:00.000Z',
    },
  });

  await test.step('status 201', () => {
    expect(resp.status()).toBe(201);
  });

  const body = await resp.json() as {
    id: number;
    typ: string;
    subject: string;
    datum: string;
    createdAt: string;
    updatedAt: string;
  };

  await test.step('body.id is a positive integer', () => {
    expect(Number.isInteger(body.id)).toBe(true);
    expect(body.id).toBeGreaterThan(0);
  });

  await test.step('body.typ matches submitted value', () => {
    expect(body.typ).toBe('ANRUF');
  });

  await test.step('body.subject matches submitted value', () => {
    expect(body.subject).toBe('Test Aktivitaet Playwright');
  });

  await test.step('body.datum is a string', () => {
    expect(typeof body.datum).toBe('string');
  });

  await test.step('body.createdAt is a string', () => {
    expect(typeof body.createdAt).toBe('string');
    expect(body.createdAt.length).toBeGreaterThan(0);
  });

  await test.step('body.updatedAt is a string', () => {
    expect(typeof body.updatedAt).toBe('string');
    expect(body.updatedAt.length).toBeGreaterThan(0);
  });

  createdId = body.id;
});

// ---------------------------------------------------------------------------
// GET /api/aktivitaeten/:id — read created record
// ---------------------------------------------------------------------------
test('GET /api/aktivitaeten/:id returns 200 for the created record', async () => {
  if (!createdId) { test.skip(); return; }

  const resp = await adminCtx.get(`/api/aktivitaeten/${createdId}`);

  await test.step('status 200', () => {
    expect(resp.status()).toBe(200);
  });

  const body = await resp.json() as { id: number };

  await test.step('returned id matches createdId', () => {
    expect(body.id).toBe(createdId);
  });
});

// ---------------------------------------------------------------------------
// PUT /api/aktivitaeten/:id — update, then verify via GET
// ---------------------------------------------------------------------------
test('PUT /api/aktivitaeten/:id returns 200 and change is reflected by GET', async () => {
  if (!createdId) { test.skip(); return; }

  const putResp = await adminCtx.put(`/api/aktivitaeten/${createdId}`, {
    data: {
      typ: 'ANRUF',
      subject: 'Geänderter Betreff',
      datum: '2025-06-15T10:00:00.000Z',
    },
  });

  await test.step('PUT returns 200', () => {
    expect(putResp.status()).toBe(200);
  });

  const putBody = await putResp.json() as { subject: string };

  await test.step('PUT response subject reflects update', () => {
    expect(putBody.subject).toBe('Geänderter Betreff');
  });

  const getResp = await adminCtx.get(`/api/aktivitaeten/${createdId}`);

  await test.step('subsequent GET returns 200', () => {
    expect(getResp.status()).toBe(200);
  });

  const getBody = await getResp.json() as { subject: string };

  await test.step('subsequent GET subject reflects update', () => {
    expect(getBody.subject).toBe('Geänderter Betreff');
  });
});

// ---------------------------------------------------------------------------
// DELETE /api/aktivitaeten/:id — delete, then verify 404
// ---------------------------------------------------------------------------
test('DELETE /api/aktivitaeten/:id returns 204; subsequent GET returns 404', async () => {
  if (!createdId) { test.skip(); return; }

  const deleteResp = await adminCtx.delete(`/api/aktivitaeten/${createdId}`);

  await test.step('DELETE returns 204', () => {
    expect(deleteResp.status()).toBe(204);
  });

  const getResp = await adminCtx.get(`/api/aktivitaeten/${createdId}`);

  await test.step('subsequent GET returns 404', () => {
    expect(getResp.status()).toBe(404);
  });

  createdId = undefined;
});

// ---------------------------------------------------------------------------
// GET /api/aktivitaeten/99999 — not found
// ---------------------------------------------------------------------------
test('GET /api/aktivitaeten/99999 returns 404 with standard error body', async () => {
  const resp = await adminCtx.get('/api/aktivitaeten/99999');

  await test.step('status 404', () => {
    expect(resp.status()).toBe(404);
  });

  const body = await resp.json() as {
    status: number;
    message: string;
    timestamp: string;
    fieldErrors: Record<string, unknown>;
  };

  await test.step('error body status field is 404', () => {
    expect(body.status).toBe(404);
  });

  await test.step('error body has non-empty message', () => {
    expect(typeof body.message).toBe('string');
    expect(body.message.length).toBeGreaterThan(0);
  });

  await test.step('error body has non-empty timestamp', () => {
    expect(typeof body.timestamp).toBe('string');
    expect(body.timestamp.length).toBeGreaterThan(0);
  });

  await test.step('error body has fieldErrors object', () => {
    expect(body.fieldErrors).not.toBeNull();
    expect(typeof body.fieldErrors).toBe('object');
  });
});

// ---------------------------------------------------------------------------
// Auth — unauthenticated requests return 401
// ---------------------------------------------------------------------------
test('GET /api/aktivitaeten without session returns 401', async () => {
  const resp = await anonCtx.get('/api/aktivitaeten');

  await test.step('status 401', () => {
    expect(resp.status()).toBe(401);
  });
});

test('GET /api/aktivitaeten/all without session returns 401', async () => {
  const resp = await anonCtx.get('/api/aktivitaeten/all');

  await test.step('status 401', () => {
    expect(resp.status()).toBe(401);
  });
});
