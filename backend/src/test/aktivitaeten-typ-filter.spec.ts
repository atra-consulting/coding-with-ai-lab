/**
 * Tests for the typ filter on GET /api/aktivitaeten.
 *
 * Covers:
 *   T-1  GET /api/aktivitaeten?typ=ANRUF              — only ANRUF items, totalElements === 17
 *   T-2  GET /api/aktivitaeten?typ=MEETING             — only MEETING items, totalElements === 9
 *   T-3  GET /api/aktivitaeten?typ=ANRUF&firmaId=99999 — both filters active, empty result
 *   T-4  GET /api/aktivitaeten?typ=INVALID             — 400 ValidationError
 *   T-5  GET /api/aktivitaeten (no typ)                — baseline unaffected, totalElements === 75
 *   T-6  GET /api/aktivitaeten?typ=ANRUF without session — 401
 *
 * Fixture facts used (from backend/src/seed/fixture.json):
 *   - typ=ANRUF  has 17 activities
 *   - typ=MEETING has 9 activities
 *   - Total aktivitaeten in fixture: 75
 *
 * NOTE on T-4: Unlike firmaId=abc (non-numeric → NaN → no-filter fallback), string enum
 * values are explicitly validated in aktivitaeten.ts and throw a ValidationError on unknown
 * values. This is intentionally strict for enum params. If the API is ever relaxed to
 * silently ignore unknown typ values, update T-4 accordingly.
 *
 * NOTE on T-3: We cannot get 0 results with a valid typ alone (every typ has fixture rows).
 * Combining a valid typ with firmaId=99999 (non-existent) achieves 0 results.
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

/** Number of activities with typ === 'ANRUF' in the fixture. */
const ANRUF_COUNT = 17;

/** Number of activities with typ === 'MEETING' in the fixture. */
const MEETING_COUNT = 9;

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
// T-1  Filter by typ=ANRUF
// ---------------------------------------------------------------------------

test('T-1: GET /api/aktivitaeten?typ=ANRUF returns only ANRUF activities', async () => {
  const resp = await adminCtx.get('/api/aktivitaeten', {
    params: { typ: 'ANRUF', size: '50' },
  });

  await test.step('status 200', () => {
    expect(resp.status()).toBe(200);
  });

  const body = await resp.json() as PageResponse;

  await test.step('content is an array', () => {
    expect(Array.isArray(body.content)).toBe(true);
  });

  await test.step('every returned aktivitaet has typ === ANRUF', () => {
    for (const ak of body.content) {
      expect(ak.typ).toBe('ANRUF');
    }
  });

  await test.step('totalElements matches fixture ANRUF count', () => {
    expect(body.totalElements).toBe(ANRUF_COUNT);
  });

  await test.step('totalElements is less than the full fixture count (filter is active)', () => {
    expect(body.totalElements).toBeLessThan(TOTAL_AKTIVITAETEN);
  });
});

// ---------------------------------------------------------------------------
// T-2  Filter by typ=MEETING
// ---------------------------------------------------------------------------

test('T-2: GET /api/aktivitaeten?typ=MEETING returns only MEETING activities', async () => {
  const resp = await adminCtx.get('/api/aktivitaeten', {
    params: { typ: 'MEETING', size: '50' },
  });

  await test.step('status 200', () => {
    expect(resp.status()).toBe(200);
  });

  const body = await resp.json() as PageResponse;

  await test.step('content is an array', () => {
    expect(Array.isArray(body.content)).toBe(true);
  });

  await test.step('every returned aktivitaet has typ === MEETING', () => {
    for (const ak of body.content) {
      expect(ak.typ).toBe('MEETING');
    }
  });

  await test.step('totalElements matches fixture MEETING count', () => {
    expect(body.totalElements).toBe(MEETING_COUNT);
  });

  await test.step('totalElements is less than the full fixture count (filter is active)', () => {
    expect(body.totalElements).toBeLessThan(TOTAL_AKTIVITAETEN);
  });
});

// ---------------------------------------------------------------------------
// T-3  Combined typ + non-existent firmaId — 200 with empty content
// ---------------------------------------------------------------------------

// Every valid typ has rows in the fixture, so firmaId=99999 is used to force 0 results.
test('T-3: GET /api/aktivitaeten?typ=ANRUF&firmaId=99999 returns 200 with empty content', async () => {
  const resp = await adminCtx.get('/api/aktivitaeten', {
    params: { typ: 'ANRUF', firmaId: '99999' },
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
// T-4  typ=INVALID — 400 ValidationError
// ---------------------------------------------------------------------------

// String enum params are explicitly validated in aktivitaeten.ts (lines 36-38).
// Unknown values throw a ValidationError (400) rather than falling back to no-filter.
// This is intentionally strict — see NOTE at top of file.
test('T-4: GET /api/aktivitaeten?typ=INVALID returns 400 with fieldErrors', async () => {
  const resp = await adminCtx.get('/api/aktivitaeten', {
    params: { typ: 'INVALID' },
  });

  await test.step('status 400', () => {
    expect(resp.status()).toBe(400);
  });

  const body = await resp.json() as { status: number; message: string; fieldErrors?: Record<string, string> };

  await test.step('body has fieldErrors with a typ key', () => {
    expect(body.fieldErrors).toBeDefined();
    expect(body.fieldErrors!['typ']).toBeDefined();
  });
});

// ---------------------------------------------------------------------------
// T-5  No typ param — baseline unaffected
// ---------------------------------------------------------------------------

test('T-5: GET /api/aktivitaeten without typ returns all activities (baseline)', async () => {
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

  await test.step('content includes activities from multiple typ values', () => {
    const typen = new Set(body.content.map((ak) => ak.typ));
    expect(typen.size).toBeGreaterThan(1);
  });
});

// ---------------------------------------------------------------------------
// T-6  Unauthenticated request returns 401
// ---------------------------------------------------------------------------

test('T-6: GET /api/aktivitaeten?typ=ANRUF without session returns 401', async () => {
  const resp = await anonCtx.get('/api/aktivitaeten', {
    params: { typ: 'ANRUF' },
  });

  await test.step('status 401', () => {
    expect(resp.status()).toBe(401);
  });
});
