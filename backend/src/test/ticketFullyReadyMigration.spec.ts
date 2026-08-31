/**
 * Playwright tests for the idempotent ticket.fullyReady migration function.
 *
 * Verifies `ensureTicketFullyReadyColumn()` (backend/src/config/migrate.ts):
 *   1. Calling it twice in a row never throws; the column is present after
 *      each call. Unlike `ensureTicketAgentTaskIdColumn()`, this function has
 *      no index to create, so the "column already exists" path is a plain
 *      early return — there is nothing further to assert on that path beyond
 *      the column's continued presence.
 *   2. On a database that predates this column (simulated here via
 *      `ALTER TABLE ticket DROP COLUMN fullyReady`), the function re-adds the
 *      column without error, and every existing ticket row reads the column
 *      default (0) back.
 *
 * Side-effect caveat (PORT-FEEDBACK-TICKETS-APIS)
 * -------------------------------------------------
 * Dropping and re-adding `fullyReady` resets that column's value to its
 * default (0) for EVERY existing ticket row, not just the schema — SQLite's
 * `ADD COLUMN ... DEFAULT` backfills every existing row with the default, it
 * does not only apply going forward. This is harmless here because:
 *   - the suite runs with `workers: 1` (playwright.config.ts), so all spec
 *     files run serially and this file's position in that order is
 *     deterministic;
 *   - `tickets.spec.ts` fully resets the ticket table in its own `beforeAll`
 *     via `POST /api/tickets/reset` before any of its own assertions run, so
 *     a value reset here is never observed by that suite.
 * A future spec author should not assume `ticket.fullyReady` values survive
 * a run of this file — they do not.
 *
 * Concurrency caveat
 * -------------------
 * These tests cover sequential re-runs only. Safety for two application
 * instances cold-starting at the same moment against the same database rests
 * structurally on the `duplicate column` catch inside the ensure function —
 * it is not exercised by a literal concurrency test here. A green suite here
 * is not proof of tested concurrency.
 *
 * Test isolation notes
 * ---------------------
 * - `test.describe.serial` guarantees internal ordering within this file:
 *   Case 2 depends on Case 1 having already left the column present.
 * - `afterAll` calls the ensure-function once more so later spec files
 *   (`workers: 1` keeps the whole suite serial) see a clean, consistent
 *   schema regardless of which case ran last.
 */
import { test, expect } from '@playwright/test';
import { client } from '../config/db.js';
import { ensureTicketFullyReadyColumn } from '../config/migrate.js';

async function hasColumn(table: string, column: string): Promise<boolean> {
  const info = await client.execute(`PRAGMA table_info(${table})`);
  return info.rows.some((row) => row['name'] === column);
}

async function fullyReadyValues(): Promise<number[]> {
  const result = await client.execute('SELECT fullyReady FROM ticket');
  return result.rows.map((row) => Number(row['fullyReady']));
}

test.describe.serial('ensureTicketFullyReadyColumn — idempotent migration', () => {
  test('Case 1: calling it twice in a row is safe, column present after each call', async () => {
    await test.step('first call: no throw, column present', async () => {
      await ensureTicketFullyReadyColumn();
      expect(await hasColumn('ticket', 'fullyReady')).toBe(true);
    });

    await test.step('second call: no throw, column still present', async () => {
      await ensureTicketFullyReadyColumn();
      expect(await hasColumn('ticket', 'fullyReady')).toBe(true);
    });
  });

  test('Case 2: pre-existing DB without the column — re-added, existing rows read back the default (0)', async () => {
    await test.step('simulate a pre-existing DB: drop the column', async () => {
      await client.execute('ALTER TABLE ticket DROP COLUMN fullyReady');
      expect(await hasColumn('ticket', 'fullyReady')).toBe(false);
    });

    await test.step('ensure-function re-adds the column without throwing', async () => {
      await ensureTicketFullyReadyColumn();
      expect(await hasColumn('ticket', 'fullyReady')).toBe(true);
    });

    await test.step('every existing ticket row reads back the column default (0)', async () => {
      const values = await fullyReadyValues();
      expect(values.length).toBeGreaterThan(0);
      for (const value of values) {
        expect(value).toBe(0);
      }
    });
  });

  test.afterAll(async () => {
    // Leave the schema in a clean, consistent state for whatever spec file
    // runs next, regardless of which case above ran last.
    await ensureTicketFullyReadyColumn();
  });
});
