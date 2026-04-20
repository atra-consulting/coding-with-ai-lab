# CRM Backend Specification

Node.js/TypeScript backend. Express 4.21 on port 7070. SQLite file database via Drizzle ORM. Session-based authentication.

## Stack

| Component | Technology | Version |
|-----------|-----------|---------|
| Runtime | Node.js | 20.19+ |
| Language | TypeScript | 5.8 |
| Framework | Express | 4.21 |
| ORM | Drizzle ORM | 0.41 |
| Database | SQLite (better-sqlite3) | 9.6 |
| Validation | Zod | 3.23 |
| Auth | express-session + bcryptjs | 1.18 / 2.4 |
| Session store | memorystore | 1.6 |
| Dev runner | tsx --watch | 4.19 |

Database file: `backend/data/crmdb.sqlite`. Created on first startup.

## Startup Sequence

1. `runMigrations()` — creates tables if missing.
2. `runDataMigration()` — loads fixture data from `backend/src/seed/fixture.json` if the database is empty; skipped when `firma` already has rows.
3. `app.listen(7070)` — starts the Express server.

## Entities

All tables use `integer` PKs with autoincrement. All timestamps are `text` columns storing ISO-8601 strings. Monetary values use `real` (SQLite REAL). Foreign keys enforce referential integrity. `PRAGMA foreign_keys = ON` is set on every connection.

### Firma

| Column | SQLite Type | Constraints |
|--------|-------------|-------------|
| id | integer | PK, autoIncrement |
| name | text | NOT NULL |
| industry | text | nullable |
| website | text | nullable |
| phone | text | nullable |
| email | text | nullable |
| notes | text | nullable |
| createdAt | text | NOT NULL, default `datetime('now')` |
| updatedAt | text | NOT NULL, default `datetime('now')` |

Cascade deletes to: Person, Abteilung, Adresse, Aktivitaet, Vertrag, Chance.

DTO adds computed fields: `personenCount`, `abteilungenCount` (subquery counts).

### Person

| Column | SQLite Type | Constraints |
|--------|-------------|-------------|
| id | integer | PK, autoIncrement |
| firstName | text | NOT NULL |
| lastName | text | NOT NULL |
| email | text | nullable |
| phone | text | nullable |
| position | text | nullable |
| notes | text | nullable |
| firmaId | integer | NOT NULL, FK → firma(id) CASCADE DELETE |
| abteilungId | integer | nullable, FK → abteilung(id) SET NULL |
| createdAt | text | NOT NULL |
| updatedAt | text | NOT NULL |

Cascade deletes to: Adresse, Gehalt.

### Abteilung

| Column | SQLite Type | Constraints |
|--------|-------------|-------------|
| id | integer | PK, autoIncrement |
| name | text | NOT NULL |
| description | text | nullable |
| firmaId | integer | NOT NULL, FK → firma(id) CASCADE DELETE |
| createdAt | text | NOT NULL |
| updatedAt | text | NOT NULL |

### Adresse

| Column | SQLite Type | Constraints |
|--------|-------------|-------------|
| id | integer | PK, autoIncrement |
| street | text | nullable |
| houseNumber | text | nullable |
| postalCode | text | nullable |
| city | text | nullable |
| country | text | nullable |
| firmaId | integer | nullable, FK → firma(id) CASCADE DELETE |
| personId | integer | nullable, FK → person(id) CASCADE DELETE |
| createdAt | text | NOT NULL |
| updatedAt | text | NOT NULL |

### Gehalt

| Column | SQLite Type | Constraints |
|--------|-------------|-------------|
| id | integer | PK, autoIncrement |
| amount | real | NOT NULL |
| currency | text | NOT NULL, default `EUR` |
| typ | text | NOT NULL, default `GRUNDGEHALT` |
| effectiveDate | text | NOT NULL |
| personId | integer | NOT NULL, FK → person(id) CASCADE DELETE |
| createdAt | text | NOT NULL |
| updatedAt | text | NOT NULL |

