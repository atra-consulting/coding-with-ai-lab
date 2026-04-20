# Implementation Plan: ADDRESS-GEOCODING

PRD: `docs/prds/PRD-ADDRESS-GEOCODING.md`

## Test Commands

- Backend: `cd backend && npx playwright test`
- Frontend: `cd frontend && npx ng test --watch=false --browsers=ChromeHeadless`
- Typecheck (backend): `cd backend && npx tsc --noEmit`
- Build (frontend): `cd frontend && npx ng build`

## Phases

The plan runs in three ordered phases. Commit after each phase. Phase review catches issues early.

- **Phase 1 — Backend data surface**: Zod schema, `adresseService` DTO exposure, `create`/`update` semantics. No geocoding logic yet. Output: `/api/adressen/*` now returns lat/long and round-trips them.
- **Phase 2 — Backend geocoding + admin endpoint**: `requireRole` middleware, `geocodingService`, `routes/admin.ts`, app wiring.
- **Phase 3 — Frontend**: `Adresse` model update, role guard, sidebar filtering, admin page with confirmation modal.
- **Phase 4 — Tests**: backend Playwright + frontend Jasmine. After Phases 1–3. Then review phase.

## Context already verified (do NOT re-do in coding phase)

- `adresse` table schema and DDL already have `latitude REAL` / `longitude REAL` in both `schema.ts` and `migrate.ts`.
- Fixture JSON already has coordinates; fixture loading uses raw SQL, not `adresseService.create()`.
- `ForbiddenError` (403) and `ConflictError` (409) already exist in `backend/src/utils/errors.ts`.
- Global `errorHandler.ts` already maps both to the standard response shape.
- **Backend test infrastructure does NOT exist yet.** No `backend/src/test/` directory, no `backend/playwright.config.ts`. This is the FIRST test in the repo. Phase 4 must scaffold the config.
- Backend user type `CrmUser` uses `roles: string[]` (English) — confirmed at `backend/src/config/users.ts:15`.
- Frontend: no global HTTP timeout interceptor. No role guard. `NavItem` has no role/permission field.
- Frontend user model: `BenutzerInfo` with `rollen: string[]` (German field name — different from backend on purpose).
- Frontend current user accessor: `authService.currentUser()` — a Signal.
- Frontend confirmation dialog `ConfirmDialogComponent` exists at `frontend/src/app/shared/components/confirm-dialog/confirm-dialog.component.ts`. It hardcodes the confirm button to `btn btn-danger`. To use it for a non-destructive "Fortfahren" action, F9 below extends it with an optional `confirmButtonClass` property.
- Routes use `loadChildren` + feature-level `<feature>.routes.ts` files (inspected `app.routes.ts`). The plan creates `admin.routes.ts` accordingly.
- `authGuard` is a plain `CanActivateFn` (no factory). `roleGuard` must use a factory pattern (it takes arguments), with `inject()` calls placed inside the returned `CanActivateFn` body — NOT in the outer factory.

---

## Phase 1 — Backend data surface

### B1. Extend `AdresseCreateSchema` with coordinate fields
- [ ] file: `backend/src/utils/validation.ts`
- [ ] Add `latitude: z.number().min(-90).max(90).optional().nullable()` to `AdresseCreateSchema`.
- [ ] Add `longitude: z.number().min(-180).max(180).optional().nullable()` in the same style.
- [ ] `AdresseCreateDTO` (the `z.infer` type) gains both fields automatically.
- [ ] This is a prerequisite for B2 and B3.

### B2. Expose lat/long in `AdresseDTO`
- [ ] file: `backend/src/services/adresseService.ts`
- [ ] Add `latitude: number | null` and `longitude: number | null` to the `AdresseDTO` interface.
- [ ] Add the same fields to the `AdresseRow` interface.
- [ ] In `BASE_QUERY`, extend SELECT with `a.latitude, a.longitude` (append after `a.country` in the address column list).
- [ ] In `toDTO()`, add `latitude: row.latitude` and `longitude: row.longitude` to the returned object literal.
- [ ] Pre-existing gap (DO NOT FIX HERE): `firmaService` selects `typ` on address subquery, but `AdresseRow`/`AdresseDTO` don't expose `typ`. Leave it alone.

