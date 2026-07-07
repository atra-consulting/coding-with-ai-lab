---
name: "project:plan-and-do"
description: "End-to-end implementation workflow from idea to code review. Use for building features, implementing tasks, fixing complex bugs, or any substantial coding work. Handles planning, implementation, testing, and review automatically."
argument-hint: ["description"] [special-instructions|resume:<step>]
version: 1.11.0
last-modified: 2026-07-07
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
Example with instructions: /plan-and-do "Add Redis caching" "Use node-cache with 5 min TTL"
Variables: $ARGUMENTS (captures freeform description and optional special instructions)
Workflow: End-to-end implementation from task description to code review
Prerequisites: git, test execution capability
-->

## Branch Protection

All commits go to the NEW BRANCH created by this skill. When you start on a feature branch (not main/master) you may choose to keep it instead of creating a new one (Step 4.4) — then commits go to that branch. When the skill creates a new branch, the original branch always stays clean. State file written to disk first, committed after switching to new branch.

**PR Target Rule:** PRs always target `original_branch` — the branch that was active when the skill started. This branch is captured in Step 4.4 via `git branch --show-current` and stored in `config.original_branch`. Never default to main/master for PRs.

**Non-git mode:** If the project directory is not a git repository (e.g., ZIP download), all git operations (branch, commit, push, PR) are skipped. The skill still runs: state file, PRD, plan, implementation, and review all work without git.

**Review scope:** Code review (Step 10) compares against `original_head` — the starting branch's commit captured at Step 4.4 — not main/master.

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
Plan and Do (v1.11.0, 2026-07-07)
************************************

Plan and implement any work from freeform description
```

---

# Plan and Do

**CRITICAL — MANDATORY WORKFLOW. NO SHORTCUTS.**
You MUST execute every numbered step (1–13) in strict order. No skipping. No combining. No "just doing it" because the task looks simple. Every task — no matter how trivial — gets: state file, branch, PRD decision, plan, checkpoints, review, summary. The user relies on checkpoints to stay in control. Skipping steps breaks the skill. Do NOT write any implementation code before Step 8. If you feel tempted to skip ahead, STOP and follow the next step instead.

**Questions are tasks, not investigations.** Even when the input is phrased as a question ("Why doesn't X work?", "Is Y broken?"), treat it as a task to investigate and fix through the full workflow. Do NOT answer it directly. Do NOT start reading source code, searching for patterns, querying logs, or analyzing the problem before Step 8 (Implementation). Parameter parsing, state setup, branch creation, planning, and plan approval come first — always.

**CHECKPOINT RULE: NEVER auto-continue past a Standard Checkpoint.** You MUST call the `AskUserQuestion` tool and WAIT for the user's response at every Standard Checkpoint. The user must explicitly choose "Continue" before you proceed. No exceptions.

**A step prompts the user ONLY if its body explicitly calls AskUserQuestion.** Steps labeled with phrases like "Auto-Advance", "Advance to …", or marked "NOT a user checkpoint" are pure transitions — never call AskUserQuestion on them. When a step body says "Do NOT prompt", that wins over any word in the heading.

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

**CRITICAL — ALWAYS call the `AskUserQuestion` tool for every user prompt.** Every decision, confirmation, and choice in this skill is an `AskUserQuestion` tool invocation — never prose, never a shell prompt, never a wait-for-next-message.

This rule overrides any past guidance. Previous advice to use a home-made terminal input mechanism (because of a long-skill bug) is **revoked**. The bug is no longer a concern. Call `AskUserQuestion`.

If tempted to "just print the question and wait" for the user's next message, **STOP** and call `AskUserQuestion` instead.

**Numbered choices:** Pass the question text as the `question` parameter of `AskUserQuestion`, with the numbered options in `options`.

**Freeform input:** Pass the question as the `question` parameter of `AskUserQuestion`; the user can pick "Other" to type a freeform answer.

### Forbidden Input Patterns

Never do any of these — each is a bug:

- Printing a question as text and waiting for the user's next message. → Call `AskUserQuestion` instead.
- `Bash` with `read -p`, piped `echo`, or any interactive stdin pattern. → Call `AskUserQuestion` instead.
- Soft phrasing like "let me know", "what do you think?", or "please confirm" without a tool call. → Call `AskUserQuestion` instead.
- Treating a mid-turn user correction as an implicit answer to an unasked question. → Call `AskUserQuestion` with an explicit question instead.
- Assuming the user's silence means approval. → Call `AskUserQuestion` and wait.

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

At each checkpoint, **call the `AskUserQuestion` tool** with three choices:
- Continue → proceed to next step
- Edit → call the `AskUserQuestion` tool again to ask what changes are needed, apply them, return to this checkpoint
- Quit → execute Quit Pattern above

When asking for approval, also display the full absolute path of every file that was created or changed since the last checkpoint.

---

## AGENT DISCOVERY

Read project's CLAUDE.md for `## Agents` section.

