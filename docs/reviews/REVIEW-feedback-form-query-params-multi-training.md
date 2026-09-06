# Code Review - feedback-form-query-params-multi-training

**Date**: 2026-09-06
**Branch**: feedback-form-query-params-multi-training
**Base**: 555113f42c032c11955f92f1afc4050220447671
**Files Reviewed**: 9
**Review Rounds**: 3 (max 3)

## Summary

This branch adds two optional URL query params (`schulung`, `trainer`) to the public, unauthenticated feedback pages so one deployed page can serve any training without a redeploy. `FeedbackFormComponent` overrides its hardcoded subtitle/trainer text when the params are present and non-blank, falling back to today's hardcoded defaults otherwise, and tags the submitted payload with `schulung`/`trainerName` (renamed from the PRD's original `trainer` to avoid colliding with an existing payload key used by a star-rating question). `FeedbackQrComponent` gains two live text inputs that rebuild the target URL and regenerate the QR code on every keystroke.

Three review rounds ran. Round 1 found a real code inconsistency (missing length cap on the form page) and two documentation inconsistencies (stale PRD wording, an empty state-tracking array) — all fixed. Round 2 found a resulting test-coverage gap and two more stale PRD mentions — all fixed. Round 3 found only two low-confidence SUGGESTIONs, left unfixed as optional. No CRITICAL issues at any round.

## Review Rounds

### Round 1

**Issues found**: 5 | **Fixes applied**: 3

| # | Severity | File | Issue | Found by | Proposed Fix | Fix by | Applied | Applied by |
|---|----------|------|-------|----------|--------------|--------|---------|------------|
| 1 | WARNING | `frontend/src/app/features/feedback/feedback-form.component.ts:167-174` | No length cap on `schulung`/`trainer` query params, unlike the QR page's 200-char truncation — lets a hand-crafted URL send an oversized value to the external Google Apps Script | fe-reviewer | Apply the same trim+`.slice(0, 200)` cap used in `feedback-qr.component.ts` | fe-coder | Added `.slice(0, 200)` after `.trim()` to both `schulungTrimmed`/`trainerTrimmed` | fe-coder |
| 2 | WARNING | `docs/prds/PRD-FEEDBACK-FORM-QUERY-PARAMS.md:41` | PRD Requirement 3 said the new payload field is `trainer`, but the shipped code uses `trainerName` to avoid colliding with an existing payload key from a star-rating question | ba-reviewer | Update Requirement 3 (and Open Question 1) to say `trainerName` | orchestrator (direct fix, no docs-fix agent exists) | Updated Requirement 3, added a "Field name note", updated the Assumption line and Open Question 1 | orchestrator |
| 3 | WARNING | `docs/state/STATE-FEEDBACK-FORM-QUERY-PARAMS.json:65` | `completed_steps` was empty despite `delegation.assignments` showing ~15 completed steps | ba-reviewer | Populate `completed_steps` with the actual completed step list | orchestrator (direct fix) | Populated with 28 step entries matching the skill's step numbering | orchestrator |
| 4 | SUGGESTION | `frontend/src/app/features/feedback/feedback-form.component.ts` / `feedback-qr.component.ts` | Trim+cap logic duplicated across two files | fe-reviewer | — | — | skipped | — |
| 5 | SUGGESTION | `frontend/src/app/features/feedback/feedback-qr.component.scss:98-101` | Focus style relies only on border-color change, no outline/box-shadow | ui-reviewer | — | — | skipped | — |

### Round 2

**Issues found**: 3 | **Fixes applied**: 3

