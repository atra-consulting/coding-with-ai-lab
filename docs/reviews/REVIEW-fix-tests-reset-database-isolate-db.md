# Code Review - fix-tests-reset-database-isolate-db

**Date**: 2026-07-09
**Branch**: fix-tests-reset-database-isolate-db
**Base**: solution-jfs-2026 (fork point)
**Files Reviewed**: 3 (backend/src/config/db.ts, backend/src/test/globalSetup.ts, backend/playwright.config.ts, + backend/playwright.test.config.ts caveat)
**Review Rounds**: 2

## Summary

Fix stops the backend Playwright suite from resetting the dev database. Root cause: `db.ts` hardcoded `crmdb.sqlite` regardless of `NODE_ENV`, so `npm test` mutated the dev DB. Fix routes the test backend to a separate `crmdb.test.sqlite` and points the test runner's own DB client at the same file. Verified: 331 tests pass, dev DB SHA-256 identical before/after a run, test DB created separately.

## Review Rounds

### Round 1

**Issues found**: 3 | **Fixes applied**: 3

| # | Severity | File | Issue | Found by | Fix | Fixed by |
|---|----------|------|-------|----------|-----|----------|
| 1 | WARNING | `backend/src/test/globalSetup.ts:40` | Cleanup deleted `-wal`/`-shm`, but @libsql/client uses rollback-journal mode locally → real sidecar is `-journal` | be-test-reviewer | Added `-journal` to the suffix loop | direct fix |
| 2 | WARNING | `backend/src/test/globalSetup.ts:38` | Test DB deleted before killing a possibly-stale backend still holding the file | be-test-reviewer | Moved deletion to run after the port-7070 kill | direct fix |
| 3 | WARNING | `backend/playwright.test.config.ts` | Split-brain caveat (NODE_ENV mismatch) documented only in the plan, not the file | be-test-reviewer | Added caveat comment in the config file | direct fix |

db-reviewer reviewed `db.ts`: clean, no issues.

### Round 2

**Issues found**: 1 | **Fixes applied**: 1

| # | Severity | File | Issue | Found by | Fix | Fixed by |
|---|----------|------|-------|----------|-----|----------|
| 1 | SUGGESTION | `backend/src/test/globalSetup.ts:106` | Step renumber left later comments as duplicate `2.`/`3.` | be-test-reviewer | Renumbered to `4.`/`5.` | direct fix |

All Round-1 fixes re-verified correct (reordering safe, `-journal` correct, caveat accurate).

## Remaining Issues

No remaining issues.

## Project Context Validation

- Turso/CI path unaffected: `TURSO_DATABASE_URL` still wins in `db.ts`; deletion step gated on its absence.
- Vercel/prod unaffected: prod sets Turso URL; `mkdirSync` guard unchanged.
- `crmdb.test.sqlite` under `backend/data/` is gitignored (`.gitignore` `data/`).
- Follows CLAUDE.md conventions (async libSQL client, ISO dates unaffected).

## Next Steps

- Ensure all tests pass — done (331 passed).
- Update documentation if needed.
- Create PR when ready (scope: review only).

---
Generated with Claude Code - bpf-review v1.4.0
