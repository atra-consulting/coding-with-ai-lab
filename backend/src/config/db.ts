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

// Tests run the backend with NODE_ENV=test (see src/test/globalSetup.ts) and no
// Turso URL. Point them at a separate SQLite file so the Playwright suite never
// touches the dev database (crmdb.sqlite). Turso/CI is unaffected — TURSO_DATABASE_URL
// still wins below.
const isTest = process.env['NODE_ENV'] === 'test';
const dbFileName = isTest ? 'crmdb.test.sqlite' : 'crmdb.sqlite';
const dbPath = join(dataDir, dbFileName);

const tursoUrl = process.env['TURSO_DATABASE_URL'];

// Only create the local data dir when actually using the file: default —
// on Vercel (TURSO_DATABASE_URL set) the filesystem is read-only and
// mkdirSync at import time crashes the whole function.
if (!tursoUrl) {
  mkdirSync(dataDir, { recursive: true });
}

const url = tursoUrl ?? `file:${dbPath}`;
const authToken = process.env['TURSO_AUTH_TOKEN'];

// Do NOT set intMode — the default "number" is required by the DTO interfaces.
export const client = createClient({ url, authToken });

export const db = drizzle(client, { schema });
