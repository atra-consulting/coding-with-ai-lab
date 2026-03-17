# Review — Special Modes

Reference file for review skill. Read and execute the matching section when help, doctor, or dryrun mode is detected.

---

## HELP MODE

Execute when `request` = "help".

Output:
```
Review Skill - Help

Purpose: Local code review with multi-round review & fix cycle

Usage:
  /review                          # Review local changes
  /review "special instructions"   # Review with extra instructions
  /review help                     # This help
  /review doctor                   # Health checks
  /review dryrun                   # Simulate review

Examples:
  # Review local changes
  /review

  # Review with focus on security
  /review "Focus on authentication changes"

  # Simulate review (dry-run)
  /review dryrun

Prerequisites:
  - git (required)
  - Working in a git repository (required)
  - On a feature branch (not main/master)

Features:
  - Automatic detection of changed files vs main branch
  - Project context validation (PRD.md, GEMINI.md)
  - Security-focused review checklist
  - Language-agnostic code quality checks
  - Multi-round review & fix cycle (3 rounds with agents, 1 round without)
  - Reviewer agents find issues, coder/designer agents plan and apply fixes
  - Reviewers approve fix plans before execution
  - Agent discovery (reviewers, coders, designers from GEMINI.md)
  - Writes review to docs/reviews/ folder
  - Doctor mode for health checks
  - Dry-run mode for simulation

Output:
  Review file at [docs]/reviews/REVIEW-<BRANCH-NAME>.md
  or REVIEW-YYYY-MM-DD-hh-mm.md

Agent Support:
  If the project GEMINI.md defines an ## Agents section:
  - Reviewer agents (*-reviewer) analyze code and approve fix plans
  - Coder agents (*-coder) and designer agents (ui-designer) plan and apply fixes
  - Three review rounds with automated fix cycles
  - Agents matched to changed file types and launched in parallel via generalist
  If no agents defined: uses built-in review checklist (single round, no fix cycle)

Integrations:
  - git (required): Diff analysis
  - generalist tool (optional): Agent delegation

Version: 1.4.0
```

Then STOP.

---

## DOCTOR MODE

Execute when `request` = "doctor".

Run health checks and report status.

### Doctor.1: Git Checks

**Git Installation**:
```bash
run_shell_command "git --version"
```
- If succeeds: Show version
- If fails: "git not installed - brew install git (CRITICAL)"

**Git Repository**:
```bash
run_shell_command "git rev-parse --git-dir"
```
- If succeeds: Show repository root
- If fails: "Not in git repository (CRITICAL)"

**Current Branch**:
```bash
run_shell_command "git branch --show-current"
```
- If not main/master: "On feature branch: <branch>"
- If main/master: "On main/master (local review needs feature branch)"

**Main Branch Exists**:
```bash
run_shell_command "git rev-parse --verify main || git rev-parse --verify master"
```
- If exists: "Main branch: <name>"
- If fails: "No main/master branch found (CRITICAL)"

**Changed Files**:
```bash
run_shell_command "git diff --name-only main...HEAD 2>/dev/null | wc -l"
```
- If > 0: "<count> files changed vs main"
- If 0: "No changes detected vs main"

### Doctor.2: Project Checks

**GEMINI.md**:
```bash
run_shell_command "test -f GEMINI.md && echo \"found\" || echo \"not found\""
```
- If found: "GEMINI.md found"
- If not found: "GEMINI.md not found (optional)"

**Agent Discovery**:
- Read GEMINI.md for ## Agents section
  - If found: List discovered reviewer agents and coder/designer agents
  - If not found: "No agents in project GEMINI.md (uses built-in checklist, single round)"

**Docs Folder**:
```bash
run_shell_command "test -d doc && echo \"doc\" || (test -d docs && echo \"docs\" || echo \"none\")"
```
- If found: "Docs folder: <name>"
- If not found: "No docs folder (will create 'docs' on first review)"

**Review File Permissions**:
```bash
run_shell_command "touch .test-write && rm .test-write"
```
- If succeeds: "Can write review files"
- If fails: "Cannot write files in current directory (CRITICAL)"

### Doctor.3: Overall Status

Determine overall health:

**SUCCESS**: All critical checks pass
- Git installed
- In git repository
- On feature branch
- Main branch exists
- Can write files

**PARTIAL**: Some optional checks note issues
- No GEMINI.md
- No agents
- On main/master branch

**FAILED**: Critical checks fail
- Git not installed
- Not in git repository
- No main branch
- Cannot write files

Output final status:
```
Review Skill - Health Check

Git Checks:
  <status for each check>

Project Checks:
  <status for each check>

Overall Status: <SUCCESS/PARTIAL/FAILED>

<Remediation steps if any failures>
```

Then STOP.

---

## DRY-RUN MODE

Execute when `request` contains "dryrun" or "dry-run" or "dry_run" (case-insensitive).

Enable dry-run mode for the review workflow:
- Display: "DRY-RUN MODE ENABLED - No changes will be made"
- Set internal flag: `dry_run_mode = true`
- Execute full review workflow logic (all rounds per max_rounds)
- Simulate all write operations with format: `[DRY-RUN] Would {action}: {details}`

**Dry-run behavior:**

- Read changed files (actual)
- Analyze code and generate review content (actual)
- Plan fixes (actual) but simulate applying them
- Display review content that would be written
- Simulate file creation: `[DRY-RUN] Would write review to: <filename>`
- Skip actual file writes and fix applications

**Summary output:**
```
DRY-RUN Summary:
- Review rounds: <max_rounds>
- Total issues found: <count across all rounds>
- Total fixes simulated: <count>
- Operations executed: 0
```

Then continue to normal workflow with dry-run flag enabled.
