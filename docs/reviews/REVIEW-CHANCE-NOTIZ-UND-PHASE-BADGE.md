# Code Review - CHANCE-NOTIZ-UND-PHASE-BADGE

**Date**: 2026-07-09
**Branch**: solution-jfs-2026
**Base**: 5ea7049763c3023d7673393ed6c046dcfe590ae2
**Files Reviewed**: 16 (backend service/validation/schema/migration, frontend model/form/detail/list, specs)
**Review Rounds**: 2 (max 3)

## Summary

Ticket 13 "Improve chances": new nullable `notiz` field on Chance (backend + frontend) and a colored phase badge in the Chancen list sharing one badge-class source with the detail view. Four reviewers ran in parallel (db, be, fe, ui). Backend and DB layers came back clean. Frontend was correct; UI review found one real WCAG contrast failure and one line-break display gap. All findings fixed in round 1 and verified in round 2.

## Review Rounds

### Round 1

**Issues found**: 3 | **Fixes applied**: 3

| # | Severity | File | Issue | Found by | Proposed Fix | Fix by | Applied | Applied by |
|---|----------|------|-------|----------|--------------|--------|---------|------------|
| 1 | CRITICAL | `frontend/src/app/core/models/chance.model.ts:43` | `QUALIFIZIERT: 'bg-info'` + white badge text fails WCAG AA contrast (1.96:1) — now visible in every list row | ui-reviewer | Change to `bg-info text-dark` (mirrors existing `ANGEBOT` pattern; keeps `bg-info` background; list/detail stay matched via single source) | direct fix | Map entry -> `bg-info text-dark`; spec updated | direct fix |
| 2 | WARNING | `frontend/src/app/features/chance/chance-detail/chance-detail.component.html:44` | Notiz newlines collapse (`white-space: normal`), silently discarding multi-line notes the 3-row textarea invites | ui-reviewer | Add `white-space: pre-wrap` to the notiz `<p>` — delivers AK "Notiz akzeptiert Zeilenumbrüche" at the display layer | direct fix | Added `style="white-space: pre-wrap"` | direct fix |
| 3 | SUGGESTION | `frontend/src/app/core/models/chance.model.ts:41` | Shared map typed `Record<string, string>` drops phase exhaustiveness — a new `ChancePhase` would silently fall through instead of erroring at compile time | fe-reviewer | Restore `Record<ChancePhase, string>`, index via `map[phase as ChancePhase]` | direct fix | Type restored | direct fix |

### Round 2

Clean pass. Frontend build succeeds; 34/34 chance Karma specs green (incl. updated QUALIFIZIERT assertion). No regressions.

## Remaining Issues

No remaining issues in the changed code.

Out-of-scope follow-ups noted by reviewers (not blocking, not part of this ticket):
- `docs/specs/SPECS-database.md` Chance table does not list the new `notiz` column (doc drift).
- `beschreibung` in the detail view has the same newline-collapse behavior as the old `notiz` (pre-existing; left untouched to keep scope on `notiz`).

## Project Context Validation

- CLAUDE.md conventions honored: async `@libsql/client`, guarded idempotent `ALTER` mirroring `ensureSzenarioAgileKiColumn()`, `requireAuth` route guard unchanged, Angular 21 `@if`/standalone/`inject()`, single-source badge map.
- Ticket acceptance criteria met: `notiz` optional/nullable, round-trips through create/get/list/update, independent of `beschreibung`, newlines preserved; phase badge colored per phase, list matches detail, `bg-secondary` fallback. The `bg-info text-dark` / `bg-warning text-dark` pairings satisfy the AK background colors while meeting contrast.

## Next Steps

- All tests pass (backend chance specs 16/16, frontend 541/541).
- No PR (skill run stops after review per workflow scope).

---
Generated with Claude Code - review
