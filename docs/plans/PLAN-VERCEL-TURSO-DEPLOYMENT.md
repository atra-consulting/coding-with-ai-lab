# Implementation Plan: VERCEL-TURSO-DEPLOYMENT

Migrate the backend from better-sqlite3 (sync) to @libsql/client + drizzle-orm/libsql (async, Turso-compatible), move sessions into the DB, package the app for Vercel (Express as serverless function + Angular static), and add a GitHub Actions pipeline (tests on PR, production deploy from `main` only).

Reviewed by ba/be/db/fe reviewers; all findings folded in below.

## Test Command

- Backend: `cd backend && npx playwright test`
- Frontend: `cd frontend && npx ng test --configuration=ci` (ci config added in Phase 7)
- Type check: `cd backend && npx tsc --noEmit` AND `npx tsc --noEmit -p api/tsconfig.json` (api/ is outside backend rootDir!)

## Environment Contract

Local dev (`./start.sh`, `tsx --watch`) and CI run with NO env vars set — same SQLite file as today.

Production env vars (set in Vercel project settings, NOT in the workflow):
- `TURSO_DATABASE_URL` — `libsql://...turso.io`. Default when unset: `file:<abs path>/backend/data/crmdb.sqlite` resolved from `db.ts` `__dirname` (NOT cwd-relative — `api/index.ts` runs with a different cwd).
- `TURSO_AUTH_TOKEN` — Turso token.
- `SESSION_SECRET` — REQUIRED: session.ts defaults to hardcoded `'crm-dev-secret-key'`; forgeable cookies otherwise.
- `CORS_ORIGINS` — REQUIRED: `https://<project>.vercel.app`. cors.ts defaults to `http://localhost:7200`; without this every browser POST is rejected (same-origin requests DO send an Origin header).
- `NODE_ENV=production`.

## Architectural Constraints (from db review — MUST hold)

- **Never call `client.transaction()`** anywhere. libsql's local `Sqlite3Client.transaction()` nulls its connection; the lazily reopened connection has `foreign_keys=OFF`, silently breaking cascade deletes. Use `client.batch(stmts, 'write')` for multi-statement writes — it reuses the connection and inherits the PRAGMA.
- `PRAGMA foreign_keys = ON` is issued as a STANDALONE `await client.execute(...)` (first thing in `runMigrations()`), never inside a batch (batch wraps `BEGIN`; SQLite ignores the pragma inside a transaction).
- Do NOT set `intMode` on `createClient` — the default `"number"` is required by the DTO interfaces.
- `lastInsertRowid` is `bigint | undefined` → every read site uses a guard: throw if undefined, else `Number(...)`.
- Cascade-delete regression canary: the firmen-crud cascade test must stay green.

## Tasks

