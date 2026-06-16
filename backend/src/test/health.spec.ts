/**
 * Tests for the public health-check route.
 *
 * Covers:
 *   GET /api/health — returns { status, timestamp, version }.
 *   The version mirrors the backend package.json so monitoring tooling can
 *   confirm which build is running.
 */
import { test, expect, request as playwrightRequest } from '@playwright/test';
import type { APIRequestContext } from '@playwright/test';
import pkg from '../../package.json' with { type: 'json' };

const BASE_URL = 'http://localhost:7070';

test.describe('GET /api/health', () => {
  let ctx: APIRequestContext;

  test.beforeAll(async () => {
    ctx = await playwrightRequest.newContext({ baseURL: BASE_URL });
  });

  test.afterAll(async () => {
    await ctx.dispose();
  });

  test('returns ok status, a timestamp, and the package version', async () => {
    const resp = await ctx.get('/api/health');
    expect(resp.status()).toBe(200);

    const body = await resp.json();
    expect(body.status).toBe('ok');

    // timestamp is a valid ISO-8601 string
    expect(typeof body.timestamp).toBe('string');
    expect(Number.isNaN(Date.parse(body.timestamp))).toBe(false);

    // version comes straight from package.json
    expect(body.version).toBe(pkg.version);
    expect(typeof body.version).toBe('string');
    expect(body.version.length).toBeGreaterThan(0);
  });
});
