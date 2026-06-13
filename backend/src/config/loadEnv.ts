/**
 * Minimal, zero-dependency .env loader.
 *
 * Loads key=value pairs from `backend/.env` into process.env IF the file exists.
 * Imported first by index.ts so the values are present before any other module
 * (db.ts, middleware) reads process.env at load time.
 *
 * Rules:
 * - Missing .env file is fine (CI, Vercel, production all set real env vars).
 * - Real environment variables ALWAYS win — an existing process.env key is never
 *   overwritten. So `AGENT_API_TOKEN=... npx tsx src/index.ts` and GitHub Actions
 *   secrets take precedence over the file.
 * - Lines that are blank or start with `#` are ignored.
 * - Surrounding single or double quotes around a value are stripped.
 */
import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
// backend/src/config/loadEnv.ts -> backend/.env
const envPath = resolve(__dirname, '..', '..', '.env');

if (existsSync(envPath)) {
  const content = readFileSync(envPath, 'utf8');
  for (const line of content.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;

    const eq = trimmed.indexOf('=');
    if (eq === -1) continue;

    const key = trimmed.slice(0, eq).trim();
    if (!key) continue;

    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    // Real env vars win — never overwrite something already set.
    if (process.env[key] === undefined) {
      process.env[key] = value;
    }
  }
}
