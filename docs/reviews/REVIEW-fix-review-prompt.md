# Code Review - fix-review-prompt

**Date**: 2026-04-20
**Branch**: fix-review-prompt
**Base**: main
**Files Reviewed**: 3
**Review Rounds**: 1

## Summary

Targeted fix to `.claude/skills/plan-and-do/SKILL.md`. Root cause of the bug: Step 9.3 was labeled "Checkpoint 9 — Implementation Complete" but its body said "Do NOT prompt". The word "Checkpoint" in the heading triggered the global "NEVER auto-continue past a Standard Checkpoint" rule, so the executing LLM prompted anyway.

Fix renames Steps 9.3, 11.2, 12.3 to remove "Checkpoint N" labels (these are pure transitions, not user prompts), adds "NOT a user checkpoint" markers to their bodies, and clarifies the CHECKPOINT RULE at lines 72-74 so the body-level AskUserQuestion call (not the heading word) decides.

Review found one wording conflict with Step 7.5's existing "NOT a Standard Checkpoint" label — fixed by rewording the new rule from "is a Standard Checkpoint" to "prompts the user".

## Review Rounds

### Round 1

**Issues found**: 1 | **Fixes applied**: 1

| # | Severity | File | Issue | Found by | Fix | Fixed by |
|---|----------|------|-------|----------|-----|----------|
| 1 | WARNING | `.claude/skills/plan-and-do/SKILL.md:74` | New rule "A step is a Standard Checkpoint ONLY if its body calls AskUserQuestion" conflicts with line 508 "Plan Approval Checkpoint — NOT a Standard Checkpoint" (Step 7.5 does call AskUserQuestion). Definitional clash. | built-in review | Reworded to "A step prompts the user ONLY if its body explicitly calls AskUserQuestion" — avoids the Standard Checkpoint label | direct fix |

## Remaining Issues

No remaining issues.

## Project Context Validation

- CLAUDE.md does not specify rules for skill markdown files; edit is consistent with existing skill patterns.
- No code changes — only markdown and JSON. No build or test impact.
- All renamed steps still contain the workflow_scope-based auto-advance logic they had before. Behavior is preserved for Steps 9.3 `implement` / `implement-review` / `full` paths.

## Next Steps

- Verify the fix works on the next `/plan-and-do` run.
- Merge to main.

---
Generated with Claude Code - review v1.6.0
