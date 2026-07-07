# Code Review - PROZESS-BALKEN-FILTER

**Date**: 2026-07-07
**Branch**: prozess-balken-filter-email-task
**Base**: main
**Files Reviewed**: 8 (3 backend, 5 frontend)
**Review Rounds**: 2

## Summary

Three features plus a layout refinement. Frontend bar-filter button on the Prozessvergleich card. New EMAIL agent-task seed row. "Kürzlich geändert" toggle on the Ticket-Board. Later: button rename/reposition, full-width title underline, caption above the bar, compact Schritt-Zeiten header.

Reviewers: be-reviewer, fe-reviewer, ui-reviewer. Fixers: fe-coder. Round 1 found real issues. All accepted findings fixed. Round 2 clean.

## Review Rounds

### Round 1

**Issues found**: 8 | **Fixes applied**: 7

| # | Severity | File | Issue | Found by | Fix | Fixed by |
|---|----------|------|-------|----------|-----|----------|
| 1 | WARNING | `ticket-board.component.ts:onDrop` | `refreshView()` missing in drop rollback → stale filtered view after failed drop | fe-reviewer | Added `refreshView()` to the error callback | fe-coder |
| 2 | WARNING | `rechner.component.spec.ts` | No click-driven DOM test for the filter button | fe-reviewer | Added click test (asserts row count + label) | fe-coder |
| 3 | WARNING | `rechner.component.html:180` | Card-title underline shrank to text width (design regression) | ui-reviewer | Moved border to `.cmp-title-row` wrapper; full width | fe-coder |
| 4 | WARNING | `rechner.component.html:183` | Filter button label wraps on narrow screens | ui-reviewer | `white-space: nowrap` + row `flex-wrap: wrap` | fe-coder |
| 5 | WARNING | `ticket-board.component.ts:74` | KPI totals vs filtered columns look contradictory | ui-reviewer | Added `.alert-info` banner while filtered | fe-coder |
| 6 | WARNING | `ticket-board.component.ts:210` | Disabled drag handle has no cursor feedback | ui-reviewer | `.cdk-drag-disabled .ticket-drag-handle` cursor rule | fe-coder |
| 7 | SUGGESTION | `ticket-board.component.ts` | "Keine Tickets" ambiguous while filtered | ui-reviewer | Filter-aware text "Keine kürzlich geänderten Tickets" | fe-coder |
| 8 | SUGGESTION | `ticket-board.component.ts` | 60-min window not disclosed | ui-reviewer | `title="Letzte 60 Minuten"` on the toggle | fe-coder |

Declined: "cycling button → segmented control" (ui-reviewer) — the user explicitly requested a cycling button. Touch-target and label-convention suggestions left as-is (compact was requested; both label conventions are user choices).

### Round 2

Clean pass. No issues found. All Round-1 fixes confirmed resolved, no regressions.

## Remaining Issues

No remaining issues from this change.

Out of scope (pre-existing, not caused by this diff): the Schritt-Zeiten tab panel causes horizontal page overflow at ~375px width (missing `min-width: 0` on the flex content). Flagged by both reviewers. Not touched here.

## Project Context Validation

- Backend: new seed row matches schema, enums, and `INSERT OR IGNORE` pattern. All count-dependent specs updated (22→23, EMAIL 6→7). No other runtime code assumes the old counts.
- Frontend: Angular 21 standalone, `@if`/`@for` + `track`, signals, `inject()`. CDK drag-drop preserved (view arrays alias masters when unfiltered; dragging disabled while filtered).
- Tests: frontend 501/501, backend 310/310.

## Next Steps

- Ensure all tests pass — done.
- Create PR against main.
- Merge when ready.

---
Generated with Claude Code - bpf-review v1.4.0
