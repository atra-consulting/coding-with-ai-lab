---
name: "local:plan-and-do"
description: Plan and implement any work - freeform description - specifications (PRD), detailed plan, code, tests, review, summary
argument-hint: ["description"] [special-instructions|resume:<step>]
version: 1.0.0
last-modified: 2026-02-22
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
  - Task
---

# BPF Plan and Do Workflow

<!--
Usage: /plan-and-do ["description"] [special-instructions]
Example: /plan-and-do "Add Redis caching for sessions"
Example with instructions: /plan-and-do "Add Redis caching" "Use Spring Cache abstraction"
Variables: $ARGUMENTS (captures freeform description and optional special instructions)
Workflow: End-to-end implementation from task description to code review - creates specifications (PRD), detailed plan, implements code, runs tests, reviews code
Prerequisites: git, test execution capability
-->

## CRITICAL: NO COMMITS ON MAIN/MASTER WITHOUT EXPLICIT USER CONFIRMATION

**NEVER commit to main/master branch unless the user explicitly confirms.**

**All git add and git commit operations MUST happen on the NEW BRANCH created by this skill.**

- Step 1.6.3 writes the checkpoint file to disk but does NOT stage or commit it.
- Step 1.5 checks if currently on main/master. If so, it asks the user to confirm before proceeding on main/master or creates a new branch (default).
- The first git commit happens AFTER Step 1.5 creates and switches to the new branch.
- If user explicitly chose to stay on main/master, commits are allowed on that branch.
- This ensures the original branch stays clean (no skill-generated commits) unless user opted in.

---

## PLAN MODE CHECK

**CRITICAL: Check if currently in plan mode**

If you are currently in plan mode (indicated by system reminders about plan mode being active):
- Display error message:
  ```
  ERROR: This skill cannot run in plan mode.

  This skill performs actions and is not compatible with plan mode.
  Please exit plan mode and run this skill again.
  ```
- STOP immediately - do not execute any further steps

If NOT in plan mode:
- Continue to SKILL HEADER section

## SKILL HEADER

Display the following header immediately:

```
Plan and Do (v1.0.0, 2026-02-22)
************************************

Plan and implement any work from freeform description
```

Then continue to the next section.

---

# Plan and Do

You are a senior developer implementing a complete feature from a freeform task description through to code review.

**Task input (freeform description) and optional special instructions**: $ARGUMENTS

## Your Writing Style

As short & brief as possible, short sentences, simple words non-native speakers understand, and no passive voice. Sentence fragments preferred over full sentences.

---

## CRITICAL: HOW TO ASK THE USER FOR DECISIONS

Do NOT use AskUserQuestion. It has a known bug that auto-resolves with empty data in long skills.

**Pattern for Numbered Choices:**

Output:
```
Type a number to choose:
  1 - [option]
  2 - [option]
  3 - [option]
```

STOP. Wait for user to type a number.

After receiving the user's response:
- "1" or "[keyword]" → [action]
- "2" or "[keyword]" → [action]
- "3" or "[keyword]" → [action]
- Anything else → Output the same options again and STOP

**Pattern for Freeform Input:**

Output: "[Your question here]"

STOP. Wait for user response.

---

## AGENT DISCOVERY

Read the project's CLAUDE.md (the one in the project root, not this skill file) and look for an `## Agents` section.

**If `## Agents` section found:**

1. Parse markdown tables to extract agent names and purposes
2. Categorize by name pattern:
   - Names containing `-coder` or `designer` -> `coding_agents`
   - Names containing `-reviewer` -> `review_agents`
3. Display discovered agents:
   ```
   Agents discovered from CLAUDE.md:
     Coding: [list of coding agent names]
     Review: [list of reviewer agent names]
   ```
4. Set `agents_available = true`

**If no `## Agents` section found or CLAUDE.md missing:**

- Display: "No agents found in project CLAUDE.md. Running in direct mode."
- Set `agents_available = false`

Continue to PARAMETER PARSING.

---

## PARAMETER PARSING

First, check if $ARGUMENTS contains the keyword "help" or "doctor":

**If $ARGUMENTS contains "help":**
- Display the following information and STOP (do not execute normal workflow):
  ```
  BPF Plan and Do Skill - Help

  Purpose: Plan and implement any work from freeform description - specifications (PRD), detailed plan, code, tests, review, summary

  Usage:
    /plan-and-do "description of work"        # Freeform task
    /plan-and-do                               # Interactive (asks what to do)
    /plan-and-do <input> "<special-instructions>"
    /plan-and-do <input> resume:<step>
    /plan-and-do help
    /plan-and-do doctor
    /plan-and-do dryrun

  Input Modes:
    Freeform:       "Add Redis caching"                         -> REDIS-CACHING
    Empty:          (asks interactively)                        -> USER-CHOSEN-NAME

  File Naming:
    All files use the task_key (derived from description):
    - PRD-[task_key].md
    - PLAN-[task_key].md
    - TODOS-[task_key].md
    - REVIEW-[task_key].md

  Examples:
    /plan-and-do "Add Redis caching for sessions"
    /plan-and-do "Add Redis caching" "Use Spring Cache abstraction"
    /plan-and-do "Fix login button" resume:6

  Prerequisites:
    - git command available (required)
    - Working in a git repository (required)
    - Test execution capability (required)

  Features:
    - Freeform mode: accepts any task description
    - Agent discovery: uses project agents if defined in CLAUDE.md
    - Optionally generates specifications (PRD)
    - Creates detailed plan with test cases
    - Implements code changes with tests
    - Runs automated tests (with auto-fix capability)
    - Performs local code review using /review
    - Checkpoint persistence (quit/resume at any checkpoint)

  Agent Support:
    If the project CLAUDE.md defines an ## Agents section:
    - Coding agents (be-coder, fe-coder, db-coder, ui-designer) implement tasks
    - Reviewer agents (be-reviewer, fe-reviewer, db-reviewer, ui-reviewer) review code
    - Independent agents launch in parallel for speed
    If no agents defined: skill does all work directly (original behavior)

  File Locations:
    - Specifications (PRD) files: [docs]/prds/PRD-[task_key].md
    - Detailed plan files: [docs]/plans/PLAN-[task_key].md
    - Checkpoint files: [docs]/todos/TODOS-[task_key].md
    - Uses existing 'doc' or 'docs' folder, or creates 'docs' if neither exists
    - All files committed to git automatically
    - Planning files kept by default (option to delete)

  Workflow Steps:
    1. Task Analysis & Branch Setup
    1.8. Specifications (PRD) Decision (create or skip to detailed plan)
    2. Specifications (PRD) Creation (optional, brief, high-level)
    3. Detailed Plan (with test cases)
    4. Implementation
    5. Testing (with auto-fix)
    6. Code Review (local, via /review)
    6.5. Post-Review Testing (automated or manual)
    7. Documentation Updates (CLAUDE.md, specs, requirements)
    8. Summary (files changed, commits, test results)

  Resume Capability:
    Automatic checkpoint persistence:
    - Quit at any checkpoint with (Q)uit option
    - Progress saved to [docs]/todos/TODOS-[task_key].md
    - Restart with same input to resume from last checkpoint
    - Choose (R)esume, (S)tart fresh, or (Q)uit

    Manual resume (skip to specific step):
    - resume:6 - Skip to Step 6 (Code Review)
    - resume:6.5 - Skip to Step 6.5 (Post-Review Testing)
    - resume:7 - Skip to Step 7 (Documentation Updates)
    - resume:8 - Skip to Step 8 (Summary)
    - Validates required artifacts exist before resuming
    - Use for testing fixes or recovering from failures

  Integrations:
    - git (required): Branch management, commits
    - review (required): Code review
    - Task tool (optional): Agent delegation
  ```

