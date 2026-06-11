/**
 * Vercel serverless function entry point.
 *
 * api/index.ts is outside backend/src/ (the backend rootDir), so it has its
 * own tsconfig (api/tsconfig.json) and is bundled by Vercel's esbuild at
 * deploy time — not compiled by tsc.
 *
 * Import paths use the .js suffix because backend/src uses NodeNext module
 * resolution (ESM with explicit extensions). esbuild resolves .js → .ts
 * transparently, so these imports work at bundle time even though the
 * physical files are .ts.
 *
 * Cold-start init is a CACHED Promise created once at module-evaluation time.
 * Concurrent first requests all await the SAME promise (race-safe); warm
 * invocations skip it instantly because the promise is already settled.
 */

import type { IncomingMessage, ServerResponse } from 'node:http';
import app from '../backend/src/app.js';
import { runMigrations } from '../backend/src/config/migrate.js';
import { runDataMigration } from '../backend/src/seed/dataMigration.js';

const initPromise: Promise<void> = (async () => {
  await runMigrations();
  await runDataMigration();
})();

export default async function handler(
  req: IncomingMessage,
  res: ServerResponse,
): Promise<void> {
  await initPromise;
  // app is an Express Application, which is a Node.js http.RequestListener
  // (i.e. (req: IncomingMessage, res: ServerResponse) => void).
  // Casting lets TypeScript accept the call without @vercel/node types.
  (app as (req: IncomingMessage, res: ServerResponse) => void)(req, res);
}
