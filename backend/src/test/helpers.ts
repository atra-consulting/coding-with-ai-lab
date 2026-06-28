/**
 * Shared test helpers for the CRM backend Playwright suite.
 */
import { request as playwrightRequest, type APIRequestContext } from '@playwright/test';
import { client } from '../config/db.js';
import { runDataMigration } from '../seed/dataMigration.js';
import { seedAgentTasks } from '../seed/agentTaskSeed.js';
import { seedSzenario } from '../seed/szenarioSeed.js';

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
      // szenario: no FK dependents; cleared so seedSzenario() can re-insert id=1.
      { sql: 'DELETE FROM szenario', args: [] },
    ],
    'write'
  );
  await client.execute('PRAGMA foreign_keys = ON');
  await runDataMigration();
  await seedAgentTasks();
  // Restore the Standard-Szenario (id=1) so any suite relying on it finds it.
  await seedSzenario();
}
