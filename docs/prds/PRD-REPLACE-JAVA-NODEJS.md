# PRD: Replace Java Spring Boot Backend with Node.js (REPLACE-JAVA-NODEJS)

## Source

User request: Replace the Spring Boot 4.0.3 / Java 21 backend with a Node.js backend. Frontend changes are allowed if they simplify the conversion.

## Problem Statement

The current backend runs on Spring Boot 4.0.3 and Java 21. This stack requires Java expertise, a JVM on every developer machine, and slow Maven build cycles. A Node.js backend removes the Java dependency. It shares the same language (TypeScript) as the Angular frontend. It starts faster during development.

The risk is high. This is a full rewrite of 14 controllers, 13 services, 10 repositories, 9 entities, 6 enums, a security layer, a database layer, and a data seeder.

## Requirements

### Functional Requirements

**REQ-001: API compatibility**
The new backend exposes every existing endpoint. Same paths, same HTTP methods, same request bodies, same response shapes. Frontend changes are allowed if they simplify the backend conversion, but the goal is API compatibility to minimize frontend work.

Complete endpoint inventory:

| Controller | Base Path | Endpoints | Auth |
|---|---|---|---|
| AuthController | `/api/auth` | POST `/login`, POST `/logout`, GET `/me` | `/login` and `/logout` public; `/me` authenticated |
| FirmaController | `/api/firmen` | GET `/all`, GET `?search&page&size&sort`, GET `/{id}`, POST, PUT `/{id}`, DELETE `/{id}`, GET `/{id}/personen` (paginated), GET `/{id}/abteilungen` (paginated) | hasAnyRole ADMIN, VERTRIEB, PERSONAL |
| PersonController | `/api/personen` | GET `/all`, GET `?search&page&size&sort`, GET `/{id}`, POST, PUT `/{id}`, DELETE `/{id}` | hasAnyRole ADMIN, VERTRIEB, PERSONAL |
| AbteilungController | `/api/abteilungen` | GET `/all`, GET `?page&size&sort`, GET `/{id}`, GET `/{id}/personen`, GET `/firma/{firmaId}` (non-paginated list), POST, PUT `/{id}`, DELETE `/{id}` | hasAnyRole ADMIN, VERTRIEB, PERSONAL |
| AdresseController | `/api/adressen` | GET `/all`, GET `?page&size&sort`, GET `/{id}`, POST, PUT `/{id}`, DELETE `/{id}` | hasAnyRole ADMIN, VERTRIEB, PERSONAL |
| AktivitaetController | `/api/aktivitaeten` | GET `/all`, GET `?page&size&sort`, GET `/{id}`, POST, PUT `/{id}`, DELETE `/{id}` (default sort: datum,desc) | hasAnyRole ADMIN, VERTRIEB, PERSONAL |
| ChanceController | `/api/chancen` | GET `/all`, GET `?page&size&sort`, GET `/{id}`, GET `/phase/{phase}` (paginated), GET `/board/summary`, PUT `/{id}/phase` (body: `{phase}`), POST, PUT `/{id}`, DELETE `/{id}` | hasAuthority CHANCEN |
| VertragController | `/api/vertraege` | GET `/all`, GET `?page&size&sort`, GET `/{id}`, POST, PUT `/{id}`, DELETE `/{id}` | hasAuthority VERTRAEGE |
| GehaltController | `/api/gehaelter` | GET `/all`, GET `?page&size&sort`, GET `/{id}`, POST, PUT `/{id}`, DELETE `/{id}` | hasAuthority GEHAELTER |
| DashboardController | `/api/dashboard` | GET `/stats`, GET `/recent-activities`, GET `/top-companies` | hasAnyRole ADMIN, VERTRIEB, PERSONAL |
| DashboardController | `/api/dashboard` | GET `/salary-statistics` | hasAnyRole ADMIN, PERSONAL (NOT VERTRIEB) |
| AuswertungController | `/api/auswertungen` | GET `/pipeline/kpis`, GET `/pipeline/by-phase`, GET `/pipeline/top-firmen?limit=10` | hasAuthority AUSWERTUNGEN |
| ReportController | `/api/auswertungen` | POST `/report` (body: ReportQuery) | hasAuthority AUSWERTUNGEN |
| SavedReportController | `/api/saved-reports` | GET (per-user), POST, PUT `/{id}`, DELETE `/{id}` (per-user ownership) | hasAuthority AUSWERTUNGEN |
| DashboardConfigController | `/api/dashboard-config` | GET (returns 204 if no config), PUT | hasAuthority DASHBOARD |

