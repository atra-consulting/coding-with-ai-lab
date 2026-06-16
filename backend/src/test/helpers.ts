/**
 * Shared test helpers for the CRM backend Playwright suite.
 */
import { request as playwrightRequest, type APIRequestContext } from '@playwright/test';
import { client } from '../config/db.js';
import { runDataMigration } from '../seed/dataMigration.js';
import { seedAgentTasks } from '../seed/agentTaskSeed.js';

// ---------------------------------------------------------------------------
// Authentication
// ---------------------------------------------------------------------------

/**
 * Log in as the given user.  The response cookie is stored in the context's
 * cookie jar automatically.  Returns the response for further inspection.
 * Prefer creating a fresh APIRequestContext per user in beforeAll and logging
 * in once, then reusing that context across tests.
 */
export async function login(
  request: APIRequestContext,
  benutzername: string,
  passwort: string
): Promise<void> {
  const resp = await request.post('/api/auth/login', {
    data: { benutzername, passwort },
  });
  if (!resp.ok()) {
    throw new Error(
      `Login failed for ${benutzername}: ${resp.status()} ${await resp.text()}`
    );
  }
}

/**
 * Create a fresh APIRequestContext, log in with the given credentials, and
 * return the context with the session cookie already stored in its cookie jar.
 * Throws with status + body text on login failure.
 * Callers are responsible for calling ctx.dispose() in afterAll.
 */
export async function loginCtx(
  benutzername: string,
  passwort: string
): Promise<APIRequestContext> {
  const ctx = await playwrightRequest.newContext({ baseURL: 'http://localhost:7070' });
  const resp = await ctx.post('/api/auth/login', { data: { benutzername, passwort } });
  if (!resp.ok()) {
    await ctx.dispose();
    throw new Error(
      `loginCtx failed for ${benutzername}: ${resp.status()} ${await resp.text()}`
    );
  }
  return ctx;
}

// ---------------------------------------------------------------------------
// Database helpers
// ---------------------------------------------------------------------------

/**
 * Reset the database to fixture state.
 * Deletes all rows in reverse FK order, then re-runs runDataMigration().
 *
 * PRAGMA foreign_keys is toggled via standalone execute calls (never inside a
 * batch — SQLite ignores the pragma inside a transaction).
 */
export async function resetDatabase(): Promise<void> {
  await client.execute('PRAGMA foreign_keys = OFF');
  await client.batch(
    [
      { sql: 'DELETE FROM chance', args: [] },
      { sql: 'DELETE FROM aktivitaet', args: [] },
      { sql: 'DELETE FROM adresse', args: [] },
      { sql: 'DELETE FROM person', args: [] },
      { sql: 'DELETE FROM abteilung', args: [] },
      { sql: 'DELETE FROM firma', args: [] },
      { sql: 'DELETE FROM sessions', args: [] },
      // agent_task has no FK dependents; must be cleared so re-seeding with
      // explicit ids 1-16 does not cause PRIMARY KEY conflicts.
      { sql: 'DELETE FROM agent_task', args: [] },
    ],
    'write'
  );
  await client.execute('PRAGMA foreign_keys = ON');
  await runDataMigration();
  await seedAgentTasks();
}

/**
 * Insert an adresse row with null coordinates.  Returns the new row id.
 */
export async function insertAdresseWithoutCoords(overrides: {
  city?: string | null;
  postalCode?: string | null;
  street?: string | null;
  houseNumber?: string | null;
  country?: string | null;
} = {}): Promise<number> {
  const now = new Date().toISOString();
  const result = await client.execute({
    sql: `INSERT INTO adresse (street, houseNumber, postalCode, city, country, latitude, longitude, createdAt, updatedAt)
       VALUES (?, ?, ?, ?, ?, NULL, NULL, ?, ?)`,
    args: [
      overrides.street ?? 'Teststraße',
      overrides.houseNumber ?? '1',
      overrides.postalCode !== undefined ? overrides.postalCode : '10115',
      overrides.city !== undefined ? overrides.city : 'Berlin',
      overrides.country ?? 'Deutschland',
      now,
      now,
    ],
  });
  const rowid = result.lastInsertRowid;
  if (rowid === undefined) throw new Error('insertAdresseWithoutCoords: lastInsertRowid is undefined');
  return Number(rowid);
}
