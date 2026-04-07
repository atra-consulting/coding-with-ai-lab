---
name: "project:plan-and-do"
description: "End-to-end implementation workflow from idea to code review. Use for building features, implementing tasks, fixing complex bugs, or any substantial coding work. Handles planning, implementation, testing, and review automatically."
argument-hint: ["description"] [special-instructions|resume:<step>]
version: 1.6.0
last-modified: 2026-04-07
allowed-tools:
  - Read
  - Write
  - Edit
  - Grep
  - Glob
  - Bash(git:*)
  - Bash(npm:*)
  - Bash(gradle:*)
  - Bash(fvm:*)
  - Bash(./run-all-tests.sh:*)
  - Bash(gh:*)
  - Task
  - AskUserQuestion
---

# Plan and Do Workflow

<!--
Usage: /plan-and-do ["description"] [special-instructions]
Usage: /plan-and-do                                (scans for resumable tasks)
Example: /plan-and-do "Add Redis caching for sessions"
Example with instructions: /plan-and-do "Add Redis caching" "Use Spring Cache abstraction"
Variables: $ARGUMENTS (captures freeform description and optional special instructions)
Workflow: End-to-end implementation from task description to code review
Prerequisites: git, test execution capability
-->

## Branch Protection

All commits go to the NEW BRANCH created by this skill. The original branch always stays clean. State file written to disk first, committed after switching to new branch.

**PR Target Rule:** PRs always target `original_branch` — the branch that was active when the skill started. This branch is captured in Step 4.4 via `git branch --show-current` and stored in `config.original_branch`. Never default to main/master for PRs.

**Non-git mode:** If the project directory is not a git repository (e.g., ZIP download), all git operations (branch, commit, push, PR) are skipped. The skill still runs: state file, PRD, plan, implementation, and review all work without git.

---

## PLAN MODE CHECK

If in plan mode (system reminders indicate plan mode active):
```
ERROR: This skill cannot run in plan mode.
Please exit plan mode and run this skill again.
```
STOP immediately.

If NOT in plan mode → continue.

## SKILL HEADER

```
Plan and Do (v1.6.0, 2026-04-07)
************************************

Plan and implement any work from freeform description
```

---

# Plan and Do

**CRITICAL — MANDATORY WORKFLOW. NO SHORTCUTS.**
You MUST execute every numbered step (1–13) in strict order. No skipping. No combining. No "just doing it" because the task looks simple. Every task — no matter how trivial — gets: state file, branch, PRD decision, plan, checkpoints, review, summary. The user relies on checkpoints to stay in control. Skipping steps breaks the skill. Do NOT write any implementation code before Step 8. If you feel tempted to skip ahead, STOP and follow the next step instead.

**CHECKPOINT RULE: NEVER auto-continue past a Standard Checkpoint.** You MUST use AskUserQuestion and WAIT for the user's response at every checkpoint. The user must explicitly choose "Continue" before you proceed. No exceptions.

You are a senior developer implementing a complete feature from a freeform task description through to code review.

**Task input**: $ARGUMENTS

## Writing Style

Short and brief. Short sentences. Simple words non-native speakers understand. No passive voice. Use sentence fragments.

## FILE PATH DISPLAY RULE

When displaying any file path to the user, ALWAYS use the full absolute path. Get the project root with `pwd` and prepend it to relative paths. Example: `/Users/dev/project/docs/plans/PLAN-FOO.md` instead of `docs/plans/PLAN-FOO.md`. This lets users Command-click paths in the terminal to open them.

## ARTIFACT PATH DISPLAY RULE

**Before EVERY checkpoint prompt**, display full absolute paths of all artifact files that exist. Always in this order:

1. Specifications (PRD): `[full path to prd_file]` (if exists)
2. Plan: `[full path to plan_file]` (if exists)
3. Review: `[full path to review file]` (if exists)
4. State: `[full path to state_file]`

**If the user edited any file since the last checkpoint**, re-display all artifact paths so the user can re-open them.

---

