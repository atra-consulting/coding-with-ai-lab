# PRD: Reduce More Complexity — Phase 2 (REDUCE-MORE-COMPLEXITY)

**Task Key:** REDUCE-MORE-COMPLEXITY
**Date:** 2026-04-17
**Status:** Draft

---

## 1. Source

Internal request: continue complexity reduction started in PR #40 (REDUCE-APP-COMPLEXITY). Reduce AI token consumption when assistants read the codebase.

---

## 2. Problem Statement

This project teaches developers to code with AI. Every token an AI spends reading code is a training cost. Smaller codebase = cheaper sessions = better learning experience.

PR #40 removed Kanban, Report Builder, Auswertungen, and the configurable dashboard. It simplified auth from 4 roles + 11 permissions to 3 users. That work left several removal candidates untouched. A codebase scan also found documentation bloat, a fake test infrastructure, and a ~6,700-line seeder artifact.

This PRD proposes Phase 2 removals. The user selects which proposals to implement.

---

## 3. Summary Table

| ID | Name | Estimated Savings | Risk | Category |
|----|------|-------------------|------|----------|
| A1 | Remove Feedback feature (form + QR + Thankyou) | ~476 TS+HTML + ~674 SCSS = ~1,150 lines | Low | Code |
| A2 | Remove Gehalt entity | ~460 lines TS + GEHALT_TYP enum + index | Low | Code |
| A3 | Remove Aktivitaet entity | ~460 lines TS + AKTIVITAET_TYP enum + 3 indexes | Low | Code |
| A4 | Remove Abteilung entity | ~490 lines TS + 2 indexes + Person.abteilungId column | Medium | Code |
| A5 | Remove Welcome feature (pre-login splash) | ~170 lines TS | Low | Code |
| A6 | Remove Vertrag entity | ~620 lines TS + VERTRAG_STATUS enum + 2 indexes | Medium | Code |
| A7 | Remove empty Dashboard shell | ~21 lines TS | Low | Code |
| B1 | Replace generated seeder with hand-written data | ~6,755 lines (fixture.json + build-fixture.ts) | Low | Seeder |
| C1 | Remove fake Playwright test infrastructure | 1 dep + 1 script + doc corrections | Low | Tests |
| D1 | Delete historical PRDs 001–009 | ~2,000 lines MD | Low | Docs |
| D2 | Delete completed migration & feature PRDs | ~1,500 lines MD | Low | Docs |
| D3 | Delete all completed PLAN files | ~1,328 lines MD | Low | Docs |
| D4 | Delete all REVIEW files | ~est. 600 lines MD | Low | Docs |
| D5 | Delete all completed STATE files | ~est. 400 lines JSON | Low | Docs |
| D6 | Delete obsolete ADRs (002, 003, 004) | ~est. 150 lines MD | Low | Docs |
| D7 | Delete UXDR report-builder design + README | ~est. 100 lines MD | Low | Docs |
| D8 | Delete SPECS-ciam.md + clean SPECS.md links | ~est. 200 lines MD | Low | Docs |
| D9 | Delete TODOS-SPRING-BOOT-4-MIGRATION.md | ~est. 50 lines MD | Low | Docs |
| D10 | Rewrite welcome_DE.MD and welcome_EN.MD | Net ~0 (rewrite) | Low | Docs |
| D11 | Delete google-apps-script-feedback.js | ~79 lines JS | Low | Docs |
| D12 | Delete/rewrite docs/prds/README.md | ~est. 50 lines MD | Low | Docs |
| E1 | Drop Windows support (start.bat + PNG) | ~100 lines BAT + 596 KB | Low | Infra |

---

## 4. Requirements

### Group A — Source Code Removals

---

#### A1 — Remove Feedback Feature

**Estimated savings:** ~476 lines TS+HTML + ~674 lines SCSS = ~1,150 lines total. Three components: `feedback-form`, `feedback-qr`, `thankyou`.

**Risk:** Low. No backend entity. No FK dependencies. Standalone frontend feature. Sidebar has no feedback entry (already absent).

**Rationale:** Feedback is the single largest frontend feature. It is not a CRM concept. It exists to demonstrate form submission to Google Sheets. That lesson does not belong in a CRM training project.