**If found:** Parse each row's `name` and classify. Rules are **order-sensitive** — stop at the first match:

0. Name starts with `python-`, `shell-`, or `skill-` → tooling agent (general, not CRM domain). Classify by suffix:
   - ends with `-reviewer` → `tooling_review_agents` (e.g., `python-reviewer`, `shell-reviewer`, `skill-reviewer`)
   - else (ends with `-coder`) → `tooling_coding_agents` (e.g., `python-coder`, `shell-coder`, `skill-coder`)
   Dispatch tooling agents ONLY when the changed files are tooling files (`.py`, `.sh`/`.bash`, or files under `.claude/`). Never dispatch them for CRM domain files.
1. Contains `-test-coder` → `test_coding_agents` (e.g., `be-test-coder`, `fe-test-coder`)
2. Contains `-test-reviewer` → `test_review_agents` (e.g., `be-test-reviewer`, `fe-test-reviewer`)
3. Contains `-test-runner` or ends with `-tester` → `test_runner_agents` (e.g., `be-test-runner`, `fe-test-runner`)
4. Ends with `-writer` or `-analyst` → `writer_agents` (e.g., `ba-writer`)
5. Ends with `-coder` or `-designer` → `coding_agents` (e.g., `be-coder`, `fe-coder`, `ui-designer`)
6. Ends with `-reviewer` → `review_agents` (e.g., `be-reviewer`, `fe-reviewer`)
7. Anything else (e.g., `admin`) → skip as utility

The order matters: `be-test-coder` must hit rule 1, NOT rule 5. Always check for `-test-` first. Rule 0 runs before all others.

Display all eight lists in one block (six standard plus the two tooling lists), then set `agents_available = true` if any list is non-empty.

**If not found:** Display: "No agents found. Running in direct mode." Set `agents_available = false`.

## DISPATCH NARRATION RULE

**Before EVERY `Task` tool call**, output ONE line:
```
→ Launching <agent_name>: <one-sentence purpose>
```

**When dispatching multiple agents in parallel**, output one line per agent BEFORE the parallel batch:
```
→ Launching be-reviewer, fe-reviewer, db-reviewer in parallel: review phase 1 output.
```

This keeps the user informed about which agents do what work, without breaking the parallel execution.

## REVIEWER SCOPE FILTER

When launching `review_agents` (Steps 6.2, 8.1, 11.1), do NOT launch every reviewer every time. Filter by domain match against the work being reviewed:

- Files under `backend/` or backend keywords (route, service, middleware, schema) → include `be-reviewer`
- Files under `frontend/` or frontend keywords (component, template, route, form) → include `fe-reviewer`
- Schema/SQL/Drizzle/migration changes → include `db-reviewer`
- Visual/CSS/SCSS/template changes → include `ui-reviewer`
- PRDs, plans, or pure spec text → include `ba-reviewer`
- `**/*.py` changed → include `python-reviewer`
- `**/*.sh` or `**/*.bash` changed → include `shell-reviewer`
- Files under `.claude/**` (skills, agents, prompts) → include `skill-reviewer`

Always include at least one reviewer. If unsure, default to `be-reviewer` and `fe-reviewer`.

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
      Call the `AskUserQuestion` tool with this list. Wait for response.

      - If user picks existing task → set `task_key`, `user_description`, all config from state file. Set `branch_prefix` = lowercase task_key, `input_mode` = "freeform". Jump to step 1.2 (state file check).
      - If user picks "Start new task" → call the `AskUserQuestion` tool with: "What would you like to implement?" Then follow Path A.

      **If no resumable files (all completed):** Fall through.

   3. **No state files or all completed:** Call the `AskUserQuestion` tool with: "What would you like to implement?" Then follow Path A.

