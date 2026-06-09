# PRD: Slice Specs Per Agent

**Status:** Open
**Date:** 2026-06-09
**Author:** BA Writer

---

## Problem

The project has 18 subagents in `.claude/agents/`. None of them reference any spec file. Agents have no pointer to authoritative project documentation.

The 4 existing spec files do not align with agent responsibilities:

- `SPECS-backend.md` mixes API concerns with database/schema concerns.
- `SPECS-frontend.md` mixes frontend logic with UI styling concerns.
- No testing spec exists. Testing info is scattered across `CLAUDE.md` and code.
- `db-*` agents must load the large backend spec just to find schema info.
- `ui-*` agents must load the frontend spec just to find styling info.
- 6 test agents have no dedicated spec to read at all.

Result: agents either load the wrong file, load too large a file, or load nothing.

---

## Solution

Split the specs into 7 focused files. Each file covers exactly one concern. Each agent loads exactly one file. Create 3 new spec files. Restructure 2 existing spec files. Update the root index. Add a `## Specifications` section to all 18 agent files.

While slicing, also correct the factual errors the review found in the current specs (see REQ-006). The specs end up both sliced and accurate.

---

## Users

| User | Need |
|------|------|
| Subagents (all 18) | Load one spec file. Find relevant facts fast. |
| Developer / maintainer | Update one spec file when one concern changes. |
| New team member | Navigate from root index to the right spec. |

---

## Requirements

### REQ-001: 7-file target structure

**Priority:** High
**Reason:** Each agent must load exactly one focused spec.

| File | Scope |
|------|-------|
| `SPECS.md` | Root index. Architecture overview. Tech stack. Domain model. Seed data. Links to all sub-specs. |
| `SPECS-backend.md` | Backend API only. Routes, services, auth/security, error handling, pagination, code patterns, app architecture. No schema content. |
| `SPECS-database.md` (NEW) | Entities and schema. Column definitions. Enums. Foreign keys and cascade rules. Migrations. Sort-field whitelists. |
| `SPECS-frontend.md` | Frontend logic only. Architecture rules, routing, auth, guards, interceptors, models, services, feature components. No styling content. |
| `SPECS-ui.md` (NEW) | Styling and design system. Colors, fonts. Layout components (sidebar, navbar). Shared components. UX patterns. Phase badge colors. |
| `SPECS-testing.md` (NEW) | Backend Playwright API tests and frontend Jasmine/Karma unit tests. Test patterns. Test-login endpoint. How to run each suite. |
| `SPECS-infrastructure.md` | Unchanged scope. Project structure, dependencies, database engine and file location, startup, `start.sh`, ports, proxy, env vars, no CI/CD. |

**Acceptance:** All 7 files exist. Content lives in one file by default (see REQ-007 for the few allowed exceptions). No content from the current spec files is lost.

#### Boundary rules (resolved from review)

These rules settle every ambiguous section the reviewers flagged:

- **Database vs. backend.** `SPECS-database.md` owns what is *stored*: column tables, types, constraints, foreign keys + cascade, the `PRAGMA foreign_keys = ON` note, migration approach (`CREATE TABLE IF NOT EXISTS`, run on startup), schema/migrate file paths, table list, and the enum value tables (canonical home). `SPECS-backend.md` owns the *API contract and code*: routes/endpoints, **sort-field whitelists** (stay in backend — they are a security boundary enforced in `pagination.ts`), the pagination/sort-validation mechanism, **DTO computed fields** (`personenCount`, `abteilungenCount`), ISO-8601 / REAL coding conventions, auth/security, errors, services, Zod validation, app architecture and full directory tree.
- **Database vs. infrastructure.** `SPECS-infrastructure.md` keeps operational facts only: engine name (`SQLite` via `better-sqlite3`), DB file path (`backend/data/crmdb.sqlite`), "created on first startup". The schema/migrate file paths and migration approach move to `SPECS-database.md`; infra keeps a one-line cross-reference. The full backend **startup sequence** (`runMigrations` → `runDataMigration` → `listen`) is canonical in `SPECS-infrastructure.md`; `SPECS-backend.md` keeps a one-line cross-reference.
- **Frontend vs. UI — never split a single component entry across files.** Feature-component entries (CRUD list/detail/form, Chance Board) stay whole in `SPECS-frontend.md` (behavior + structure), each with a one-line cross-reference to `SPECS-ui.md` for visual treatment. Layout components split by *content*, not by section: behavioral facts (LayoutService signal, `sidebar_collapsed` localStorage key, permission-filter logic, RouterLinkActive) → `SPECS-frontend.md`; visual facts (widths, icons, section grouping, colors) → `SPECS-ui.md`. Angular control-flow rules (`@if`/`@for`/`@switch`) and any rule governing template authoring stay in `SPECS-frontend.md`.
- **Proxy config** moves fully to `SPECS-infrastructure.md` (it already lives there); `SPECS-frontend.md` keeps a one-line cross-reference.
- **Phase badge color map** lives in `SPECS-ui.md`; the Chance Board entry in `SPECS-frontend.md` cross-references it.

