/**
 * Playwright API tests for the Szenarien CRUD routes.
 *
 * Covers:
 *   GET  /api/szenarien         — 200, array shape, seeded "Standard-Szenario" present
 *   POST /api/szenarien         — 201, body shape, JSON round-trip of works/waits arrays
 *   GET  /api/szenarien/:id     — 200 for created; 404 for unknown
 *   PUT  /api/szenarien/:id     — 200, mutation reflected by GET
 *   DELETE /api/szenarien/:id   — 204; subsequent GET → 404
 *   Auth: no session → 401 (requireAuth only, no requireRole)
 *   Validation: missing name → 400 + fieldErrors.name
 *               wrong works length → 400 + fieldErrors key
 *               wrong waits length → 400 + fieldErrors key
 *               negative duration → 400
 *               duration > 479520 → 400
 *   Duplicate name → 409 with message
 *   Persistence: re-fetched humanSteps.works exactly matches the 23-element array sent
 */
import { test, expect, request as playwrightRequest } from '@playwright/test';
import type { APIRequestContext } from '@playwright/test';
import { loginCtx } from './helpers.js';

const BASE_URL = 'http://localhost:7070';

// ---------------------------------------------------------------------------
// Shared test data
// ---------------------------------------------------------------------------

// Valid 23-element works array (element 0 is 0 per convention)
const HUMAN_WORKS_23: number[] = [
  0, 60, 30, 60, 30, 15, 240, 30, 60, 60, 30, 15, 120, 15, 120, 20, 30, 30, 20, 15, 60, 30, 30,
];
// Valid 22-element waits array
const HUMAN_WAITS_22: number[] = [
  240, 480, 240, 1440, 2880, 0, 480, 480, 480, 240, 480, 1440, 480, 240, 480, 480, 240, 240, 480,
  1440, 1440, 480,
];

const SEMI_WORKS_6: number[] = [0, 5, 15, 10, 30, 20];
const SEMI_WAITS_5: number[] = [240, 480, 0, 480, 0];

const AUTO_WORKS_2: number[] = [0, 20];
const AUTO_WAITS_1: number[] = [240];

/** Build a minimal valid szenario payload with a unique name. */
function validPayload(name: string) {
  return {
    name,
    humanSteps: { works: HUMAN_WORKS_23, waits: HUMAN_WAITS_22 },
    semiAutomatedSteps: { works: SEMI_WORKS_6, waits: SEMI_WAITS_5 },
    automatedSteps: { works: AUTO_WORKS_2, waits: AUTO_WAITS_1 },
  };
}

interface ProzessDauer {
  works: number[];
  waits: number[];
}

interface SzenarioDTO {
  id: number;
  name: string;
  humanSteps: ProzessDauer;
  semiAutomatedSteps: ProzessDauer;
  automatedSteps: ProzessDauer;
  createdAt: string;
  updatedAt: string;
}

interface ErrorBody {
  status: number;
  message: string;
  timestamp: string;
  fieldErrors: Record<string, string>;
}

// ---------------------------------------------------------------------------
// Suite: CRUD happy path
// ---------------------------------------------------------------------------

