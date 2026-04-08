# Implementation Plan: REPLACE-JAVA-NODEJS

## Test Command
```bash
cd backend && npx playwright test
```
Playwright tests run against the live backend (port 7070) and frontend (port 7200). The implementation starts services as needed.

## Project Structure

```
backend/
  src/
    config/        # DB connection, user definitions, app config
    db/
      schema/      # Drizzle schema definitions (one file per entity)
    middleware/     # Auth, CORS, error handler, session
    routes/        # Express route handlers (one per resource)
    services/      # Business logic (one per resource)
    seed/          # Data seeder
    utils/         # Pagination, sort parser, validation, errors
    app.ts         # Express app setup
    index.ts       # Entry point
  tests/           # Playwright test files
  package.json
  tsconfig.json
  playwright.config.ts
```

## Tasks

### Phase 1: Delete Java Backend & Scaffold Node.js Project

- [ ] 1.1 Delete all Java/Maven files from backend/:
  - Remove backend/src/main/, backend/src/test/
  - Remove backend/pom.xml, backend/mvnw, backend/.mvn/, backend/target/
  - Keep backend/data/ (gitignored)
  - Commit: `feat: Remove Java backend code. REPLACE-JAVA-NODEJS`
- [ ] 1.2 Create `backend/package.json`
  - `type: "module"`, scripts: `start` → `node --import tsx/esm --watch src/index.ts`, `test` → `playwright test`
  - Deps: express, express-session, memorystore, bcryptjs, better-sqlite3, drizzle-orm, cors, zod
  - DevDeps: typescript, tsx, @types/express, @types/express-session, @types/better-sqlite3, @types/bcryptjs, @types/node, @types/cors, @playwright/test
- [ ] 1.3 Create `backend/tsconfig.json`
  - target: ES2022, module: NodeNext, strict: true
- [ ] 1.4 Create `backend/playwright.config.ts`
  - Base URL: http://localhost:7070, timeout: 30s
  - Web server config to auto-start backend before tests
- [ ] 1.5 Create `backend/src/app.ts`
  - Express app with JSON body parser, placeholder health endpoint
  - Mount CORS, session, error handler middleware (stubs initially)
- [ ] 1.6 Create `backend/src/index.ts`
  - Import app, listen on port 7070, log startup message
- [ ] 1.7 Run `npm install`, verify server starts and responds to GET /api/health
- [ ] 1.8 Commit: `feat: Scaffold Node.js/TypeScript backend project. REPLACE-JAVA-NODEJS`

### Phase 2: Database Schema and Entities

- [ ] 2.1 Create `backend/src/config/db.ts`
  - Open better-sqlite3 to `backend/data/crmdb.sqlite`
  - Create `data/` dir if missing
  - Run `PRAGMA foreign_keys = ON` immediately (required per-connection, never skip)
  - Export Drizzle instance and raw sqlite handle
- [ ] 2.2 Create `backend/src/db/schema/enums.ts`
  - 6 enum const arrays + TypeScript union types: ChancePhase, VertragStatus, AktivitaetTyp, GehaltTyp, ReportDimension, ReportMetrik
- [ ] 2.3 Create `backend/src/db/schema/schema.ts`
  - All 10 tables with exact column names, types, FK constraints, ON DELETE CASCADE/SET NULL
  - Tables: firma, abteilung, person, adresse, aktivitaet, chance, vertrag, gehalt, savedReport, dashboardConfig
  - Key FK rules:
    - person.firmaId → ON DELETE CASCADE
    - person.abteilungId → ON DELETE SET NULL
    - adresse.firmaId, adresse.personId → ON DELETE CASCADE
    - aktivitaet.firmaId, aktivitaet.personId → ON DELETE CASCADE
    - chance.firmaId → ON DELETE CASCADE, chance.kontaktPersonId → ON DELETE SET NULL
    - vertrag.firmaId → ON DELETE CASCADE, vertrag.kontaktPersonId → ON DELETE SET NULL
    - gehalt.personId → ON DELETE CASCADE
  - Dates as ISO text, monetary values as REAL
