# Code Review - claude/review-plan-do-skill-1A2rt

**Date**: 2026-04-18
**Branch**: claude/review-plan-do-skill-1A2rt
**Base**: main
**Files Reviewed**: 17 (14 agents + 2 skill files + CLAUDE.md)
**Review Rounds**: 1

## Summary

Scope: agent and skill configuration files for a beginners workshop. Focus per user: correctness, consistency between the plan-and-do skill and agent definitions, and whether the discovery rules truly dispatch the agents as intended.

Overall: solid. Discovery rules match every agent's `name` frontmatter. The six new test agents slot cleanly into the new categories. CLAUDE.md agents table lines up with the files on disk.

Four issues found. The biggest one: the two frontend test agents recommend deprecated Angular APIs that do not match how the production app actually wires providers. That will produce tests whose DI drifts from the app. The rest are smaller ambiguities in the plan-and-do workflow and one dead suffix clause.

No review agents were dispatched — none of them specialize in Markdown / skill config. The built-in checklist handled this review.

## Review Rounds

### Round 1

**Issues found**: 4 | **Fixes applied**: 0 (report-only per user request)

| # | Severity | File | Issue | Found by | Fix | Fixed by |
|---|----------|------|-------|----------|-----|----------|
| 1 | WARNING | `.claude/agents/fe-test-coder.md:39,58` | Recommends deprecated `HttpClientTestingModule` and `RouterTestingModule`. The production app wires providers the Angular 18+ way (`provideHttpClient(withInterceptors(...))`, `provideRouter(routes)`) in `frontend/src/app/app.config.ts:17-23`. Tests should mirror this with `provideHttpClient()` + `provideHttpClientTesting()` from `@angular/common/http/testing`, and `provideRouter([])` from `@angular/router`. Current advice will produce tests whose DI drifts from the app. | built-in review | — | — |
| 2 | WARNING | `.claude/agents/fe-test-reviewer.md:32` | Checklist item `[ ] HttpClientTestingModule used — no real HTTP requests leak` locks in the same deprecated pattern. Should instead check for `provideHttpClientTesting()` in `TestBed.configureTestingModule({ providers: [...] })`. | built-in review | — | — |
| 3 | WARNING | `.claude/skills/plan-and-do/SKILL.md:614` (Step 9.2) and `:680` (Step 11.1) | "Attempt automatic fix" / "auto-fix the smallest case" after a test run fails — but test_runner_agents are haiku and explicitly read-only. The skill does not name who fixes. In agents mode this should dispatch `be-coder` or `fe-coder` (matched to the failing test's scope) via Task tool, with the DISPATCH NARRATION RULE applied. Otherwise the skill falls back to direct-mode fix. Current wording is ambiguous and could stall the workflow. | built-in review | — | — |
| 4 | SUGGESTION | `.claude/skills/plan-and-do/SKILL.md:142` (AGENT DISCOVERY rule 3) | Rule still reads "Contains `-test-runner` or ends with `-tester` → `test_runner_agents`". No `-tester` agent exists anymore — `web-tester` was deleted. The `-tester` clause is dead. Keep for future-proofing, or drop to simplify. Harmless either way. | built-in review | — | — |

## Remaining Issues

Issues 1–4 are unresolved per the user's review-only request. Issues 1 and 2 should be fixed before the skill is used in the workshop, because the tests the skill auto-generates would diverge from the production provider setup and confuse beginners. Issue 3 is a workflow clarity gap that will surface the first time a test fails under agents mode. Issue 4 is cosmetic.

## Project Context Validation

- **CLAUDE.md agents table** (lines 61–79) lists 18 agents. All 18 files exist under `.claude/agents/` with matching `name` frontmatter. Cross-check passed.
- **Discovery rules** in `SKILL.md:138–152` are order-sensitive and cover every agent correctly:
  - `be-test-coder`, `fe-test-coder` → rule 1 → `test_coding_agents` ✓
  - `be-test-reviewer`, `fe-test-reviewer` → rule 2 → `test_review_agents` ✓
  - `be-test-runner`, `fe-test-runner` → rule 3 → `test_runner_agents` ✓
  - `ba-writer` → rule 4 → `writer_agents` ✓
  - `be-coder`, `db-coder`, `fe-coder`, `ui-designer` → rule 5 → `coding_agents` ✓
  - `ba-reviewer`, `be-reviewer`, `db-reviewer`, `fe-reviewer`, `ui-reviewer` → rule 6 → `review_agents` ✓
  - `admin`, `md-reader` → no match → skipped as utility ✓
- **File-path → agent mapping** in Step 8.1 covers backend routes/services/middleware/utils (be-coder), db schema/migrate/seed (db-coder), frontend features/core/app (fe-coder), SCSS/visuals (ui-designer). Test paths intentionally routed through the separate "test authoring phase" instead.
- **Tool frontmatter** is consistent with each agent's role: test-runners have `Read, Grep, Glob, Bash` (execute-only), test-coders have `Read, Write, Edit, Bash, Glob, Grep` (author + typecheck), reviewers have no `Write`/`Edit`.
- **Model tier** as requested: all four `-test-coder` / `-test-reviewer` agents are `sonnet`; both `-test-runner` agents are `haiku`.
- **Stack accuracy** verified against live files: `frontend/package.json` declares `jasmine-core ~5.9.0`, `karma ~6.4.0`, `karma-chrome-launcher ~3.2.0` (matches fe-test-coder). `backend/package.json` declares `@playwright/test ^1.52.0` with `"test": "playwright test"` (matches be-test-coder and be-test-runner). Seed users in `backend/src/config/users.ts` are admin/admin123, user/test123, demo/demo1234 (matches ba-writer, ba-reviewer after the earlier fix).

## Next Steps

- Fix issues 1 and 2 (frontend test agents → modern provider API) — highest leverage, most visible to workshop attendees
- Fix issue 3 (SKILL.md Step 9.2 / 11.1 — name the fixer agent explicitly)
- Optionally drop the dead `-tester` clause in rule 3
- Run the skill end-to-end on a throwaway task to validate the dispatch narration and the new test-authoring phase produce readable output for beginners

---
Generated with Claude Code - review v1.6.0