2. Check for state file in `doc/state/` or `docs/state/`.

3. **If state file exists with status=PAUSED:** Show progress. Call the `AskUserQuestion` tool with: 1-Resume, 2-Start fresh, 3-Quit. Wait for response — do not proceed until the user answers.

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

### Step 2.1: Pull Latest Changes

**If `is_git_repo = false`:** Skip this step.

Fetch and check whether the current branch is behind its upstream:

```bash
git fetch origin 2>/dev/null
git rev-list HEAD..@{u} --count 2>/dev/null || echo "0"
```

- If the count is > 0: Display "Pulling latest changes..." then run `git pull`. If the pull fails, warn "Pull failed. Continuing with local state." Do NOT stop.
- If the count is 0 or there is no upstream tracking branch: Display "Already up-to-date."

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
    "original_head": null,
    "docs_folder": "[docs_folder]",
    "is_git_repo": true,
    "workflow_scope": null,
    "pr_prefix": null,
    "pr_exists": null,
    "pr_url": null
  },
  "discovery": {
    "agents_available": false,
    "writer_agents": [],
    "coding_agents": [],
    "review_agents": [],
    "test_coding_agents": [],
    "test_review_agents": [],
    "test_runner_agents": [],
    "tooling_coding_agents": [],
    "tooling_review_agents": [],
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

**If `is_git_repo = false`:** Skip this step entirely. `original_head` stays `null`; Step 10.1 then uses plain `/review "embedded"`. Continue to Step 5.

Get current branch → store as `original_branch`. Capture the starting commit → `original_head = git rev-parse HEAD`. Capture both BEFORE any branch creation, so `original_head` records the true starting point. (For the kept-branch path and the create-branch path, `original_head` is the same starting commit — it is captured once here, before branching.)

**If on main/master:** Display: "On [branch]. Creating new branch [branch_name]." Always create the branch. Never ask. Never allow staying on main/master. Go to **Create branch** below.

**If NOT on main/master (already on a feature branch):** Display: "You are on branch `[original_branch]`. This looks like existing work." Call the `AskUserQuestion` tool with: 1-Keep this branch (recommended), 2-Create new branch, 3-Quit. Wait for response.
- Keep → set `branch_name = original_branch`. Skip branch creation. Go to Step 4.4b.
- Create new → continue to **Create branch** below.
- Quit → execute Quit Pattern.

**Create branch:**
```bash
git checkout -b [branch_name]
git push -u origin [branch_name]
```
If push fails: warn, continue local-only.

### Step 4.4b: Check for Existing PR

**If `is_git_repo = false`:** Skip this step. Continue to Step 4.5.

Detect an open PR for `branch_name` (cheap, keeps logic uniform for new and kept branches — a just-created branch always returns none):

```bash
gh pr list --head [branch_name] --state open --json number,title,url 2>/dev/null
```

- If a PR is found: set `pr_exists = true`, store its URL as `pr_url`, display: "Open PR found: [pr_url]".
- If none found, or `gh` is unavailable: set `pr_exists = false`, `pr_url = null`.

### Step 4.5: Commit State File

**If `is_git_repo = false`:** Skip this step.

Update state with `branch_name`, `original_branch`, `original_head`, `pr_exists`, `pr_url`, then commit:

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

**If complex:** Call the `AskUserQuestion` tool with: 1-Create specifications (PRD) first (recommended for complex features), 2-Skip to detailed plan.

- "1" → `prd_skipped = false`, continue to STEP 6
- "2" → `prd_skipped = true`, `prd_file = null`, update state: `current_step` = "5.1", `artifacts.prd_skipped = true` → STEP 7

---

## STEP 6: SPECIFICATIONS (PRD) CREATION

**Conditional:** Only when `prd_skipped = false`.

### Step 6.1: Analyze Requirements

Analyze user_description and codebase using Grep/Glob. Identify patterns, modules, conventions.

### Step 6.2: Generate Specifications (PRD)

**If agents_available:**

1. **Draft:** Launch `ba-writer` (or first `writer_agent`) via Task tool to write the PRD. If no writer agents exist, use the first `coding_agent` instead. If no coding agents exist either, write the PRD directly. Provide user_description, codebase context from Step 6.1, and the structure below. Apply the **DISPATCH NARRATION RULE**.
2. **Review:** Apply the **REVIEWER SCOPE FILTER** — for a PRD always include `ba-reviewer`, plus any domain reviewers whose area the PRD covers. Launch them in parallel via Task tool. Apply the DISPATCH NARRATION RULE. Each reviewer gets the draft PRD and checks for completeness, correctness, and feasibility from their domain perspective.
3. **Fix:** Collect all reviewer findings. Fix issues automatically — no user prompt needed. If reviewers disagree, prefer the more conservative/thorough approach.
4. **Result:** The reviewed and fixed PRD becomes the final draft for user approval.

**Otherwise:** Write directly.

Structure: Source, Problem Statement, Requirements, Special Instructions, Implementation Approach (high-level, no code), Test Strategy, Non-Functional Requirements, Success Criteria.

Keep brief. No code samples. Details go in Step 7 plan.

### Step 6.3: Write to File

Write to `[prd_dir]/PRD-[task_key].md`. Store as `prd_file`.

### Step 6.4: Checkpoint 6 — PRD Approval

Update state: `current_step` = "6.4", set `artifacts.prd_file`.

Display PRD content and full absolute file path. Call the `AskUserQuestion` tool with: 1-Continue, 2-Edit, 3-Quit. Wait for response — do not proceed until the user answers.

### Step 6.5: Commit PRD

**If `is_git_repo`:** Use a HEREDOC so the `PRD:` footer lands on its own line per CLAUDE.md.
```bash
git add [prd_dir]/PRD-[task_key].md
git commit -m "$(cat <<'EOF'
docs: Add specifications (PRD) for [task summary]. [task_key]

PRD: [prd_file relative to repo root]
EOF
)"
```

**Implementation commits in Step 8.1 must also include the `PRD: [path]` footer** when `prd_file` exists, so the commit ↔ PRD link is preserved per CLAUDE.md.

---

## STEP 7: DETAILED PLAN

**Context refresh:** Re-read PRD file (if exists) using Read tool. Use file as authoritative source.

### Step 7.1: Determine Test Command

Check in order:
1. **CLAUDE.md** — if found, use directly (no confirmation needed)
2. **README.md / README.adoc** — if found, call the `AskUserQuestion` tool with the prompt `"Found test command: [command]. Use this one?"` (1-Yes / 2-Let me type a different one). Do not run tests until the user confirms.
3. **Not found** — call the `AskUserQuestion` tool with: "How do you run tests? Type your test command:"

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

Update state: `current_step` = "7.5", set `artifacts.plan_file` and `discovery.test_command`. Set `config.workflow_scope` (and `config.pr_prefix`, when derived) only *after* the user answers — never before.

Display plan content. Display artifact paths per the ARTIFACT PATH DISPLAY RULE. **If `pr_exists = true`, also display "Open PR found: [pr_url]" so the user sees it before choosing** — `pr_exists`/`pr_url` come from Step 4.4b; do NOT re-detect here.

**Plan Approval Checkpoint — NOT a Standard Checkpoint.** Call the `AskUserQuestion` tool with these choices. Always in this order. Add "(Recommended)" after the one you recommend based on task complexity:

1. **Approve and implement** — Run implementation and tests (Steps 8-9). Stop after testing. Best for small, low-risk changes.
2. **Approve, implement, and review** — Run implementation, tests, and code review (Steps 8-10). Stop after review. Good for medium changes.
3. **If `pr_exists = false`: Approve, implement, review, and create PR** — Full workflow through PR creation (Steps 8-13). Best for complex or team-shared work.
   **If `pr_exists = true`: Approve, implement, review, and update PR** — Full workflow; the post-completion step updates the existing PR instead of creating one.
4. **If `prd_skipped = true`: Create PRD first** — Discard the current draft plan, create a PRD (Step 6), then regenerate the plan (Step 7) with the PRD as input. **Omit this option entirely when `prd_skipped = false`.**
5. **Edit** — Request changes to the plan.
6. **Quit** — Execute Quit Pattern.

**Numbering:** When `prd_skipped = false`, omit option 4 entirely and present exactly five options with no gap — renumber so Edit = 4 and Quit = 5. When `prd_skipped = true`, present all six as numbered above. Always label each option by name as well as number so the mapping below stays unambiguous.

Store the user's choice in state as `config.workflow_scope`:
- Choice 1 → `"implement"`
- Choice 2 → `"implement-review"`
- Choice 3 → `"full"`, then **derive the PR prefix** (see below)
- "Create PRD first" (only when `prd_skipped = true`) → set `prd_skipped = false`, update state (`artifacts.prd_skipped = false`). **If `is_git_repo`:** the draft plan was written in Step 7.4 but is only committed in Step 7.6, so it may be untracked — remove it safely: if `git ls-files --error-unmatch [plan_file]` succeeds (tracked), run `git rm [plan_file] && git commit -m "docs: Remove draft plan, creating PRD first. [task_key]"`; otherwise just `rm [plan_file]` (nothing to commit). Then go to STEP 6. After Step 6 completes, continue to Step 7.1 (re-run plan generation with the PRD as input) and return here.
- Edit → call the `AskUserQuestion` tool to ask what changes are needed, apply them, re-display the plan, return to this checkpoint.
- Quit → execute Quit Pattern.

**Auto-derive PR title prefix (Choice 3 only):** This lets the full workflow run uninterrupted through PR creation/update. Always derive — for both new and existing PRs — so the PR title is never malformed. Never ask the user.
1. Run: `git log [original_branch]..HEAD --oneline`
2. Count commits starting with `feat:`, `fix:`, `chore:`, or `docs:` (case-sensitive).
3. Majority prefix wins. Map `docs:` → `chore:`.
4. If no commits yet (e.g. a kept branch where the range is empty), all `docs:`, or no clear majority (including ties): default to `feat:`.

Display: "PR prefix: [pr_prefix] (derived from commit history)." Store as `config.pr_prefix`.

### Step 7.6: Commit Plan

**If `is_git_repo`:** Append `PRD: [prd_file]` footer when `prd_file` exists.
```bash
git add [plan_dir]/PLAN-[task_key].md
git commit -m "$(cat <<'EOF'
docs: Add detailed plan for [task summary]. [task_key]

PRD: [prd_file relative to repo root, or omit footer if no PRD]
EOF
)"
```

---

## STEP 8: IMPLEMENTATION

**Context refresh:** Re-read plan file (and PRD if exists). Use files as authoritative source.

### Step 8.1: Execute Plan

**If agents_available:** Dispatch task groups to coding agents via Task tool. Use this file-path → agent mapping (override only when CLAUDE.md says otherwise):

| File pattern | Agent |
|--------------|-------|
| `backend/src/routes/**`, `backend/src/services/**`, `backend/src/middleware/**`, `backend/src/app.ts`, `backend/src/utils/**` | `be-coder` |
| `backend/src/db/**`, `backend/src/config/migrate.ts`, `backend/src/config/db.ts`, `backend/src/seed/**` | `db-coder` |
| `frontend/src/app/features/**`, `frontend/src/app/core/**`, `frontend/src/app/app.*` | `fe-coder` |
| `frontend/src/styles.scss`, `*.scss`, visual/template-only changes | `ui-designer` |
| `**/*.py` | `python-coder` |
| `**/*.sh`, `**/*.bash` | `shell-coder` |
| `.claude/**` (skills, agents, prompts, settings) | `skill-coder` |
| Anything else (config, scripts, docs) | nearest match by domain, else direct mode |

Apply the **DISPATCH NARRATION RULE** before every Task call. Launch independent agents in parallel.

Each agent commits the work it produced. **If `prd_file` exists**, the commit message MUST end with `PRD: [prd_file]` per CLAUDE.md:
```
feat: [description]. [task_key]

PRD: [prd_file relative to repo root]
```
Omit the `PRD:` footer when no PRD exists.

**Phase review (agents_available only):** If the plan has multiple phases or numbered task groups, treat each group as a phase. After each phase completes:
1. Apply the **REVIEWER SCOPE FILTER** — pick only the reviewers whose domain the phase touched. Launch them in parallel via Task tool. Apply the DISPATCH NARRATION RULE.
2. Collect all reviewer findings. Fix issues automatically — no user prompt needed.
3. Commit fixes: `fix: Address phase [N] review findings. [task_key]` (with `PRD:` footer if applicable)
4. Then proceed to the next phase.

This catches issues early, before they compound across phases.

**Test authoring phase (agents_available only):** After all implementation phases are committed, launch `test_coding_agents` to write tests for the new code. One runs per scope touched:

- Backend files changed → `be-test-coder` writes Playwright API tests under `backend/src/test/`
- Frontend files changed → `fe-test-coder` writes Jasmine specs colocated with sources

Apply the **DISPATCH NARRATION RULE**. Launch in parallel when both scopes are touched. Each agent commits its test files: `test: Add tests for [description]. [task_key]` (with `PRD:` footer if applicable).

Then launch matching `test_review_agents` (`be-test-reviewer` / `fe-test-reviewer`) in parallel to review the new tests. Auto-fix findings and commit: `fix: Address test review findings. [task_key]`. No user prompt.

Skip the test authoring phase when:
- The plan explicitly marks the change as test-inappropriate (e.g., a pure docs edit)
- No `test_coding_agents` exist for the changed scope

**Otherwise:** Implement directly:

For each task in PLAN:
1. Read relevant files — narrate: "Reading [file] to understand current implementation..."
2. Make changes (Edit/Write tools) — narrate: "Updating [file] to add [feature]..."
3. Explain briefly what was done
4. Mark task complete in PLAN file
5. **If `is_git_repo`:** Commit logical change groups: `feat: [description]. [task_key]` (with `PRD:` footer if applicable)

### Step 8.2: Interactive Assistance

If questions arise: explain the issue, then call the `AskUserQuestion` tool with numbered alternatives.

---

## STEP 9: TESTING

### Step 9.1: Run Tests

**If `test_runner_agents` is non-empty:** Launch each relevant runner in parallel via Task tool. Match by scope:
- Backend files changed → `be-test-runner`
- Frontend files changed → `fe-test-runner`
- Both scopes → launch both in parallel

Apply the **DISPATCH NARRATION RULE**. Collect each runner's pass/fail report.

**Otherwise:** Execute `[test_command]` directly.

### Step 9.2: Handle Results

**If tests pass:** Continue to Step 9.3.

**If tests fail:**
1. Show failures, attempt automatic fix (no prompt)
2. Commit fixes: `fix: Fix test failures. [task_key]`
3. Re-run tests
4. If still failing: show details, call the `AskUserQuestion` tool with: "What should I try next?" Apply guidance. Retry.

### Step 9.3: Implementation Complete — Auto-Advance

**This is NOT a user checkpoint. Never call AskUserQuestion here. Auto-advance per workflow_scope.**

Update state: `current_step` = "9.3".

Display artifact paths per the ARTIFACT PATH DISPLAY RULE.

Output: "All tests pass."

The user already chose `workflow_scope` at Step 7.5 — honor it without re-asking:

- `workflow_scope == "implement"` → Skip to STEP 13 (summary). Do NOT prompt.
- `workflow_scope == "implement-review"` or `"full"` → Announce "Continuing to code review." and proceed to STEP 10. Do NOT prompt.

To make changes instead, the user can interrupt and run `/plan-and-do <key> resume:8`.

---

## STEP 10: CODE REVIEW (LOCAL)

### Step 10.1: Invoke Review

Pick the invocation by whether `original_head` is set:

```
If `original_head` is set:    /review "embedded base:[original_head]"
If `original_head` is unset:  /review "embedded"
```

Pass `original_head` (the starting branch's commit, from `config.original_head`) as the review base. This scopes the review to changes made since the skill started — not main/master. When `original_head` is unset (e.g., non-git mode), use plain `/review "embedded"` so review defaults to main/master. Never pass the literal `base:[original_head]` — substitute the SHA or drop the token.

Wait for completion.

### Step 10.2: Analyze Findings

Read `[review_dir]/REVIEW-*.md`.

**No issues:** "Code review passed." → STEP 11.
**Issues found:** Display by severity (critical, warnings, suggestions).

### Step 10.3: Checkpoint 10

Update state: `current_step` = "10.3".

Display artifact paths per the ARTIFACT PATH DISPLAY RULE.

**If no issues:** Continue without prompting.

**If issues found:**
- `workflow_scope == "full"` AND this is the first review round → Auto-fix, commit `fix: Address code review findings. [task_key]` (with `PRD:` footer if applicable), re-run `/review`, return to 10.2. No prompt.
- Second review round, OR `workflow_scope == "implement-review"`, OR the same finding survives → Call the `AskUserQuestion` tool with: 1-Fix findings, 2-Skip to summary, 3-Quit.
  - Fix → fix issues, commit, re-run `/review`, return to 10.2
  - Skip → continue

**After Checkpoint 10 resolves (no issues or user chose Skip):** If `workflow_scope == "implement-review"`, skip to STEP 13 (summary). Do not ask — the user already chose this scope at plan approval.

---

## STEP 11: POST-REVIEW TESTING

### Step 11.1: Post-Review Verification

Code review may have changed implementation or test code. Re-run the relevant runners once to confirm the suite is still green.

**If `test_runner_agents` is non-empty:** Launch the same runners as Step 9.1 (match by scope) in parallel via Task tool. Apply the **DISPATCH NARRATION RULE**.

- All pass → continue to STEP 12
- Any fail → auto-fix the smallest case, commit `fix: Restore green tests after review. [task_key]`, re-run once. If still failing, surface the report and call the `AskUserQuestion` tool with: 1-Investigate (returns to STEP 8), 2-Skip to summary, 3-Quit.

**Otherwise (no agents):** Re-run `[test_command]` directly. Same fail-handling as above.

### Step 11.2: Advance to Documentation

**This is NOT a user checkpoint. Never call AskUserQuestion here.**

Update state: `current_step` = "11.2". → STEP 12.

---

## STEP 12: DOCUMENTATION UPDATES

Reached only for `workflow_scope == "full"` — Steps 9.3 and 10.3 route the other scopes straight to Step 13. So the doc sync runs on the full path, right before the PR is opened.

This step syncs the project docs (`.claude/agents/`, `docs/specs/`, `CLAUDE.md`) with the code this run produced. It runs **before** PR creation (POST-COMPLETION PC.2).

The `update-claude-files` skill owns this sync. It scopes to the branch's changes and requires the project's agent roster.

### Step 12.1: Run the doc-sync skill

**If `agents_available` and `is_git_repo`:** Invoke the skill in embedded mode, scoped to the branch. Substitute the real SHA from `config.original_head`:
```
/update-claude-files "embedded base:[original_head]"
```
Wait for completion. The skill writes `docs/state/UPDATE-CLAUDE-FILES-RESULT.md` (gitignored). It never prompts and never blocks.

**If `is_git_repo` but NOT `agents_available`:** Skip the skill. Display:
```
No agents found — skipping doc sync.
Install the agents first: https://github.com/atra-consulting/coding-with-ai-lab/tree/main/.claude/agents
```
Continue to Step 12.3 (do not block the PR).

**If NOT `is_git_repo`:** Direct fallback — scan `CLAUDE.md` and `docs/specs/` for updates the implementation made necessary, and apply them directly (no branch diff available). Skip the result-file logic below.

### Step 12.2: Commit the result

**Only when the skill ran in Step 12.1 (`agents_available` and `is_git_repo`):**

Read `docs/state/UPDATE-CLAUDE-FILES-RESULT.md`. Act on its `status`:
- `status: updated` → Display "Applying documentation updates: [files from result]." Stage only the changed docs (`git add .claude/agents docs/specs CLAUDE.md`) and commit `docs: Update project documentation. [task_key]` (with `PRD:` footer when `prd_file` exists). Do NOT stage the result file — it is gitignored.
- `status: no-changes` → Display "No documentation updates needed." Commit nothing.
- `status: skipped-no-agents` or `status: error` → Display the note from the result file. Commit nothing. Continue — never block the PR.

### Step 12.3: Advance to Summary

**This is NOT a user checkpoint. Never call AskUserQuestion here.**

Update state: `current_step` = "12.3". → STEP 13.

---

## STEP 13: SUMMARY

### Step 13.0: Planning Files

Planning files (PRD, plan, state) stay in `[docs_folder]/` by default — they document why the change happened. Display the full absolute paths in the summary below so the user can delete manually if desired:

```
rm [prd_file] [plan_file] [state_file]
```

No prompt — the user can clean up later if they want.

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