**If $ARGUMENTS contains "doctor":**
- Perform the following health checks and STOP (do not execute normal workflow):

  1. Tool Check using Bash:
     ```
     Checking required tools...
     ```
     - Check git: `git --version`
       - If found: Report version
       - If not found: Report "git not installed (CRITICAL)"

  2. Repository Check using git:
     ```
     Checking git repository...
     ```
     - Check if in git repository: `git rev-parse --git-dir`
       - If in repo: Report "In git repository"
       - If not in repo: Report "Not in a git repository (CRITICAL)"
     - Check current branch: `git branch --show-current`
       - If successful: Report current branch name
       - If on main/master: Report "Currently on main branch (should be on feature branch)"
       - If failed: Report "Cannot determine current branch"

  3. Agent Discovery Check:
     ```
     Checking agent availability...
     ```
     - Read project CLAUDE.md for ## Agents section
       - If found: List discovered agents
       - If not found: Report "No agents in project CLAUDE.md (skill runs in direct mode)"

  4. Test Command Check:
     ```
     Checking for test command...
     ```
     - Read CLAUDE.md for test command
       - If found: Report test command
       - If not found: Report "No test command found in CLAUDE.md (will ask during execution)"

  5. Overall Status Summary:
     ```

     Overall Status: [SUCCESS / FAILED]
     ```
     - SUCCESS: git available and in git repository
     - FAILED: git missing or not in git repository

**If $ARGUMENTS contains none of the above keywords:**
- Continue to checkpoint detection

### Step 0.1: Check for Existing Checkpoint

After detecting input mode (before resume mode check):

1. Determine task_key from input:

   - **Path A - Freeform text** (non-empty):
     - Store the text as `user_description`
     - Repeat understanding back to user in plain text
     - Extract UPPERCASE task name (2-4 words, hyphenated)
       - Example: "Add Redis caching" -> "ADD-REDIS-CACHING"
     - Output:
       ```
       My understanding: [brief summary]
       Suggested task key: [TASK-KEY]

       Type a number to choose:
         1 - Approve and continue
         2 - Change task key
         3 - Clarify understanding
       ```
       STOP. Wait for user to type a number.

       After receiving the user's response:
       - "1" or "approve"/"yes"/"ok" → `task_key` = suggested name, continue
       - "2" or "change"/"rename" → Output: "Type your preferred task key:" then STOP. Wait for response. Use provided name.
       - "3" or "clarify" → Output: "What should I change?" then STOP. Wait for response. Re-analyze.
       - Anything else → Output the same options again and STOP
     - `branch_prefix` = lowercase task_key
     - `input_mode` = "freeform"

   - **Path B - Empty** (no arguments):
     - Output: "What would you like to implement?"
     - STOP. Wait for user response.
     - Follow Path A flow with user's response
     - `input_mode` = "freeform"

2. Check for checkpoint file:
   ```bash
   # Check both doc and docs folders
   test -f doc/todos/TODOS-[task_key].md && echo "doc" || (test -f docs/todos/TODOS-[task_key].md && echo "docs" || echo "none")
   ```

3. **If checkpoint file exists:**
   - Read checkpoint file
   - Extract current step and status

   **If status = PAUSED:**
   - Output:
     ```
     Found saved progress for [task_key]

     Last checkpoint: Step [X.Y]
     Completed: [list of completed checkpoints]

     Type a number to choose:
       1 - Resume from checkpoint
       2 - Start fresh
       3 - Quit
     ```
     STOP. Wait for user to type a number.

   **After receiving the user's response:**
   - "1" or "r"/"resume" → Load variables from checkpoint file (docs_folder, branch_name, etc.). Jump to saved step.
   - "2" or "s"/"start"/"fresh" → Delete old checkpoint file. Continue with fresh start (proceed to resume mode detection).
   - "3" or "q"/"quit" → Display: "Exiting without changes." STOP (no changes).
   - Anything else → Output the same options again and STOP.

   **If status = COMPLETED or IN_PROGRESS:**
   - Continue to resume mode detection (no prompt needed)

4. **If no checkpoint file:**
   - Continue to resume mode detection

### Resume Mode Detection

