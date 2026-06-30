/**
 * Tests for the search query parameter on GET /api/aktivitaeten.
 *
 * Covers:
 *   T-1  GET /api/aktivitaeten?search=angebot        — 14 results, every subject contains "angebot"
 *   T-2  GET /api/aktivitaeten?search=rechnung        — 5 results
 *   T-3  GET /api/aktivitaeten?search=xyzzy           — 0 results, empty content
 *   T-4  GET /api/aktivitaeten?search=ANGEBOT         — 14 results (case-insensitive match)
 *   T-5  GET /api/aktivitaeten                        — no search; baseline totalElements === 75
 *   T-6  GET /api/aktivitaeten?search=angebot (anon)  — 401
 *   T-7  GET /api/aktivitaeten?search=angebot&typ=ANRUF — exactly 4 results, all subjects contain "angebot"
 *   T-8  GET /api/aktivitaeten?search=               — empty string treated as no filter, 75 results
 *
 * Fixture facts (from backend/src/seed/fixture.json):
 *   - Total aktivitaeten: 75
 *   - Subjects containing "angebot" (case-insensitive): 14
 *   - Subjects containing "rechnung" (case-insensitive): 5
 *   - "xyzzy" matches 0 subjects
 *   - angebot + typ=ANRUF: 4
 */
import { test, expect, request as playwrightRequest } from '@playwright/test';
import type { APIRequestContext } from '@playwright/test';
import { resetDatabase, loginCtx } from './helpers.js';

const BASE_URL = 'http://localhost:7070';

// ---------------------------------------------------------------------------
// Fixture constants (derived from backend/src/seed/fixture.json)
// ---------------------------------------------------------------------------

/** Total aktivitaeten rows in the fixture. */
const TOTAL_AKTIVITAETEN = 75;

/** Number of activities whose subject contains "angebot" (case-insensitive). */
const ANGEBOT_COUNT = 14;

/** Number of activities whose subject contains "rechnung" (case-insensitive). */
const RECHNUNG_COUNT = 5;

/** Number of activities matching both search=angebot and typ=ANRUF. */
const ANGEBOT_ANRUF_COUNT = 4;

// ---------------------------------------------------------------------------
// Suite-level state
// ---------------------------------------------------------------------------

let adminCtx: APIRequestContext;
let anonCtx: APIRequestContext;

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
// Response type helpers
// ---------------------------------------------------------------------------

interface AktivitaetDTO {
  id: number;
  typ: string;
  subject: string;
  firmaId: number | null;
  [key: string]: unknown;
}

