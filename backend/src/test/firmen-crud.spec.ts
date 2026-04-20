/**
 * Smoke tests for the Firmen CRUD routes.
 *
 * Covers:
 *   6.2 GET  /api/firmen         — 200, pagination shape, number === 0, totalElements > 0
 *   6.3 POST /api/firmen         — 201, returns id and createdAt
 *   6.4 GET  /api/firmen/:id     — 200 for the newly created firma
 *   6.5 PUT  /api/firmen/:id     — 200, name change reflected by subsequent GET
 *   6.6 DELETE /api/firmen/:id   — 204; subsequent GET → 404
 *   6.7 GET  /api/firmen/99999   — 404 with standard error body
 *   6.8 GET  /api/firmen (anon)  — 401
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

// Tracks the firma created in 6.3 so later tests (6.4–6.6) can reference it.
let createdFirmaId: number;

// ---------------------------------------------------------------------------
// Setup / teardown
// ---------------------------------------------------------------------------

test.beforeAll(async () => {
  resetDatabase();
  adminCtx = await loginCtx('admin', 'admin123');
  anonCtx = await playwrightRequest.newContext({ baseURL: BASE_URL });
});

test.afterAll(async () => {
  await adminCtx.dispose();
  await anonCtx.dispose();
});

// ---------------------------------------------------------------------------
// 6.2  List — pagination shape
// ---------------------------------------------------------------------------
test('GET /api/firmen returns 200 with valid pagination shape', async () => {
  const resp = await adminCtx.get('/api/firmen');

  await test.step('status 200', () => {
    expect(resp.status()).toBe(200);
  });

  const body = await resp.json() as {
    content: unknown[];
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

  await test.step('number is 0 (first page, 0-indexed)', () => {
    expect(body.number).toBe(0);
  });

  await test.step('totalElements > 0 (fixture data present)', () => {
    expect(body.totalElements).toBeGreaterThan(0);
  });

  await test.step('totalPages is a positive integer', () => {
    expect(Number.isInteger(body.totalPages)).toBe(true);
    expect(body.totalPages).toBeGreaterThan(0);
  });

  await test.step('size is a positive integer', () => {
    expect(Number.isInteger(body.size)).toBe(true);
    expect(body.size).toBeGreaterThan(0);
  });

  await test.step('first and last are booleans', () => {
    expect(typeof body.first).toBe('boolean');
    expect(typeof body.last).toBe('boolean');
  });
});

// ---------------------------------------------------------------------------
// 6.3  Create
// ---------------------------------------------------------------------------
test('POST /api/firmen returns 201 with id and createdAt', async () => {
  const uniqueName = `Test AG ${Date.now()}`;
  const resp = await adminCtx.post('/api/firmen', {
    data: { name: uniqueName, industry: 'IT' },
  });

  await test.step('status 201', () => {
    expect(resp.status()).toBe(201);
  });

  const body = await resp.json() as {
    id: number;
    name: string;
    createdAt: string;
  };

  await test.step('body has numeric id', () => {
    expect(typeof body.id).toBe('number');
    expect(body.id).toBeGreaterThan(0);
  });

  await test.step('body has createdAt string', () => {
    expect(typeof body.createdAt).toBe('string');
    expect(body.createdAt.length).toBeGreaterThan(0);
  });

  await test.step('body has the submitted name', () => {
    expect(body.name).toBe(uniqueName);
  });

  // Store for subsequent tests
  createdFirmaId = body.id;
});

// ---------------------------------------------------------------------------
// 6.4  Read
// ---------------------------------------------------------------------------
test('GET /api/firmen/:id returns 200 for the created firma', async () => {
  const resp = await adminCtx.get(`/api/firmen/${createdFirmaId}`);

  await test.step('status 200', () => {
    expect(resp.status()).toBe(200);
  });

  const body = await resp.json() as { id: number };

  await test.step('returned id matches', () => {
    expect(body.id).toBe(createdFirmaId);
  });
});

// ---------------------------------------------------------------------------
// 6.5  Update
// ---------------------------------------------------------------------------
test('PUT /api/firmen/:id returns 200 and change is reflected by GET', async () => {
  const updatedName = `Updated AG ${Date.now()}`;
  const putResp = await adminCtx.put(`/api/firmen/${createdFirmaId}`, {
    data: { name: updatedName },
  });

  await test.step('PUT returns 200', () => {
    expect(putResp.status()).toBe(200);
  });

  const getResp = await adminCtx.get(`/api/firmen/${createdFirmaId}`);

  await test.step('subsequent GET returns 200', () => {
    expect(getResp.status()).toBe(200);
  });

  const body = await getResp.json() as { name: string };

  await test.step('name reflects the update', () => {
    expect(body.name).toBe(updatedName);
  });
});

// ---------------------------------------------------------------------------
// 6.6  Delete
// ---------------------------------------------------------------------------
test('DELETE /api/firmen/:id returns 204; subsequent GET returns 404', async () => {
  const deleteResp = await adminCtx.delete(`/api/firmen/${createdFirmaId}`);

  await test.step('DELETE returns 204', () => {
    expect(deleteResp.status()).toBe(204);
  });

  const getResp = await adminCtx.get(`/api/firmen/${createdFirmaId}`);

  await test.step('subsequent GET returns 404', () => {
    expect(getResp.status()).toBe(404);
  });
});

// ---------------------------------------------------------------------------
// 6.7  Not found — unknown id
// ---------------------------------------------------------------------------
test('GET /api/firmen/99999 returns 404 with standard error body', async () => {
  const resp = await adminCtx.get('/api/firmen/99999');

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

  await test.step('error body has timestamp string', () => {
    expect(typeof body.timestamp).toBe('string');
    expect(body.timestamp.length).toBeGreaterThan(0);
  });

  await test.step('error body has fieldErrors object', () => {
    expect(typeof body.fieldErrors).toBe('object');
    expect(body.fieldErrors).not.toBeNull();
  });
});

// ---------------------------------------------------------------------------
// 6.8  Unauthenticated request
// ---------------------------------------------------------------------------
test('GET /api/firmen without session returns 401', async () => {
  const resp = await anonCtx.get('/api/firmen');
  expect(resp.status()).toBe(401);
});