Check if $ARGUMENTS contains pattern "resume:<number>":

**If resume pattern found:**

1. Extract step number from pattern (e.g., "resume:6" -> 6)

2. Validate step number:
   - Must be between 1 and 8 (also accepts 6.5)
   - If invalid: Display error and STOP
     ```
     ERROR: Invalid step number.
     Valid steps: 1-8 (also 6.5)
     Use /plan-and-do help to see step list
     ```

3. Parse task input from $ARGUMENTS (same as Step 0.1)
   - If parsing fails: Show error and STOP

4. Display resume message:
   ```
   RESUME MODE: Skipping to Step [number]
   ```

5. Jump to STEP RESUME ROUTER section

**If no resume pattern found:**
- Continue to STEP 1.5: TOOL VALIDATION

---

## STEP 1.5: TOOL VALIDATION

Validate required tools before main workflow.

### Step 1.5.1: Check git (Critical)

```bash
git --version
```

If fails:
```
REQUIRED: git unavailable

This skill requires git for branch operations and commits.

Install: brew install git
```
Then STOP.

If succeeds:
- Show: "git available"
- Continue to STEP 1.6: DOCS FOLDER SETUP

---

## STEP 1.6: DOCS FOLDER SETUP

### Step 1.6.1: Detect Docs Folder

Check for existing docs folder:
```bash
test -d doc && echo "doc" || (test -d docs && echo "docs" || echo "none")
```

**If "doc" exists:**
- Use `doc` as docs_folder
- Display: "Using existing 'doc' folder"

**If "docs" exists (but not "doc"):**
- Use `docs` as docs_folder
- Display: "Using existing 'docs' folder"

**If neither exists:**
- Create `docs` folder:
  ```bash
  mkdir -p docs
  ```
- Use `docs` as docs_folder
- Display: "Created 'docs' folder"

### Step 1.6.2: Create Subdirectories

Create required subdirectories if they don't exist:
```bash
mkdir -p [docs_folder]/prds
mkdir -p [docs_folder]/plans
mkdir -p [docs_folder]/todos
mkdir -p [docs_folder]/reviews
```

Store paths:
- `prd_dir` = `[docs_folder]/prds`
- `plan_dir` = `[docs_folder]/plans`
- `todo_dir` = `[docs_folder]/todos`
- `review_dir` = `[docs_folder]/reviews`

### Step 1.6.3: Initialize Checkpoint Tracking

Create checkpoint file immediately:
- File path: `[todo_dir]/TODOS-[task_key].md`

**Initial content:**
```markdown
# Checkpoint: [task_key]

## Status
- Current Step: 1.6.3
- Status: IN_PROGRESS
- Started: [ISO timestamp]

## Completed Checkpoints
(none yet)

## Variables
- task_key: [task_key]
- input_mode: freeform
- branch_name: (pending)
- docs_folder: [docs_folder]
- prd_skipped: (pending)
- prd_file: (pending)
- plan_file: (pending)
```

Write file using Write tool.
Display: "Checkpoint tracking initialized: [todo_dir]/TODOS-[task_key].md"

**DO NOT git add or git commit here.** The file is written to disk only. It will be committed on the new branch after Step 1.5 creates it.

Continue to STEP 1: TASK ANALYSIS & BRANCH SETUP

---

## STEP RESUME ROUTER

**Note:** This section handles explicit `resume:<step>` argument.
Automatic resume from checkpoint file is handled in Step 0.1 (PARAMETER PARSING).

**Setup docs_folder for resume:**

Before validating artifacts, detect docs folder:
```bash
test -d doc && echo "doc" || (test -d docs && echo "docs" || echo "none")
```
- If "doc" exists: `docs_folder` = "doc"
- If "docs" exists: `docs_folder` = "docs"
- If neither: Display error "No docs folder found. Cannot resume." and STOP.

Set paths:
- `prd_dir` = `[docs_folder]/prds`
- `plan_dir` = `[docs_folder]/plans`
- `todo_dir` = `[docs_folder]/todos`
- `review_dir` = `[docs_folder]/reviews`

**Prerequisites Validation:**

Based on target step, verify required artifacts exist:

**Step 1-5: No resume needed**
```
ERROR: Cannot resume from Step [number].
Steps 1-5 create foundational artifacts.
Please run from Step 1.
```
STOP with error.

**Step 6: Code Review**
Required artifacts:
- `[prd_dir]/PRD-[task_key].md` (specifications (PRD) file - optional, may have been skipped)
- `[plan_dir]/PLAN-[task_key].md` (detailed plan file)
- Implementation commits exist (check git log for [task_key])

Validation:
```
Validating Step 6 prerequisites...
```

Check each artifact:
```bash
# Check PRD exists (optional)
test -f [prd_dir]/PRD-[task_key].md

# Check PLAN exists (required)
test -f [plan_dir]/PLAN-[task_key].md

# Check commits exist
git log --oneline --grep="[task_key]"
```

**If PLAN or commits missing:**
```
ERROR: Missing required artifacts for Step 6:
- Specifications (PRD) file: [prd_dir]/PRD-[task_key].md [FOUND/SKIPPED]
- Detailed plan file: [plan_dir]/PLAN-[task_key].md [FOUND/MISSING]
- Implementation commits: [FOUND/MISSING]

Cannot resume from Step 6.
Please run from Step 1 or ensure all artifacts exist.
```
STOP with error.

**If required artifacts found:**
- If PRD missing: Set `prd_skipped = true`, display: "Specifications (PRD) was skipped"
- Display: "All Step 6 prerequisites found"
- Continue to STEP 6: CODE REVIEW (LOCAL)

**Step 6.5: Post-Review Testing**
Required artifacts:
- All Step 6 artifacts (specifications (PRD), PLAN, commits)
- Code review completed

Validation:
```
Validating Step 6.5 prerequisites...
```

Check Step 6 artifacts first (same validation as above).

**If Step 6 artifacts missing:**
- Show same error as Step 6
- STOP with error

