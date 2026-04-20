# PRD: Address Geocoding

## Source

Requested via /plan-and-do on 2026-04-20.

## Problem Statement

The CRM stores addresses (`adresse` table). A future map view needs latitude and longitude for each address. The DB columns already exist (`latitude REAL`, `longitude REAL`). The seed fixture already contains coordinates. But two gaps block progress:

1. `adresseService.ts` ignores `latitude` and `longitude`. The `/api/adressen/*` endpoints never return them. Clients cannot read coordinates via the API.
2. No geocoding mechanism exists. New addresses created through the UI have no coordinates. There is no way to populate them in bulk.

## Requirements

### REQ-001: Expose coordinates in AdresseDTO

`AdresseDTO` gains two new fields: `latitude: number | null` and `longitude: number | null`.

- `BASE_QUERY` in `adresseService.ts` SELECTs `a.latitude` and `a.longitude`.
- `toDTO()` maps both fields.
- `AdresseRow` interface includes both fields.
- All read endpoints (`findAll`, `listAll`, `findById`) return the fields.
- Priority: High.
- Acceptance: `GET /api/adressen/:id` response body contains `latitude` and `longitude` keys. Both are `null` when not set, numeric otherwise.

### REQ-002: Create and update preserve existing coordinates

`adresseService.create()` and `adresseService.update()` accept optional `latitude` and `longitude` in the body.

- **Create**: when the DTO provides values, persist them; otherwise store null. Range-validated per REQ-010.
- **Update — omission preserves**: if `latitude` is `undefined` in the DTO (key not present in body), the stored value is untouched. Same for `longitude`. This prevents plain address edits from silently erasing geocoded coordinates.
- **Update — explicit null overwrites**: if the DTO contains `latitude: null` (key present, value null), the stored value is set to null. This gives admins a way to clear bad coordinates.
- Implementation note: `update()` must NOT use `dto.latitude ?? null`. It must distinguish `undefined` (preserve) from `null` (overwrite). Two options are acceptable:
  - (a) Load the current row first; when `dto.latitude` is `undefined`, bind `currentRow.latitude`; otherwise bind `dto.latitude`.
  - (b) Build a dynamic UPDATE statement that omits unprovided columns.
- Priority: High.
- Acceptance:
  - POST body with `latitude`/`longitude` values stores them.
  - PUT body that omits both fields leaves existing values untouched.
  - PUT body with `latitude: null` sets the stored value to null.

### REQ-003: Admin-only geocoding endpoint

A new endpoint: `POST /api/admin/geocode-addresses`.

- Only users with role `ADMIN` may call it. Non-admin callers receive HTTP 403 via the global error handler (standard `{ status, message, timestamp, fieldErrors }` shape). No raw `res.status(403).json(...)` in the middleware.
- The endpoint iterates all `adresse` rows where `latitude IS NULL OR longitude IS NULL`. Default behavior — skips rows with coordinates already set.
- Optional query parameter `?force=true` iterates ALL rows (including ones with existing coordinates) and re-geocodes them. This is the recovery path for bad or stale coordinates.
- For each such address, it calls the Nominatim forward-geocode API.
- On success, it writes `latitude` and `longitude` to the row **via a narrow UPDATE statement** (`UPDATE adresse SET latitude=?, longitude=?, updatedAt=? WHERE id=?`) — not the full-row UPDATE used by `adresseService.update()`. This prevents the batch from overwriting other fields.
- On failure, it leaves the row unchanged.
- **Concurrency guard**: a module-level flag (or service-level mutex) prevents two jobs from running at once. If a job is already in progress, the endpoint returns HTTP 409 with a body explaining a job is running. Only one geocoding job can run per server process at a time.
- Priority: High.
- Acceptance:
  - Default call: previously null-coordinate addresses have coordinates if Nominatim returned a result.
  - `?force=true`: all addresses are re-geocoded regardless of existing coordinates.
  - Second concurrent call returns 409.
  - Non-admin call returns 403 via the standard error shape.

