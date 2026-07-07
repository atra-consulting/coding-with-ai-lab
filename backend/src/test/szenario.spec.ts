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
 *               wrong works length → 400 + fieldErrors key (all 4 processes)
 *               wrong waits length → 400 + fieldErrors key (all 4 processes)
 *               negative duration → 400
 *               duration > 479520 → 400
 *   Duplicate name → 409 with message
 *   Persistence: re-fetched humanSteps.works exactly matches the 19-element array sent;
 *                agileKiSteps round-trips element-by-element with values distinct from
 *                humanSteps, so a column-swap bug in create()/update() would be caught.
 *   Seed: after startup, the seeded Standard-Szenario (id=1) reflects the 4-process
 *         canonical totals (3,880 / 2,970 / 290 / 25) and has a valid 19-length
 *         agileKiSteps. The pre-existing-DB ALTER/upgrade path (adding the
 *         agileKiSteps column to an old 3-process DB) is NOT exercised here — it
 *         is a manual/scripted check (see PLAN-RECHNER-OVERHAUL.md §8), not
 *         automatable against the fresh CI DB this harness always starts with.
 *
 * Process step counts: human 19, agileKi 19, semiAutomated 7, automated 2.
 */
import { test, expect, request as playwrightRequest } from '@playwright/test';
import type { APIRequestContext } from '@playwright/test';
import { loginCtx } from './helpers.js';

const BASE_URL = 'http://localhost:7070';

// ---------------------------------------------------------------------------
// Shared test data
// ---------------------------------------------------------------------------

// Valid 19-element works array (element 0 is 0 per convention)
const HUMAN_WORKS_19: number[] = [
  0, 60, 30, 60, 30, 15, 240, 30, 60, 60, 30, 15, 120, 15, 120, 20, 20, 15, 60,
];
// Valid 18-element waits array
const HUMAN_WAITS_18: number[] = [
  120, 120, 120, 960, 480, 0, 30, 120, 120, 120, 30, 240, 60, 0, 30, 240, 30, 60,
];

// agileKiSteps test values are intentionally DISTINCT from HUMAN_WORKS_19 /
// HUMAN_WAITS_18 (both are also 19/18-length arrays) so that a column-swap
// bug in szenarioService create()/update() — e.g. writing humanSteps' JSON
// into the agileKiSteps column or vice versa — is caught by the round-trip
// assertions below instead of silently passing on identical data.
const AGILE_KI_WORKS_19: number[] = [
  0, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5,
];
const AGILE_KI_WAITS_18: number[] = [
  10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10,
];

// Used ONLY in the PUT round-trip test, in place of AGILE_KI_WORKS_19/
// AGILE_KI_WAITS_18. If the PUT test resent the same creation-time
// constants, the round-trip assertion would pass even if update() dropped
// agileKiSteps from its SET clause entirely (GET would still echo back the
// value written at create() time). Offsetting by +1 forces the assertion to
// fail unless update() actually persists the newly sent values.
const AGILE_KI_WORKS_19_ALT: number[] = AGILE_KI_WORKS_19.map((w) => w + 1);
const AGILE_KI_WAITS_18_ALT: number[] = AGILE_KI_WAITS_18.map((w) => w + 1);

const SEMI_WORKS_7: number[] = [0, 5, 15, 15, 10, 30, 20];
const SEMI_WAITS_6: number[] = [5, 60, 60, 5, 60, 5];

const AUTO_WORKS_2: number[] = [0, 20];
const AUTO_WAITS_1: number[] = [5];

// Seed-exact values for the "Seed defaults" suite below — kept as separate
// constants from AGILE_KI_WORKS_19/AGILE_KI_WAITS_18 (the CRUD-test payload
// values) even though the works arrays happen to coincide, because the two
// constants serve different purposes: these assert against the real seed
// written by szenarioSeed.ts, the others exist to catch column swaps in
// arbitrary CRUD payloads. SEMI_WORKS_7/SEMI_WAITS_6/AUTO_WORKS_2/AUTO_WAITS_1
// above are already seed-exact, so no separate SEED_* constants are needed
// for those two processes.
const SEED_AGILE_KI_WORKS: number[] = [
  0, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5,
];
const SEED_AGILE_KI_WAITS: number[] = HUMAN_WAITS_18;

