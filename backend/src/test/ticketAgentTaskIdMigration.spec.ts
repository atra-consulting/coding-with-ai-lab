/**
 * Playwright tests for the idempotent ticket.agentTaskId migration function.
 *
 * Verifies `ensureTicketAgentTaskIdColumn()` (backend/src/config/migrate.ts):
 *   1. Calling it twice in a row is safe, and — this is the case this whole
 *      file exists to guard — BOTH the column AND `idx_ticket_agentTaskId`
 *      are present after EACH call, even on the "column already exists"
 *      branch. That branch is not a rare edge case: because `agentTaskId` is
 *      also part of the fresh `CREATE TABLE`, "column already exists" is the
 *      path taken on every fresh database and every restart after the first
 *      migration. An earlier buggy draft of this function early-returned on
 *      that branch and silently skipped index creation — this test's Case 1
 *      is built specifically to fail against that draft (see the setup step
 *      inside Case 1 below for how it forces the branch to matter).
 *   2. On a database that predates both the column and its index (simulated
 *      here by dropping the index, then the column — SQLite refuses to drop
 *      an indexed column, so the order matters), the function restores both,
 *      in that order, without error.
 *
 * Side-effect caveat (PORT-FEEDBACK-TICKETS-APIS)
 * -------------------------------------------------
 * Dropping and re-adding `agentTaskId` resets that column's value to its
 * default (NULL — the FK column carries no DEFAULT; SQLite rejects ADD
 * COLUMN with both a REFERENCES clause and a non-NULL default) for EVERY
 * existing ticket row, not just the schema. Harmless here because:
 *   - the suite runs with `workers: 1` (playwright.config.ts), so all spec
 *     files run serially and this file's position in that order is
 *     deterministic;
 *   - `tickets.spec.ts` fully resets the ticket table in its own `beforeAll`
 *     via `POST /api/tickets/reset` before any of its own assertions run, so
 *     a value reset here is never observed by that suite.
 * A future spec author should not assume `ticket.agentTaskId` links survive
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
 *   Case 2 depends on Case 1 having already left the column and index
 *   present.
 * - `afterAll` calls the ensure-function once more so later spec files
 *   (`workers: 1` keeps the whole suite serial) see a clean, consistent
 *   schema regardless of which case ran last.
 */
import { test, expect } from '@playwright/test';
import { client } from '../config/db.js';
import { ensureTicketAgentTaskIdColumn } from '../config/migrate.js';

async function hasColumn(table: string, column: string): Promise<boolean> {
  const info = await client.execute(`PRAGMA table_info(${table})`);
  return info.rows.some((row) => row['name'] === column);
}

async function hasIndex(table: string, indexName: string): Promise<boolean> {
  const info = await client.execute(`PRAGMA index_list(${table})`);
  return info.rows.some((row) => row['name'] === indexName);
}

test.describe.serial('ensureTicketAgentTaskIdColumn — idempotent migration', () => {
  test('Case 1: calling it twice in a row is safe — column AND index present after EACH call', async () => {
    // By the time any spec file runs, the backend has already started and
    // run runMigrations() (which calls this very function once), so
    // `agentTaskId` already exists on `ticket` — every call below therefore
    // exercises the "column already exists" branch, exactly like production
    // does on every restart. To make this test capable of catching the bug
    // it exists to catch (an early return on that branch that skips index
    // creation), the index must be verifiably ABSENT before the first call:
    // a buggy early-return implementation would then leave it missing, and
    // the assertion below would fail.
    await test.step('setup: column present, index dropped (forces the has-column branch to matter)', async () => {
      await client.execute('DROP INDEX IF EXISTS idx_ticket_agentTaskId');
      expect(await hasColumn('ticket', 'agentTaskId')).toBe(true);
      expect(await hasIndex('ticket', 'idx_ticket_agentTaskId')).toBe(false);
    });

    await test.step('first call: column present, index (re)created — the regression guard', async () => {
      await ensureTicketAgentTaskIdColumn();
      expect(await hasColumn('ticket', 'agentTaskId')).toBe(true);
      expect(await hasIndex('ticket', 'idx_ticket_agentTaskId')).toBe(true);
    });

    await test.step('second call (has-column branch again): column and index both still present', async () => {
      await ensureTicketAgentTaskIdColumn();
      expect(await hasColumn('ticket', 'agentTaskId')).toBe(true);
      expect(await hasIndex('ticket', 'idx_ticket_agentTaskId')).toBe(true);
    });
  });

  test('Case 2: pre-existing DB without the column or index — both restored, in that order, without error', async () => {
    await test.step('simulate a pre-existing DB: drop the index, then the column (SQLite refuses to drop an indexed column)', async () => {
      await client.execute('DROP INDEX IF EXISTS idx_ticket_agentTaskId');
      await client.execute('ALTER TABLE ticket DROP COLUMN agentTaskId');
      expect(await hasColumn('ticket', 'agentTaskId')).toBe(false);
      expect(await hasIndex('ticket', 'idx_ticket_agentTaskId')).toBe(false);
    });

    await test.step('ensure-function restores both the column and the index without throwing', async () => {
      await ensureTicketAgentTaskIdColumn();
      expect(await hasColumn('ticket', 'agentTaskId')).toBe(true);
      expect(await hasIndex('ticket', 'idx_ticket_agentTaskId')).toBe(true);
    });
  });

  test.afterAll(async () => {
    // Leave the schema in a clean, consistent state for whatever spec file
    // runs next, regardless of which case above ran last.
    await ensureTicketAgentTaskIdColumn();
  });
});
