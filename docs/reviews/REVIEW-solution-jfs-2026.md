# Code Review - solution-jfs-2026

**Date**: 2026-07-08
**Branch**: solution-jfs-2026
**Base**: 852242c04324d9d76ea52c62fd905a6e0ccdce36
**Files Reviewed**: 4 (skill, backend route, backend tests, spec) + 2 planning files (skipped)
**Review Rounds**: 3 (max 3)

## Summary

Reviewed the DO-SEMI-AUTOMATIC-SKILL change: a new headless skill `.claude/skills/do-semi-automatic/SKILL.md`, a backend auth widening in `backend/src/routes/tickets.ts` (`GET /board` and `PATCH /:id/status` now accept agent token / loopback / admin session), the matching `docs/specs/SPEC-API-TICKETS.md` update, and extended Playwright tests. All 322 backend tests pass. Three review rounds; all findings fixed. Final round clean.

## Review Rounds

### Round 1

**Issues found**: 7 | **Fixes applied**: 7

| # | Severity | File | Issue | Found by | Proposed Fix | Fix by | Applied | Applied by |
|---|----------|------|-------|----------|--------------|--------|---------|------------|
| 1 | WARNING | `.claude/skills/do-semi-automatic/SKILL.md` | Frontmatter `description` in German; siblings use English | skill-reviewer | Rewrite description in English | skill-coder | Description now English, version→1.0.1 | skill-coder |
| 2 | WARNING | `.claude/skills/do-semi-automatic/SKILL.md` | plan-and-do pre-auth block has no answer for the "test command" checkpoint → headless hang | skill-reviewer | Add standing test-command answer | skill-coder | Added backend/frontend test-cmd bullet | skill-coder |
| 3 | WARNING | `.claude/skills/do-semi-automatic/SKILL.md` | Mutating calls (3a/3b/4) don't check HTTP codes → silent failure | skill-reviewer | Capture code, stop on non-2xx | skill-coder | Added shared error rule + per-call code capture | skill-coder |
| 4 | SUGGESTION | `.claude/skills/do-semi-automatic/SKILL.md` | Loopback note describes a path the skill never takes | skill-reviewer | Clarify as background-only | skill-coder | Clarified | skill-coder |
| 5 | WARNING | `docs/specs/SPEC-API-TICKETS.md:468` | Transition table tags `PATCH /status` as `(admin)` (stale) | ba-reviewer | Retag agent·loopback·admin | be-coder | Retagged | be-coder |
| 6 | WARNING | `docs/specs/SPEC-API-TICKETS.md:90` | "unset token → 401" bullet inaccurate for multi-auth endpoints | ba-reviewer | Split pure vs. session-fallback endpoints | be-coder | Bullet corrected | be-coder |
| 7 | SUGGESTION | `docs/specs/SPEC-API-TICKETS.md:219,321` | Imprecise localhost wording; invented "flow" name | ba-reviewer | Tighten wording | be-coder | Reworded | be-coder |

be-reviewer: clean (one pre-existing, optional test-coverage suggestion, not a regression).

### Round 2

**Issues found**: 4 | **Fixes applied**: 4

| # | Severity | File | Issue | Found by | Proposed Fix | Fix by | Applied | Applied by |
|---|----------|------|-------|----------|--------------|--------|---------|------------|
| 1 | CRITICAL | `.claude/skills/do-semi-automatic/SKILL.md:203` | Frontend test cmd `ng test --watch=false` not headless → hang | skill-reviewer | Use `npm run test:ci` | skill-coder | Changed to `npm run test:ci`, version→1.0.2 | skill-coder |
| 2 | WARNING | `.claude/skills/do-semi-automatic/SKILL.md:34` | Error rule prints "response body" but calls use `-o /dev/null` | skill-reviewer | Print endpoint+code only | skill-coder | Rule + 2 inline restatements trimmed | skill-coder |
| 3 | WARNING | `docs/specs/SPEC-API-TICKETS.md:460,466` | Sibling rows (`owner`, `comments`) still tagged `(admin)` (pre-existing) | ba-reviewer | Retag agent·loopback·admin | be-coder | Retagged both | be-coder |
| 4 | SUGGESTION | `docs/specs/SPEC-API-TICKETS.md:79,90` | Session-fallback list omits `GET /:id` | ba-reviewer | Add `GET /:id` | be-coder | Added | be-coder |

### Round 3

Clean pass. No issues found. (One sub-threshold, pre-existing stylistic note on auth-method ordering in some parentheticals — not a finding.)

## Remaining Issues

No remaining issues.

## Project Context Validation

- Backend change follows the established `requireAgentTokenOrAdminSession` pattern (CLAUDE.md: agent endpoints use agent-token middleware). Admin-only endpoints untouched. All 322 Playwright tests pass.
- Skill file matches sibling conventions (`do-factory-automatic`, `write-ticket`), German body, English frontmatter description, headless-safe, no `AskUserQuestion`.
- Spec doc now internally consistent with the route middleware.

## Next Steps

- Ensure all tests pass (done — 322 passing).
- Update documentation if needed (done).
- No PR (workflow scope: implement-review).

---
Generated with Claude Code - review v1.8.2