**If Step 6 artifacts found:**
- Display: "All Step 6.5 prerequisites found"
- Display: "Note: Assuming code review complete or issues addressed"
- Continue to STEP 6.5: POST-REVIEW TESTING

**Step 7: Documentation Updates**
Required artifacts:
- All Step 6 artifacts
- Post-review testing complete (or skipped via resume)

Validation: Same as Step 6.5.

**If artifacts found:**
- Display: "All Step 7 prerequisites found"
- Continue to STEP 7: DOCUMENTATION UPDATES

**Step 8: Summary**
Required artifacts:
- All Step 6 artifacts

Validation: Same as Step 6.5.

**If artifacts found:**
- Display: "All Step 8 prerequisites found"
- Display: "Note: Assuming prior steps complete or issues addressed"
- Continue to STEP 8: SUMMARY

---

## STEP 1: TASK ANALYSIS & BRANCH SETUP

### Step 1.1: Parse Task Input

The task_key and input_mode were already determined in Step 0.1.

Display:
```
Tracking: [task_key]
```

### Step 1.2: Set Task Details

- Set `ticket_summary` = user_description
- Set `issue_type` = nil

### Step 1.3: Generate Branch Name

Generate branch name from task input:

- Format: `[branch_prefix]-[short-kebab-case-name]`
- Example: `add-redis-caching-session-cache`

- Extract key words from description
- Convert to kebab-case
- Limit to 50 characters total

Store as `branch_name`.

### Step 1.4: Check Branch Existence on Remote

```
Checking if branch exists on remote using git...
```

Check if branch exists on remote:
```bash
git ls-remote --heads origin [branch_name]
```

**If branch exists on remote:**
- Generate random 6-digit number
- Append to branch name: `[branch_name]-[random-6-digits]`
- Update stored `branch_name`
- Display: "Branch exists on remote, using unique name: `[new-branch-name]`"

**If branch doesn't exist:**
- Continue with original branch name
- Display: "Branch name available: `[branch_name]`"

### Step 1.5: Create and Push Branch

#### Step 1.5.0: Check Current Branch

```bash
git branch --show-current
```

**If on main or master:**

Output:
```
WARNING: Currently on [main/master] branch.
Committing to [main/master] is not recommended.

Type a number to choose:
  1 - Create new branch (Recommended)
  2 - Stay on [main/master] (I know what I'm doing)
```

STOP. Wait for user to type a number.

After receiving the user's response:
- "1" or "new"/"branch" → Continue to branch creation below.
- "2" or "stay"/"main"/"master" → Set `stay_on_main = true`. Skip branch creation and push. Display: "Staying on [main/master]. Commits will go to [main/master]." Continue to Step 1.5.1.
- Anything else → Output the same options again and STOP.

**If NOT on main/master:**
- Continue to branch creation below.

#### Step 1.5.1: Create Branch (if not staying on main)

**If `stay_on_main = true`:** Skip to Step 1.5.2.

```
Creating branch using git...
```

Create branch locally:
```bash
git checkout -b [branch_name]
```

If creation fails:
- Show error: "Failed to create branch"
- Possible causes: Already exists, git error
- STOP with error

```
Pushing branch to remote using git...
```

Push to remote:
```bash
git push -u origin [branch_name]
```

If push fails:
- Show warning: "Failed to push branch to remote (no remote configured or network issue)"
- Continue without remote (local-only mode)

Verify branch created:
```bash
git branch --show-current
```

Confirm output matches `[branch_name]`.

### Step 1.5.2: Commit Checkpoint File

Now on the new branch (or main/master if user confirmed), commit the checkpoint file that was written in Step 1.6.3:
```bash
git add [todo_dir]/TODOS-[task_key].md
git commit -m "docs: Initialize checkpoint tracking for [task_key]"
```

---

## STEP 1.8: SPECIFICATIONS (PRD) DECISION

Output:
```
Type a number to choose:
  1 - Create specifications (PRD) first (Recommended for complex features)
  2 - Skip to detailed plan (Good for small changes)
```

STOP. Wait for user to type a number.

After receiving the user's response:
- "1" or "yes"/"prd" → Set `prd_skipped = false`. Continue to STEP 2: SPECIFICATIONS (PRD) CREATION.
- "2" or "skip"/"plan" → Set `prd_skipped = true`. Set `prd_file = nil`. Update checkpoint file: Add `prd_skipped: true` to Variables. Display: "Skipping specifications (PRD). Proceeding to detailed plan." Continue to STEP 3: DETAILED PLAN.
- Anything else → Output the same options again and STOP.

---

## STEP 2: SPECIFICATIONS (PRD) CREATION

**Conditional:** This step runs only when `prd_skipped = false`. If `prd_skipped = true`, skip to STEP 3.

### Step 2.1: Analyze Requirements

- Problem statement from user_description
- Requirements inferred from description
- Special instructions from $ARGUMENTS (if provided)

```
Analyzing codebase patterns using Grep and Glob...
```

Identify patterns:
- Similar features (use Grep to search for related code)
- Relevant modules (use Glob to find related files)
- Existing conventions

### Step 2.2: Generate Specifications (PRD)

**If agents_available = true and coding_agents exist:**

1. Launch relevant coding agents via Task tool to analyze codebase and provide technical input

**If agents_available = false:**
- Write specifications (PRD) directly (below structure)

Generate specifications (PRD) content (keep brief and high-level):

**Structure:**
```markdown
# PRD: [Task Summary] ([task_key])

## Source
User request: [user_description summary]

## Problem Statement
[Brief description of the problem]

## Requirements
[List of requirements inferred from description]

## Special Instructions
[If provided in $ARGUMENTS - dedicated section]

## Implementation Approach
[High-level description - no code samples]
- Describe fields and properties
- Use pseudo-code at most
- Focus on WHAT, not HOW

## Test Strategy
[High-level test approach]

## Non-Functional Requirements
[Performance, security, etc.]

## Success Criteria
[How to verify implementation is complete]
```