### B3. `create()` persists lat/long
- [ ] file: `backend/src/services/adresseService.ts`
- [ ] In `create()`, add `latitude, longitude` to the INSERT column list.
- [ ] Extend `.run(...)` bindings with `dto.latitude ?? null`, `dto.longitude ?? null`. `??` is correct here — no previous row to preserve; absent means "store null".

### B4. `update()` preserves lat/long when DTO key absent
- [ ] file: `backend/src/services/adresseService.ts`
- [ ] Current `update()` calls `this.findById(id)` only for the 404 guard. Capture the return: `const current = this.findById(id);`
- [ ] Add `latitude=?, longitude=?` to the UPDATE SET clause.
- [ ] For coordinate binds, use an EXPLICIT `undefined` check (NOT `??`):
  - `latitude` bind: when `dto.latitude` is `undefined`, use `current.latitude`; otherwise use `dto.latitude`.
  - Same for `longitude`.
- [ ] This handles the three REQ-002 cases:
  - key absent → preserve
  - key present, value null → overwrite to null
  - key present, value numeric → overwrite to number
- [ ] `AdresseDTO` has lat/long after B2, so `current.latitude` is type-safe.

### Phase 1 commit
- [ ] Commit: `feat: Expose lat/long in AdresseDTO and preserve on update. ADDRESS-GEOCODING` (with `PRD:` footer).
- [ ] Phase 1 review (be-reviewer, db-reviewer in parallel). Apply findings. Commit fixes if any.

---

## Phase 2 — Backend geocoding + admin endpoint

### B5. Add `requireRole` middleware
- [ ] file: `backend/src/middleware/auth.ts`
- [ ] Import `ForbiddenError` from `../utils/errors.js`.
- [ ] Export factory: `requireRole(...roles: string[]): RequestHandler`.
- [ ] Returned handler:
  - Reads `req.currentUser` (populated by `requireAuth`).
  - If undefined → `next(new ForbiddenError('Zugriff verweigert'))`.
  - Uses `roles.some(r => req.currentUser!.roles.includes(r))`; if false → same `ForbiddenError`.
  - Else `next()`.
- [ ] Never calls `res.status(...)`. All paths go through `next(err)`.
- [ ] Always chained after `requireAuth` at call sites.

### B6. Create `geocodingService.ts`
- [ ] file: `backend/src/services/geocodingService.ts` (new)
- [ ] Module-level state:
  - `let batchInProgress = false`
  - `const NOMINATIM_BASE_URL = process.env.NOMINATIM_BASE_URL ?? 'https://nominatim.openstreetmap.org'`
  - `const USER_AGENT = 'CRM-Lab/1.0 (https://github.com/atra-consulting/coding-with-ai-lab)'`
  - `const sleepMs` resolved from `process.env.GEOCODING_SLEEP_MS`: parse with `Number.parseInt`. Guard against `NaN` by falling back to the default 3000 when `Number.isFinite` is false. When `process.env.NODE_ENV === 'production'`, apply `Math.max(1000, parsedValue)` so production cannot go below 1 req/sec. Outside production, allow 0 (for tests).
- [ ] Private helper: `sleep(ms)` wrapping `setTimeout` in a Promise.
- [ ] Private type `GeocodeCandidate`: `{ id, street, houseNumber, postalCode, city, country, latitude, longitude }` (all nullable where applicable).
- [ ] Export `geocodeAdresse(adresse)` → `Promise<{ latitude: number; longitude: number } | null>`:
  - Build Nominatim query: `street` = `"<houseNumber> <street>"` if both present, else whichever; plus `postalcode`, `city`, `country`, `format=json`, `limit=1`.
  - URL: `${NOMINATIM_BASE_URL}/search?<querystring>` (encode with `URLSearchParams`).
  - `fetch(url, { headers: { 'User-Agent': USER_AGENT }, signal: AbortSignal.timeout(10_000) })`.
  - Non-ok HTTP → throw typed error with status code in message.
  - `await res.json()` inside try/catch; non-array result OR parse error → throw typed error.
  - Empty array → return `null` (not found — caller counts as `failed`).
  - Extract `lat`/`lon` via `parseFloat`; `NaN` → throw typed error.
  - Return `{ latitude, longitude }`.
