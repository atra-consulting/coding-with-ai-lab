# Implementation Plan: SLICE-SPECS-PER-AGENT

Slice `docs/specs/` into 7 per-concern files so each subagent loads one spec. Correct the verified factual errors (E1–E5) while moving content. Add a `## Specifications` section to all 18 agent files.

PRD: `docs/prds/PRD-SLICE-SPECS-PER-AGENT.md`

## Test Command

- Frontend build smoke: `cd frontend && npx ng build`
- Backend API tests: `cd backend && npx playwright test`
- (Both are sanity checks — this change is docs + agent markdown only.)

## Ordering rule

Create new target files BEFORE deleting content from source files. This avoids a state where content is removed but not yet placed.

---

## Tasks

### 1. Audit & label (no file writes)

- [ ] Re-read the 4 current specs. Confirm the section→file map below matches the PRD REQ-001 boundary rules.
- [ ] Confirm verified facts for E1–E5 (already checked: `routes/admin.ts` uses `requireRole('ADMIN')`; `users.ts` ALL_PERMISSIONS = 7; `fixture.json` = 25/50/100/100/75/40; lists use AG Grid `themeQuartz`; no `features/auswertung` / no chart.js).
- [ ] Pull AG Grid + layout values from `frontend/src/styles.scss` and `frontend/src/_variables.scss` for SPECS-ui.md.

### 2. Create `docs/specs/SPECS-database.md` (NEW)

Move from current `SPECS-backend.md`:
- [ ] Entities section: Firma…Chance column tables (the raw column/type/constraint rows). **Leave** the `DTO adds computed fields` note behind (stays in backend).
- [ ] Enums table (ChancePhase, VertragStatus, AktivitaetTyp, GehaltTyp) — **canonical home here**. Add `<!-- mirror: keep in sync with SPECS-backend.md -->`.
- [ ] Entities preamble: keep the storage rules (integer PK autoincrement, text ISO-8601 columns, REAL money, FK integrity). Move the `PRAGMA foreign_keys = ON` line here.

Pull in from `SPECS-infrastructure.md`:
- [ ] Table list (`firma, person, abteilung, adresse, gehalt, aktivitaet, vertrag, chance`).
- [ ] Schema file path (`backend/src/db/schema/schema.ts`), enums path (`enums.ts`), migrate path (`backend/src/config/migrate.ts`), migration approach (`CREATE TABLE IF NOT EXISTS`, run on every startup).

Add (REQ-007 mirror):
- [ ] Short "Runtime versions" note: `better-sqlite3` 9.6, `drizzle-orm` 0.41. Add `<!-- mirror: keep in sync with SPECS.md / SPECS-infrastructure.md stack table -->`.
- [ ] Header + one-line cross-references: operational facts → `SPECS-infrastructure.md`; API/sort-whitelists → `SPECS-backend.md`.

### 3. Update `docs/specs/SPECS-backend.md`

- [ ] Remove the raw Entities column tables (now in SPECS-database.md). Replace with a one-line cross-reference to `SPECS-database.md`.
- [ ] **Keep**: sort-field whitelists (inline per endpoint), pagination/sort-validation mechanism, DTO computed-field notes, ISO-8601/REAL coding conventions (Code Pattern section), auth/security, error handling, services, Zod validation, app architecture + full directory tree.
- [ ] Mirror the Enum value table into the Validation section with `<!-- mirror: keep in sync with SPECS-database.md -->`.
- [ ] **E1 fix**: replace both "no `requireRole()`/`requirePermission()` on routes yet" statements (lines ~169, ~334) with: `requireRole('ADMIN')` is applied on `routes/admin.ts`; `requirePermission` exists but is not yet applied to entity routes.
- [ ] **E2 fix**: change the permission list from 9 to the actual 7 (`FIRMEN, PERSONEN, ABTEILUNGEN, ADRESSEN, AKTIVITAETEN, CHANCEN, BENUTZERVERWALTUNG`). Remove `GEHAELTER` and `VERTRAEGE` from the "all users hold" claim; note they are defined as guard names on frontend routes but not granted in `users.ts`.
- [ ] Replace the in-file Startup Sequence with a one-line cross-reference to `SPECS-infrastructure.md` (keep a brief migrate→seed→listen mention).
- [ ] Add cross-reference to `SPECS-database.md` in the Architecture section ("Table definitions: see SPECS-database.md").

### 4. Create `docs/specs/SPECS-ui.md` (NEW)

