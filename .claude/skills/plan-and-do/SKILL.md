---
name: "project:plan-and-do"
description: "End-to-end implementation workflow from idea to code review. Use for building features, implementing tasks, fixing complex bugs, or any substantial coding work. Handles planning, implementation, testing, and review automatically."
argument-hint: ["description"] [special-instructions|resume:<step>]
version: 1.5.0
last-modified: 2026-03-19
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

All commits go to the NEW BRANCH created by this skill. The original branch stays clean unless user opts to stay on main/master. State file written to disk first, committed after switching to new branch.

**PR Target Rule:** PRs always target `original_branch` — the branch that was active when the skill started. This branch is captured in Step 4.4 via `git branch --show-current` and stored in `config.original_branch`. Never default to main/master for PRs.

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
Plan and Do (v1.5.0, 2026-03-19)
************************************

Plan and implement any work from freeform description
```

---

# Plan and Do

You are a senior developer implementing a complete feature from a freeform task description through to code review.

**Task input**: $ARGUMENTS

## Writing Style

Short and brief. Short sentences. Simple words non-native speakers understand. No passive voice. Use sentence fragments.

## FILE PATH DISPLAY RULE

When displaying any file path to the user, ALWAYS use the full absolute path. Get the project root with `pwd` and prepend it to relative paths. Example: `/Users/dev/project/docs/plans/PLAN-FOO.md` instead of `docs/plans/PLAN-FOO.md`. This lets users Command-click paths in the terminal to open them.

---

## HOW TO ASK THE USER FOR DECISIONS

Use the AskUserQuestion tool for all user prompts. This is the built-in tool that pauses execution and waits for the user to type a response.

**Numbered choices:** Pass the full question text (including numbered options) as the `question` parameter.

**Freeform input:** Pass the question as the `question` parameter.

**Wait rule:** After calling AskUserQuestion, you MUST wait for the user's response before taking any further action. Never assume a choice, skip the question, or proceed without the user's answer. The user's response drives what happens next.

---

## REUSABLE PATTERNS

### Quit Pattern

When user chooses "quit" at any checkpoint:
1. Update state file: set `status` = "paused"
2. Commit state file: `git add [state_file] && git commit -m "docs: Save state at Step [N]. [task_key]"`
3. Display: "Progress saved. Resume with: /plan-and-do [input]"
4. STOP (clean exit)

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
   - Output understanding and suggested key. Call AskUserQuestion: 1-Approve, 2-Change key, 3-Clarify. Wait for response before continuing.
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

## STEP 2: TOOL VALIDATION

```bash
git --version
```
If fails: "REQUIRED: git unavailable. Install: brew install git" → STOP.
If succeeds: "git available" → STEP 3.

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
    "stay_on_main": false
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
    "plan_file": null
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

**First:** Capture current branch immediately — before any branch operations:
```bash
git branch --show-current
```
Store result as `original_branch`. Update state file `config.original_branch`. This value determines the PR target later — it must reflect the branch the user was on when the skill started.

**If on main/master:** Warn user. Call AskUserQuestion: 1-Create new branch (recommended), 2-Stay on main. Wait for response — do not proceed until the user answers.
- If stay → set `stay_on_main = true`, skip to Step 4.5.

**Create branch** (unless `stay_on_main`):
```bash
git checkout -b [branch_name]
git push -u origin [branch_name]
```
If push fails: warn, continue local-only.

### Step 4.5: Commit State File

```bash
git add [state_dir]/STATE-[task_key].json
git commit -m "docs: Initialize state tracking for [task_key]"
```

---

## STEP 5: SPECIFICATIONS (PRD) DECISION

Call AskUserQuestion: 1-Create specifications (PRD) first (recommended for complex features), 2-Skip to detailed plan. Wait for response — do not choose for the user.

- "1" → `prd_skipped = false`, continue to STEP 6
- "2" → `prd_skipped = true`, `prd_file = nil`, update state → STEP 7

---

## STEP 6: SPECIFICATIONS (PRD) CREATION

**Conditional:** Only when `prd_skipped = false`.

### Step 6.1: Analyze Requirements

Analyze user_description and codebase using Grep/Glob. Identify patterns, modules, conventions.

### Step 6.2: Generate Specifications (PRD)

**If agents_available:**

1. **Draft:** Launch `ba-writer` (or first `writer_agent`) via Task tool to write the PRD. If no writer agents exist, use the first `coding_agent` instead. Provide user_description, codebase context from Step 6.1, and the structure below.
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
2. **README.md / README.adoc** — if found, call AskUserQuestion to confirm: "Found test command `[cmd]` in README. 1-Use this, 2-Enter different command." Wait for response — do not proceed until the user answers.
3. **Not found** — call AskUserQuestion: "How do you run tests? Type your test command:" Wait for response — do not proceed until the user answers.

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

Update state: `current_step` = "7.5", set `artifacts.plan_file`, `discovery.test_command`.

Display plan content and full absolute file path. Call AskUserQuestion: 1-Continue, 2-Edit, 3-Quit. Wait for response — do not proceed until the user answers. The user must approve the plan before any code is written.

### Step 7.6: Commit Plan

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
5. Commit logical change groups: `feat: [description]. [task_key]`

### Step 8.2: Interactive Assistance

If questions arise: explain issue, call AskUserQuestion with numbered alternatives. Wait for response before continuing.

---

## STEP 9: TESTING

### Step 9.1: Run Tests

Execute `[test_command]`.

### Step 9.2: Handle Results

**If tests pass:** Continue to Step 9.4.

**If tests fail:**
1. Show failures, attempt automatic fix (no prompt)
2. Commit fixes: `fix: Fix test failures. [task_key]`
3. Re-run tests
4. If still failing: show details, use AskUserQuestion: "What should I try next?" Apply guidance. Retry.

### Step 9.3: Checkpoint 9 — Implementation Complete

Update state: `current_step` = "9.3".

Output: "All tests pass." Call AskUserQuestion: 1-Continue to code review, 2-Make changes, 3-Quit. Wait for response — do not proceed until the user answers.

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

**Issues found:** Display by severity (critical, warnings, suggestions).
**No issues:** Display: "Code review passed — no issues found."

### Step 10.3: Checkpoint 10

Update state: `current_step` = "10.3".

Always call AskUserQuestion here — regardless of whether issues were found:

**If issues found:** Call AskUserQuestion: 1-Fix findings, 2-Skip to post-review testing, 3-Quit. Wait for response — do not proceed until the user answers.
- Fix → fix issues, commit: `fix: Address code review findings. [task_key]`, re-run `/review`, return to 10.2

**If no issues:** Call AskUserQuestion: 1-Continue to post-review testing, 2-Make changes, 3-Quit. Wait for response — do not proceed until the user answers.

---

## STEP 11: POST-REVIEW TESTING

### Step 11.1: Testing Approach

**If agents_available:** Launch testing agents for end-to-end verification. After agents complete, display results.

**Otherwise:** Propose manual test steps.

### Step 11.2: Checkpoint 11

Update state: `current_step` = "11.2".

Call AskUserQuestion: 1-Tests passed — continue, 2-Tests failed — need fixes, 3-Quit. Wait for response — do not proceed until the user answers.
- "2" → ask for details, fix, commit: `fix: Address post-review test failures. [task_key]`, retry from 11.1

---

## STEP 12: DOCUMENTATION UPDATES

### Step 12.1: Scan

Check CLAUDE.md, docs/specs/, docs/prds/ for needed updates based on implementation.

### Step 12.2: Propose Updates

**If agents_available:** Launch agents to analyze and propose.
**Otherwise:** Analyze directly.

Display findings (updates needed or "no documentation updates needed").

### Step 12.3: Checkpoint 12

Update state: `current_step` = "12.3".

**If updates needed:** Call AskUserQuestion: 1-Apply updates, 2-Skip updates, 3-Quit. Wait for response — do not proceed until the user answers.
- Apply → edit files, commit: `docs: Update project documentation. [task_key]`

**If no updates needed:** Call AskUserQuestion: 1-Continue to summary, 2-Quit. Wait for response — do not proceed until the user answers.

---

## STEP 13: SUMMARY

### Step 13.0: Cleanup Planning Files

Display full absolute file paths (PRD if exists, plan, state).

Call AskUserQuestion: 1-Keep files (recommended), 2-Delete files, 3-Quit. Wait for response — do not proceed until the user answers.
- Delete → `git rm` files, commit: `docs: Remove planning files. [task_key]`

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

- Branch created (original branch stays clean unless user confirmed main)
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