**What gets removed:**
- `frontend/src/app/features/feedback/` — entire directory (3 components × 3 files each = 9 files, ~1,150 lines)
- `docs/google-apps-script-feedback.js` (covered by D11 — depends on this proposal)

**What needs updating:**
- `frontend/src/app/app.routes.ts` — remove feedback routes (form, QR, thankyou paths)
- `CLAUDE.md` — no feedback mentions to remove (spot-check only)
- `docs/specs/SPECS-frontend.md` — remove feedback section if present
- Sidebar: no entry exists — no change needed

---

#### A2 — Remove Gehalt Entity

**Estimated savings:** ~460 lines TypeScript + `GEHALT_TYP` enum + `idx_gehalt_personId` index.

**Risk:** Low. Gehalt is a standalone entity. No other entity holds a FK to Gehalt.

**Rationale:** Salary data is not needed to demonstrate CRM concepts. The entity duplicates structure already shown by Vertrag and Chance. Removing it shrinks the entity list without breaking any relationship.

**What gets removed:**
- `backend/src/services/gehaltService.ts`
- `backend/src/routes/gehaelter.ts`
- `gehalt` table from `backend/src/db/schema/schema.ts`
- `gehalt` CREATE TABLE and `idx_gehalt_personId` CREATE INDEX from `backend/src/config/migrate.ts`
- `GEHALT_TYP` enum from `backend/src/db/schema/enums.ts`
- `GehaltCreateSchema` block from `backend/src/utils/validation.ts`
- `frontend/src/app/features/gehalt/` — entire directory
- `frontend/src/app/core/services/gehalt.service.ts`
- `frontend/src/app/core/models/gehalt.model.ts` (if exists)
- Any gehalt-related field on `Person` model if present

**What needs updating:**
- `backend/src/index.ts` — remove route registration
- `frontend/src/app/app.routes.ts` — remove Gehalt route
- Sidebar component — remove Gehälter nav item
- Seeder (`seeder.ts` and `fixture.json`, or hand-written seeder if B1 accepted) — remove `gehalt` from `INSERT_ORDER`, fixture interface, and data
- `CLAUDE.md` — remove Gehalt from domain model list
- `docs/specs/SPECS-backend.md` and `SPECS-frontend.md` — remove Gehalt sections

---

#### A3 — Remove Aktivitaet Entity

**Estimated savings:** ~460 lines TypeScript + `AKTIVITAET_TYP` enum + 3 indexes (`idx_aktivitaet_firmaId`, `idx_aktivitaet_personId`, `idx_aktivitaet_datum`).

**Risk:** Low. Aktivitaet is a standalone entity. No other entity references it via FK.

**Rationale:** Activities are a secondary CRM concept. The entity adds code mass without adding pedagogical value beyond what Firma, Person, and Chance already demonstrate.

**What gets removed:**
- `backend/src/services/aktivitaetService.ts`
- `backend/src/routes/aktivitaeten.ts`
- `aktivitaet` table from `backend/src/db/schema/schema.ts`
- `aktivitaet` CREATE TABLE and its 3 CREATE INDEX lines from `backend/src/config/migrate.ts`
- `AKTIVITAET_TYP` enum from `backend/src/db/schema/enums.ts`
- `AktivitaetCreateSchema` block from `backend/src/utils/validation.ts`
- `frontend/src/app/features/aktivitaet/` — entire directory
- `frontend/src/app/core/services/aktivitaet.service.ts`
- `frontend/src/app/core/models/aktivitaet.model.ts` (if exists)

**What needs updating:**
- `backend/src/index.ts` — remove route registration
- `frontend/src/app/app.routes.ts` — remove Aktivitaet route
- Sidebar component — remove Aktivitäten nav item
- Seeder — remove aktivitaet from `INSERT_ORDER`, fixture interface, and data
- `CLAUDE.md` — remove Aktivitaet from domain model list
- `docs/specs/` — remove Aktivitaet sections
- Check if any entity detail page renders an "Aktivitäten" tab — remove if so

---

#### A4 — Remove Abteilung Entity