test.describe('CRUD happy path', () => {
  let adminCtx: APIRequestContext;
  let anonCtx: APIRequestContext;
  let createdId: number | undefined;
  let createdName: string;

  test.beforeAll(async () => {
    adminCtx = await loginCtx('admin', 'admin123');
    anonCtx = await playwrightRequest.newContext({ baseURL: BASE_URL });
  });

  test.afterAll(async () => {
    // Clean up: the DELETE test handles this, but guard against test failure.
    if (createdId !== undefined) {
      await adminCtx.delete(`/api/szenarien/${createdId}`).catch(() => undefined);
    }
    await adminCtx.dispose();
    await anonCtx.dispose();
  });

  // ── GET list ───────────────────────────────────────────────────────────────

  test('GET /api/szenarien returns 200 and an array', async () => {
    const resp = await adminCtx.get('/api/szenarien');

    await test.step('status 200', () => {
      expect(resp.status()).toBe(200);
    });

    const body = await resp.json() as unknown[];

    await test.step('body is an array', () => {
      expect(Array.isArray(body)).toBe(true);
    });
  });

  test('GET /api/szenarien list contains the seeded Standard-Szenario by id=1', async () => {
    const resp = await adminCtx.get('/api/szenarien');
    const body = await resp.json() as SzenarioDTO[];

    await test.step('at least one row exists (seeded row present)', () => {
      expect(body.length).toBeGreaterThan(0);
    });

    const seeded = body.find((s) => s.id === 1);

    await test.step('row with id=1 (Standard-Szenario) found in list', () => {
      expect(seeded).toBeDefined();
    });

    await test.step('seeded row has name Standard-Szenario', () => {
      expect(seeded?.name).toBe('Standard-Szenario');
    });
  });

  // ── POST create ────────────────────────────────────────────────────────────

  test('POST /api/szenarien returns 201 with correct body shape', async () => {
    createdName = `Test-Szenario-${Date.now()}`;
    const resp = await adminCtx.post('/api/szenarien', {
      data: validPayload(createdName),
    });

    await test.step('status 201', () => {
      expect(resp.status()).toBe(201);
    });

    const body = await resp.json() as SzenarioDTO;

    await test.step('id is a positive integer', () => {
      expect(typeof body.id).toBe('number');
      expect(body.id).toBeGreaterThan(0);
    });

    await test.step('name matches submitted value', () => {
      expect(body.name).toBe(createdName);
    });

    await test.step('createdAt is a non-empty string', () => {
      expect(typeof body.createdAt).toBe('string');
      expect(body.createdAt.length).toBeGreaterThan(0);
    });

    await test.step('updatedAt is a non-empty string', () => {
      expect(typeof body.updatedAt).toBe('string');
      expect(body.updatedAt.length).toBeGreaterThan(0);
    });

    await test.step('humanSteps is present', () => {
      expect(body.humanSteps).toBeDefined();
    });

    await test.step('semiAutomatedSteps is present', () => {
      expect(body.semiAutomatedSteps).toBeDefined();
    });

    await test.step('automatedSteps is present', () => {
      expect(body.automatedSteps).toBeDefined();
    });

    createdId = body.id;
  });

  // ── Persistence round-trip ────────────────────────────────────────────────

  test('humanSteps.works round-trips exactly as the 23-element array sent', async () => {
    test.skip(createdId === undefined, 'POST did not return an id');

    const resp = await adminCtx.get(`/api/szenarien/${createdId}`);
    expect(resp.status()).toBe(200);

    const body = await resp.json() as SzenarioDTO;

    await test.step('works array has exactly 23 elements', () => {
      expect(body.humanSteps.works.length).toBe(23);
    });

    await test.step('every works element matches the sent value', () => {
      for (let i = 0; i < 23; i++) {
        expect(body.humanSteps.works[i]).toBe(HUMAN_WORKS_23[i]);
      }
    });

    await test.step('waits array has exactly 22 elements', () => {
      expect(body.humanSteps.waits.length).toBe(22);
    });
  });

  // ── GET list finds the created item ───────────────────────────────────────

  test('GET /api/szenarien list contains the newly created szenario by id', async () => {
    test.skip(createdId === undefined, 'POST did not return an id');

    const resp = await adminCtx.get('/api/szenarien');
    const body = await resp.json() as SzenarioDTO[];
    const found = body.find((s) => s.id === createdId);

    await test.step('created szenario appears in list', () => {
      expect(found).toBeDefined();
    });

    await test.step('name in list matches', () => {
      expect(found?.name).toBe(createdName);
    });
  });

  // ── GET /:id ───────────────────────────────────────────────────────────────

  test('GET /api/szenarien/:id returns 200 for the created szenario', async () => {
    test.skip(createdId === undefined, 'POST did not return an id');

    const resp = await adminCtx.get(`/api/szenarien/${createdId}`);

    await test.step('status 200', () => {
      expect(resp.status()).toBe(200);
    });

    const body = await resp.json() as SzenarioDTO;

    await test.step('returned id matches', () => {
      expect(body.id).toBe(createdId);
    });
  });

  // ── PUT update ────────────────────────────────────────────────────────────

  test('PUT /api/szenarien/:id returns 200 and change is reflected by GET', async () => {
    test.skip(createdId === undefined, 'POST did not return an id');

    const updatedName = `Updated-Szenario-${Date.now()}`;
    const putResp = await adminCtx.put(`/api/szenarien/${createdId}`, {
      data: validPayload(updatedName),
    });

    await test.step('PUT returns 200', () => {
      expect(putResp.status()).toBe(200);
    });

    const putBody = await putResp.json() as SzenarioDTO;

    await test.step('PUT response contains updated name', () => {
      expect(putBody.name).toBe(updatedName);
    });

    const getResp = await adminCtx.get(`/api/szenarien/${createdId}`);

    await test.step('subsequent GET returns 200', () => {
      expect(getResp.status()).toBe(200);
    });

    const getBody = await getResp.json() as SzenarioDTO;

    await test.step('GET name reflects the update', () => {
      expect(getBody.name).toBe(updatedName);
    });

    // Keep the name tracking consistent for cleanup
    createdName = updatedName;
  });

  // ── DELETE ────────────────────────────────────────────────────────────────

  test('DELETE /api/szenarien/:id returns 204; subsequent GET returns 404', async () => {
    test.skip(createdId === undefined, 'POST did not return an id');

    const deleteResp = await adminCtx.delete(`/api/szenarien/${createdId}`);

    await test.step('DELETE returns 204', () => {
      expect(deleteResp.status()).toBe(204);
    });

    const getResp = await adminCtx.get(`/api/szenarien/${createdId}`);

    await test.step('subsequent GET returns 404', () => {
      expect(getResp.status()).toBe(404);
    });

    // Prevent afterAll cleanup from issuing a second DELETE on a gone row
    createdId = undefined;
  });

  // ── Not found ─────────────────────────────────────────────────────────────

  test('GET /api/szenarien/99999 returns 404 with standard error body', async () => {
    const resp = await adminCtx.get('/api/szenarien/99999');

    await test.step('status 404', () => {
      expect(resp.status()).toBe(404);
    });

    const body = await resp.json() as ErrorBody;

    await test.step('error body status field is 404', () => {
      expect(body.status).toBe(404);
    });

    await test.step('error body has non-empty message', () => {
      expect(typeof body.message).toBe('string');
      expect(body.message.length).toBeGreaterThan(0);
    });

    await test.step('error body has timestamp string', () => {
      expect(typeof body.timestamp).toBe('string');
      expect(body.timestamp.length).toBeGreaterThan(0);
    });

    await test.step('error body has fieldErrors object', () => {
      expect(typeof body.fieldErrors).toBe('object');
      expect(body.fieldErrors).not.toBeNull();
    });
  });

  // ── Auth: unauthenticated → 401 ───────────────────────────────────────────

  test('GET /api/szenarien without session returns 401', async () => {
    const resp = await anonCtx.get('/api/szenarien');
    expect(resp.status()).toBe(401);
  });

  test('POST /api/szenarien without session returns 401', async () => {
    const resp = await anonCtx.post('/api/szenarien', {
      data: validPayload(`Anon-${Date.now()}`),
    });
    expect(resp.status()).toBe(401);
  });

  test('PUT /api/szenarien/1 without session returns 401', async () => {
    const resp = await anonCtx.put('/api/szenarien/1', {
      data: validPayload('Standard-Szenario'),
    });
    expect(resp.status()).toBe(401);
  });

  test('DELETE /api/szenarien/1 without session returns 401', async () => {
    const resp = await anonCtx.delete('/api/szenarien/1');
    expect(resp.status()).toBe(401);
  });
});