interface PageResponse {
  content: AktivitaetDTO[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
  first: boolean;
  last: boolean;
}

// ---------------------------------------------------------------------------
// T-1  search=angebot — 14 results, every subject contains "angebot"
// ---------------------------------------------------------------------------

test('T-1: GET /api/aktivitaeten?search=angebot returns 14 activities with "angebot" in subject', async () => {
  const resp = await adminCtx.get('/api/aktivitaeten', {
    params: { search: 'angebot', size: '50' },
  });

  await test.step('status 200', () => {
    expect(resp.status()).toBe(200);
  });

  const body = await resp.json() as PageResponse;

  await test.step('content is an array', () => {
    expect(Array.isArray(body.content)).toBe(true);
  });

  await test.step('totalElements matches fixture angebot count', () => {
    expect(body.totalElements).toBe(ANGEBOT_COUNT);
  });

  await test.step('content length equals totalElements (all results fit in one page)', () => {
    expect(body.content.length).toBe(ANGEBOT_COUNT);
  });

  await test.step('every returned subject contains "angebot" (case-insensitive)', () => {
    for (const ak of body.content) {
      expect(ak.subject.toLowerCase()).toContain('angebot');
    }
  });
});

// ---------------------------------------------------------------------------
// T-2  search=rechnung — 5 results
// ---------------------------------------------------------------------------

test('T-2: GET /api/aktivitaeten?search=rechnung returns 5 activities', async () => {
  const resp = await adminCtx.get('/api/aktivitaeten', {
    params: { search: 'rechnung', size: '50' },
  });

  await test.step('status 200', () => {
    expect(resp.status()).toBe(200);
  });

  const body = await resp.json() as PageResponse;

  await test.step('totalElements matches fixture rechnung count', () => {
    expect(body.totalElements).toBe(RECHNUNG_COUNT);
  });

  await test.step('every returned subject contains "rechnung" (case-insensitive)', () => {
    for (const ak of body.content) {
      expect(ak.subject.toLowerCase()).toContain('rechnung');
    }
  });
});

// ---------------------------------------------------------------------------
// T-3  search=xyzzy — 0 results, empty content
// ---------------------------------------------------------------------------

test('T-3: GET /api/aktivitaeten?search=xyzzy returns 200 with empty content', async () => {
  const resp = await adminCtx.get('/api/aktivitaeten', {
    params: { search: 'xyzzy' },
  });

  await test.step('status 200 (not 404)', () => {
    expect(resp.status()).toBe(200);
  });

  const body = await resp.json() as PageResponse;

  await test.step('content is an empty array', () => {
    expect(Array.isArray(body.content)).toBe(true);
    expect(body.content.length).toBe(0);
  });

  await test.step('totalElements is 0', () => {
    expect(body.totalElements).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// T-4  search=ANGEBOT (uppercase) — case-insensitive, 14 results
// ---------------------------------------------------------------------------

test('T-4: GET /api/aktivitaeten?search=ANGEBOT returns 14 activities (case-insensitive)', async () => {
  const resp = await adminCtx.get('/api/aktivitaeten', {
    params: { search: 'ANGEBOT', size: '50' },
  });

  await test.step('status 200', () => {
    expect(resp.status()).toBe(200);
  });

  const body = await resp.json() as PageResponse;

  await test.step('totalElements matches fixture angebot count', () => {
    expect(body.totalElements).toBe(ANGEBOT_COUNT);
  });

  await test.step('content length equals totalElements (all results fit in one page)', () => {
    expect(body.content.length).toBe(ANGEBOT_COUNT);
  });

  await test.step('every returned subject contains "angebot" (case-insensitive)', () => {
    for (const ak of body.content) {
      expect(ak.subject.toLowerCase()).toContain('angebot');
    }
  });
});

// ---------------------------------------------------------------------------
// T-5  No search param — baseline unaffected
// ---------------------------------------------------------------------------

test('T-5: GET /api/aktivitaeten without search param returns all activities (baseline)', async () => {
  const resp = await adminCtx.get('/api/aktivitaeten', {
    params: { size: '100' },
  });

  await test.step('status 200', () => {
    expect(resp.status()).toBe(200);
  });

  const body = await resp.json() as PageResponse;

  await test.step('totalElements equals the full fixture count of 75', () => {
    expect(body.totalElements).toBe(TOTAL_AKTIVITAETEN);
  });
});

// ---------------------------------------------------------------------------
// T-6  Unauthenticated request returns 401
// ---------------------------------------------------------------------------

test('T-6: GET /api/aktivitaeten?search=angebot without session returns 401', async () => {
  const resp = await anonCtx.get('/api/aktivitaeten', {
    params: { search: 'angebot' },
  });

  await test.step('status 401', () => {
    expect(resp.status()).toBe(401);
  });
});

// ---------------------------------------------------------------------------
// T-7  Combined search=angebot&typ=ANRUF — fewer results, all subjects contain "angebot"
// ---------------------------------------------------------------------------

test('T-7: GET /api/aktivitaeten?search=angebot&typ=ANRUF returns exactly 4 results, all subjects contain "angebot"', async () => {
  const resp = await adminCtx.get('/api/aktivitaeten', {
    params: { search: 'angebot', typ: 'ANRUF', size: '50' },
  });

  await test.step('status 200', () => {
    expect(resp.status()).toBe(200);
  });

  const body = await resp.json() as PageResponse;

  await test.step('totalElements equals the exact combined count (angebot + ANRUF)', () => {
    expect(body.totalElements).toBe(ANGEBOT_ANRUF_COUNT);
  });

  await test.step('every returned subject contains "angebot" (case-insensitive)', () => {
    for (const ak of body.content) {
      expect(ak.subject.toLowerCase()).toContain('angebot');
    }
  });

  await test.step('every returned aktivitaet has typ === ANRUF', () => {
    for (const ak of body.content) {
      expect(ak.typ).toBe('ANRUF');
    }
  });
});

// ---------------------------------------------------------------------------
// T-8  search= (empty string) — treated as no filter, returns all 75
// ---------------------------------------------------------------------------

test('T-8: GET /api/aktivitaeten?search= (empty string) returns all activities (no filter)', async () => {
  const resp = await adminCtx.get('/api/aktivitaeten', {
    params: { search: '', size: '100' },
  });

  await test.step('status 200', () => {
    expect(resp.status()).toBe(200);
  });

  const body = await resp.json() as PageResponse;

  await test.step('totalElements equals the full fixture count of 75', () => {
    expect(body.totalElements).toBe(TOTAL_AKTIVITAETEN);
  });
});