- [ ] Export `runGeocodingBatch({ force }): Promise<{ total, succeeded, failed, skippedInsufficientData }>`:
  - If `batchInProgress`, throw `new ConflictError('Geokodierung läuft bereits')`.
  - Set `batchInProgress = true` in `try { ... } finally { batchInProgress = false; }`.
  - Fetch candidates via one of two prepared statements (per D6 SELECT below).
  - Prepare the narrow update statement ONCE before the loop: `UPDATE adresse SET latitude = ?, longitude = ?, updatedAt = ? WHERE id = ?`.
  - For each row (sequential `for` loop, not `forEach`):
    - If both `city` and `postalCode` are null/empty string: increment `skippedInsufficientData`, `console.error` with id + reason, continue (do NOT sleep, do NOT call Nominatim).
    - If not the first non-skipped iteration: `await sleep(sleepMs)` BEFORE the call (prevents tail sleep).
    - `await geocodeAdresse(row)` inside try/catch:
      - Non-null result → `stmt.run(lat, long, new Date().toISOString(), row.id)`; increment `succeeded`.
      - `null` result → increment `failed`; `console.error` "not found" + id.
      - Thrown error → increment `failed`; `console.error` with id + err.message.
  - After the loop, `console.info` the summary.
  - Return `{ total, succeeded, failed, skippedInsufficientData }`.
- [ ] Candidate SELECTs (D6):
  - Default (`!force`): `SELECT id, street, houseNumber, postalCode, city, country, latitude, longitude FROM adresse WHERE latitude IS NULL OR longitude IS NULL ORDER BY id ASC`
  - Force: same SELECT without the WHERE clause.
  - Comment above the query: no index on `(latitude, longitude)` is needed — the `adresse` table is small (tens of rows), so a full scan is negligible.
- [ ] Imports: `sqlite` from `'../config/db.js'`, `ConflictError` from `'../utils/errors.js'`.
- [ ] No new npm dependency. Node 20 built-in `fetch`.

### B7. Create `routes/admin.ts`
- [ ] file: `backend/src/routes/admin.ts` (new)
- [ ] `express.Router()`.
- [ ] `POST /geocode-addresses` with chain: `requireAuth, requireRole('ADMIN'), handler`.
- [ ] Handler:
  - Documenting comment per REQ-008: synchronous blocking, proxy timeout implications.
  - Parse `force` from query: `req.query.force === 'true'`.
  - `await runGeocodingBatch({ force })` inside try/catch.
  - On success → `res.json(result)`.
  - On any thrown error → `next(err)`. The global error handler converts `ConflictError` to 409 and `ForbiddenError` to 403 in the standard shape.
- [ ] Imports: `Router`, `Request`, `Response`, `NextFunction` from `express`; `requireAuth`, `requireRole` from `'../middleware/auth.js'`; `runGeocodingBatch` from `'../services/geocodingService.js'`.
- [ ] Default export the router.

### B8. Register admin router
- [ ] file: `backend/src/app.ts` (confirm exact file by inspection; the real mount file in this project wires the other routers here).
- [ ] `import adminRouter from './routes/admin.js';`
- [ ] `app.use('/api/admin', adminRouter);` before `app.use(errorHandler)`.

### Phase 2 commit
- [ ] Commit: `feat: Add admin Nominatim geocoding endpoint. ADDRESS-GEOCODING` (with `PRD:` footer).
- [ ] Phase 2 review (be-reviewer in parallel with db-reviewer). Apply findings. Commit fixes if any.

---

## Phase 3 — Frontend

### F1. Update `Adresse` model with coordinates
- [ ] file: `frontend/src/app/core/models/adresse.model.ts`
- [ ] `Adresse` interface: add `latitude: number | null` and `longitude: number | null`.
- [ ] `AdresseCreate` interface: add `latitude?: number | null` and `longitude?: number | null` (optional, nullable).
- [ ] Verify no build breakage in existing list/detail/form components that consume `Adresse`.

