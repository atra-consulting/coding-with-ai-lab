# Code Review - vercel-turso-deployment

**Date**: 2026-06-11
**Branch**: vercel-turso-deployment
**Base**: main
**Files Reviewed**: 42
**Review Rounds**: 1

## Summary

Final review of the better-sqlite3 → @libsql/client (Turso) migration plus Vercel deployment packaging (Express as serverless function, Angular static, GitHub Actions CI/CD). Three domain reviewers (be, db, fe) ran in parallel on the full branch diff. db-reviewer and fe-reviewer reported the branch clean; be-reviewer found one warning and one suggestion, both fixed in this round. Earlier in-implementation review rounds had already caught and fixed: session TTL via `originalMaxAge`, missing `trust proxy`, `CORS_ORIGINS`/`SESSION_SECRET` env requirements, deploy-job backend `npm ci`, init-promise error surfacing, and the `@libsql/client` version pin.

## Review Rounds

### Round 1

**Issues found**: 2 | **Fixes applied**: 2

| # | Severity | File | Issue | Found by | Fix | Fixed by |
|---|----------|------|-------|----------|-----|----------|
| 1 | WARNING | `backend/src/middleware/libsqlSessionStore.ts:24` | Constructor-time expired-session sweep fires at module evaluation, racing `runMigrations()` table creation on a fresh database (error swallowed silently) | be-reviewer | Sweep moved out of the constructor into a lazy `sweepExpiredOnce()` triggered by the first `get`/`set` — by then migrations have completed | direct fix |
| 2 | SUGGESTION | `backend/src/middleware/session.ts:4` | No startup warning when production runs on the fallback `SESSION_SECRET` (forgeable cookies) | be-reviewer | Added a `console.warn` when `NODE_ENV=production` and `SESSION_SECRET` is unset | direct fix |

Verification after fixes: `tsc --noEmit` clean; backend Playwright suite 45 passed / 0 failed (2 pre-existing skips).

## Remaining Issues

No remaining issues.

Accepted plan risks (documented in `docs/plans/PLAN-VERCEL-TURSO-DEPLOYMENT.md`, R1–R5) remain accepted: PRAGMA durability is guarded by the no-`client.transaction()` constraint with the cascade-delete test as canary; cold-start seed TOCTOU on an empty Turso DB is tolerated (COUNT guard, idempotent DDL).

## Project Context Validation

- CLAUDE.md conventions respected: ISO-8601 text dates, REAL for monetary values, PRAGMA foreign_keys per connection, sort-field whitelists intact (db-reviewer verified no injection surface), `requireRole`/`requirePermission` on every route (be-reviewer verified), Spring-style pagination shape preserved, error shape `{ status, message, timestamp, fieldErrors }` preserved through the new `asyncHandler`.
- Plan followed: all 9 phases implemented; both test suites green; local dev (`./start.sh`) unchanged (file: URL default).
- Pre-existing issues out of scope, noted for later: `adresse.typ` missing from create schema/DTO/query (predates branch); hardcoded BASE_URL pattern in specs (pre-existing convention).

## Next Steps

- Production env vars must be set in Vercel before first deploy: `TURSO_DATABASE_URL`, `TURSO_AUTH_TOKEN`, `SESSION_SECRET`, `CORS_ORIGINS`, `NODE_ENV=production`.
- GitHub repo secrets needed: `VERCEL_TOKEN`, `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID`.
- Create PR when ready.

---
Generated with Claude Code - review v1.7.0