**Estimated savings:** ~490 lines TypeScript + 2 indexes (`idx_abteilung_firmaId`, `idx_person_abteilungId`) + `Person.abteilungId` column drop.

**Risk:** Medium. **CONFIRMED:** `person.abteilungId` FK exists (`schema.ts:41-43` with `onDelete: 'set null'`; DDL matches in `migrate.ts:40`). OQ-5 is resolved — this removal requires a schema migration and multiple frontend touch points.

**Rationale:** Department management is a secondary feature. Coupling is manageable but wider than the other entities, so risk is Medium, not Low.

**SQLite column drop procedure:** SQLite 3.35+ supports `ALTER TABLE DROP COLUMN`, but for portability across macOS/Linux/Windows use the rebuild pattern (CREATE new table → INSERT SELECT → DROP old → RENAME). Verify SQLite version on target platforms or use the rebuild pattern unconditionally.

**Pre-condition:** Remove `backend/src/routes/firmen.ts` import of `abteilungService` and the `/:id/abteilungen` sub-endpoint BEFORE deleting `abteilungService.ts` — otherwise TypeScript build fails.

**What gets removed (backend):**
- `backend/src/services/abteilungService.ts`
- `backend/src/routes/abteilungen.ts`
- `abteilung` table from `backend/src/db/schema/schema.ts`
- `abteilungId` column from `person` table in `schema.ts` and `migrate.ts`
- `abteilung` CREATE TABLE + 2 CREATE INDEX lines from `migrate.ts`
- `AbteilungCreateSchema` block from `backend/src/utils/validation.ts`

**What gets removed (frontend):**
- `frontend/src/app/features/abteilung/` — entire directory
- `frontend/src/app/core/services/abteilung.service.ts`
- `frontend/src/app/core/models/abteilung.model.ts` (if exists)

**What needs updating (backend):**
- `backend/src/routes/firmen.ts` — remove `abteilungService` import and `/:id/abteilungen` GET route (lines ~60–68)
- `backend/src/index.ts` — remove route registration for `/api/abteilungen`
- Seeder — remove abteilung from `INSERT_ORDER` and fixture interface; drop `abteilungId` from every person INSERT; remove `abteilung` table from fixture data (or hand-written seeder if B1 accepted)

**What needs updating (frontend) — full cascade from fe-reviewer:**
- `frontend/src/app/core/models/firma.model.ts` — drop `Firma.abteilungenCount` field (line ~26)
- `frontend/src/app/core/models/person.model.ts` — drop `Person.abteilungId`, `Person.abteilungName`, and `PersonCreate.abteilungId` (lines ~13–14, 23–25)
- `frontend/src/app/core/services/firma.service.ts` — remove `Abteilung` import and `getAbteilungen()` method (lines ~4, 48–51)
- `frontend/src/app/features/firma/firma-detail/firma-detail.component.ts` — drop `Abteilung` import, `abteilungenPage` property, `loadAbteilungen()` method, and all tab-switching logic (lines ~5, 8, 28, 56–60)
- `frontend/src/app/features/firma/firma-detail/firma-detail.component.html` — remove the "Abteilungen" tab block (lines ~96–132) AND collapse the remaining single-tab UI into a plain Personen card section (no tab chrome)
- Personen table column "Abteilung" in `firma-detail.component.html` — remove header + cell
- `frontend/src/app/features/person/person-form/person-form.component.ts` — remove `AbteilungService` import, `Abteilung` model import, `abteilungId` FormControl, and the `firmaId.valueChanges` subscription that calls `abteilungService.getAllByFirmaId()` (lines 4, 6, 23, 31, 42, 49, 51, 53, 65–67)
- `frontend/src/app/features/person/person-form/person-form.component.html` — remove Abteilung dropdown (line ~60–61)
- Person detail page — remove "Abteilung" label/field from info card (becomes dangling "–" otherwise)
- `frontend/src/app/app.routes.ts` — remove Abteilung route
- Sidebar component — remove Abteilungen nav item
- `CLAUDE.md` — remove Abteilung from domain model list
- `docs/specs/` — remove Abteilung sections

---

#### A5 — Remove Welcome Feature

**Estimated savings:** ~170 lines TypeScript/HTML/SCSS.