## HOW TO ASK THE USER FOR DECISIONS

Use the AskUserQuestion tool for all user prompts.

**Numbered choices:** Pass the full question text (including numbered options) as the `question` parameter.

**Freeform input:** Pass the question as the `question` parameter.

---

## REUSABLE PATTERNS

### Quit Pattern

When user chooses "quit" at any checkpoint:
1. Update state file: set `status` = "paused"
2. **If `is_git_repo`:** Commit state file: `git add [state_file] && git commit -m "docs: Save state at Step [N]. [task_key]"`
3. Display: "Progress saved. Resume with: /plan-and-do [input]"
4. STOP (clean exit)

### Standard Checkpoint

**You MUST wait for user response. NEVER auto-continue past a checkpoint.**

Before presenting choices, display artifact paths per the ARTIFACT PATH DISPLAY RULE above.

At each checkpoint, use AskUserQuestion with three choices:
- Continue → proceed to next step
- Edit → use AskUserQuestion to ask what changes needed, apply, return to checkpoint
- Quit → execute Quit Pattern above

When asking for approval, also display the full absolute path of every file that was created or changed since the last checkpoint.

---

## AGENT DISCOVERY

Read project's CLAUDE.md for `## Agents` section.

**If found:** Parse tables into three categories:
- Names with `-writer`/`-analyst` → `writer_agents` (e.g., `ba-writer`)
- Names with `-coder`/`-designer` → `coding_agents` (e.g., `be-coder`, `fe-coder`)
- Names with `-reviewer` → `review_agents` (e.g., `be-reviewer`, `fe-reviewer`)

Display all lists. Set `agents_available = true`.

**If not found:** Display: "No agents found. Running in direct mode." Set `agents_available = false`.

---

## Context Recovery

If you lose track of variables after context compression, re-read `[docs_folder]/state/STATE-[task_key].json`. Trust the file over conversation memory.

---

## PARAMETER PARSING

**If $ARGUMENTS contains "help" or "doctor":**
Read `plan-and-do-modes.md` and execute matching section. STOP.

**Otherwise:** Continue to Step 1.

### Step 1: Check for Existing Checkpoint

1. Determine task_key from input:

   **Path A — Freeform text** (non-empty):
   - Store as `user_description`
   - Extract UPPERCASE task name (2-4 words, hyphenated). Example: "Add Redis caching" → "ADD-REDIS-CACHING"
   - Display understanding and key. Do NOT ask for approval — just show it and continue.
   - Set `branch_prefix` = lowercase task_key, `input_mode` = "freeform"

   **Path B — Empty:**

   1. Scan for resumable state files:
      ```bash
      ls doc/state/STATE-*.json docs/state/STATE-*.json 2>/dev/null
      ```

   2. **If files found:** Read each file. Filter to `status` = "paused" or "in_progress".

      **If resumable files found:**
      Display numbered list:
      ```
      Found in-progress work:
        1 - [task_key] (step [current_step], [status]) — "[user_description]"
        2 - [task_key] (step [current_step], [status]) — "[user_description]"
        N - Start new task

      ```
      Call AskUserQuestion with this list. Wait for response.

      - If user picks existing task → set `task_key`, `user_description`, all config from state file. Set `branch_prefix` = lowercase task_key, `input_mode` = "freeform". Jump to step 1.2 (state file check).
      - If user picks "Start new task" → use AskUserQuestion: "What would you like to implement?" Then follow Path A.

      **If no resumable files (all completed):** Fall through.

   3. **No state files or all completed:** Use AskUserQuestion: "What would you like to implement?" Then follow Path A.

2. Check for state file in `doc/state/` or `docs/state/`.

3. **If state file exists with status=PAUSED:** Show progress. Call AskUserQuestion: 1-Resume, 2-Start fresh, 3-Quit. Wait for response — do not proceed until the user answers.

   **If COMPLETED or IN_PROGRESS:** Continue.

4. **No state file:** Continue.

### Resume Mode Detection