**REQ-002: Authentication**
Session-based auth with cookies. No JWT. Same 5 hardcoded users. Password validation uses bcrypt.

Login request body: `{ benutzername, passwort }` (German field names).
Login response body: `{ benutzername, vorname, nachname, rollen }`.
`/api/auth/me` response body: `{ id, benutzername, vorname, nachname, email, rollen, permissions }`.
The `email` field is synthesized as `benutzername + "@crm.local"`.
The `id` is a stable numeric benutzerId (must survive restarts — used as FK in DashboardConfig and SavedReport).

**REQ-003: Authorization**
Every endpoint enforces the same role and permission checks. 11 permissions total.

Full permission matrix:

| User | Password | Roles | Permissions |
|---|---|---|---|
| admin | admin123 | ADMIN | DASHBOARD, FIRMEN, PERSONEN, ABTEILUNGEN, ADRESSEN, AKTIVITAETEN, GEHAELTER, VERTRAEGE, CHANCEN, AUSWERTUNGEN, BENUTZERVERWALTUNG |
| vertrieb | test123 | VERTRIEB | DASHBOARD, FIRMEN, PERSONEN, ABTEILUNGEN, ADRESSEN, AKTIVITAETEN, VERTRAEGE, CHANCEN, AUSWERTUNGEN |
| personal | test123 | PERSONAL | DASHBOARD, FIRMEN, PERSONEN, ABTEILUNGEN, ADRESSEN, AKTIVITAETEN, GEHAELTER, AUSWERTUNGEN |
| allrounder | test123 | VERTRIEB, PERSONAL | DASHBOARD, FIRMEN, PERSONEN, ABTEILUNGEN, ADRESSEN, AKTIVITAETEN, GEHAELTER, VERTRAEGE, CHANCEN, AUSWERTUNGEN |
| demo | demo1234 | ADMIN | DASHBOARD, FIRMEN, PERSONEN, ABTEILUNGEN, ADRESSEN, AKTIVITAETEN, GEHAELTER, VERTRAEGE, CHANCEN, AUSWERTUNGEN, BENUTZERVERWALTUNG |

Missing from vertrieb: GEHAELTER, BENUTZERVERWALTUNG.
Missing from personal: VERTRAEGE, CHANCEN, BENUTZERVERWALTUNG.
Missing from allrounder: BENUTZERVERWALTUNG.

**REQ-004: Database**
H2 is Java-only. Use SQLite as the replacement. File-based, zero-config. Database file at `backend/data/crmdb.sqlite`.

**REQ-005: Data seeding**
On first startup (empty database), seed the same volume of test data. 100 firms, 250 departments, 600 persons, 500 addresses, 1000 salaries, 1000 activities, 200 contracts, 300 opportunities. Use seed value 42 for deterministic generation.

**REQ-006: Pagination format**
All paginated responses use the Spring Data Page format:
```json
{ "content": [...], "totalElements": 100, "totalPages": 10, "size": 10, "number": 0, "first": true, "last": false }
```
The `number` field is 0-indexed.

**REQ-007: Error response format**
All error responses use:
```json
{ "status": 400, "message": "...", "timestamp": "2026-04-07T10:00:00", "fieldErrors": { "field": "message" } }
```
HTTP status codes: 400 validation, 401 bad credentials, 403 access denied, 404 not found, 409 data integrity conflict, 500 internal server error.

**REQ-008: Validation**
Validate the same fields as Java backend. Return errors in the `fieldErrors` map format.

**REQ-009: CORS**
Allow requests from `localhost:7200`. Must include `credentials: true` — without it, session cookies are never sent and every request returns 401. Support `CORS_ORIGINS` env variable override.