### F2. Add `GeocodeResult` model
- [ ] file: `frontend/src/app/core/models/geocode-result.model.ts` (new)
- [ ] `export interface GeocodeResult { total: number; succeeded: number; failed: number; skippedInsufficientData: number; }`

### F3. Add role guard
- [ ] file: `frontend/src/app/core/guards/role.guard.ts` (new)
- [ ] Pattern: **factory** returning `CanActivateFn` (different from `auth.guard.ts`, which is a plain `CanActivateFn` with no arguments).
- [ ] Signature: `export const roleGuard = (...requiredRoles: string[]): CanActivateFn => () => { ... }`
- [ ] **Critical**: `inject(AuthService)` and `inject(Router)` MUST be called inside the returned inner function (the one matching `CanActivateFn`), NOT in the outer factory. The outer factory runs once at module-load time, outside Angular's injection context, and `inject()` there throws `NG0203`.
- [ ] Read `authService.currentUser()` (Signal call).
- [ ] Returns true if user non-null AND `requiredRoles.some(r => user.rollen.includes(r))`.
- [ ] Otherwise `router.navigate(['/dashboard'])` and return `false`.

### F4. Extend sidebar with role filtering
- [ ] files: `frontend/src/app/layout/sidebar/sidebar.component.ts` and `sidebar.component.html`
- [ ] Add optional `requiredRole?: string` to the `NavItem` interface.
- [ ] `SidebarComponent`:
  - Add `import { AuthService } from '../../core/services/auth.service';` (path per existing structure; confirm relative path during coding).
  - `private authService = inject(AuthService);` (AuthService is providedIn root; no imports array entry needed).
- [ ] Add helpers:
  - `hasRole(role: string): boolean { return this.authService.currentUser()?.rollen.includes(role) ?? false; }`
  - `visibleItems(items: NavItem[]): NavItem[] { return items.filter(i => !i.requiredRole || this.hasRole(i.requiredRole)); }` — used to determine whether a section has any visible items.
- [ ] Template (two filtering layers):
  - Wrap the whole section (header + `<ul>`) with `@if (visibleItems(section.items).length > 0)` so a section with no visible items (e.g., "Administration" for a non-admin) disappears entirely — no orphan header.
  - Inside the `@for` item loop, keep an `@if (!item.requiredRole || hasRole(item.requiredRole))` on each `<li>` so mixed-visibility sections still hide individual gated items.

### F5. Add `AdminService`
- [ ] file: `frontend/src/app/features/admin/admin.service.ts` (new directory)
- [ ] `@Injectable({ providedIn: 'root' })`.
- [ ] `private http = inject(HttpClient);`
- [ ] `geocodeAddresses(force = false): Observable<GeocodeResult>`:
  - If `force === true`: POST with `params: new HttpParams().set('force', 'true')`.
  - Else: POST with no params.
  - URL: `/api/admin/geocode-addresses`.
  - Body: `{}` (empty object).
- [ ] Import `GeocodeResult`.

### F6. Add `AdminGeocodingComponent`
- [ ] files: `frontend/src/app/features/admin/admin-geocoding.component.ts` and `.html` and `.scss` (new)
- [ ] Standalone component.
- [ ] Imports: common Angular, `NgbModal` from `@ng-bootstrap/ng-bootstrap`. Inject via `inject(NgbModal)` and `inject(AdminService)`.
- [ ] State (plain fields, matching existing component style):
  - `running = false`
  - `result: GeocodeResult | null = null`
  - `errorMessage: string | null = null`
  - `errorStatus: number | null = null`