### Aktivitaet

| Column | SQLite Type | Constraints |
|--------|-------------|-------------|
| id | integer | PK, autoIncrement |
| typ | text | NOT NULL |
| subject | text | NOT NULL |
| description | text | nullable |
| datum | text | NOT NULL |
| firmaId | integer | nullable, FK → firma(id) CASCADE DELETE |
| personId | integer | nullable, FK → person(id) CASCADE DELETE |
| createdAt | text | NOT NULL |
| updatedAt | text | NOT NULL |

### Vertrag

| Column | SQLite Type | Constraints |
|--------|-------------|-------------|
| id | integer | PK, autoIncrement |
| titel | text | NOT NULL |
| notes | text | nullable |
| wert | real | nullable |
| currency | text | NOT NULL, default `EUR` |
| status | text | NOT NULL, default `ENTWURF` |
| startDate | text | nullable |
| endDate | text | nullable |
| firmaId | integer | NOT NULL, FK → firma(id) CASCADE DELETE |
| kontaktPersonId | integer | nullable, FK → person(id) SET NULL |
| createdAt | text | NOT NULL |
| updatedAt | text | NOT NULL |

### Chance

| Column | SQLite Type | Constraints |
|--------|-------------|-------------|
| id | integer | PK, autoIncrement |
| titel | text | NOT NULL |
| beschreibung | text | nullable |
| wert | real | nullable |
| currency | text | NOT NULL, default `EUR` |
| phase | text | NOT NULL, default `NEU` |
| wahrscheinlichkeit | integer | nullable, 0–100 |
| erwartetesDatum | text | nullable |
| firmaId | integer | NOT NULL, FK → firma(id) CASCADE DELETE |
| kontaktPersonId | integer | nullable, FK → person(id) SET NULL |
| createdAt | text | NOT NULL |
| updatedAt | text | NOT NULL |

### Enums

Stored as plain `text` in SQLite. Validated by Zod on write. Defined in `src/db/schema/enums.ts`.

| Enum | Values |
|------|--------|
| ChancePhase | NEU, QUALIFIZIERT, ANGEBOT, VERHANDLUNG, GEWONNEN, VERLOREN |
| VertragStatus | ENTWURF, AKTIV, ABGELAUFEN, GEKUENDIGT |
| AktivitaetTyp | ANRUF, EMAIL, MEETING, NOTIZ, AUFGABE |
| GehaltTyp | GRUNDGEHALT, BONUS, PROVISION, SONDERZAHLUNG |

## API Endpoints

All routes require authentication. `requireAuth` middleware checks `req.session.userId`. Unauthenticated requests get `401`.

The current stack has no per-route role or permission guards. All authenticated users share the same access level.

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
| GET | `/api/firmen/:id/abteilungen` | Paginated Abteilungen for this Firma |
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
| GET | `/api/abteilungen/firma/:firmaId` | All Abteilungen for one Firma (no pagination) |
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

### Vertraege (`/api/vertraege`)

Standard CRUD. Default sort: `createdAt,DESC`. Allowed sort fields: `titel`, `wert`, `status`, `startDate`, `endDate`, `createdAt`, `updatedAt`.

### Gehaelter (`/api/gehaelter`)

Standard CRUD. Default sort: `effectiveDate,DESC`. Allowed sort fields: `amount`, `effectiveDate`, `typ`, `createdAt`, `updatedAt`.

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

- `express-session` with `memorystore` backend.
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

All 3 users currently hold all 9 permissions: `FIRMEN`, `PERSONEN`, `ABTEILUNGEN`, `ADRESSEN`, `AKTIVITAETEN`, `GEHAELTER`, `VERTRAEGE`, `CHANCEN`, `BENUTZERVERWALTUNG`.

`CrmUser` interface fields: `id`, `benutzername`, `vorname`, `nachname`, `passwordHash`, `roles[]`, `permissions[]`.

### Auth middleware

`requireAuth` (in `src/middleware/auth.ts`):