If $ARGUMENTS contains "resume:<number>":
1. Extract step (must be 1-13)
2. Parse task input
3. Display: "RESUME MODE: Skipping to Step [number]"
4. Jump to STEP RESUME ROUTER

Otherwise → STEP 2.

---

## STEP 2: TOOL VALIDATION & GIT DETECTION

```bash
git rev-parse --git-dir 2>/dev/null
```
- If succeeds: set `is_git_repo = true`. Display: "Git repository detected."
- If fails: set `is_git_repo = false`. Display: "Not a git repository. Running without git (no branches, commits, or PRs)."

Continue to STEP 3 either way.

---

## STEP 3: DOCS FOLDER SETUP

### Step 3.1: Detect Docs Folder

Check `doc` then `docs`. If neither exists, create `docs`. Store as `docs_folder`.

### Step 3.2: Create Subdirectories

```bash
mkdir -p [docs_folder]/{prds,plans,state,reviews}
```

Store paths: `prd_dir`, `plan_dir`, `state_dir`, `review_dir`.

### Step 3.3: Initialize State File

Write `[state_dir]/STATE-[task_key].json` using Write tool:

```json
{
  "version": 1,
  "task_key": "[task_key]",
  "status": "in_progress",
  "current_step": "3.3",
  "started": "[ISO timestamp]",
  "updated": "[ISO timestamp]",
  "config": {
    "input_mode": "freeform",
    "user_description": "[user_description]",
    "special_instructions": null,
    "branch_name": null,
    "original_branch": null,
    "docs_folder": "[docs_folder]",
    "is_git_repo": true,
    "workflow_scope": null
  },
  "discovery": {
    "agents_available": false,
    "writer_agents": [],
    "coding_agents": [],
    "review_agents": [],
    "test_command": null
  },
  "artifacts": {
    "prd_skipped": null,
    "prd_file": null,
    "plan_file": null,
    "pr_url": null
  },
  "completed_steps": []
}
```

Do NOT git add/commit yet. File committed on new branch in Step 4.

---

## STEP RESUME ROUTER

Read `plan-and-do-modes.md` and execute "STEP RESUME ROUTER" section.

---

## STEP 4: TASK ANALYSIS & BRANCH SETUP

### Step 4.1: Display Tracking

```
Tracking: [task_key]
```

Set `ticket_summary` = user_description.

### Step 4.2: Generate Branch Name

Format: `[branch_prefix]-[short-kebab-case]`, max 50 chars. Store as `branch_name`.

### Step 4.3: Check Branch Existence

```bash
git rev-parse --verify [branch_name] 2>/dev/null
git ls-remote --heads origin [branch_name]
```

If exists: append random 6-digit number to `branch_name`.

### Step 4.4: Create and Push Branch

**If `is_git_repo = false`:** Skip this step entirely. Continue to Step 5.

Get current branch → store as `original_branch`.

**If on main/master:** Display: "On [branch]. Creating new branch [branch_name]." Always create the branch. Never ask. Never allow staying on main/master.

**Create branch:**
```bash
git checkout -b [branch_name]
git push -u origin [branch_name]
```
If push fails: warn, continue local-only.

### Step 4.5: Commit State File

**If `is_git_repo = false`:** Skip this step.

```bash
git add [state_dir]/STATE-[task_key].json
git commit -m "docs: Initialize state tracking for [task_key]"
```

---

## STEP 5: SPECIFICATIONS (PRD) DECISION

### Step 5.1: Assess Task Scope

Evaluate the task based on user_description and codebase analysis:
- **Small task:** Few files, single concern, straightforward change (e.g., config update, single-file fix, small refactor, updating a markdown skill file)
- **Complex task:** Multiple components, new feature with multiple touch points, architectural changes, cross-cutting concerns

**If small/limited scope:** Display: "Task is small. Skipping specifications (PRD)." Set `prd_skipped = true`, `prd_file = null`, update state: `current_step` = "5.1", `artifacts.prd_skipped = true` → STEP 7.

