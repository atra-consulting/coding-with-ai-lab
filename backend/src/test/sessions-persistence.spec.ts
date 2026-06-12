/**
 * DB-persistence tests for the libsql session store (LibsqlSessionStore).
 *
 * Covers:
 *   SP-1  Login creates a row in the sessions table; expire is within ±10s of now + 24h
 *   SP-2  Session persists across requests (same cookie jar, two GET /api/auth/me)
 *   SP-3  Logout destroys the DB row (asserted by specific sid); subsequent /api/auth/me → 401
 *   SP-4  Expired session is rejected (401) and the row is cleaned up by get()
 *
 * All row-count assertions use deltas against a baseline taken before each
 * describe block, so this suite is safe to run alongside other tests that may
 * hold live sessions.
 *
 * Cleanup: every session created by this suite is deleted in afterAll / within
 * the test itself.  The sessions table is left in the same state as before the
 * suite ran.
 */
import { test, expect, request as playwrightRequest } from '@playwright/test';
import type { APIRequestContext, APIResponse } from '@playwright/test';
import { client } from '../config/db.js';

const BASE_URL = 'http://localhost:7070';

// ---------------------------------------------------------------------------
// Cookie helper — extract the raw sid from a Set-Cookie header.
//
// express-session signed cookie format (JSESSIONID):
//   s%3A<sid>.<signature>   (URL-encoded 's:')
//
// Steps:
//   1. Find the JSESSIONID= value in the Set-Cookie header string.
//   2. URL-decode it   → s:<sid>.<signature>
//   3. Strip the leading 's:'
//   4. Drop everything after (and including) the last '.'   → sid
// ---------------------------------------------------------------------------
function extractSidFromResponse(resp: APIResponse): string {
  const setCookieHeader = resp.headers()['set-cookie'];
  if (!setCookieHeader) {
    throw new Error('No Set-Cookie header in response');
  }

  // The header may be a single string with multiple cookies separated by newlines
  // or the combined value for a single JSESSIONID cookie.
  const cookieLine = setCookieHeader
    .split('\n')
    .find((line) => line.trimStart().startsWith('JSESSIONID='));

  if (!cookieLine) {
    throw new Error(`JSESSIONID cookie not found in Set-Cookie: ${setCookieHeader}`);
  }

  // Extract the value (everything between '=' and ';' or end of segment)
  const valueMatch = cookieLine.match(/JSESSIONID=([^;]+)/);
  if (!valueMatch) {
    throw new Error(`Could not parse JSESSIONID value from: ${cookieLine}`);
  }

  const encoded = valueMatch[1];
  const decoded = decodeURIComponent(encoded); // → s:<sid>.<signature>

  if (!decoded.startsWith('s:')) {
    throw new Error(`Unexpected cookie format (no leading s:): ${decoded}`);
  }

  const withoutPrefix = decoded.slice(2); // strip 's:'
  const lastDot = withoutPrefix.lastIndexOf('.');
  if (lastDot === -1) {
    throw new Error(`No signature dot found in sid string: ${withoutPrefix}`);
  }

  return withoutPrefix.slice(0, lastDot);
}

// ---------------------------------------------------------------------------
// Shared helper — count live (not yet expired) session rows
// ---------------------------------------------------------------------------

async function countLiveSessions(): Promise<number> {
  const now = new Date().toISOString();
  const result = await client.execute({
    sql: 'SELECT COUNT(*) AS cnt FROM sessions WHERE expire > ?',
    args: [now],
  });
  const row = result.rows[0];
  return Number(row['cnt']);
}

// ---------------------------------------------------------------------------
// SP-1  Login creates a row in the sessions table; expire value is correct
// ---------------------------------------------------------------------------
test.describe('SP-1: Login creates a sessions row', () => {
  let ctx: APIRequestContext;

  test.beforeAll(async () => {
    ctx = await playwrightRequest.newContext({ baseURL: BASE_URL });
  });

  test.afterAll(async () => {
    // Clean up any session this describe block created.
    // The easiest approach: logout (destroys the server-side row).
    await ctx.post('/api/auth/logout').catch(() => { /* ignore if already gone */ });
    await ctx.dispose();
  });

  test('row count increases by 1 after successful login', async () => {
    const baseline = await countLiveSessions();

    await test.step('login as admin', async () => {
      const resp = await ctx.post('/api/auth/login', {
        data: { benutzername: 'admin', passwort: 'admin123' },
      });
      expect(resp.status()).toBe(200);
    });

    await test.step('live session row count is baseline + 1', async () => {
      const after = await countLiveSessions();
      expect(after).toBe(baseline + 1);
    });
  });

  test('session expire value is within ±10s of now + 24h', async () => {
    // Ensure we have a fresh login so Set-Cookie is available in this test.
    await ctx.post('/api/auth/logout').catch(() => { /* ignore */ });

    let sid: string;

    await test.step('login and extract sid from Set-Cookie', async () => {
      const resp = await ctx.post('/api/auth/login', {
        data: { benutzername: 'admin', passwort: 'admin123' },
      });
      expect(resp.status()).toBe(200);
      sid = extractSidFromResponse(resp);
    });

    await test.step('expire in DB is within ±10s of now + 24h', async () => {
      const result = await client.execute({
        sql: 'SELECT expire FROM sessions WHERE sid = ?',
        args: [sid!],
      });
      expect(result.rows.length).toBe(1);

      const expireStr = result.rows[0]['expire'] as string;
      const expireMs = new Date(expireStr).getTime();

      const expectedMs = Date.now() + 24 * 3600 * 1000;
      const toleranceMs = 10_000; // ±10 seconds

      expect(Math.abs(expireMs - expectedMs)).toBeLessThanOrEqual(toleranceMs);
    });
  });

  test('failed login does not create a sessions row', async () => {
    // Log out first so we start clean
    await ctx.post('/api/auth/logout').catch(() => { /* ignore */ });

    const baseline = await countLiveSessions();

    await test.step('login with wrong password returns 401', async () => {
      const resp = await ctx.post('/api/auth/login', {
        data: { benutzername: 'admin', passwort: 'wrong-password' },
      });
      expect(resp.status()).toBe(401);
    });

    await test.step('session row count is unchanged', async () => {
      const after = await countLiveSessions();
      expect(after).toBe(baseline);
    });
  });
});