Move from current `SPECS-frontend.md`:
- [ ] Styling section: design tokens (Primary `#264892`, Secondary `#777777`, Danger `#dc421e`, body bg `#f5f6f8`, fonts), phase badge color map.
- [ ] Shared components — **appearance slice only** (Notification: fixed top-right alert, 5s auto-hide; ConfirmDialog: NgbModal; LoadingSpinner: Bootstrap spinner; EurCurrencyPipe: de-DE EUR format). Usage contract stays in frontend.
- [ ] Layout components — **visual slice only**: sidebar widths (250px / 60px collapsed), navbar height 56px, transitions (0.3s ease), section grouping labels, FontAwesome icons, active-link style.

Add from `frontend/src/styles.scss` + `_variables.scss` (E4 + UI-review findings):
- [ ] AG Grid theming: `themeQuartz` base, `oddRowBackgroundColor #f0f0f0`, header overrides (`#f0f4ff` bg, `#0044cc` border/label, weight 800, uppercase, 0.85rem), grid `height: calc(100vh - 180px)`.
- [ ] Global layout measurements: `.main-content` offsets (top 56px, left `var(--sidebar-width)`), `.page-header h2` (`#264892`, 3px bottom border, weight 700), `.table-container`/`.card` surface tokens (white bg, radius 0.5rem, box-shadow + hover lift).
- [ ] `widget-card` border-left semantics (note inverted vs Bootstrap: `.success` = light blue `#a7c6eb`, `.info` = `#dc421e`).
- [ ] `nav-section-header` style (`#a7c6eb`, 0.75rem, uppercase, letter-spacing 0.05em, weight 600); sidebar nav-link colors (`#adb5bd` / `#fff` hover); active item `border-left 3px solid danger` + `rgba(220,66,30,0.15)` bg.
- [ ] `$light: #dedede` token; public-page card template (centered card, primary gradient via `color.adjust`, `slideUp`); Bootstrap-first convention note; "dark mode not supported" note.
- [ ] Cross-reference: component behavior → `SPECS-frontend.md`.

### 5. Update `docs/specs/SPECS-frontend.md`

- [ ] Remove the Styling section (now in SPECS-ui.md). Keep Architectural Rules, routing, auth, guards, interceptors, models, services, feature components, layout **behavior**.
- [ ] **E4 fix**: correct the List pattern — entity lists use **AG Grid** (`ag-grid-angular`, `themeQuartz`); note NgbPagination is used only where AG Grid is not. Cross-reference AG Grid theming → `SPECS-ui.md`.
- [ ] **E5 fix**: remove the Auswertungen (Pipeline Dashboard) feature-component entry and its Chart.js references. Remove the `auswertung.model.ts` and `report.model.ts` rows from the Models table (they describe the absent feature). Keep `ReportService`/`SavedReportService`/`AuswertungService` rows ONLY if those service files exist — verify; if not, remove.
- [ ] Layout components: keep behavioral facts (LayoutService `collapsed` signal, `sidebar_collapsed` localStorage key, permission-filter logic, RouterLinkActive). Cross-reference visual facts → `SPECS-ui.md`.
- [ ] Shared components: keep usage-contract slice (which service to inject, how to call). Cross-reference appearance → `SPECS-ui.md`.
- [ ] Chance Board: keep behavior; add cross-reference for phase badge colors → `SPECS-ui.md`.
- [ ] Remove the Proxy Configuration block; replace with one-line cross-reference → `SPECS-infrastructure.md`.

### 6. Create `docs/specs/SPECS-testing.md` (NEW)

Write from: `backend/src/test/`, `backend/playwright.config.ts` (create-status noted in agent files), frontend `*.spec.ts`, `CLAUDE.md` testing notes, and the test-agent files (`be-test-coder.md`, `be-test-reviewer.md`, `be-test-runner.md`, `fe-test-coder.md`, `fe-test-reviewer.md`, `fe-test-runner.md`).
- [ ] Backend: `@playwright/test`, tests under `backend/src/test/`, run `cd backend && npx playwright test`, base URL `http://localhost:7070`, `/api/auth/test-login` passwordless helper (non-prod), `storageState` auth reuse, SQLite/cleanup quirks, fixture counts.
- [ ] Frontend: Jasmine/Karma unit tests, run command, component/service/guard test conventions.
- [ ] Cross-reference: endpoint details → `SPECS-backend.md`; component details → `SPECS-frontend.md`.

### 7. Update `docs/specs/SPECS.md` (root index)

- [ ] Expand the Spezifikationsdokumente table to **7 rows** (backend, database, frontend, ui, testing, infrastructure — plus self).
- [ ] **E3 fix**: correct Seed-Daten counts to match `fixture.json`: 25 Firma, 50 Abteilung, 100 Person, 100 Adresse, 75 Aktivitaet, 40 Chance. Remove the invented Gehalt/Vertrag bulk counts unless present in fixture; state "no Gehalt/Vertrag seed rows" if absent (verify).
- [ ] Keep the stack table (canonical home for versions); the DB-version mirror in SPECS-database.md points here.