**Risk:** Low. Simple routed component. No backend dependency.

**OQ-1 resolved by codebase inspection:** `welcome.component.html` shows "Glückwunsch! Du bist nun bereit für die Schulung." plus an atra.consulting logo and a login button. It is a trainer-controlled pre-login splash screen. Pedagogical value: low — it's a static confirmation page, not a CRM feature.

**Recommendation:** Safe to remove. The only reason to keep it is if trainers rely on it as a day-1 confirmation that setup worked. User should confirm.

**Blocker if removed:** `frontend/src/app/app.routes.ts` line 78 has `{ path: '**', redirectTo: 'welcome' }`. Removing Welcome without updating this breaks unknown-URL navigation.

**What gets removed:**
- `frontend/src/app/features/welcome/` — entire directory

**What needs updating:**
- `frontend/src/app/app.routes.ts` — change wildcard `redirectTo: 'welcome'` to `redirectTo: 'login'` (or `'dashboard'` if authenticated-first preferred). Remove the explicit welcome route.
- Sidebar: no entry exists — no change needed

---

#### A6 — Remove Vertrag Entity

**Estimated savings:** ~620 lines TypeScript (460 frontend + 156 service + 100 route) + `VERTRAG_STATUS` enum + 2 indexes (`idx_vertrag_firmaId`, `idx_vertrag_status`).

**Risk:** Medium. Vertrag likely holds FKs to Firma and/or Person — those parents stay, so FK direction is safe. Risk is Medium because Vertrag demonstrates a date-range contract pattern useful for training.

**Decision needed (OQ-2):** Is contract management a deliberate training scenario? If yes, keep. If not, remove.

**What gets removed:**
- `backend/src/services/vertragService.ts`
- `backend/src/routes/vertraege.ts`
- `vertrag` table from `backend/src/db/schema/schema.ts`
- `vertrag` CREATE TABLE + 2 CREATE INDEX lines from `backend/src/config/migrate.ts`
- `VERTRAG_STATUS` enum from `backend/src/db/schema/enums.ts`
- `VertragCreateSchema` block from `backend/src/utils/validation.ts`
- `frontend/src/app/features/vertrag/` — entire directory
- `frontend/src/app/core/services/vertrag.service.ts`
- `frontend/src/app/core/models/vertrag.model.ts` (if exists)

**What needs updating:**
- `backend/src/index.ts` — remove route registration
- `frontend/src/app/app.routes.ts` — remove Vertrag route
- Sidebar component — remove Verträge nav item (see also sidebar-section-consolidation note below)
- Seeder — remove vertrag from `INSERT_ORDER`, fixture interface, and data
- `CLAUDE.md` — remove Vertrag from domain model list
- `docs/specs/` — remove Vertrag sections

---

#### A7 — Remove Empty Dashboard Shell

**Estimated savings:** ~21 lines TypeScript.

**Risk:** Low. `dashboard.component.ts` + `dashboard.routes.ts` are tiny shells left over after the configurable dashboard was removed in PR #40.

**What gets removed:**
- `frontend/src/app/features/dashboard/` — entire directory (2 files)

**What needs updating:**
- `frontend/src/app/app.routes.ts` — remove dashboard route; update any default redirect (including the wildcard if A5 is accepted) to point at `login` or a list page
- Sidebar component — remove Dashboard nav item if present
- Optional: promote Firmen list as the post-login landing page

---

### Group B — Seeder Simplification

---

#### B1 — Replace Generated Seeder with Hand-Written Data

**Estimated savings:** ~6,755 lines (6,298-line `fixture.json` + 457-line `build-fixture.ts`). `seeder.ts` (71 lines) stays but is **edited**, not rewritten — the fixture loader is replaced with inline data.

**Risk:** Low. The seeder only runs on `--reset-db`. Production data is not affected.

**Rationale:** The current approach generates realistic data with `build-fixture.ts`, then commits the output as a 6,298-line JSON file. Both bloat the repo. AI assistants sometimes read these files. Hand-written inline data with ~10 Firmen, ~20 Personen, and proportional related records is enough for training exercises.