- [ ] 2.4 Create `backend/src/config/migrate.ts`
  - CREATE TABLE IF NOT EXISTS for all 10 tables in FK dependency order
  - Called from index.ts on startup
- [ ] 2.5 Verify: start server, check tables created in SQLite, test PRAGMA foreign_keys returns 1
- [ ] 2.6 Commit: `feat: Add database schema with Drizzle ORM and SQLite. REPLACE-JAVA-NODEJS`

### Phase 3: Authentication and Authorization

- [ ] 3.1 Create `backend/src/config/users.ts`
  - CrmUser interface: id, benutzername, vorname, nachname, passwordHash, roles, permissions
  - 5 users with stable IDs (admin=1..demo=5), pre-hashed bcrypt passwords
  - Full permission matrix per PRD REQ-003
  - Export findByBenutzername() and findById()
- [ ] 3.2 Create `backend/src/middleware/session.ts`
  - express-session with memorystore
  - Cookie: httpOnly, sameSite: lax, secure: false, name: 'JSESSIONID'
- [ ] 3.3 Create `backend/src/middleware/cors.ts`
  - CORS_ORIGINS env var, default localhost:7200, credentials: true
- [ ] 3.4 Create `backend/src/utils/errors.ts`
  - NotFoundError, ValidationError, ConflictError, UnauthorizedError, ForbiddenError
- [ ] 3.5 Create `backend/src/middleware/errorHandler.ts`
  - Maps error types to HTTP status codes (400, 401, 403, 404, 409, 500)
  - Response shape: { status, message, timestamp, fieldErrors }
- [ ] 3.6 Create `backend/src/middleware/auth.ts`
  - requireAuth: checks session.userId, returns 401 if missing
  - requireRole(...roles): checks user roles, returns 403
  - requirePermission(...perms): checks permissions, returns 403
  - Extend SessionData with userId, extend Request with currentUser
- [ ] 3.7 Create `backend/src/routes/auth.ts` mounted on `/api/auth`
  - POST /login: { benutzername, passwort } → bcrypt.compare → set session → return { benutzername, vorname, nachname, rollen }
  - POST /logout: destroy session → return {}
  - GET /me: requireAuth → return { id, benutzername, vorname, nachname, email (synthesized), rollen (ROLE_ prefixed), permissions }
  - POST /test-login: { benutzername } without password → create session (for Playwright). Guard: only mount when `NODE_ENV !== 'production'`. Must return 404 in production mode.
- [ ] 3.8 Mount session, CORS, auth routes, error handler in app.ts
- [ ] 3.9 Write Playwright auth tests (`backend/tests/auth.spec.ts`):
  - Login with all 5 users, verify session cookie set
  - Verify /me returns correct id, email, rollen, permissions per user
  - Verify 401 on bad credentials
  - Verify /test-login works without password
  - Verify logout destroys session
- [ ] 3.10 Start backend, run Playwright auth tests, fix any failures
- [ ] 3.11 Commit: `feat: Add session-based authentication and authorization. REPLACE-JAVA-NODEJS`

### Phase 4: Core CRUD Controllers

- [ ] 4.1 Create `backend/src/utils/pagination.ts`
  - parsePaginationParams(query): reads page (default 0), size (default 10)
  - buildPage<T>(rows, total, page, size): returns Spring Data Page shape
  - parseSort(sortParam, defaultSort, allowedFields): handles both "field,asc" string and ["field","asc"] array formats
  - Sort field whitelist per entity to prevent SQL injection. Allowed fields:
    - Firma: name, industry, createdAt, updatedAt
    - Person: firstName, lastName, email, position, createdAt, updatedAt
    - Abteilung: name, firmaId
    - Adresse: city, postalCode, street
    - Aktivitaet: datum, typ, subject, createdAt
    - Chance: titel, wert, phase, wahrscheinlichkeit, erwartetesDatum, createdAt
    - Vertrag: titel, wert, status, startDate, createdAt
    - Gehalt: amount, effectiveDate, typ
  - Reject unknown sort fields with 400 error
