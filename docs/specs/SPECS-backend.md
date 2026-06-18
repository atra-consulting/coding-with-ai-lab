# CRM Backend Specification

Node.js/TypeScript backend. Express 4.21 on port 7070. SQLite file database via Drizzle ORM. Session-based authentication.

## Stack

| Component | Technology | Version |
|-----------|-----------|---------|
| Runtime | Node.js | 20.19+ |
| Language | TypeScript | 5.8 |
| Framework | Express | 4.21 |
| ORM | Drizzle ORM | 0.41 |
| Database | SQLite (@libsql/client) | 0.17 |
| Validation | Zod | 3.23 |
| Auth | express-session + bcryptjs | 1.18 / 2.4 |
| Session store | LibsqlSessionStore (DB-backed `sessions` table) | — |
| Dev runner | tsx --watch | 4.19 |

Database file: `backend/data/crmdb.sqlite`. Created on first startup.

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
| GET | `/api/health` | Public | Returns `{ status: "ok", timestamp }` |

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
| GET | `/api/personen` | Paginated list. Params: `search`, `page`, `size`, `sort`. Default: `lastName,ASC` |
| GET | `/api/personen/all` | Full list, no pagination |
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
| GET | `/api/abteilungen/:id` | Single record |
| GET | `/api/abteilungen/:id/personen` | Paginated persons for this Abteilung |
| POST | `/api/abteilungen` | Create → 201 |
| PUT | `/api/abteilungen/:id` | Full update |
| DELETE | `/api/abteilungen/:id` | Delete → 204 |

Allowed sort fields: `name`, `firmaId`, `createdAt`, `updatedAt`.

### Adressen (`/api/adressen`)

Standard CRUD. Default sort: `city,ASC`. Allowed sort fields: `city`, `postalCode`, `street`, `createdAt`, `updatedAt`.

### Aktivitaeten (`/api/aktivitaeten`)

Standard CRUD. Default sort: `datum,DESC`. Allowed sort fields: `datum`, `typ`, `subject`, `createdAt`, `updatedAt`.

### Chancen (`/api/chancen`)

Standard CRUD. Default sort: `createdAt,DESC`. Allowed sort fields: `titel`, `wert`, `phase`, `wahrscheinlichkeit`, `erwartetesDatum`, `createdAt`, `updatedAt`.

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

- `express-session` with `LibsqlSessionStore` backend — sessions persisted to a `sessions` table in the libsql/SQLite DB (see `src/middleware/libsqlSessionStore.ts`). Default TTL 24 hours.
- Cookie name: `JSESSIONID`. HttpOnly. SameSite: lax. MaxAge: 24 hours.
- Session secret from env var `SESSION_SECRET`. Falls back to `crm-dev-secret-key` in development.
- Login: `bcryptjs.compareSync()` compares submitted password to stored hash.
- Session fixation protection: `req.session.regenerate()` on successful login.
- Logout: `req.session.destroy()` + clear cookie.

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
4. Calls `next(new UnauthorizedError())` if session is missing or user not found.

`requireRole(...roles)` (also in `src/middleware/auth.ts`) gates a route to users holding at least one of the listed roles, returning `403` otherwise. Entity routes currently use only `requireAuth`, so all authenticated users share one access level. There is no `requirePermission` middleware.

Agent-task and cron routes use `requireAgentToken` instead — a shared-secret check (SHA-256 hash of `AGENT_API_TOKEN`, compared with `timingSafeEqual`); admin agent-task endpoints additionally require a session plus `requireRole('ADMIN')`.

### CORS

Configured in `src/middleware/cors.ts`. Allowed origins from env var `CORS_ORIGINS`. Default: `http://localhost:7200`. Credentials allowed. Methods: GET, POST, PUT, DELETE, OPTIONS.

## Architecture

Table definitions and column specs: see [SPECS-database.md](SPECS-database.md).

```
src/
  index.ts          — entry point: migrate → seed → listen
  app.ts            — Express app wiring (middleware order, route mounting)
  config/
    db.ts           — @libsql/client + Drizzle setup (drizzle-orm/libsql)
    migrate.ts      — CREATE TABLE IF NOT EXISTS statements
    users.ts        — hardcoded user list
  db/schema/
    schema.ts       — Drizzle table definitions
    enums.ts        — TypeScript enum arrays and types
  middleware/
    auth.ts         — requireAuth, requireRole
    agentAuth.ts    — requireAgentToken (shared-secret check for agent/cron routes)
    cors.ts         — CORS config
    errorHandler.ts — global error handler (last middleware)
    session.ts      — express-session config
    libsqlSessionStore.ts — DB-backed express-session Store (sessions table)
  routes/           — one file per entity (Express Router)
  services/         — one file per entity (plain objects, raw SQL via @libsql/client)
  utils/
    errors.ts       — typed error classes
    pagination.ts   — parsePaginationParams, parseSort, buildPage
    validation.ts   — Zod schemas and validate() helper
  seed/
    dataMigration.ts  — loads fixture.json into the DB when empty (CRM entities only)
    fixture.json      — fixed seed data (25 Firmen, 50 Abteilungen, 100 Personen, 100 Adressen, 75 Aktivitaeten, 40 Chancen)
    agentTaskSeed.ts  — idempotent agent_task seeding (INSERT OR IGNORE, ids 1–16); called at end of runMigrations()
    build-fixture.ts  — dev tool to regenerate fixture.json after schema changes (not called at runtime)
```

Middleware order in `app.ts`: CORS → JSON body parser → session → routes → error handler.

Mounted routers (10): `/api/auth`, `/api/firmen`, `/api/personen`, `/api/abteilungen`, `/api/adressen`, `/api/aktivitaeten`, `/api/chancen`, `/api/dashboard`, `/api/agent-tasks`, `/api/cron`. Plus `/api/health` (inline, public).

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
  → Service (services/<entity>Service.ts)  — raw SQL via @libsql/client (async)
  → Route handler (routes/<entity>.ts)     — Express Router
```

### Service pattern

Services are plain exported objects (not classes). Every method is `async` and runs queries via `await client.execute({ sql, args })` from `config/db.ts`. Results come back on `result.rows`; inserts expose `result.lastInsertRowid`.

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

Example query:
```typescript
const result = await client.execute({
  sql: `${BASE_QUERY} WHERE f.id = ?`,
  args: [id],
});
const row = result.rows[0] as unknown as FirmaRow | undefined;
if (!row) throw new NotFoundError(`Firma mit ID ${id} nicht gefunden`);
```

`create()` and `update()` set `updatedAt` to `new Date().toISOString()`.

`findById()` throws `NotFoundError` when the row does not exist. Routes do not check for null.

### Route pattern

Handlers are `async` and wrapped in `asyncHandler` (from `utils/asyncHandler.ts`), which forwards any rejected promise to the global error handler — no manual try/catch needed.

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

The global error handler converts typed errors to HTTP responses.

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

### Adding a new entity

Backend requires 3 changes:

1. Add Drizzle table definition to `src/db/schema/schema.ts`.
2. Add `CREATE TABLE IF NOT EXISTS` to `src/config/migrate.ts`.
3. Add Zod schema + service + route file. Mount the router in `src/app.ts`.