**Trade-off:** Less realistic data volume. Acceptable for a training project.

**Interaction with A-group proposals:**
- The new seeder must preserve FK insertion order (firma → abteilung → person → adresse/gehalt/aktivitaet/vertrag/chance).
- If A4 accepted, drop `abteilung` from the order and drop `abteilungId` from every person row.
- If A2 accepted, drop `gehalt`; if A3 accepted, drop `aktivitaet`; if A6 accepted, drop `vertrag`.

**What gets removed:**
- `backend/src/seed/build-fixture.ts`
- `backend/src/seed/fixture.json`

**What gets edited:**
- `backend/src/seed/seeder.ts` — replace fixture-file loader with inline const arrays; keep the FK-safe INSERT_ORDER logic

**What needs updating:**
- `backend/package.json` — remove any `build-fixture` npm script if present
- `CLAUDE.md` — update seeder description

---

### Group C — Test Infrastructure Removal

---

#### C1 — Remove Fake Playwright Test Infrastructure

**Estimated savings:** 1 npm dependency (`@playwright/test ^1.52.0`), 1 `test` script, CLAUDE.md + spec corrections.

**Risk:** Low. **Verified:** `backend/src/test/` directory does not exist at all (not just empty). No `playwright.config.ts` exists. The only artifacts are the dep and the `"test": "playwright test"` npm script. CLAUDE.md's claim "Backend uses Playwright for end-to-end API tests" is false.

**Rationale:** Keeping the dep misleads AI assistants and human readers.

**Two options for the user:**

| Option | Description |
|--------|-------------|
| C1a — Remove entirely | Drop `@playwright/test` dep, remove `test` script, correct CLAUDE.md and specs |
| C1b — Keep for future use | Keep the dep, correct CLAUDE.md to say "no tests yet" |

**What gets removed (if C1a chosen):**
- `@playwright/test` from `backend/package.json` `devDependencies`
- `"test": "playwright test"` from `backend/package.json` `scripts`

**What needs updating (both options):**
- `CLAUDE.md` — remove or correct the Playwright claim under the Backend conventions section
- `docs/specs/SPECS-backend.md` — remove or correct test infrastructure claims

---

### Group D — Documentation Cleanup

---

#### D1 — Delete Historical PRDs 001–009

**Estimated savings:** ~2,000 lines Markdown.

**Risk:** Low. These PRDs describe features that were either never built or already removed in PR #40.

**Files to delete:**
- `docs/prds/001-kanban-board.md`
- `docs/prds/002-authentication-user-management.md`
- `docs/prds/003-auswertungen.md`
- `docs/prds/004-auswertungen-konfigurierbar.md`
- `docs/prds/005-report-builder.md`
- `docs/prds/006-aktivitaeten-timeline.md`
- `docs/prds/007-globale-volltextsuche.md`
- `docs/prds/008-csv-excel-export.md`
- `docs/prds/009-ciam-microservice.md`

**Coordinated update:** See D12 (docs/prds/README.md).

---

#### D2 — Delete Completed Migration & Feature PRDs

**Estimated savings:** ~1,500 lines Markdown.

**Risk:** Low. All describe completed work on main. No future reference value beyond git history.

**Files to delete:**
- `docs/prds/PRD-SPRING-BOOT-4-MIGRATION.md`
- `docs/prds/PRD-REPLACE-JAVA-NODEJS.md`
- `docs/prds/PRD-AG-GRID-TABLES.md`
- `docs/prds/PRD-SIDEBAR-COLLAPSIBLE.md`
- `docs/prds/PRD-TABLE-HEADING-ENHANCEMENTS.md`
- `docs/prds/PRD-FASTER-DEV-STARTUP.md`
- `docs/prds/PRD-REMOVE-EXTERNAL-AUTH.md`

**Keep:**
- `PRD-REDUCE-MORE-COMPLEXITY.md` — this PRD

**Coordinated update:** See D12 (docs/prds/README.md).

---

#### D3 — Delete All Completed PLAN Files

**Estimated savings:** ~1,328 lines Markdown.

**Risk:** Low. Plans describe completed work. Git history preserves them.