1. Reads `req.session.userId`.
2. Looks up user in the hardcoded list via `findById()`.
3. Sets `req.currentUser` on the request.
4. Calls `next(new UnauthorizedError())` if session is missing or user not found.

There is no `requireRole()` or `requirePermission()` middleware on routes yet. All authenticated users access all routes equally.

### CORS

Configured in `src/middleware/cors.ts`. Allowed origins from env var `CORS_ORIGINS`. Default: `http://localhost:7200`. Credentials allowed. Methods: GET, POST, PUT, DELETE, OPTIONS.

## Architecture

```
src/
  index.ts          — entry point: migrate → seed → listen
  app.ts            — Express app wiring (middleware order, route mounting)
  config/
    db.ts           — better-sqlite3 + Drizzle setup, PRAGMA foreign_keys = ON
    migrate.ts      — CREATE TABLE IF NOT EXISTS statements
    users.ts        — hardcoded user list
  db/schema/
    schema.ts       — Drizzle table definitions
    enums.ts        — TypeScript enum arrays and types
  middleware/
    auth.ts         — requireAuth
    cors.ts         — CORS config
    errorHandler.ts — global error handler (last middleware)
    session.ts      — express-session config
  routes/           — one file per entity (Express Router)
  services/         — one file per entity (plain objects, raw SQL via better-sqlite3)
  utils/
    errors.ts       — typed error classes
    pagination.ts   — parsePaginationParams, parseSort, buildPage
    validation.ts   — Zod schemas and validate() helper
  seed/
    dataMigration.ts — loads fixture.json into the DB when empty
    fixture.json     — fixed seed data (25 Firmen, 50 Abteilungen, 100 Personen, 100 Adressen, 75 Aktivitaeten, 40 Chancen)
    build-fixture.ts — dev tool to regenerate fixture.json after schema changes (not called at runtime)
```

Middleware order in `app.ts`: CORS → JSON body parser → session → routes → error handler.

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

Timestamp strips the trailing `Z` for compatibility with the original Java `LocalDateTime` format.

## Code Pattern

Each entity follows this pattern:

```
Drizzle schema (schema.ts)
  → Zod schema + CreateDTO (validation.ts)
  → Service (services/<entity>Service.ts)  — raw SQL via better-sqlite3
  → Route handler (routes/<entity>.ts)     — Express Router
```

### Service pattern

Services are plain exported objects (not classes). They use `sqlite.prepare().get/all/run()` directly.

```typescript
export const firmaService = {
  findAll(search, page, size, sort): PageResult<FirmaDTO> { ... },
  listAll(): FirmaDTO[] { ... },
  findById(id): FirmaDTO { ... },   // throws NotFoundError if missing
  create(dto): FirmaDTO { ... },
  update(id, dto): FirmaDTO { ... }, // calls findById first to get 404 on missing
  delete(id): void { ... },          // calls findById first to get 404 on missing
};
```

`create()` and `update()` set `updatedAt` to `new Date().toISOString()`.

`findById()` throws `NotFoundError` when the row does not exist. Routes do not check for null.

### Route pattern

```typescript
router.get('/:id', requireAuth, (req, res, next) => {
  try {
    const id = parseInt(req.params['id'], 10);
    res.json(firmaService.findById(id));
  } catch (err) {
    next(err);
  }
});
```

All route handlers wrap logic in try/catch and call `next(err)`. The global error handler converts typed errors to HTTP responses.

### Validation pattern

Request bodies are validated with Zod before passing to the service:

```typescript
const dto = validate(FirmaCreateSchema, req.body);
res.status(201).json(firmaService.create(dto));
```

`validate()` throws `ValidationError` (→ 400) with `fieldErrors` populated from Zod issues.

### Adding a new entity

Backend requires 3 changes:

1. Add Drizzle table definition to `src/db/schema/schema.ts`.
2. Add `CREATE TABLE IF NOT EXISTS` to `src/config/migrate.ts`.
3. Add Zod schema + service + route file. Mount the router in `src/app.ts`.
