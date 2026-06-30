/**
 * Tests for the optional `search` query param on GET /api/adressen.
 *
 * The filter is: WHERE LOWER(a.city) LIKE LOWER('%' || ? || '%')
 *
 * Covers:
 *   CS-1  GET /api/adressen?search=<city>        — exact city match, only matching rows returned
 *   CS-2  GET /api/adressen?search=<fragment>    — substring match (LIKE %term%)
 *   CS-3  GET /api/adressen?search=<lowercase>   — case-insensitive match against capitalized city
 *   CS-4  GET /api/adressen (no search)          — all addresses returned (>= created count)
 *   CS-5  GET /api/adressen?search=<nomatch>     — empty content, totalElements: 0
 *   CS-6  GET /api/adressen (anon)               — 401 Unauthorized
 *   CS-7  GET /api/adressen?search=              — empty string behaves like no filter (>= 2 results)
 *
 * Cities used to avoid fixture collisions:
 *   "Zzxville" — full exact-match city (CS-1, CS-2, CS-3)
 *   "Qqytown"  — second distinct city (CS-1, CS-4)
 *
 * Routes: GET /api/adressen
 */
import { test, expect, request as playwrightRequest, type APIRequestContext } from '@playwright/test';
import { resetDatabase, loginCtx } from './helpers.js';

const BASE_URL = 'http://localhost:7070';

// ---------------------------------------------------------------------------
// Minimal valid address payload
// ---------------------------------------------------------------------------

const BASE_PAYLOAD = {
  street: 'Hauptstraße',
  houseNumber: '1',
  postalCode: '10117',
  country: 'Deutschland',
};

// ---------------------------------------------------------------------------
// Typed response shapes
// ---------------------------------------------------------------------------

interface AdresseDTO {
  id: number;
  city: string;
  [key: string]: unknown;
}