// ---------------------------------------------------------------------------
// Suite: Validation errors
// ---------------------------------------------------------------------------

test.describe('Validation errors', () => {
  let adminCtx: APIRequestContext;

  test.beforeAll(async () => {
    adminCtx = await loginCtx('admin', 'admin123');
  });

  test.afterAll(async () => {
    await adminCtx.dispose();
  });

  // ── Missing name ──────────────────────────────────────────────────────────

  test('POST with missing name → 400 with fieldErrors.name', async () => {
    const payload = {
      // no name field
      humanSteps: { works: HUMAN_WORKS_23, waits: HUMAN_WAITS_22 },
      semiAutomatedSteps: { works: SEMI_WORKS_6, waits: SEMI_WAITS_5 },
      automatedSteps: { works: AUTO_WORKS_2, waits: AUTO_WAITS_1 },
    };

    const resp = await adminCtx.post('/api/szenarien', { data: payload });

    await test.step('status 400', () => {
      expect(resp.status()).toBe(400);
    });

    const body = await resp.json() as ErrorBody;

    await test.step('fieldErrors.name is present', () => {
      expect(typeof body.fieldErrors?.['name']).toBe('string');
    });
  });

  test('POST with empty name → 400 with fieldErrors.name', async () => {
    const resp = await adminCtx.post('/api/szenarien', {
      data: { ...validPayload(''), name: '' },
    });

    await test.step('status 400', () => {
      expect(resp.status()).toBe(400);
    });

    const body = await resp.json() as ErrorBody;

    await test.step('fieldErrors.name is present', () => {
      expect(typeof body.fieldErrors?.['name']).toBe('string');
    });
  });

  // ── Wrong works length (22 instead of 23) ─────────────────────────────────

  test('POST with humanSteps.works length 22 (not 23) → 400 with fieldErrors key', async () => {
    const shortWorks = HUMAN_WORKS_23.slice(0, 22); // 22 elements

    const resp = await adminCtx.post('/api/szenarien', {
      data: {
        name: `Invalid-Works-${Date.now()}`,
        humanSteps: { works: shortWorks, waits: HUMAN_WAITS_22 },
        semiAutomatedSteps: { works: SEMI_WORKS_6, waits: SEMI_WAITS_5 },
        automatedSteps: { works: AUTO_WORKS_2, waits: AUTO_WAITS_1 },
      },
    });

    await test.step('status 400', () => {
      expect(resp.status()).toBe(400);
    });

    const body = await resp.json() as ErrorBody;

    await test.step('fieldErrors contains a humanSteps.works key', () => {
      expect(typeof body.fieldErrors?.['humanSteps.works']).toBe('string');
    });
  });

  // ── Wrong waits length (21 instead of 22) ─────────────────────────────────

  test('POST with humanSteps.waits length 21 (not 22) → 400 with fieldErrors key', async () => {
    const shortWaits = HUMAN_WAITS_22.slice(0, 21); // 21 elements

    const resp = await adminCtx.post('/api/szenarien', {
      data: {
        name: `Invalid-Waits-${Date.now()}`,
        humanSteps: { works: HUMAN_WORKS_23, waits: shortWaits },
        semiAutomatedSteps: { works: SEMI_WORKS_6, waits: SEMI_WAITS_5 },
        automatedSteps: { works: AUTO_WORKS_2, waits: AUTO_WAITS_1 },
      },
    });

    await test.step('status 400', () => {
      expect(resp.status()).toBe(400);
    });

    const body = await resp.json() as ErrorBody;

    await test.step('fieldErrors contains a humanSteps.waits key', () => {
      expect(typeof body.fieldErrors?.['humanSteps.waits']).toBe('string');
    });
  });

  // ── Negative duration ─────────────────────────────────────────────────────

  test('POST with a negative duration value → 400', async () => {
    const worksWithNegative: number[] = [...HUMAN_WORKS_23];
    worksWithNegative[5] = -1;

    const resp = await adminCtx.post('/api/szenarien', {
      data: {
        name: `Negative-Duration-${Date.now()}`,
        humanSteps: { works: worksWithNegative, waits: HUMAN_WAITS_22 },
        semiAutomatedSteps: { works: SEMI_WORKS_6, waits: SEMI_WAITS_5 },
        automatedSteps: { works: AUTO_WORKS_2, waits: AUTO_WAITS_1 },
      },
    });

    await test.step('status 400', () => {
      expect(resp.status()).toBe(400);
    });

    const body = await resp.json() as ErrorBody;

    await test.step('fieldErrors is an object', () => {
      expect(typeof body.fieldErrors).toBe('object');
      expect(body.fieldErrors).not.toBeNull();
    });
  });

  // ── Duration exceeds 479520 ───────────────────────────────────────────────

  test('POST with duration > 479520 → 400', async () => {
    const worksOverMax: number[] = [...HUMAN_WORKS_23];
    worksOverMax[5] = 479521;

    const resp = await adminCtx.post('/api/szenarien', {
      data: {
        name: `Over-Max-Duration-${Date.now()}`,
        humanSteps: { works: worksOverMax, waits: HUMAN_WAITS_22 },
        semiAutomatedSteps: { works: SEMI_WORKS_6, waits: SEMI_WAITS_5 },
        automatedSteps: { works: AUTO_WORKS_2, waits: AUTO_WAITS_1 },
      },
    });

    await test.step('status 400', () => {
      expect(resp.status()).toBe(400);
    });

    const body = await resp.json() as ErrorBody;

    await test.step('fieldErrors is an object', () => {
      expect(typeof body.fieldErrors).toBe('object');
      expect(body.fieldErrors).not.toBeNull();
    });
  });

  // ── Boundary: exactly 479520 is valid ─────────────────────────────────────

  test('POST with duration exactly 479520 → 201 (boundary is inclusive)', async () => {
    const worksAtMax: number[] = [...HUMAN_WORKS_23];
    worksAtMax[1] = 479520;

    const name = `At-Max-Duration-${Date.now()}`;
    const resp = await adminCtx.post('/api/szenarien', {
      data: {
        name,
        humanSteps: { works: worksAtMax, waits: HUMAN_WAITS_22 },
        semiAutomatedSteps: { works: SEMI_WORKS_6, waits: SEMI_WAITS_5 },
        automatedSteps: { works: AUTO_WORKS_2, waits: AUTO_WAITS_1 },
      },
    });

    await test.step('status 201', () => {
      expect(resp.status()).toBe(201);
    });

    // Clean up
    const body = await resp.json() as SzenarioDTO;
    if (body.id) {
      await adminCtx.delete(`/api/szenarien/${body.id}`);
    }
  });
});

