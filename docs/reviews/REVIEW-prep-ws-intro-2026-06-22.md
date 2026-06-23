# Code Review - prep-ws-intro-2026-06-22

**Date**: 2026-06-23
**Branch**: prep-ws-intro-2026-06-22
**Base**: main
**Scope**: `docs/specs/` (7 files) vs. actual app; all `.claude/agents/` (24 files); both `.claude/skills/`; plus `CLAUDE.md` (user follow-up)
**Review Rounds**: 3 (max 3)

## Summary

The specs, agents, and skills had drifted far from the running app. The core cause: the app
migrated its data layer and grew new subsystems, but the docs were never updated — and several
specs documented an *intended* design that never shipped.

Biggest themes:
- **Data layer migrated** `better-sqlite3` (sync) → `@libsql/client` (async, libSQL/Turso). Sessions
  moved from in-memory `memorystore` to a libSQL-backed `LibsqlSessionStore` + `sessions` table.
- **New subsystems undocumented**: `/api/agent-tasks`, `/api/cron`, cron runner, Vercel deploy,
  3 GitHub Actions workflows, Turso cloud DB — while specs claimed "local only, no CI/CD".
- **Specs described features that don't exist**: `/welcome` page, `permissionGuard`/`requirePermission`,
  Chance Kanban board, a reactive-form login. The real app uses role-based guards and a card-based login.
- **Agents referenced non-existent entities** (`Gehalt`, `Vertrag`) and stale `better-sqlite3` guidance.
- **Skills** would mis-dispatch the general tooling agents (`python-*`/`shell-*`/`skill-*`) onto CRM work,
  and `review` parsed a CLAUDE.md table column that doesn't exist.

All findings were fixed. Round 2 validated the rewrites against code and caught 3 small misses, fixed in Round 3.

## Review Rounds

### Round 1

**Issues found**: ~45 (25 grouped) | **Fixes applied**: 25 groups

| # | Severity | File | Issue | Found by | Fix | Applied |
|---|----------|------|-------|----------|-----|---------|
| 1 | CRITICAL | `SPECS-database/backend/infrastructure.md` | Driver listed as `better-sqlite3 9.6` (sync); actual `@libsql/client 0.17.3` (async) | be/db/ba-reviewer | Replaced driver + async service pattern | yes |
| 2 | CRITICAL | `SPECS-backend/infrastructure.md` | Session store listed as `memorystore`; actual `LibsqlSessionStore` + `sessions` table | be/ba-reviewer | Documented real store | yes |
| 3 | CRITICAL | `SPECS-infrastructure.md` | "No CI/CD, local only" — false (3 workflows, Vercel, Turso) | ba-reviewer | Rewrote with CI/CD + Vercel + Turso | yes |
| 4 | CRITICAL | `SPECS-backend.md` | 8 routers documented; 10 exist (missing `/api/agent-tasks`, `/api/cron`) | be-reviewer | Added both routers + auth | yes |
| 5 | CRITICAL | `SPECS-backend.md` | Claimed `requirePermission` exists in `auth.ts` — it does not | be-reviewer | Removed; documented `requireAuth`/`requireRole` | yes |
| 6 | CRITICAL | `SPECS-frontend/ui.md` | `/welcome` route + `WelcomeComponent` + `.welcome-card` don't exist | fe/ui-reviewer | Removed all welcome references | yes |
| 7 | CRITICAL | `SPECS-frontend.md` | `permissionGuard` + `hasPermission()` don't exist (real: `authGuard`/`roleGuard`) | fe-reviewer | Rewrote guards section | yes |
| 8 | CRITICAL | `SPECS-frontend.md` | Chance Kanban board + board service methods don't exist | fe-reviewer | Removed board section | yes |
| 9 | CRITICAL | `SPECS-frontend.md` | Login described as reactive form + demo-mode; real is card click-to-login | fe-reviewer | Rewrote Login description | yes |
| 10 | CRITICAL | `SPECS-ui.md` | ANGEBOT badge is `bg-warning text-dark`, not `bg-warning` (WCAG) | ui-reviewer | Fixed badge class | yes |
| 11 | CRITICAL | `SPECS-testing.md` | Backend tests 3/12 listed; frontend 3/14 | ui-reviewer | Listed all 12 + 14 | yes |
| 12 | WARNING | `SPECS-database.md`/`SPECS.md` | `agent_task`/`sessions` had no column tables; enums + 2 of 9 entities missing | db/ba-reviewer | Added tables, enums, entities | yes |
| 13 | WARNING | `SPECS-database.md` | 15 of 17 indexes undocumented; stale `amount` column; PRAGMA location wrong | db-reviewer | Added index list, fixed monetary + PRAGMA | yes |
| 14 | WARNING | `SPECS-infrastructure.md` | Missing env vars (`TURSO_*`, `AGENT_API_TOKEN`, `CRON_SECRET`) + 9 files | ba-reviewer | Added to env table + structure | yes |
| 15 | WARNING | `SPECS-backend.md` | Routes use `asyncHandler`, not raw try/catch; `cron_run` unmentioned | be-reviewer | Updated route pattern + cron note | yes |
| 16 | WARNING | `SPECS-frontend.md` | `/admin` tree, Administration sidebar, agent-task/cron models+services undocumented; `currentUser` signal; `search` not universal | fe-reviewer | Added all + fixed signal/search | yes |
| 17 | WARNING | `SPECS-ui/testing.md` | FeedbackForm deviations incomplete; CI cmd should be `npm run test:ci`; `resetDatabase()` also seeds agent tasks | ui-reviewer | Fixed all three | yes |
| 18 | WARNING | `ba-reviewer/ba-writer/db-coder/db-reviewer.md` | Reference non-existent `Gehalt` & `Vertrag` entities | skill-reviewer | Removed from all four | yes |
| 19 | WARNING | `db-*`, `be-*` agents | "better-sqlite3 synchronous" guidance wrong | skill-reviewer | Updated to async libSQL | yes |
| 20 | WARNING | `admin.md` | Seed description omits `fixture.json`/`runDataMigration()` | skill-reviewer | Added both mechanisms | yes |
| 21 | SUGGESTION | `python-reviewer/shell-reviewer.md` | "Update your agent memory" is a no-op for subagents | skill-reviewer | Replaced with review-output note | yes |
| 22 | SUGGESTION | `skill-coder.md` | "No MCP tools" claim false (7 fe/ui agents carry Playwright MCP intentionally) | skill-reviewer | Corrected the claim (tools kept) | yes |
| 23 | WARNING | `plan-and-do/SKILL.md`, `review/SKILL.md` | Tooling agents (`python-*`/`shell-*`/`skill-*`) mis-classified as CRM coders/reviewers | skill-reviewer | Added utility-agent filter | yes |
| 24 | WARNING | `review/SKILL.md` | Parses "File Types/Scope column" absent from CLAUDE.md table | skill-reviewer | Switched to name-pattern matching | yes |
| 25 | SUGGESTION | both skills | Minor: git "required" vs non-git mode; redundant skip/dryrun notes | skill-reviewer | Clarified wording | yes |