interface PageResponse {
  content: AdresseDTO[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
  first: boolean;
  last: boolean;
}

// ---------------------------------------------------------------------------
// Contexts
// ---------------------------------------------------------------------------

let adminCtx: APIRequestContext;
let anonCtx: APIRequestContext;

// IDs of addresses created in beforeAll so we can assert without touching
// seed data, and so we never rely on absolute fixture totals.
let zzxvilleId: number;
let qqytownId: number;

test.beforeAll(async () => {
  await resetDatabase();
  adminCtx = await loginCtx('admin', 'admin123');
  anonCtx = await playwrightRequest.newContext({ baseURL: BASE_URL });

  // Create two addresses with unusual, unique city names that will not appear
  // in the seed fixture.
  const resp1 = await adminCtx.post('/api/adressen', {
    data: { ...BASE_PAYLOAD, city: 'Zzxville' },
  });
  expect(resp1.status()).toBe(201);
  const body1 = await resp1.json() as AdresseDTO;
  zzxvilleId = body1.id;

  const resp2 = await adminCtx.post('/api/adressen', {
    data: { ...BASE_PAYLOAD, city: 'Qqytown' },
  });
  expect(resp2.status()).toBe(201);
  const body2 = await resp2.json() as AdresseDTO;
  qqytownId = body2.id;
});

test.afterAll(async () => {
  // Clean up rows we created; errors are not swallowed — a failed DELETE
  // surfaces clearly. Guard against NaN in case beforeAll setup failed.
  if (Number.isFinite(zzxvilleId)) {
    const r1 = await adminCtx.delete(`/api/adressen/${zzxvilleId}`);
    if (!r1.ok()) {
      throw new Error(`afterAll: DELETE /api/adressen/${zzxvilleId} failed with status ${r1.status()}`);
    }
  }
  if (Number.isFinite(qqytownId)) {
    const r2 = await adminCtx.delete(`/api/adressen/${qqytownId}`);
    if (!r2.ok()) {
      throw new Error(`afterAll: DELETE /api/adressen/${qqytownId} failed with status ${r2.status()}`);
    }
  }
  await adminCtx.dispose();
  await anonCtx.dispose();
});

// ---------------------------------------------------------------------------
// CS-1  Exact city search — only the matching city is returned
// ---------------------------------------------------------------------------

test('CS-1: GET /api/adressen?search=Zzxville returns only the Zzxville address', async () => {
  const resp = await adminCtx.get('/api/adressen', {
    params: { search: 'Zzxville', size: '200' },
  });

  await test.step('status 200', () => {
    expect(resp.status()).toBe(200);
  });

  const body = await resp.json() as PageResponse;

  await test.step('totalElements is 1', () => {
    expect(body.totalElements).toBe(1);
  });

  await test.step('content has exactly one item', () => {
    expect(body.content).toHaveLength(1);
  });

  await test.step('the returned address has city Zzxville', () => {
    expect(body.content[0]!.city).toBe('Zzxville');
  });
});

// ---------------------------------------------------------------------------
// CS-2  Substring match — partial fragment matches via LIKE %term%
// ---------------------------------------------------------------------------

test('CS-2: GET /api/adressen?search=zxvill matches Zzxville via substring', async () => {
  const resp = await adminCtx.get('/api/adressen', {
    params: { search: 'zxvill', size: '200' },
  });

  await test.step('status 200', () => {
    expect(resp.status()).toBe(200);
  });

  const body = await resp.json() as PageResponse;

  await test.step('exactly one result returned (zxvill is unique to Zzxville)', () => {
    expect(body.totalElements).toBe(1);
  });

  await test.step('every returned address city contains the fragment (case-insensitive)', () => {
    for (const adresse of body.content) {
      expect(adresse.city.toLowerCase()).toContain('zxvill');
    }
  });

  await test.step('Zzxville address is among results', () => {
    const ids = body.content.map((a) => a.id);
    expect(ids).toContain(zzxvilleId);
  });
});

// ---------------------------------------------------------------------------
// CS-3  Case-insensitive — lowercase search term matches capitalized city
// ---------------------------------------------------------------------------

test('CS-3: GET /api/adressen?search=zzxville (lowercase) matches Zzxville (capitalized)', async () => {
  const resp = await adminCtx.get('/api/adressen', {
    params: { search: 'zzxville', size: '200' },
  });

  await test.step('status 200', () => {
    expect(resp.status()).toBe(200);
  });

  const body = await resp.json() as PageResponse;

  await test.step('totalElements is at least 1', () => {
    expect(body.totalElements).toBeGreaterThanOrEqual(1);
  });

  await test.step('every returned address city matches case-insensitively', () => {
    for (const adresse of body.content) {
      expect(adresse.city.toLowerCase()).toContain('zzxville');
    }
  });

  await test.step('Zzxville address id is present in results', () => {
    const ids = body.content.map((a) => a.id);
    expect(ids).toContain(zzxvilleId);
  });
});

// ---------------------------------------------------------------------------
// CS-4  No search param — returns all addresses including both we created
// ---------------------------------------------------------------------------

test('CS-4: GET /api/adressen without search param returns all addresses (>= 2 created)', async () => {
  const resp = await adminCtx.get('/api/adressen', {
    params: { size: '200' },
  });

  await test.step('status 200', () => {
    expect(resp.status()).toBe(200);
  });

  const body = await resp.json() as PageResponse;

  await test.step('totalElements is at least 2 (the addresses we created)', () => {
    expect(body.totalElements).toBeGreaterThanOrEqual(2);
  });

  await test.step('both created addresses appear in results', () => {
    const ids = body.content.map((a) => a.id);
    expect(ids).toContain(zzxvilleId);
    expect(ids).toContain(qqytownId);
  });
});

// ---------------------------------------------------------------------------
// CS-5  No match — garbage search term returns empty content
// ---------------------------------------------------------------------------

test('CS-5: GET /api/adressen?search=XYZNOMATCHGARBAGETERM returns empty content', async () => {
  const resp = await adminCtx.get('/api/adressen', {
    params: { search: 'XYZNOMATCHGARBAGETERM' },
  });

  await test.step('status 200', () => {
    expect(resp.status()).toBe(200);
  });

  const body = await resp.json() as PageResponse;

  await test.step('totalElements is 0', () => {
    expect(body.totalElements).toBe(0);
  });

  await test.step('content array is empty', () => {
    expect(body.content).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// CS-6  Unauthenticated request returns 401
// ---------------------------------------------------------------------------

test('CS-6: GET /api/adressen without session returns 401', async () => {
  const resp = await anonCtx.get('/api/adressen', {
    params: { search: 'Zzxville' },
  });
  expect(resp.status()).toBe(401);
});

// ---------------------------------------------------------------------------
// CS-7  Empty-string search — treated as no filter, returns all addresses
// ---------------------------------------------------------------------------

test('CS-7: GET /api/adressen?search= (empty string) returns all addresses (>= 2)', async () => {
  const resp = await adminCtx.get('/api/adressen', {
    params: { search: '', size: '200' },
  });

  await test.step('status 200', () => {
    expect(resp.status()).toBe(200);
  });

  const body = await resp.json() as PageResponse;

  await test.step('totalElements is at least 2 (empty string treated as no filter)', () => {
    expect(body.totalElements).toBeGreaterThanOrEqual(2);
  });
});