// ---------------------------------------------------------------------------
// Suite: Duplicate name → 409
// ---------------------------------------------------------------------------

test.describe('Duplicate name → 409', () => {
  let adminCtx: APIRequestContext;
  let createdId: number | undefined;

  test.beforeAll(async () => {
    adminCtx = await loginCtx('admin', 'admin123');
  });

  test.afterAll(async () => {
    if (createdId !== undefined) {
      await adminCtx.delete(`/api/szenarien/${createdId}`).catch(() => undefined);
    }
    await adminCtx.dispose();
  });

  test('POST same name twice → second request returns 409 with message', async () => {
    const name = `Duplicate-${Date.now()}`;

    // First create
    const first = await adminCtx.post('/api/szenarien', { data: validPayload(name) });

    await test.step('first POST returns 201', () => {
      expect(first.status()).toBe(201);
    });

    const firstBody = await first.json() as SzenarioDTO;
    createdId = firstBody.id;

    // Second create with same name
    const second = await adminCtx.post('/api/szenarien', { data: validPayload(name) });

    await test.step('second POST returns 409', () => {
      expect(second.status()).toBe(409);
    });

    const secondBody = await second.json() as ErrorBody;

    await test.step('error body status field is 409', () => {
      expect(secondBody.status).toBe(409);
    });

    await test.step('error body has non-empty message', () => {
      expect(typeof secondBody.message).toBe('string');
      expect(secondBody.message.length).toBeGreaterThan(0);
    });
  });

  test('PUT with a name already used by another row → 409', async () => {
    // Use the seeded "Standard-Szenario" (id=1) as the existing name target.
    // Create a fresh szenario, then try to rename it to "Standard-Szenario".
    const name = `Rename-Test-${Date.now()}`;
    const createResp = await adminCtx.post('/api/szenarien', { data: validPayload(name) });
    expect(createResp.status()).toBe(201);
    const created = await createResp.json() as SzenarioDTO;
    const tempId = created.id;

    const putResp = await adminCtx.put(`/api/szenarien/${tempId}`, {
      data: validPayload('Standard-Szenario'),
    });

    await test.step('PUT returns 409', () => {
      expect(putResp.status()).toBe(409);
    });

    // Clean up the temp row
    await adminCtx.delete(`/api/szenarien/${tempId}`);
  });
});

