# Code Review - agent-task-unauth-endpoint

**Date**: 2026-06-30
**Branch**: agent-task-unauth-endpoint
**Base**: 4d6fdaf700fdb7e2728a2a7c639e613322423e51
**Files Reviewed**: 8
**Review Rounds**: 3 (max 3)

## Summary

Added `requireAgentTokenOrAdminSession` middleware to allow skills to call `GET /api/agent-tasks/:id` and `GET /api/tickets/:id` locally without authentication. Middleware accepts: loopback bypass (AGENT_AUTH_ALLOW_LOOPBACK=1), agent token, or admin session — in that order. Updated API docs and added full test coverage. Two critical security fixes applied in round 1: gating the loopback bypass on `AGENT_API_TOKEN` being set, and rejecting wrong tokens immediately without falling through to session auth.

## Review Rounds

### Round 1

**Issues found**: 5 | **Fixes applied**: 5

| # | Severity | File | Issue | Found by | Proposed Fix | Applied | Applied by |
|---|----------|------|-------|----------|--------------|---------|------------|
| 1 | CRITICAL | `backend/src/middleware/agentAuth.ts:65` | Loopback bypass not gated on `configuredToken` — fires even without AGENT_API_TOKEN | be-reviewer | Add `configuredToken &&` to loopback condition | Added `configuredToken &&` gate | direct fix |
| 2 | CRITICAL | `backend/src/middleware/agentAuth.ts:89` | Wrong agent token silently falls through to session check | be-reviewer | Reject immediately after failed comparison | Added `next(new UnauthorizedError...); return` | direct fix |
| 3 | WARNING | `backend/src/test/agentTasks.spec.ts` | `GET /:id` has zero test coverage | be-reviewer | Add full auth-matrix test suite | Added 7-test suite covering all auth paths | direct fix |
| 4 | WARNING | `docs/API-TASKS.md:347` | "For skill authors" section doesn't mention GET /:id is callable | ba-reviewer | Add Read row to the calls table | Added Read row with agent token note | direct fix |
| 5 | WARNING | `docs/API-TICKETS.md:434` | Same gap in tickets "For skill authors" | ba-reviewer | Same fix | Added Read row | direct fix |

### Round 2

**Issues found**: 1 | **Fixes applied**: 1

| # | Severity | File | Issue | Found by | Proposed Fix | Applied | Applied by |
|---|----------|------|-------|----------|--------------|---------|------------|
| 6 | WARNING | `backend/src/test/agentTasks.spec.ts:283` | No test for USER session from non-loopback address → 403 | be-reviewer | Add test with X-Forwarded-For header | Added test at line 295 | direct fix |

### Round 3

Clean pass. No issues found.

## Remaining Issues

No remaining issues.

## Project Context Validation

- Follows AGENT_AUTH_ALLOW_LOOPBACK pattern established in agentAuth.ts
- No new dependencies
- Test convention matches existing Playwright API test suites
- Docs updated in both API-TASKS.md and API-TICKETS.md

## Next Steps

- Run tests ✓ (256/256 pass)
- Create PR

---
Generated with Claude Code - review v1.8.2
