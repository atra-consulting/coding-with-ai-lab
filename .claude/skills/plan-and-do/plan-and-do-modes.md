# Plan and Do — Special Modes & Resume Router

Reference file for plan-and-do skill. Read and execute the matching section when help or doctor mode is detected, or when resuming from a specific step.

---

## HELP MODE

Execute when `$ARGUMENTS` contains "help". Display and STOP:

```
Plan and Do Skill - Help

Purpose: End-to-end implementation workflow from idea to code review

Usage:
  /plan-and-do "description of work"        # Freeform task
  /plan-and-do                               # Interactive (asks what to do)
  /plan-and-do <input> "<special-instructions>"
  /plan-and-do <input> resume:<step>
  /plan-and-do help
  /plan-and-do doctor

Input Modes:
  Freeform:       "Add Redis caching"                         -> REDIS-CACHING
  Empty:          (scans for resumable tasks, then asks)      -> USER-CHOSEN-NAME

File Naming:
  All files use the task_key (derived from description):
  - PRD-[task_key].md
  - PLAN-[task_key].md
  - STATE-[task_key].json
  - REVIEW-[task_key].md

Examples:
  /plan-and-do "Add Redis caching for sessions"
  /plan-and-do "Add Redis caching" "Use Spring Cache abstraction"
  /plan-and-do "Fix login button" resume:10

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
  - PR creation and merge workflow

Agent Support:
  If the project CLAUDE.md defines an ## Agents section:
  - Coding agents (be-coder, fe-coder, db-coder, ui-designer) implement tasks
  - Reviewer agents (be-reviewer, fe-reviewer, db-reviewer, ui-reviewer) review code
  - Independent agents launch in parallel for speed
  If no agents defined: skill does all work directly (original behavior)

File Locations:
  - Specifications (PRD) files: [docs]/prds/PRD-[task_key].md
  - Detailed plan files: [docs]/plans/PLAN-[task_key].md
  - State files: [docs]/state/STATE-[task_key].json
  - Uses existing 'doc' or 'docs' folder, or creates 'docs' if neither exists
  - All files committed to git automatically
  - Planning files kept by default (option to delete)

Workflow Steps:
  1-3. Setup (checkpoint, tools, docs folder)
  4. Task Analysis & Branch Setup
  5. Specifications (PRD) Decision
  6. Specifications (PRD) Creation (optional)
  7. Detailed Plan (with test cases)
  8. Implementation
  9. Testing (with auto-fix)
  10. Code Review (local, via /review)
  11. Post-Review Testing
  12. Documentation Updates
  13. Summary, PR Creation, Merge

Resume Capability:
  Automatic state persistence (JSON):
  - Quit at any checkpoint with (Q)uit option
  - Progress saved to [docs]/state/STATE-[task_key].json
  - All runtime variables persisted (agents, test command, etc.)
  - Restart with same input to resume from last checkpoint
  - Choose (R)esume, (S)tart fresh, or (Q)uit

  No-argument scan:
  - Running /plan-and-do with no arguments scans for paused
    or in-progress state files
  - Shows numbered list of resumable tasks
  - Option to start a new task instead

  Manual resume (skip to specific step):
  - resume:10 - Skip to Step 10 (Code Review)
  - resume:11 - Skip to Step 11 (Post-Review Testing)
  - resume:12 - Skip to Step 12 (Documentation Updates)
  - resume:13 - Skip to Step 13 (Summary)
  - Validates required artifacts exist before resuming
  - Use for testing fixes or recovering from failures

Integrations:
  - git (required): Branch management, commits
  - gh CLI (optional): PR creation and merge
  - review (required): Code review
  - Task tool (optional): Agent delegation
```

---

## DOCTOR MODE

Execute when `$ARGUMENTS` contains "doctor". Perform health checks and STOP:

1. Tool Check using Bash:
   ```
   Checking required tools...
   ```
   - Check git: `git --version`
     - If found: Report version
     - If not found: Report "git not installed (CRITICAL)"
   - Check gh: `gh --version`
     - If found: Report version
     - If not found: Report "gh CLI not installed (optional, needed for PR creation)"

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

---

## STEP RESUME ROUTER

This section handles explicit `resume:<step>` argument.
Automatic resume from state file is handled in Step 1 (PARAMETER PARSING).

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
- `state_dir` = `[docs_folder]/state`
- `review_dir` = `[docs_folder]/reviews`

**Prerequisites Validation:**

Based on target step, verify required artifacts exist:

