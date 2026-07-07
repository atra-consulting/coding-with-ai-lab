# Code Review - rechner-overhaul-tabs-processes

**Date**: 2026-07-07
**Branch**: rechner-overhaul-tabs-processes
**Base**: ff6ee6bb3e5cf2b56fde6438c97199419987a63b (branch start)
**Files Reviewed**: 12 (source) + 5 (tests)
**Review Rounds**: 3 (max 3)

## Summary

Full integrated review of the Rechner overhaul (4 processes, tabs, pie charts, flowchart, unit conversion, full-stack persistence of a new 4th process). Backend (DB + service/validation) reviewed clean in round 1. Frontend surfaced one critical unit-conversion bug and several UI issues, all fixed and re-validated. A regression introduced by the round-1 skip-link fix was caught in round 2 and fixed in round 3. Both suites green throughout (backend 307/307, frontend 473/473).

## Review Rounds

### Round 1

**Issues found**: 7 | **Fixes applied**: 7

| # | Severity | File | Issue | Found by | Proposed Fix | Fix by | Applied | Applied by |
|---|----------|------|-------|----------|--------------|--------|---------|------------|
| 1 | CRITICAL | `frontend/.../rechner.component.ts:400` | Stale `pairwise()` buffer: after a scenario load (silent `emitEvent:false` unit reset), a later unit switch mis-pairs and skips conversion → value keeps number but changes unit label (60× wrong) | fe-reviewer | Track previous unit per control in a `Map`, update on silent reset | fe-coder | Replaced pairwise with `letzteEinheit` Map; updated in `patchSchritt` | fe-coder |
| 2 | SUGGESTION | `frontend/.../rechner.component.ts:329` | `isLoading` signal is dead code (never true when the handler runs) | fe-reviewer | Remove | fe-coder | Removed | fe-coder |
| 3 | SUGGESTION | `frontend/.../rechner.component.ts:368` | `toggleView()` unused | fe-reviewer | Remove | fe-coder | Removed | fe-coder |
| 4 | WARNING | `frontend/.../rechner.component.html:163` | Prozessvergleich legend (Arbeit/Warten) no longer matches the totals-only comparison bar; grey remainder misread as Wartezeit | ui-reviewer | Replace with an accurate caption | ui-designer | Legend → "Balken = Anteil an der längsten Gesamtdauer" | ui-designer |
| 5 | WARNING | `frontend/.../rechner.component.html:348` | Duplicate title+total in Balken view (outer h6 + procBar's own row) | ui-reviewer | Suppress procBar title at this call site | ui-designer | Added `showTitle` param; one title/total in both modes | ui-designer |
| 6 | WARNING | `frontend/.../rechner.component.html` | Removed skip-link → ~20 keyboard stops before the form | ui-reviewer | Re-add per-tab skip link | ui-designer | Added `visually-hidden-focusable` skip link per tab | ui-designer |
| 7 | SUGGESTION | `frontend/.../rechner.component.html:481` | Validation max message lost de-DE thousands separator | ui-reviewer | Format the number | ui-designer | `toLocaleString('de-DE')` → "479.520" | ui-designer |

Backend (db-reviewer, be-reviewer): clean — migration idempotency/concurrency, seed defaults vs PRD, positional-arg alignment, non-tautological tests all verified.

### Round 2

**Issues found**: 1 | **Fixes applied**: 1

| # | Severity | File | Issue | Found by | Proposed Fix | Fix by | Applied | Applied by |
|---|----------|------|-------|----------|--------------|--------|---------|------------|
| 1 | CRITICAL | `frontend/.../rechner.component.html:331` | Regression from round-1 fix #6: skip-link `href="#form-..."` + `<base href="/">` resolves to `/#form-...` → redirect to `/dashboard` (full reload + data loss) | ui-reviewer | Intercept click, `preventDefault()`, focus by id | direct fix | `focusForm()` handler focuses the form via DOCUMENT | direct fix |

fe-reviewer validated round-1 fix #1 empirically (old code fails the repro, new code passes). Round-1 fixes #4/#5/#7 confirmed correct.

### Round 3

Clean pass. No issues found. Skip-link fix validated via Playwright on two tabs — focus lands in the form, URL stays on the page, typed input preserved, no console errors, no regressions.

## Remaining Issues

No remaining issues.

## Project Context Validation

- **PRD** (`docs/prds/PRD-RECHNER-OVERHAUL.md`): all R1a default durations verified byte-exact against the seed and frontend defaults (totals 3,880 / 2,970 / 290 / 25; role sums 1,000 / 90). Pie A work = Pie B role sum for both agile processes.
- **CLAUDE.md**: async libSQL, ISO dates, `requireAuth` on routes, Angular 21 standalone + signals + `@if`/`@for` with `track`, process-keyed structure (no hardcoded copies). All honored.

## Next Steps

- Post-review re-test (both suites).
- Documentation updates (SPECS-database / SPECS-frontend / SPECS-ui).
- Create PR against main.

---
Generated with Claude Code - review v1.8.2
