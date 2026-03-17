# Implementation Plan: UPDATE-GEMINI-SKILLS

## Test Command
`cd ciam && mvn clean compile && cd ../backend && mvn clean compile && cd ../frontend && npx ng build`

## Tasks
### 1. Update `plan-and-do/SKILL.md`
- [ ] Update version to `1.3.0` and last-modified to `2026-03-17`.
- [ ] Update `tools` list to include `ask_user`.
- [ ] Port the "HOW TO ASK THE USER FOR DECISIONS" section to use `ask_user`.
- [ ] Port "AGENT DISCOVERY" logic to use the three categories: `writer_agents`, `coding_agents`, `review_agents`. Use `GEMINI.md` as source.
- [ ] Port "STEP 6.2: Generate Specifications (PRD)" logic to use agents via `generalist`.
- [ ] Port "STEP 7.3: Generate Detailed Plan" logic to use agents via `generalist`.
- [ ] Port "STEP 8.1: Execute Plan" logic (Phase review after each phase).
- [ ] Sync branch creation, PR logic, and summary logic.

### 2. Update `plan-and-do/plan-and-do-modes.md`
- [ ] Sync "HELP MODE", "DOCTOR MODE", "STEP RESUME ROUTER", and "POST-COMPLETION WORKFLOW" with the Claude version.
- [ ] Ensure `original_branch` logic and `gh` CLI usage are preserved.

### 3. Update `review/SKILL.md`
- [ ] Update version to `1.4.0` and last-modified to `2026-03-17`.
- [ ] Update `tools` list to include `ask_user`.
- [ ] Port "HOW TO ASK THE USER FOR DECISIONS" to use `ask_user`.
- [ ] Port "PHASE 1.7: AGENT DISCOVERY" to use the new agent categories and read from `GEMINI.md`.
- [ ] Port "PHASE 5: MULTI-ROUND REVIEW & FIX CYCLE" to use `generalist` for parallel agent calls.
- [ ] Sync the review and fix logic with the Claude version.

### 4. Update `review/review-modes.md`
- [ ] Sync "HELP MODE", "DOCTOR MODE", and "DRY-RUN MODE" with the Claude version.

### 5. Verification
- [ ] Run `/plan-and-do help` and `/review help` to ensure the skills are still parsable and show updated info.
- [ ] Run `/plan-and-do doctor` and `/review doctor` to check health.

## Tests
### Manual Verification
- [ ] Verify that `GEMINI.md` is correctly parsed for agents.
- [ ] Verify that `ask_user` tool calls in the skills follow the correct schema.
