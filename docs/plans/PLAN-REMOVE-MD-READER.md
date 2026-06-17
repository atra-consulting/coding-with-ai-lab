# Implementation Plan: REMOVE-MD-READER

## Goal
Remove the `md-reader` utility agent and clean up every active reference to it.

## Test Command
`cd backend && npx playwright test` — but this change is **docs/config-only** and test-inappropriate. No tests authored or run.

## Tasks

### 1. Delete agent definitions
- [ ] Delete `.claude/agents/md-reader.md`
- [ ] Delete `.gemini/agents/md-reader.md` (Gemini mirror copy)

### 2. Update CLAUDE.md
- [ ] Remove the `md-reader` row from the `## Agents` table (line ~87)
- [ ] Remove `md-reader` from the "Primary for" column of the SPECS.md row in the `## Specifications` table (line ~105) — leaves `ba-writer, ba-reviewer`

### 3. Update GEMINI.md
- [ ] Remove the `md-reader` row from the agents table (line ~32)

### 4. Update plan-and-do skill
- [ ] `.claude/skills/plan-and-do/SKILL.md` line ~162: drop `md-reader` from the utility example, leaving `admin` — `Anything else (e.g., \`admin\`) → skip as utility`

### 5. Leave untouched (with rationale)
- [ ] `docs/reviews/REVIEW-claude-review-plan-do-skill-1A2rt.md` — historical review record documenting a past run. Rewriting it would falsify history. NOT edited.
- [ ] Plugin skills `bpf-plan-and-do` / `bpf-review` — live outside the repo, not editable here.

### 6. Verification
- [ ] `grep -rn "md-reader"` across repo returns only the historical review doc
- [ ] `npx ng build` not required (no frontend change); confirm no broken markdown links

## Notes
- No backend/frontend/db code touched. No schema, no routes, no components.
- Agent set after removal: 17 agents (was 18), matrix of coder/reviewer pairs plus `admin` utility.
