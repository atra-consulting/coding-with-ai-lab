/**
 * Tests for the public health check endpoint.
 *
 * Covers:
 *   GET /api/health — 200 with status, timestamp, and version fields
 *
 * No authentication is required — the endpoint is public.
 */
import { test, expect, request as playwrightRequest } from '@playwright/test';
import type { APIRequestContext } from '@playwright/test';

const BASE_URL = 'http://localhost:7070';

test.describe('GET /api/health', () => {
  let ctx: APIRequestContext;

  test.beforeAll(async () => {
    ctx = await playwrightRequest.newContext({ baseURL: BASE_URL });
  });

  test.afterAll(async () => {
    await ctx.dispose();
  });

  test('returns 200', async () => {
    const resp = await ctx.get('/api/health');
    expect(resp.status()).toBe(200);
  });

  test('response body has status: "ok"', async () => {
    const resp = await ctx.get('/api/health');
    const body = await resp.json() as { status: string; timestamp: string; version: string };
    expect(body.status).toBe('ok');
  });

  test('response body has a timestamp field that is a string', async () => {
    const resp = await ctx.get('/api/health');
    const body = await resp.json() as { status: string; timestamp: string; version: string };
    expect(typeof body.timestamp).toBe('string');
  });

  test('response body has version: "1.0.0"', async () => {
    const resp = await ctx.get('/api/health');
    const body = await resp.json() as { status: string; timestamp: string; version: string };
    expect(body.version).toBe('1.0.0');
  });
});
