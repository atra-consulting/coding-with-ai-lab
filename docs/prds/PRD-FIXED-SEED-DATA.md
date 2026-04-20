# PRD: Fixed Seed Data via DB Migration (FIXED-SEED-DATA)

**Task Key:** FIXED-SEED-DATA
**Date:** 2026-04-20
**Status:** Draft

---

## 1. Source

User request: "The application is filled with random data upon first start-up. Change this to fixed data, loaded in via DB migrations. Use the currently available data here as the basis for that."

---

## 2. Problem Statement

Start-up data loads through a separate seeder step, not through migrations. This creates two problems.

**Conceptual mismatch.** Schema migrations and data loading are separate concerns today. Developers must understand two systems: `migrate.ts` for schema and `seeder.ts` for data. Migrations are the standard place for "what a fresh database looks like." The seeder is a surprise extra step.

**Unnecessary complexity.** The start-up flow is: `runMigrations()` → `runSeeder()`. The seeder reads `fixture.json` (4,874 lines) and inserts 390 rows. `build-fixture.ts` (457 lines) is a PRNG script that generated `fixture.json`. Both files consume significant token budget when AI assistants read the codebase.

**"Random" data perception.** The data comes from a PRNG generator (`mulberry32`, seed=42). The output is committed as `fixture.json`, so it is already deterministic. But the generator script's existence implies randomness. Fixed, named, human-readable data feels more intentional.

---

## 3. Requirements

**[REQ-001] Data loads as part of migration start-up.**
Priority: High
Reason: One responsibility owner, not two. Schema DDL + initial data load are orchestrated together.
Acceptance: `index.ts` calls `runMigrations()` followed by `runDataMigration()`. No call to `runSeeder()` remains. Database contains data after first start. Both calls throw on failure — no silent swallowing.

**[REQ-002] `fixture.json` is the authoritative data source.**
Priority: High
Reason: The file already exists, is committed, and is deterministic. No need to regenerate it.
Acceptance: The data migration step reads from `fixture.json`. All 390 rows load correctly with no FK violations. Entity counts: 25 Firmen, 50 Abteilungen, 100 Personen, 100 Adressen, 75 Aktivitaeten, 40 Chancen.

**[REQ-003] Migration runs exactly once, atomically.**
Priority: High
Reason: Re-running migrations on an existing database must not insert duplicate rows. A partial failure must not leave the database half-loaded.
Acceptance:
- Guard: `runDataMigration()` executes `SELECT COUNT(*) FROM firma`. If the count is > 0, the function returns immediately. No migration-tracking table is introduced.
- All entity inserts run inside a single `sqlite.transaction(...)` call. Any insert failure rolls back the entire transaction atomically. After a rollback, the firma-count guard correctly detects an empty state on the next start.
- `JSON.parse` happens before the transaction opens, so a malformed `fixture.json` throws before any DB write.
- No duplicate rows appear on re-start.

**[REQ-004] `./start.sh --reset-db` produces the same fixed dataset every time.**
Priority: High
Reason: Reproducibility. Developers and trainees get a known starting state after a reset.
Acceptance: Delete the SQLite file, start the app, see the same 390 rows as before. Run again — same result.

**[REQ-005] `seeder.ts` is deleted.**
Priority: Medium
Reason: The data migration step replaces it entirely.
Acceptance: `backend/src/seed/seeder.ts` does not exist. `index.ts` does not import or call it.

**[REQ-006] `build-fixture.ts` is retained as a developer tool.**
Priority: Low
Reason: Schema changes may require regenerating `fixture.json`. The generator should not disappear.
Acceptance: `backend/src/seed/build-fixture.ts` still exists. A comment at the top explains its purpose: regenerate `fixture.json` after schema changes. It is not called at runtime.

**[REQ-007] Log format matches the current seeder.**
Priority: Medium
Reason: Observable behavior should not regress.
Acceptance: `runDataMigration()` emits the same `=== Seeder: ... ===` delimiter style and per-entity count lines as the current `seeder.ts`. Identical output format across skip, start, and completion paths.

---

## 4. Special Instructions

- Domain model uses German names: Firma, Person, Abteilung, Adresse, Aktivitaet, Chance. Keep these in all code and log messages.
- FK insertion order must be respected: Firma → Abteilung → Person → Adresse, Aktivitaet, Chance.
- Follow CLAUDE.md conventions: dates as ISO-8601 strings, monetary values as REAL.
- Update `CLAUDE.md` start-up flow description after the change.
- Related PRD: `docs/prds/PRD-REDUCE-MORE-COMPLEXITY.md` item B1 proposes replacing `fixture.json` with hand-written inline data. This PRD is independent of B1. If B1 is implemented later, the data migration step changes its data source but not its position in the start-up flow.
- **Known data quality note (out of scope):** Timestamps in `fixture.json` use space-separator format (`2025-01-25 05:00:23`), while new rows created at runtime use `new Date().toISOString()` (T-separator). Mixing both on the same TEXT column can cause wrong sort order (`T` > space in ASCII). This PRD preserves the existing fixture data as-is per the user request ("use the currently available data"). A follow-up cleanup may normalize fixture timestamps.

---

## 5. Implementation Approach

**Decision: new `backend/src/seed/dataMigration.ts` module.**

Add a `runDataMigration()` function in `backend/src/seed/dataMigration.ts` — same directory as `fixture.json`, so `join(__dirname, 'fixture.json')` resolves cleanly without cross-directory path arithmetic. Call it from `index.ts` after `runMigrations()`, replacing the `runSeeder()` call.

