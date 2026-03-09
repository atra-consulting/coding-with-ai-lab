---
name: "project:review"
description: "Local code review with multi-round review & fix cycle. Use for reviewing code, checking changes, getting feedback on a branch, or before creating a PR."
argument-hint: (optional special instructions)
version: 1.2.0
last-modified: 2026-03-08
tools:
  - read_file
  - write_file
  - replace
  - run_shell_command
  - glob
  - grep_search
  - generalist
  - codebase_investigator
  - cli_help
---

# Review Skill

You are executing the **review** skill, which provides local code review with a multi-round review & fix cycle on a feature branch vs main.

## Writing Style

Short and brief. Short sentences. Simple words non-native speakers understand. No passive voice. Use sentence fragments.

## FILE PATH DISPLAY RULE

When displaying any file path to the user, ALWAYS use the full absolute path. Get the project root with `pwd` and prepend it to relative paths. Example: `/Users/dev/project/docs/reviews/REVIEW-add-feature.md` instead of `docs/reviews/REVIEW-add-feature.md`. This lets users Command-click paths in the terminal to open them.

## CRITICAL: HOW TO ASK THE USER FOR DECISIONS

Do NOT use AskUserQuestion. It has a known bug that auto-resolves with empty data in long skills.

**Pattern for Numbered Choices:**
```
Type a number to choose:
  1 - [option]
  2 - [option]
```
STOP. Wait for user to type a number. If invalid input → show options again and STOP.

**Pattern for Freeform Input:**
Output question. STOP. Wait for user response.

## User Autonomy

Complete all review work autonomously without mid-execution prompts. Interrupting to ask "Should I continue?" or "Should I review the next file?" breaks flow and wastes time. Only prompt when a genuine decision is needed to proceed — not for status checks or confirmations.

## ARGUMENTS HANDLING

Skill receives: `request`

Parse arguments to determine mode:
- **Empty or whitespace** -> Local review mode (default)
- **"help"** -> Help mode (show usage and exit)
- **"doctor"** -> Doctor mode (run health checks and exit)
- **"dryrun" or "dry-run" or "dry_run"** -> Dry-run mode
- **"embedded"** -> Embedded mode (called from plan-and-do, skip header/plan-check/confirmation)
- **Other text** -> Treat as special instructions for the review

## PHASE 0: PLAN MODE CHECK & HEADER

**If embedded mode:** Skip plan mode check, header, and task understanding confirmation. Jump directly to PHASE 1.5: TOOL VALIDATION.

**If NOT embedded mode:**

Check if Gemini CLI is in plan mode.

If in plan mode, output:
```
Plan mode detected. This skill cannot run in plan mode.

Exit plan mode first, then run:
  /review
```
Then STOP immediately.

If NOT in plan mode, display header:

```
Code Review (v1.2.0, 2026-03-07)
****************************************

Local code review - multi-round review & fix cycle
```

Then continue to PHASE 1.

## PHASE 1: PARAMETER PARSING & MODE DETECTION

Parse `request` to determine execution mode.

### Step 1.1: Check for Special Modes

Check if `request` matches:
- "help" -> Execute Help Mode and STOP
- "doctor" -> Execute Doctor Mode and STOP
- "dryrun" or "dry-run" or "dry_run" (case-insensitive) -> Set `dry_run_mode = true`, continue
- Other non-empty text -> Store as `special_instructions`, continue

### Step 1.2: Announce Mode

Output:
```
Local Review Mode - analyzing local changes
```

If special_instructions set:
```
Special instructions: [special_instructions]
```

Proceed to PHASE 1.3: TASK UNDERSTANDING CONFIRMATION.

---

## PHASE 1.3: TASK UNDERSTANDING CONFIRMATION

**If special_instructions are set (non-empty, non-default mode):**

Repeat back your understanding of the review focus to the user:

Output:
```
My understanding: Review local changes with focus on [brief summary of special_instructions].

Type a number to choose:
  1 - Correct, proceed
  2 - Clarify instructions
```

STOP. Wait for user to type a number.

After receiving the user's response:
- "1" or "ok"/"yes"/"correct" → Continue to PHASE 1.5.
- "2" or "clarify"/"change" → Output: "What should I change?" STOP. Wait for response. Update `special_instructions`. Return to this step.
- Anything else → Output the same options again and STOP.