### REQ-004: Rate limiting between geocoding requests

The geocoding loop sleeps at least 3 seconds between consecutive Nominatim calls.

- The sleep must never drop below 1 second under any condition. This satisfies Nominatim's usage policy (max 1 req/sec).
- The sleep happens BEFORE each Nominatim call except the first, so an early abort doesn't leave an unnecessary tail sleep.
- **Test hook**: the geocoding service MUST expose a way to override the sleep duration for tests (e.g., a constructor parameter, exported config object, or environment variable `GEOCODING_SLEEP_MS` read at init time). Tests set this to `0` so the suite runs fast. Production code never sets it.
- Priority: High.
- Acceptance: Unit/integration test confirms the service waits ≥ 1 second between calls in the non-test configuration. Tests override the sleep to run quickly.

### REQ-005: Nominatim request format

Each Nominatim call uses forward geocoding with these query fields: `street` (combining street + houseNumber as `"<houseNumber> <street>"` when both present, else whichever exists), `postalcode`, `city`, `country`.

- The geocoding service skips an address if both `city` and `postalCode` are null/empty. A query without either is not usable. These skips increment `skippedInsufficientData`, NOT `failed`.
- The User-Agent header on every Nominatim request must be: `CRM-Lab/1.0 (https://github.com/atra-consulting/coding-with-ai-lab)`.
- The Nominatim base URL MUST be configurable via environment variable `NOMINATIM_BASE_URL` (default `https://nominatim.openstreetmap.org`). This lets tests point at a local stub server and lets future deployments self-host.
- Priority: High.
- Acceptance: Outbound HTTP request has correct query string, User-Agent header, and respects `NOMINATIM_BASE_URL`.

### REQ-006: Error handling per address

For each address lookup, the geocoding loop handles these error cases without aborting the whole batch:

- HTTP error from Nominatim (non-2xx response).
- Empty result array from Nominatim (address not found).
- Malformed response (non-JSON body, HTML error page, JSON missing expected fields).
- Network timeout. The fetch call MUST use `signal: AbortSignal.timeout(10_000)` so a stalled TCP connection times out after 10 seconds. Node's `fetch` does NOT honor a `timeout` option; the AbortSignal is the only correct way.
- Network error (DNS failure, connection reset, etc.).

On any error, the address row remains unchanged. The error is counted in `failed`. The loop continues with the next address. Each failure is logged to `console.error` with the address ID and the error reason so an admin can diagnose after the run.

- Priority: High.
- Acceptance: One bad address (HTTP 500, empty result, malformed JSON, or timeout) does not stop processing of subsequent addresses, and the failure is logged.

### REQ-007: Progress report in response body

The endpoint response returns a JSON summary with these fields:

- `total`: total number of addresses considered (all null-coordinate rows, or all rows if `force=true`).
- `succeeded`: count of rows written successfully.
- `failed`: count where Nominatim was called and failed (HTTP error, empty result, malformed response, timeout, network error).
- `skippedInsufficientData`: count skipped without calling Nominatim because city AND postalCode were both missing.

These are mutually exclusive. Invariant: `total` equals `succeeded` plus `failed` plus `skippedInsufficientData`.

- Priority: Medium.
- Acceptance: Response body contains all four integer fields. The invariant holds for every response.

### REQ-008: Synchronous execution with documented limit

The endpoint executes synchronously. It blocks until all addresses are processed.

- With the 3-second delay, N addresses take roughly N*3 seconds.
- Acceptable for the current data set (tens of addresses) and for dev/lab use with no reverse proxy.
- The route handler MUST include a code comment documenting the blocking behavior and the implication: any reverse proxy in front of the server needs its read timeout raised above the expected job duration, or the admin loses the response body while the job continues server-side.
- A future iteration may switch to 202 Accepted + a job-status endpoint. Out of scope here.
- Priority: Low.
- Acceptance: The endpoint returns only after all addresses are processed or failed. The route handler carries the documenting comment.