- [ ] 4.2 Create `backend/src/utils/validation.ts`
  - Zod schemas for all CreateDTOs (FirmaCreate, PersonCreate, AbteilungCreate, AdresseCreate, AktivitaetCreate, ChanceCreate, VertragCreate, GehaltCreate, SavedReportCreate)
  - validate() function that throws ValidationError with fieldErrors map
- [ ] 4.3 Create `backend/src/services/firmaService.ts`
  - listAll(), findAll(search, page, size, sort), findById(id), create(dto), update(id, dto), delete(id)
  - Search: WHERE LOWER(name) LIKE (case-insensitive)
  - DTO includes personenCount, abteilungenCount (via COUNT subqueries)
- [ ] 4.4 Create `backend/src/routes/firmen.ts` on `/api/firmen`
  - requireRole ADMIN, VERTRIEB, PERSONAL
  - GET /all, GET / (paginated+search), GET /:id, POST, PUT /:id, DELETE /:id
  - GET /:id/personen (paginated), GET /:id/abteilungen (paginated)
- [ ] 4.5 Create `backend/src/services/personService.ts`
  - listAll(), findAll(search, page, size, sort), findById(id), findByFirmaId(firmaId, page, size), create(dto), update(id, dto), delete(id)
  - Search: LOWER(firstName) LIKE OR LOWER(lastName) LIKE
  - DTO includes firmaName, abteilungName (via JOINs)
- [ ] 4.6 Create `backend/src/routes/personen.ts` on `/api/personen`
  - requireRole ADMIN, VERTRIEB, PERSONAL
  - GET /all, GET / (paginated+search), GET /:id, POST, PUT /:id, DELETE /:id
- [ ] 4.7 Create `backend/src/services/abteilungService.ts`
  - listAll(), findAll(page, size, sort), findById(id), findByFirmaId(firmaId, page, size), findByFirmaIdAll(firmaId) (non-paginated), findPersonenByAbteilungId(abteilungId, page, size) (paginated), create(dto), update(id, dto), delete(id)
  - DTO includes firmaName, personenCount
- [ ] 4.8 Create `backend/src/routes/abteilungen.ts` on `/api/abteilungen`
  - requireRole ADMIN, VERTRIEB, PERSONAL
  - GET /all, GET / (paginated), GET /:id, GET /:id/personen (paginated), GET /firma/:firmaId (non-paginated list), POST, PUT /:id, DELETE /:id
  - Route order: /firma/:firmaId BEFORE /:id to avoid collision
- [ ] 4.9 Create `backend/src/services/adresseService.ts`
  - Standard CRUD with pagination, DTO includes firmaName/personName via JOINs
- [ ] 4.10 Create `backend/src/routes/adressen.ts` on `/api/adressen`
  - requireRole ADMIN, VERTRIEB, PERSONAL
- [ ] 4.11 Create `backend/src/services/aktivitaetService.ts`
  - Standard CRUD, default sort datum desc, DTO includes firmaName/personName
- [ ] 4.12 Create `backend/src/routes/aktivitaeten.ts` on `/api/aktivitaeten`
  - requireRole ADMIN, VERTRIEB, PERSONAL, default sort datum,desc
- [ ] 4.13 Register all Phase 4 routes in app.ts
- [ ] 4.14 Write Playwright CRUD tests (`backend/tests/crud.spec.ts`):
  - CRUD for Firma, Person, Abteilung, Adresse, Aktivitaet
  - Pagination format: content, totalElements, totalPages, size, number, first, last
  - Search on Firma (name) and Person (firstName/lastName)
  - Sort parameter parsing
  - Validation errors return 400 with fieldErrors
  - 404 for non-existent IDs
- [ ] 4.15 Start backend, run Playwright CRUD tests, fix failures
- [ ] 4.16 Commit: `feat: Add core CRUD controllers (Firma, Person, Abteilung, Adresse, Aktivitaet). REPLACE-JAVA-NODEJS`

### Phase 5: Domain-Specific Controllers