**If no special_instructions (default review mode):**
- Skip confirmation (nothing custom to confirm).
- Continue to PHASE 1.5.

---

## PHASE 1.5: TOOL VALIDATION

Validate required tools before main workflow.

### Step 1.5.1: Check git (Critical)

```bash
run_shell_command "git --version"
```

If fails:
```
REQUIRED: git unavailable

This skill requires git for diff analysis.

Install: brew install git
```
Then STOP.

If succeeds:
- Show: "git available"
- Continue to PHASE 1.7: AGENT DISCOVERY

---

## PHASE 1.7: AGENT DISCOVERY

Read the project's GEMINI.md (the one in the project root, not this skill file) and look for an `## Agents` section.

**If `## Agents` section found:**

1. Parse markdown tables to extract agent names and purposes
2. Extract reviewer agents (names containing `-reviewer`)
3. Extract coder agents (names containing `-coder`)
4. Extract designer agents (names containing `ui-designer` or `-designer`)
5. Store `all_reviewers`, `all_coders`, `all_designers`
6. Set `review_agents_available = true` if reviewers found
7. Set `fix_agents_available = true` if coders OR designers found
8. Display: "Review agents: [list of reviewer agent names]"
9. Display: "Fix agents: [list of coder and designer agent names]"

**If no `## Agents` section found or GEMINI.md missing:**

- Set `review_agents_available = false`
- Set `fix_agents_available = false`
- Display: "No agents found. Using built-in review checklist."

Continue to PHASE 2: VALIDATION & SETUP.

---

## Context Recovery

If you lose track of variables (e.g., after context compression), re-read the state file at `[docs_folder]/state/STATE-REVIEW-<branch>.json`. It contains all runtime configuration, discovered agents, and progress. Trust the file over conversation memory.

---

## PHASE 2: VALIDATION & SETUP

### Step 2.1: Validate Git Repository

Verify git repository:
```bash
run_shell_command "git rev-parse --git-dir"
```

If fails, output:
```
ERROR: Not in git repository

This skill requires git repository.

Run: git init
Or: cd to existing repository
```
Then STOP.

### Step 2.2: Validate Current Branch

Get current branch:
```bash
run_shell_command "git branch --show-current"
```

Check not on main/master:
```bash
if [ "$branch" = "main" ] || [ "$branch" = "master" ]; then
  # Error
fi
```

If on main/master, output:
```
ERROR: On main/master branch

Local review requires feature branch.

Create branch: git checkout -b feature-branch
```
Then STOP.

Store current branch as `current_branch`.

---

## PHASE 3: IDENTIFY CHANGED FILES

### Step 3.1: Determine Main Branch

Check which main branch exists:
```bash
run_shell_command "git rev-parse --verify main >/dev/null 2>&1 && echo \"main\""
run_shell_command "git rev-parse --verify master >/dev/null 2>&1 && echo \"master\""
```

Use first that exists. Store as `main_branch`.

If neither exists, output:
```
ERROR: No main/master branch

Cannot determine base branch for comparison.

Create main branch: git checkout -b main
```
Then STOP.

### Step 3.2: Fetch Latest Changes

Fetch from remote (if remote exists):
```bash
run_shell_command "git fetch origin <main_branch> 2>/dev/null || true"
```

Ignore errors if no remote configured.

### Step 3.3: Get Changed Files

Get list of changed files vs main branch:
```bash
run_shell_command "git diff --name-only <main_branch>...HEAD"
```

Include uncommitted changes:
```bash
run_shell_command "git diff --name-only HEAD"
```

Include staged-but-uncommitted changes:
```bash
run_shell_command "git diff --name-only --cached"
```

Combine all three lists, deduplicate.

If no changes found, output:
```
No changes detected

No files changed vs <main_branch>.
No uncommitted changes found.

Nothing to review.
```
Then STOP.

Store changed files list.

### Step 3.4: Persist State

Detect docs folder:
```bash
run_shell_command "test -d doc && echo \"doc\" || (test -d docs && echo \"docs\" || echo \"none\")"
```

Create state directory:
```bash
run_shell_command "mkdir -p [docs_folder]/state"
```

Write state file to `[docs_folder]/state/STATE-REVIEW-<current_branch>.json` using the write_file tool:

