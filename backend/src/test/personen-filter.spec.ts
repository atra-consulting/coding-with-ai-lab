/**
 * Tests for the abteilungId filter on GET /api/personen.
 *
 * Covers:
 *   F-1  GET /api/personen?abteilungId=<valid>   — returns only persons from that department
 *   F-2  GET /api/personen                        — no filter; baseline behaviour unaffected
 *   F-3  GET /api/personen?abteilungId=99999      — 200 with empty content (not 404)
 *   F-4  GET /api/personen?abteilungId=0          — treated as no filter (same as baseline)
 *   F-5  GET /api/personen?abteilungId=<valid>&search=<name> — both filters combine via AND
 *   F-6  GET /api/personen (anon)                 — 401
 *
 * Fixture facts used (from backend/src/seed/fixture.json):
 *   - abteilungId=8 has 4 persons (the most of any department)
 *   - abteilungId=1 has 2 persons: "Philipp Schmidt" and "Christian Dietrich"
 *   - Total persons in fixture: 100
 */
import { test, expect, request as playwrightRequest } from '@playwright/test';
import type { APIRequestContext } from '@playwright/test';
import { resetDatabase, loginCtx } from './helpers.js';

const BASE_URL = 'http://localhost:7070';

// ---------------------------------------------------------------------------
// Fixture constants (derived from backend/src/seed/fixture.json)
// ---------------------------------------------------------------------------

/** Department with 4 persons — good for filtering coverage. */
const ABTEILUNG_ID_WITH_MANY = 8;

/**
 * Department used for the combined search test.
 * abteilungId=1 has exactly 2 persons: "Philipp Schmidt" and "Christian Dietrich".
 * Searching for "Schmidt" within that department should return exactly 1 result.
 */
const ABTEILUNG_ID_FOR_COMBINED = 1;
const SEARCH_WITHIN_COMBINED = 'Schmidt';

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

interface PersonDTO {
  id: number;
  firstName: string;
  lastName: string;
  abteilungId: number | null;
  [key: string]: unknown;
}

interface PageResponse {
  content: PersonDTO[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
  first: boolean;
  last: boolean;
}

// ---------------------------------------------------------------------------
// F-1  Filter by valid abteilungId
// ---------------------------------------------------------------------------

test('F-1: GET /api/personen?abteilungId=<valid> returns only persons from that department', async () => {
  const resp = await adminCtx.get('/api/personen', {
    params: { abteilungId: String(ABTEILUNG_ID_WITH_MANY), size: '50' },
  });

  await test.step('status 200', () => {
    expect(resp.status()).toBe(200);
  });

  const body = await resp.json() as PageResponse;

  await test.step('content is an array', () => {
    expect(Array.isArray(body.content)).toBe(true);
  });

  await test.step('content is non-empty for a department that has persons', () => {
    expect(body.content.length).toBeGreaterThan(0);
  });

  await test.step('every returned person has the requested abteilungId', () => {
    for (const person of body.content) {
      expect(person.abteilungId).toBe(ABTEILUNG_ID_WITH_MANY);
    }
  });

  await test.step('totalElements matches the number of persons in the department', () => {
    // abteilungId=8 has exactly 4 persons in the fixture
    expect(body.totalElements).toBe(4);
  });
});

// ---------------------------------------------------------------------------
// F-2  No abteilungId param — baseline unaffected
// ---------------------------------------------------------------------------

test('F-2: GET /api/personen without abteilungId returns all persons (baseline)', async () => {
  const resp = await adminCtx.get('/api/personen', {
    params: { size: '100' },
  });

  await test.step('status 200', () => {
    expect(resp.status()).toBe(200);
  });

  const body = await resp.json() as PageResponse;

  await test.step('totalElements equals the full fixture count of 100', () => {
    expect(body.totalElements).toBe(100);
  });

  await test.step('content includes persons from multiple departments', () => {
    const departmentIds = new Set(body.content.map((p) => p.abteilungId));
    expect(departmentIds.size).toBeGreaterThan(1);
  });
});

// ---------------------------------------------------------------------------
// F-3  Non-existent abteilungId — 200 with empty content
// ---------------------------------------------------------------------------

test('F-3: GET /api/personen?abteilungId=99999 returns 200 with empty content array', async () => {
  const resp = await adminCtx.get('/api/personen', {
    params: { abteilungId: '99999' },
  });

  await test.step('status is 200 (not 404)', () => {
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
// F-4  abteilungId=0 — treated as no filter
// ---------------------------------------------------------------------------

test('F-4: GET /api/personen?abteilungId=0 ignores the param and returns all persons', async () => {
  const respFiltered = await adminCtx.get('/api/personen', {
    params: { abteilungId: '0', size: '100' },
  });
  const respBaseline = await adminCtx.get('/api/personen', {
    params: { size: '100' },
  });

  await test.step('both responses return status 200', () => {
    expect(respFiltered.status()).toBe(200);
    expect(respBaseline.status()).toBe(200);
  });

  const bodyFiltered = await respFiltered.json() as PageResponse;
  const bodyBaseline = await respBaseline.json() as PageResponse;

  await test.step('totalElements with abteilungId=0 matches baseline', () => {
    expect(bodyFiltered.totalElements).toBe(bodyBaseline.totalElements);
  });
});

// ---------------------------------------------------------------------------
// F-5  Combined filter: abteilungId + search
// ---------------------------------------------------------------------------

test('F-5: GET /api/personen?abteilungId=<valid>&search=<name> applies both filters via AND', async () => {
  const resp = await adminCtx.get('/api/personen', {
    params: {
      abteilungId: String(ABTEILUNG_ID_FOR_COMBINED),
      search: SEARCH_WITHIN_COMBINED,
      size: '50',
    },
  });

  await test.step('status 200', () => {
    expect(resp.status()).toBe(200);
  });

  const body = await resp.json() as PageResponse;

  await test.step('content is non-empty', () => {
    expect(body.content.length).toBeGreaterThan(0);
  });

  await test.step('every result matches the department filter', () => {
    for (const person of body.content) {
      expect(person.abteilungId).toBe(ABTEILUNG_ID_FOR_COMBINED);
    }
  });

  await test.step('every result matches the search filter (name contains "Schmidt")', () => {
    for (const person of body.content) {
      const fullName = `${person.firstName} ${person.lastName}`.toLowerCase();
      expect(fullName).toContain(SEARCH_WITHIN_COMBINED.toLowerCase());
    }
  });

  await test.step('fewer results than abteilungId-only filter (search narrows the set)', async () => {
    const respAbtOnly = await adminCtx.get('/api/personen', {
      params: { abteilungId: String(ABTEILUNG_ID_FOR_COMBINED), size: '50' },
    });
    const bodyAbtOnly = await respAbtOnly.json() as PageResponse;
    expect(body.totalElements).toBeLessThan(bodyAbtOnly.totalElements);
  });
});

// ---------------------------------------------------------------------------
// F-6  Unauthenticated request
// ---------------------------------------------------------------------------

test('F-6: GET /api/personen without session returns 401', async () => {
  const resp = await anonCtx.get('/api/personen', {
    params: { abteilungId: String(ABTEILUNG_ID_WITH_MANY) },
  });
  expect(resp.status()).toBe(401);
});
