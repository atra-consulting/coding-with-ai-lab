# Code Review - productivity-calculator-cycle-time

**Date**: 2026-06-28
**Branch**: productivity-calculator-cycle-time
**Base**: 154d947b99ffade6a3bb75f4f85e82318c137611
**Files Reviewed**: 27 (9 backend, 3 db, 12 frontend, 3 docs)
**Review Rounds**: 2 (max 3)

## Summary

Reviewed the Produktivität → Rechner feature: scenario CRUD API (`/api/szenarien`), `szenario` table + seed, and the Angular calculator (per-step works[N] + waits[N−1] model, comparison + per-process SVG bars, scenario save/load/delete). Backend and data layer came back clean. Frontend logic clean. The accessibility review found and fixed three real defects. Review converged after the round-2 refinement.

## Review Rounds

### Round 1

**Issues found**: 3 actionable (+ 2 low/DX, not fixed) | **Fixes applied**: 3

| # | Severity | File | Issue | Found by | Proposed Fix | Fix by | Applied | Applied by |
|---|----------|------|-------|----------|--------------|--------|---------|------------|
| 1 | CRITICAL | `frontend/.../rechner.component.html` | Zero-duration work rects kept `role="button"` with no accessible name (3 nameless "ghost buttons" on load) | ui-reviewer | Drop role + `aria-hidden="true"` for zero-duration rects | fe-coder | `@if` split: zero-duration rects aria-hidden, no role; non-zero keep role/aria-label/tabindex | fe-coder |
| 2 | WARNING | `frontend/.../rechner.component.html` | Skip-link target `<ul ngbNav>` not focusable → skip link did nothing | ui-reviewer | Make target focusable | fe-coder | Added `tabindex="-1"` (refined in round 2) | fe-coder |
| 3 | SUGGESTION | `frontend/.../rechner.component.html` | Per-process `<svg>` `aria-label` shadowed its `<title>`/`<desc>` | ui-reviewer | Reference title/desc via aria-labelledby/describedby | fe-coder | Removed redundant aria-label; wired aria-labelledby + aria-describedby | fe-coder |
| 4 | SUGGESTION | `backend/.../validation.ts` | `SzenarioSchema.name` lacks `.max()` (cosmetic vs other schemas) | be-reviewer | — | — | not fixed | — |
| 5 | SUGGESTION | `backend/.../schema.ts` | JSON columns lack `.check()` parity with DDL (DX only; DDL enforces at runtime) | db-reviewer | — | — | not fixed | — |

Note: backend API and DB layer reviews returned **no actionable findings**. The frontend button labels ("Neu erstellen"/"Kopie speichern") differ from the PRD's REQ-SCN-001 wording — this was a deliberate usability rename in an earlier round; behavior is correct, labels kept.

### Round 2

**Issues found**: 1 (refinement) | **Fixes applied**: 1

| # | Severity | File | Issue | Found by | Proposed Fix | Fix by | Applied | Applied by |
|---|----------|------|-------|----------|--------------|--------|---------|------------|
| 1 | WARNING | `frontend/.../rechner.component.html` | Skip-link focus landed on a non-interactive `<ul role=tablist>` (dead air) | ui-reviewer | Move `id` + `tabindex="-1"` to the wrapping `.card-body` | direct fix | Moved skip target to `.card-body`; removed from `<ul>` | direct fix |

Round-2 validation confirmed all three round-1 a11y fixes correct with no regressions.

## Remaining Issues

No actionable remaining issues. Two low-severity DX/cosmetic suggestions (name `.max()`, Drizzle `.check()` parity) left as-is — neither is a correctness, security, or performance bug.

## Project Context Validation

- Matches PRD decisions D1–D11 (corrected wait-between-steps model: works[N] + waits[N−1]).
- Backend follows CLAUDE.md conventions: async `@libsql/client`, `asyncHandler`, `requireAuth`, standard error shape, parameterised SQL, Zod in `validation.ts`, router mounted in `app.ts`.
- Frontend follows Angular 21 standalone conventions: `inject()`, `@if`/`@for` with `track`, signals/`computed`, guarded lazy route, sidebar NavSection.
- Tests: backend 248/248, frontend 348/348 green.

## Next Steps

- Ensure all tests pass (done: be 248, fe 348).
- Documentation pass (Step 12).
- Create PR when ready.

---
Generated with Claude Code - review v1.8.2