```json
{
  "version": 1,
  "branch": "<current_branch>",
  "main_branch": "<main_branch>",
  "docs_folder": "<docs_folder>",
  "special_instructions": "<special_instructions or null>",
  "review_agents_available": <true/false>,
  "fix_agents_available": <true/false>,
  "all_reviewers": [<list>],
  "all_coders": [<list>],
  "all_designers": [<list>],
  "changed_files": [<list>],
  "dry_run_mode": <true/false>,
  "started": "<ISO timestamp>"
}
```

This file is not committed — it exists only for context recovery if conversation context compresses mid-review.

---

## PHASE 4: PROJECT CONTEXT ANALYSIS

Analyze project documentation to understand goals, requirements, and conventions.

### Step 4.1: Read PRD (if exists)

Search for PRD files: `run_shell_command "find . -maxdepth 3 -name \"PRD*.md\" -o -name \"prd*.md\" | head -5"`

If found: Read with read_file tool (use offset/limit for files >220KB). Extract purpose, goals, requirements, success criteria.

If not found: Infer project context from repository name and structure.

### Step 4.2: Read GEMINI.md (if exists)

Search: `run_shell_command "find . -maxdepth 2 -name \"GEMINI.md\" -o -name \"gemini.md\""`

If found: Read with read_file tool (use offset/limit for files >220KB). Extract required/prohibited practices, code conventions, technology stack, testing requirements.

If not found: Infer conventions from existing code files.

### Step 4.3: Combine Context

Create context summary from PRD (purpose, goals, requirements) and GEMINI.md (conventions, prohibited practices). Store for review phase.

---

## PHASE 5: MULTI-ROUND REVIEW & FIX CYCLE

Three review rounds. Each round: reviewers find issues, fixers plan fixes, reviewers approve plan, fixes applied.

Rounds 2 and 3 finding zero issues is normal and expected.

Complete all rounds autonomously without prompting the user mid-review.

### Step 5.0: Initialize Round Tracking

Create tracking structure:
- `all_round_results = []` (per-round: issues found, fixes planned, fixes applied)
- `current_round = 1`
- `max_rounds = 3`
- If `fix_agents_available = false`: set `max_rounds = 1`. The review loop only helps when fixes happen between rounds. Without fixers, subsequent rounds find the same unfixed issues.

### Step 5.1: REVIEW PHASE

Display: `--- Review Round <current_round>/<max_rounds> ---`

#### Step 5.1.1: Agent-Powered Review

**If review_agents_available = true:**

1. Determine `applicable_reviewers` by matching changed files to reviewer agents:
   - Read the agent table from GEMINI.md
   - For each agent row, extract the "File Types" or "Scope" column
   - Match each changed file's extension against these patterns
   - If a file matches multiple agents, prefer the most specific match (e.g., `*Repository.java` beats `*.java`)

2. If `applicable_reviewers` is non-empty:
   - Launch each applicable reviewer agent via generalist tool (in parallel - multiple tool calls in one message)
   - Each agent reviews changed files in its domain
   - Collect findings from all agents
   - Merge and deduplicate findings by file:line
   - Skip built-in review (Step 5.1.2)

3. If `applicable_reviewers` is empty:
   - Fall through to built-in review (Step 5.1.2)

**If review_agents_available = false:**
- Use built-in review checklist below

#### Step 5.1.2: Built-in Review (fallback when no review agents)

Initialize findings lists:
- Critical issues: []
- Warnings: []
- Suggestions: []

For each changed file:

**Read File Content:**

Use read_file tool to get local file content.

If file too large (>2000 lines), use grep_search tool to search for specific patterns.

**Apply Code Review Checklist:**

Check each item:

**Project Alignment**:
- Changes align with project goals and requirements from PRD (if exists)
- Changes follow conventions and patterns from GEMINI.md (if exists)
- Changes match established patterns in this repository

**Code Quality**:
- Code is simple and readable
- Functions and variables are well-named
- Methods and classes are not too long
- No duplicated code
- Proper error handling
- No exposed secrets or API keys
- Input validation implemented where needed
- Good test coverage
- Uses idiomatic patterns for the project's language
- Tests are concise
- Performance considerations addressed
- Changes match design, best practices, and patterns in this repository
- Code does not violate security best practices

**Apply Security Review Checklist:**

