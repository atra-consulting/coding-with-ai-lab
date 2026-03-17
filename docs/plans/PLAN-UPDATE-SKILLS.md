# Implementation Plan: UPDATE-SKILLS

## Test Command
N/A — documentation/skill files only, no compilation or tests.

## Tasks

### 1. Update plan-and-do/SKILL.md
- [ ] Bump version 1.2.0 → 1.3.0, last-modified → 2026-03-17
- [ ] Add `AskUserQuestion` to allowed-tools
- [ ] Update header version string
- [ ] Replace "CRITICAL: HOW TO ASK" section with AskUserQuestion pattern
- [ ] Update Quit Pattern resume message (keep `/plan-and-do`)
- [ ] Update Standard Checkpoint to mention AskUserQuestion
- [ ] Expand AGENT DISCOVERY to include `writer_agents` category (`-writer`/`-analyst`)
- [ ] Add `writer_agents` field to state JSON template in Step 3.3
- [ ] Update Step 4.4: use AskUserQuestion for main/master warning
- [ ] Update Step 5: use AskUserQuestion for PRD decision
- [ ] Update Step 6.2: add structured draft→review→fix agent workflow for PRD
- [ ] Update Step 7.3: add structured parallel-coders→merge→review→fix agent workflow
- [ ] Update Step 7.1: use AskUserQuestion for test command prompt
- [ ] Add phase review block after Step 8.1 (agents review each phase)
- [ ] Update Step 8.2: use AskUserQuestion for questions
- [ ] Update Step 9.2: use AskUserQuestion for test failure help
- [ ] Update Step 9.4: use AskUserQuestion for checkpoint
- [ ] Update Step 10.3: use AskUserQuestion for review findings
- [ ] Update Step 11.1: use AskUserQuestion for manual test steps
- [ ] Update Step 12.2: use AskUserQuestion for doc update approval
- [ ] Update Step 13.0: use AskUserQuestion for cleanup decision
- [ ] Add CRITICAL PR targeting note after Step 13.3

### 2. Update plan-and-do/plan-and-do-modes.md
- [ ] Update header description text
- [ ] Update HELP MODE: version, integration reference
- [ ] Update POST-COMPLETION: use AskUserQuestion for push/PR/merge prompts
- [ ] Add CRITICAL PR targeting note in PC.3

### 3. Update review/SKILL.md
- [ ] Bump version 1.2.0 → 1.4.0, last-modified → 2026-03-17
- [ ] Add `AskUserQuestion` to allowed-tools
- [ ] Update header version string
- [ ] Replace "CRITICAL: HOW TO ASK" section with AskUserQuestion pattern
- [ ] Update embedded mode description reference
- [ ] Update Phase 1.3 confirmation to use AskUserQuestion
- [ ] Update `all_round_results` structure with rich issue fields (severity, file, line, description, found_by, fix_description, fixed_by)
- [ ] Add `found_by` tagging in agent review merge step
- [ ] Update Step 5.1.3 recording format with rich fields
- [ ] Update display format to show per-issue lines with severity and found_by
- [ ] Update fix plan format in Step 5.2 with issue #, fix_description
- [ ] Update dry-run display to include agent attribution
- [ ] Update fix display to include agent attribution
- [ ] Update fix recording to set fix_description and fixed_by
- [ ] Replace review file round format with table-based format (FORMAT A/B)
- [ ] Update generated-with version string

### 4. Update review/review-modes.md
- [ ] Update header description text
- [ ] Update HELP MODE version and command references
- [ ] Update Doctor mode header text