**Files to delete** (all 13 files in `docs/plans/`):
- `PLAN-SPRING-BOOT-4-MIGRATION.md`
- `PLAN-UPDATE-REVIEWER-AGENTS.md`
- `PLAN-UPGRADE-ANGULAR-21.md`
- `PLAN-AG-GRID-TABLES.md`
- `PLAN-CONVERT-CLAUDE-TO-GEMINI.md`
- `PLAN-SIDEBAR-COLLAPSIBLE.md`
- `PLAN-TABLE-HEADING-ENHANCEMENTS.md`
- `PLAN-TABLE-HEADING-COUNTS.md`
- `PLAN-FASTER-DEV-STARTUP.md`
- `PLAN-REMOVE-EXTERNAL-AUTH.md`
- `PLAN-UPDATE-SKILL-FILES.md`
- `PLAN-REPLACE-JAVA-NODEJS.md`
- `PLAN-REDUCE-APP-COMPLEXITY.md`

**Note:** This PRD's own `PLAN-REDUCE-MORE-COMPLEXITY.md` is created after this decision and is not deleted by D3.

---

#### D4 — Delete All REVIEW Files

**Estimated savings:** ~600 lines Markdown (estimated).

**Risk:** Low. Reviews describe completed code reviews. No ongoing reference value.

**Files to delete** (all 14 files in `docs/reviews/`).

---

#### D5 — Delete Completed STATE Files

**Estimated savings:** ~400 lines JSON (estimated).

**Risk:** Low. State files track workflow progress for completed tasks. Git history preserves them.

**Files to delete** (all STATE files for completed tasks):
- `STATE-UPDATE-REVIEWER-AGENTS.json`
- `STATE-UPGRADE-ANGULAR-21.json`
- `STATE-AG-GRID-TABLES.json`
- `STATE-REVIEW-ag-grid-tables.json`
- `STATE-SIDEBAR-COLLAPSIBLE.json`
- `STATE-TABLE-HEADING-ENHANCEMENTS.json`
- `STATE-TABLE-HEADING-COUNTS.json`
- `STATE-FASTER-DEV-STARTUP.json`
- `STATE-UPDATE-GEMINI-SKILLS.json`
- `STATE-REMOVE-EXTERNAL-AUTH.json`
- `STATE-REVIEW-remove-external-auth.json`
- `STATE-REVIEW-update-skill-files.json`
- `STATE-UPDATE-SKILL-FILES.json`
- `STATE-REPLACE-JAVA-NODEJS.json`
- `STATE-REVIEW-replace-java-nodejs.json`
- `STATE-REVIEW-reduce-app-complexity.json`
- `STATE-REDUCE-APP-COMPLEXITY.json`

**Keep:** `STATE-REDUCE-MORE-COMPLEXITY.json` — active task.

---

#### D6 — Delete Obsolete ADRs

**Estimated savings:** ~150 lines Markdown (estimated).

**Risk:** Low. These ADRs document decisions for features that no longer exist.

**Files to delete:**
- `docs/adr/002-dashboard-konfiguration-speicherort.md` — configurable dashboard removed in PR #40
- `docs/adr/003-ciam-microservice.md` — CIAM never built
- `docs/adr/004-ciam-technologie-portierung.md` — CIAM dropped

**Keep:**
- `docs/adr/001-authentication-architecture.md` — still relevant (describes current session-based auth)

**What needs updating:**
- `docs/adr/README.md` — remove links to deleted ADRs

---

#### D7 — Delete UXDR Report Builder Design + README

**Estimated savings:** ~100 lines Markdown.

**Risk:** Low. Report Builder was removed in PR #40. Only one UXDR existed; the index becomes empty.

**Files to delete:**
- `docs/uxdr/001-report-builder-design.md`
- `docs/uxdr/README.md` (becomes an empty index)
- Optional: delete the whole `docs/uxdr/` directory

---

#### D8 — Delete SPECS-ciam.md and Clean SPECS.md Links

**Estimated savings:** ~200 lines Markdown (estimated).

**Risk:** Low. CIAM microservice was never built.

**Files to delete:**
- `docs/specs/SPECS-ciam.md`

**What needs updating:**
- `docs/specs/SPECS.md` — remove all links and references to SPECS-ciam.md