/** Build a minimal valid szenario payload with a unique name. */
function validPayload(name: string) {
  return {
    name,
    humanSteps: { works: HUMAN_WORKS_19, waits: HUMAN_WAITS_18 },
    agileKiSteps: { works: AGILE_KI_WORKS_19, waits: AGILE_KI_WAITS_18 },
    semiAutomatedSteps: { works: SEMI_WORKS_7, waits: SEMI_WAITS_6 },
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
  agileKiSteps: ProzessDauer;
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

function sum(values: number[]): number {
  return values.reduce((acc, v) => acc + v, 0);
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

    await test.step('agileKiSteps is present', () => {
      expect(body.agileKiSteps).toBeDefined();
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

  test('humanSteps.works round-trips exactly as the 19-element array sent', async () => {
    test.skip(createdId === undefined, 'POST did not return an id');

    const resp = await adminCtx.get(`/api/szenarien/${createdId}`);
    expect(resp.status()).toBe(200);

    const body = await resp.json() as SzenarioDTO;

    await test.step('works array has exactly 19 elements', () => {
      expect(body.humanSteps.works.length).toBe(19);
    });

    await test.step('every works element matches the sent value', () => {
      for (let i = 0; i < 19; i++) {
        expect(body.humanSteps.works[i]).toBe(HUMAN_WORKS_19[i]);
      }
    });

    await test.step('waits array has exactly 18 elements', () => {
      expect(body.humanSteps.waits.length).toBe(18);
    });
  });

  test('agileKiSteps round-trips exactly, with values distinct from humanSteps (column-swap guard)', async () => {
    test.skip(createdId === undefined, 'POST did not return an id');

    const resp = await adminCtx.get(`/api/szenarien/${createdId}`);
    expect(resp.status()).toBe(200);

    const body = await resp.json() as SzenarioDTO;

    await test.step('agileKiSteps.works has exactly 19 elements', () => {
      expect(body.agileKiSteps.works.length).toBe(19);
    });

    await test.step('every agileKiSteps.works element matches the sent value', () => {
      for (let i = 0; i < 19; i++) {
        expect(body.agileKiSteps.works[i]).toBe(AGILE_KI_WORKS_19[i]);
      }
    });

    await test.step('agileKiSteps.waits has exactly 18 elements', () => {
      expect(body.agileKiSteps.waits.length).toBe(18);
    });

    await test.step('every agileKiSteps.waits element matches the sent value', () => {
      for (let i = 0; i < 18; i++) {
        expect(body.agileKiSteps.waits[i]).toBe(AGILE_KI_WAITS_18[i]);
      }
    });

    await test.step('agileKiSteps.works differs from humanSteps.works (would fail on a column swap)', () => {
      expect(body.agileKiSteps.works).not.toEqual(body.humanSteps.works);
    });

    await test.step('agileKiSteps.waits differs from humanSteps.waits (would fail on a column swap)', () => {
      expect(body.agileKiSteps.waits).not.toEqual(body.humanSteps.waits);
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

    // Deliberately do NOT reuse validPayload()'s agileKiSteps values here.
    // The row was created (above) with AGILE_KI_WORKS_19/AGILE_KI_WAITS_18;
    // resending those same constants in the PUT would make the round-trip
    // assertion pass even if update() silently dropped agileKiSteps from its
    // SET clause (GET would still echo back the value written at create()
    // time). Sending the _ALT variants and asserting GET reflects THEM
    // proves update() actually persists the column. humanSteps stays on its
    // own distinct constants throughout, so the column-swap guard elsewhere
    // in this suite is unaffected.
    const updatedName = `Updated-Szenario-${Date.now()}`;
    const putResp = await adminCtx.put(`/api/szenarien/${createdId}`, {
      data: {
        name: updatedName,
        humanSteps: { works: HUMAN_WORKS_19, waits: HUMAN_WAITS_18 },
        agileKiSteps: { works: AGILE_KI_WORKS_19_ALT, waits: AGILE_KI_WAITS_18_ALT },
        semiAutomatedSteps: { works: SEMI_WORKS_7, waits: SEMI_WAITS_6 },
        automatedSteps: { works: AUTO_WORKS_2, waits: AUTO_WAITS_1 },
      },
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

    await test.step('GET agileKiSteps.works reflects the NEW value sent in the PUT (proves update() writes the column)', () => {
      expect(getBody.agileKiSteps.works).toEqual(AGILE_KI_WORKS_19_ALT);
    });

    await test.step('GET agileKiSteps.waits reflects the NEW value sent in the PUT', () => {
      expect(getBody.agileKiSteps.waits).toEqual(AGILE_KI_WAITS_18_ALT);
    });

    await test.step('GET agileKiSteps.works differs from the value used at creation (not a stale echo)', () => {
      expect(getBody.agileKiSteps.works).not.toEqual(AGILE_KI_WORKS_19);
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
      humanSteps: { works: HUMAN_WORKS_19, waits: HUMAN_WAITS_18 },
      agileKiSteps: { works: AGILE_KI_WORKS_19, waits: AGILE_KI_WAITS_18 },
      semiAutomatedSteps: { works: SEMI_WORKS_7, waits: SEMI_WAITS_6 },
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

  // ── Wrong works length (18 instead of 19) ─────────────────────────────────

  test('POST with humanSteps.works length 18 (not 19) → 400 with fieldErrors key', async () => {
    const shortWorks = HUMAN_WORKS_19.slice(0, 18); // 18 elements

    const resp = await adminCtx.post('/api/szenarien', {
      data: {
        name: `Invalid-Works-${Date.now()}`,
        humanSteps: { works: shortWorks, waits: HUMAN_WAITS_18 },
        agileKiSteps: { works: AGILE_KI_WORKS_19, waits: AGILE_KI_WAITS_18 },
        semiAutomatedSteps: { works: SEMI_WORKS_7, waits: SEMI_WAITS_6 },
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

  // ── Wrong waits length (17 instead of 18) ─────────────────────────────────

  test('POST with humanSteps.waits length 17 (not 18) → 400 with fieldErrors key', async () => {
    const shortWaits = HUMAN_WAITS_18.slice(0, 17); // 17 elements

    const resp = await adminCtx.post('/api/szenarien', {
      data: {
        name: `Invalid-Waits-${Date.now()}`,
        humanSteps: { works: HUMAN_WORKS_19, waits: shortWaits },
        agileKiSteps: { works: AGILE_KI_WORKS_19, waits: AGILE_KI_WAITS_18 },
        semiAutomatedSteps: { works: SEMI_WORKS_7, waits: SEMI_WAITS_6 },
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
    const worksWithNegative: number[] = [...HUMAN_WORKS_19];
    worksWithNegative[5] = -1;

    const resp = await adminCtx.post('/api/szenarien', {
      data: {
        name: `Negative-Duration-${Date.now()}`,
        humanSteps: { works: worksWithNegative, waits: HUMAN_WAITS_18 },
        agileKiSteps: { works: AGILE_KI_WORKS_19, waits: AGILE_KI_WAITS_18 },
        semiAutomatedSteps: { works: SEMI_WORKS_7, waits: SEMI_WAITS_6 },
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
    const worksOverMax: number[] = [...HUMAN_WORKS_19];
    worksOverMax[5] = 479521;

    const resp = await adminCtx.post('/api/szenarien', {
      data: {
        name: `Over-Max-Duration-${Date.now()}`,
        humanSteps: { works: worksOverMax, waits: HUMAN_WAITS_18 },
        agileKiSteps: { works: AGILE_KI_WORKS_19, waits: AGILE_KI_WAITS_18 },
        semiAutomatedSteps: { works: SEMI_WORKS_7, waits: SEMI_WAITS_6 },
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
    const worksAtMax: number[] = [...HUMAN_WORKS_19];
    worksAtMax[1] = 479520;

    const name = `At-Max-Duration-${Date.now()}`;
    const resp = await adminCtx.post('/api/szenarien', {
      data: {
        name,
        humanSteps: { works: worksAtMax, waits: HUMAN_WAITS_18 },
        agileKiSteps: { works: AGILE_KI_WORKS_19, waits: AGILE_KI_WAITS_18 },
        semiAutomatedSteps: { works: SEMI_WORKS_7, waits: SEMI_WAITS_6 },
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

  test('POST with semiAutomatedSteps.works length 6 (not 7) → 400', async () => {
    const resp = await adminCtx.post('/api/szenarien', {
      data: {
        name: `Invalid-Semi-Works-${Date.now()}`,
        humanSteps: { works: HUMAN_WORKS_19, waits: HUMAN_WAITS_18 },
        agileKiSteps: { works: AGILE_KI_WORKS_19, waits: AGILE_KI_WAITS_18 },
        semiAutomatedSteps: { works: SEMI_WORKS_7.slice(0, 6), waits: SEMI_WAITS_6 },
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
        humanSteps: { works: HUMAN_WORKS_19, waits: HUMAN_WAITS_18 },
        agileKiSteps: { works: AGILE_KI_WORKS_19, waits: AGILE_KI_WAITS_18 },
        semiAutomatedSteps: { works: SEMI_WORKS_7, waits: SEMI_WAITS_6 },
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

// ---------------------------------------------------------------------------
// Suite: agileKiSteps validation (4th process, added by RECHNER-OVERHAUL)
// ---------------------------------------------------------------------------

test.describe('Validation for agileKiSteps step counts', () => {
  let adminCtx: APIRequestContext;

  test.beforeAll(async () => {
    adminCtx = await loginCtx('admin', 'admin123');
  });

  test.afterAll(async () => {
    await adminCtx.dispose();
  });

  // ── Wrong works length (18 instead of 19) ─────────────────────────────────

  test('POST with agileKiSteps.works length 18 (not 19) → 400 with fieldErrors key', async () => {
    const shortWorks = AGILE_KI_WORKS_19.slice(0, 18); // 18 elements

    const resp = await adminCtx.post('/api/szenarien', {
      data: {
        name: `Invalid-AgileKi-Works-${Date.now()}`,
        humanSteps: { works: HUMAN_WORKS_19, waits: HUMAN_WAITS_18 },
        agileKiSteps: { works: shortWorks, waits: AGILE_KI_WAITS_18 },
        semiAutomatedSteps: { works: SEMI_WORKS_7, waits: SEMI_WAITS_6 },
        automatedSteps: { works: AUTO_WORKS_2, waits: AUTO_WAITS_1 },
      },
    });

    await test.step('status 400', () => {
      expect(resp.status()).toBe(400);
    });

    const body = await resp.json() as ErrorBody;

    await test.step('fieldErrors contains an agileKiSteps.works key', () => {
      expect(typeof body.fieldErrors?.['agileKiSteps.works']).toBe('string');
    });
  });

  // ── Wrong waits length (17 instead of 18) ─────────────────────────────────

  test('POST with agileKiSteps.waits length 17 (not 18) → 400 with fieldErrors key', async () => {
    const shortWaits = AGILE_KI_WAITS_18.slice(0, 17); // 17 elements

    const resp = await adminCtx.post('/api/szenarien', {
      data: {
        name: `Invalid-AgileKi-Waits-${Date.now()}`,
        humanSteps: { works: HUMAN_WORKS_19, waits: HUMAN_WAITS_18 },
        agileKiSteps: { works: AGILE_KI_WORKS_19, waits: shortWaits },
        semiAutomatedSteps: { works: SEMI_WORKS_7, waits: SEMI_WAITS_6 },
        automatedSteps: { works: AUTO_WORKS_2, waits: AUTO_WAITS_1 },
      },
    });

    await test.step('status 400', () => {
      expect(resp.status()).toBe(400);
    });

    const body = await resp.json() as ErrorBody;

    await test.step('fieldErrors contains an agileKiSteps.waits key', () => {
      expect(typeof body.fieldErrors?.['agileKiSteps.waits']).toBe('string');
    });
  });
});

// ---------------------------------------------------------------------------
// Suite: Seed defaults — Standard-Szenario reflects the new 4-process totals
//
// This only verifies the fresh-DB seed path, which the Playwright global
// setup always exercises (a clean `crmdb.sqlite` per CI run). The
// pre-existing-DB upgrade path — an old 3-process DB gaining the
// `agileKiSteps` column via `ensureSzenarioAgileKiColumn()` — is not
// automatable in this harness (there is no fixture representing the old
// schema shape to swap in) and is instead a manual/scripted check, see
// PLAN-RECHNER-OVERHAUL.md §8.
// ---------------------------------------------------------------------------

test.describe('Seed defaults — Standard-Szenario reflects canonical totals', () => {
  let adminCtx: APIRequestContext;

  test.beforeAll(async () => {
    adminCtx = await loginCtx('admin', 'admin123');
  });

  test.afterAll(async () => {
    await adminCtx.dispose();
  });

  test('GET /api/szenarien/1 reflects the exact 4-process canonical arrays and totals', async () => {
    const resp = await adminCtx.get('/api/szenarien/1');
    expect(resp.status()).toBe(200);

    const body = await resp.json() as SzenarioDTO;

    await test.step('name is Standard-Szenario', () => {
      expect(body.name).toBe('Standard-Szenario');
    });

    // Exact-array assertions — the point of this test. Summing works+waits
    // alone would pass even if individual elements were shuffled or wrong as
    // long as the total matched; toEqual against the byte-identical seed
    // constants catches that.
    await test.step('humanSteps matches the exact seeded arrays', () => {
      expect(body.humanSteps).toEqual({ works: HUMAN_WORKS_19, waits: HUMAN_WAITS_18 });
    });

    await test.step('agileKiSteps matches the exact seeded arrays', () => {
      expect(body.agileKiSteps).toEqual({ works: SEED_AGILE_KI_WORKS, waits: SEED_AGILE_KI_WAITS });
    });

    await test.step('semiAutomatedSteps matches the exact seeded arrays', () => {
      expect(body.semiAutomatedSteps).toEqual({ works: SEMI_WORKS_7, waits: SEMI_WAITS_6 });
    });

    await test.step('automatedSteps matches the exact seeded arrays', () => {
      expect(body.automatedSteps).toEqual({ works: AUTO_WORKS_2, waits: AUTO_WAITS_1 });
    });

    // Aggregate sums, retained as an easy-to-read cross-check of the totals
    // called out in PLAN-RECHNER-OVERHAUL.md's Canonical section.
    await test.step('humanSteps works+waits sums to 3,880', () => {
      const total = sum(body.humanSteps.works) + sum(body.humanSteps.waits);
      expect(total).toBe(3880);
    });

    await test.step('agileKiSteps works+waits sums to 2,970', () => {
      const total = sum(body.agileKiSteps.works) + sum(body.agileKiSteps.waits);
      expect(total).toBe(2970);
    });

    await test.step('semiAutomatedSteps works+waits sums to 290', () => {
      const total = sum(body.semiAutomatedSteps.works) + sum(body.semiAutomatedSteps.waits);
      expect(total).toBe(290);
    });

    await test.step('automatedSteps works+waits sums to 25', () => {
      const total = sum(body.automatedSteps.works) + sum(body.automatedSteps.waits);
      expect(total).toBe(25);
    });

    await test.step('agileKiSteps.works has exactly 19 elements', () => {
      expect(body.agileKiSteps.works.length).toBe(19);
    });

    await test.step('agileKiSteps.waits has exactly 18 elements', () => {
      expect(body.agileKiSteps.waits.length).toBe(18);
    });
  });
});