---

### REQ-002: Agent → spec reading list

**Priority:** High
**Reason:** Every agent must know which spec is its main one, and which others to reach for when it needs cross-domain context.

Each agent gets a **reading list**: ONE primary spec (its main file — the "ideally one file" the agent reads first and most) plus a short, prioritized list of secondary specs to read only when the task needs them. The primary keeps the single-file intent; the secondaries replace blind cross-reference hunting with an explicit, ordered list.

| Agent | Primary spec | Secondary specs (read when needed) |
|-------|-------------|------------------------------------|
| admin | SPECS-infrastructure.md | SPECS.md |
| ba-reviewer | SPECS.md | any domain spec relevant to the doc under review |
| ba-writer | SPECS.md | any domain spec relevant to the doc being written |
| be-coder | SPECS-backend.md | SPECS-database.md, SPECS-testing.md |
| be-reviewer | SPECS-backend.md | SPECS-database.md, SPECS-testing.md |
| db-coder | SPECS-database.md | SPECS-backend.md |
| db-reviewer | SPECS-database.md | SPECS-backend.md |
| fe-coder | SPECS-frontend.md | SPECS-ui.md, SPECS-testing.md |
| fe-reviewer | SPECS-frontend.md | SPECS-ui.md, SPECS-testing.md |
| md-reader | SPECS.md | any spec the request points to |
| ui-designer | SPECS-ui.md | SPECS-frontend.md |
| ui-reviewer | SPECS-ui.md | SPECS-frontend.md |
| be-test-coder | SPECS-testing.md | SPECS-backend.md, SPECS-database.md |
| be-test-reviewer | SPECS-testing.md | SPECS-backend.md |
| be-test-runner | SPECS-testing.md | SPECS-infrastructure.md |
| fe-test-coder | SPECS-testing.md | SPECS-frontend.md, SPECS-ui.md |
| fe-test-reviewer | SPECS-testing.md | SPECS-frontend.md |
| fe-test-runner | SPECS-testing.md | SPECS-infrastructure.md |

**Acceptance:** Every agent file contains a `## Specifications` section with exactly one primary spec and its prioritized secondary list. Every named file (primary and secondary) exists on disk.

---

### REQ-003: Per-agent `## Specifications` reading list

**Priority:** High
**Reason:** Agents need an explicit reading list — what to read first, and what to reach for next.

Each of the 18 agent files in `.claude/agents/` gets a new `## Specifications` section holding its reading list from REQ-002: a **Primary** line (read first, before starting work) and a **Secondary** list (read only when the task needs that context). The primary is the agent's "ideally one file." The format is identical across all 18 files for consistency.

**Acceptance:** All 18 agent files contain `## Specifications` with a marked Primary spec and a Secondary list. Every referenced file exists.

---

### REQ-004: `SPECS.md` index table updated

**Priority:** High
**Reason:** The root index is the entry point for navigation.

`SPECS.md` must list all 7 sub-spec files in its index table. Currently it lists 3. The table must include the 4 new/changed files.

**Acceptance:** `SPECS.md` index table has 7 rows. All 7 links resolve to existing files.

---

### REQ-005: `CLAUDE.md` Specifications section updated

**Priority:** Medium
**Reason:** `CLAUDE.md` currently lists 3 spec files. It must reflect 7.

**Acceptance:** The `CLAUDE.md` Specifications section lists all 7 spec files.

---

### REQ-006: Correct verified factual errors during migration

**Priority:** High
**Reason:** Moving content while copying known-wrong facts violates "preserve accuracy." The review verified these errors against the code. Fix them as the content moves; do not propagate them.

