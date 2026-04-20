/**
 * Tests for POST /api/admin/geocode-addresses.
 *
 * Covers: authorization (401, 403), batch counters (success, failed variants,
 * skippedInsufficientData), concurrency guard (409), force=true re-geocoding,
 * and default skip of rows with existing coords.
 *
 * Stub control is done via HTTP (PUT/DELETE /control on the stub server) so
 * that test workers can communicate with the stub running in the main process.
 */
import { test, expect, request as playwrightRequest, type APIRequestContext } from '@playwright/test';
import { sqlite } from '../config/db.js';
import {
  resetDatabase,
  insertAdresseWithoutCoords,
  setStubResponse,
  clearStubOverrides,
  getStubCallCount,
  resetStubCallCount,
} from './helpers.js';

const BASE_URL = 'http://localhost:7070';

// ---------------------------------------------------------------------------
// Suite-level setup: one pre-authenticated context per user role
// ---------------------------------------------------------------------------

let adminCtx: APIRequestContext;
let userCtx: APIRequestContext;
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
  userCtx = await loginCtx('user', 'test123');
  anonCtx = await playwrightRequest.newContext({ baseURL: BASE_URL });
});

test.afterAll(async () => {
  resetDatabase();
  await clearStubOverrides();
  await adminCtx.dispose();
  await userCtx.dispose();
  await anonCtx.dispose();
});

test.beforeEach(async () => {
  // Reset stub state before each test
  await clearStubOverrides();
});

// ---------------------------------------------------------------------------
// Helpers to isolate the adresse table to exactly the rows we care about
// ---------------------------------------------------------------------------

function clearAddresses(): void {
  sqlite.pragma('foreign_keys = OFF');
  sqlite.exec('DELETE FROM adresse');
  sqlite.pragma('foreign_keys = ON');
}

// ---------------------------------------------------------------------------
// Authorization
// ---------------------------------------------------------------------------
test.describe('Authorization', () => {
  test('returns 401 when not authenticated', async () => {
    const resp = await anonCtx.post('/api/admin/geocode-addresses');
    expect(resp.status()).toBe(401);
  });

  test('returns 403 when user lacks ADMIN role', async () => {
    const resp = await userCtx.post('/api/admin/geocode-addresses');

    await test.step('status 403', () => {
      expect(resp.status()).toBe(403);
    });

    const body = await resp.json() as {
      status: number;
      message: string;
      timestamp: string;
    };

    await test.step('standard error shape', () => {
      expect(body.status).toBe(403);
      expect(typeof body.message).toBe('string');
      expect(body.message.length).toBeGreaterThan(0);
      expect(typeof body.timestamp).toBe('string');
    });
  });
});

// ---------------------------------------------------------------------------
// Happy path — admin success with counter invariant
// ---------------------------------------------------------------------------
test.describe('Admin success', () => {
  test('returns 200 with correct counter shape and total invariant', async () => {
    clearAddresses();
    const id = insertAdresseWithoutCoords();

    const resp = await adminCtx.post('/api/admin/geocode-addresses');
    sqlite.prepare('DELETE FROM adresse WHERE id = ?').run(id);

    await test.step('status 200', () => {
      expect(resp.status()).toBe(200);
    });

    const body = await resp.json() as {
      total: number;
      succeeded: number;
      failed: number;
      skippedInsufficientData: number;
    };

    await test.step('all fields are integers', () => {
      expect(Number.isInteger(body.total)).toBe(true);
      expect(Number.isInteger(body.succeeded)).toBe(true);
      expect(Number.isInteger(body.failed)).toBe(true);
      expect(Number.isInteger(body.skippedInsufficientData)).toBe(true);
    });

    await test.step('total equals sum of parts', () => {
      expect(body.total).toBe(body.succeeded + body.failed + body.skippedInsufficientData);
    });

    await test.step('the one row succeeded', () => {
      expect(body.total).toBe(1);
      expect(body.succeeded).toBe(1);
    });
  });
});

// ---------------------------------------------------------------------------
// Concurrency guard — second simultaneous POST returns 409
// ---------------------------------------------------------------------------
test.describe('Concurrency', () => {
  test('two near-simultaneous POSTs yield one 200 and one 409', async () => {
    clearAddresses();
    const ids: number[] = [];
    for (let i = 0; i < 3; i++) {
      ids.push(insertAdresseWithoutCoords({ city: 'Berlin', postalCode: '10115' }));
    }

    const adminCtx2 = await loginCtx('admin', 'admin123');
    const [resp1, resp2] = await Promise.all([
      adminCtx.post('/api/admin/geocode-addresses'),
      adminCtx2.post('/api/admin/geocode-addresses'),
    ]);
    await adminCtx2.dispose();

    for (const id of ids) {
      sqlite.prepare('DELETE FROM adresse WHERE id = ?').run(id);
    }

    const statuses = [resp1.status(), resp2.status()].sort();

    await test.step('one response is 200', () => {
      expect(statuses).toContain(200);
    });

    await test.step('other response is 409', () => {
      expect(statuses).toContain(409);
    });
  });
});

