/**
 * Tests for latitude/longitude fields on the /api/adressen routes.
 *
 * Covers: Phase 1 (B2, B3, B4) — coordinate exposure, round-trip on create,
 * preservation on update, null overwrite on update.
 *
 * Routes: GET /api/adressen, GET /api/adressen/:id,
 *         POST /api/adressen, PUT /api/adressen/:id
 *
 * Authentication pattern: each spec creates one pre-authenticated
 * APIRequestContext per user in beforeAll.  This avoids merging/override
 * issues when explicit Cookie headers are combined with stored context cookies.
 */
import { test, expect, request as playwrightRequest, type APIRequestContext } from '@playwright/test';
import { sqlite } from '../config/db.js';
import { resetDatabase } from './helpers.js';

const BASE_URL = 'http://localhost:7070';

// ---------------------------------------------------------------------------
// Setup
// ---------------------------------------------------------------------------

let adminCtx: APIRequestContext;
let anonCtx: APIRequestContext;

async function loginCtx(benutzername: string, passwort: string): Promise<APIRequestContext> {
  const ctx = await playwrightRequest.newContext({ baseURL: BASE_URL });
  const resp = await ctx.post('/api/auth/login', { data: { benutzername, passwort } });
  if (!resp.ok()) {
    throw new Error(`Login failed for ${benutzername}: ${resp.status()}`);
  }
  return ctx;
}

test.beforeAll(async () => {
  resetDatabase();
  adminCtx = await loginCtx('admin', 'admin123');
  anonCtx = await playwrightRequest.newContext({ baseURL: BASE_URL });
});

test.afterAll(async () => {
  resetDatabase();
  await adminCtx.dispose();
  await anonCtx.dispose();
});

// ---------------------------------------------------------------------------
// GET /api/adressen/:id — seeded address has coordinates
// ---------------------------------------------------------------------------
test.describe('GET /api/adressen/:id', () => {
  test('returns latitude and longitude as numbers for a seeded address', async () => {
    // Fixture address id=1 has latitude=52.5171465, longitude=13.3961451
    const resp = await adminCtx.get('/api/adressen/1');

    await test.step('status 200', () => {
      expect(resp.status()).toBe(200);
    });

    const body = await resp.json() as Record<string, unknown>;

    await test.step('latitude is a number', () => {
      expect(typeof body['latitude']).toBe('number');
    });

    await test.step('longitude is a number', () => {
      expect(typeof body['longitude']).toBe('number');
    });

    await test.step('latitude value matches fixture', () => {
      expect(body['latitude'] as number).toBeCloseTo(52.5171465, 4);
    });

    await test.step('longitude value matches fixture', () => {
      expect(body['longitude'] as number).toBeCloseTo(13.3961451, 4);
    });
  });

  test('returns 401 when unauthenticated', async () => {
    const resp = await anonCtx.get('/api/adressen/1');
    expect(resp.status()).toBe(401);
  });

  test('returns 404 for unknown id', async () => {
    const resp = await adminCtx.get('/api/adressen/999999');
    expect(resp.status()).toBe(404);
  });
});

// ---------------------------------------------------------------------------
// GET /api/adressen — list items all have latitude and longitude keys
// ---------------------------------------------------------------------------
test.describe('GET /api/adressen', () => {
  test('every item in content has latitude and longitude keys', async () => {
    const resp = await adminCtx.get('/api/adressen');

    expect(resp.status()).toBe(200);

    const body = await resp.json() as {
      content: Record<string, unknown>[];
      totalElements: number;
    };

    await test.step('response has content array', () => {
      expect(Array.isArray(body.content)).toBe(true);
      expect(body.content.length).toBeGreaterThan(0);
    });

    await test.step('every item has numeric or null latitude', () => {
      for (const item of body.content) {
        expect('latitude' in item).toBe(true);
        const lat = item['latitude'];
        expect(lat === null || typeof lat === 'number').toBe(true);
      }
    });

    await test.step('every item has numeric or null longitude', () => {
      for (const item of body.content) {
        expect('longitude' in item).toBe(true);
        const lng = item['longitude'];
        expect(lng === null || typeof lng === 'number').toBe(true);
      }
    });
  });

  test('returns 401 when unauthenticated', async () => {
    const resp = await anonCtx.get('/api/adressen');
    expect(resp.status()).toBe(401);
  });
});

