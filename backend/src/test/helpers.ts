/**
 * Shared test helpers for the CRM backend Playwright suite.
 *
 * NOTE on stub control:
 * The Nominatim stub server runs in the Playwright MAIN process (globalSetup).
 * Test files run in WORKER processes.  They cannot share in-memory state.
 * All stub control is done via an HTTP control API exposed by the stub server.
 * The control URL is written to process.env.STUB_CONTROL_URL by globalSetup.
 */
import type { APIRequestContext } from '@playwright/test';
import { sqlite } from '../config/db.js';
import { runDataMigration } from '../seed/dataMigration.js';
import type { StubBehavior } from './globalSetup.js';

// ---------------------------------------------------------------------------
// Stub control URL (set by globalSetup via process.env)
// ---------------------------------------------------------------------------

function getControlUrl(): string {
  const url = process.env['STUB_CONTROL_URL'];
  if (!url) throw new Error('STUB_CONTROL_URL not set — is globalSetup running?');
  return url;
}

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

// ---------------------------------------------------------------------------
// Stub control (HTTP-based to work across Playwright process boundaries)
// ---------------------------------------------------------------------------

/**
 * Set the next stub behavior.
 * If oneShot is true, the behavior is consumed after one request and resets
 * to the default success.  If false (default), it persists until changed.
 */
export async function setStubResponse(
  behavior: StubBehavior,
  oneShot = false
): Promise<void> {
  const resp = await fetch(`${getControlUrl()}/control`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ behavior, oneShot }),
  });
  if (!resp.ok) throw new Error(`setStubResponse failed: ${resp.status}`);
}

/**
 * Reset the stub to the default success behavior and clear the call count.
 */
export async function clearStubOverrides(): Promise<void> {
  const [r1, r2] = await Promise.all([
    fetch(`${getControlUrl()}/control`, { method: 'DELETE' }),
    fetch(`${getControlUrl()}/control/count`, { method: 'DELETE' }),
  ]);
  if (!r1.ok) throw new Error(`clearStubOverrides (behavior) failed: ${r1.status}`);
  if (!r2.ok) throw new Error(`clearStubOverrides (count) failed: ${r2.status}`);
}

/**
 * Get the current stub call count.
 */
export async function getStubCallCount(): Promise<number> {
  const resp = await fetch(`${getControlUrl()}/control/count`);
  if (!resp.ok) throw new Error(`getStubCallCount failed: ${resp.status}`);
  const body = await resp.json() as { count: number };
  return body.count;
}

/**
 * Reset the stub call count to 0.
 */
export async function resetStubCallCount(): Promise<void> {
  const resp = await fetch(`${getControlUrl()}/control/count`, { method: 'DELETE' });
  if (!resp.ok) throw new Error(`resetStubCallCount failed: ${resp.status}`);
}

// ---------------------------------------------------------------------------
// Database helpers
// ---------------------------------------------------------------------------

/**
 * Reset the database to fixture state.
 * Deletes all rows in reverse FK order, then re-runs runDataMigration().
 */
export function resetDatabase(): void {
  sqlite.pragma('foreign_keys = OFF');
  sqlite.exec(`
    DELETE FROM chance;
    DELETE FROM aktivitaet;
    DELETE FROM adresse;
    DELETE FROM person;
    DELETE FROM abteilung;
    DELETE FROM firma;
  `);
  sqlite.pragma('foreign_keys = ON');
  runDataMigration();
}

/**
 * Insert an adresse row with null coordinates.  Returns the new row id.
 */
export function insertAdresseWithoutCoords(overrides: {
  city?: string | null;
  postalCode?: string | null;
  street?: string | null;
  houseNumber?: string | null;
  country?: string | null;
} = {}): number {
  const now = new Date().toISOString();
  const result = sqlite
    .prepare(
      `INSERT INTO adresse (street, houseNumber, postalCode, city, country, latitude, longitude, createdAt, updatedAt)
       VALUES (?, ?, ?, ?, ?, NULL, NULL, ?, ?)`
    )
    .run(
      overrides.street ?? 'Teststraße',
      overrides.houseNumber ?? '1',
      overrides.postalCode !== undefined ? overrides.postalCode : '10115',
      overrides.city !== undefined ? overrides.city : 'Berlin',
      overrides.country ?? 'Deutschland',
      now,
      now
    );
  return Number(result.lastInsertRowid);
}
