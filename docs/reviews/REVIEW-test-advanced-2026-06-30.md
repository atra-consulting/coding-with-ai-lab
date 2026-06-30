# Code Review - test-advanced-2026-06-30

**Date**: 2026-06-30
**Branch**: test-advanced-2026-06-30
**Base**: ee261eb91610292fa2da0bd94a75c5c390d61c8e
**Files Reviewed**: 3
**Review Rounds**: 3 (max 3)

## Summary

Created the `project:do-factory-automatic` skill — an autonomous headless task runner that claims agent tasks, judges build-or-reject via the `requirements-reviewer` subagent, runs `plan-and-do` unattended, and marks tasks done. Two rounds of fixes were needed: Round 1 fixed missing lifecycle transitions and verdict-detection logic; Round 2 fixed missing `-w '\n%{http_code}'` flags on curl calls. Round 3 was clean.

## Review Rounds

### Round 1

**Issues found**: 7 | **Fixes applied**: 5 (2 critical, 3 warnings/suggestions)

| # | Severity | File | Issue | Found by | Proposed Fix | Fix by | Applied | Applied by |
|---|----------|------|-------|----------|--------------|--------|---------|------------|
| 1 | CRITICAL | `.claude/skills/do-factory-automatic/SKILL.md:59` | `GET /:id` path never calls `POST /:id/start` — task stays OPEN | skill-reviewer | Add `POST /:id/start` call with 200/409/other handling after GET 200 | skill-coder | Added POST /start with all three response branches | skill-coder |
| 2 | CRITICAL | `.claude/skills/do-factory-automatic/SKILL.md:98` | Verdict strings `VERDICT: BUILD` / `VERDICT: REJECT` won't match requirements-reviewer's emoji-based output — every task would be rejected | skill-reviewer | Add explicit instruction in subagent prompt to end with exactly `VERDICT: BUILD` or `VERDICT: REJECT` | skill-coder | Added verbatim instruction block at end of Step 2 subagent prompt | skill-coder |
| 3 | WARNING | `.claude/skills/do-factory-automatic/SKILL.md:115` | `POST /:id/reject` response not checked — false success possible | skill-reviewer | Add 200/other check | skill-coder | Added response code check | skill-coder |
| 4 | WARNING | `.claude/skills/do-factory-automatic/SKILL.md:161` | `POST /:id/done` response not checked | skill-reviewer | Add 200/other check | skill-coder | Added response code check | skill-coder |
| 5 | SUGGESTION | `.claude/skills/do-factory-automatic/SKILL.md:106` | Fallback reject reason not actionable for a human | skill-reviewer | Change to specific German text | skill-coder | Changed to "Anforderungsprüfung konnte kein klares Ergebnis liefern. Bitte Aufgabe präzisieren und erneut einreichen." | skill-coder |
| 6 | WARNING | `docs/plans/PLAN-DO-FACTORY-AUTOMATIC-SKILL.md:14` | Plan omits `POST /:id/start` for direct-ID path | ba-reviewer | — | — | Fixed via skill fix #1 | — |
| 7 | SUGGESTION | `docs/plans/PLAN-DO-FACTORY-AUTOMATIC-SKILL.md:22` | Verification checklist too coarse to catch the /start gap | ba-reviewer | — | — | skipped | — |

### Round 2

**Issues found**: 3 | **Fixes applied**: 2

| # | Severity | File | Issue | Found by | Proposed Fix | Fix by | Applied | Applied by |
|---|----------|------|-------|----------|--------------|--------|---------|------------|
| 8 | CRITICAL | `.claude/skills/do-factory-automatic/SKILL.md:133` | `POST /:id/reject` curl missing `-w '\n%{http_code}'` — response code check inoperable | skill-reviewer | Add `-w '\n%{http_code}'` flag | skill-coder | Added flag | skill-coder |
| 9 | CRITICAL | `.claude/skills/do-factory-automatic/SKILL.md:183` | `POST /:id/done` curl missing `-w '\n%{http_code}'` | skill-reviewer | Add `-w '\n%{http_code}'` flag | skill-coder | Added flag | skill-coder |
| 10 | CRITICAL | `.claude/skills/do-factory-automatic/SKILL.md:62` | `POST /:id/start` curl missing `-w '\n%{http_code}'` | skill-reviewer | Add flag | skill-coder | Already present from Round 1 fix | — |

### Round 3

Clean pass. No critical or warning issues found.

Remaining suggestions (not blocking):
- `SKILL.md:170` — `/project:plan-and-do` shown as slash-command string vs. Task tool. Intentional per spec (`tasks/advanced/Skill für Übungsaufgabe 2.md` line 79 says "Den Slash-Befehl aufrufen").
- `SKILL.md:93` — `task_metadata` variable name vs `metadata` JSON field name — minor naming note.

## Remaining Issues

No remaining issues.

## Project Context Validation

Skill follows the spec in `tasks/advanced/Skill für Übungsaufgabe 2.md` faithfully. All API endpoints verified against `docs/API-TASKS.md`. Auth headers correct. Source priority order (EMAIL → GITHUB_ISSUE → ERROR_REPORT → APP_LOG) matches spec. Headless requirement met throughout — no `AskUserQuestion` calls.

## Next Steps

- No fixes needed
- Skill ready to use: `/do-factory-automatic` or `/do-factory-automatic <task-id>`

---
Generated with Claude Code - review v1.8.2