// ---------------------------------------------------------------------------
// Stub failure: HTTP 500
// ---------------------------------------------------------------------------
test.describe('Stub failure: HTTP 500', () => {
  test('address counted in failed when stub returns 500', async () => {
    clearAddresses();
    const id = insertAdresseWithoutCoords();

    await setStubResponse({ type: 'http-500' });

    const resp = await adminCtx.post('/api/admin/geocode-addresses');
    sqlite.prepare('DELETE FROM adresse WHERE id = ?').run(id);

    expect(resp.status()).toBe(200);
    const body = await resp.json() as {
      total: number;
      succeeded: number;
      failed: number;
      skippedInsufficientData: number;
    };
    expect(body.total).toBe(1);
    expect(body.failed).toBe(1);
    expect(body.succeeded).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// Stub failure: empty array
// ---------------------------------------------------------------------------
test.describe('Stub failure: empty array', () => {
  test('address counted in failed when stub returns empty array []', async () => {
    clearAddresses();
    const id = insertAdresseWithoutCoords();

    await setStubResponse({ type: 'empty' });

    const resp = await adminCtx.post('/api/admin/geocode-addresses');
    sqlite.prepare('DELETE FROM adresse WHERE id = ?').run(id);

    expect(resp.status()).toBe(200);
    const body = await resp.json() as {
      total: number;
      succeeded: number;
      failed: number;
      skippedInsufficientData: number;
    };
    expect(body.total).toBe(1);
    expect(body.failed).toBe(1);
    expect(body.succeeded).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// Stub failure: malformed body
// ---------------------------------------------------------------------------
test.describe('Stub failure: malformed body', () => {
  test('address counted in failed when stub returns malformed HTML', async () => {
    clearAddresses();
    const id = insertAdresseWithoutCoords();

    await setStubResponse({ type: 'malformed' });

    const resp = await adminCtx.post('/api/admin/geocode-addresses');
    sqlite.prepare('DELETE FROM adresse WHERE id = ?').run(id);

    expect(resp.status()).toBe(200);
    const body = await resp.json() as {
      total: number;
      succeeded: number;
      failed: number;
      skippedInsufficientData: number;
    };
    expect(body.total).toBe(1);
    expect(body.failed).toBe(1);
    expect(body.succeeded).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// Stub timeout — AbortSignal.timeout fires after 10s.
// Only one row to minimize test duration.
// ---------------------------------------------------------------------------
test.describe('Stub timeout', () => {
  test('address counted in failed when stub never responds', async () => {
    test.setTimeout(35_000);

    clearAddresses();
    const id = insertAdresseWithoutCoords();

    await setStubResponse({ type: 'timeout' });

    const resp = await adminCtx.post('/api/admin/geocode-addresses', {
      timeout: 30_000,
    });
    sqlite.prepare('DELETE FROM adresse WHERE id = ?').run(id);

    expect(resp.status()).toBe(200);
    const body = await resp.json() as {
      total: number;
      succeeded: number;
      failed: number;
      skippedInsufficientData: number;
    };
    expect(body.total).toBe(1);
    expect(body.failed).toBe(1);
    expect(body.succeeded).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// skippedInsufficientData — row with no city AND no postalCode
// ---------------------------------------------------------------------------
test.describe('skippedInsufficientData', () => {
  test('address with null city and null postalCode counted in skippedInsufficientData, stub not called', async () => {
    clearAddresses();
    const id = insertAdresseWithoutCoords({ city: null, postalCode: null });
    await resetStubCallCount();

    const resp = await adminCtx.post('/api/admin/geocode-addresses');
    sqlite.prepare('DELETE FROM adresse WHERE id = ?').run(id);

    expect(resp.status()).toBe(200);
    const body = await resp.json() as {
      total: number;
      skippedInsufficientData: number;
      failed: number;
      succeeded: number;
    };

    await test.step('total is 1', () => {
      expect(body.total).toBe(1);
    });

    await test.step('skippedInsufficientData is 1', () => {
      expect(body.skippedInsufficientData).toBe(1);
    });

    await test.step('succeeded and failed are 0', () => {
      expect(body.succeeded).toBe(0);
      expect(body.failed).toBe(0);
    });

    const callCount = await getStubCallCount();
    await test.step('stub was not called at all', () => {
      expect(callCount).toBe(0);
    });
  });
});

// ---------------------------------------------------------------------------
// force=true — re-geocodes rows that already have coordinates
// ---------------------------------------------------------------------------
test.describe('force=true', () => {
  test('default call skips rows with existing coords; force=true re-geocodes them', async () => {
    // Isolate: one row WITH existing coordinates
    clearAddresses();

    const now = new Date().toISOString();
    const result = sqlite
      .prepare(
        `INSERT INTO adresse (street, postalCode, city, country, latitude, longitude, createdAt, updatedAt)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
      )
      .run('Hauptstr.', '10115', 'Berlin', 'Deutschland', 52.111, 13.111, now, now);
    const id = Number(result.lastInsertRowid);

    // ---- Default call: no rows without coords → total=0, stub not called ----
    await resetStubCallCount();

    const defaultResp = await adminCtx.post('/api/admin/geocode-addresses');

    await test.step('default call returns 200', () => {
      expect(defaultResp.status()).toBe(200);
    });

    const defaultBody = await defaultResp.json() as { total: number };

    await test.step('default call processes 0 rows', () => {
      expect(defaultBody.total).toBe(0);
    });

    const defaultCallCount = await getStubCallCount();

    await test.step('stub not called for default run', () => {
      expect(defaultCallCount).toBe(0);
    });

    // ---- Force call: re-geocodes the row with coords ----
    await resetStubCallCount();

    const forceResp = await adminCtx.post('/api/admin/geocode-addresses?force=true');
    sqlite.prepare('DELETE FROM adresse WHERE id = ?').run(id);

    await test.step('force call returns 200', () => {
      expect(forceResp.status()).toBe(200);
    });

    const forceBody = await forceResp.json() as {
      total: number;
      succeeded: number;
      failed: number;
      skippedInsufficientData: number;
    };

    await test.step('force run processes 1 row', () => {
      expect(forceBody.total).toBe(1);
    });

    await test.step('force run succeeds for that row', () => {
      expect(forceBody.succeeded).toBe(1);
    });

    const forceCallCount = await getStubCallCount();

    await test.step('stub called exactly once during force run', () => {
      expect(forceCallCount).toBe(1);
    });
  });
});