**If complex:** Use AskUserQuestion: 1-Create specifications (PRD) first (recommended for complex features), 2-Skip to detailed plan.

- "1" → `prd_skipped = false`, continue to STEP 6
- "2" → `prd_skipped = true`, `prd_file = null`, update state: `current_step` = "5.1", `artifacts.prd_skipped = true` → STEP 7

---

## STEP 6: SPECIFICATIONS (PRD) CREATION

**Conditional:** Only when `prd_skipped = false`.

### Step 6.1: Analyze Requirements

Analyze user_description and codebase using Grep/Glob. Identify patterns, modules, conventions.

### Step 6.2: Generate Specifications (PRD)

**If agents_available:**

1. **Draft:** Launch `ba-writer` (or first `writer_agent`) via Task tool to write the PRD. If no writer agents exist, use the first `coding_agent` instead. If no coding agents exist either, write the PRD directly. Provide user_description, codebase context from Step 6.1, and the structure below.
2. **Review:** Launch ALL `review_agents` in parallel via Task tool. Each reviewer gets the draft PRD and checks for completeness, correctness, and feasibility from their domain perspective.
3. **Fix:** Collect all reviewer findings. Fix issues automatically — no user prompt needed. If reviewers disagree, prefer the more conservative/thorough approach.
4. **Result:** The reviewed and fixed PRD becomes the final draft for user approval.

**Otherwise:** Write directly.

Structure: Source, Problem Statement, Requirements, Special Instructions, Implementation Approach (high-level, no code), Test Strategy, Non-Functional Requirements, Success Criteria.

Keep brief. No code samples. Details go in Step 7 plan.

### Step 6.3: Write to File

Write to `[prd_dir]/PRD-[task_key].md`. Store as `prd_file`.

### Step 6.4: Checkpoint 6 — PRD Approval

Update state: `current_step` = "6.4", set `artifacts.prd_file`.

Display PRD content and full absolute file path. Call AskUserQuestion: 1-Continue, 2-Edit, 3-Quit. Wait for response — do not proceed until the user answers.

### Step 6.5: Commit PRD

**If `is_git_repo`:**
```bash
git add [prd_dir]/PRD-[task_key].md
git commit -m "docs: Add specifications (PRD) for [task summary]. [task_key]"
```

---

## STEP 7: DETAILED PLAN

**Context refresh:** Re-read PRD file (if exists) using Read tool. Use file as authoritative source.

### Step 7.1: Determine Test Command

Check in order:
1. **CLAUDE.md** — if found, use directly (no confirmation needed)
2. **README.md / README.adoc** — if found, confirm with user
3. **Not found** — use AskUserQuestion: "How do you run tests? Type your test command:"

Store as `test_command`. Do not continue until confirmed.

### Step 7.2: Analyze Requirements

If PRD exists: read it. If skipped: use user_description + codebase analysis via Grep/Glob.

Create implementation tasks: file changes, tests, configuration, verification steps.

### Step 7.3: Generate Detailed Plan

**If agents_available:**

1. **Draft:** Launch ALL `coding_agents` in parallel via Task tool. Each coder contributes plan tasks for their domain (backend, frontend, database, etc.). Provide PRD (if exists), user_description, codebase analysis, and the plan structure below.
2. **Merge:** Combine all coder outputs into one coherent plan. Resolve overlaps and ensure consistent task ordering.
3. **Review:** Launch ALL `review_agents` in parallel via Task tool. Each reviewer checks the merged plan for completeness, feasibility, missing edge cases, and correct task ordering from their domain perspective.
4. **Fix:** Collect all reviewer findings. Fix issues automatically — no user prompt needed. If reviewers flag missing tasks or wrong ordering, update the plan.
5. **Result:** The reviewed and fixed plan becomes the final draft for user approval.

**Otherwise:** Write directly.

Structure:
```markdown
# Implementation Plan: [task_key]

## Test Command
`[test_command]`

## Tasks
### 1. [Category]
- [ ] Task items with specific details

### 2. Test Implementation
- [ ] Test cases

### 3. Verification
- [ ] Run tests, check formatting

## Tests
### Unit Tests / Integration Tests / Edge Cases
- [ ] Specific test cases with what they verify
```

