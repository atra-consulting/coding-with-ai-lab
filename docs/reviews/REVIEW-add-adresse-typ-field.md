# Code Review - add-adresse-typ-field

**Date**: 2026-06-18
**Branch**: add-adresse-typ-field
**Base**: main
**Files Reviewed**: 5
**Review Rounds**: 1

## Summary

Adds the `typ` field (already present in the DB schema since the initial migration) to `AdresseDTO`, `AdresseRow`, `BASE_QUERY`, `toDTO()`, `INSERT`, `UPDATE`, and `AdresseCreateSchema`. All 6 change points are correct. A new Playwright test file `adressen-typ.spec.ts` covers POST/GET/PUT with full auth coverage (401 tests) and 404 tests. One dead-code suggestion was auto-fixed.

## Review Rounds

### Round 1

**Issues found**: 4 | **Fixes applied**: 1

| # | Severity | File | Issue | Found by | Fix | Fixed by |
|---|----------|------|-------|----------|-----|----------|
| 1 | CRITICAL (false alarm) | `backend/src/config/migrate.ts` | No `ALTER TABLE adresse ADD COLUMN typ TEXT` — but `typ` has been in `CREATE TABLE` since the first and only migration commit; all existing DBs already have the column | db-reviewer | No fix needed — false alarm | — |
| 2 | WARNING | `backend/src/utils/validation.ts:47` | `typ` accepts any free-form string; no enum constraint | be-reviewer | Pre-existing design choice; no enum vocabulary defined in codebase — skipped | — |
| 3 | WARNING | `backend/src/services/adresseService.ts:153` | Asymmetric null handling: `typ` uses `?? null` while `latitude`/`longitude` use `undefined`-guard | be-reviewer | Pre-existing pattern for all text fields; consistent with street, city, country — skipped | — |
| 4 | SUGGESTION | `backend/src/test/adressen-typ.spec.ts:55` | `createdIds` array populated but never used | be-reviewer | Removed dead code (`const createdIds` declaration and two `.push()` calls) | be-coder |

## Remaining Issues

No remaining issues. Warnings are pre-existing design patterns not introduced by this PR.

## Project Context Validation

- All route handlers use `requireAuth` (pre-existing pattern for adressen routes)
- SQL queries fully parameterized — no injection risk
- TypeScript types correct and consistent
- Drizzle schema (`schema.ts`) already had `typ: text('typ')` — in sync
- Migration `typ TEXT` in `CREATE TABLE` since initial commit — no ALTER TABLE needed

## Next Steps

- All tests pass (106/106)
- Create PR when ready

---
Generated with Claude Code - review v1.7.0
