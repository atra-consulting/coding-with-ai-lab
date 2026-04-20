/**
 * Playwright global setup for the CRM backend test suite.
 *
 * Responsibilities:
 * 1. Start a Nominatim stub HTTP server on an ephemeral port in the MAIN
 *    Playwright process.  The stub exposes two sets of endpoints:
 *      - GET /search       — serves canned Nominatim responses (read by backend)
 *      - PUT /control      — sets the next stub behavior (called by test workers)
 *      - DELETE /control   — resets to default success behavior
 *      - GET /control/count — returns the current call count (read by test workers)
 *      - DELETE /control/count — resets the call count
 *
 *    Using an HTTP control API lets test WORKER processes (which run in
 *    separate Node.js processes from globalSetup) communicate with the stub
 *    despite not sharing memory.
 *
 * 2. Kill any existing process on port 7070 and spawn the backend child
 *    process (tsx src/index.ts) with NOMINATIM_BASE_URL pointing to the stub.
 * 3. Poll /api/health until ready.
 * 4. Return a teardown function.
 */
import http from 'node:http';
import { spawnSync, spawn, ChildProcess } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, join, resolve } from 'node:path';
import type { AddressInfo } from 'node:net';

const __dirname = dirname(fileURLToPath(import.meta.url));
const BACKEND_ROOT = resolve(__dirname, '..', '..', '..');

// ---------------------------------------------------------------------------
// Stub state (lives in the MAIN Playwright process)
// ---------------------------------------------------------------------------

export type StubBehavior =
  | { type: 'success'; latitude: number; longitude: number }
  | { type: 'http-500' }
  | { type: 'empty' }
  | { type: 'malformed' }
  | { type: 'timeout' };

// These are only meaningful when the stub runs in the same process as tests.
// For cross-process use, test workers should use the HTTP control API instead.
// Exported for use by the globalSetup process itself (e.g. type re-export).
export const stubRegistry: Map<string, StubBehavior> = new Map();
export let stubCallCount = 0;
export function resetStubCallCount(): void { stubCallCount = 0; }

// ---------------------------------------------------------------------------
// Stub control port — published so test workers can find the control API
// ---------------------------------------------------------------------------

/** Written by globalSetup; read by helpers.ts to talk to the control API. */
export let STUB_CONTROL_URL = '';

// ---------------------------------------------------------------------------
// Internal
// ---------------------------------------------------------------------------

const DEFAULT_SUCCESS: StubBehavior = {
  type: 'success',
  latitude: 52.5171465,
  longitude: 13.3961451,
};

function nominatimSuccessBody(lat: number, lon: number): string {
  return JSON.stringify([{ lat: String(lat), lon: String(lon), display_name: 'Test' }]);
}

/** Current stub behavior in the main process (used by the /search handler). */
let currentBehavior: StubBehavior = DEFAULT_SUCCESS;
/** Whether the current behavior is one-shot (consumed after one use). */
let isOneShot = false;
/** Stub call counter (maintained in main process). */
let callCount = 0;

let stubServer: http.Server;
let backendProcess: ChildProcess;

// ---------------------------------------------------------------------------
// globalSetup
// ---------------------------------------------------------------------------

export default async function globalSetup(): Promise<() => Promise<void>> {
  // -------------------------------------------------------------------------
  // 1. Start the combined Nominatim stub + control server
  // -------------------------------------------------------------------------
  await new Promise<void>((resolve_) => {
    stubServer = http.createServer((req, res) => {
      const url = new URL(req.url ?? '/', `http://localhost`);

      // ---- Nominatim endpoint (called by the backend) ----
      if (url.pathname === '/search' && req.method === 'GET') {
        callCount++;

        const behavior = currentBehavior;
        if (isOneShot) {
          // Reset to default after one use
          currentBehavior = DEFAULT_SUCCESS;
          isOneShot = false;
        }

        switch (behavior.type) {
          case 'success':
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(nominatimSuccessBody(behavior.latitude, behavior.longitude));
            break;
          case 'http-500':
            res.writeHead(500);
            res.end('Internal Server Error');
            break;
          case 'empty':
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end('[]');
            break;
          case 'malformed':
            res.writeHead(200, { 'Content-Type': 'text/html' });
            res.end('<html>not json</html>');
            break;
          case 'timeout':
            // Intentionally do nothing — AbortSignal.timeout(10_000) will fire.
            break;
        }
        return;
      }

      // ---- Control: set behavior ----
      if (url.pathname === '/control' && req.method === 'PUT') {
        let body = '';
        req.on('data', (chunk: Buffer) => { body += chunk.toString(); });
        req.on('end', () => {
          try {
            const parsed = JSON.parse(body) as { behavior: StubBehavior; oneShot?: boolean };
            currentBehavior = parsed.behavior;
            isOneShot = parsed.oneShot ?? false;
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ ok: true }));
          } catch {
            res.writeHead(400);
            res.end('Bad JSON');
          }
        });
        return;
      }

      // ---- Control: reset behavior to default ----
      if (url.pathname === '/control' && req.method === 'DELETE') {
        currentBehavior = DEFAULT_SUCCESS;
        isOneShot = false;
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ ok: true }));
        return;
      }

      // ---- Control: get call count ----
      if (url.pathname === '/control/count' && req.method === 'GET') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ count: callCount }));
        return;
      }

      // ---- Control: reset call count ----
      if (url.pathname === '/control/count' && req.method === 'DELETE') {
        callCount = 0;
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ ok: true }));
        return;
      }

      // Unknown path
      res.writeHead(404);
      res.end('Not found');
    });

    stubServer.listen(0, '127.0.0.1', () => resolve_());
  });

  const stubPort = (stubServer.address() as AddressInfo).port;
  const stubUrl = `http://127.0.0.1:${stubPort}`;
  STUB_CONTROL_URL = stubUrl;

  // Write control URL to environment so worker processes can find it
  process.env['STUB_CONTROL_URL'] = stubUrl;

  // -------------------------------------------------------------------------
  // 2. Kill any existing process on port 7070 and spawn the backend
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

  const env = {
    ...process.env,
    NOMINATIM_BASE_URL: stubUrl,
    GEOCODING_SLEEP_MS: '0',
    NODE_ENV: 'test',
    PORT: '7070',
    STUB_CONTROL_URL: stubUrl,
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
  // 3. Poll /api/health until the backend is ready (max 30s)
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
  // 4. Return teardown
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

    await new Promise<void>((resolve_, reject) =>
      stubServer.close((err) => (err ? reject(err) : resolve_()))
    );
  };
}