- [ ] Method `startGeocode()`:
  1. Open confirmation: `const modalRef = this.modal.open(ConfirmDialogComponent);` then set on `modalRef.componentInstance`: `title = 'Geokodierung starten'`, `message = 'Dieser Vorgang kann mehrere Minuten dauern. Bitte nicht den Browser-Tab schließen. Fortfahren?'`, `confirmText = 'Fortfahren'`, `confirmButtonClass = 'btn btn-primary'` (this property is added to `ConfirmDialogComponent` in F9 so the confirm button renders in primary color, not the default destructive red).
  2. `try { await modalRef.result } catch { return; }` — user dismissed.
  3. Reset state: `running = true; result = null; errorMessage = null; errorStatus = null;`.
  4. `this.adminService.geocodeAddresses().subscribe({ next, error, complete })`.
  5. `next(res)`: `this.result = res;`.
  6. `error(err: HttpErrorResponse)`: `this.errorStatus = err.status; this.errorMessage = err.error?.message ?? 'Vorgang fehlgeschlagen. Bitte später erneut versuchen.';`, `running = false`.
  7. `complete()`: `running = false;` (only fires after `next`; error path sets `running` itself).
- [ ] Template:
  - Bootstrap card. `card-header`: "Adressen geokodieren".
  - `card-body`:
    - `<p>` German explanation of the action.
    - `<button class="btn btn-primary" [disabled]="running" (click)="startGeocode()">Koordinaten ermitteln</button>`.
    - `@if (running)` → `<span class="spinner-border spinner-border-sm ms-2" role="status"><span class="visually-hidden">Läuft…</span></span><span class="ms-2" aria-hidden="true">Läuft…</span>`. The visually-hidden text inside `role="status"` gives screen readers the announcement; the visible text is decorative.
    - `@if (result)` → `<div class="alert alert-success mt-3" role="alert">` listing the four counters with German labels (Gesamt, Erfolgreich, Fehlgeschlagen, Übersprungen).
    - `@if (errorMessage)` → `<div class="alert alert-danger mt-3" role="alert">` showing `errorStatus` and `errorMessage`.

### F7. Create `admin.routes.ts` and register in `app.routes.ts`
- [ ] file: `frontend/src/app/features/admin/admin.routes.ts` (new)
  - Export `ADMIN_ROUTES: Routes` with one child:
    ```
    {
      path: 'geocoding',
      canActivate: [roleGuard('ADMIN')],
      loadComponent: () =>
        import('./admin-geocoding.component').then(m => m.AdminGeocodingComponent),
    }
    ```
  - Import `roleGuard` from `../../core/guards/role.guard`.
- [ ] file: `frontend/src/app/app.routes.ts`
  - Add entry under the `authGuard`-protected `children` array, matching the existing `loadChildren` pattern used for all other feature areas:
    ```
    { path: 'admin', loadChildren: () => import('./features/admin/admin.routes').then(m => m.ADMIN_ROUTES) },
    ```
  - Placement: alongside `firmen`, `adressen`, etc.
- [ ] Rationale for the nested pattern: every existing feature uses this structure; flat `loadComponent` directly in `app.routes.ts` would be inconsistent and harder to extend if more admin pages get added later.

### F8. Add sidebar item
- [ ] file: `frontend/src/app/layout/sidebar/sidebar.component.ts`
- [ ] Import `faUserShield` from `@fortawesome/free-solid-svg-icons` (fallback to `faLock` if unavailable — confirm by checking existing imports).
- [ ] Add a `NavSection` titled "Administration" with one item:
  - label: "Adressen geokodieren"
  - route: "/admin/geocoding"
  - icon: the imported icon
  - `requiredRole: 'ADMIN'`

### F9. Extend `ConfirmDialogComponent` with `confirmButtonClass`
- [ ] file: `frontend/src/app/shared/components/confirm-dialog/confirm-dialog.component.ts`
- [ ] Add public property: `confirmButtonClass = 'btn btn-danger';` (default preserves current visual for existing destructive confirmations).
- [ ] In the template, replace the hardcoded `class="btn btn-danger"` on the confirm button with `[class]="confirmButtonClass"`.
- [ ] Verify no existing callers rely on the default class (grep usages). They don't need to change — the default is preserved — but confirm no test asserts `btn-danger` literally.
- [ ] Admin geocoding page (F6) overrides this to `'btn btn-primary'` so "Fortfahren" renders in the semantically correct primary color.