---

#### D9 — Delete TODOS-SPRING-BOOT-4-MIGRATION.md

**Estimated savings:** ~50 lines Markdown.

**Risk:** Low. Spring Boot is gone.

**Files to delete:**
- `docs/todos/TODOS-SPRING-BOOT-4-MIGRATION.md`
- Optional: delete the whole `docs/todos/` directory if empty afterward.

---

#### D10 — Rewrite welcome_DE.MD and welcome_EN.MD

**Estimated savings:** Net ~0 lines (rewrite, not deletion).

**Risk:** Low. These are standalone files. No code references them.

**Rationale:** Both files describe the old Java/Spring Boot + Kotlin CIAM stack. Trainees reading them get wrong setup instructions.

**Files to rewrite:**
- `docs/welcome_DE.MD`
- `docs/welcome_EN.MD`

---

#### D11 — Delete google-apps-script-feedback.js

**Estimated savings:** ~79 lines JavaScript (confirmed).

**Risk:** Low. Only relevant if the Feedback feature (A1) is removed. If A1 is not removed, keep this file.

**Dependency:** Implement only if A1 is accepted.

**Files to delete:**
- `docs/google-apps-script-feedback.js`

---

#### D12 — Delete or Rewrite docs/prds/README.md

**Estimated savings:** ~50 lines Markdown (estimated).

**Risk:** Low. After D1 + D2, most of its links point to deleted files.

**Options:**
- Delete outright, or
- Rewrite as a brief one-paragraph stub.

---

### Group E — Windows Support

---

#### E1 — Drop Windows Support

**Estimated savings:** ~100 lines BAT + 596 KB PNG image.

**Risk:** Low. Only affects Windows trainees.

**Decision needed (OQ-3):** Drop `start.bat` and `docs/images/node-installer-tools-checkbox.png` only if no trainees use Windows.

**Files to delete (if accepted):**
- `start.bat`
- `docs/images/node-installer-tools-checkbox.png`

**What needs updating:**
- `README.md` — remove Windows setup instructions and Node installer screenshot section
- `docs/welcome_DE.MD` / `docs/welcome_EN.MD` — remove Windows sections (coordinate with D10)

---

## 5. Special Instructions

**User selection required.** Each proposal is independent. The implementation plan covers only the proposals the user accepts.

**After any entity removal (A2–A4, A6):**
1. Update `CLAUDE.md` domain model list.
2. Update the seeder (`seeder.ts` inline data if B1 accepted, or `fixture.json` + `seeder.ts` otherwise) — drop the entity from `INSERT_ORDER`, from the fixture interface, and from the data.
3. Remove the corresponding index lines from `backend/src/config/migrate.ts`.
4. Remove the corresponding enum from `backend/src/db/schema/enums.ts`.
5. Remove the corresponding `*CreateSchema` block from `backend/src/utils/validation.ts`.
6. Remove sidebar nav item.
7. Remove frontend route.
8. Remove backend route registration in `index.ts`.
9. Remove Drizzle schema table and `migrate.ts` CREATE TABLE statement.
10. Check for FK references from other entities — resolve before deleting the table.