// ---------------------------------------------------------------------------
// Suite: semiAutomatedSteps and automatedSteps validation
// ---------------------------------------------------------------------------

test.describe('Validation for semiAutomated and automated step counts', () => {
  let adminCtx: APIRequestContext;

  test.beforeAll(async () => {
    adminCtx = await loginCtx('admin', 'admin123');
  });

  test.afterAll(async () => {
    await adminCtx.dispose();
  });

  test('POST with semiAutomatedSteps.works length 5 (not 6) → 400', async () => {
    const resp = await adminCtx.post('/api/szenarien', {
      data: {
        name: `Invalid-Semi-Works-${Date.now()}`,
        humanSteps: { works: HUMAN_WORKS_23, waits: HUMAN_WAITS_22 },
        semiAutomatedSteps: { works: SEMI_WORKS_6.slice(0, 5), waits: SEMI_WAITS_5 },
        automatedSteps: { works: AUTO_WORKS_2, waits: AUTO_WAITS_1 },
      },
    });

    await test.step('status 400', () => {
      expect(resp.status()).toBe(400);
    });

    const body = await resp.json() as ErrorBody;

    await test.step('fieldErrors contains semiAutomatedSteps.works key', () => {
      expect(typeof body.fieldErrors?.['semiAutomatedSteps.works']).toBe('string');
    });
  });

  test('POST with automatedSteps.waits length 0 (not 1) → 400', async () => {
    const resp = await adminCtx.post('/api/szenarien', {
      data: {
        name: `Invalid-Auto-Waits-${Date.now()}`,
        humanSteps: { works: HUMAN_WORKS_23, waits: HUMAN_WAITS_22 },
        semiAutomatedSteps: { works: SEMI_WORKS_6, waits: SEMI_WAITS_5 },
        automatedSteps: { works: AUTO_WORKS_2, waits: [] },
      },
    });

    await test.step('status 400', () => {
      expect(resp.status()).toBe(400);
    });

    const body = await resp.json() as ErrorBody;

    await test.step('fieldErrors contains automatedSteps.waits key', () => {
      expect(typeof body.fieldErrors?.['automatedSteps.waits']).toBe('string');
    });
  });
});