### 8. Update `docs/specs/SPECS-infrastructure.md`

- [ ] Keep operational DB facts: engine (`SQLite` via `better-sqlite3`), file path `backend/data/crmdb.sqlite`, "created on first startup", `PRAGMA` note may stay as operational but defer schema detail to database spec.
- [ ] Replace the schema-file and migrate-file path lines + migration-approach detail with a one-line cross-reference → `SPECS-database.md`.
- [ ] Confirm Proxy Configuration and Startup Sequence are canonical here (frontend/backend now cross-reference them).
- [ ] Update the `docs/specs/` directory listing in Project Structure to mention the new files (optional but tidy).

### 9. Add `## Specifications` reading list to all 18 agent files

For each file in `.claude/agents/`, insert a `## Specifications` section near the top of the body (after the persona intro). Each section is a **reading list**: one Primary spec + a prioritized Secondary list (per PRD REQ-002).

Reading lists (Primary → Secondary):

- [ ] admin → **SPECS-infrastructure.md** · SPECS.md
- [ ] ba-reviewer → **SPECS.md** · any domain spec relevant to the doc under review
- [ ] ba-writer → **SPECS.md** · any domain spec relevant to the doc being written
- [ ] be-coder → **SPECS-backend.md** · SPECS-database.md, SPECS-testing.md
- [ ] be-reviewer → **SPECS-backend.md** · SPECS-database.md, SPECS-testing.md
- [ ] db-coder → **SPECS-database.md** · SPECS-backend.md
- [ ] db-reviewer → **SPECS-database.md** · SPECS-backend.md
- [ ] fe-coder → **SPECS-frontend.md** · SPECS-ui.md, SPECS-testing.md
- [ ] fe-reviewer → **SPECS-frontend.md** · SPECS-ui.md, SPECS-testing.md
- [ ] md-reader → **SPECS.md** · any spec the request points to
- [ ] ui-designer → **SPECS-ui.md** · SPECS-frontend.md
- [ ] ui-reviewer → **SPECS-ui.md** · SPECS-frontend.md
- [ ] be-test-coder → **SPECS-testing.md** · SPECS-backend.md, SPECS-database.md
- [ ] be-test-reviewer → **SPECS-testing.md** · SPECS-backend.md
- [ ] be-test-runner → **SPECS-testing.md** · SPECS-infrastructure.md
- [ ] fe-test-coder → **SPECS-testing.md** · SPECS-frontend.md, SPECS-ui.md
- [ ] fe-test-reviewer → **SPECS-testing.md** · SPECS-frontend.md
- [ ] fe-test-runner → **SPECS-testing.md** · SPECS-infrastructure.md

Section text pattern (consistent across all 18; fill Primary + Secondary per the list):
```
## Specifications

Your spec reading list. Paths are relative to the repo root.

- **Primary** (read first, before starting work): `docs/specs/<PRIMARY>`
- **Secondary** (read only when the task needs it): `docs/specs/<SEC-1>`, `docs/specs/<SEC-2>`
```
For agents whose secondary is open-ended (ba-reviewer, ba-writer, md-reader), state it in prose, e.g. "whichever domain spec the document touches."

### 10. Update `CLAUDE.md`

- [ ] Update the `## Specifications` section to list all 7 spec files (replace the single SPECS.md pointer with the root + 6 sub-specs, or keep SPECS.md as the entry point and note it links to the 6).

---

## Tests / Verification

### Content audit
- [ ] Every section of the 4 original specs lands in exactly one target file (except E5 removed, E1–E4 corrected, REQ-007 mirrors).
- [ ] Only the 3 REQ-007 facts appear in two files; each mirror carries its sync comment.
- [ ] E1–E5 corrections present; no original error text remains (`grep` for "9 permissions", "no `requireRole`", "100 Firmen", "NgbPagination" as the sole list pattern, "Auswertungen", "Chart.js").

### Link check
- [ ] All internal `SPECS-*.md` links resolve (every referenced file exists; every cross-reference target exists).
- [ ] `SPECS.md` index lists 7 rows, all links valid.

### Agent audit
- [ ] All 18 agent files contain `## Specifications` (`grep -L "## Specifications" .claude/agents/*.md` returns nothing).
- [ ] Each section has a marked **Primary** spec and a **Secondary** list per REQ-002; every referenced spec path exists on disk.

### Smoke tests
- [ ] `cd frontend && npx ng build` passes.
- [ ] `cd backend && npx playwright test` passes (or unchanged from baseline).

### Line budget
- [ ] Each spec file ideally under 500 lines (check SPECS-backend after extraction, SPECS-ui after AG Grid additions).