// ---------------------------------------------------------------------------
// POST /api/adressen — coordinates round-trip
// ---------------------------------------------------------------------------
test.describe('POST /api/adressen', () => {
  const createdIds: number[] = [];

  test.afterAll(() => {
    for (const id of createdIds) {
      sqlite.prepare('DELETE FROM adresse WHERE id = ?').run(id);
    }
    createdIds.length = 0;
  });

  test('persists and returns valid latitude/longitude', async () => {
    const resp = await adminCtx.post('/api/adressen', {
      data: {
        city: 'Berlin',
        postalCode: '10117',
        street: 'Unter den Linden',
        houseNumber: '1',
        country: 'Deutschland',
        latitude: 52.5171,
        longitude: 13.3961,
      },
    });

    await test.step('status 201', () => {
      expect(resp.status()).toBe(201);
    });

    const body = await resp.json() as Record<string, unknown>;
    createdIds.push(body['id'] as number);

    await test.step('latitude round-trips', () => {
      expect(body['latitude'] as number).toBeCloseTo(52.5171, 4);
    });

    await test.step('longitude round-trips', () => {
      expect(body['longitude'] as number).toBeCloseTo(13.3961, 4);
    });

    await test.step('id is a positive integer', () => {
      expect(typeof body['id']).toBe('number');
      expect(body['id'] as number).toBeGreaterThan(0);
    });
  });

  test('returns 400 with fieldErrors when latitude is out of range (9999)', async () => {
    const resp = await adminCtx.post('/api/adressen', {
      data: {
        city: 'Berlin',
        latitude: 9999,
        longitude: 13.3961,
      },
    });

    await test.step('status 400', () => {
      expect(resp.status()).toBe(400);
    });

    const body = await resp.json() as { fieldErrors: Record<string, string> };

    await test.step('fieldErrors mentions latitude', () => {
      expect(body.fieldErrors).toBeDefined();
      expect(Object.keys(body.fieldErrors)).toContain('latitude');
    });
  });

  test('returns 400 with fieldErrors when longitude is out of range (9999)', async () => {
    const resp = await adminCtx.post('/api/adressen', {
      data: {
        city: 'Berlin',
        latitude: 52.5,
        longitude: 9999,
      },
    });

    expect(resp.status()).toBe(400);
    const body = await resp.json() as { fieldErrors: Record<string, string> };
    expect(Object.keys(body.fieldErrors)).toContain('longitude');
  });

  test('returns 401 when unauthenticated', async () => {
    const resp = await anonCtx.post('/api/adressen', {
      data: { city: 'Berlin' },
    });
    expect(resp.status()).toBe(401);
  });
});

// ---------------------------------------------------------------------------
// PUT /api/adressen/:id — coordinate update semantics
// ---------------------------------------------------------------------------
test.describe('PUT /api/adressen/:id', () => {
  let testId: number;

  function createTestRow(): number {
    const now = new Date().toISOString();
    const result = sqlite
      .prepare(
        `INSERT INTO adresse (street, houseNumber, postalCode, city, country, latitude, longitude, createdAt, updatedAt)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
      )
      .run('Teststr.', '42', '10115', 'Berlin', 'Deutschland', 52.1234, 13.5678, now, now);
    return Number(result.lastInsertRowid);
  }

  test.beforeEach(() => {
    testId = createTestRow();
  });

  test.afterEach(() => {
    sqlite.prepare('DELETE FROM adresse WHERE id = ?').run(testId);
  });

  test('omitting latitude/longitude in PUT body preserves stored values', async () => {
    const before = await adminCtx.get(`/api/adressen/${testId}`);
    const beforeBody = await before.json() as Record<string, unknown>;

    await test.step('verify initial coords', () => {
      expect(beforeBody['latitude'] as number).toBeCloseTo(52.1234, 4);
      expect(beforeBody['longitude'] as number).toBeCloseTo(13.5678, 4);
    });

    const putResp = await adminCtx.put(`/api/adressen/${testId}`, {
      data: {
        city: 'Berlin',
        postalCode: '10115',
        street: 'Teststr.',
        houseNumber: '42',
        country: 'Deutschland',
        // latitude and longitude intentionally omitted
      },
    });

    await test.step('PUT returns 200', () => {
      expect(putResp.status()).toBe(200);
    });

    const after = await adminCtx.get(`/api/adressen/${testId}`);
    const afterBody = await after.json() as Record<string, unknown>;

    await test.step('latitude preserved after update', () => {
      expect(afterBody['latitude'] as number).toBeCloseTo(52.1234, 4);
    });

    await test.step('longitude preserved after update', () => {
      expect(afterBody['longitude'] as number).toBeCloseTo(13.5678, 4);
    });
  });

  test('PUT with latitude: null overwrites stored value to null', async () => {
    const putResp = await adminCtx.put(`/api/adressen/${testId}`, {
      data: {
        city: 'Berlin',
        postalCode: '10115',
        street: 'Teststr.',
        houseNumber: '42',
        country: 'Deutschland',
        latitude: null,
        longitude: null,
      },
    });

    await test.step('PUT status 200', () => {
      expect(putResp.status()).toBe(200);
    });

    const body = await putResp.json() as Record<string, unknown>;

    await test.step('returned body has null latitude', () => {
      expect(body['latitude']).toBeNull();
    });

    await test.step('returned body has null longitude', () => {
      expect(body['longitude']).toBeNull();
    });

    const getResp = await adminCtx.get(`/api/adressen/${testId}`);
    const getBody = await getResp.json() as Record<string, unknown>;

    await test.step('GET confirms null latitude in DB', () => {
      expect(getBody['latitude']).toBeNull();
    });

    await test.step('GET confirms null longitude in DB', () => {
      expect(getBody['longitude']).toBeNull();
    });
  });

  test('returns 401 when unauthenticated', async () => {
    const resp = await anonCtx.put(`/api/adressen/${testId}`, {
      data: { city: 'Berlin' },
    });
    expect(resp.status()).toBe(401);
  });

  test('returns 404 for unknown id', async () => {
    const resp = await adminCtx.put('/api/adressen/999999', {
      data: { city: 'Berlin' },
    });
    expect(resp.status()).toBe(404);
  });
});