- [ ] 5.1 Create `backend/src/services/chanceService.ts`
  - Standard CRUD + findByPhase(phase, page, size, sort)
  - getBoardSummary(): GROUP BY phase, fill missing phases with count=0
  - updatePhase(id, phase): targeted phase update
  - DTO includes firmaName, kontaktPersonName
- [ ] 5.2 Create `backend/src/routes/chancen.ts` on `/api/chancen`
  - requirePermission CHANCEN
  - GET /all, GET /, GET /board/summary, GET /phase/:phase, PUT /:id/phase, GET /:id, POST, PUT /:id, DELETE /:id
  - Route order: /board/summary and /phase/:phase BEFORE /:id
- [ ] 5.3 Create `backend/src/services/vertragService.ts`
  - Standard CRUD, DTO includes firmaName, kontaktPersonName
- [ ] 5.4 Create `backend/src/routes/vertraege.ts` on `/api/vertraege`
  - requirePermission VERTRAEGE
- [ ] 5.5 Create `backend/src/services/gehaltService.ts`
  - Standard CRUD, DTO includes personName
- [ ] 5.6 Create `backend/src/routes/gehaelter.ts` on `/api/gehaelter`
  - requirePermission GEHAELTER
- [ ] 5.7 Register Phase 5 routes in app.ts
- [ ] 5.8 Write Playwright tests (`backend/tests/domain.spec.ts`):
  - Chance CRUD, board summary (all 6 phases), phase update
  - Vertrag CRUD, Gehalt CRUD
  - Permission checks: CHANCEN, VERTRAEGE, GEHAELTER
- [ ] 5.9 Start backend, run Playwright domain tests, fix failures
- [ ] 5.10 Commit: `feat: Add domain controllers (Chance, Vertrag, Gehalt). REPLACE-JAVA-NODEJS`

### Phase 6: Analytics, Reporting, Per-User Config

- [ ] 6.1 Create `backend/src/services/dashboardService.ts`
  - getStats(): returns combined DashboardStatsDTO with ALL fields: firmenCount, personenCount, aktivitaetenCount, offeneChancenCount, gesamtVertragswert, durchschnittsGehalt, recentAktivitaeten (top 10 AktivitaetDTO[]), topFirmen (TopFirmaDTO[]), salaryByDepartment (DepartmentSalaryDTO[]). All nested arrays are part of the single response object.
  - getRecentActivities(): top 10 by datum desc (also used standalone by /recent-activities)
  - getSalaryStatistics(): AVG gehalt by abteilung (also used standalone by /salary-statistics)
  - getTopCompanies(): top 5 by active vertragswert (also used standalone by /top-companies)
- [ ] 6.2 Create `backend/src/routes/dashboard.ts` on `/api/dashboard`
  - GET /stats, /recent-activities, /top-companies: requireRole ADMIN, VERTRIEB, PERSONAL
  - GET /salary-statistics: requireRole ADMIN, PERSONAL (NOT VERTRIEB)
- [ ] 6.3 Create `backend/src/services/auswertungService.ts`
  - getPipelineKpis(): gesamtwert, anzahlOffen, gewinnrate, durchschnittlicherWert
  - getPhaseAggregates(): by-phase with count, summeWert, durchschnittWert, gewichteterWert
  - getTopFirmen(limit): top companies by chance value
- [ ] 6.4 Create `backend/src/services/reportService.ts`
  - executeReport(query): dynamic SQL builder
  - JPQL → SQLite translations:
    - YEAR() → CAST(strftime('%Y', col) AS INTEGER)
    - MONTH() → CAST(strftime('%m', col) AS INTEGER)
    - QUARTER() → ((CAST(strftime('%m', col) AS INTEGER) - 1) / 3 + 1)
  - IN-list parameter expansion for phase filters
  - Gewinnrate as post-processing step
  - Label format: MONAT → "2025-04", QUARTAL → "Q2 2025", JAHR → "2025"
- [ ] 6.5 Create `backend/src/routes/auswertungen.ts` on `/api/auswertungen`
  - requirePermission AUSWERTUNGEN
  - GET /pipeline/kpis, GET /pipeline/by-phase, GET /pipeline/top-firmen?limit=10
  - POST /report