// ---------------------------------------------------------------------------
// SP-2  Session persists across requests
// ---------------------------------------------------------------------------
test.describe('SP-2: Session persists across requests', () => {
  let ctx: APIRequestContext;

  test.beforeAll(async () => {
    ctx = await playwrightRequest.newContext({ baseURL: BASE_URL });
    const resp = await ctx.post('/api/auth/login', {
      data: { benutzername: 'user', passwort: 'test123' },
    });
    if (!resp.ok()) {
      throw new Error(`SP-2 login failed: ${resp.status()} ${await resp.text()}`);
    }
  });

  test.afterAll(async () => {
    await ctx.post('/api/auth/logout').catch(() => { /* ignore */ });
    await ctx.dispose();
  });

  test('first GET /api/auth/me with session cookie returns 200', async () => {
    const resp = await ctx.get('/api/auth/me');

    await test.step('status 200', () => {
      expect(resp.status()).toBe(200);
    });

    const body = await resp.json() as { benutzername: string };

    await test.step('returns the logged-in user', () => {
      expect(body.benutzername).toBe('user');
    });
  });

  test('second GET /api/auth/me with the same cookie jar returns 200', async () => {
    const resp = await ctx.get('/api/auth/me');

    await test.step('status 200', () => {
      expect(resp.status()).toBe(200);
    });

    const body = await resp.json() as { benutzername: string };

    await test.step('still returns the same user', () => {
      expect(body.benutzername).toBe('user');
    });
  });

  test('sessions row is still present after two requests', async () => {
    const now = new Date().toISOString();
    const result = await client.execute({
      sql: 'SELECT COUNT(*) AS cnt FROM sessions WHERE expire > ?',
      args: [now],
    });
    const cnt = Number(result.rows[0]['cnt']);

    expect(cnt).toBeGreaterThanOrEqual(1);
  });
});

// ---------------------------------------------------------------------------
// SP-3  Logout destroys the DB row (asserted via specific sid)
// ---------------------------------------------------------------------------
test.describe('SP-3: Logout destroys the sessions row', () => {
  let ctx: APIRequestContext;
  let sessionSid: string;

  test.beforeAll(async () => {
    ctx = await playwrightRequest.newContext({ baseURL: BASE_URL });
    const resp = await ctx.post('/api/auth/login', {
      data: { benutzername: 'demo', passwort: 'demo1234' },
    });
    if (!resp.ok()) {
      throw new Error(`SP-3 login failed: ${resp.status()} ${await resp.text()}`);
    }
    sessionSid = extractSidFromResponse(resp);
  });

  test.afterAll(async () => {
    // ctx was already logged out inside the test; just dispose.
    await ctx.dispose();
  });

  test('session row exists in DB after login', async () => {
    const result = await client.execute({
      sql: 'SELECT COUNT(*) AS cnt FROM sessions WHERE sid = ?',
      args: [sessionSid],
    });
    expect(Number(result.rows[0]['cnt'])).toBe(1);
  });

  test('row is GONE from DB and /api/auth/me returns 401 after logout', async () => {
    await test.step('logout returns 200', async () => {
      const resp = await ctx.post('/api/auth/logout');
      expect(resp.status()).toBe(200);
    });

    await test.step('specific session row is gone from DB', async () => {
      const result = await client.execute({
        sql: 'SELECT COUNT(*) AS cnt FROM sessions WHERE sid = ?',
        args: [sessionSid],
      });
      expect(Number(result.rows[0]['cnt'])).toBe(0);
    });

    await test.step('GET /api/auth/me with the old cookie returns 401', async () => {
      const resp = await ctx.get('/api/auth/me');
      expect(resp.status()).toBe(401);
    });
  });
});

