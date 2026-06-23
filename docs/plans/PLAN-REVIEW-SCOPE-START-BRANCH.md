# Implementation Plan: REVIEW-SCOPE-START-BRANCH

## Goal

When `plan-and-do` calls `/review`, scope the review to changes against the **starting branch**, not main/master.

## Test Command

`N/A (docs-only)` — skill-definition Markdown. No automated tests. Verify with `skill-reviewer`.

## Problem

`/review` hardcodes its diff base:
- PHASE 3.1 picks `main` or `master`.
- PHASE 3.3 runs `git diff --name-only <main_branch>...HEAD`.

So when `plan-and-do` keeps a feature branch (or branches off one), the review covers every commit since main — far more than the task changed.

## Key design point: use the starting commit, not the branch name

In the kept-branch case, `original_branch` == the current branch. The branch ref moves forward with each commit. So `git diff original_branch...HEAD` is **empty**. Passing the branch name fails exactly here.

Fix: capture the starting commit SHA when the skill begins (`original_head`). Diff against that. Correct for both cases:
- **Kept branch:** `original_head` = where the branch sat at start. `original_head...HEAD` = this run's commits.
- **New branch:** `original_head` = the point we branched from. `original_head...HEAD` = this task's commits.

## Tasks

### 1. `plan-and-do/SKILL.md` — capture and pass the base

- [ ] **Step 4.4:** after storing `original_branch`, also capture `original_head` = `git rev-parse HEAD`. (Do this before any branch creation, so it records the true starting commit.)
- [ ] **Step 3.3 state template:** add `"original_head": null` to `config`.
- [ ] **Step 4.5:** include `original_head` when updating/committing the state file.
- [ ] **Step 10.1:** change the review call from `/review "embedded"` to `/review "embedded base:[original_head]"`.
- [ ] **Branch Protection section (top):** add one line: review scope = changes since `original_head` (the starting branch's commit), not main/master.
- [ ] **Context Recovery / state notes:** keep wording consistent. `original_head` lives in `config`.

### 2. `review/SKILL.md` — accept and honor a base override

- [ ] **ARGUMENTS HANDLING:** document an optional `base:<ref>` token. `<ref>` is a branch or commit SHA. Combines with `embedded` (e.g. `embedded base:abc1234`).
- [ ] **PHASE 1 parsing:** parse `base:<ref>`. Store as `base_override` (null if absent).
- [ ] **PHASE 3.1 (Determine base):** if `base_override` set and `git rev-parse --verify <base_override>` succeeds, use it as the comparison base. Skip main/master detection. If `base_override` set but invalid, warn and fall back to main/master. If unset, keep current main/master behavior.
- [ ] **PHASE 3.2 (Fetch):** only fetch when the base is a branch name. A SHA needs no fetch. Keep `|| true`.
- [ ] **PHASE 3.3 (Diff):** already uses the base variable. Confirm it reads the resolved base, not a literal `main`.
- [ ] **PHASE 7 summary "Base:" line:** show the actual base used (SHA or branch), so the user sees what the review compared against.
- [ ] Rename the internal label from "Main Branch" to "Base" where it now may not be main. Keep changes minimal and readable.

### 3. Consistency

- [ ] Use the same token spelling (`base:`) in both files.
- [ ] Match project writing style: short sentences, simple words, no passive voice, fragments OK.
- [ ] Do not change either skill's YAML frontmatter except a version/last-modified bump if the skill already versions itself.

## Tests

Test-inappropriate change (skill docs only). No unit or API tests.

### Verification
- [ ] `skill-reviewer` reviews both skill files: argument parsing, branching coverage, fallback paths, no broken steps.
- [ ] Manual trace: kept-branch case → `original_head...HEAD` non-empty. New-branch case → same. Invalid base → falls back to main/master.
- [ ] Confirm `base:` parsing does not collide with the "Other text → special instructions" rule.
