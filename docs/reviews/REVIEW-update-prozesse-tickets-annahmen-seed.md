# Code Review - update-prozesse-tickets-annahmen-seed

**Date**: 2026-07-07
**Branch**: update-prozesse-tickets-annahmen-seed
**Base**: 1c209f74582203b1062e8240850f5e909b34adcb (branch start)
**Files Reviewed**: 12 (backend seed/validation/migrate + tests, frontend model/component + tests, SPECS-database)
**Review Rounds**: 2 (max 3)

## Summary

Reviewed the process-comparison page + ticket-seed changes for PRD `docs/prds/PRD-UPDATE-PROZESSE-TICKETS.md`. Backend (be, db) and frontend model/component (fe) reviews were clean on round 1. The UI review found 2 MAJOR issues on the new Annahmen layout. Both were fixed and validated clean in round 2 (verified live in-browser). All tests pass (backend 310, frontend 485).

## Review Rounds

### Round 1

**Issues found**: 2 | **Fixes applied**: 2

| # | Severity | File | Issue | Found by | Proposed Fix | Fix by | Applied | Applied by |
|---|----------|------|-------|----------|--------------|--------|---------|------------|
| 1 | WARNING (MAJOR) | `frontend/src/app/features/produktivitaet/rechner.component.ts` (`.cmp-hit`) | Full-row click overlay sits over the Annahmen bullets + caption, blocking mouse text-selection of the new readable text | ui-reviewer | Lift `.cmp-annahmen-list` and `.cmp-caption` above the overlay (`position:relative; z-index:2`) so text is selectable; name/bar/total still select the tab | ui-designer | Added `position:relative; z-index:2` to both; verified overlay still covers name/bar/total | ui-designer |
| 2 | WARNING (MAJOR) | `frontend/src/app/features/produktivitaet/rechner.component.html:187` | "Annahmen" column label is `d-none` below md — no visible label on mobile | ui-reviewer | Add a `d-md-none` inline "Annahmen" label per row (aria-hidden; SR heading already names it) | ui-designer | Added `<span class="cmp-annahmen-label-inline d-md-none text-muted small" aria-hidden="true">Annahmen</span>` before each `<ul>` | ui-designer |
| 3 | SUGGESTION | `frontend/src/app/features/produktivitaet/rechner.component.html` | Minor redundant screen-reader announcement (group summary + per-row totals) | ui-reviewer | — | — | — | — |
| 4 | SUGGESTION | `frontend/src/app/features/produktivitaet/rechner.component.ts` | `text-muted` contrast ~4.49:1 — pre-existing app-wide pattern, do not prioritize | ui-reviewer | — | — | — | — |

Backend (be-reviewer), migration/DB (db-reviewer), and frontend model/component (fe-reviewer) reviews: clean, no findings.

### Round 2

Clean pass. Both round-1 MAJOR fixes verified correct and regression-free (live in-browser: bullets/caption selectable, overlay still selects tab on name/bar/total; inline label shows only below md; no double-announce; no new horizontal scroll).

## Remaining Issues

No remaining actionable issues. Two SUGGESTION-level items were left as-is by design:
- Redundant SR announcement of totals (minor verbosity, not blocking).
- `text-muted` contrast (pre-existing sitewide convention per `SPECS-ui.md`, not introduced here).

## Project Context Validation

- Matches PRD `docs/prds/PRD-UPDATE-PROZESSE-TICKETS.md`: Annahmen bullets, agileKi waits halved from step 5 (total 2,190), caption, "BA"→"Business Analyst" labels, 11-step KI-Feedback process (total 440), ticket Business/Technical split, role-addressed comments.
- Follows CLAUDE.md conventions: Angular 21 standalone + `@if`/`@for` with `track` + `inject()`; async libSQL; frontend defaults mirrored in backend seed/validation/migration; byte-identical `AGILE_KI_DEFAULT_JSON`.

## Next Steps

- All tests pass (backend 310, frontend 485).
- Post-review re-test, then PR.

---
Generated with Claude Code - review v1.8.2