`runDataMigration()` checks whether the `firma` table has any rows. If rows exist, it exits immediately — data is already loaded. If the table is empty, it reads `fixture.json`, parses it, then opens a single SQLite transaction and inserts all entities in FK-safe order (same pattern as the current `seeder.ts`). Any failure during insert rolls back the whole transaction; any error during JSON read or parse throws before the transaction opens.

Rationale for this approach over alternatives:

| Approach | Why rejected |
|----------|-------------|
| Inline SQL in `migrate.ts` | Adds 390+ rows of raw SQL to a file that today holds only DDL. Hard to read, hard to diff. |
| Versioned migration table (like Flyway) | Over-engineered for a training project with one fixed dataset and no migration history requirement. |
| Keep fixture.json + separate seeder | Status quo. Does not meet REQ-001. |
| Inline const arrays in code | Replaces a readable JSON file with 4,874 lines of TypeScript literals. Worse, not better. |

`fixture.json` stays as-is. No reformatting or restructuring needed.

`build-fixture.ts` stays as-is. Add a file-level comment explaining it is a dev tool, not a runtime file.

`seeder.ts` is deleted. Its logic moves into the new data migration function.

`index.ts` start-up flow becomes: `runMigrations()` → `runDataMigration()` → server listens.

**Schema evolution (future-proofing).** When the schema changes (new tables, new columns — e.g., adding `latitude`/`longitude` to Adresse for a broader set of rows, or adding a new entity), the workflow is:

1. Update the Drizzle schema (`db/schema/schema.ts`) and the DDL in `config/migrate.ts`.
2. Update `fixture.json` to include the new columns. Two options:
   - **Regenerate:** extend `build-fixture.ts` to produce the new columns, then run it and commit the updated `fixture.json`. This is why REQ-006 keeps the generator.
   - **Hand-edit:** for small changes, edit `fixture.json` directly.
3. Update `INSERT_SQL` in `dataMigration.ts` to include the new columns.

The module is structurally friendly to this pattern: one `INSERT_SQL` entry per table, one `INSERT_ORDER` list, one fixture file. Adding a column is a three-line change. Adding a new entity is a new `INSERT_SQL` entry, a new fixture key, and a new slot in `INSERT_ORDER`.

Rows already in a user's local database are not affected by later schema changes — they stay at the old shape. The firma-count guard prevents re-seeding. For a trainee or developer who wants the new columns populated, `./start.sh --reset-db` rebuilds from scratch.

---

## 6. Test Strategy

1. **Fresh start:** Delete `backend/data/crmdb.sqlite`. Run `./start.sh`. Verify all 390 rows are present. Check each entity count: 25 Firmen, 50 Abteilungen, 100 Personen, 100 Adressen, 75 Aktivitaeten, 40 Chancen.
2. **Idempotent re-start:** Stop and restart without deleting the database. Row counts must not change. No errors in logs.
3. **Reset reproducibility:** Run `./start.sh --reset-db` twice. Row counts must be identical both times.
4. **FK integrity:** No FK violation errors during data load. SQLite `PRAGMA foreign_keys = ON` must be active.
5. **No seeder reference:** Grep for `runSeeder` and `seeder` in `index.ts` — zero matches.
6. **Build check:** `cd frontend && npx ng build` — zero errors (frontend is not changed, but verify no regressions).
7. **Backend start check:** `cd backend && npx tsx src/index.ts` — starts cleanly, data migration log line appears.

---

## 7. Non-Functional Requirements

- **Startup time:** Data migration must complete in under 3 seconds on first run (390 rows, single transaction).
- **Reproducibility:** Same 390 rows every time. Data is not generated at runtime.
- **Idempotency:** Running migrations N times produces the same database state as running them once.
- **No runtime dependency on `build-fixture.ts`:** The app must start without executing the PRNG generator.
- **CLAUDE.md accuracy:** After implementation, `CLAUDE.md` must describe the actual start-up flow.

---

## 8. Success Criteria

- [ ] `index.ts` calls `runMigrations()` then `runDataMigration()`, no `runSeeder()` call.
- [ ] `backend/src/seed/dataMigration.ts` exists and exports `runDataMigration()`.
- [ ] `backend/src/seed/seeder.ts` is deleted.
- [ ] `backend/src/seed/build-fixture.ts` exists with a dev-tool comment. Not called at runtime.
- [ ] `backend/src/seed/fixture.json` is unchanged.
- [ ] Fresh start loads all 390 rows. FK integrity holds.
- [ ] Restart without reset produces no duplicate rows and no errors.
- [ ] `./start.sh --reset-db` produces the same 390 rows on every run.
- [ ] Data migration completes in under 3 seconds.
- [ ] Log output matches the existing `=== Seeder: ... ===` format (per REQ-007).
- [ ] `CLAUDE.md` start-up flow section reflects the new flow.
- [ ] `cd backend && npx tsx src/index.ts` starts without errors.

---

## 9. Open Questions

None. All previous open questions (module placement, log format) are now closed by REQ-007 and Section 5.

---

## 10. Implementierung

- `5b6d084` — feat: Replace runtime seeder with runDataMigration.
- `f212ac7` — refactor: Remove seeder.ts, clarify build-fixture as dev tool.
- Branch: `fixed-seed-data`.
- PR: https://github.com/atra-consulting/coding-with-ai-lab/pull/49
