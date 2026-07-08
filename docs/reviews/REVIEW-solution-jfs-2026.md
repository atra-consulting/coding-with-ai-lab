# Code Review - solution-jfs-2026

**Date**: 2026-07-08
**Branch**: solution-jfs-2026
**Base**: main
**Files Reviewed**: 1 (`.claude/skills/plan-and-do/SKILL.md`)
**Review Rounds**: 1 (max 3)

## Summary

Focused review. Special instruction: make sure `plan-and-do/SKILL.md` calls **only** the project skills `review` and `update-claude-files` — never a global/plugin skill of the same base name (e.g. `bpf:review`).

Finding: every call used the **bare** name `/review` and `/update-claude-files`. Bare names are ambiguous. Plugin skills `bpf-review` (`bpf:review`) and `bpf-update-claude-files` share the same base name. So the sub-skill could resolve to the wrong one.

Fix: namespace every invocation with the `project:` prefix. The project skills carry `name: "project:review"` and `name: "project:update-claude-files"` in their frontmatter, so `/project:review` and `/project:update-claude-files` are unambiguous. Added two explicit notes.

## Review Rounds

### Round 1

**Issues found**: 1 | **Fixes applied**: 1

| # | Severity | File | Issue | Found by | Proposed Fix | Fix by | Applied | Applied by |
|---|----------|------|-------|----------|--------------|--------|---------|------------|
| 1 | WARNING | `.claude/skills/plan-and-do/SKILL.md:825` (also 486, 826, 831, 851, 853, 891, 992) | Bare `/review` and `/update-claude-files` calls are ambiguous with plugin skills `bpf:review` / `bpf:update-claude-files` | built-in review | Namespace every call as `/project:review` / `/project:update-claude-files`; add disambiguation notes | direct fix | Renamed all 8 references; added a note at Step 10.1 and Step 12.1 | direct fix |

## Changes Applied

- **Step 10.1 (Invoke Review)** — invocation block now `/project:review "embedded base:[original_head]"` / `/project:review "embedded"`; added note: *"Always invoke the project skill `project:review` — never a plugin or global skill of the same base name (e.g. `bpf:review`)."*
- **Step 4.4b note (line 486)** — `/project:review "embedded"`.
- **Step 10.1 prose (line 831)** — `/project:review "embedded"`.
- **Step 10.3 (lines 851, 853)** — re-run `/project:review`.
- **Step 12.1 (Run doc-sync skill)** — invocation now `/project:update-claude-files "embedded base:[original_head]"`; added the same disambiguation note.
- **Success Criteria (line 992)** — "Code review via /project:review completed".

Left unchanged (descriptive help-text, not skill calls): `plan-and-do-modes.md` lines 55 and 83 ("Performs local code review using /review", "Code Review (local, via /review)"). These are documentation bullets in help/doctor output — they never trigger a skill invocation.

## Remaining Issues

No remaining issues. Every invocation-causing reference to the two sub-skills is now project-namespaced.

## Project Context Validation

- `.claude/skills/review/SKILL.md` frontmatter: `name: "project:review"` — confirms `/project:review` targets the project skill.
- `.claude/skills/update-claude-files/SKILL.md` frontmatter: `name: "project:update-claude-files"` — confirms `/project:update-claude-files` targets the project skill.
- Both project skills exist on disk and support embedded mode + `base:<ref>`, so the namespaced calls behave identically to before — only the resolution target is now pinned.

## Next Steps

- Optional: run `/project:plan-and-do` end-to-end once to confirm the namespaced sub-skill calls resolve.
- Commit when ready.

---
Generated with Claude Code - review v1.8.2