| # | Error in current spec | Verified truth (from code) | Target file |
|---|----------------------|----------------------------|-------------|
| E1 | "No `requireRole()`/`requirePermission()` on routes yet" (`SPECS-backend.md`) | `backend/src/routes/admin.ts` uses `requireRole('ADMIN')`. `requirePermission` exists but is not yet applied to entity routes. | SPECS-backend.md |
| E2 | "All 3 users hold all 9 permissions … `GEHAELTER`, `VERTRAEGE`" (`SPECS-backend.md`) | `ALL_PERMISSIONS` in `config/users.ts` has **7**: FIRMEN, PERSONEN, ABTEILUNGEN, ADRESSEN, AKTIVITAETEN, CHANCEN, BENUTZERVERWALTUNG. GEHAELTER and VERTRAEGE are **not** granted. | SPECS-backend.md |
| E3 | Seed counts "100 Firmen, ~250 Abteilungen, …" (`SPECS.md`) | `fixture.json`: 25 Firma, 50 Abteilung, 100 Person, 100 Adresse, 75 Aktivitaet, 40 Chance (matches `SPECS-backend.md`). | SPECS.md |
| E4 | List pattern = "NgbPagination" (`SPECS-frontend.md`) | Every entity list view uses **AG Grid** (`ag-grid-angular`, `themeQuartz`). NgbPagination is used only where AG Grid is not. | SPECS-frontend.md + SPECS-ui.md |
| E5 | Auswertungen pipeline dashboard + Chart.js integration documented (`SPECS-frontend.md`) | No `features/auswertung` directory and no `chart.js`/`ng2-charts` usage exist in the code. Feature is not built. Remove this content (and the `auswertung.model.ts` / `report.model.ts` rows that describe the absent feature) rather than carry it forward. | SPECS-frontend.md / SPECS-ui.md |

**Acceptance:** None of the five errors appears in any of the 7 target files. E1–E3 reflect the verified truth. AG Grid is documented (E4, see REQ below). Auswertungen/Chart.js content is removed (E5).

---

### REQ-007: Allowed, flagged duplications

**Priority:** Medium
**Reason:** A strict "no fact in two files" rule is unachievable: a few facts are genuinely needed by two agent groups that each load only one file. These are the *only* permitted duplications. Each must carry an HTML comment marking it as an intentional mirror so future edits keep both copies in sync.

| Fact | Primary home | Mirrored into | Why |
|------|--------------|---------------|-----|
| Enum value tables (ChancePhase, VertragStatus, AktivitaetTyp, GehaltTyp) | SPECS-database.md | SPECS-backend.md (Validation section) | be-coder writes Zod schemas from these values; db-* define the columns. |
| DB runtime versions (`better-sqlite3` 9.6, `drizzle-orm` 0.41) | SPECS-infrastructure.md / SPECS.md stack table | SPECS-database.md (short "Runtime versions" note) | db-* load only SPECS-database.md and need the ORM/driver versions. |
| Shared components (Notification, ConfirmDialog, LoadingSpinner, EurCurrencyPipe) | split, not duplicated | — | `SPECS-ui.md` documents appearance/Bootstrap variant; `SPECS-frontend.md` documents the usage contract (which service to inject, how to call). Each file holds a different slice — this is a split, not a copy. |

Everything not in this table follows the strict single-home rule.

**Acceptance:** Only the rows above appear in two files. Each mirrored block carries an `<!-- mirror: keep in sync with <file> -->` marker.

---

## Special Instructions

- **Move, do not duplicate** (except REQ-007). Content from `SPECS-backend.md` (schema section) moves to `SPECS-database.md`. Content from `SPECS-frontend.md` (styling section) moves to `SPECS-ui.md`. The source file loses that content. The only permitted duplications are the flagged ones in REQ-007.
- **No content loss** (except E5). Every fact in the 4 current spec files appears in one of the 7 target files — except the non-existent Auswertungen/Chart.js content (E5), which is removed, and the verified errors E1–E4, which are corrected.
- **Testing content is new.** `SPECS-testing.md` has no source spec to move from. Write it from: existing test files (`backend/src/test/`, frontend `*.spec.ts`), `backend/playwright.config.ts`, `CLAUDE.md` testing notes, AND the existing test-agent files (`be-test-coder.md`, `fe-test-coder.md`, etc.), which already hold conventions (login/test-login helper, `storageState`, SQLite quirks, cleanup strategy, run commands).
- **AG Grid theming is required (E4).** `SPECS-ui.md` must document the AG Grid visual conventions found in `frontend/src/styles.scss`: `themeQuartz` base, the global header overrides, row styling, and the `height: calc(100vh - 180px)` sizing, plus global layout measurements (navbar 56px, sidebar 250px/60px, transitions, `.main-content` offsets) and the `widget-card` border-left color semantics. Pull values from the SCSS; do not invent.
- **Preserve accuracy.** Do not change technical facts when moving content — except the verified corrections in REQ-006. Copy exact values (ports, paths, versions, SQL patterns) otherwise.
- **Cross-references are allowed.** A spec file may link to another spec for related context. This does not violate the single-file rule. Agents follow cross-reference links only when they need deeper context.

