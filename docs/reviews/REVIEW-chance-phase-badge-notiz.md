# Code Review - chance-phase-badge-notiz

**Date**: 2026-05-06
**Branch**: chance-phase-badge-notiz
**Base**: main
**Files Reviewed**: 12 (4 backend, 5 frontend, 3 docs)
**Review Rounds**: 1

## Summary

This branch adds two features to the Chance entity: colored phase badges in the list view (the detail already had them), and a new optional free-text `notiz` field end-to-end (DB → backend → frontend form + detail). The implementation is functionally correct — INSERT/UPDATE parameter counts match, migration is idempotent, Angular conventions are followed, and `ng build` passes.

Two findings require a decision: one actionable DDL drift issue and one pre-existing empty error handler pattern. Two additional pre-existing issues are flagged for awareness but were not introduced by this PR.

## Review Rounds

### Round 1

**Issues found**: 5 | **Fixes applied**: 0 (pending user decision)

| # | Severity | File | Issue | Found by | Pre-existing? |
|---|----------|------|-------|----------|--------------|
| 1 | WARNING | `backend/src/config/migrate.ts:73-87` | `notiz TEXT` absent from `CREATE TABLE chance` DDL block. Column only arrives via the ALTER TABLE guard. Fresh installs work (ALTER TABLE guard runs), but the CREATE TABLE block is misleading documentation — it doesn't reflect the actual table shape. | be-reviewer, db-reviewer | No (introduced by this PR) |
| 2 | WARNING | `backend/src/routes/chancen.ts` | Routes use `requireAuth` but not `requirePermission('CHANCEN')` as specified in CLAUDE.md conventions. | be-reviewer | Yes (pre-existing) |
| 3 | WARNING | `frontend/src/app/features/chance/chance-list/chance-list.component.ts:54` | Raw `params.value` interpolated into AG Grid cell HTML string. Phase values are a controlled enum enforced by backend, so active XSS risk is minimal (confidence: 50%). | fe-reviewer | No |
| 4 | WARNING | `frontend/src/app/features/chance/chance-form/chance-form.component.ts:86,93` | Empty `error` callbacks in `onSubmit()` silently swallow API errors. `NotificationService` is injected but not called on error. | fe-reviewer | Yes (pre-existing) |
| 5 | SUGGESTION | `frontend/src/app/features/chance/chance-form/chance-form.component.html:117-126` | No character counter visible to user for the 2000-char notiz field. | fe-reviewer | No |

## Remaining Issues

All 5 issues remain unfixed pending user decision at Checkpoint 10.

**Recommended action:**
- Fix #1 (add `notiz TEXT` to `CREATE TABLE chance` DDL) — small change, improves schema documentation accuracy
- Skip #2, #4 (pre-existing, out of scope for this PR)
- Skip #3 (low confidence, enum-controlled values — actual risk negligible)
- Skip #5 (UX suggestion, out of scope)

## Project Context Validation

- PRD requirements all met: phase badge in list ✓, detail unchanged ✓, notiz stored/retrieved ✓, form textarea with 3 rows and maxlength 2000 ✓, detail shows with pre-line ✓, list has no notiz column ✓
- CLAUDE.md conventions: Angular `@if`/`@for` used ✓, `inject()` for DI ✓, `?` positional params for SQL ✓, ISO dates for timestamps ✓
- `ng build` passes with only pre-existing warnings ✓

## Next Steps

- Fix issue #1 (add `notiz TEXT` to CREATE TABLE chance DDL)
- Skip pre-existing issues #2 and #4
- Push and create PR targeting `claude/elegant-chandrasekhar-672aef`

---
Generated with Claude Code - review v1.6.0
