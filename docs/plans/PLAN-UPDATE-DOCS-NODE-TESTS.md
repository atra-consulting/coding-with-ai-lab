# Implementation Plan: UPDATE-DOCS-NODE-TESTS

## Summary

The backend switched from Java/Spring Boot to Node.js/TypeScript/Express. `CLAUDE.md` and most `docs/specs/SPECS*.md` files were already converted, but `SPECS-ciam.md` still describes a deleted CIAM microservice, and AI config files (`GEMINI.md`, `.gemini/agents/`) still reference Java/Spring/JPA/Maven. Backend test coverage is sparse — only 3 Playwright spec files for 9 routes, none for Auth or Firmen.

This plan refreshes the outdated docs (user-approved scope: `SPECS*.md`, `CLAUDE.md`, `GEMINI.md`, `.gemini/agents`) and adds **two** smoke tests: Auth and Firmen CRUD happy path. That's the smallest meaningful safety net for the new Node backend — no comprehensive suite.

## Test Command

`cd backend && npm test`

## Scope Boundaries (user-approved at plan time)

- **In scope (docs):** `docs/specs/SPECS*.md`, `CLAUDE.md`, `GEMINI.md`, `.gemini/agents/*.md`.
- **Out of scope (docs):** `docs/adr/`, `docs/prds/`, `docs/plans/`, `docs/reviews/`, `docs/architecture.md`, `docs/todos/`, `.claude/skills/`, `.claude/agents/` (already up to date), `.gemini/skills/`.
- **In scope (tests):** `auth.spec.ts` + `firmen-crud.spec.ts`. Happy path only, plus 401/404 sanity checks.
- **Out of scope (tests):** Personen / Abteilungen / Aktivitaeten / Chancen / Dashboard / Adressen CRUD, full validation matrix, 409 conflicts, pagination/sort edges.

## Known Contract Facts (verified against source)

Captured here so the implementer does not re-discover them.

- Login body field names: `benutzername`, `passwort` (German). NOT `username` / `password`.
- Session cookie name: `JSESSIONID`. Asserted on login success; must be absent on login failure.
- `GET /api/auth/me` returns: `{ id, benutzername, vorname, nachname, email, rollen, permissions }`.
- `rollen` values are prefixed with `ROLE_` (e.g., `ROLE_ADMIN`).
- Login response includes: `benutzername, vorname, nachname, rollen` (no `id`, no `email`, no `permissions` — those come from `/me`).
- Abteilungen per firma endpoint: `GET /api/firmen/:id/abteilungen` (on firmen router, paginated). There is no `/api/abteilungen/firma/:firmaId` in the current code — the SPECS-backend.md table row claiming that path is WRONG and must be fixed (task 1.3).

## Tasks

### 1. Doc updates — SPECS files

