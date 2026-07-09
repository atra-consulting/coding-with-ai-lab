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
  // 1. Kill any existing process on port 7070
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
  // 2. Start from a fresh test database (never touches the dev DB crmdb.sqlite).
  //    db.ts uses crmdb.test.sqlite when NODE_ENV=test and no Turso URL is set.
  //    Deleting the file plus its journal sidecars makes each run deterministic:
  //    startup re-creates the schema and re-seeds agent-tasks, fixture CRM data,
  //    tickets. Runs AFTER the port-kill above so no live backend still holds it.
  //    `-journal` is the sidecar for the default rollback-journal mode @libsql/client
  //    uses on local files; `-wal`/`-shm` are cleaned too in case WAL is ever enabled.
  //    Skipped when running against a remote DB (Turso/CI).
  // -------------------------------------------------------------------------
  if (!process.env['TURSO_DATABASE_URL']) {
    const testDbPath = join(BACKEND_ROOT, 'backend', 'data', 'crmdb.test.sqlite');
    for (const suffix of ['', '-journal', '-wal', '-shm']) {
      rmSync(`${testDbPath}${suffix}`, { force: true });
    }
  }

  // -------------------------------------------------------------------------
  // 3. Spawn the backend
  // -------------------------------------------------------------------------
  const env: Record<string, string> = {
    ...Object.fromEntries(
      Object.entries(process.env).filter(([, v]) => v !== undefined) as [string, string][]
    ),
    NODE_ENV: 'test',
    PORT: '7070',
    AGENT_API_TOKEN: TEST_AGENT_TOKEN,
    AGENT_AUTH_ALLOW_LOOPBACK: '1',
  };

  // Pass Turso credentials through when running against a remote DB (e.g. CI).
  // Local/CI default: TURSO_DATABASE_URL unset → db.ts uses the file: fallback.
  if (process.env['TURSO_DATABASE_URL']) {
    env['TURSO_DATABASE_URL'] = process.env['TURSO_DATABASE_URL'];
  }
  if (process.env['TURSO_AUTH_TOKEN']) {
    env['TURSO_AUTH_TOKEN'] = process.env['TURSO_AUTH_TOKEN'];
  }

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
