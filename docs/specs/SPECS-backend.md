# CRM Backend Specification

Node.js/TypeScript backend. Express 4.21 on port 7070. SQLite file database via Drizzle ORM + `@libsql/client`. Session-based authentication.

## Stack

| Component | Technology | Version |
|-----------|-----------|---------|
| Runtime | Node.js | 20.19+ |
| Language | TypeScript | 5.8 |
| Framework | Express | 4.21 |
| ORM | Drizzle ORM | 0.41 |
| Database driver | @libsql/client (async, promise-based) | 0.17.3 |
| Validation | Zod | 3.23 |
| Auth | express-session + bcryptjs | 1.18 / 2.4 |
| Session store | LibsqlSessionStore (custom, persists to `sessions` table) | — |
| Dev runner | tsx --watch | 4.19 |

Database file: `backend/data/crmdb.sqlite`. Created on first startup. When `TURSO_DATABASE_URL` is set the remote Turso URL is used instead.

## Startup Sequence

Startup runs: `runMigrations()` → `runDataMigration()` → `app.listen(7070)`. Full detail: see [SPECS-infrastructure.md](SPECS-infrastructure.md).

## Entities

Table definitions and column specs: see [SPECS-database.md](SPECS-database.md).

Computed DTO fields (not stored in DB):

- **Firma** DTO adds `personenCount`, `abteilungenCount` (subquery counts).

## API Endpoints

