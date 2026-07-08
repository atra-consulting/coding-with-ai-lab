# Code Review - solution-jfs-2026 (FIX-SKILLS-SEED-BUTTON)

**Date**: 2026-07-08
**Branch**: solution-jfs-2026
**Base**: 411d7c30825ab527246455b0f2284309c0db1381
**Files Reviewed**: 8 (skill, backend route, seed, 2 backend tests, spec, frontend component + spec)
**Review Rounds**: 2 (max 3)

## Summary

Four batched workshop fixes: write-ticket skill (close taken task, add acceptance criteria, softer `####` headings), ticket-board "Kürzlich geändert" toggle persistence via sessionStorage, agent-task 23 seed rewording, and widened auth on the ticket verb endpoints. Round 1 found three WARNINGs (no CRITICAL). Two were fixed directly (doc consistency). One — a new GET-based CSRF surface from widening `GET /next` — was resolved by user decision to revert `/next` to agent-token-only while keeping the three POST verbs widened. Round 2 verified the revert clean and complete. No remaining issues.

## Review Rounds

### Round 1

**Issues found**: 3 | **Fixes applied**: 3

| # | Severity | File | Issue | Found by | Proposed Fix | Fix by | Applied | Applied by |
|---|----------|------|-------|----------|--------------|--------|---------|------------|
| 1 | WARNING | `backend/src/routes/tickets.ts:57` | Widening `GET /next` (a state-mutating GET) to accept an admin session opens a GET-based CSRF surface (`SameSite=Lax` cookie rides cross-site top-level GET nav). POST verbs unaffected. | be-reviewer | Revert `GET /next` to `requireAgentToken`; keep POST verbs widened | be-coder + be-test-coder | Reverted route, tests (→401), and spec; import restored | be-coder (`37d6ea2`), be-test-coder (`3105464`) |
| 2 | WARNING | `docs/specs/SPEC-API-TICKETS.md:440,446` | ASCII state-machine diagram tagged `POST /done` / `POST /ask` as `(agent)`-only, contradicting the transitions table below | ba-reviewer | Remove stale `(agent)` tags; table is authoritative | direct fix | Tags removed | direct fix |
| 3 | WARNING | `.claude/skills/write-ticket/SKILL.md:211` | New "endet **immer** geschlossen (DONE)" contradicts the two documented failure paths that leave the task open | skill-reviewer | Soften to "soll immer … außer bei Fehlerfällen" | direct fix | Wording softened | direct fix |

Frontend (`ticket-board.component.ts` / spec): reviewed clean — persistence correct, restore-before-load ordering right, try/catch covers read+write, sessionStorage is the correct scope. No fix needed.

### Round 2

Clean pass. Fix verification only. The `GET /next` revert confirmed correct and complete across route, import, tests, and spec; the three still-widened POST verbs (`/:id/start`, `/:id/done`, `/:id/ask`) retain their guard, tests, and docs. No regressions.

## Remaining Issues

No remaining issues.

Below-threshold notes (not actioned): storage-helper style differs from `LayoutService` (strings vs `JSON.stringify`) — cosmetic; ASCII-diagram auth tags now asymmetric (`/wont-do` keeps `(admin)`, others untagged) — the transitions table carries authoritative auth; a pre-existing edge (write-ticket: if ticket creation fails after `/start`, the source agent-task stays `IN_PROGRESS`) is out of this change's scope — worth a follow-up ticket.

## Project Context Validation

- Auth widening matches the existing `requireAgentTokenOrAdminSession` pattern and memory `headless-skills-avoid-admin-session` (widen backend auth over admin login). Spec kept in lockstep with code.
- Backend `INSERT OR IGNORE` seed idempotency respected — the seed test asserts the exported constant, not the live DB (avoids the `backend-tests-wipe-ticket-board` staleness/flakiness trap).
- Frontend follows Angular 21 standalone / `inject()` conventions.

## Next Steps

- Re-run test suites after review fixes (plan-and-do Step 11).
- agent-task 23 rewording only appears on a fresh DB (`./start.sh --reset-db`).

---
Generated with Claude Code - review v1.8.2
