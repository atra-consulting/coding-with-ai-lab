# SPECS-testing.md — CRM Testing Approach

Testing for this project is split across two stacks: Playwright API tests for the backend and Jasmine/Karma unit tests for the frontend.

---

## Cross-references

- Endpoint details, route auth, error shapes → `SPECS-backend.md`
- Entity schemas, fixture row counts, SQLite quirks → `SPECS-database.md`
- Component behavior, service contracts, guard logic → `SPECS-frontend.md`
- Starting the app, ports, `start.sh` → `SPECS-infrastructure.md`

---

## Backend Tests — @playwright/test

### Framework and location

- **Runner:** `@playwright/test` 1.52 — the only backend test runner
- **Test directory:** `backend/src/test/` — directory and files exist; the first spec files have been written
- **Config:** `backend/playwright.config.ts` — exists at the repo root of the backend package
- **Base URL:** `http://localhost:7070`
- **Parallelism:** `fullyParallel: false`, `workers: 1` — tests run serially to avoid SQLite write conflicts

### Run commands

```bash
cd backend && npx playwright test          # full suite
cd backend && npm test                     # alias (maps to "playwright test" in package.json)
cd backend && npx playwright test src/test/<file>.spec.ts   # single file
cd backend && npx playwright test -g "<test title>"          # targeted by title
```

### Global setup

`backend/src/test/globalSetup.ts` runs before the suite:
1. Starts an in-process Nominatim stub HTTP server on an ephemeral port. The stub exposes a `/search` endpoint (consumed by the backend) and a `/control` HTTP API so test worker processes can set stub behavior (`PUT /control`), reset it (`DELETE /control`), and read call counts (`GET /control/count`).
2. Kills any existing process on port 7070, then spawns the backend child process (`tsx src/index.ts`) with `NODE_ENV=test` and `NOMINATIM_BASE_URL` pointing to the stub.
3. Polls `GET /api/health` until the backend responds (30 s deadline).
4. Returns a teardown function that SIGTERM-kills the backend and closes the stub server.

The stub control URL is written to `process.env.STUB_CONTROL_URL` so worker processes can reach it.

### Authentication

#### Standard login (password-based)

POST `/api/auth/login` with `{ benutzername, passwort }`. On success, the server sets a `JSESSIONID` session cookie. Playwright's `APIRequestContext` stores the cookie automatically.

```ts
// helpers.ts — loginCtx()
const ctx = await playwrightRequest.newContext({ baseURL: 'http://localhost:7070' });
await ctx.post('/api/auth/login', { data: { benutzername: 'admin', passwort: 'admin123' } });
// ctx now carries the JSESSIONID cookie; reuse it across all tests in a describe block
```

#### Passwordless test-login helper

`POST /api/auth/test-login` accepts `{ benutzername }` with no password. It creates a valid session for the named user. Available only when `NODE_ENV !== 'production'`; returns 404 in production.

This endpoint is intended for test speed when the test cares about session state but not about the login flow itself. The standard login endpoint is used when the login flow is under test.

#### Session reuse pattern

Create one `APIRequestContext` per user role in `test.beforeAll`, log in once, and reuse the context across all tests in the suite. Dispose in `test.afterAll`.

```ts
let adminCtx: APIRequestContext;
let anonCtx: APIRequestContext;

test.beforeAll(async () => {
  adminCtx = await loginCtx('admin', 'admin123');  // helper from helpers.ts
  anonCtx = await playwrightRequest.newContext({ baseURL: BASE_URL });
});

test.afterAll(async () => {
  await adminCtx.dispose();
  await anonCtx.dispose();
});
```

### Authorization fixtures

Three hardcoded users (defined in `backend/src/config/users.ts`):

| Username | Password  | Roles   |
|----------|-----------|---------|
| admin    | admin123  | ADMIN   |
| user     | test123   | USER    |
| demo     | demo1234  | ADMIN   |

Roles are stored bare in `users.ts` (`ADMIN` / `USER`); the auth wire format prefixes them (`ROLE_ADMIN`). Only `user` lacks the ADMIN role — use it to test `requireRole('ADMIN')` 403 paths (e.g. `POST /api/admin/geocode-addresses`).