### Phase 3 commit
- [ ] Commit: `feat: Add admin geocoding page with role guard and sidebar entry. ADDRESS-GEOCODING` (with `PRD:` footer).
- [ ] Phase 3 review (fe-reviewer, ui-reviewer in parallel). Apply findings. Commit fixes if any.

---

## Phase 4 — Tests

### T0. Backend Playwright scaffold (no tests exist yet)
- [ ] file: `backend/playwright.config.ts` (new)
  - Set `testDir: './src/test'`.
  - Set `fullyParallel: false` (tests mutate the single SQLite DB).
  - Set `workers: 1`.
  - Configure `globalSetup: './src/test/globalSetup.ts'`.
  - Set `use.baseURL: 'http://localhost:7070'` (or the port the backend listens on — confirm by reading `backend/src/index.ts`).
- [ ] file: `backend/src/test/globalSetup.ts` (new)
  - Starts a local Express (or `http.createServer`) stub on an ephemeral port with a `/search` handler that serves canned Nominatim JSON based on an in-process registry. Tests push expected responses into the registry before making requests.
  - Writes `process.env.NOMINATIM_BASE_URL = 'http://localhost:<port>'` before any test worker imports the backend app.
  - Writes `process.env.GEOCODING_SLEEP_MS = '0'`.
  - Boots the backend app in-process (imports `backend/src/app.ts` or launches `backend/src/index.ts` as a child process — pick one consistent with how the app is wired).
  - Returns a teardown function that stops the stub and the app.
- [ ] Optional helper file `backend/src/test/setup.ts` for DB reset between tests (delete non-fixture rows, or rerun migration + data migration against an in-memory SQLite).
- [ ] Add `"test:ci": "NOMINATIM_BASE_URL=... GEOCODING_SLEEP_MS=0 npx playwright test"` script in `backend/package.json` if the project convention allows — otherwise rely on `globalSetup` alone.

### T1. Backend Playwright API tests
- [ ] file: `backend/src/test/adressen-coords.spec.ts` (new)
- [ ] Test: `GET /api/adressen/:id` returns `latitude` and `longitude` fields on a seeded address (fixture has values).
- [ ] Test: `GET /api/adressen` list responses include coordinates on every item.
- [ ] Test: `POST /api/adressen` with valid `latitude`/`longitude` persists and returns them.
- [ ] Test: `POST /api/adressen` with `latitude: 9999` returns 400 and `fieldErrors` mentions `latitude`.
- [ ] Test: `PUT /api/adressen/:id` with body omitting `latitude` and `longitude` leaves previously-stored values intact (fetch before/after, compare).
- [ ] Test: `PUT /api/adressen/:id` with `latitude: null` sets stored value to null.

- [ ] file: `backend/src/test/admin-geocoding.spec.ts` (new)
- [ ] **Set up Nominatim stub**: small Express app (or `http.createServer`) launched in `test.beforeAll`, listening on an ephemeral port. Route `/search` returns canned JSON. Test file sets `process.env.NOMINATIM_BASE_URL = 'http://localhost:<port>'` and `process.env.GEOCODING_SLEEP_MS = '0'` before importing the backend app under test.
  - NOTE: existing Playwright tests in this repo import the app directly; confirm the bootstrap pattern and either set envs via `process.env` before imports, or via `playwright.config.ts` `use.env`.
- [ ] Test: admin user POST `/api/admin/geocode-addresses` → 200 with `{ total, succeeded, failed, skippedInsufficientData }`, all integers, invariant `total === succeeded + failed + skippedInsufficientData`. (Use normal equality in test code; no markdown concerns.)
- [ ] Test: non-admin (`user` account) POST → 403 with standard error shape (`status: 403`, `message`, `timestamp`).
- [ ] Test: two near-simultaneous POSTs (`Promise.all([post, post])`) → one returns 200, one returns 409.
- [ ] Test: stub returns HTTP 500 → that address counted in `failed`, not `succeeded`.
- [ ] Test: stub returns empty array `[]` → counted in `failed`.
- [ ] Test: stub returns malformed HTML body → counted in `failed`.
- [ ] Test: stub's TCP connection is never accepted (close the port mid-test, or configure the stub to drop) → request times out via `AbortSignal.timeout(10_000)`, counted in `failed`. Keep test timeout slightly above 10s.
- [ ] Test: address with no city AND no postalCode → counted in `skippedInsufficientData`, stub NOT called for that row (spy on stub).
- [ ] Test: `?force=true` re-geocodes rows with existing coordinates (seed two with coords, stub returns new values, verify both updated).
- [ ] Test: default (no `force`) skips rows with existing coordinates (seed a row, verify stub not called for it).
- [ ] After each test that mutates the DB, reset state (use the setup helper from T0).