**Note on permissionGuard:** `app.routes.ts` uses only `authGuard`. No `permissionGuard('PERMISSION')` calls exist in routes (all removed in PR #40). Any step in this PRD that says "remove permissionGuard" is a no-op — skip.

**Sidebar-section consolidation (UX side-effect):**
- If A3 + A6 both accepted, the "Vertrieb" sidebar section collapses to just Chancen. Remove the section heading and render Chancen as a flat item.
- If A2 is the only entity remaining in the "Personal" section, remove the section heading.
- If both A2 and A3 accepted together with A4, most of Personal/Vertrieb structure collapses — re-review sidebar grouping.

**Relational constraints to verify before removal:**
- **Adresse: NOT a removal candidate.** Child of Firma. Firma detail views depend on it.
- **Abteilung (A4):** Person.abteilungId FK is CONFIRMED. Schema migration required (see A4 section).
- **Vertrag (A6):** No other entity holds a FK to Vertrag. Safe in FK direction.

**D11 depends on A1.** Delete `google-apps-script-feedback.js` only if the Feedback feature is removed.

**Floor analysis (pedagogical scope):**
- Minimum accepted set (A1 + A2 + A3): remaining entities are Firma, Person, Adresse, Abteilung, Chance, Vertrag — 6 entities, still teaches one-to-many, list/detail/form, relational navigation.
- Aggressive set (A1 + A2 + A3 + A4 + A6): remaining entities are Firma, Person, Adresse, Chance — 4 entities. Thin but functional. Still teaches Firma → Person → Adresse cascade and Firma → Chance sales pipeline.
- Do not drop below 4 entities — the app stops being a recognizable CRM.

---

## 6. Implementation Approach

High-level only. Detailed steps go in a separate PLAN file.

**Phase A — User selects proposals.** User reviews this PRD and picks which proposal IDs to implement.

**Phase B — Remove source code.** Implement all accepted A-group proposals. Apply B1 seeder replacement if accepted.

**Phase C — Remove documentation.** Delete and rewrite all accepted D-group and E-group files.

**Phase D — Update CLAUDE.md and specs.** Align `CLAUDE.md` entity list, auth description, and test claims with the new state. Align `docs/specs/SPECS.md` and per-area spec files.

Each phase is independently committable. Commit messages reference this PRD.

---

## 7. Test Strategy

After any code removal:

1. **Frontend build check:** `cd frontend && npx ng build` — zero errors.
2. **Backend start check:** `cd backend && npx tsx src/index.ts` — starts without errors.
3. **Golden path manual test:**
   - Login as `admin / admin123`.
   - List Firmen — table loads with data.
   - Create a new Firma — form submits, record appears in list.
   - Edit the Firma — changes save.
   - Delete the Firma — record disappears.
4. **Schema consistency:** `./start.sh --reset-db` succeeds without FK violations.
5. **Seeder check (if B1 accepted):** Database recreates and seeds in under 5 seconds.
6. **Sidebar nav:** every visible sidebar item routes to a working page.
7. **No dead references:** grep the codebase for the removed entity names — zero matches outside this PRD.

---

## 8. Non-Functional Requirements

- App must still start via `./start.sh` after any change.
- SQLite schema must stay internally consistent. No orphan FK references.
- `CLAUDE.md` must reflect the actual state of the codebase at all times.
- `docs/specs/SPECS.md` must not link to deleted files.
- No removal may break the login flow or the Firma CRUD flow.

---

## 9. Success Criteria

1. Total TypeScript line count drops by at least 2,000 lines from the 10,788 baseline (minimum: accept A1 + A2 + A3).
2. `docs/` + backend seeder combined shrinks by at least 8,000 lines when D1–D5 + B1 are accepted.
3. `CLAUDE.md` domain model list matches the entities that actually exist in the schema.
4. `CLAUDE.md` makes no false claims about tests, stack, or features.
5. `docs/specs/SPECS.md` contains no broken links.
6. `./start.sh` starts the app without errors.
7. `npx ng build` completes without errors.
8. Login works. Firma list loads. Firma create/edit/delete works.
9. No ADR, PRD, PLAN, REVIEW, STATE, or SPECS file describes a feature or stack that no longer exists.
10. Seeder (if B1 accepted) runs in under 5 seconds and produces a usable dataset.
11. At least 4 CRM entities remain and the app is still navigable end-to-end.

---

## 10. Open Questions

| # | Question | Owner | Impact |
|---|----------|-------|--------|
| OQ-1 | Does the Welcome feature have training value? (Pre-login splash confirming setup.) | User | A5 decision |
| OQ-2 | Is Vertrag a deliberate teaching example (date ranges, contract states)? | User | A6 decision |
| OQ-3 | Do any trainees use Windows? | User | E1 decision |
| OQ-4 | Keep Playwright dependency for future tests (C1b) or remove entirely (C1a)? | User | C1 decision |

**Resolved during PRD review:**
- ~~OQ-5: Is Abteilung used as FK in Person table?~~ → **YES**, confirmed in `schema.ts:41-43`. A4 requires schema migration.

---

## 11. Implementation

*To be filled in after implementation commits and PRs are created.*
