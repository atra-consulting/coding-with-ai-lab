/**
 * Playwright global setup for the CRM backend test suite.
 *
 * Responsibilities:
 * 1. Kill any existing process on port 7070 and spawn the backend child
 *    process (tsx src/index.ts).
 * 2. Poll /api/health until ready.
 * 3. Return a teardown function.
 */
import { spawnSync, spawn, ChildProcess } from 'node:child_process';
import { rmSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join, resolve } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const BACKEND_ROOT = resolve(__dirname, '..', '..', '..');

// Resolved the same way config/db.ts resolves it (relative to that file's
// __dirname, i.e. backend/data/), so both the runner process and the
// spawned backend agree on the exact test DB path.
const TEST_DB_PATH = join(BACKEND_ROOT, 'backend', 'data', 'crmdb.test.sqlite');

/**
 * Fixed agent token injected into the backend process during tests.
 * Import this constant in spec files so the literal stays consistent.
 */
export const TEST_AGENT_TOKEN = 'test-agent-token-abc123';

let backendProcess: ChildProcess;

// ---------------------------------------------------------------------------
// globalSetup
// ---------------------------------------------------------------------------

export default async function globalSetup(): Promise<() => Promise<void>> {
  // -------------------------------------------------------------------------
  // 1. Kill any existing process on port 7070 and spawn the backend
  // -------------------------------------------------------------------------
  try {
    const check = await fetch('http://localhost:7070/api/health');
    if (check.ok) {
      const lsofResult = spawnSync('lsof', ['-ti', 'TCP:7070'], { encoding: 'utf8' });
      if (lsofResult.stdout.trim()) {
        const pids = lsofResult.stdout.trim().split('\n');
        for (const pid of pids) {
          spawnSync('kill', ['-9', pid.trim()]);
        }
        await new Promise((r) => setTimeout(r, 1000));
      }
    }
  } catch {
    // Port was not in use — nothing to kill
  }

  // -------------------------------------------------------------------------
  // 1b. Delete the test DB file and its SQLite sidecar files so each run
  //     starts from a clean, freshly-migrated/seeded schema. Never touches
  //     the dev DB (crmdb.sqlite) — only the `.test.` file. Unconditional:
  //     db.ts always uses this local file under NODE_ENV=test, even if
  //     TURSO_DATABASE_URL happens to be set in the environment.
  // -------------------------------------------------------------------------
  for (const suffix of ['', '-journal', '-wal', '-shm']) {
    rmSync(`${TEST_DB_PATH}${suffix}`, { force: true });
  }

  const env: Record<string, string> = {
    ...Object.fromEntries(
      Object.entries(process.env).filter(([, v]) => v !== undefined) as [string, string][]
    ),
    NODE_ENV: 'test',
    PORT: '7070',
    AGENT_API_TOKEN: TEST_AGENT_TOKEN,
    AGENT_AUTH_ALLOW_LOOPBACK: '1',
  };

  const tsxBin = join(BACKEND_ROOT, 'backend', 'node_modules', '.bin', 'tsx');
  const indexTs = join(BACKEND_ROOT, 'backend', 'src', 'index.ts');

  backendProcess = spawn(tsxBin, [indexTs], {
    cwd: join(BACKEND_ROOT, 'backend'),
    env,
    stdio: 'pipe',
  });

  backendProcess.stdout?.on('data', (data: Buffer) => {
    process.stdout.write(`[backend] ${data.toString()}`);
  });
  backendProcess.stderr?.on('data', (data: Buffer) => {
    process.stderr.write(`[backend] ${data.toString()}`);
  });

  // -------------------------------------------------------------------------
  // 2. Poll /api/health until the backend is ready (max 30s)
  // -------------------------------------------------------------------------
  const backendUrl = `http://localhost:7070`;
  const deadline = Date.now() + 30_000;

  while (Date.now() < deadline) {
    try {
      const resp = await fetch(`${backendUrl}/api/health`);
      if (resp.ok) break;
    } catch {
      // not ready yet
    }
    await new Promise((r) => setTimeout(r, 200));
  }

  const healthResp = await fetch(`${backendUrl}/api/health`);
  if (!healthResp.ok) {
    throw new Error('Backend did not start within 30s');
  }

  // -------------------------------------------------------------------------
  // 3. Return teardown
  // -------------------------------------------------------------------------
  return async () => {
    backendProcess.kill('SIGTERM');
    await new Promise<void>((resolve_) => {
      backendProcess.on('exit', () => resolve_());
      setTimeout(() => {
        backendProcess.kill('SIGKILL');
        resolve_();
      }, 5000);
    });
  };
}