- [ ] 6.6 Create `backend/src/services/savedReportService.ts`
  - getByBenutzer(benutzerId), create(benutzerId, dto), update(id, benutzerId, dto), delete(id, benutzerId)
  - Ownership check: returns 404 (not 403) for non-owned reports
- [ ] 6.7 Create `backend/src/routes/savedReports.ts` on `/api/saved-reports`
  - requirePermission AUSWERTUNGEN
  - GET / (per-user), POST, PUT /:id, DELETE /:id
- [ ] 6.8 Create `backend/src/services/dashboardConfigService.ts`
  - getConfig(benutzerId): returns null if no config
  - saveConfig(benutzerId, dto): upsert (INSERT OR REPLACE)
- [ ] 6.9 Create `backend/src/routes/dashboardConfig.ts` on `/api/dashboard-config`
  - requirePermission DASHBOARD
  - GET / (204 if no config, 200 with { visibleWidgets } if exists)
  - PUT /
- [ ] 6.10 Register Phase 6 routes in app.ts
- [ ] 6.11 Write Playwright tests (`backend/tests/analytics.spec.ts`):
  - Dashboard stats (verify nested arrays in response)
  - vertrieb cannot access /salary-statistics (403)
  - allrounder CAN access salary but NOT BENUTZERVERWALTUNG
  - Pipeline KPIs, by-phase, top-firmen with limit param
  - Report with each dimension (PHASE, FIRMA, PERSON, MONAT, QUARTAL, JAHR)
  - Report with date filters
  - SavedReport per-user scoping and ownership (404 on non-owned)
  - DashboardConfig 204 when empty, 200 after PUT
- [ ] 6.12 Start backend, run Playwright analytics tests, fix failures
- [ ] 6.13 Commit: `feat: Add analytics, reporting, and per-user config endpoints. REPLACE-JAVA-NODEJS`

### Phase 7: Data Seeder

- [ ] 7.1 Create `backend/src/seed/seeder.ts`
  - Check: SELECT COUNT(*) FROM firma → skip if > 0
  - Seeded PRNG with seed 42 (Mulberry32 inline, no extra dep)
  - Static German data arrays: firm names, industries, first/last names, streets, cities, PLZ
  - Insert order: firma → abteilung → person → adresse → aktivitaet → gehalt → vertrag → chance
  - Capture IDs from lastInsertRowid for FK references
  - Wrap ALL inserts in a single transaction. If any insert fails, the entire seed rolls back and the DB stays empty (idempotency check will re-run on next start)
  - Target counts: 100 firmen, 250 abteilungen, 600 personen, 500 adressen, 1000 gehaelter, 1000 aktivitaeten, 200 vertraege, 300 chancen
  - Phase distribution for chancen: correlated wahrscheinlichkeit
  - Status distribution for vertraege: ~40% AKTIV
  - Log summary to stdout