### Phase 1: DB driver swap (db-coder)
- [ ] `backend/package.json`: add `@libsql/client`; remove `better-sqlite3` + `@types/better-sqlite3`. Keep `drizzle-orm@^0.41.0` (`drizzle-orm/libsql` subpath confirmed present; runtime compat verified by tsc + suite). `npm install`, check peer warnings.
- [ ] `backend/src/config/db.ts`: `createClient({ url, authToken })` from `@libsql/client` (no `intMode` option); `db = drizzle(client, { schema })` from `drizzle-orm/libsql`. Export `client` (replaces `sqlite` export). Keep `mkdirSync(dataDir)` for the local file default; default URL `file:` + absolute path from `__dirname`.
- [ ] `backend/src/config/migrate.ts`: `runMigrations(): Promise<void>`; first statement `await client.execute('PRAGMA foreign_keys = ON')` (standalone — see constraints); then `await client.executeMultiple(ddl)` for tables and indexes (non-transactional like today's `exec`; safe via `IF NOT EXISTS`).
- [ ] `backend/src/seed/dataMigration.ts`: `runDataMigration(): Promise<void>`. COUNT check → `await client.execute(...)`, `Number(rows[0].cnt)`. Replace `sqlite.transaction` + prepared-statement loop with ONE `await client.batch(stmts, 'write')` (atomic, respects INSERT_ORDER): loop `INSERT_ORDER` × fixture rows building `{ sql: INSERT_SQL[table], args: row }`. KEEP the `@column` named SQL — libsql accepts a plain object for named args (`@`-sigil stripped on object keys, plain keys pass through; confirmed in libsql source). No positional rewrite. Note: full fixture in one batch is fine locally; Turso request-size limits only matter for much larger fixtures.
- [ ] `backend/src/index.ts`: async `main()` — `await runMigrations(); await runDataMigration(); app.listen(...)`. Server must not listen before migrations complete (Playwright globalSetup polls health).

### Phase 2: Services sync → async (be-coder)
Conversion map: `.prepare(sql).get(args)` → `await client.execute({ sql, args: [...] })` + `rows[0] ?? undefined`; `.all(...)` → `rows`; `.run(...)` → result; insert IDs via guarded `Number(result.lastInsertRowid)` (throw if undefined).
- [ ] `firmaService.ts` (~10 sites) and `personService.ts` (~9): BOTH use spread-params in findAll (`.get(...params)`, `.all(...params, size, page*size)`) → explicit args array `[...params, size, page * size]`.
- [ ] `abteilungService.ts` (~13; `await this.findById` in findPersonenByAbteilungId), `adresseService.ts` (~9; `await this.findById` in update), `aktivitaetService.ts` (~9), `chanceService.ts` (~10; `await this.findById` in create/update).
- [ ] `dashboardService.ts`: delete `Statements` interface + lazy `getStatements()` cache (no longer needed); `async getDashboard()` with 6 awaited executes.
- [ ] `geocodingService.ts`: already async; replace `sqlite.prepare(selectSql).all()` with awaited execute, and replace the FUNCTION-LOCAL `updateStmt` (prepare-once-run-many inside `runGeocodingBatch`) with `await client.execute({ sql, args })` inside the loop.
- [ ] All methods become `async`/`Promise<T>`; internal `this.findX` calls awaited.

### Phase 3: Routes async + asyncHandler (be-coder)
- [ ] NEW `backend/src/utils/asyncHandler.ts`: `(fn) => (req, res, next) => fn(req, res, next).catch(next)` — Express 4 does not route async rejections to the error handler. Error responses keep the `{ status, message, timestamp, fieldErrors }` shape.
- [ ] Wrap handlers + `await` service calls in: `firmen.ts`, `personen.ts`, `abteilungen.ts`, `adressen.ts`, `aktivitaeten.ts`, `chancen.ts`, `dashboard.ts`, `admin.ts` (already async — swap try/catch for asyncHandler). `auth.ts`: callback-style session calls stay as-is.

### Phase 4: DB-backed sessions (be-coder + db-coder)
Current state: `express-session` + `memorystore`, only `req.session.userId` stored; users stay hardcoded in `config/users.ts`.
- [ ] `backend/src/db/schema/schema.ts`: `sessions` table — `sid TEXT PK`, `sess TEXT NOT NULL` (JSON), `expire TEXT NOT NULL` (ISO-8601). NOTE: documentary only (store uses raw SQL) — comment it as such to flag the migrate.ts drift risk.
- [ ] `backend/src/config/migrate.ts`: `CREATE TABLE IF NOT EXISTS sessions (...)` + `CREATE INDEX IF NOT EXISTS idx_sessions_expire ON sessions(expire)`.
- [ ] NEW `backend/src/middleware/libsqlSessionStore.ts`: custom `express-session` `Store` subclass — `get`/`set`/`destroy`/`touch` via `client.execute`. Promise→callback bridge passes `null` (not undefined) on success and the error on rejection. Expired rows treated as missing; opportunistic cleanup of expired rows.
- [ ] `backend/src/middleware/session.ts`: swap `memorystore` for the new store; `cookie.secure = NODE_ENV === 'production'`; keep `sameSite: 'lax'` (same-origin on Vercel). Remove `memorystore` from package.json.
- [ ] `backend/src/app.ts`: `app.set('trust proxy', 1)` — Vercel terminates TLS at the edge; without this, `cookie.secure` suppresses Set-Cookie entirely and ALL production auth breaks.
- [ ] Login/logout/me/test-login API behavior unchanged (auth.spec.ts must pass unmodified).

### Phase 5: Test infrastructure (be-coder)
- [ ] `backend/src/test/helpers.ts`: `import { client }`; `resetDatabase()` async — PRAGMA foreign_keys OFF (standalone execute) → deletes via `client.batch([...], 'write')` INCLUDING `DELETE FROM sessions` → PRAGMA ON (standalone) → `await runDataMigration()`. `insertAdresseWithoutCoords` async + guarded `Number(lastInsertRowid)`.
- [ ] Exhaustive call-site conversion (every site gets `await`, enclosing hooks become async):
  - `resetDatabase()`: admin-geocoding.spec.ts:42,49; adressen-coords.spec.ts:37,43; firmen-crud.spec.ts:36. (auth.spec.ts and geocoding-rate-limit.spec.ts have NO resetDatabase/sqlite usage — leave untouched.)
  - `insertAdresseWithoutCoords()`: 7+ sites in admin-geocoding.spec.ts (108, 150×3, 182, 208, 234, 263, 291).
  - admin-geocoding.spec.ts direct sqlite: `clearAddresses()` (pragma+exec, lines 66–68), inline `DELETE FROM adresse WHERE id=?` cleanups (112, 162, 213, 244, 280, 340, 367), inline INSERT with lastInsertRowid (~334).
  - adressen-coords.spec.ts: `createTestRow()` helper (inline INSERT, ~230–235) becomes async; its 2 callers (~240, 244) awaited; other inline sqlite sites (~139–143).
- [ ] `backend/src/test/globalSetup.ts`: pass `TURSO_DATABASE_URL` through to the spawned backend env (default file URL fine). Cross-process file DB acceptable with `workers: 1`; if flaky, add `PRAGMA journal_mode=WAL` in `runMigrations()` guarded to file: URLs only.

### Phase 6: Vercel packaging (be-coder)
- [ ] NEW `api/index.ts` (repo root): import `app` from `backend/src/app` (already exports app without listen). Cold-start init MUST be a cached Promise, not a boolean (race-safe), and avoid top-level-await/CJS ambiguity (no root package.json):
  ```ts
  const initPromise = (async () => { await runMigrations(); await runDataMigration(); })();
  export default async function handler(req, res) { await initPromise; return app(req, res); }
  ```
- [ ] NEW `api/tsconfig.json` extending backend config (api/ is outside backend rootDir — otherwise never type-checked).
- [ ] NEW `vercel.json` (modern config): `"buildCommand": "cd frontend && npm ci && npx ng build"`, `"outputDirectory": "frontend/dist/frontend/browser"`, `"functions": { "api/index.ts": { "runtime": "nodejs22.x" } }` (matches .nvmrc; Vercel default may be older), `rewrites`: `/api/:path*` → `/api/index`, then SPA fallback `/((?!api/).*)` → `/index.html`. Static files are served before rewrites (hashed chunks, /leaflet/ assets unaffected).
- [ ] `frontend/angular.json`: explicit `"outputPath": { "base": "dist/frontend", "browser": "browser" }` (object form — makes the vercel.json contract explicit).
- [ ] `start.sh` lines ~168–171: remove the `better-sqlite3` native-rebuild check (package gone after migration).
- [ ] No frontend code changes: services use relative `/api/...`, `withCredentials: true` interceptor global, `<base href="/">` present.
- [ ] NOTES: (a) `address-map-view` branch (leaflet/Karte) not yet merged to `main` — deployment ships whatever `main` has; merge that branch via its own PR. (b) First deploy against an empty Turso DB seeds the demo fixture (same as local) — intended for this lab app.

### Phase 7: Frontend CI test config (fe-coder)
- [ ] `frontend/angular.json` test target: add `ci` configuration — `"watch": false, "progress": false, "browsers": "ChromeHeadlessNoSandbox"`. The `@angular/build:karma` builder's built-in config ALREADY defines the `ChromeHeadlessNoSandbox` launcher (--no-sandbox); do NOT create a karma.conf.js (it would override the built-in config and require re-declaring all plugins).
- [ ] `frontend/package.json`: `"test:ci": "ng test --configuration=ci"`.

### Phase 8: GitHub Actions (be-coder)
- [ ] NEW `.github/workflows/deploy.yml`. Every step sets `working-directory:` (backend/ or frontend/) — there is no root package.json.
  - Job `test` (on `pull_request` + `push` to `main`): checkout; setup-node with `node-version-file: .nvmrc` and `cache: npm`, `cache-dependency-path` listing BOTH lockfiles; backend: `npm ci`, `npx tsc --noEmit`, `npx tsc --noEmit -p ../api/tsconfig.json`, `npx playwright test` (API tests only — no browser install step); frontend: `npm ci`, `npm run test:ci`, `npx ng build`.
  - Job `deploy` (`needs: test`, `if: github.ref == 'refs/heads/main' && github.event_name == 'push'`): `npx vercel pull --yes --environment=production --token=$VERCEL_TOKEN`, `npx vercel build --prod --token=$VERCEL_TOKEN`, `npx vercel deploy --prebuilt --prod --token=$VERCEL_TOKEN`; env `VERCEL_ORG_ID`/`VERCEL_PROJECT_ID` from secrets.
  - No PR preview deployments.

### Phase 9: Verification
- [ ] `cd backend && npx tsc --noEmit` + api tsconfig check — zero errors.
- [ ] Backend Playwright suite green (file: DB, no env vars). Cascade-delete test green (FK canary).
- [ ] Frontend Karma suite green (`npm run test:ci`).
- [ ] `cd frontend && npx ng build` green.
- [ ] `./start.sh` boots both processes; manual smoke: login, list Firmen, dashboard.

## Tests

### Existing suites (regression net)
- [ ] Full backend Playwright suite passes unchanged in behavior (auth, CRUD incl. cascade deletes, geocoding, rate-limit specs).
- [ ] Full frontend Karma suite passes.

### New tests
- [ ] `backend/src/test/sessions-persistence.spec.ts` (be-test-coder): session survives across requests; logout destroys the DB row; expired session rejected; sessions table row created on login.

### Edge cases to verify in implementation
- [ ] Guarded `Number(lastInsertRowid)` at every create site (bigint|undefined).
- [ ] Empty search params in findAll (args `[size, offset]`).
- [ ] Error handler returns `{ status, message, timestamp, fieldErrors }` for async throws (asyncHandler path).
- [ ] Cold-start initPromise in `api/index.ts` (no re-init on warm invocations; concurrent first requests await the same promise).

## Risks
- R1: PRAGMA foreign_keys durability — mitigated by the no-`client.transaction()` constraint; cascade test is the canary.
- R2: Vercel functions have read-only FS — file: default is local/CI only; production REQUIRES Turso + SESSION_SECRET + CORS_ORIGINS env vars in Vercel settings (see Environment Contract).
- R3: Concurrent cold-start seeding TOCTOU on empty Turso DB — accepted (COUNT guard; idempotent DDL).
- R4: drizzle-orm 0.41 with current @libsql/client — verified via tsc + full suite.
- R5: Cross-process file DB in tests — mitigated by `workers: 1`; WAL fallback (file: URLs only).
