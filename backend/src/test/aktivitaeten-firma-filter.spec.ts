/**
 * Tests for the firmaId filter on GET /api/aktivitaeten.
 *
 * Covers:
 *   F-1  GET /api/aktivitaeten?firmaId=<valid>  — returns only activities for that firma
 *   F-2  GET /api/aktivitaeten?firmaId=99999    — 200 with empty content (no activities for unknown firma)
 *   F-3  GET /api/aktivitaeten                  — no filter; baseline behaviour unaffected
 *   F-4  GET /api/aktivitaeten?firmaId=abc      — invalid (non-numeric) ignored; returns all
 *   F-5  GET /api/aktivitaeten without session          — returns 401
 *
 * Fixture facts used (from backend/src/seed/fixture.json):
 *   - firmaId=1 has 3 activities (ids 26, 41, 74)
 *   - firmaId=4 has 8 activities (the most of any firma)
 *   - Total aktivitaeten in fixture: 75
 */
import { test, expect, request as playwrightRequest } from '@playwright/test';
import type { APIRequestContext } from '@playwright/test';
import { resetDatabase, loginCtx } from './helpers.js';

const BASE_URL = 'http://localhost:7070';

// ---------------------------------------------------------------------------
// Fixture constants (derived from backend/src/seed/fixture.json)
// ---------------------------------------------------------------------------

/** Firma with 3 activities — used for the primary filter test. */
const FIRMA_ID_WITH_ACTIVITIES = 1;
const FIRMA_ID_ACTIVITY_COUNT = 3;

/** Total aktivitaeten rows in the fixture. */
const TOTAL_AKTIVITAETEN = 75;

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
// F-1  Filter by valid firmaId
// ---------------------------------------------------------------------------

test('F-1: GET /api/aktivitaeten?firmaId=<valid> returns only activities for that firma', async () => {
  const resp = await adminCtx.get('/api/aktivitaeten', {
    params: { firmaId: String(FIRMA_ID_WITH_ACTIVITIES), size: '50' },
  });

  await test.step('status 200', () => {
    expect(resp.status()).toBe(200);
  });

  const body = await resp.json() as PageResponse;

  await test.step('content is an array', () => {
    expect(Array.isArray(body.content)).toBe(true);
  });

  await test.step('content is non-empty for a firma that has activities', () => {
    expect(body.content.length).toBeGreaterThan(0);
  });

  await test.step('every returned aktivitaet has the requested firmaId', () => {
    for (const ak of body.content) {
      expect(ak.firmaId).toBe(FIRMA_ID_WITH_ACTIVITIES);
    }
  });

  await test.step('totalElements matches the fixture count for that firma', () => {
    expect(body.totalElements).toBe(FIRMA_ID_ACTIVITY_COUNT);
  });

  await test.step('totalElements is less than the total fixture count (filter is active)', () => {
    expect(body.totalElements).toBeLessThan(TOTAL_AKTIVITAETEN);
  });
});

// ---------------------------------------------------------------------------
// F-2  Non-existent firmaId — 200 with empty content
// ---------------------------------------------------------------------------

test('F-2: GET /api/aktivitaeten?firmaId=99999 returns 200 with empty content array', async () => {
  const resp = await adminCtx.get('/api/aktivitaeten', {
    params: { firmaId: '99999' },
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
// F-3  No firmaId param — baseline unaffected
// ---------------------------------------------------------------------------

test('F-3: GET /api/aktivitaeten without firmaId returns all activities (baseline)', async () => {
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

  await test.step('content includes activities from multiple firmen', () => {
    const firmaIds = new Set(body.content.map((ak) => ak.firmaId));
    expect(firmaIds.size).toBeGreaterThan(1);
  });
});

// ---------------------------------------------------------------------------
// F-4  firmaId=abc — invalid (non-numeric) treated as no filter
// ---------------------------------------------------------------------------

// The route uses parseInt('abc') → NaN → falls back to undefined (no filter).
// This is intentional lenient parsing (see aktivitaeten.ts:32).
// If the API is ever changed to return 400 for non-numeric firmaId, update this test.
test('F-4: GET /api/aktivitaeten?firmaId=abc ignores the invalid param and returns all activities', async () => {
  const respInvalid = await adminCtx.get('/api/aktivitaeten', {
    params: { firmaId: 'abc', size: '100' },
  });
  const respBaseline = await adminCtx.get('/api/aktivitaeten', {
    params: { size: '100' },
  });

  await test.step('both responses return status 200', () => {
    expect(respInvalid.status()).toBe(200);
    expect(respBaseline.status()).toBe(200);
  });

  const bodyInvalid = await respInvalid.json() as PageResponse;
  const bodyBaseline = await respBaseline.json() as PageResponse;

  await test.step('totalElements with firmaId=abc matches baseline', () => {
    expect(bodyInvalid.totalElements).toBe(bodyBaseline.totalElements);
    expect(bodyInvalid.totalElements).toBe(TOTAL_AKTIVITAETEN);
  });
});

// ---------------------------------------------------------------------------
// F-5  Unauthenticated request returns 401
// ---------------------------------------------------------------------------

test('F-5: GET /api/aktivitaeten without session returns 401', async () => {
  const resp = await anonCtx.get('/api/aktivitaeten', {
    params: { firmaId: String(FIRMA_ID_WITH_ACTIVITIES) },
  });

  await test.step('status 401', () => {
    expect(resp.status()).toBe(401);
  });
});
