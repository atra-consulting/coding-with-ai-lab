# Code Review - Rename "Zu bereit" → "Bereit"

**Date**: 2026-07-09
**Branch**: solution-jfs-2026
**Base**: main
**Files Reviewed**: 6 (rename scope)
**Review Rounds**: 1 (max 3)

## Summary

Focused review. Special instruction: make sure the "Zu bereit" → "Bereit" TODO-column label rename broke nothing.

The rename is string-literal-only. It renames the Kanban TODO column label from "Zu bereit" to "Bereit" across the UI and the living docs. No logic, enum values, CSS classes, method names, or control flow changed. The "Nach Bereit" action button already existed — the new column label now matches it. Full frontend suite passes (523/523). `ng build` succeeds.

Round 1 clean. No in-scope issues.

## Review Rounds

### Round 1

Clean pass. No issues found.

Reviewers: fe-reviewer (frontend), ba-reviewer (docs).

Checks confirmed:
- **Completeness** — `grep "Zu bereit"` over `frontend/src`, `CLAUDE.md`, `docs/specs`, `docs/TOOLS.md` returns zero hits. All user-facing TODO labels now read "Bereit": board column header, KPI tile, `statusLabel()` TODO case, moveToReady button `title`, moveToReady success message, toggleOwner success message, `toggleOwnerTitle`.
- **No logic touched** — `TicketStatus` enum (`'TODO'`), CSS classes (`.column-todo`, `.column-title`, `.kpi-label`), method names, and control flow unchanged. `statusBadgeClass()` correctly left alone (separate switch from `statusLabel()`).
- **Test correctness** — the board spec selector `.column-todo .column-title` still resolves. No other column title contains "Bereit", so `toContain('Bereit')` uniquely verifies the TODO column. The stale "(renamed from 'Zu erledigen')" description was removed, not left dangling.
- **Docs consistency** — `CLAUDE.md`, `docs/TOOLS.md`, and the three spots in `docs/specs/SPEC-API-TICKETS.md` all say "Bereit". Routing semantics (`owner=AI`, `status=TODO`) and the "Nach Bereit" button name unchanged.
- **German wording** — "nach \"Bereit\" verschoben", "Status auf \"Bereit\" zurücksetzen" read naturally.

Verification: `npx ng test --watch=false --browsers=ChromeHeadless` → 523/523 pass. `ng build` → success.

## Remaining Issues

No issues in the rename scope.

FYI, out of scope (pre-existing, not broken by this rename): a few skill/plan files still use the old "Zu bereit" wording for the Ready/TODO column — `.claude/skills/plan-and-do/SKILL.md`, `.claude/skills/do-semi-automatic/SKILL.md`, and some `docs/plans/PLAN-*.md`. These match tickets on the `TODO`/`AI` status enum, not the German label string, so behavior is unaffected. Cosmetic doc drift only. Rename these too if you want full label consistency.

## Project Context Validation

- **CLAUDE.md**: Kanban column labels documented in the Ticket System section. The rename keeps doc and UI in sync — `TODO` now labelled "Bereit" in both.
- Change follows the project's German-domain-term convention and the "short, simple wording" style.

## Next Steps

- No remaining issues in scope.
- Tests pass (523/523).
- Optionally rename the out-of-scope "Zu bereit" references in skill/plan files for full label consistency.
- Commit and push when ready.

---
Generated with Claude Code - review v1.8.2