**REQ-010: Port**
Backend listens on port 7070.

**REQ-011: Reset database**
Support `--reset-db` via `start.sh`. Deleting `backend/data/` triggers a fresh seed on next startup.

**REQ-012: Hot reload**
Hot module reloading at runtime, as fast as possible. No full process restart on file changes. Use a framework or tool that supports live code reloading without dropping connections or sessions.

**REQ-013: Playwright-friendly authentication**
Auth must be easy to test with Playwright. Support a way to authenticate in tests without going through the login UI every time. Options: expose a test-only endpoint, support auth via headers, or make session setup scriptable. This is a dev/lab project — convenience over security.

### Search Behavior

Search is NOT uniform across entities:
- **Firma**: `search` param matches `name` (case-insensitive contains)
- **Person**: `search` param matches `firstName` OR `lastName` (case-insensitive contains)
- **All other entities**: No search parameter

### Sort Parameter Format

Sort arrives as a query parameter string: `field,direction` (e.g., `name,asc`). Parse by splitting on comma: `sort[0]` = field name, `sort[1]` = direction (asc/desc). Default sorts per entity where applicable (e.g., Aktivitaet defaults to `datum,desc`).

### Cascade Delete Rules

Two levels of cascade must be replicated:

**Level 1 — Firma deletion deletes:**
- personen (→ triggers Level 2)
- abteilungen
- adressen
- aktivitaeten
- vertraege
- chancen

**Level 2 — Person deletion deletes:**
- adressen
- gehaelter
- aktivitaeten

SQLite foreign keys with `ON DELETE CASCADE` must be set on all child tables. `PRAGMA foreign_keys = ON` must be enabled on every connection.

### Auth Endpoint Contracts

**POST /api/auth/login**
- Request: `{ "benutzername": "admin", "passwort": "admin123" }`
- Success (200): `{ "benutzername": "admin", "vorname": "Admin", "nachname": "User", "rollen": ["ROLE_ADMIN"] }`
- Bad credentials (401): `{ "status": 401, "message": "Ungültige Anmeldedaten", "timestamp": "..." }`

**POST /api/auth/logout**
- Success (200): empty or `{}`

**GET /api/auth/me**
- Success (200): `{ "id": 1, "benutzername": "admin", "vorname": "Admin", "nachname": "User", "email": "admin@crm.local", "rollen": ["ROLE_ADMIN"], "permissions": ["DASHBOARD", "FIRMEN", ...] }`
- Not authenticated (401): standard error response

### Dashboard Response Shapes

**GET /api/dashboard/stats** returns:
```
{ firmenCount, personenCount, aktivitaetenCount, offeneChancenCount, gesamtVertragswert, durchschnittsGehalt, recentAktivitaeten: AktivitaetDTO[], topFirmen: TopFirmaDTO[], salaryByDepartment: DepartmentSalaryDTO[] }
```

**GET /api/dashboard/recent-activities** returns: `AktivitaetDTO[]` (top 10 by datum desc)

**GET /api/dashboard/salary-statistics** returns: `DepartmentSalaryDTO[]`
```
DepartmentSalaryDTO: { departmentName, averageSalary }
```

**GET /api/dashboard/top-companies** returns: `TopFirmaDTO[]`
```
TopFirmaDTO: { id, name, personenCount, vertragswert }
```

### Analytics Response Shapes

**GET /api/auswertungen/pipeline/kpis** returns:
```
PipelineKpisDTO: { gesamtwert, anzahlOffen, gewinnrate, durchschnittlicherWert }
```

**GET /api/auswertungen/pipeline/by-phase** returns: `PhaseAggregateDTO[]`
```
PhaseAggregateDTO: { phase, count, summeWert, durchschnittWert, gewichteterWert }
```

**GET /api/auswertungen/pipeline/top-firmen?limit=10** returns: `TopFirmaDTO[]` (from ChanceService)