Apply only items relevant to the file type and project stack. Skip checks that don't apply (e.g., CORS for backend-only code, container security when no Dockerfiles changed).

Check security items relevant to file type and project stack:

- Input validation implements allowlist patterns for all user input, validating both syntax (format, length, type) and semantics (business logic correctness)
- Secrets never hardcoded in source code, Docker ENV/ARG commands, or committed to version control
- Authorization checks implemented at appropriate layers for the project's architecture
- SQL/NoSQL queries use parameterized statements or ORM abstractions, never string concatenation with user input
- Authentication tokens validated with proper signature verification and expiration checks
- CORS configuration uses explicit origin allowlists rather than wildcard (*) permissions
- Error responses return generic messages without exposing stack traces, internal paths, or technology versions
- Logging captures security events but never logs passwords, tokens, session IDs, encryption keys, or PII
- HTTP security headers included where applicable: Strict-Transport-Security, Content-Security-Policy, X-Content-Type-Options
- Rate limiting configured where applicable with appropriate response codes
- File uploads (if applicable) validate extensions, enforce size limits, and use server-controlled filenames
- Dependencies kept up-to-date with no known CVEs
- Sensitive data never appears in URLs, GET query parameters, or logs
- Container images (if applicable) run as non-root users with minimal privileges
- Service-to-service authentication uses proper token exchange, not passing external tokens directly

Skip items that don't apply to the file under review. A Python utility script doesn't need CORS checks. A frontend component doesn't need container security review.

#### Step 5.1.3: Record Round Findings

Only record comments that identify actual issues. Encouraging comments ("Nice implementation!") dilute the review. Reviewers identify problems, fixers propose solutions — keeping these roles separate produces sharper reviews and better fixes.

For each issue found, determine severity (internal tracking only):
- **CRITICAL**: Security vulnerability, data loss risk, breaks core functionality
- **WARNING**: Poor practice, potential bug, performance issue
- **SUGGESTION**: Style issue, minor improvement, optimization requiring investigation

Record:
- File path
- Line number (if applicable)
- Severity level (internal tracking only)
- Issue description (use backticks for code identifiers)

Store findings for current round in `all_round_results[current_round]`.

Display: `Round <current_round>: <count> issues found`

**If no issues found:**
- Display: `Round <current_round>: Clean. No issues found.`
- If `current_round < max_rounds`: increment `current_round`, go back to Step 5.1
- If `current_round = max_rounds`: proceed to Step 5.5

**If issues found:** proceed to Step 5.2.

### Step 5.2: FIX PLANNING PHASE

Display: `--- Fix Planning (Round <current_round>) ---`

**If fix_agents_available = true:**

1. Determine applicable fixer agents:
   - Read the agent table from GEMINI.md
   - For each `*-coder` or `*-designer` agent row, extract the "File Types" or "Scope" column
   - Match each changed file's extension against these patterns
   - If a file matches multiple agents, prefer the most specific match

2. Launch applicable fixer agents via generalist tool (in parallel - multiple tool calls in one message)

3. Each agent receives:
   - Findings from current review round relevant to its domain
   - The changed files in its domain
   - Project context (PRD, GEMINI.md conventions)

4. Each agent produces a fix plan listing:
   - Issue addressed (reference to review finding)
   - File and line
   - Description of proposed change
   - Rationale

5. Collect and merge all fix plans

Display: `Fix plans created: <count> fixes proposed`

**If fix_agents_available = false:**
- List issues found as actionable items in review output
- Skip Steps 5.3 and 5.4
- Proceed to Step 5.5 (single round only when no fixers available)

### Step 5.3: PLAN REVIEW PHASE

Display: `--- Plan Review (Round <current_round>) ---`

Launch reviewer agents with the fix plans via generalist tool (in parallel - multiple tool calls in one message).

Each reviewer validates fixes in its domain:
- Fix addresses the identified issue
- Fix does not introduce new problems
- Fix follows project conventions from GEMINI.md
- Fix aligns with PRD requirements

Collect reviewer feedback.

If reviewers request changes to a fix plan:
- Feed feedback back to the relevant coder/designer agent (one revision iteration max)
- Collect revised plan

Display: `Fix plan approved by reviewers`

### Step 5.4: EXECUTE FIXES PHASE