---

## Implementation Approach

High-level only. A separate plan covers detailed steps.

1. **Audit current specs.** Read all 4 existing spec files. Label each section with its target file per the REQ-001 boundary rules.
2. **Create `SPECS-database.md`.** Move schema/entity/enum/migration content from `SPECS-backend.md`. Add the REQ-007 mirrors (enum tables canonical here, DB runtime versions note). Pull PRAGMA + schema/migrate paths from `SPECS-infrastructure.md`.
3. **Update `SPECS-backend.md`.** Remove moved schema content. Keep sort whitelists, DTO computed fields, coding conventions. Correct E1 (auth) and E2 (permissions). Mirror enum tables (REQ-007). Add cross-reference links to database + infrastructure.
4. **Create `SPECS-ui.md`.** Move styling/design content from `SPECS-frontend.md`. Add AG Grid theming + layout measurements + widget-card semantics from `styles.scss` (E4). Phase badge map lives here.
5. **Update `SPECS-frontend.md`.** Remove styling content. Keep feature/layout behavior. Correct E4 (AG Grid as list pattern) and remove E5 (Auswertungen/Chart.js + dead model rows). Add cross-references to ui + infrastructure (proxy).
6. **Create `SPECS-testing.md`.** Write from test files, `playwright.config.ts`, `CLAUDE.md`, and the test-agent files.
7. **Update `SPECS.md`.** Expand index table to 7 rows. Correct E3 (seed counts).
8. **Update `SPECS-infrastructure.md`.** Keep operational DB facts; replace schema/migrate path lines with a cross-reference to `SPECS-database.md`. Confirm proxy + startup sequence are canonical here.
9. **Update all 18 agent files.** Add `## Specifications` section to each, naming its one spec per REQ-002.
10. **Update `CLAUDE.md`.** Reflect the 7-file spec structure in the Specifications section.

---

## Test Strategy

These are doc-only changes. No code changes.

- **Content audit.** After split: diff old files against new files. Confirm every line appears in exactly one target file.
- **Link check.** All internal links in all 7 spec files resolve. Use a Markdown link checker or manual verification.
- **Agent audit.** Read all 18 agent files. Confirm `## Specifications` section exists. Confirm named spec file exists on disk.
- **Build smoke test.** Run `cd frontend && npx ng build`. Confirm it still passes (docs-only change; this is a sanity check).
- **Backend test suite.** Run backend Playwright suite. Confirm it still passes (same reason).

---

## Non-Functional Requirements

- **Single load per agent.** Each agent ideally reads one file. That file is under 500 lines.
- **DRY specs.** No fact appears in two spec files. Cross-reference links replace duplication.
- **Links resolve.** No broken internal links in any spec file.
- **Stable agent behavior.** Adding spec pointers must not change what any agent does — only where it reads.

---

## Out of Scope

- Changing any backend or frontend code.
- Changing agent behavior, personas, or tools.
- Adding new spec content beyond what already exists in the codebase and `CLAUDE.md`.
- Automated link-checking CI step (separate concern).

---

## Resolved Decisions

| # | Question | Resolution |
|---|----------|------------|
| 1 | One testing spec or two? | **One** `SPECS-testing.md` for all 6 test agents. Shared test infrastructure (test-login, DB reset, fixture counts) justifies a single file. Split only if it later exceeds 500 lines. |
| 2 | DB engine info: infrastructure or database? | **Split.** Operational facts (engine, file path, "created on startup") stay in `SPECS-infrastructure.md`. Schema, file paths for schema/migrate, migration approach, PRAGMA move to `SPECS-database.md`. See REQ-001 boundary rules. |
| 3 | Accuracy scope (errors found in review) | **Slice + correct verified errors.** User-confirmed. See REQ-006. |

---

## Success Criteria

- [ ] 7 spec files exist in `docs/specs/`.
- [ ] Content is single-home except the REQ-007 flagged mirrors (each marked with a sync comment).
- [ ] No spec content is lost from the 4 original files (except corrected/removed per REQ-006).
- [ ] Verified errors E1–E5 are corrected/removed; none appear in any target file.
- [ ] AG Grid theming + layout measurements documented in `SPECS-ui.md`.
- [ ] All 18 agent files contain a `## Specifications` section naming exactly one existing spec.
- [ ] `SPECS.md` index table lists all 7 sub-specs with working links; seed counts match `fixture.json`.
- [ ] `CLAUDE.md` Specifications section lists all 7 files.
- [ ] Frontend `ng build` passes.
- [ ] Backend Playwright suite passes.

---

## Implementation

_Links to commits and PRs will be added here after implementation._
