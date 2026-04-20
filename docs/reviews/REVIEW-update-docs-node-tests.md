# Code Review - update-docs-node-tests

**Date**: 2026-04-20
**Branch**: update-docs-node-tests
**Base**: main
**Files Reviewed**: 29
**Review Rounds**: 1

## Summary

Documentation refresh removing lingering Java/Spring references (the backend switched from Java/Spring Boot to Node.js/TypeScript/Express) plus two smoke Playwright specs for the Node backend (auth and firmen CRUD).

Review focused on: `CLAUDE.md`, `GEMINI.md`, `docs/specs/SPECS*.md`, `.gemini/agents/*.md`, and three new/modified files under `backend/src/test/`. All 35 backend tests pass (2 intentionally skipped). Frontend build clean.

Two actionable findings fixed. One nitpick and one convention-match concern left as-is (see Remaining Issues).

## Review Rounds

### Round 1

**Issues found**: 4 | **Fixes applied**: 2

| # | Severity | File | Issue | Found by | Fix | Fixed by |
|---|----------|------|-------|----------|-----|----------|
| 1 | WARNING | `docs/specs/SPECS-backend.md:397` | Unexplained `Java LocalDateTime` reference in a Node-only spec | ba-reviewer | Rewrote as "millisecond-precision ISO-8601 with no timezone suffix" | direct fix |
| 2 | WARNING | `CLAUDE.md:63` | `admin` row says "SQLite databases" (plural) — there is only one DB file | ba-reviewer | Changed to singular "SQLite database" | direct fix |
| 3 | SUGGESTION | `backend/src/test/helpers.ts:60`, `auth.spec.ts:16`, `firmen-crud.spec.ts:17` | Hardcoded `http://localhost:7070` | be-test-reviewer | — | — |
| 4 | SUGGESTION | `backend/src/test/firmen-crud.spec.ts:~165` | PUT test does not assert the PUT response body, only the subsequent GET | be-test-reviewer | — | — |

## Remaining Issues

- Finding 3 (hardcoded base URL). Existing specs (`admin-geocoding.spec.ts`, `adressen-coords.spec.ts`, `geocoding-rate-limit.spec.ts`) use the same hardcoded `http://localhost:7070`. Matching existing convention. No project rule requires env-based URL. Deferred — consistency preserved.
- Finding 4 (PUT body assertion). Smoke scope only per user's explicit request ("don't implement comprehensive back end tests suite"). Deferred.

## Project Context Validation

- **PRD:** None (task was small/focused; PRD was explicitly skipped).
- **CLAUDE.md conventions:** All followed. Commit-to-plan link: all commits use the `UPDATE-DOCS-NODE-TESTS` key in the footer. SQLite + Node conventions respected in new helpers.
- **Scope:** User restricted doc updates to `SPECS*.md`, `CLAUDE.md`, `GEMINI.md`, `.gemini/agents/`. Test scope restricted to Auth + Firmen smoke. Both honored — historical docs (ADR, plans, reviews, PRDs) and other entities (Personen, Abteilungen, etc.) intentionally not touched.

## Next Steps

- Re-run backend suite to confirm the doc fixes did not regress anything
- Optional: open a PR (workflow_scope = implement-review, so no PR is created by default)

---
Generated with Claude Code - review v1.6.0
