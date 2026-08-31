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