- [ ] 1.1 **Delete** `docs/specs/SPECS-ciam.md`. The CIAM microservice no longer exists and the deletion is already requested by `docs/prds/PRD-REDUCE-MORE-COMPLEXITY.md` D8. Clean delete, no tombstone file.
- [ ] 1.2 Verify `docs/specs/SPECS.md` — expected: the `Spezifikationsdokumente` table does not list `SPECS-ciam.md`. No edit needed. If a row exists, drop it.
- [ ] 1.3 `docs/specs/SPECS-backend.md` — **Fix the wrong endpoint row**. In the `### Abteilungen (/api/abteilungen)` table, remove the `GET /api/abteilungen/firma/:firmaId` row (the route does not exist). Document the real per-firma endpoint `GET /api/firmen/:id/abteilungen` under `### Firmen` if it is not already there.
- [ ] 1.4 `docs/specs/SPECS-infrastructure.md:34` — Comment "Spring Data page format helper" → "Spring-Data-style page format helper" (clarify it's a naming choice, not a framework).
- [ ] 1.5 `docs/specs/SPECS-frontend.md` — Sanity-read. Expected: no changes needed.

### 2. Doc updates — CLAUDE.md

- [ ] 2.1 `CLAUDE.md:35` — Clarify pagination bullet: "Response shape mimics the Spring Data Page format (name only — backend is Node)". This kills the Java-stack misread on first scan.
- [ ] 2.2 Scan the rest of `CLAUDE.md` for any other Java-era remnants. Expected: none.

### 3. Doc updates — GEMINI.md + .gemini/agents

- [ ] 3.1 `GEMINI.md` — Rewrite agent descriptions to match the Node backend. Align with `CLAUDE.md` Agents table: be-coder = "Node.js / TypeScript backend", db-coder = "Drizzle ORM queries", db-reviewer = "Review queries, Drizzle mappings".
- [ ] 3.2 `GEMINI.md` **agent table structure** — Current table lists `web-tester` (doesn't exist) and omits `be-test-coder`, `be-test-runner`, `be-test-reviewer`, `fe-test-coder`, `fe-test-runner`, `fe-test-reviewer`. Bring the table into line with CLAUDE.md's 18-row agents table: add all 6 test agents, drop `web-tester`.
- [ ] 3.3 `.gemini/agents/be-coder.md` — Replace Spring Boot / Java / Maven content with Express / TypeScript / tsx / Drizzle per the existing `.claude/agents/be-coder.md`. Source paths change from `backend/src/main/java/com/crm/*` to `backend/src/{routes,services,db,middleware}`.
- [ ] 3.4 `.gemini/agents/be-reviewer.md` — Same treatment. Checklist items: TypeScript idioms, Zod validation, Express route pattern, session auth middleware, Drizzle schema consistency.
- [ ] 3.5 `.gemini/agents/db-coder.md` — Drizzle ORM + better-sqlite3 (not JPA/H2). Paths: `backend/src/db/schema/schema.ts`, `backend/src/config/migrate.ts`. Patterns: SQL via `sqlite.prepare()`, `CREATE TABLE IF NOT EXISTS` migrations.
- [ ] 3.6 `.gemini/agents/db-reviewer.md` — Review Drizzle schemas, raw SQL services, `PRAGMA foreign_keys = ON`, sort-field whitelists. Drop all Spring Data / JPA / N+1 language.
- [ ] 3.7 `.gemini/agents/fe-coder.md:29` — "Spring Data is 0-indexed" → "backend is 0-indexed (Spring-Data-style format)". Frontend file is otherwise correct.
- [ ] 3.8 `.gemini/agents/ba-writer.md`, `.gemini/agents/ba-reviewer.md` — Remove Spring Boot / Java / Maven / Kotlin lines. Align with `.claude/agents/ba-*.md` counterparts.
- [ ] 3.9 `.gemini/agents/admin.md` — Replace `mvn spring-boot:run`, Maven, Java startup instructions with Node.js equivalents (`cd backend && npx tsx --watch src/index.ts`). Remove all CIAM / Kotlin Spring Boot lines.
- [ ] 3.10 Cross-check `.claude/agents/` counterparts are the reference for each `.gemini/` equivalent — when in doubt, copy the `.claude/` content and adapt only the tool-name mentions.

### 4. Backend tests — setup

- [ ] 4.1 Extend `backend/src/test/helpers.ts`: add a new export `loginCtx(username, password)` that creates a fresh `APIRequestContext` via `playwrightRequest.newContext({ baseURL })`, posts to `/api/auth/login`, and returns the context. Keep the existing `login(request, benutzername, passwort)` export unchanged.

### 5. Backend tests — Auth (`auth.spec.ts`)

- [ ] 5.1 POST `/api/auth/login` with `admin/admin123` → 200. Body shape: `{ benutzername, vorname, nachname, rollen: string[] }` where `rollen` contains `ROLE_ADMIN`. `set-cookie` header contains `JSESSIONID=`.
- [ ] 5.2 POST `/api/auth/login` with bad password → 401. No `JSESSIONID` cookie in the response.
- [ ] 5.3 GET `/api/auth/me` without session → 401.
- [ ] 5.4 GET `/api/auth/me` with session → 200, body shape exactly `{ id, benutzername, vorname, nachname, email, rollen, permissions }`. `permissions` is a non-empty array.
- [ ] 5.5 POST `/api/auth/logout` then GET `/api/auth/me` on the same context → 401.

### 6. Backend tests — Firmen CRUD happy path (`firmen-crud.spec.ts`)

- [ ] 6.1 `beforeAll`: reset DB, log in as admin via `loginCtx`.
- [ ] 6.2 GET `/api/firmen` → 200, pagination shape `{ content, totalElements, totalPages, size, number, first, last }`, `number === 0`, `totalElements > 0`.
- [ ] 6.3 POST `/api/firmen` with valid body → 201, returns record with `id`, `createdAt`.
- [ ] 6.4 GET `/api/firmen/:id` on the new record → 200.
- [ ] 6.5 PUT `/api/firmen/:id` changes `name` → 200, GET reflects the change.
- [ ] 6.6 DELETE `/api/firmen/:id` → 204; subsequent GET → 404.
- [ ] 6.7 GET `/api/firmen/99999` → 404 with error body `{ status: 404, message, timestamp, fieldErrors: {} }`.
- [ ] 6.8 Unauthenticated request (anon context, no login) to GET `/api/firmen` → 401.

### 7. Verification

- [ ] 7.1 Run `cd backend && npm test` — all specs green (existing 3 + 2 new = 5 spec files).
- [ ] 7.2 Scoped grep for leftover Java terms inside in-scope files only:
  ```
  rg -n -w --glob 'docs/specs/**' --glob 'CLAUDE.md' --glob 'GEMINI.md' --glob '.gemini/agents/**' \
     '(Spring|Maven|JPA|Hibernate|pom\\.xml|\\.java|Spring Boot|Kotlin|Quarkus|JDBC|JUnit|Lombok)'
  ```
  Expected output: only the explicit Spring-Data-Page format-name references in CLAUDE.md and the clarified comment in SPECS-infrastructure.md. No broad-stack mentions.
- [ ] 7.3 `cd frontend && npx ng build` — frontend still builds (safety check; we are not touching frontend code).

## Tests

### Integration / API Tests

The 2 new `.spec.ts` files under `backend/src/test/` drive the backend over HTTP. Each:

- Uses a pre-authenticated `APIRequestContext` via the new `loginCtx` helper.
- Calls `resetDatabase()` in `beforeAll` so fixture state is predictable. Playwright config has `workers: 1, fullyParallel: false`, so no cross-file races.
- Asserts JSON shape against the contract in `SPECS-backend.md`.

### Edge cases covered

- 401 on unauthenticated requests.
- 404 on missing IDs.
- Pagination shape matches Spring-Data-style page format.
- JSESSIONID cookie presence / absence on auth success / failure.

### Edge cases explicitly deferred

- All entity CRUD except Firmen.
- 400 Zod validation matrix.
- 409 conflict scenarios.
- Pagination / sort edge cases.
- Dashboard aggregations.
- FK-violation error mapping.

## Out-of-Scope Reminders

If any new Java/Spring reference is found outside the scoped files, log it in the final summary but do **not** edit it — those files are owned by future cleanup tasks.