### REQ-009: Frontend admin geocoding action

The frontend provides an action that only admin users can see and trigger.

- **Role-based guard**: a NEW `roleGuard(...roles)` function in `frontend/src/app/core/guards/` gates the route. It checks `authService.currentUser()?.rollen` (or whatever the model calls the roles field) for `ADMIN`. If absent, it redirects to the dashboard or shows a 403 state. The existing codebase has no role guard today; this guard is a prerequisite, not optional. Do NOT use `permissionGuard` — no `permissionGuard` exists, and permission-based gating would expose the page to non-admins since all three users share the same permissions.
- **Sidebar role filtering**: extend the `NavItem` interface in `SidebarComponent` with optional `requiredRole?: string`. Add an `@if` in the sidebar template that hides items whose `requiredRole` the current user doesn't have. Items without `requiredRole` stay visible to everyone.
- An admin-only page exists at route `/admin/geocoding`. It hosts a button and a result area.
- Button label (German): `Koordinaten ermitteln`. Sidebar label (German): `Adressen geokodieren`.
- Before POSTing, the page shows a Bootstrap confirmation modal: `Dieser Vorgang kann mehrere Minuten dauern. Bitte nicht den Browser-Tab schließen. Fortfahren?` Proceed only on user confirmation.
- On confirmation, the frontend POSTs to `/api/admin/geocode-addresses`. The HTTP client timeout for this call must be raised or disabled (the Angular default is no timeout; if `HttpClient` is wrapped with a default timeout interceptor, bypass it for this request).
- While the request is in flight, the button is disabled and shows a Bootstrap spinner next to a `Läuft…` label.
- On success, the page renders a Bootstrap `alert-success` with the four counters.
- On HTTP failure (network drop, 409 conflict, 500 server error), the page renders a Bootstrap `alert-danger` showing the status code and either the server-provided error message or a generic German fallback (`Vorgang fehlgeschlagen. Bitte später erneut versuchen.`).
- Non-admin users do not see the sidebar item and cannot reach the route.
- Priority: Medium.
- Acceptance:
  - Admin user sees the sidebar item and can complete the flow.
  - Non-admin user does not see the sidebar item, and navigating to `/admin/geocoding` redirects them away.
  - Confirmation modal appears before the POST.
  - Success renders counters; failure renders the error alert.

### REQ-010: Validate lat/long ranges in the Zod schema

`AdresseCreateSchema` in `backend/src/utils/validation.ts` gains two optional fields:

- `latitude`: nullable number, `min(-90)`, `max(90)`.
- `longitude`: nullable number, `min(-180)`, `max(180)`.

Both are optional (`.optional()`). Out-of-range values produce a 400 response with `fieldErrors`.

- Priority: Medium.
- Acceptance: POST with `latitude: 9999` returns 400. POST with `latitude: 52.5`, `longitude: 13.4` succeeds.

## Special Instructions

None.

## Implementation Approach

### New: `backend/src/services/geocodingService.ts`

- Wraps all Nominatim HTTP calls.
- Reads `NOMINATIM_BASE_URL` from environment (default `https://nominatim.openstreetmap.org`).
- Reads `GEOCODING_SLEEP_MS` from environment (default `3000`, minimum enforced at `1000`).
- Exports `geocodeAdresse(adresse)` returning `{ latitude, longitude }` or `null` (not-found / unusable query).
- Throws typed errors on HTTP failure, malformed response, or timeout, so the calling loop can count them as `failed`.
- Uses Node 20 built-in `fetch` with `signal: AbortSignal.timeout(10_000)`.
- Sets `User-Agent: CRM-Lab/1.0 (https://github.com/atra-consulting/coding-with-ai-lab)` on every call.
- Exports a `runGeocodingBatch({ force })` function that enforces the 3-second sleep between calls, skips addresses missing city+postalCode, calls `geocodeAdresse`, writes results via a narrow UPDATE, and returns `{ total, succeeded, failed, skippedInsufficientData }`.
- Internally uses a module-level `let batchInProgress = false` flag. Throws a typed `ConflictError` if invoked while a batch is already running. The `finally` block always resets the flag.