Display: `--- Applying Fixes (Round <current_round>) ---`

**If dry_run_mode = true:**
- Display each fix: `[DRY-RUN] Would fix: <file>:<line> - <brief description>`
- Display: `[DRY-RUN] Round <current_round> fixes simulated: <count> files`
- Skip actual file modifications

**If dry_run_mode = false:**
1. Launch coder/designer agents to implement approved fixes via generalist tool (in parallel - multiple tool calls in one message)
2. Each agent applies fixes to files in its domain using replace/write_file tools
3. Display each fix applied: `Fixed: <file>:<line> - <brief description>`
4. Display: `Round <current_round> fixes applied: <count> files modified`

**After fixes applied (or simulated):**
- Record fixes in `all_round_results[current_round]`
- Increment `current_round`
- If `current_round <= max_rounds`: go back to Step 5.1 (next review round)
- If `current_round > max_rounds`: proceed to Step 5.5

### Step 5.5: Cycle Summary

Count totals across all rounds:
- Per-round: issues found, fixes planned, fixes applied
- Total issues found across all rounds
- Total fixes applied across all rounds
- Remaining issues (if any)

Store for use in output phases.

---

## PHASE 6: WRITE REVIEW FILE

### Step 6.1: Determine Output Path

Detect docs folder: check `doc` then `docs`, create `docs` if neither exists.

```bash
run_shell_command "mkdir -p [docs_folder]/reviews"
```

Filename: `REVIEW-<BRANCH-NAME>.md` (fallback: `REVIEW-YYYY-MM-DD-hh-mm.md` if branch name too long).

Get full path (`pwd` + relative) for clickable terminal output.

### Step 6.2: Generate Review Content

Format review as markdown:
```markdown
# Code Review - <Branch Name>

**Date**: <ISO Date>
**Branch**: <Current Branch>
**Base**: <Main Branch>
**Files Reviewed**: <Count>
**Review Rounds**: 3

## Summary

<Brief overview of changes and review findings across all rounds>

## Review Rounds

### Round 1
- **Issues found**: <count>
- **Fixes planned**: <count> (by <coder/designer agents used>)
- **Fixes approved by**: <reviewer agents>
- **Fixes applied**: <count>

### Round 2
- **Issues found**: <count> (0 = clean)
- **Fixes planned**: <count if any>
- **Fixes applied**: <count if any>

### Round 3
- **Issues found**: <count> (0 = clean)
- **Fixes planned**: <count if any>
- **Fixes applied**: <count if any>

## Remaining Issues

<List of any unresolved issues with file:line references - use backticks for code identifiers>

<If none: "No remaining issues.">

## Project Context Validation

<Results from PRD and GEMINI.md analysis>

## Next Steps

- Review remaining issues (if any)
- Ensure all tests pass
- Update documentation if needed
- Create PR when ready

---
Generated with Gemini CLI - review v1.2.0
```

### Step 6.3: Write Review File

**If dry_run_mode = true:**
- Display: `[DRY-RUN] Would write review to: [full_path]`
- Display review content
- Skip actual write
- Continue to PHASE 7

**If dry_run_mode = false:**
- Write content to `[docs_folder]/reviews/<FILENAME>`
- Verify file written successfully

---

## PHASE 7: SUMMARY

Output final summary:
```
Local Review Complete

Branch: <CURRENT> (vs <BASE>)
Files reviewed: <COUNT>
Review rounds: 3
Reviewer agents: <list of reviewer agents used, or "None (built-in checklist)">
Fix agents: <list of coder/designer agents used, or "None">

Findings written to: <FULL_PATH>

Round summary:
- Round 1: <issues found> issues -> <fixes applied> fixes applied
- Round 2: <issues found> issues -> <fixes applied> fixes applied
- Round 3: <issues found> issues -> <fixes applied> fixes applied
- Remaining issues: <COUNT>

Next steps:
1. Read review file: <FULL_PATH>
2. Address remaining issues (if any)
3. Run tests
4. Create PR when ready
```

Use full path (e.g., `/Users/dev/project/docs/reviews/REVIEW-add-feature.md`) so users can click it in terminal.

STOP - Local review complete.

---

## SPECIAL MODES

If help, doctor, or dryrun mode detected: Read `review-modes.md` (in this skill's directory) and execute the matching section. Then STOP.

---