### Round 2 (validation)

**Issues found**: 3 | **Fixes applied**: 3

| # | Severity | File | Issue | Found by | Applied |
|---|----------|------|-------|----------|---------|
| 26 | WARNING | `SPECS-infrastructure.md` | Project-tree still labelled `auth.ts` as `requireRole / requirePermission guards` | be-reviewer | Round 3: changed to `requireAuth / requireRole` |
| 27 | WARNING | `db-coder.md`, `db-reviewer.md` | PRAGMA still claimed "per-connection in `config/db.ts`" | skill-reviewer | Round 3: corrected to once-at-startup in `migrate.ts` |
| 28 | SUGGESTION | `review/SKILL.md` | Footer still read `review v1.8.0` (skill bumped to v1.8.1) | skill-reviewer | Round 3: bumped footer to v1.8.1 |

Round 2 otherwise confirmed all Round 1 rewrites accurate against the code (backend, database, infrastructure, frontend, ui, CLAUDE.md, agents, skills).

### Round 3

Applied the 3 validation fixes above. All target strings were exact, known-correct values — no re-review needed.

## CLAUDE.md (user follow-up)

Updated `CLAUDE.md` for accuracy and slimmed reference-backed content:
- Project line: `@libsql/client`/Turso, bcrypt + `LibsqlSessionStore`, real role model (no `requirePermission`).
- Backend conventions: async libSQL + `asyncHandler`; only `wert` monetary; PRAGMA in `migrate.ts`; `requireAuth`/`requireRole`.
- "Adding a New Entity": `authGuard`/`roleGuard` instead of fictional `permissionGuard`; access control documented as role-based.
- **Moved out**: the two long autonomous-agent prose blocks were condensed to a summary + pointers, since
  the full detail (endpoints, secrets, board mechanics) already lives in `docs/API-TASKS.md`.
- **Kept in place** (deliberately): Coding Conventions, Build & Run, and the Agents/Specs tables — these are
  always-loaded guardrails for the main loop; their long-form detail lives in the specs, the quick rules belong here.

## Remaining Issues

No remaining issues. All 28 findings fixed and validated.

Two notes for future work (out of scope, not errors):
- `PersonService.listAll(abteilungId?)` has an undocumented optional param (low value).
- A stale code comment in `routes/cron.ts` says "every 10 min"; `vercel.json` schedules daily `0 2 * * *` (code comment, not a doc).

## Project Context Validation

Verified against actual code throughout: `package.json` (both), `schema.ts`, `enums.ts`, `migrate.ts`,
`db.ts`, `app.ts`, `routes/`, `services/`, `middleware/`, `users.ts`, `app.routes.ts`, guards, services,
models, `features/`, SCSS, `angular.json`, `vercel.json`, `api/`, `.github/workflows/`. Findings driven by
code, not assumptions.

## Next Steps

- Review this file.
- Optionally commit the spec/agent/skill/CLAUDE.md updates.
- Run frontend/backend builds if any code was touched (none was — docs only).

---
Generated with Claude Code - review v1.8.1
