# Code Review - chance-badge-notiz

**Date**: 2026-06-10
**Branch**: chance-badge-notiz
**Base**: main
**Files Reviewed**: 10 (code) + 3 (docs)
**Review Rounds**: 1 (holistic) + 2 phase reviews during implementation

## Summary

Two extensions to the Chance entity: (1) phase shown as a colored badge in the Chancen list (the detail page already had it); (2) a new optional, nullable `notiz` field — multi-line free text, max 2000 chars, 3-row textarea in the form, line breaks preserved on the detail page, absent from the list.

Backend, DB, and frontend were each phase-reviewed during implementation; findings were fixed before the holistic round. The holistic round confirmed the fixes hold and found no remaining CRITICAL or WARNING code defects.

## Review Rounds

### Phase reviews (during implementation)

**Backend / DB** — Issues found: 0 code defects | Fixes applied: 0

| # | Severity | File | Issue | Found by | Fix | Fixed by |
|---|----------|------|-------|----------|-----|----------|
| 1 | SUGGESTION | `backend/src/services/chanceService.ts` | Whitespace-normalization duplicated in create/update | be-reviewer | — (2 lines, left inline) | — |
| 2 | SUGGESTION | `docs/specs/SPECS-database.md` | notiz column not documented | be-reviewer, db-reviewer | — (spec updates out of scope per user) | — |

**Frontend** — Issues found: 3 | Fixes applied: 3

| # | Severity | File | Issue | Found by | Fix | Fixed by |
|---|----------|------|-------|----------|-----|----------|
| 3 | WARNING | `chance-list.component.ts:54` | Raw `params.value` interpolated into badge HTML | fe-reviewer | Render label only from known enum key; fallback `UNBEKANNT` | direct fix |
| 4 | WARNING | `chance-form.component.html:126` | Duplicate "Max. 2000 Zeichen" (hint + error shown together) | fe-reviewer, ui-reviewer | Hint now in `@else` of the error block | direct fix |
| 5 | WARNING | `chance-detail.component.html:44` | Notiz label/value split, detached spacing | ui-reviewer | Label `<p class="mb-0">` to tighten spacing | direct fix |

### Round 1 (holistic, post-fix)

**Issues found**: 0 code defects | **Fixes applied**: 1 (doc comment)

| # | Severity | File | Issue | Found by | Fix | Fixed by |
|---|----------|------|-------|----------|-----|----------|
| 6 | SUGGESTION | `backend/src/config/migrate.ts:91` | Migration guard intent unclear (footgun if CREATE TABLE column removed) | be-reviewer | Added clarifying comment | direct fix |
| 7 | WARNING | `chance-list.component.ts:48` | ANGEBOT `bg-warning text-dark` diverges from SPECS-ui.md (`bg-warning`) | fe-reviewer | — (code is correct for contrast; spec stale & out of scope) | — |

## Remaining Issues

- **Spec divergence (not a code defect):** `SPECS-ui.md` lists ANGEBOT as `bg-warning`, while both the list and the pre-existing detail page use `bg-warning text-dark`. The `text-dark` is the correct WCAG-contrast choice for a yellow badge and pre-dates this branch. Spec updates were explicitly out of scope for this task. Recommend updating the spec in a separate change.
- **Spec divergence (not a code defect):** `SPECS-database.md` does not list the new `notiz` column. Out of scope per user request; update separately.

No remaining code defects.

## Project Context Validation

- **PRD** (`docs/prds/PRD-CHANCE-BADGE-NOTIZ.md`): all requirements REQ-C01…C10 implemented. Badge colors match the detail page; notiz optional, nullable, 2000-char limit (client + server), whitespace→null, line breaks preserved, absent from list.
- **CLAUDE.md conventions**: Angular 21 `@if`/standalone/`inject()` ✓; parameterized SQL ✓; nullable column + idempotent migration ✓; Zod field-level validation ✓; commit↔PRD footer links ✓.
- **Tests**: none, per explicit user request. Verification via `ng build` (clean) + backend `tsc --noEmit` (22 pre-existing errors, zero new).

## Next Steps

- Optionally update `SPECS-ui.md` and `SPECS-database.md` in a separate change (out of scope here).
- Manual smoke test per PRD Teststrategie.
- Create PR when ready.

---
Generated with Claude Code - review v1.7.0