### New: `backend/src/routes/admin.ts`

- Mounted at `/api/admin` in `backend/src/index.ts` (or the app wiring file).
- Route: `POST /geocode-addresses`, with `?force=true|false` query param.
- Gated by `requireAuth` followed by a new `requireRole('ADMIN')`.
- Calls `runGeocodingBatch({ force })`. Returns its summary as JSON. Catches `ConflictError` and returns 409 with the standard error shape via `next(err)`.
- Route handler has the documenting comment per REQ-008.

### New: `requireRole` middleware in `backend/src/middleware/auth.ts`

- Signature: `requireRole(...roles: string[]) => RequestHandler`.
- Reads `req.currentUser` (set by `requireAuth`). If missing, calls `next(new ForbiddenError(...))`. If `req.currentUser.roles` does not intersect with the required roles, same.
- Never calls `res.status(...)` directly. All error paths go through `next(...)` so the global error handler emits the standard shape.
- Chained after `requireAuth`. `requireAuth` populates `req.currentUser`; `requireRole` checks roles.

### Modified: `backend/src/services/adresseService.ts`

Four changes for the basic surface:

1. Add `latitude: number | null` and `longitude: number | null` to `AdresseDTO`.
2. Add both fields to `AdresseRow`.
3. Add `a.latitude, a.longitude` to `BASE_QUERY` SELECT and map them in `toDTO()`.
4. `create()` binds `dto.latitude ?? null`, same for `longitude`.

Plus the delicate change for `update()`:

5. `update()` must preserve existing lat/long if the DTO key is absent. Implementation: load the current row, and for each field, bind `currentRow.latitude` when `dto.latitude` is `undefined`, otherwise bind `dto.latitude`. This handles the three cases:
   - key absent → preserve
   - key present, value null → overwrite with null
   - key present, value numeric → overwrite with number

Note: fixture loading (`runDataMigration()`) uses raw SQL inserts, not `adresseService.create()`. These changes do not affect seed loading.

### Modified: `backend/src/utils/validation.ts`

- `AdresseCreateSchema` gains `latitude` and `longitude` per REQ-010.

### New: Frontend files

- `frontend/src/app/core/guards/role.guard.ts` — `roleGuard('ADMIN')` factory. Uses `inject(AuthService)` and `inject(Router)`.
- `frontend/src/app/features/admin/admin-geocoding.component.ts` (and template / SCSS if not inline) — the standalone component hosting the button and result area.
- `frontend/src/app/features/admin/admin.service.ts` — `AdminService.geocodeAddresses(force?: boolean)` calling `POST /api/admin/geocode-addresses`.
- Register `/admin/geocoding` in `app.routes.ts` with `canActivate: [roleGuard('ADMIN')]`.
- Extend `NavItem` in `sidebar.component.ts` with optional `requiredRole?: string`. Filter in the template using `@if`.
- Add the sidebar entry with `requiredRole: 'ADMIN'`.

### Testing hooks

- Nominatim stubbing: tests set `NOMINATIM_BASE_URL` to a local Express stub that returns canned responses (success, 500, empty array, malformed body). No live calls to nominatim.openstreetmap.org.
- Rate-limit speed-up: tests set `GEOCODING_SLEEP_MS=0`.
- Concurrency test: fire two parallel POSTs and assert one returns 200, one returns 409.
- Range validation: POST with out-of-range latitude returns 400.

## Test Strategy

### Backend (Playwright API tests under `backend/src/test/`)

