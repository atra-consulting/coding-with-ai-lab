/**
 * Tests for the `typ` field on the /api/adressen routes.
 *
 * Covers:
 *   POST /api/adressen with typ: "WORK"  — response contains typ: "WORK"
 *   POST /api/adressen without typ       — response contains typ: null
 *   GET  /api/adressen/:id               — response body has a typ key
 *   GET  /api/adressen                   — every item in content has a typ key
 *   PUT  /api/adressen/:id with typ: "HOME" — field updated in response and persisted
 *   PUT  /api/adressen/:id with typ: null   — null stored and returned
 *
 * Routes: GET /api/adressen, GET /api/adressen/:id,
 *         POST /api/adressen, PUT /api/adressen/:id
 */
import { test, expect, request as playwrightRequest, type APIRequestContext } from '@playwright/test';
import { client } from '../config/db.js';
import { resetDatabase, loginCtx } from './helpers.js';

const BASE_URL = 'http://localhost:7070';

// ---------------------------------------------------------------------------
// Minimal valid address payload reused across tests
// ---------------------------------------------------------------------------
const BASE_PAYLOAD = {
  street: 'Hauptstraße',
  houseNumber: '1',
  postalCode: '10117',
  city: 'Berlin',
  country: 'Deutschland',
};

// ---------------------------------------------------------------------------
// Setup
// ---------------------------------------------------------------------------

let adminCtx: APIRequestContext;
let anonCtx: APIRequestContext;

test.beforeAll(async () => {
  await resetDatabase();
  adminCtx = await loginCtx('admin', 'admin123');
  anonCtx = await playwrightRequest.newContext({ baseURL: BASE_URL });
});

test.afterAll(async () => {
  await resetDatabase();
  await adminCtx.dispose();
  await anonCtx.dispose();
});

// ---------------------------------------------------------------------------
// POST /api/adressen — typ round-trip
// ---------------------------------------------------------------------------
test.describe('POST /api/adressen — typ field', () => {
  const createdIds: number[] = [];

  test.afterAll(async () => {
    for (const id of createdIds) {
      await client.execute({ sql: 'DELETE FROM adresse WHERE id = ?', args: [id] });
    }
    createdIds.length = 0;
  });

  test('creates address with typ: "WORK" and returns typ: "WORK"', async () => {
    const resp = await adminCtx.post('/api/adressen', {
      data: { ...BASE_PAYLOAD, typ: 'WORK' },
    });

    await test.step('status 201', () => {
      expect(resp.status()).toBe(201);
    });

    const body = await resp.json() as Record<string, unknown>;
    createdIds.push(body['id'] as number);

    await test.step('typ is "WORK"', () => {
      expect(body['typ']).toBe('WORK');
    });
  });

  test('creates address without typ and returns typ: null', async () => {
    const resp = await adminCtx.post('/api/adressen', {
      data: { ...BASE_PAYLOAD },
    });

    await test.step('status 201', () => {
      expect(resp.status()).toBe(201);
    });

    const body = await resp.json() as Record<string, unknown>;
    createdIds.push(body['id'] as number);

    await test.step('typ key is present', () => {
      expect('typ' in body).toBe(true);
    });

    await test.step('typ is null', () => {
      expect(body['typ']).toBeNull();
    });
  });
});

