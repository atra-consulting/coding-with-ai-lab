/**
 * Playwright tests for the idempotent agent-task seeder.
 *
 * Verifies that `seedAgentTasks()` (backend/src/seed/agentTaskSeed.ts):
 *   1. Uses INSERT OR IGNORE — running it twice yields exactly 23 rows, no
 *      duplicates, no throw.
 *   2. Seeds successfully even when `firma` already has rows (fixes the
 *      Vercel bug where the old guard blocked seeding on a non-empty DB).
 *   3. Does NOT overwrite rows that were mutated after the initial seed
 *      (INSERT OR IGNORE leaves existing rows untouched).
 *   4. (Optional) Seeds correct per-source counts: 7 rows for EMAIL, 4 for GITHUB_ISSUE, 6 for APP_LOG, 6 for ERROR_REPORT.
 *
 * Also verifies the AGENT_TASK_SEED source data directly (not via the live
 * DB) for row id 23 — see the 'AGENT_TASK_SEED source data' suite below. On a
 * shared dev DB that was already seeded before row 23 was reworded,
 * INSERT OR IGNORE means the live row will keep its old values forever, so a
 * live-DB assertion on the new title/subject would be flaky. Asserting
 * against the exported constant instead is deterministic regardless of what
 * is currently in any given SQLite file.
 *
 * Test isolation notes
 * --------------------
 * - This suite runs with `workers: 1` (playwright.config.ts), so all spec
 *   files are serial and ordering is deterministic.
 * - We use `test.describe.serial` to guarantee internal ordering within this
 *   file (cases depend on prior state).
 * - `afterAll` restores a clean seeded state (DELETE + seedAgentTasks) so
 *   other suites that rely on 23 OPEN tasks (e.g. agentTasks.spec.ts) find
 *   the DB in the expected shape.  Those suites call resetDatabase() in their
 *   own beforeAll, so this is belt-and-suspenders.
 * - The 'AGENT_TASK_SEED source data' suite below reads only the exported
 *   in-memory constant (no DB access), so it does not need to be part of the
 *   serial DB suite and carries no ordering dependency on it.
 */
import { test, expect } from '@playwright/test';
import { client } from '../config/db.js';
import { seedAgentTasks, AGENT_TASK_SEED } from '../seed/agentTaskSeed.js';

// ---------------------------------------------------------------------------
// Helper: count rows in a table via the async libsql client.execute API
// ---------------------------------------------------------------------------

async function countRows(table: string): Promise<number> {
  const result = await client.execute(`SELECT COUNT(*) AS n FROM ${table}`);
  const row = result.rows[0];
  if (!row) throw new Error(`countRows: no rows returned for table ${table}`);
  return Number(row['n']);
}

async function getAgentTaskStatus(id: number): Promise<string> {
  const result = await client.execute({
    sql: 'SELECT status FROM agent_task WHERE id = ?',
    args: [id],
  });
  const row = result.rows[0];
  if (!row) throw new Error(`getAgentTaskStatus: id ${id} not found`);
  return String(row['status']);
}

// ---------------------------------------------------------------------------
// Suite (serial — cases run in declaration order and share DB state)
// ---------------------------------------------------------------------------

