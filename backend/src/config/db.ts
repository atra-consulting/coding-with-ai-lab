import { createClient } from '@libsql/client';
import { drizzle } from 'drizzle-orm/libsql';
import { mkdirSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import * as schema from '../db/schema/schema.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Resolve backend/data/ relative to this file (src/config/db.ts → backend/data/)
// Using __dirname (not cwd) so the path is correct regardless of working directory
// (e.g. when running from the repo root via api/index.ts on Vercel).
const dataDir = join(__dirname, '..', '..', 'data');

const tursoUrl = process.env['TURSO_DATABASE_URL'];
const isTest = process.env['NODE_ENV'] === 'test';

// Playwright's worker runtime sets TEST_WORKER_INDEX on every worker process
// unconditionally (lib/worker/workerMain.js), before any spec file or its
// imports run - regardless of which playwright config launched it. So if
// this module loads inside a Playwright worker (isPlaywrightWorker) but
// NODE_ENV never got set to 'test' (isTest), something skipped the test-DB
// isolation - e.g. a stray --config pointing at a config without a
// globalSetup that sets NODE_ENV=test - and this connection would otherwise
// silently land on the developer's live crmdb.sqlite (or a real Turso DB).
// Refuse instead of connecting. This is deliberately independent of any one
// config file: it protects the DB even if a *new* unsafe config appears
// later. ALLOW_DEV_DB_TESTS=1 is an explicit escape hatch for the rare case
// of intentionally running spec files against a non-test database.
const isPlaywrightWorker = process.env['TEST_WORKER_INDEX'] !== undefined;
if (isPlaywrightWorker && !isTest && process.env['ALLOW_DEV_DB_TESTS'] !== '1') {
  throw new Error(
    'Refusing to connect to the database: this process is a Playwright test worker ' +
      '(TEST_WORKER_INDEX is set) but NODE_ENV is not "test", so it would otherwise hit ' +
      'the live database instead of the isolated crmdb.test.sqlite. Run the suite via ' +
      '`npm test` / `npx playwright test` with no --config override (the default ' +
      'playwright.config.ts sets NODE_ENV=test before this module loads). If you really ' +
      'intend to run tests against the current database, set ALLOW_DEV_DB_TESTS=1.'
  );
}

// Route the Playwright suite (NODE_ENV=test) to its own SQLite file so
// `npm test` never touches the developer's working database — this wins
// even when TURSO_DATABASE_URL is set, so a stray Turso env var left over
// in a developer's shell can't send the suite's destructive resets
// (ticket/agent_task wipes) against a real cloud database.
const dbFileName = isTest ? 'crmdb.test.sqlite' : 'crmdb.sqlite';
const dbPath = join(dataDir, dbFileName);

// Only create the local data dir when actually using a local file — on
// Vercel (TURSO_DATABASE_URL set, not testing) the filesystem is
// read-only and mkdirSync at import time crashes the whole function.
if (!tursoUrl || isTest) {
  mkdirSync(dataDir, { recursive: true });
}

const url = isTest ? `file:${dbPath}` : (tursoUrl ?? `file:${dbPath}`);
const authToken = process.env['TURSO_AUTH_TOKEN'];

// Do NOT set intMode — the default "number" is required by the DTO interfaces.
export const client = createClient({ url, authToken });

export const db = drizzle(client, { schema });
