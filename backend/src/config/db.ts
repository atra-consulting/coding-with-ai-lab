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
mkdirSync(dataDir, { recursive: true });

const dbPath = join(dataDir, 'crmdb.sqlite');

const url = process.env['TURSO_DATABASE_URL'] ?? `file:${dbPath}`;
const authToken = process.env['TURSO_AUTH_TOKEN'];

// Do NOT set intMode — the default "number" is required by the DTO interfaces.
export const client = createClient({ url, authToken });

export const db = drizzle(client, { schema });