**POST /api/auswertungen/report** request body:
```
ReportQuery: { dimension: ReportDimension, metriken: ReportMetrik[], filter?: { phasen?: string[], datumVon?: string, datumBis?: string } }
```
Response:
```
ReportResult: { dimension, metriken, zeilen: ReportZeile[] }
ReportZeile: { label, id, werte: { [metrik]: number } }
```

### SavedReport Per-User Scoping

`GET /api/saved-reports` returns only reports belonging to the authenticated user (filtered by `benutzerId`). PUT and DELETE verify ownership — users can only modify their own reports.

### DashboardConfig 204 Behavior

`GET /api/dashboard-config` returns HTTP 204 (no body) when the user has no saved config. Returns 200 with `{ visibleWidgets: string[] }` when config exists.

### Numeric Precision

`wert` (Chance, Vertrag) and `amount` (Gehalt) must be returned as JSON numbers, not strings. SQLite stores these as REAL. This is acceptable for a lab/dev project.

## Special Instructions

- Frontend changes are allowed if they simplify the backend conversion.
- Do not modify `proxy.conf.json`. It points to `localhost:7070` already.
- The `backend/` directory becomes the new Node.js project. The old Java files are removed.
- Update `start.sh` to run Node.js instead of `./mvnw spring-boot:run`. Remove Java prerequisite checks. Keep Node.js checks. Add `npm install` for backend dependencies.
- The `backend/data/` path stays for the database file. `start.sh --reset-db` deletes this directory.
- German domain terms stay as-is in the codebase. No translation to English entity names.
- Update CLAUDE.md after migration — it currently describes Spring Boot, Java, Maven, H2, and Java-specific coding conventions.

## Technology Decisions

These resolve the open questions from the initial draft:

1. **HTTP Framework**: Express. Mature, massive ecosystem, simplest for session/cookie auth.
2. **ORM**: Drizzle ORM. Lightweight, TypeScript-native, code-first schema, minimal dependencies. Satisfies NFR-005 (minimal deps).
3. **Session storage**: In-memory via `express-session` with `memorystore`. Single-process dev tool — Redis not needed.
4. **Database migration**: Always start fresh. No H2-to-SQLite migration. `--reset-db` deletes and reseeds.
5. **Numeric precision**: REAL (double) in SQLite, returned as JSON numbers. Acceptable for lab project.
6. **Hot reload**: Use a framework with built-in hot module reloading (e.g., Fastify with HMR, or Hono with Bun). If Express is used, consider `node --watch` with `tsx` as baseline, but evaluate frameworks with faster reload. Priority: minimal restart time on code changes.
7. **Build/run strategy**: Run directly via `tsx` (no separate compilation step to `dist/`). Simpler for dev tool.
8. **Playwright auth**: Add a `POST /api/auth/test-login` endpoint that accepts `{ benutzername }` without password and creates a session. Only active in dev mode. This lets Playwright tests authenticate with a single API call instead of filling in the login form.
8. **benutzerId assignment**: Hardcoded stable IDs (admin=1, vertrieb=2, personal=3, allrounder=4, demo=5). Must be stable across restarts for DashboardConfig and SavedReport.

## Implementation Approach

Phased rewrite. Each phase delivers a runnable backend.

**Phase 1: Project scaffold**
Set up Node.js/TypeScript project in `backend/`. Express + Drizzle ORM + SQLite. Define project structure. Configure `tsconfig.json`, `package.json`.

**Phase 2: Database schema and entities**
Define all 9 entities and 6 enums as Drizzle schema. Match every field name and type. Configure cascade delete via SQLite foreign keys. Enable `PRAGMA foreign_keys = ON`. Schema creation on startup.

**Phase 3: Authentication and authorization middleware**
Express-session with cookie support. bcrypt password check. 5 hardcoded users with stable IDs. Role/permission guard middleware. Auth endpoints: login, logout, me. Session cookie name and behavior matching Spring defaults.

**Phase 4: Core CRUD controllers**
Firma, Person, Abteilung, Adresse, Aktivitaet. Full CRUD plus sub-resource endpoints. Pagination with Spring Data Page format. Sort parsing. Search for Firma (name) and Person (firstName/lastName). Validation with fieldErrors format.