**Note:** Keep specifications (PRD) brief. No code samples. Detailed implementation goes in Step 3 detailed plan.

### Step 2.3: Write Specifications (PRD) to File

```
Writing specifications (PRD) to file...
```

Write content to `[prd_dir]/PRD-[task_key].md`.

Store as `prd_file` = `[prd_dir]/PRD-[task_key].md`.

### Step 2.4: Checkpoint 2 - Specifications (PRD) Approval

**Update checkpoint file:**
Edit `[todo_dir]/TODOS-[task_key].md`:
- Set Current Step: 2.4
- Add to Completed Checkpoints: "Step 1 complete - branch created"
- Update prd_file variable

Display specifications (PRD) content to user.

**Display specifications (PRD) file path prominently:**
```
Specifications (PRD) File: [absolute path to prd_file]
```

Output:
```
Specifications (PRD) ready for review.

Type a number to choose:
  1 - Continue
  2 - Edit specifications (PRD)
  3 - Quit (save progress)
```

STOP. Wait for user to type a number.

After receiving the user's response:
- "1" or "c"/"continue" → Continue to step 2.5.
- "2" or "e"/"edit" → Output: "What changes are needed?" STOP. Wait for response. Edit specifications (PRD). Return to this step.
- "3" or "q"/"quit" →
  - Update checkpoint file: Status = PAUSED
  - Commit checkpoint file:
    ```bash
    git add [todo_dir]/TODOS-[task_key].md
    git commit -m "docs: Save checkpoint at Step 2 (specifications approval). [task_key]"
    ```
  - Display: "Progress saved. Resume with: /plan-and-do [input]"
  - STOP (clean exit)
- Anything else → Output the same options again and STOP.

### Step 2.5: Commit Specifications (PRD)

```
Committing specifications (PRD) using git...
```

Stage and commit specifications (PRD) file:
```bash
git add [prd_dir]/PRD-[task_key].md
git commit -m "docs: Add specifications (PRD) for [task summary]. [task_key]"
```

Commit checkpoint file:
```bash
git add [todo_dir]/TODOS-[task_key].md
git commit -m "docs: Update checkpoint after specifications creation. [task_key]"
```

---

## STEP 3: DETAILED PLAN

**Context refresh (direct mode only):** Re-read `[prd_dir]/PRD-[task_key].md` (if it exists) using the Read tool. Use the file as the authoritative source of requirements, not conversation memory.

### Step 3.1: Determine Test Command

```
Checking for test command in project documentation...
```

**Priority 1: Check CLAUDE.md**

Read CLAUDE.md if it exists. Look for test command (keywords: "test", "testing", "npm test", "gradle test", "fvm flutter test", etc.).

**If found in CLAUDE.md:**
- Store `test_command`
- Display: "Using test command from CLAUDE.md: `[command]`"
- Continue to step 3.2 (no user confirmation needed)

**If not found in CLAUDE.md:**

Check these files in order:
1. `README.md`
2. `README.adoc`

Look for test execution instructions (same keywords).

**If found in README files:**
- Output:
  ```
  Found test command: `[command]`

  Type a number to choose:
    1 - Confirm this test command
    2 - Use a different command
  ```
  STOP. Wait for user to type a number.

  After receiving the user's response:
  - "1" or "yes"/"confirm" → Store `test_command`
  - "2" or "different"/"other" → Output: "Type your test command:" STOP. Wait for response. Store provided command as `test_command`.
  - Anything else → Output the same options again and STOP.

**If test command NOT found in any file:**
- Output: "How do you run tests in this project? Type your test command:"
- STOP. Wait for user response.
- Store provided command as `test_command`

**CRITICAL:** Do not continue until test command is confirmed.

### Step 3.2: Analyze Requirements for Tasks

**If prd_skipped = false:**

- Read specifications (PRD) directly

**If prd_skipped = true:**
- Use user_description as requirements source
- Analyze codebase patterns using Grep and Glob (same as Step 2.1 would have done)

Analyze requirements to create detailed implementation tasks:
- File creation/modification tasks (with specific code details)
- Test creation/update tasks
- Configuration changes
- Verification steps

### Step 3.3: Generate Detailed Plan

**If agents_available = true and coding_agents exist:**

1. Launch coding agents via Task tool to provide task breakdown and test recommendations

**If agents_available = false:**
- Write detailed plan directly (below structure)

Generate detailed plan content:

**Structure:**
```markdown
# Implementation Plan: [task_key]

## Test Command
`[confirmed test command]`

## Tasks

### 1. [Task Category 1]
- [ ] Create file X with specific implementation
- [ ] Add method Y with parameters A, B, C
- [ ] Import required dependencies

### 2. [Task Category 2]
- [ ] Modify file Z
- [ ] Update configuration

### 3. Test Implementation
- [ ] Create test file for feature X
- [ ] Add test cases for scenarios A, B, C
- [ ] Update existing tests

### 4. Verification
- [ ] Run test command: `[test_command]`
- [ ] Verify all tests pass
- [ ] Check code formatting

## Tests

### Unit Tests
- [ ] Test: [specific test case] - Verifies [what]
- [ ] Test: [specific test case] - Verifies [what]

### Integration Tests
- [ ] Test: [integration test case] - Verifies [what]

### Edge Cases
- [ ] Test: [edge case] - Verifies [what]
```

### Step 3.4: Write Detailed Plan to File

```
Writing detailed plan to file...
```

Write content to `[plan_dir]/PLAN-[task_key].md`.

Store as `plan_file` = `[plan_dir]/PLAN-[task_key].md`.

### Step 3.5: Checkpoint 3 - Detailed Plan Approval

**Update checkpoint file:**
Edit `[todo_dir]/TODOS-[task_key].md`:
- Set Current Step: 3.5
- Add to Completed Checkpoints: [If prd_skipped = false]: "Step 2 complete - specifications (PRD) approved" / [If prd_skipped = true]: "Step 2 skipped - no specifications (PRD)"
- Update plan_file variable