All three currently hold the full 7-permission set (`FIRMEN`, `PERSONEN`, `ABTEILUNGEN`, `ADRESSEN`, `AKTIVITAETEN`, `CHANCEN`, `BENUTZERVERWALTUNG`). When a new permission is added that not all users hold, test the 403 path with the user who lacks it. If no such user exists yet, document the gap in the test file rather than fabricating credentials.

### Shared helpers (`backend/src/test/helpers.ts`)

| Helper | Purpose |
|--------|---------|
| `loginCtx(benutzername, passwort)` | Creates a new `APIRequestContext` and logs in; returns the context with cookie. |
| `login(request, benutzername, passwort)` | Logs in on an existing context. |
| `resetDatabase()` | Deletes all rows in reverse FK order, then re-seeds from `fixture.json` via `runDataMigration()`. |
| `insertAdresseWithoutCoords(overrides?)` | Inserts an `adresse` row with null lat/lon; returns the new row id. |
| `setStubResponse(behavior, oneShot?)` | Sets the Nominatim stub behavior via HTTP PUT. |
| `clearStubOverrides()` | Resets stub to default success and clears call count. |
| `getStubCallCount()` | Returns how many times the stub's `/search` was called. |
| `resetStubCallCount()` | Resets the call count to zero. |

### SQLite quirks in tests

- **Dates:** stored and returned as ISO-8601 text strings. Assert with string equality, not `Date` equality.
- **Monetary values:** stored as REAL. Use `toBeCloseTo` for computed amounts where floating-point drift is possible.
- **better-sqlite3 is synchronous:** no `await` on raw DB calls inside helpers.
- **Foreign keys:** `PRAGMA foreign_keys = ON` is set on the connection in `config/db.ts`. The `resetDatabase()` helper temporarily disables it with `OFF` for the bulk delete, then re-enables it.

### Fixture row counts

Seeded by `backend/src/seed/fixture.json` when the database is empty. These are the counts in the fixture file (verified against the actual file):

| Entity      | Rows |
|-------------|------|
| Firma       | 25   |
| Abteilung   | 50   |
| Person      | 100  |
| Adresse     | 100  |
| Aktivitaet  | 75   |
| Chance      | 40   |

No Gehalt or Vertrag seed rows exist in the fixture.

### What to test (backend)

For every route added or changed in `backend/src/routes/*.ts`:

1. **Happy path** — valid input, expected status code, expected response shape
2. **Authorization** — unauthenticated request returns 401; wrong role/permission returns 403
3. **Validation** — missing required fields, invalid types, and boundary values return 400 with a `fieldErrors` object
4. **Not found** — unknown id returns 404 with the standard error body
5. **Side effects** — for write routes, verify the mutation actually persisted (re-fetch the record)

For services, test through the HTTP route boundary unless the service logic is too complex or isolated to reach that way.

### Test file conventions

- One file per route file: `backend/src/test/<entity>.spec.ts`
- Group with `test.describe`; set up contexts in `test.beforeAll`/`test.beforeEach`
- Use `test.step(...)` for multi-phase tests to make failure output readable
- One assertion per behavior; do not bundle unrelated `expect` calls in one `test` block
- Clean up created rows in `afterAll` — or call `resetDatabase()` in `beforeAll` and accept that the suite is mutation-safe only when run in isolation

### Error response shape

All error responses follow:
```json
{ "status": 404, "message": "...", "timestamp": "...", "fieldErrors": { } }
```
`fieldErrors` is present on 400 validation errors (keyed by field name). See `middleware/errorHandler.ts`.

### Pagination response shape

```json
{ "content": [...], "totalElements": 25, "totalPages": 3, "size": 10, "number": 0, "first": true, "last": false }
```
`number` is 0-indexed. See `SPECS-backend.md` for sort and pagination parameter details.

### Existing test files

| File | Routes covered |
|------|---------------|
| `auth.spec.ts` | POST `/api/auth/login`, GET `/api/auth/me`, POST `/api/auth/logout` |
| `firmen-crud.spec.ts` | GET/POST/PUT/DELETE `/api/firmen` and `/api/firmen/:id` |
| `admin-geocoding.spec.ts` | POST `/api/admin/geocode-addresses` (auth, batch logic, stub behavior) |
| `adressen-coords.spec.ts` | Address coordinate endpoints |
| `geocoding-rate-limit.spec.ts` | Geocoding rate-limit behavior |