- [ ] file: `backend/src/test/geocoding-rate-limit.spec.ts` (new, small focused unit-style test)
- [ ] Test: with `NODE_ENV=production` and `GEOCODING_SLEEP_MS=500`, the effective sleep is 1000 ms (production floor holds). Uses a custom `AsyncLocalStorage` or injected clock; simplest: measure wall-clock time of two sequential stubbed geocode calls and assert `elapsed >= 1000`. Reset the env and re-import the module between tests if module caching becomes a problem.
- [ ] Test: with `NODE_ENV=test` and `GEOCODING_SLEEP_MS=0`, two calls complete in under 100 ms.

### T2. Frontend Jasmine/Karma tests
- [ ] file: `frontend/src/app/core/guards/role.guard.spec.ts` (new)
- [ ] Test: returns `true` when current user has a required role.
- [ ] Test: returns `false` and navigates to `/dashboard` when user lacks the required role.
- [ ] Test: returns `false` when `currentUser()` is null.

- [ ] file: `frontend/src/app/layout/sidebar/sidebar.component.spec.ts` (extend existing spec or create)
- [ ] Test: item without `requiredRole` renders regardless of user roles.
- [ ] Test: item with `requiredRole: 'ADMIN'` renders only when user has ADMIN role.
- [ ] Test: item with `requiredRole: 'ADMIN'` hidden when current user has only `USER`.

- [ ] file: `frontend/src/app/features/admin/admin.service.spec.ts` (new)
- [ ] Test: `geocodeAddresses()` POSTs to `/api/admin/geocode-addresses` without `force` param.
- [ ] Test: `geocodeAddresses(true)` includes `force=true` query param.
- [ ] Setup: `provideHttpClient()` and `provideHttpClientTesting()` (Angular 21 current API; do NOT use the deprecated `HttpClientTestingModule`). Use `HttpTestingController` to assert outgoing requests.

- [ ] file: `frontend/src/app/features/admin/admin-geocoding.component.spec.ts` (new)
- [ ] Test: "Koordinaten ermitteln" button renders.
- [ ] Test: clicking the button opens the confirmation modal (mock `NgbModal`).
- [ ] Test: confirmed modal calls `AdminService.geocodeAddresses()` (mock `AdminService`).
- [ ] Test: dismissed modal does NOT call `AdminService`.
- [ ] Test: on successful response, `alert-success` renders with the four counters.
- [ ] Test: on 409 error, `alert-danger` renders with status 409 and the server message.
- [ ] Test: on network error (no body), `alert-danger` renders the German fallback message.
- [ ] Test: button `[disabled]` while `running`.

### Phase 4 commit
- [ ] Commit: `test: Add tests for address coordinates and admin geocoding. ADDRESS-GEOCODING` (with `PRD:` footer).
- [ ] Test review (be-test-reviewer, fe-test-reviewer in parallel). Apply findings. Commit fixes if any.

---

## Verification checklist (after all phases)

- [ ] `cd backend && npx tsc --noEmit` passes.
- [ ] `cd backend && npx playwright test` all pass.
- [ ] `cd frontend && npx ng build` succeeds.
- [ ] `cd frontend && npx ng test --watch=false --browsers=ChromeHeadless` all pass.
- [ ] Manual smoke (optional): `./start.sh --reset-db`, log in as admin, navigate to `/admin/geocoding`, click button, confirm modal, observe success alert.