Display plan content to user.

**Display detailed plan file path prominently:**
```
Detailed Plan File: [absolute path to plan_file]
```

Output:
```
Detailed plan ready.

Type a number to choose:
  1 - Continue to implementation
  2 - Edit detailed plan
  3 - Quit (save progress)
```

STOP. Wait for user to type a number.

After receiving the user's response:
- "1" or "c"/"continue" → Continue to step 3.6.
- "2" or "e"/"edit" → Output: "What changes are needed?" STOP. Wait for response. Edit detailed plan. Return to this step.
- "3" or "q"/"quit" →
  - Update checkpoint file: Status = PAUSED
  - Commit checkpoint file:
    ```bash
    git add [todo_dir]/TODOS-[task_key].md
    git commit -m "docs: Save checkpoint at Step 3 (detailed plan approval). [task_key]"
    ```
  - Display: "Progress saved. Resume with: /plan-and-do [input]"
  - STOP (clean exit)
- Anything else → Output the same options again and STOP.

### Step 3.6: Commit Detailed Plan

```
Committing detailed plan using git...
```

Stage and commit PLAN file:
```bash
git add [plan_dir]/PLAN-[task_key].md
git commit -m "docs: Add detailed plan for [task summary]. [task_key]"
```

Commit checkpoint file:
```bash
git add [todo_dir]/TODOS-[task_key].md
git commit -m "docs: Update checkpoint after detailed plan creation. [task_key]"
```

---

## STEP 4: IMPLEMENTATION

**Context refresh (direct mode only):** Re-read `[plan_dir]/PLAN-[task_key].md` using the Read tool. If `prd_skipped = false`, also re-read `[prd_dir]/PRD-[task_key].md`. Use these files as the authoritative source of tasks and requirements, not conversation memory.

### Step 4.1: Execute Detailed Plan

**If agents_available = true and coding_agents exist:**

1. For each task group, dispatch to appropriate coding agent via Task tool:
   - Match agents by file type patterns from CLAUDE.md agent definitions
   - Independent agents launch in parallel (multiple Task calls in one message)
3. Each agent creates commits with format: `feat: [description]. [task_key]`

**If agents_available = false:**
- Implement directly (original behavior below)

**If prd_skipped = false:** Reference specifications (PRD) (including special instructions if present).
**If prd_skipped = true:** Reference user_description, plus any special instructions from $ARGUMENTS.

For each task in PLAN:

1. Read relevant files (use Read tool)
2. Make changes (use Edit/Write tools)
3. Explain what was done (brief description)
4. Consider special instructions from specifications (PRD)
5. Mark task complete in PLAN file
6. Create commit for logical change groups

**Tool explanations:**
- Before reading files: "Reading [file] to understand current implementation..."
- Before writing files: "Creating [file] with [description]..."
- Before editing files: "Updating [file] to add [feature]..."

**Commit message format:**
```
feat: [brief description]. [task_key]
```

Example:
```
feat: Add user authentication service. ADD-USER-AUTH
feat: Implement OAuth2 login flow. ADD-USER-AUTH
feat: Add authentication tests. ADD-USER-AUTH
```

### Step 4.2: Interactive Assistance

**If questions arise during implementation:**
- Explain the issue in plain text
- Propose alternatives as numbered choices
- Output:
  ```
  Type a number to choose:
    1 - [alternative A]
    2 - [alternative B]
  ```
  STOP. Wait for user to type a number.
- Continue with user's choice

**If stuck or unclear:**
- Explain the issue
- Propose alternatives as numbered choices
- STOP. Wait for user response.

---

## STEP 5: TESTING

### Step 5.1: Run Tests

```
Running tests using confirmed test command...
```

Execute test command from Step 3:
```bash
[test_command]
```

### Step 5.2: Analyze Results

Review test output:
- Count passing tests
- Count failing tests
- Identify failure causes

### Step 5.3: Handle Test Failures

**If tests fail:**

1. Show failure details to user

2. Attempt automatic fix (no user prompt):
   ```
   Attempting to fix test failures...
   ```
   - Analyze failure messages
   - Identify root causes
   - Make fixes (Edit tool)
   - Commit fixes:
     ```bash
     git add [fixed-files]
     git commit -m "fix: Fix test failures. [task_key]"
     ```

3. Re-run tests:
   ```
   Re-running tests after fixes...
   ```
   Execute `[test_command]` again

4. **If tests still fail:**
   - Show failure details
   - Output: "Tests still failing. What should I try next?"
   - STOP. Wait for user response.
   - Apply user's guidance
   - Return to step 1

**If tests pass:**
- Continue to step 5.4

### Step 5.4: Checkpoint 4 - Implementation Complete

**Update checkpoint file:**
Edit `[todo_dir]/TODOS-[task_key].md`:
- Set Current Step: 5.4
- Add to Completed Checkpoints: "Step 3-4 complete - implementation done"

**Display Checkpoint file path prominently:**
```
Checkpoint File: [absolute path to todo_dir]/TODOS-[task_key].md
```

Output:
```
All tests pass.

Type a number to choose:
  1 - Continue to code review
  2 - Make changes
  3 - Quit (save progress)
```

STOP. Wait for user to type a number.

After receiving the user's response:
- "1" or "c"/"continue"/"review" → Continue to STEP 6: CODE REVIEW.
- "2" or "m"/"changes" → Output: "What changes are needed?" STOP. Wait for response. Return to STEP 4 with user's requirements.
- "3" or "q"/"quit" →
  - Update checkpoint file: Status = PAUSED
  - Commit checkpoint file:
    ```bash
    git add [todo_dir]/TODOS-[task_key].md
    git commit -m "docs: Save checkpoint at Step 5 (implementation complete). [task_key]"
    ```
  - Display: "Progress saved. Resume with: /plan-and-do [input]"
  - STOP (clean exit)
- Anything else → Output the same options again and STOP.

---