**Step 1-9: No resume needed**
```
ERROR: Cannot resume from Step [number].
Steps 1-9 create foundational artifacts.
Please run from Step 1.
```
STOP with error.

**Step 10: Code Review**
Required artifacts:
- `[prd_dir]/PRD-[task_key].md` (specifications (PRD) file - optional, may have been skipped)
- `[plan_dir]/PLAN-[task_key].md` (detailed plan file)
- Implementation commits exist (check git log for [task_key])

Validation:
```
Validating Step 10 prerequisites...
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
ERROR: Missing required artifacts for Step 10:
- Specifications (PRD) file: [prd_dir]/PRD-[task_key].md [FOUND/SKIPPED]
- Detailed plan file: [plan_dir]/PLAN-[task_key].md [FOUND/MISSING]
- Implementation commits: [FOUND/MISSING]

Cannot resume from Step 10.
Please run from Step 1 or ensure all artifacts exist.
```
STOP with error.

**If required artifacts found:**
- If PRD missing: Set `prd_skipped = true`, display: "Specifications (PRD) was skipped"
- Display: "All Step 10 prerequisites found"
- Continue to STEP 10: CODE REVIEW (LOCAL)

**Step 11: Post-Review Testing**
Required artifacts:
- All Step 10 artifacts (specifications (PRD), PLAN, commits)
- Code review completed

Validation:
```
Validating Step 11 prerequisites...
```

Check Step 10 artifacts first (same validation as above).

**If Step 10 artifacts missing:**
- Show same error as Step 10
- STOP with error

**If Step 10 artifacts found:**
- Display: "All Step 11 prerequisites found"
- Display: "Note: Assuming code review complete or issues addressed"
- Continue to STEP 11: POST-REVIEW TESTING

**Step 12: Documentation Updates**
Required artifacts:
- All Step 10 artifacts
- Post-review testing complete (or skipped via resume)

Validation: Same as Step 11.

**If artifacts found:**
- Display: "All Step 12 prerequisites found"
- Continue to STEP 12: DOCUMENTATION UPDATES

**Step 13: Summary**
Required artifacts:
- All Step 10 artifacts

Validation: Same as Step 11.

**If artifacts found:**
- Display: "All Step 13 prerequisites found"
- Display: "Note: Assuming prior steps complete or issues addressed"
- Continue to STEP 13: SUMMARY

---

## POST-COMPLETION WORKFLOW

Execute after Step 13.2 (Mark State Complete). Handles cleanup, push, PR, merge, and branch switch.

### PC.1: Ensure Clean Working Directory

```bash
git status --porcelain
```

**If uncommitted changes exist:**
1. Stage tracked modified files: `git add -u`
2. Also stage any skill-created files (PRD, PLAN, STATE, REVIEW)
3. Commit: `git commit -m "docs: Final cleanup - commit remaining changes. [task_key]"`
4. Display: "Committed remaining uncommitted changes."

**If clean:** Display: "Working directory clean."

### PC.2: Push Confirmation

Use AskUserQuestion: 1-Push commits to remote, 2-Skip push (local only).

- Push:
  ```bash
  git push 2>/dev/null || echo "No remote configured or push failed - commits are local only"
  ```

### PC.3: Create Pull Request

Use AskUserQuestion: 1-Create pull request, 2-Skip PR (done).

- Create:
  Push if not already pushed:
  ```bash
  git push -u origin [branch_name] 2>/dev/null
  ```
  **CRITICAL:** The PR MUST target `original_branch` — the branch that was active when the skill started (stored in state file `config.original_branch`). Never default to main/master. Re-read the state file if `original_branch` is unknown.

  Create PR using gh CLI. Do NOT add a test plan section — only include the summary.
  ```bash
  gh pr create --base [original_branch] --title "[brief title from task_key]" --body "$(cat <<'EOF'
  ## Summary
  [Brief summary of changes made]

  🤖 Generated with [Claude Code](https://claude.com/claude-code)
  EOF
  )"
  ```
  Display PR URL. Continue to PC.4.

- Skip → STOP. Workflow complete.

### PC.4: Merge Pull Request

Use AskUserQuestion: 1-Merge PR, 2-Skip merge (done).

- Merge:
  ```bash
  gh pr merge --merge
  ```
  Set `pr_merged = true`. Continue to PC.5.

- Skip → STOP. Workflow complete.

### PC.5: Switch Back to Original Branch

**Only if `pr_merged = true`.**

```bash
git checkout [original_branch]
git pull
```

Display: "Switched to `[original_branch]` and pulled latest changes."

STOP — workflow complete.