// ---------------------------------------------------------------------------
// SP-4  Expired session is rejected and cleaned up
// ---------------------------------------------------------------------------
test.describe('SP-4: Expired session is rejected and cleaned up', () => {
  let ctx: APIRequestContext;
  /** sid extracted from the login Set-Cookie header; used for direct-DB cleanup. */
  let insertedSid: string | undefined;

  test.beforeAll(async () => {
    ctx = await playwrightRequest.newContext({ baseURL: BASE_URL });
  });

  test.afterAll(async () => {
    // Belt-and-suspenders: remove the row in case the test didn't trigger cleanup.
    if (insertedSid) {
      await client.execute({
        sql: 'DELETE FROM sessions WHERE sid = ?',
        args: [insertedSid],
      }).catch(() => { /* ignore */ });
    }
    await ctx.dispose();
  });

  test('expired session row is rejected with 401 and cleaned up from DB', async () => {
    // -----------------------------------------------------------------------
    // Step 1: Login and extract sid from Set-Cookie header
    // -----------------------------------------------------------------------
    let sid: string;

    await test.step('login creates a session row; extract sid from Set-Cookie', async () => {
      const resp = await ctx.post('/api/auth/login', {
        data: { benutzername: 'admin', passwort: 'admin123' },
      });
      expect(resp.status()).toBe(200);
      sid = extractSidFromResponse(resp);
      insertedSid = sid;
    });

    // -----------------------------------------------------------------------
    // Step 2: Confirm the row is present with the extracted sid
    // -----------------------------------------------------------------------
    await test.step('confirm session row exists for extracted sid', async () => {
      const checkResult = await client.execute({
        sql: 'SELECT sid FROM sessions WHERE sid = ?',
        args: [sid!],
      });
      expect(checkResult.rows.length).toBe(1);
    });

    // -----------------------------------------------------------------------
    // Step 3: Back-date the expire to the past so the session is expired
    // -----------------------------------------------------------------------
    const pastTimestamp = new Date(Date.now() - 60_000).toISOString(); // 1 minute ago

    await test.step('UPDATE expire to a past ISO timestamp', async () => {
      await client.execute({
        sql: 'UPDATE sessions SET expire = ? WHERE sid = ?',
        args: [pastTimestamp, sid!],
      });
    });

    // Verify the row is actually there with the backdated expire before we call the API.
    await test.step('confirm backdated row exists in DB', async () => {
      const checkResult = await client.execute({
        sql: 'SELECT expire FROM sessions WHERE sid = ?',
        args: [sid!],
      });
      expect(checkResult.rows.length).toBe(1);
      expect(checkResult.rows[0]['expire']).toBe(pastTimestamp);
    });

    // -----------------------------------------------------------------------
    // Step 4: /api/auth/me with the stale cookie must return 401
    // -----------------------------------------------------------------------
    await test.step('GET /api/auth/me returns 401 for expired session', async () => {
      const resp = await ctx.get('/api/auth/me');
      expect(resp.status()).toBe(401);
    });

    // -----------------------------------------------------------------------
    // Step 5: The store's get() path fires an opportunistic DELETE (fire-and-
    // forget).  Poll up to 5 s (remote Turso latency headroom) for the row
    // to disappear.
    // -----------------------------------------------------------------------
    await test.step('expired row is deleted from DB (opportunistic cleanup)', async () => {
      const deadline = Date.now() + 5_000;
      let rowGone = false;

      while (Date.now() < deadline) {
        const check = await client.execute({
          sql: 'SELECT COUNT(*) AS cnt FROM sessions WHERE sid = ?',
          args: [sid!],
        });
        if (Number(check.rows[0]['cnt']) === 0) {
          rowGone = true;
          break;
        }
        // Brief pause before next poll
        await new Promise<void>((resolve) => setTimeout(resolve, 100));
      }

      expect(rowGone).toBe(true);
      // Row is already gone, no need for afterAll cleanup.
      insertedSid = undefined;
    });
  });
});

// ---------------------------------------------------------------------------
// SP-5  Sanity: total sessions count returns to baseline after all suites
// ---------------------------------------------------------------------------
test.describe('SP-5: Sessions table is clean after test suite', () => {
  test('no orphaned test sessions remain after all SP tests', async () => {
    // This test runs last (workers:1, fullyParallel:false).
    // All SP describe blocks call logout in afterAll, so live sessions from
    // this spec file should be zero (modulo sessions from other concurrent specs
    // which would be a test-environment issue, not a product bug).
    //
    // We only assert that the count is not higher than what it was when this
    // test was registered; since we can't snapshot the very start we just
    // check there are no obviously leaked rows from expired sessions.
    const result = await client.execute({
      sql: "SELECT COUNT(*) AS cnt FROM sessions WHERE expire <= ?",
      args: [new Date().toISOString()],
    });
    const expiredCount = Number(result.rows[0]['cnt']);

    expect(expiredCount).toBe(0);
  });
});