## STEP 6: CODE REVIEW (LOCAL)

### Step 6.1: Invoke Local Code Review

```
Running local code review using /review...
```

Execute skill:
```
/review ""
```

This skill:
- Reviews changes vs main branch
- Discovers and uses reviewer agents (if available in project)
- Writes review to [docs_folder]/reviews/REVIEW-[branch_name].md

Wait for review to complete.

### Step 6.2: Analyze Review Findings

Read review file at `[review_dir]/REVIEW-*.md` to check for review findings.

**If review finds issues:**
- Display findings organized by severity:
  - Critical issues
  - Warnings
  - Suggestions

**If no issues found:**
- Report: "Code review passed with no issues"
- Continue to STEP 6.5: POST-REVIEW TESTING

### Step 6.3: Checkpoint 5 - Address Review Findings

**Update checkpoint file:**
Edit `[todo_dir]/TODOS-[task_key].md`:
- Set Current Step: 6.3
- Add to Completed Checkpoints: "Step 5 complete - tests pass"

**Display Checkpoint file path prominently:**
```
Checkpoint File: [absolute path to todo_dir]/TODOS-[task_key].md
```

**If review found issues:**

Output:
```
Code review found [count] issues.

Type a number to choose:
  1 - Fix findings
  2 - Skip to summary
  3 - Quit (save progress)
```

STOP. Wait for user to type a number.

After receiving the user's response:
- "1" or "f"/"fix" →
  - Fix issues one by one
  - Commit fixes:
    ```bash
    git add [fixed-files]
    git commit -m "fix: Address code review findings. [task_key]"
    ```
  - Re-run `/review`
  - Return to step 6.2

- "2" or "s"/"skip" →
  - Report: "User acknowledged review findings. Proceeding to post-review testing."
  - Continue to STEP 6.5: POST-REVIEW TESTING

- "3" or "q"/"quit" →
  - Update checkpoint file: Status = PAUSED
  - Commit checkpoint file:
    ```bash
    git add [todo_dir]/TODOS-[task_key].md
    git commit -m "docs: Save checkpoint at Step 6 (code review). [task_key]"
    ```
  - Display: "Progress saved. Resume with: /plan-and-do [input]"
  - STOP (clean exit)

- Anything else → Output the same options again and STOP.

---

## STEP 6.5: POST-REVIEW TESTING

After code review, verify the implementation works end-to-end.

### Step 6.5.1: Determine Testing Approach

**If agents_available = true:**

Check if any agents are suitable for testing (e.g., agents with test-related responsibilities):
1. Launch testing-capable agents via Task tool to run end-to-end verification
2. Collect test results
3. Display results to user

**If agents_available = false:**

Propose manual testing steps based on the implementation:
1. Analyze what was implemented (re-read plan file)
2. Generate a list of manual test steps the user should verify

Output:
```
Suggested manual tests:
  1. [test step based on implementation]
  2. [test step based on implementation]
  ...

Please run these tests manually.

Type a number to choose:
  1 - Tests passed, continue
  2 - Tests failed (describe issue)
  3 - Quit (save progress)
```

STOP. Wait for user to type a number.

After receiving the user's response:
- "1" or "pass"/"passed"/"done" → Continue to Step 6.5.2.
- "2" or "fail"/"failed" → Output: "Describe the failure:" STOP. Wait for response. Attempt fix. Commit fix. Return to this step.
- "3" or "q"/"quit" →
  - Update checkpoint file: Status = PAUSED
  - Commit checkpoint file:
    ```bash
    git add [todo_dir]/TODOS-[task_key].md
    git commit -m "docs: Save checkpoint at Step 6.5 (post-review testing). [task_key]"
    ```
  - Display: "Progress saved. Resume with: /plan-and-do [input]"
  - STOP (clean exit)
- Anything else → Output the same options again and STOP.

### Step 6.5.2: Checkpoint 6 - Post-Review Testing Complete

**Update checkpoint file:**
Edit `[todo_dir]/TODOS-[task_key].md`:
- Set Current Step: 6.5.2
- Add to Completed Checkpoints: "Step 6.5 complete - post-review testing passed"

Continue to STEP 7: DOCUMENTATION UPDATES.

---

## STEP 7: DOCUMENTATION UPDATES

Check if any project documentation needs updates based on implementation changes.

### Step 7.1: Scan for Documentation Updates

