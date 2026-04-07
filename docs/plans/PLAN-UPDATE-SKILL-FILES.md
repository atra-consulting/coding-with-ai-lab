# Implementation Plan: UPDATE-SKILL-FILES

## Test Command
`git diff main...HEAD -- .claude/skills/` (visual verification)

## Tasks

### 1. Update plan-and-do/SKILL.md — Speed Improvements

- [ ] **Step 1 Path A: Remove task key approval prompt** — Change from asking 1-Approve/2-Change/3-Clarify to just displaying and continuing. Saves one user interaction.
- [ ] **Step 4.4: Always create branch, never ask** — Remove the option to stay on main/master. Remove `stay_on_main` from state config. Always create branch silently.
- [ ] **Step 5: Auto-skip PRD for small tasks** — Replace the always-ask checkpoint with scope assessment (Step 5.1). Small tasks skip PRD automatically. Only complex tasks get the question.
- [ ] **Step 7.5: Workflow scope at plan approval** — Replace Standard Checkpoint with Plan Approval Checkpoint offering 5 choices (implement / implement+review / full / edit / quit). Store as `workflow_scope`.
- [ ] **Step 9.3: Skip to summary based on scope** — If `workflow_scope == "implement"`, auto-skip to Step 13 without asking.
- [ ] **Step 10: Skip post-review based on scope** — If `workflow_scope == "implement-review"`, skip to Step 13 after review. When no issues, go directly to Step 11 without asking.

### 2. Update plan-and-do/SKILL.md — Streamlining

- [ ] **Add CRITICAL mandatory workflow paragraph** after the "Plan and Do" heading
- [ ] **Add CHECKPOINT RULE paragraph** after the mandatory workflow paragraph
- [ ] **Add ARTIFACT PATH DISPLAY RULE section** after FILE PATH DISPLAY RULE
- [ ] **Simplify HOW TO ASK section** — Remove "Wait rule" paragraph
- [ ] **Add Standard Checkpoint to REUSABLE PATTERNS** — Define the Continue/Edit/Quit pattern once
- [ ] **Branch Protection simplification** — Remove "unless user opts to stay on main/master"
- [ ] **Step 13.0 cleanup** — Use `git rm --ignore-unmatch` for tracked + `rm -f` for untracked
- [ ] **State file additions** — Add `workflow_scope` to config, add `pr_url` to artifacts
- [ ] **Update date** from 2026-03-19 to 2026-03-22
- [ ] **Update success criteria** — "Branch always created" instead of conditional

### 3. Update review/SKILL.md — Improvements

- [ ] **Phase 4.2: Use Glob instead of find** — Replace `find . -maxdepth 2` with Glob tool patterns
- [ ] **Context Recovery: Add state file timing note** — Add paragraph about state file creation timing
- [ ] **Phase 5.0: Dynamic max_rounds** — Change "Three review rounds" to "Up to three review rounds (one round when no fix agents available)"
- [ ] **Phase 6.2: Dynamic review rounds** — Use `<max_rounds>` instead of hardcoded "3"
- [ ] **Phase 7: Dynamic round display** — Use `<max_rounds>` instead of hardcoded "3"

### 4. Verification
- [ ] Review diffs for both files
- [ ] Ensure no BPF-specific references leaked (names should stay `project:plan-and-do` and `project:review`)
