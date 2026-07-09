/**
 * Tests for the `notiz` field on Chance (nullable string, mirrors `beschreibung`).
 *
 * Covers:
 *   N-1  POST /api/chancen with notiz    — 201, response has notiz; GET /:id and
 *        GET /all both echo the same value back
 *   N-2  POST /api/chancen without notiz — 201, notiz is null (save works without it)
 *   N-3  PUT /api/chancen/:id            — updating only notiz leaves beschreibung
 *        unchanged, and (in a later step) updating only beschreibung leaves the
 *        already-updated notiz unchanged — the two fields are independent
 *   N-4  notiz containing newlines       — round-trips unchanged through
 *        POST -> GET
 *
 * Scope note: this file targets the notiz field only. Broader POST/PUT
 * /api/chancen authorization (401/403) and general field validation (missing
 * titel, invalid firmaId, etc.) are not covered by any existing spec file
 * either (only GET /api/chancen is covered, in chancen-phase-filter.spec.ts /
 * chancen-search.spec.ts) — documented here as a known gap rather than
 * expanded in this file, which is scoped to the notiz field.
 *
 * Chance requires a firmaId; a Firma is created once in beforeAll (mirrors
 * the POST /api/firmen pattern in firmen-crud.spec.ts) and reused as the FK
 * for every chance created below.
 */
import { test, expect, request as playwrightRequest } from '@playwright/test';
import type { APIRequestContext } from '@playwright/test';
import { resetDatabase, loginCtx } from './helpers.js';

const BASE_URL = 'http://localhost:7070';

interface ChanceDTO {
  id: number;
  titel: string;
  beschreibung: string | null;
  notiz: string | null;
  firmaId: number;
  [key: string]: unknown;
}

// ---------------------------------------------------------------------------
// Suite-level state
// ---------------------------------------------------------------------------

let adminCtx: APIRequestContext;
let anonCtx: APIRequestContext;

// Firma used as the required firmaId FK for every chance created in this file.
let firmaId: number;

test.beforeAll(async () => {
  await resetDatabase();
  adminCtx = await loginCtx('admin', 'admin123');
  anonCtx = await playwrightRequest.newContext({ baseURL: BASE_URL });

  const firmaResp = await adminCtx.post('/api/firmen', {
    data: { name: `Notiz-Test AG ${Date.now()}`, industry: 'IT' },
  });
  if (!firmaResp.ok()) {
    throw new Error(
      `Setup: could not create firma for chancen-notiz tests: ${firmaResp.status()} ${await firmaResp.text()}`,
    );
  }
  const firmaBody = (await firmaResp.json()) as { id: number };
  firmaId = firmaBody.id;
});

test.afterAll(async () => {
  await adminCtx.dispose();
  await anonCtx.dispose();
});

// ---------------------------------------------------------------------------
// N-1  POST with notiz — 201, present on create response, GET /:id, GET /all
// ---------------------------------------------------------------------------

test('N-1: POST /api/chancen with notiz returns 201 and notiz round-trips through GET /:id and GET /all', async () => {
  const notizValue = 'Wichtige Rückfrage vom Kunden zur Vertragslaufzeit';
  let createdId: number;

  await test.step('POST creates the chance and returns notiz in the response', async () => {
    const resp = await adminCtx.post('/api/chancen', {
      data: {
        titel: `Notiz-Chance ${Date.now()}`,
        firmaId,
        notiz: notizValue,
      },
    });

    expect(resp.status()).toBe(201);

    const body = (await resp.json()) as ChanceDTO;
    expect(body.notiz).toBe(notizValue);
    createdId = body.id;
  });

  await test.step('GET /api/chancen/:id returns the same notiz value', async () => {
    const resp = await adminCtx.get(`/api/chancen/${createdId}`);
    expect(resp.status()).toBe(200);

    const body = (await resp.json()) as ChanceDTO;
    expect(body.notiz).toBe(notizValue);
  });

  await test.step('GET /api/chancen/all includes the chance with its notiz', async () => {
    const resp = await adminCtx.get('/api/chancen/all');
    expect(resp.status()).toBe(200);

    const body = (await resp.json()) as ChanceDTO[];
    const found = body.find((c) => c.id === createdId);
    expect(found).toBeDefined();
    expect(found?.notiz).toBe(notizValue);
  });
});

// ---------------------------------------------------------------------------
// N-2  POST without notiz — 201, notiz is null
// ---------------------------------------------------------------------------