Check these documentation files for needed updates:
1. **CLAUDE.md** - Project conventions, commands, agent definitions
2. **docs/specs/** or **doc/specs/** - Specifications files
3. **docs/prds/** or **doc/prds/** - Requirements files

For each file that exists, compare implementation changes against current documentation content.

### Step 7.2: Propose Updates

**If agents_available = true:**
1. Launch coding agents via Task tool to analyze changes and propose documentation updates
2. Collect proposed updates from agents

**If agents_available = false:**
- Analyze directly what documentation changes are needed

**If updates needed:**

Output:
```
Documentation updates needed:
  [list of files and what needs updating]

Type a number to choose:
  1 - Apply updates
  2 - Skip documentation updates
  3 - Quit (save progress)
```

STOP. Wait for user to type a number.

After receiving the user's response:
- "1" or "apply"/"update" →
  - Apply documentation updates using Edit/Write tools
  - Commit changes:
    ```bash
    git add [updated-doc-files]
    git commit -m "docs: Update project documentation after implementation. [task_key]"
    ```
  - Continue to Step 7.3.

- "2" or "s"/"skip" →
  - Display: "Skipping documentation updates."
  - Continue to Step 7.3.

- "3" or "q"/"quit" →
  - Update checkpoint file: Status = PAUSED
  - Commit checkpoint file:
    ```bash
    git add [todo_dir]/TODOS-[task_key].md
    git commit -m "docs: Save checkpoint at Step 7 (documentation updates). [task_key]"
    ```
  - Display: "Progress saved. Resume with: /plan-and-do [input]"
  - STOP (clean exit)

- Anything else → Output the same options again and STOP.

**If no updates needed:**
- Display: "No documentation updates needed."
- Continue to Step 7.3.

### Step 7.3: Checkpoint 7 - Documentation Updates Complete

**Update checkpoint file:**
Edit `[todo_dir]/TODOS-[task_key].md`:
- Set Current Step: 7.3
- Add to Completed Checkpoints: "Step 7 complete - documentation updates done"

Continue to STEP 8: SUMMARY.

---

## STEP 8: SUMMARY

### Step 8.0: Cleanup Planning Files

Display planning files to user:
```
[If prd_skipped = false]: Specifications (PRD) File: [absolute path to prd_file]
Detailed Plan File: [absolute path to plan_file]
Checkpoint File: [absolute path to todo_dir]/TODOS-[task_key].md
```

Output:
```
Type a number to choose:
  1 - Keep planning files (Recommended)
  2 - Delete planning files
  3 - Quit
```

STOP. Wait for user to type a number.

After receiving the user's response:
- "1" or "y"/"yes"/"keep" →
  - Display: "Keeping planning files in repository"
  - Continue to Step 8.1

- "2" or "d"/"delete" →
  - Delete the files (only specifications (PRD) if it exists):
    ```bash
    [If prd_skipped = false]: git rm [prd_file]
    git rm [plan_file]
    git rm [todo_dir]/TODOS-[task_key].md
    git commit -m "docs: Remove planning files. [task_key]"
    ```
  - Display: "Planning files deleted and committed"
  - Continue to Step 8.1

- "3" or "q"/"quit" →
  - Display: "Exiting. Resume with: /plan-and-do [input] resume:8"
  - STOP (clean exit)

- Anything else → Output the same options again and STOP.

### Step 8.1: Display Summary

Show comprehensive summary:

```
=== Implementation Summary ===

Branch: [branch_name]
Task: [task_key]

Files Changed: [count]
Commits Created: [count]
Tests: [passed/failed counts]
Code Review: [issues found/no issues]
Agents Used: [list of agents used, or "None (direct mode)"]

[If prd_skipped = false]: Specifications (PRD): [prd_dir]/PRD-[task_key].md
Detailed Plan: [plan_dir]/PLAN-[task_key].md
Checkpoint: [todo_dir]/TODOS-[task_key].md

Commits:
[List commit SHAs and messages]

Next Steps:
- Review changes: git diff main...[branch_name]
- Push to remote: git push (if not already pushed)
- Create PR when ready
```

### Step 8.2: Mark Checkpoint Complete

**If checkpoint file still exists (not deleted in Step 8.0):**

Update checkpoint file:
Edit `[todo_dir]/TODOS-[task_key].md`:
- Set Status: COMPLETED
- Set Current Step: 8
- Add to Completed Checkpoints: "All steps complete"
- Add completion timestamp: [ISO timestamp]

Commit checkpoint file:
```bash
git add [todo_dir]/TODOS-[task_key].md
git commit -m "docs: Mark checkpoint complete. [task_key]"
```

Display: "Workflow complete. Checkpoint file updated."

**If checkpoint file was deleted:**
- Display: "Workflow complete."

### Step 8.3: Final Cleanup - Ensure Clean Working Directory

**CRITICAL: The skill MUST leave no uncommitted changes when it finishes.**

```
Checking for uncommitted changes...
```

Check for any uncommitted changes:
```bash
git status --porcelain
```

**If output is non-empty (uncommitted changes exist):**

1. Stage all tracked and untracked changes:
   ```bash
   git add -A
   ```

2. Commit:
   ```bash
   git commit -m "docs: Final cleanup - commit remaining changes. [task_key]"
   ```

3. Display: "Committed remaining uncommitted changes."

**If output is empty:**
- Display: "Working directory clean."

**Push all commits to remote (if remote available):**
```bash
git push 2>/dev/null || echo "No remote configured or push failed - commits are local only"
```

Display: "All commits pushed to remote." (or "Commits are local only.")

---

## Error Handling

**Task input invalid:**
- Show error: "Could not parse input"
- Display accepted formats
- STOP with error

**Branch creation fails:**
- Show error with details
- Possible causes: Branch exists, git error
- STOP with error

**Specifications (PRD) / Detailed plan not approved:**
- Allow user to edit
- Re-confirm after changes
- Continue when approved

**Implementation questions:**
- Output question as plain text
- STOP. Wait for user response.
- Continue with user's direction

**Tests fail after auto-fix:**
- Show failure details
- Output question as plain text, STOP
- Apply user's guidance and re-test

**Code review finds issues:**
- Display findings
- Ask if should fix before summary
- User decides: fix or proceed

---

## Success Criteria

- Task input parsed successfully
- Branch created and pushed (or created locally if no remote)
- Checkpoint tracking initialized (written to disk before branch, committed on new branch)
- Specifications (PRD) created (brief, high-level) and approved, or explicitly skipped by user
- Test command identified and confirmed
- Detailed plan created (with tests section) and approved
- Code implemented according to detailed plan
- Tests pass (auto-fixed if needed)
- Code review completed via /review
- Post-review testing completed (automated or manual)
- Project documentation checked and updated if needed
- Never committed to main/master without explicit user confirmation
- Planning files (specifications (PRD), detailed plan, checkpoint) handled per user preference
- Summary displayed with files changed, commits, test results
- User approval at all checkpoints
- All git commits happen on the new feature branch only (original branch stays clean)
- All checkpoint updates committed to git
- **No uncommitted changes remain when skill finishes** (enforced by Step 8.3)
- All commits pushed to remote (if available)
- Agents used when available (graceful fallback to direct mode)

---

## References

- Specifications (PRD): `[docs]/prds/PRD-[task_key].md` (created during execution)
- Detailed Plan: `[docs]/plans/PLAN-[task_key].md` (created during execution)
- Checkpoint: `[docs]/todos/TODOS-[task_key].md` (created during execution)
- Review: `[docs]/reviews/REVIEW-*.md` (created by review skill)