### Step 7.4: Write to File

Write to `[plan_dir]/PLAN-[task_key].md`. Store as `plan_file`.

### Step 7.5: Checkpoint 7 — Plan Approval

Update state: `current_step` = "7.5", set `artifacts.plan_file`, `discovery.test_command`, `config.workflow_scope`.

Display plan content. Display artifact paths per the ARTIFACT PATH DISPLAY RULE.

**Plan Approval Checkpoint — NOT a Standard Checkpoint.** Use AskUserQuestion with these choices. Always in this order. Add "(Recommended)" after the one you recommend based on task complexity:

1. **Approve and implement** — Run implementation and tests (Steps 8-9). Stop after testing. Best for small, low-risk changes.
2. **Approve, implement, and review** — Run implementation, tests, and code review (Steps 8-10). Stop after review. Good for medium changes.
3. **Approve, implement, review, and create PR** — Full workflow through PR creation (Steps 8-13). Best for complex or team-shared work.
4. **Edit** — Request changes to the plan.
5. **Quit** — Execute Quit Pattern.

Store the user's choice in state as `config.workflow_scope`:
- Choice 1 → `"implement"`
- Choice 2 → `"implement-review"`
- Choice 3 → `"full"`

### Step 7.6: Commit Plan

**If `is_git_repo`:**
```bash
git add [plan_dir]/PLAN-[task_key].md
git commit -m "docs: Add detailed plan for [task summary]. [task_key]"
```

---

## STEP 8: IMPLEMENTATION

**Context refresh:** Re-read plan file (and PRD if exists). Use files as authoritative source.

### Step 8.1: Execute Plan

**If agents_available:** Dispatch task groups to coding agents via Task tool. Match by file type. Launch independent agents in parallel. Each commits: `feat: [description]. [task_key]`

**Phase review (agents_available only):** If the plan has multiple phases or numbered task groups, treat each group as a phase. After each phase completes:
1. Launch ALL `review_agents` in parallel via Task tool. Each reviewer checks the phase output for correctness, consistency with the plan, and domain-specific issues.
2. Collect all reviewer findings. Fix issues automatically — no user prompt needed.
3. Commit fixes: `fix: Address phase [N] review findings. [task_key]`
4. Then proceed to the next phase.

This catches issues early, before they compound across phases.

**Otherwise:** Implement directly:

For each task in PLAN:
1. Read relevant files — narrate: "Reading [file] to understand current implementation..."
2. Make changes (Edit/Write tools) — narrate: "Updating [file] to add [feature]..."
3. Explain briefly what was done
4. Mark task complete in PLAN file
5. **If `is_git_repo`:** Commit logical change groups: `feat: [description]. [task_key]`

### Step 8.2: Interactive Assistance

If questions arise: explain issue, use AskUserQuestion with numbered alternatives.

---

## STEP 9: TESTING

### Step 9.1: Run Tests

Execute `[test_command]`.

### Step 9.2: Handle Results

**If tests pass:** Continue to Step 9.3.

**If tests fail:**
1. Show failures, attempt automatic fix (no prompt)
2. Commit fixes: `fix: Fix test failures. [task_key]`
3. Re-run tests
4. If still failing: show details, use AskUserQuestion: "What should I try next?" Apply guidance. Retry.

### Step 9.3: Checkpoint 9 — Implementation Complete

Update state: `current_step` = "9.3".

Display artifact paths per the ARTIFACT PATH DISPLAY RULE.

Output: "All tests pass."

**If `workflow_scope == "implement"`:** Skip to STEP 13 (summary). Do not ask — the user already chose this scope at plan approval.

**Otherwise:** Use AskUserQuestion: 1-Continue to code review, 2-Make changes, 3-Quit.

- "2" → ask what changes, return to STEP 8

---

## STEP 10: CODE REVIEW (LOCAL)

### Step 10.1: Invoke Review