---

## Frontend Tests — Jasmine / Karma

### Framework and location

- **Runner:** Jasmine 5 + Karma 6 (Angular CLI default via `@angular/build:karma` builder)
- **Config:** `frontend/tsconfig.spec.json` exists. `frontend/karma.conf.js` does **not** exist — the Angular build builder configures Karma directly from `angular.json` without a separate `karma.conf.js`.
- **Test files:** colocated with source — `foo.component.spec.ts` lives next to `foo.component.ts`

### Run commands

```bash
cd frontend && npx ng test                                               # watch mode (development)
cd frontend && npx ng test --watch=false --browsers=ChromeHeadless       # single CI run (preferred)
cd frontend && npm test                                                  # alias (maps to "ng test")
```

### What to test (frontend)

For every new **component**:
1. Component instantiates without errors (`expect(component).toBeTruthy()`)
2. Template renders the correct data for given inputs (`fixture.detectChanges()` + DOM query)
3. User interactions (click, form submit) trigger the expected service method or emit the expected output
4. `@if`/`@for` branches render correct content for each state (loading, data, empty, error)
5. Edit-mode forms populate via `patchValue()` when the route provides an `id` param

For every new **service**:
1. HTTP methods call the right URL with the right body/params — use `HttpTestingController`
2. Pagination index conversion is correct (NgbPagination is 1-indexed, backend is 0-indexed: component passes `this.currentPage - 1` to the service)
3. Error responses are surfaced/handled as documented

For every new **guard**:
1. Returns `true` when the user has the required permission or role
2. Redirects (and returns `false`) when permission is missing
3. Redirects when `currentUser` is null (unauthenticated)

### TestBed setup for standalone components

Angular 21 components are standalone by default. Tests import the component under test directly, not a module wrapper:

```ts
await TestBed.configureTestingModule({
  imports: [SidebarComponent],            // standalone component imports itself
  providers: [
    provideRouter([]),
    provideHttpClient(),
    provideHttpClientTesting(),
    { provide: AuthService, useValue: mockAuthService },
  ],
}).compileComponents();
```

Provide `HttpClientTestingModule` (or `provideHttpClient()` + `provideHttpClientTesting()`) for any component or service that makes HTTP calls. Never let real HTTP requests escape in unit tests.

### Dependency injection in tests

Angular 21 uses `inject()` inside components. Override dependencies via TestBed providers:

```ts
const userSignal = signal<BenutzerInfo | null>(null);
mockAuthService = { currentUser: userSignal };
{ provide: AuthService, useValue: mockAuthService }
```

For components using `inject()` that cannot be overridden by a provider, use `TestBed.overrideComponent`.

### Angular 21 template patterns

- Only `@if`, `@for`, `@switch` in templates — never `*ngIf`/`*ngFor`
- Every `@for` block requires a `track` expression
- Use `fakeAsync` + `tick()` for observables and timers; avoid real delays

### Key test locations

| Concern | Path |
|---------|------|
| Feature components | `frontend/src/app/features/<entity>/` |
| Models | `frontend/src/app/core/models/` |
| Services | `frontend/src/app/core/services/` |
| Guards | `frontend/src/app/core/guards/` |

### Existing spec files

| File | Covers |
|------|--------|
| `layout.service.spec.ts` | `LayoutService` (collapsed signal, localStorage persistence, toggle) |
| `role.guard.spec.ts` | `roleGuard` (allow with matching role, deny with wrong role, deny when null) |
| `sidebar.component.spec.ts` | `SidebarComponent` (render, permission filtering, collapse toggle) |
| `admin.service.spec.ts` | `AdminService` HTTP methods (`geocodeAddresses` with and without `force`) |
| `admin-geocoding.component.spec.ts` | `AdminGeocodingComponent` (UI interactions with admin service) |

### Code standards (both stacks)

- Strict TypeScript — no `any`
- One behavior per `it(...)` / `test(...)` block
- Descriptive describe/it text that reads as documentation
- Spies and mocks reset between tests (`afterEach`)
- For backend: clean up created rows in `afterAll` or mark the suite as relying on `resetDatabase()`
- For frontend: `afterEach(() => httpMock.verify())` to confirm no outstanding HTTP requests
