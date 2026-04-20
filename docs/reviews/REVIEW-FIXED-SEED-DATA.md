# Code Review: FIXED-SEED-DATA

**Branch:** `fixed-seed-data`
**PRD:** `docs/prds/PRD-FIXED-SEED-DATA.md`
**Plan:** `docs/plans/PLAN-FIXED-SEED-DATA.md`
**Reviewers:** be-reviewer, db-reviewer

## Summary

**Clean. No blockers. One non-blocker suggestion recorded.**

## Backend Review (be-reviewer)

- `dataMigration.ts`: verbatim `INSERT_SQL` + `INSERT_ORDER` from seeder.ts. Guard → JSON.parse → single transaction → completion log — all correct. No try/catch. Log format character-identical to seeder.
- `index.ts`: import and call cleanly updated. Startup order correct.
- `seeder.ts`: deleted.
- `build-fixture.ts`: dev-tool header added; no functional change.
- No collateral damage elsewhere.

## Data-Layer Review (db-reviewer)

- Schema / DDL untouched. `fixture.json` unchanged.
- INSERT_SQL covers every schema column for every table — no drift.
- INSERT_ORDER is FK-safe.
- Single transaction wraps all inserts; rollback on any failure re-arms the guard correctly.
- PRAGMA foreign_keys inherited from the shared `sqlite` singleton; not re-set (correct).
- ESM `__dirname` resolution is correct.

## Non-blocker suggestion (not applied)

Idempotency guard only checks `firma`. A more defensive guard could check multiple tables (`MIN(COUNT(firma), COUNT(person)) > 0`). The current code matches the original `seeder.ts` behavior per the plan. Out of scope for this change.

## Verification

Phase 3 smoke tests all pass (fresh start, idempotent restart, reset reproducibility, UI browsing via Playwright MCP, FK resolution on detail pages). Frontend build green.