- `GET /api/adressen/:id` returns `latitude` and `longitude` fields (seed fixture has values).
- `POST /api/adressen` with valid lat/long persists and returns them.
- `POST /api/adressen` with `latitude: 9999` returns 400 with `fieldErrors`.
- `PUT /api/adressen/:id` without `latitude`/`longitude` keys leaves existing values intact.
- `PUT /api/adressen/:id` with `latitude: null` overwrites stored value to null.
- `POST /api/admin/geocode-addresses` as admin: returns 200 and a summary whose four counters sum to `total`.
- `POST /api/admin/geocode-addresses` as non-admin (`user` account): returns 403 with the standard error shape.
- `POST /api/admin/geocode-addresses` with `?force=true`: re-geocodes rows already having coordinates (verify with spy on the stub).
- Concurrency: two near-simultaneous POSTs — one returns 409.
- Error propagation: stub returns 500 → count in `failed`, not `succeeded`; stub returns HTML body → count in `failed`; stub returns empty array → count in `failed`.
- `skippedInsufficientData`: seed an adresse with no city and no postalCode → counted as skipped, Nominatim NOT called for that row.

### Frontend (Jasmine/Karma)

- `roleGuard('ADMIN')` allows admin users and redirects non-admin users.
- Sidebar filters items by `requiredRole` against the current user's roles.
- `AdminGeocodingComponent` renders the confirmation modal before POSTing.
- Clicking "Koordinaten ermitteln" after confirmation calls `AdminService.geocodeAddresses()`.
- Success response renders a `alert-success` with the four counters.
- Failure response (409, 500, network error) renders `alert-danger`.
- `AdminService` is mocked in component tests.

### CI rule

No test may make a live network call to `nominatim.openstreetmap.org`. All Nominatim interactions go through a local stub pointed to via `NOMINATIM_BASE_URL`.

## Non-Functional Requirements

- **Rate limit always enforced.** The 1 req/sec minimum holds even under test override. The override lower bound is 0 ONLY when `NODE_ENV` is not `production`; in production the lower bound is 1000 ms.
- **User-Agent always present.** Every HTTP request to Nominatim includes the header. Requests without it violate Nominatim policy and must fail fast.
- **No secrets.** Nominatim is free and requires no API key. No `.env` production changes needed.
- **Graceful degradation.** A geocoding failure never corrupts an `adresse` row. The row keeps its previous coordinates.
- **No new npm dependencies** for the geocoding HTTP call — Node 20 `fetch` is sufficient.
- **Structured logging.** Each failed or skipped address is logged with its ID and reason. The final summary is logged at INFO level.
- **Single-flight.** The module-level in-progress flag ensures only one batch runs per server process.

## Success Criteria

- [ ] Admin triggers bulk geocode via the frontend button (after confirmation) and receives a summary with `total`, `succeeded`, `failed`, `skippedInsufficientData`. Counters sum to `total`.
- [ ] After the job runs, addresses that Nominatim resolved have non-null `latitude` and `longitude` in the DB.
- [ ] `GET /api/adressen/:id` and `GET /api/adressen` responses include `latitude` and `longitude` on every address object (null if unknown).
- [ ] `POST /api/admin/geocode-addresses` returns HTTP 403 via the standard error shape for non-admin users (`user` account).
- [ ] A second concurrent POST to `/api/admin/geocode-addresses` returns HTTP 409.
- [ ] `?force=true` re-geocodes rows with existing coordinates; default call skips them.
- [ ] `PUT /api/adressen/:id` without `latitude` key preserves the stored value. With `latitude: null` it overwrites.
- [ ] Non-admin users cannot see the sidebar item `Adressen geokodieren`.
- [ ] Existing backend and frontend tests still pass.
- [ ] New tests cover: DTO exposure, create/update preservation, admin endpoint success/failure/403/409/force, range validation, role guard, sidebar filtering, confirmation modal.

## Implementation

_To be filled in after development. Add commit hashes and PR links here._