test('N-2: POST /api/chancen without notiz returns 201 with notiz null', async () => {
  const resp = await adminCtx.post('/api/chancen', {
    data: {
      titel: `Chance ohne Notiz ${Date.now()}`,
      firmaId,
    },
  });

  await test.step('status 201', () => {
    expect(resp.status()).toBe(201);
  });

  const body = (await resp.json()) as ChanceDTO;

  await test.step('notiz is null', () => {
    expect(body.notiz).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// N-3  PUT updating only notiz leaves beschreibung unchanged, and vice versa
// ---------------------------------------------------------------------------

test('N-3: PUT /api/chancen/:id updates notiz and beschreibung independently', async () => {
  const titel = `Notiz-Unabhaengigkeits-Chance ${Date.now()}`;
  const originalBeschreibung = 'Ursprüngliche Beschreibung';
  const originalNotiz = 'Ursprüngliche Notiz';
  const updatedNotiz = 'Aktualisierte Notiz';
  const updatedBeschreibung = 'Aktualisierte Beschreibung';
  let id: number;

  await test.step('create a baseline chance with both beschreibung and notiz set', async () => {
    const resp = await adminCtx.post('/api/chancen', {
      data: {
        titel,
        firmaId,
        beschreibung: originalBeschreibung,
        notiz: originalNotiz,
      },
    });
    expect(resp.status()).toBe(201);

    const body = (await resp.json()) as ChanceDTO;
    expect(body.beschreibung).toBe(originalBeschreibung);
    expect(body.notiz).toBe(originalNotiz);
    id = body.id;
  });

  await test.step('PUT changing only notiz leaves beschreibung untouched', async () => {
    const resp = await adminCtx.put(`/api/chancen/${id}`, {
      data: {
        titel,
        firmaId,
        beschreibung: originalBeschreibung,
        notiz: updatedNotiz,
      },
    });
    expect(resp.status()).toBe(200);

    const body = (await resp.json()) as ChanceDTO;
    expect(body.notiz).toBe(updatedNotiz);
    expect(body.beschreibung).toBe(originalBeschreibung);
  });

  await test.step('GET /:id confirms notiz update persisted while beschreibung stayed the same', async () => {
    const resp = await adminCtx.get(`/api/chancen/${id}`);
    expect(resp.status()).toBe(200);

    const body = (await resp.json()) as ChanceDTO;
    expect(body.notiz).toBe(updatedNotiz);
    expect(body.beschreibung).toBe(originalBeschreibung);
  });

  await test.step('PUT changing only beschreibung leaves the already-updated notiz untouched', async () => {
    const resp = await adminCtx.put(`/api/chancen/${id}`, {
      data: {
        titel,
        firmaId,
        beschreibung: updatedBeschreibung,
        notiz: updatedNotiz,
      },
    });
    expect(resp.status()).toBe(200);

    const body = (await resp.json()) as ChanceDTO;
    expect(body.beschreibung).toBe(updatedBeschreibung);
    expect(body.notiz).toBe(updatedNotiz);
  });

  await test.step('GET /:id confirms beschreibung update persisted while notiz stayed the same', async () => {
    const resp = await adminCtx.get(`/api/chancen/${id}`);
    expect(resp.status()).toBe(200);

    const body = (await resp.json()) as ChanceDTO;
    expect(body.beschreibung).toBe(updatedBeschreibung);
    expect(body.notiz).toBe(updatedNotiz);
  });
});

// ---------------------------------------------------------------------------
// N-4  notiz with embedded newlines round-trips unchanged
// ---------------------------------------------------------------------------

test('N-4: notiz containing newlines round-trips unchanged through POST and GET', async () => {
  const notizValue = 'Zeile1\nZeile2\nZeile3';
  let createdId: number;

  await test.step('POST stores the multi-line notiz verbatim', async () => {
    const resp = await adminCtx.post('/api/chancen', {
      data: {
        titel: `Mehrzeilige-Notiz-Chance ${Date.now()}`,
        firmaId,
        notiz: notizValue,
      },
    });
    expect(resp.status()).toBe(201);

    const body = (await resp.json()) as ChanceDTO;
    expect(body.notiz).toBe(notizValue);
    createdId = body.id;
  });

  await test.step('GET /:id returns the exact same multi-line string', async () => {
    const resp = await adminCtx.get(`/api/chancen/${createdId}`);
    expect(resp.status()).toBe(200);

    const body = (await resp.json()) as ChanceDTO;
    expect(body.notiz).toBe(notizValue);
    expect(body.notiz?.split('\n').length).toBe(3);
  });
});
