/**
 * Tests for the search query parameter on GET /api/chancen.
 *
 * Covers:
 *   S-1  GET /api/chancen?search=ERP          — 5 results, all titles contain "ERP"
 *   S-2  GET /api/chancen?search=crm          — 7 results, case-insensitive match
 *   S-3  GET /api/chancen?search=XYZNONEXISTENT — 0 results, empty content
 *   S-4  GET /api/chancen?search=CRM&phase=GEWONNEN — 3 results, combined filter
 *   S-5  GET /api/chancen                     — no search; baseline totalElements=40
 *   S-6  GET /api/chancen?search=ERP (anon)   — 401
 *
 * Fixture facts (from backend/src/seed/fixture.json):
 *   - Total chancen: 40
 *   - Titles containing "ERP": 5
 *   - Titles containing "CRM": 7
 *   - Titles containing "CRM" with phase=GEWONNEN: 3
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
// S-1  search=ERP — 5 results
// ---------------------------------------------------------------------------

test('S-1: GET /api/chancen?search=ERP returns 5 chancen with ERP in title', async () => {
  const resp = await adminCtx.get('/api/chancen', {
    params: { search: 'ERP', size: '50' },
  });

  await test.step('status 200', () => {
    expect(resp.status()).toBe(200);
  });

  const body = await resp.json() as PageResponse;

  await test.step('totalElements is 5', () => {
    expect(body.totalElements).toBe(5);
  });

  await test.step('every returned title contains ERP (case-insensitive)', () => {
    for (const chance of body.content) {
      expect(chance.titel.toLowerCase()).toContain('erp');
    }
  });
});

// ---------------------------------------------------------------------------
// S-2  search=crm (lowercase) — case-insensitive, 7 results
// ---------------------------------------------------------------------------

test('S-2: GET /api/chancen?search=crm returns 7 chancen (case-insensitive match)', async () => {
  const resp = await adminCtx.get('/api/chancen', {
    params: { search: 'crm', size: '50' },
  });

  await test.step('status 200', () => {
    expect(resp.status()).toBe(200);
  });

  const body = await resp.json() as PageResponse;

  await test.step('totalElements is 7', () => {
    expect(body.totalElements).toBe(7);
  });

  await test.step('every returned title contains CRM (case-insensitive)', () => {
    for (const chance of body.content) {
      expect(chance.titel.toLowerCase()).toContain('crm');
    }
  });
});

// ---------------------------------------------------------------------------
// S-3  search=XYZNONEXISTENT — 0 results
// ---------------------------------------------------------------------------

test('S-3: GET /api/chancen?search=XYZNONEXISTENT returns 0 results', async () => {
  const resp = await adminCtx.get('/api/chancen', {
    params: { search: 'XYZNONEXISTENT' },
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
// S-4  search=CRM combined with phase=GEWONNEN — 3 results
// ---------------------------------------------------------------------------

test('S-4: GET /api/chancen?search=CRM&phase=GEWONNEN returns 3 chancen', async () => {
  const resp = await adminCtx.get('/api/chancen', {
    params: { search: 'CRM', phase: 'GEWONNEN', size: '50' },
  });

  await test.step('status 200', () => {
    expect(resp.status()).toBe(200);
  });

  const body = await resp.json() as PageResponse;

  await test.step('totalElements is 3', () => {
    expect(body.totalElements).toBe(3);
  });

  await test.step('every returned title contains CRM (case-insensitive)', () => {
    for (const chance of body.content) {
      expect(chance.titel.toLowerCase()).toContain('crm');
    }
  });

  await test.step('every returned chance has phase GEWONNEN', () => {
    for (const chance of body.content) {
      expect(chance.phase).toBe('GEWONNEN');
    }
  });
});

// ---------------------------------------------------------------------------
// S-5  No search param — baseline unaffected
// ---------------------------------------------------------------------------

test('S-5: GET /api/chancen without search param returns all 40 chancen', async () => {
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
});

// ---------------------------------------------------------------------------
// S-6  Unauthenticated request
// ---------------------------------------------------------------------------

test('S-6: GET /api/chancen?search=ERP without session returns 401', async () => {
  const resp = await anonCtx.get('/api/chancen', {
    params: { search: 'ERP' },
  });
  expect(resp.status()).toBe(401);
});
