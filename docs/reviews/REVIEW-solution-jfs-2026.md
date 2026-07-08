# Code Review - solution-jfs-2026 (RECHNER-PROZESS-VERBESSERUNGEN)

**Date**: 2026-07-09
**Branch**: solution-jfs-2026
**Base**: f02b2c598f9a52f3d73f3d6bb4cb949ce29bd405 (start of this run)
**Files Reviewed**: 6 code files (+ 2 docs artifacts)
**Review Rounds**: 2 (max 3)

## Summary

Reviewed the RECHNER-PROZESS-VERBESSERUNGEN change set: (1) persist the "Alle
Prozesse" toggle (`barLimit`) to `sessionStorage`, (2) set KI-Arbeitszeit to 1h for
the two KI processes (frontend defaults + backend seed + tests).

Backend: no issues. Frontend: one WARNING (behavioral/product decision) and one
SUGGESTION (comment accuracy). No CRITICAL issues. Both test suites pass
(frontend 522/0, backend 331/0). Arithmetic, frontend↔backend seed parity, effect
cleanup, field-initializer ordering, storage error handling, and test isolation all
verified correct.

## Review Rounds

### Round 1

**Issues found**: 2 | **Fixes applied**: 0 (deferred to caller checkpoint — embedded, implement-review scope)

| # | Severity | File | Issue | Found by | Proposed Fix | Fix by | Applied | Applied by |
|---|----------|------|-------|----------|--------------|--------|---------|------------|
| 1 | WARNING | `frontend/src/app/features/produktivitaet/rechner.component.ts:551` | Persist `effect()` fires on every `barLimit` write; `revealProcess()` (via `onNavChange`, tab clicks) silently widens `barLimit`, so incidental widening persists, not only deliberate "Alle Prozesse" clicks. Product decision. | fe-reviewer | Persist only on explicit `cycleBarLimit()` (call `writeBarLimit()` there) instead of a global `effect()`. | fe-coder | Removed the `effect`; `cycleBarLimit()` now writes directly. Navigation widening no longer persists. | fe-coder |
| 2 | SUGGESTION | `frontend/src/app/features/produktivitaet/rechner.component.ts:545` | Comment cites ticket-board `recentOnly` as the mirrored pattern, but implementation differed (effect-based). | fe-reviewer | Make the comment accurate. | fe-coder | Comment rewritten; now genuinely mirrors ticket-board (read-on-init, write-in-handler). | fe-coder |

User chose (plan-and-do Step 10.3): persist only on explicit click + fix comment. Fix commit `5cf75cf`.

### Round 2

Clean pass. No issues found. Fix verified by fe-reviewer: only `cycleBarLimit()` writes; hydration intact; `effect` import removed; new regression test proves navigation widening does not persist. Build clean, rechner spec 64/64.

## Remaining Issues

No remaining issues.

## Project Context Validation

- No PRD (skipped by user for this small task). Change matches CLAUDE.md conventions:
  Angular 21 signals/`inject()`, backend seed mirrors the frontend single source of
  truth, ISO dates unaffected.
- Backend seed overwrite-on-startup keeps the Standard-Szenario pinned to the new
  defaults; no migration needed.

## Next Steps

- Decide on WARNING #1 (persist-on-explicit-toggle vs current behavior).
- Optionally apply SUGGESTION #2 (comment fix).
- Suites already green; ready for PR when findings resolved.

---
Generated with Claude Code - review v1.8.2