**Phase 5: Domain-specific controllers**
Chance (including `/board/summary`, `/phase/{phase}`, `/{id}/phase`), Vertrag, Gehalt. Board summary must return all 6 phases even with zero counts.

**Phase 6: Analytics and reporting**
Dashboard (stats, recent-activities, salary-statistics, top-companies). Auswertung (pipeline KPIs, by-phase, top-firmen). Report (dynamic query execution — translate JPQL date functions to SQLite strftime). SavedReport (per-user CRUD). DashboardConfig (per-user, 204 when empty).

**Phase 7: Data seeder**
Run on startup when database is empty (check: no rows in firma table). Generate same data volumes with realistic German data. Seed value 42 for deterministic generation.

**Phase 8: start.sh update**
Replace Maven backend command with `tsx`. Remove Java version check. Add `npm install` for backend. Keep Node.js check. Keep `--reset-db` logic. Update `--reset-db` comment from "H2 database" to "database".

**Phase 9: Cleanup and documentation**
Remove all Java/Maven files: `src/`, `pom.xml`, `mvnw`, `.mvn/`, `target/`. Keep `backend/data/` (gitignored). Update CLAUDE.md with new backend conventions.

## Test Strategy

**API contract tests**
Run old Java backend and new Node.js backend on different ports. Compare responses for all endpoints with same requests.

**Authentication tests**
Login/logout/me for all 5 users. Verify session cookie. Verify 401 on bad credentials. Verify 403 on insufficient permissions. Verify vertrieb cannot access `/salary-statistics`.

**Pagination and sorting tests**
Verify Page format fields. Verify results are actually sorted by requested field. Verify search on Firma (name) and Person (firstName/lastName).

**Error format tests**
Trigger 400, 401, 403, 404, 409 responses. Verify `{ status, message, timestamp, fieldErrors }` shape.

**Cascade delete tests**
Delete a Firma → verify all personen, abteilungen, adressen, aktivitaeten, vertraege, chancen deleted. Delete a Person → verify adressen, gehaelter, aktivitaeten deleted. Verify second-level cascades (Firma delete → Person delete → Person's children deleted).

**Frontend smoke test**
Start full stack. Log in with each user. Navigate every section. Verify no console errors. Verify data loads. Test CRUD operations.

**Seeder test**
Start with empty database. Verify seed runs. Verify data counts.

## Non-Functional Requirements

**NFR-001: Startup time** — Backend ready in under 10 seconds.
**NFR-002: Response time** — Single-entity endpoints under 100ms. List endpoints under 200ms.
**NFR-003: Frontend changes allowed** — Frontend modifications are permitted if they simplify the backend conversion. Goal is API compatibility, but pragmatic frontend adjustments are fine.
**NFR-004: TypeScript** — All backend code in TypeScript.
**NFR-005: Minimal dependencies** — Drizzle over Prisma for lighter footprint.
**NFR-006: Security** — No secrets beyond hardcoded test users (acceptable for lab project).

## Success Criteria

- [ ] `./start.sh` starts the full stack without errors.
- [ ] `./start.sh --reset-db` deletes and recreates the database.
- [ ] All 5 users can log in via the Angular frontend.
- [ ] Session cookie is set after login. Logout invalidates it.
- [ ] `/api/auth/me` returns correct id, email, rollen, and permissions per user.
- [ ] Every page in the Angular app loads and displays data.
- [ ] Creating, editing, and deleting records works for all entities.
- [ ] The Kanban board (Chancen pipeline) loads and phase updates work.
- [ ] Dashboard stats match seeded data.
- [ ] Auswertungen (analytics) pages load without errors.
- [ ] vertrieb user cannot access salary data (403).
- [ ] allrounder user cannot access BENUTZERVERWALTUNG.
- [ ] Deleting a Firma cascades to all children and grandchildren.
- [ ] Java is no longer required to run the backend.
- [ ] No Java or Maven files remain in `backend/`.
- [ ] CLAUDE.md is updated with Node.js conventions.

## Implementierung

_Links to commits and PRs will be added here after implementation._