- [ ] 7.2 Call seeder from index.ts after migrate(), before app.listen()
- [ ] 7.3 Write Playwright tests (`backend/tests/seeder.spec.ts`):
  - Start with empty db, verify data counts per entity
  - Verify FK integrity (no orphaned records)
  - Verify cascade deletes work (delete firma, check children gone)
  - Verify second-level cascade (firma → person → person's children)
  - Verify kontaktPersonId set to null when person deleted (Chance, Vertrag)
- [ ] 7.4 Start backend with fresh db, run seeder + cascade tests, fix failures
- [ ] 7.5 Commit: `feat: Add data seeder with deterministic German test data. REPLACE-JAVA-NODEJS`

### Phase 8: start.sh Update

- [ ] 8.1 Read current `start.sh` and understand all sections
- [ ] 8.2 Modify `start.sh`:
  - Remove Java version check block
  - Replace Maven backend start with Node.js: `cd backend && npm install && npx tsx --watch src/index.ts &`
  - Update --reset-db comment from "H2 database" to "SQLite database"
  - Remove chmod +x ./mvnw
  - Keep Node.js checks, keep frontend startup, keep --reset-db directory deletion
- [ ] 8.3 Verify: ./start.sh starts full stack, ./start.sh --reset-db works
- [ ] 8.4 Commit: `feat: Update start.sh for Node.js backend. REPLACE-JAVA-NODEJS`

### Phase 9: Documentation & Frontend Smoke Test

- [ ] 9.1 Verify backend/data/ is gitignored
- [ ] 9.2 Update CLAUDE.md:
  - Replace Spring Boot description with Node.js/TypeScript/Express/Drizzle/SQLite
  - Update Build & Run commands
  - Update backend coding conventions (remove @Transactional, H2 quirks, add SQLite notes)
  - Update entity pattern: Drizzle schema → service → route handler
  - Update authorization pattern: requirePermission/requireRole middleware
- [ ] 9.3 Write Playwright frontend smoke tests (`backend/tests/frontend-smoke.spec.ts`):
  - Start full stack (backend + frontend via start.sh or separate processes)
  - Login with each of the 5 users
  - Navigate every section, verify data loads
  - Create/edit/delete a record
  - Check Kanban board loads
  - Verify no console errors
- [ ] 9.4 Run all Playwright tests (auth + crud + domain + analytics + seeder + frontend smoke)
- [ ] 9.5 Verify: no Java files remain, frontend build passes
- [ ] 9.6 Commit: `feat: Update documentation and add frontend smoke tests. REPLACE-JAVA-NODEJS`

## Tests (all Playwright)

### Auth Tests (`tests/auth.spec.ts`)
- [ ] Login with all 5 users, verify session cookie set
- [ ] Verify /me returns correct id, email, rollen, permissions per user
- [ ] Verify 401 on bad credentials
- [ ] Verify 403 when vertrieb accesses /salary-statistics
- [ ] Verify /test-login works without password (dev mode)
- [ ] Verify /test-login returns 404 in production mode (NODE_ENV=production)
- [ ] Verify logout destroys session
- [ ] Verify allrounder can access salary data (has GEHAELTER) but cannot access BENUTZERVERWALTUNG

### CRUD Tests (`tests/crud.spec.ts`)
- [ ] Create, read, update, delete for Firma, Person, Abteilung, Adresse, Aktivitaet
- [ ] Pagination format: content, totalElements, totalPages, size, number, first, last
- [ ] 0-indexed page numbers
- [ ] Sort parameter parsing (field,direction format)
- [ ] Search on Firma (name) and Person (firstName/lastName)
- [ ] Validation errors return 400 with fieldErrors
- [ ] 404 for non-existent IDs

### Domain Tests (`tests/domain.spec.ts`)
- [ ] Chance CRUD, board summary (all 6 phases even with 0 count), phase update
- [ ] Vertrag CRUD, Gehalt CRUD
- [ ] Permission checks: CHANCEN, VERTRAEGE, GEHAELTER gates

### Analytics Tests (`tests/analytics.spec.ts`)
- [ ] Dashboard stats with nested arrays (recentAktivitaeten, topFirmen, salaryByDepartment)
- [ ] Board summary returns all 6 phases
- [ ] Pipeline KPIs, by-phase, top-firmen with ?limit param
- [ ] Report with each dimension (PHASE, FIRMA, PERSON, MONAT, QUARTAL, JAHR)
- [ ] Report with date filters
- [ ] SavedReport per-user scoping, ownership returns 404
- [ ] DashboardConfig 204 when empty, 200 after PUT

### Cascade Tests (`tests/seeder.spec.ts`)
- [ ] Delete Firma → all children deleted
- [ ] Second-level cascade: Firma → Person → Person's children
- [ ] Delete Person → adressen, gehaelter, aktivitaeten deleted
- [ ] Chance/Vertrag kontaktPersonId set to null when person deleted

### Frontend Smoke Tests (`tests/frontend-smoke.spec.ts`)
- [ ] Login with each user via browser
- [ ] Navigate every section
- [ ] Create/edit/delete a record
- [ ] Kanban board loads
- [ ] No console errors
