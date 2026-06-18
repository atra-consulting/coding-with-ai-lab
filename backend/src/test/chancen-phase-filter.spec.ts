/**
 * Tests for the phase filter on GET /api/chancen.
 *
 * Covers:
 *   F-1  GET /api/chancen?phase=NEU         — returns only NEU chancen
 *   F-2  GET /api/chancen?phase=GEWONNEN    — returns only GEWONNEN chancen
 *   F-3  GET /api/chancen                   — no filter; baseline behaviour unaffected
 *   F-4  GET /api/chancen?phase=INVALID     — 400 Bad Request
 *   F-5  GET /api/chancen?phase=VERLOREN    — returns empty or non-empty result consistently
 *   F-6  GET /api/chancen (anon)            — 401
 *
 * Fixture facts (from backend/src/seed/fixture.json):
 *   - Total chancen: 40
 *   - NEU: 7, QUALIFIZIERT: 8, ANGEBOT: 6, VERHANDLUNG: 5, GEWONNEN: 10, VERLOREN: 4
 */
import { test, expect, request as playwrightRequest } from '@playwright/test';
import type { APIRequestContext } from '@playwright/test';
import { resetDatabase, loginCtx } from './helpers.js';

const BASE_URL = 'http://localhost:7070';

let adminCtx: APIRequestContext;
let anonCtx: APIRequestContext;

test.beforeAll(async () => {
  await resetDatabase();
  adminCtx = await loginCtx('admin', 'admin123');
  anonCtx = await playwrightRequest.newContext({ baseURL: BASE_URL });
});

test.afterAll(async () => {
  await adminCtx.dispose();
  await anonCtx.dispose();
});

interface ChanceDTO {
  id: number;
  titel: string;
  phase: string;
  [key: string]: unknown;
}

interface PageResponse {
  content: ChanceDTO[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
  first: boolean;
  last: boolean;
}

// ---------------------------------------------------------------------------
// F-1  Filter by phase=NEU
// ---------------------------------------------------------------------------

test('F-1: GET /api/chancen?phase=NEU returns only NEU chancen', async () => {
  const resp = await adminCtx.get('/api/chancen', {
    params: { phase: 'NEU', size: '50' },
  });

  await test.step('status 200', () => {
    expect(resp.status()).toBe(200);
  });

  const body = await resp.json() as PageResponse;

  await test.step('content is non-empty', () => {
    expect(body.content.length).toBeGreaterThan(0);
  });

  await test.step('every returned chance has phase NEU', () => {
    for (const chance of body.content) {
      expect(chance.phase).toBe('NEU');
    }
  });

  await test.step('totalElements matches fixture count for NEU (7)', () => {
    expect(body.totalElements).toBe(7);
  });
});

// ---------------------------------------------------------------------------
// F-2  Filter by phase=GEWONNEN
// ---------------------------------------------------------------------------

test('F-2: GET /api/chancen?phase=GEWONNEN returns only GEWONNEN chancen', async () => {
  const resp = await adminCtx.get('/api/chancen', {
    params: { phase: 'GEWONNEN', size: '50' },
  });

  await test.step('status 200', () => {
    expect(resp.status()).toBe(200);
  });

  const body = await resp.json() as PageResponse;

  await test.step('every returned chance has phase GEWONNEN', () => {
    for (const chance of body.content) {
      expect(chance.phase).toBe('GEWONNEN');
    }
  });

  await test.step('totalElements matches fixture count for GEWONNEN (10)', () => {
    expect(body.totalElements).toBe(10);
  });
});

// ---------------------------------------------------------------------------
// F-3  No phase param — baseline unaffected
// ---------------------------------------------------------------------------

test('F-3: GET /api/chancen without phase returns all chancen (baseline)', async () => {
  const resp = await adminCtx.get('/api/chancen', {
    params: { size: '100' },
  });

  await test.step('status 200', () => {
    expect(resp.status()).toBe(200);
  });

  const body = await resp.json() as PageResponse;

  await test.step('totalElements equals the full fixture count of 40', () => {
    expect(body.totalElements).toBe(40);
  });

  await test.step('content includes chancen from multiple phases', () => {
    const phases = new Set(body.content.map((c) => c.phase));
    expect(phases.size).toBeGreaterThan(1);
  });
});

// ---------------------------------------------------------------------------
// F-4  Invalid phase value — 400
// ---------------------------------------------------------------------------

test('F-4: GET /api/chancen?phase=INVALID returns 400', async () => {
  const resp = await adminCtx.get('/api/chancen', {
    params: { phase: 'INVALID' },
  });

  expect(resp.status()).toBe(400);
});

// ---------------------------------------------------------------------------
// F-5  Filter by phase=VERLOREN
// ---------------------------------------------------------------------------

test('F-5: GET /api/chancen?phase=VERLOREN returns only VERLOREN chancen', async () => {
  const resp = await adminCtx.get('/api/chancen', {
    params: { phase: 'VERLOREN', size: '50' },
  });

  await test.step('status 200', () => {
    expect(resp.status()).toBe(200);
  });

  const body = await resp.json() as PageResponse;

  await test.step('every returned chance has phase VERLOREN', () => {
    for (const chance of body.content) {
      expect(chance.phase).toBe('VERLOREN');
    }
  });

  await test.step('totalElements matches fixture count for VERLOREN (4)', () => {
    expect(body.totalElements).toBe(4);
  });
});

// ---------------------------------------------------------------------------
// F-6  Unauthenticated request
// ---------------------------------------------------------------------------

test('F-6: GET /api/chancen without session returns 401', async () => {
  const resp = await anonCtx.get('/api/chancen', {
    params: { phase: 'NEU' },
  });
  expect(resp.status()).toBe(401);
});