test.describe.serial('seedAgentTasks — idempotent seeder', () => {

  // -------------------------------------------------------------------------
  // Case 1: Idempotent re-run
  // -------------------------------------------------------------------------
  test('idempotent re-run: seeds 23 rows, second call does not duplicate or throw', async () => {
    await test.step('delete all agent_task rows', async () => {
      await client.execute('DELETE FROM agent_task');
      const count = await countRows('agent_task');
      expect(count).toBe(0);
    });

    await test.step('first seedAgentTasks() call inserts 23 rows', async () => {
      await seedAgentTasks();
      const count = await countRows('agent_task');
      expect(count).toBe(23);
    });

    await test.step('second seedAgentTasks() call does not throw and still yields 23 rows', async () => {
      await seedAgentTasks();
      const count = await countRows('agent_task');
      expect(count).toBe(23);
    });
  });

  // -------------------------------------------------------------------------
  // Case 2: Seeds when firma is non-empty (the actual Vercel bug)
  // -------------------------------------------------------------------------
  test('seeds when firma table has rows (no firma-empty guard blocks seeding)', async () => {
    await test.step('confirm firma has rows (CRM fixture data is present)', async () => {
      const firmaCount = await countRows('firma');
      expect(firmaCount).toBeGreaterThan(0);
    });

    await test.step('delete all agent_task rows', async () => {
      await client.execute('DELETE FROM agent_task');
      const count = await countRows('agent_task');
      expect(count).toBe(0);
    });

    await test.step('seedAgentTasks() with non-empty firma → still inserts 23 rows', async () => {
      await seedAgentTasks();
      const count = await countRows('agent_task');
      expect(count).toBe(23);
    });
  });

  // -------------------------------------------------------------------------
  // Case 3: Preserves modified rows (INSERT OR IGNORE does not reset them)
  // -------------------------------------------------------------------------
  test('preserves modified rows: UPDATE then re-seed leaves the mutation intact', async () => {
    await test.step('ensure rows are seeded (in case prior test left them)', async () => {
      // idempotent — safe to call even if rows exist
      await seedAgentTasks();
      const count = await countRows('agent_task');
      expect(count).toBe(23);
    });

    await test.step('mutate id=1: set status to DONE', async () => {
      await client.execute({
        sql: "UPDATE agent_task SET status = 'DONE' WHERE id = 1",
        args: [],
      });
      const status = await getAgentTaskStatus(1);
      expect(status).toBe('DONE');
    });

    await test.step('re-run seedAgentTasks()', async () => {
      await seedAgentTasks();
    });

    await test.step('id=1 is still DONE (INSERT OR IGNORE did not reset it)', async () => {
      const status = await getAgentTaskStatus(1);
      expect(status).toBe('DONE');
    });

    await test.step('total row count is still 23', async () => {
      const count = await countRows('agent_task');
      expect(count).toBe(23);
    });
  });

  // -------------------------------------------------------------------------
  // Case 4 (optional): All 4 sources present with exactly 4 rows each
  // -------------------------------------------------------------------------
  test('clean seed: all 4 sources present with correct row counts', async () => {
    await test.step('delete all agent_task rows and re-seed cleanly', async () => {
      await client.execute('DELETE FROM agent_task');
      await seedAgentTasks();
    });

    const sourceCounts: Record<string, number> = {
      EMAIL: 7,
      GITHUB_ISSUE: 4,
      APP_LOG: 6,
      ERROR_REPORT: 6,
    };

    for (const [source, expectedCount] of Object.entries(sourceCounts)) {
      await test.step(`source ${source} has exactly ${expectedCount} rows`, async () => {
        const result = await client.execute({
          sql: 'SELECT COUNT(*) AS n FROM agent_task WHERE source = ?',
          args: [source],
        });
        const row = result.rows[0];
        if (!row) throw new Error(`No rows returned for source ${source}`);
        expect(Number(row['n'])).toBe(expectedCount);
      });
    }
  });

  // -------------------------------------------------------------------------
  // afterAll: restore clean seeded state for subsequent suites
  // -------------------------------------------------------------------------
  test.afterAll(async () => {
    await client.execute('DELETE FROM agent_task');
    await seedAgentTasks();
  });
});

// ---------------------------------------------------------------------------
// Suite: AGENT_TASK_SEED source data — row id 23 (reworded Chancen-Notiz task)
//
// Reads only the exported AGENT_TASK_SEED constant, never the DB. INSERT OR
// IGNORE means an already-seeded shared dev DB keeps row 23's OLD values
// forever, so a live-DB assertion on the new title/subject would be flaky.
// This suite is deliberately independent of the serial DB suite above (no
// shared state, no ordering dependency) and does not need `workers: 1`.
// ---------------------------------------------------------------------------
test.describe('AGENT_TASK_SEED source data — row id 23', () => {
  test('id 23 has the reworded title, subject, and German Chancen-Notiz body', () => {
    const row23 = AGENT_TASK_SEED.find((row) => row.id === 23);

    if (!row23) {
      throw new Error('AGENT_TASK_SEED has no row with id 23');
    }

    expect(row23.title).toBe('Improve chances');

    expect(typeof row23.metadata).toBe('string');
    const metadata = JSON.parse(row23.metadata as string) as { subject?: string };
    expect(metadata.subject).toBe('Verbesserungen für Chancen');

    // Sanity check: body is the new German Chancen-Notiz text (mentions the
    // free-text note request), not the old wording.
    expect(row23.body).toContain('Notiz');
  });
});