All routes require authentication. `requireAuth` middleware checks `req.session.userId`. Unauthenticated requests get `401`. See the [Auth middleware](#auth-middleware) section for the full authorization note.

Base URL: `http://localhost:7070/api`

### Auth (`/api/auth`)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/api/auth/login` | Public | Credentials → session cookie |
| POST | `/api/auth/logout` | Public | Destroy session |
| GET | `/api/auth/me` | requireAuth | Current user profile |
| POST | `/api/auth/test-login` | Public (non-prod only) | Passwordless login for Playwright tests |

Login request body:
```json
{ "benutzername": "admin", "passwort": "admin123" }
```

Login response:
```json
{ "benutzername": "admin", "vorname": "Admin", "nachname": "User", "rollen": ["ROLE_ADMIN"] }
```

`/me` response adds `id`, `email`, and `permissions` array.

### Health

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/health` | Public | Returns `{ status: "ok", timestamp, version }` |

### Firmen (`/api/firmen`)

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/firmen` | Paginated list. Params: `search`, `page`, `size`, `sort`. Default sort: `name,ASC` |
| GET | `/api/firmen/all` | Full list, no pagination |
| GET | `/api/firmen/:id` | Single record |
| GET | `/api/firmen/:id/personen` | Paginated persons for this Firma |
| GET | `/api/firmen/:id/abteilungen` | Paginated Abteilungen for this Firma (per-firma listing) |
| POST | `/api/firmen` | Create → 201 |
| PUT | `/api/firmen/:id` | Full update |
| DELETE | `/api/firmen/:id` | Delete → 204 |

Allowed sort fields: `name`, `industry`, `createdAt`, `updatedAt`.

### Personen (`/api/personen`)

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/personen` | Paginated list. Params: `search`, `page`, `size`, `sort`, `abteilungId` (optional filter). Default: `lastName,ASC` |
| GET | `/api/personen/all` | Full list, no pagination. Optional param: `abteilungId` to filter by department |
| GET | `/api/personen/:id` | Single record |
| POST | `/api/personen` | Create → 201 |
| PUT | `/api/personen/:id` | Full update |
| DELETE | `/api/personen/:id` | Delete → 204 |

Allowed sort fields: `firstName`, `lastName`, `email`, `position`, `createdAt`, `updatedAt`.

### Abteilungen (`/api/abteilungen`)

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/abteilungen` | Paginated list. Params: `page`, `size`, `sort`. Default: `name,ASC` |
| GET | `/api/abteilungen/all` | Full list, no pagination |
| GET | `/api/abteilungen/firma/:firmaId` | Non-paginated list for a single Firma (must be before `/:id`) |
| GET | `/api/abteilungen/:id` | Single record |
| GET | `/api/abteilungen/:id/personen` | Paginated persons for this Abteilung |
| POST | `/api/abteilungen` | Create → 201 |
| PUT | `/api/abteilungen/:id` | Full update |
| DELETE | `/api/abteilungen/:id` | Delete → 204 |

Allowed sort fields: `name`, `firmaId`, `createdAt`, `updatedAt`.

### Adressen (`/api/adressen`)

Standard CRUD. Default sort: `city,ASC`. Allowed sort fields: `city`, `postalCode`, `street`, `createdAt`, `updatedAt`. Params: `search` (optional, case-insensitive substring match on `city`), `page`, `size`, `sort`.

### Aktivitaeten (`/api/aktivitaeten`)

Standard CRUD. Default sort: `datum,DESC`. Allowed sort fields: `datum`, `typ`, `subject`, `createdAt`, `updatedAt`.

### Chancen (`/api/chancen`)

Standard CRUD. Default sort: `createdAt,DESC`. Allowed sort fields: `titel`, `wert`, `phase`, `wahrscheinlichkeit`, `erwartetesDatum`, `createdAt`, `updatedAt`. Params: `search` (optional, case-insensitive substring match on `titel`), `phase` (optional enum filter), `page`, `size`, `sort`.

### Szenarien (`/api/szenarien`)

Saved scenarios for the Produktivität-Rechner cycle-time calculator. All routes `requireAuth` (any logged-in user). Each body has four named process fields: `humanSteps` (19 steps), `agileKiSteps` (19 steps), `semiAutomatedSteps` (11 steps), `automatedSteps` (2 steps). Each process is `{ works: number[], waits: number[] }` (waits length = works length − 1); durations are integer minutes. Step counts enforced by `PROCESS_STEP_COUNTS` in `utils/validation.ts`; validated by `SzenarioSchema` (Zod). Omitting `agileKiSteps` fails validation → 400.

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/szenarien` | requireAuth | List all scenarios (`createdAt DESC`) |
| GET | `/api/szenarien/:id` | requireAuth | Single scenario (404 if missing) |
| POST | `/api/szenarien` | requireAuth | Create → 201. Duplicate `name` → 409 |
| PUT | `/api/szenarien/:id` | requireAuth | Update (404 if missing; duplicate name → 409) |
| DELETE | `/api/szenarien/:id` | requireAuth | Delete → 204 |

### Agent Tasks (`/api/agent-tasks`)

Manages the autonomous-agent work queue. Lifecycle: `OPEN → IN_PROGRESS → DONE | REJECTED`.

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/agent-tasks/next?source=X` | requireAgentToken | Claim next OPEN task → IN_PROGRESS. Returns 204 when none exist |
| GET | `/api/agent-tasks/summary` | requireAuth + requireRole('ADMIN') | Per-source open/done/rejected counts |
| POST | `/api/agent-tasks/reset` | requireAuth + requireRole('ADMIN') | Reset all tasks back to OPEN |
| POST | `/api/agent-tasks/:id/start` | requireAgentToken | Claim a specific task by id → IN_PROGRESS (skips `/next`) |
| POST | `/api/agent-tasks/:id/reject` | requireAgentToken | Mark task REJECTED (comment required) |
| POST | `/api/agent-tasks/:id/done` | requireAgentToken | Mark task DONE |
| GET | `/api/agent-tasks/:id` | requireAgentTokenOrAdminSession | Single task. Accepts agent token, loopback bypass, or admin session — see [Agent token auth](#agent-token-auth) |
| GET | `/api/agent-tasks` | requireAuth + requireRole('ADMIN') | Paginated list; filter by `source`, `status` |

Agent endpoints are authenticated via `requireAgentToken` (see [agentAuth.ts](#agent-token-auth)). Admin endpoints require a valid admin session.

### Tickets (`/api/tickets`)

Fake Kanban ticket system for the software-factory training. Board mechanics and full contract: see [docs/specs/SPEC-API-TICKETS.md](SPEC-API-TICKETS.md). Status enum: `DEFINITION → TODO → IN_PROGRESS → ON_HOLD → DONE`. Owner: `AI` or `HUMAN`. New tickets start `owner=HUMAN`, `status=DEFINITION`.

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/tickets/next?type=X` | requireAgentToken | Claim oldest `TODO`+`AI` ticket → `IN_PROGRESS`. Optional `type` filter. 204 when none |
| GET | `/api/tickets/board` | requireAgentTokenOrAdminSession | Full board, grouped by column (agent token, loopback, or admin session) |
| GET | `/api/tickets/summary` | requireAuth + requireRole('ADMIN') | Per-column counts |
| POST | `/api/tickets/reset` | requireAuth + requireRole('ADMIN') | Re-seed the 12 workshop tickets |
| GET | `/api/tickets` | requireAuth + requireRole('ADMIN') | Paginated list; filter by `type`, `status`, `owner` |
| POST | `/api/tickets` | requireAgentTokenOrAdminSession | Create → 201 (`owner=HUMAN`, `status=DEFINITION`; agent token, loopback, or admin session) |
| GET | `/api/tickets/:id` | requireAgentTokenOrAdminSession | Single ticket (agent token, loopback, or admin session) |
| PATCH | `/api/tickets/:id/status` | requireAgentTokenOrAdminSession | Move to another column (agent token, loopback, or admin session) |
| PATCH | `/api/tickets/:id/owner` | requireAgentTokenOrAdminSession | Reassign owner (agent token, loopback, or admin session). `{owner:AI}` = "An KI übergeben" (stays `DEFINITION`) |
| POST | `/api/tickets/:id/start` | requireAgentTokenOrAdminSession | Claim a specific ticket by id → `IN_PROGRESS` (agent token, loopback, or admin session) |
| POST | `/api/tickets/:id/done` | requireAgentTokenOrAdminSession | Finish → `solution=DONE` (agent token, loopback, or admin session) |
| POST | `/api/tickets/:id/ask` | requireAgentTokenOrAdminSession | Ask a question → `ON_HOLD`, owner back to `HUMAN` (agent token, loopback, or admin session) |
| POST | `/api/tickets/:id/wont-do` | requireAuth + requireRole('ADMIN') | Set `solution=WONT_DO` (only on `owner=HUMAN`) |
| POST | `/api/tickets/:id/hand-to-ai` | requireAuth + requireRole('ADMIN') | "Nach Bereit": owner=AI, → `TODO` |
| POST | `/api/tickets/:id/comments` | requireAgentTokenOrAdminSession | Add comment (agent token, loopback, or admin session); `handBackToAi` returns ticket to `TODO`+`AI` |

### Cron (`/api/cron`)

Triggers and records scheduled/manual CI workflow dispatches. Backed by the `cron_run` table and `cronService.ts`.

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/cron/agent-tasks` | requireCronAuth | Drain agent_task queue (Vercel cron or admin manual trigger) |
| GET | `/api/cron/github-issues` | requireCronAuth | Trigger GitHub-issue agent (manual only) |
| POST | `/api/cron/runs/:id/complete` | requireAgentToken | Called by GitHub Actions to record run result |
| GET | `/api/cron/runs` | requireAuth + requireRole('ADMIN') | Paginated cron run history; filter by `job` |
| GET | `/api/cron/jobs` | requireAuth + requireRole('ADMIN') | All configured jobs with their latest run |

`requireCronAuth` (defined inline in `routes/cron.ts`) accepts either a `CRON_SECRET` bearer token (Vercel cron) or a valid admin session. It sets `req.cronTrigger` to `'CRON'` or `'MANUAL'` accordingly.

### Standard CRUD pattern

Every standard CRUD resource exposes:

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/{resource}` | Paginated list |
| GET | `/api/{resource}/all` | Full unpaginated list |
| GET | `/api/{resource}/:id` | Single record or 404 |
| POST | `/api/{resource}` | Create → 201 |
| PUT | `/api/{resource}/:id` | Full update or 404 |
| DELETE | `/api/{resource}/:id` | Delete → 204 or 404 |

## Pagination

All paginated endpoints use the Spring Data Page response format for frontend compatibility.

Response shape:
```json
{
  "content": [...],
  "totalElements": 42,
  "totalPages": 5,
  "size": 10,
  "number": 0,
  "first": true,
  "last": false
}
```

`number` is 0-indexed. `size` defaults to 10, max 200.

Sort query param format: `sort=field,asc` or `sort=field,desc`.

Sort fields are validated against a per-entity whitelist in `src/utils/pagination.ts`. Invalid field names return `400`.

## Security

### Session auth

- `express-session` with `LibsqlSessionStore` — a custom `express-session` Store subclass that persists sessions to the `sessions` table in the same libsql/Turso database. Expired rows are swept lazily on first request per process lifetime.
- Cookie name: `JSESSIONID`. HttpOnly. SameSite: lax. MaxAge: 24 hours. `secure: true` in production.
- Session secret from env var `SESSION_SECRET`. Falls back to `crm-dev-secret-key` in development (prints a warning in production).
- Login: `bcryptjs.compareSync()` compares submitted password to stored hash.
- Session fixation protection: `req.session.regenerate()` on successful login.
- Logout: `req.session.destroy()` + clear cookie.
- `app.set('trust proxy', 1)` is set so that `cookie.secure` works correctly behind Vercel's edge proxy.

### Users

Hardcoded in `src/config/users.ts`. No database table. No user management API.

| Username | Password | Roles | Permissions |
|----------|----------|-------|-------------|
| admin | admin123 | ADMIN | All |
| user | test123 | USER | All |
| demo | demo1234 | ADMIN | All |

Passwords stored as bcrypt hashes (cost factor 10). Generated once at build time.

All 3 users currently hold all 7 permissions: `FIRMEN`, `PERSONEN`, `ABTEILUNGEN`, `ADRESSEN`, `AKTIVITAETEN`, `CHANCEN`, `BENUTZERVERWALTUNG`.

`CrmUser` interface fields: `id`, `benutzername`, `vorname`, `nachname`, `passwordHash`, `roles[]`, `permissions[]`.

### Auth middleware

`requireAuth` (in `src/middleware/auth.ts`):

1. Reads `req.session.userId`.
2. Looks up user in the hardcoded list via `findById()`.
3. Sets `req.currentUser` on the request.
4. If the session references a user that no longer exists, calls `req.session.destroy()` then calls `next(new UnauthorizedError())`.
5. Calls `next(new UnauthorizedError())` if the session is missing.

`requireRole(...roles)` (in `src/middleware/auth.ts`): checks that `req.currentUser` exists and that at least one of the user's roles matches. Returns 403 otherwise.

`requireAuth` exports only these two functions. There is no `requirePermission` function in `auth.ts`.

### Agent token auth

`requireAgentToken` (in `src/middleware/agentAuth.ts`):

- Reads the token from `Authorization: Bearer <token>` first, then falls back to the `X-Agent-Token` header.
- Compares SHA-256 hashes of the incoming and configured (`AGENT_API_TOKEN` env var) tokens using `timingSafeEqual` to prevent timing attacks.
- Returns 401 if the env var is not set, the header is absent, or the token does not match.
- **Loopback bypass (dev only).** When env var `AGENT_AUTH_ALLOW_LOOPBACK=1`, a request from `127.0.0.1` / `::1` / `::ffff:127.0.0.1` with **no** auth header and **no** proxy-forwarding header (`X-Forwarded-For`, `X-Real-IP`, `Forwarded`) skips the token check. Never set this in production. The forwarding-header refusal stops a same-host reverse proxy (which appears as `127.0.0.1` on the socket) from opening the bypass.

`requireAgentTokenOrAdminSession` (in `src/middleware/agentAuth.ts`): guards endpoints that both agents and the admin UI use — `GET /api/agent-tasks/:id` plus nine Tickets endpoints (`GET /:id`, `GET /board`, `POST /` create, `PATCH /:id/status`, `PATCH /:id/owner`, `POST /:id/start`, `POST /:id/done`, `POST /:id/ask`, `POST /:id/comments`; see the Tickets table above). First match wins:

1. Loopback bypass — same gating as above (also requires `AGENT_API_TOKEN` set).
2. Agent token — if a token header is present, it must match; a wrong token is rejected (401), never falling through to the session.
3. Admin session — `req.session.userId` must resolve to a user with the `ADMIN` role, else 403. No session → 401.

### CORS

Configured in `src/middleware/cors.ts`. Allowed origins from env var `CORS_ORIGINS`. Default: `http://localhost:7200`. Credentials allowed. Methods: GET, POST, PUT, DELETE, OPTIONS.

## Architecture

Table definitions and column specs: see [SPECS-database.md](SPECS-database.md).

```
src/
  index.ts          — entry point: migrate → seed → listen
  app.ts            — Express app wiring (middleware order, route mounting)
  config/
    db.ts           — @libsql/client setup; exports `client` and `db` (Drizzle)
    migrate.ts      — CREATE TABLE IF NOT EXISTS + PRAGMA foreign_keys = ON
    users.ts        — hardcoded user list
    cronJobs.ts     — static list of configured cron job names
  db/schema/
    schema.ts       — Drizzle table definitions
    enums.ts        — TypeScript enum arrays and types
  middleware/
    auth.ts               — requireAuth, requireRole
    agentAuth.ts          — requireAgentToken, requireAgentTokenOrAdminSession (+ AGENT_AUTH_ALLOW_LOOPBACK bypass)
    cors.ts               — CORS config
    errorHandler.ts       — global error handler (last middleware)
    libsqlSessionStore.ts — custom express-session Store backed by `sessions` table
    session.ts            — express-session config (uses LibsqlSessionStore)
  routes/           — one file per entity (Express Router)
  services/         — one file per entity (async functions, raw SQL via @libsql/client)
  utils/
    asyncHandler.ts  — wraps async route handlers; forwards rejected Promises to next()
    errors.ts        — typed error classes
    pagination.ts    — parsePaginationParams, parseSort, buildPage
    validation.ts    — Zod schemas and validate() helper
  seed/
    dataMigration.ts  — loads fixture.json into the DB when empty (CRM entities only)
    fixture.json      — fixed seed data (25 Firmen, 50 Abteilungen, 100 Personen, 100 Adressen, 75 Aktivitaeten, 40 Chancen)
    agentTaskSeed.ts  — idempotent agent_task seeding (INSERT OR IGNORE, ids 1–16); called at end of runMigrations()
    build-fixture.ts  — dev tool to regenerate fixture.json after schema changes (not called at runtime)
```

Middleware order in `app.ts`: CORS → JSON body parser → session → routes → error handler.

Mounted routers: `/api/auth`, `/api/firmen`, `/api/personen`, `/api/abteilungen`, `/api/adressen`, `/api/aktivitaeten`, `/api/chancen`, `/api/dashboard`, `/api/agent-tasks`, `/api/cron`, `/api/tickets`, `/api/szenarien`. Plus `/api/health` (inline, public).

## Exception Handling

Global error handler in `src/middleware/errorHandler.ts`. Must be the last `app.use()` call.

| Error Class | HTTP Status |
|-------------|------------|
| ValidationError | 400 |
| UnauthorizedError | 401 |
| ForbiddenError | 403 |
| NotFoundError | 404 |
| ConflictError | 409 |
| Unexpected Error | 500 |

All error responses use this shape:
```json
{
  "status": 404,
  "message": "Firma mit ID 99 nicht gefunden",
  "timestamp": "2026-04-15T10:30:00.123",
  "fieldErrors": {}
}
```

`ValidationError` populates `fieldErrors` as `{ "fieldName": "error message" }`. All other errors return an empty `fieldErrors` object.

Timestamp is millisecond-precision ISO-8601 with no timezone suffix (no trailing `Z`).

## Code Pattern

Each entity follows this pattern:

```
Drizzle schema (schema.ts)
  → Zod schema + CreateDTO (validation.ts)
  → Service (services/<entity>Service.ts)  — async functions, raw SQL via @libsql/client
  → Route handler (routes/<entity>.ts)     — Express Router + asyncHandler
```

### Service pattern

Services are plain exported objects (not classes). They call `await client.execute({ sql, args })` directly. All service methods are `async` and return Promises.

```typescript
export const firmaService = {
  async findAll(search, page, size, sort): Promise<PageResult<FirmaDTO>> { ... },
  async listAll(): Promise<FirmaDTO[]> { ... },
  async findById(id): Promise<FirmaDTO> { ... },   // throws NotFoundError if missing
  async create(dto): Promise<FirmaDTO> { ... },
  async update(id, dto): Promise<FirmaDTO> { ... }, // calls findById first to get 404 on missing
  async delete(id): Promise<void> { ... },          // calls findById first to get 404 on missing
};
```

`create()` and `update()` set `updatedAt` to `new Date().toISOString()`.

`findById()` throws `NotFoundError` when the row does not exist. Routes do not check for null.

### Route pattern

All route handlers are wrapped in `asyncHandler` from `src/utils/asyncHandler.ts`. This forwards any rejected Promise (including thrown errors) to Express's `next()` error chain so the global error handler can format the response. Manual try/catch blocks are not used.

```typescript
router.get(
  '/:id',
  requireAuth,
  asyncHandler(async (req: Request, res: Response) => {
    const id = parseInt(req.params['id'] as string, 10);
    res.json(await firmaService.findById(id));
  }),
);
```

### Validation pattern

Request bodies are validated with Zod before passing to the service:

```typescript
const dto = validate(FirmaCreateSchema, req.body);
res.status(201).json(await firmaService.create(dto));
```

`validate()` throws `ValidationError` (→ 400) with `fieldErrors` populated from Zod issues.

Enum values used in Zod schemas:

<!-- mirror: keep in sync with SPECS-database.md (canonical) -->

| Enum | Values |
|------|--------|
| ChancePhase | NEU, QUALIFIZIERT, ANGEBOT, VERHANDLUNG, GEWONNEN, VERLOREN |
| AktivitaetTyp | ANRUF, EMAIL, MEETING, NOTIZ, AUFGABE |

Canonical enum definition: see [SPECS-database.md](SPECS-database.md).

### SQLite / libsql notes

- `PRAGMA foreign_keys = ON` is executed once at startup in `migrate.ts` via `await client.execute('PRAGMA foreign_keys = ON')` as a standalone statement before any DDL. It is **not** set in `db.ts`.
- `@libsql/client` is fully async — every call to `client.execute()` returns a Promise and must be awaited. There is no synchronous API.
- No native `BOOLEAN` — use `INTEGER` (0/1) and convert in the service layer.
- No native `DATE`/`TIMESTAMP` — use `TEXT` with ISO-8601 strings.

### Adding a new entity

Backend requires 3 changes:

1. Add Drizzle table definition to `src/db/schema/schema.ts`.
2. Add `CREATE TABLE IF NOT EXISTS` to `src/config/migrate.ts`.
3. Add Zod schema + service + route file. Mount the router in `src/app.ts`.