// ---------------------------------------------------------------------------
// GET /api/adressen/:id — typ key present
// ---------------------------------------------------------------------------
test.describe('GET /api/adressen/:id — typ field', () => {
  let testId: number;

  test.beforeAll(async () => {
    const now = new Date().toISOString();
    const result = await client.execute({
      sql: `INSERT INTO adresse (street, houseNumber, postalCode, city, country, typ, createdAt, updatedAt)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      args: ['Testgasse', '5', '80331', 'München', 'Deutschland', 'HOME', now, now],
    });
    testId = Number(result.lastInsertRowid);
  });

  test.afterAll(async () => {
    await client.execute({ sql: 'DELETE FROM adresse WHERE id = ?', args: [testId] });
  });

  test('response body contains a typ key', async () => {
    const resp = await adminCtx.get(`/api/adressen/${testId}`);

    await test.step('status 200', () => {
      expect(resp.status()).toBe(200);
    });

    const body = await resp.json() as Record<string, unknown>;

    await test.step('typ key is present', () => {
      expect('typ' in body).toBe(true);
    });

    await test.step('typ value matches seeded value', () => {
      expect(body['typ']).toBe('HOME');
    });
  });
});

// ---------------------------------------------------------------------------
// GET /api/adressen — every list item has a typ key
// ---------------------------------------------------------------------------
test.describe('GET /api/adressen — typ key in list', () => {
  test('every item in content has a typ key', async () => {
    const resp = await adminCtx.get('/api/adressen');

    await test.step('status 200', () => {
      expect(resp.status()).toBe(200);
    });

    const body = await resp.json() as {
      content: Record<string, unknown>[];
      totalElements: number;
    };

    await test.step('content array is non-empty', () => {
      expect(Array.isArray(body.content)).toBe(true);
      expect(body.content.length).toBeGreaterThan(0);
    });

    await test.step('every item has a typ key (string or null)', () => {
      for (const item of body.content) {
        expect('typ' in item).toBe(true);
        const typ = item['typ'];
        expect(typ === null || typeof typ === 'string').toBe(true);
      }
    });
  });
});

// ---------------------------------------------------------------------------
// PUT /api/adressen/:id — typ update semantics
// ---------------------------------------------------------------------------
test.describe('PUT /api/adressen/:id — typ field', () => {
  let testId: number;

  async function createTestRow(typ: string | null): Promise<number> {
    const now = new Date().toISOString();
    const result = await client.execute({
      sql: `INSERT INTO adresse (street, houseNumber, postalCode, city, country, typ, createdAt, updatedAt)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      args: ['Musterweg', '10', '10115', 'Berlin', 'Deutschland', typ, now, now],
    });
    const rowid = result.lastInsertRowid;
    if (rowid === undefined) throw new Error('createTestRow: lastInsertRowid is undefined');
    return Number(rowid);
  }

  test.beforeEach(async () => {
    testId = await createTestRow('WORK');
  });

  test.afterEach(async () => {
    await client.execute({ sql: 'DELETE FROM adresse WHERE id = ?', args: [testId] });
  });

  test('PUT with typ: "HOME" updates field in response', async () => {
    const putResp = await adminCtx.put(`/api/adressen/${testId}`, {
      data: { ...BASE_PAYLOAD, typ: 'HOME' },
    });

    await test.step('PUT returns 200', () => {
      expect(putResp.status()).toBe(200);
    });

    const body = await putResp.json() as Record<string, unknown>;

    await test.step('returned body has typ: "HOME"', () => {
      expect(body['typ']).toBe('HOME');
    });

    const getResp = await adminCtx.get(`/api/adressen/${testId}`);
    const getBody = await getResp.json() as Record<string, unknown>;

    await test.step('GET confirms typ: "HOME" was persisted', () => {
      expect(getBody['typ']).toBe('HOME');
    });
  });

  test('PUT with typ: null stores null and returns null', async () => {
    const putResp = await adminCtx.put(`/api/adressen/${testId}`, {
      data: { ...BASE_PAYLOAD, typ: null },
    });

    await test.step('PUT returns 200', () => {
      expect(putResp.status()).toBe(200);
    });

    const body = await putResp.json() as Record<string, unknown>;

    await test.step('returned body has typ: null', () => {
      expect(body['typ']).toBeNull();
    });

    const getResp = await adminCtx.get(`/api/adressen/${testId}`);
    const getBody = await getResp.json() as Record<string, unknown>;

    await test.step('GET confirms null typ in DB', () => {
      expect(getBody['typ']).toBeNull();
    });
  });
});
