# Code Review - add-claim-endpoint

**Date**: 2026-06-30
**Branch**: add-claim-endpoint
**Base**: ed2452e1fae7d8ca8ff0fb890e6477970669a3bc
**Files Reviewed**: 10
**Review Rounds**: 2 (max 3)

## Summary

Adds `POST /:id/start` to both the agent-tasks and tickets APIs. Transitions `OPEN → IN_PROGRESS` (tasks) and `TODO+owner=AI → IN_PROGRESS` (tickets) by ID, without going through `/next`. Also clarifies that `GET /:id` is read-only. Round 1 found two doc diagram gaps. Round 2 confirmed clean.

## Review Rounds

### Round 1

**Issues found**: 2 | **Fixes applied**: 2

| # | Severity | File | Issue | Found by | Proposed Fix | Fix by | Applied | Applied by |
|---|----------|------|-------|----------|--------------|--------|---------|------------|
| 1 | CRITICAL | `docs/API-TASKS.md:15` | Concepts lifecycle diagram omits `POST /:id/start` transition from OPEN→IN_PROGRESS | ba-reviewer | Add `OR POST /:id/start` to diagram | direct fix | Updated diagram line | direct fix |
| 2 | WARNING | `docs/API-TICKETS.md:390` | ASCII state machine visual omits `POST /start` arc on TODO→IN_PROGRESS arrow | ba-reviewer | Add `/start` label to diagram arrow | direct fix | Added `OR /start` to arrow | direct fix |

### Round 2

Clean pass. No issues found.

## Remaining Issues

No remaining issues.

## Project Context Validation

- CLAUDE.md conventions followed: `requireAgentToken` auth, `asyncHandler`, `asyncHandler`, ISO-8601 dates, German error messages.
- Service guard conditions match existing patterns (`reject`/`done` two-step 404-vs-409 approach).
- Route placement safe — literal `POST /reset` registered before parameterized `POST /:id/start` in both files.

## Next Steps

- Verify tests still pass after doc fixes
- Push and create PR

---
Generated with Claude Code - review v1.8.2
