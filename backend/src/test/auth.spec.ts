/**
 * Smoke tests for the Auth routes.
 *
 * Covers:
 *   5.1 POST /api/auth/login  — success path (admin)
 *   5.2 POST /api/auth/login  — bad password → 401, no JSESSIONID cookie
 *   5.3 GET  /api/auth/me     — no session → 401
 *   5.4 GET  /api/auth/me     — with session → 200, full user shape
 *   5.5 POST /api/auth/logout → subsequent GET /api/auth/me → 401
 */
import { test, expect, request as playwrightRequest } from '@playwright/test';
import type { APIRequestContext } from '@playwright/test';

const BASE_URL = 'http://localhost:7070';

// ---------------------------------------------------------------------------
// 5.1  Successful login
// ---------------------------------------------------------------------------
test.describe('POST /api/auth/login — success', () => {
  let ctx: APIRequestContext;

  test.beforeAll(async () => {
    ctx = await playwrightRequest.newContext({ baseURL: BASE_URL });
  });

  test.afterAll(async () => {
    await ctx.dispose();
  });

  test('returns 200 with user body and JSESSIONID cookie', async () => {
    const resp = await ctx.post('/api/auth/login', {
      data: { benutzername: 'admin', passwort: 'admin123' },
    });

    await test.step('status 200', () => {
      expect(resp.status()).toBe(200);
    });

    const body = await resp.json() as {
      benutzername: string;
      vorname: string;
      nachname: string;
      rollen: string[];
    };

    await test.step('body has benutzername matching the login', () => {
      expect(body.benutzername).toBe('admin');
    });

    await test.step('body has vorname', () => {
      expect(typeof body.vorname).toBe('string');
    });

    await test.step('body has nachname', () => {
      expect(typeof body.nachname).toBe('string');
    });

    await test.step('rollen is a non-empty array', () => {
      expect(Array.isArray(body.rollen)).toBe(true);
      expect(body.rollen.length).toBeGreaterThan(0);
    });

    await test.step('rollen contains ROLE_ADMIN', () => {
      expect(body.rollen).toContain('ROLE_ADMIN');
    });

    await test.step('set-cookie header contains JSESSIONID=', () => {
      const setCookie = resp.headers()['set-cookie'] ?? '';
      expect(setCookie).toContain('JSESSIONID=');
    });
  });
});

// ---------------------------------------------------------------------------
// 5.2  Bad password
// ---------------------------------------------------------------------------
test.describe('POST /api/auth/login — bad password', () => {
  let ctx: APIRequestContext;

  test.beforeAll(async () => {
    ctx = await playwrightRequest.newContext({ baseURL: BASE_URL });
  });

  test.afterAll(async () => {
    await ctx.dispose();
  });

  test('returns 401 and does not set JSESSIONID cookie', async () => {
    const resp = await ctx.post('/api/auth/login', {
      data: { benutzername: 'admin', passwort: 'wrong-password' },
    });

    await test.step('status 401', () => {
      expect(resp.status()).toBe(401);
    });

    await test.step('no JSESSIONID in set-cookie', () => {
      const setCookie = resp.headers()['set-cookie'] ?? '';
      expect(setCookie).not.toContain('JSESSIONID=');
    });
  });
});

// ---------------------------------------------------------------------------
// 5.3  GET /api/auth/me without session
// ---------------------------------------------------------------------------
test.describe('GET /api/auth/me — unauthenticated', () => {
  let anonCtx: APIRequestContext;

  test.beforeAll(async () => {
    anonCtx = await playwrightRequest.newContext({ baseURL: BASE_URL });
  });

  test.afterAll(async () => {
    await anonCtx.dispose();
  });

  test('returns 401', async () => {
    const resp = await anonCtx.get('/api/auth/me');
    expect(resp.status()).toBe(401);
  });
});

// ---------------------------------------------------------------------------
// 5.4  GET /api/auth/me with valid session
// ---------------------------------------------------------------------------
test.describe('GET /api/auth/me — authenticated', () => {
  let ctx: APIRequestContext;

  test.beforeAll(async () => {
    ctx = await playwrightRequest.newContext({ baseURL: BASE_URL });
    const loginResp = await ctx.post('/api/auth/login', {
      data: { benutzername: 'admin', passwort: 'admin123' },
    });
    if (!loginResp.ok()) {
      throw new Error(
        `Login failed: ${loginResp.status()} ${await loginResp.text()}`
      );
    }
  });

  test.afterAll(async () => {
    await ctx.dispose();
  });

  test('returns 200 with full user shape including non-empty permissions', async () => {
    const resp = await ctx.get('/api/auth/me');

    await test.step('status 200', () => {
      expect(resp.status()).toBe(200);
    });

    const body = await resp.json() as {
      id: unknown;
      benutzername: unknown;
      vorname: unknown;
      nachname: unknown;
      email: unknown;
      rollen: unknown;
      permissions: unknown[];
    };

    await test.step('body has id', () => {
      expect(body.id).toBeDefined();
    });

    await test.step('body has benutzername', () => {
      expect(typeof body.benutzername).toBe('string');
    });

    await test.step('body has vorname', () => {
      expect(typeof body.vorname).toBe('string');
    });

    await test.step('body has nachname', () => {
      expect(typeof body.nachname).toBe('string');
    });

    await test.step('body has email', () => {
      expect(typeof body.email).toBe('string');
    });

    await test.step('body has rollen', () => {
      expect(Array.isArray(body.rollen)).toBe(true);
    });

    await test.step('body has permissions as non-empty array', () => {
      expect(Array.isArray(body.permissions)).toBe(true);
      expect(body.permissions.length).toBeGreaterThan(0);
    });
  });
});

// ---------------------------------------------------------------------------
// 5.5  Logout invalidates session
// ---------------------------------------------------------------------------
test.describe('POST /api/auth/logout — session invalidation', () => {
  let ctx: APIRequestContext;

  test.beforeAll(async () => {
    ctx = await playwrightRequest.newContext({ baseURL: BASE_URL });
    const loginResp = await ctx.post('/api/auth/login', {
      data: { benutzername: 'admin', passwort: 'admin123' },
    });
    if (!loginResp.ok()) {
      throw new Error(
        `Login failed: ${loginResp.status()} ${await loginResp.text()}`
      );
    }
  });

  test.afterAll(async () => {
    await ctx.dispose();
  });

  test('GET /api/auth/me returns 401 after logout', async () => {
    const logoutResp = await ctx.post('/api/auth/logout');

    await test.step('logout returns 200', () => {
      expect(logoutResp.status()).toBe(200);
    });

    const meResp = await ctx.get('/api/auth/me');

    await test.step('me returns 401 on the same context after logout', () => {
      expect(meResp.status()).toBe(401);
    });
  });
});