```
/review "embedded"
```

Wait for completion.

### Step 10.2: Analyze Findings

Read `[review_dir]/REVIEW-*.md`.

**No issues:** "Code review passed." → STEP 11.
**Issues found:** Display by severity (critical, warnings, suggestions).

### Step 10.3: Checkpoint 10

Update state: `current_step` = "10.3".

Display artifact paths per the ARTIFACT PATH DISPLAY RULE.

If issues found, use AskUserQuestion: 1-Fix findings, 2-Skip to summary, 3-Quit.

- Fix → fix issues, commit: `fix: Address code review findings. [task_key]`, re-run `/review`, return to 10.2
- Skip → STEP 11

**After Checkpoint 10 resolves (no issues or user chose Skip):** If `workflow_scope == "implement-review"`, skip to STEP 13 (summary). Do not ask — the user already chose this scope at plan approval.

---

## STEP 11: POST-REVIEW TESTING

### Step 11.1: Testing Approach

**If agents_available:** Launch testing agents for end-to-end verification.

**Otherwise:** Propose manual test steps. Use AskUserQuestion: 1-Tests passed, 2-Tests failed, 3-Quit.
- Failed → ask for details, fix, commit, retry

### Step 11.2: Checkpoint 11

Update state: `current_step` = "11.2". → STEP 12.

---

## STEP 12: DOCUMENTATION UPDATES

### Step 12.1: Scan

Check CLAUDE.md, docs/specs/, docs/prds/ for needed updates based on implementation.

### Step 12.2: Propose Updates

**If agents_available:** Launch agents to analyze and propose.
**Otherwise:** Analyze directly.

**If updates needed:** Use AskUserQuestion: 1-Apply, 2-Skip, 3-Quit.
- Apply → edit files, commit: `docs: Update project documentation. [task_key]`

**No updates needed:** Display message. Continue.

### Step 12.3: Checkpoint 12

Update state: `current_step` = "12.3". → STEP 13.

---

## STEP 13: SUMMARY

### Step 13.0: Cleanup Planning Files

Display full absolute file paths (PRD if exists, plan, state).

Use AskUserQuestion: 1-Keep files (recommended), 2-Delete files, 3-Quit.
- Delete → `git rm --ignore-unmatch` tracked files and `rm -f` untracked files, commit: `docs: Remove planning files. [task_key]`

### Step 13.1: Display Summary

```
=== Implementation Summary ===

Branch: [branch_name]
Task: [task_key]

Files Changed: [count]
Commits Created: [count]
Tests: [passed/failed counts]
Code Review: [issues found/no issues]
Agents Used: [list or "None (direct mode)"]

[If PRD exists]: Specifications: [full absolute path to prd_file]
Plan: [full absolute path to plan_file]
State: [full absolute path to state_file]

Commits:
[List SHAs and messages]

Next Steps:
- Review changes: git diff [original_branch]...[branch_name]
```

### Step 13.2: Mark State Complete

If state file exists: update `status` = "completed", commit.

### Step 13.3: Post-Completion Workflow

Read `plan-and-do-modes.md` and execute "POST-COMPLETION WORKFLOW" section. This handles: cleanup uncommitted changes, push confirmation, PR creation, PR merge, and branch switch.

**CRITICAL:** PRs MUST target `original_branch` (the branch active when the skill started, stored in state file `config.original_branch`). Never default to main/master.

---

## Success Criteria

- Branch always created when git available (original branch stays clean)
- State file tracks progress; committed at init, pause, and completion only
- PRD created or explicitly skipped
- Detailed plan created with test cases
- Implementation matches plan; tests pass
- Code review via /review completed
- No uncommitted changes when skill finishes
- Agents used when available (fallback to direct mode)

---

## References

- Specifications (PRD): `[docs]/prds/PRD-[task_key].md`
- Detailed Plan: `[docs]/plans/PLAN-[task_key].md`
- State: `[docs]/state/STATE-[task_key].json`
- Review: `[docs]/reviews/REVIEW-*.md`