| # | Severity | File | Issue | Found by | Proposed Fix | Fix by | Applied | Applied by |
|---|----------|------|-------|----------|--------------|--------|---------|------------|
| 1 | WARNING | `frontend/src/app/features/feedback/feedback-form.component.spec.ts` | No test covers the new 200-char truncation on `FeedbackFormComponent` (only the QR component had one) | fe-reviewer | Add a test asserting `config.subtitle` is truncated to exactly 200 chars for a 250-char `schulung` param | fe-test-coder | Added `'truncates schulung to 200 chars after trimming'` test | fe-test-coder |
| 2 | WARNING | `docs/prds/PRD-FEEDBACK-FORM-QUERY-PARAMS.md:78` | Test Strategy's pre-implementation bullet still said `trainer` column instead of `trainerName` | ba-reviewer | Update wording to `trainerName` | orchestrator (direct fix) | Fixed | orchestrator |
| 3 | WARNING | `docs/prds/PRD-FEEDBACK-FORM-QUERY-PARAMS.md:115` | Technical Notes' `submitFeedback()` description still said `trainer` key instead of `trainerName` | ba-reviewer | Update wording to `trainerName` | orchestrator (direct fix) | Fixed | orchestrator |

### Round 3

**Issues found**: 2 | **Fixes applied**: 0

| # | Severity | File | Issue | Found by | Proposed Fix | Fix by | Applied | Applied by |
|---|----------|------|-------|----------|--------------|--------|---------|------------|
| 1 | SUGGESTION | `docs/prds/PRD-FEEDBACK-FORM-QUERY-PARAMS.md:11` | Technical Summary doesn't name the payload keys explicitly, could momentarily read as `trainer` before Requirement 3 clarifies | ba-reviewer | — | — | skipped | — |
| 2 | SUGGESTION | `frontend/src/app/features/feedback/feedback-form.component.spec.ts:81-85` | Only the `schulung` branch has a truncation test; the structurally-identical `trainer` branch (`resolvedTrainerNames`) doesn't | fe-reviewer | — | — | skipped | — |

Round 3 found no CRITICAL or WARNING issues — cycle ends here (3 of 3 rounds run).

## Remaining Issues

- `docs/prds/PRD-FEEDBACK-FORM-QUERY-PARAMS.md:11` — Technical Summary could name `schulung`/`trainerName` explicitly for clarity. Optional.
- `frontend/src/app/features/feedback/feedback-qr.component.scss:98-101` — Focus style could add an outline/box-shadow on top of the border-color change. Optional polish, not a WCAG violation.
- `frontend/src/app/features/feedback/feedback-form.component.ts` / `feedback-qr.component.ts` — Trim+cap-at-200 logic is duplicated in two files. Could extract to a shared helper if the cap ever needs to change. Not blocking.
- `frontend/src/app/features/feedback/feedback-form.component.spec.ts` — The `trainer` branch's 200-char cap has no dedicated test (only `schulung`'s does). Low risk — the two lines are structurally identical — but worth adding if this code is touched again.

## Project Context Validation

**PRD** (`docs/prds/PRD-FEEDBACK-FORM-QUERY-PARAMS.md`): all Success Criteria verified against the shipped code — query-param override/fallback behavior, payload tagging (with the `trainerName` rename now consistently documented), QR page live-update behavior, 200-char silent truncation, no backend/dependency changes. All satisfied.

**CLAUDE.md / AGENTS.md**: backend/frontend conventions followed where applicable (async patterns don't apply — no backend touched; Angular 21 standalone components, `inject()` DI, `@if`/`@for` unused but not needed here). One deliberate, documented deviation: the two feedback components stay on template-driven forms (`FormsModule`/`ngModel`) rather than `SPECS-frontend.md`'s Reactive Forms recommendation — a pre-existing pattern in these files, outside the CRM domain the spec targets, kept to avoid rewriting a working public page mid-bootcamp for an unrelated stylistic convention (documented in the plan's Open Question #4).

## Next Steps

- Review remaining issues (all optional/low-risk, listed above)
- Ensure all tests pass (536 pass, 19 pre-existing/unrelated failures in the ticket-board feature — confirmed via `git diff` that this branch never touched those files)
- Update documentation if needed (done this round)
- Create PR when ready

---
Generated with Claude Code - review v1.8.2
