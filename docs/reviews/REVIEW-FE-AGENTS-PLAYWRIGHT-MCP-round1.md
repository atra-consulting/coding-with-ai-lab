# Review: FE-AGENTS-PLAYWRIGHT-MCP (Round 1)

Reviewer: `fe-reviewer`
Branch: `fe-agents-playwright-mcp`
Target: `main`

## Findings

### CRITICAL

None.

### WARNING

**[W1] `fe-reviewer.md` — Playwright section breaks the reviewer output block** (confidence: 75 → fixed)

New `## Playwright MCP (Optional)` section sits between `## Commands` and `## Output Format`, splitting the reviewer-output spec (Output Format → Confidence Scoring → False Positive Awareness) from its usage section. Other 5 agents append the Playwright block at the end.

Fix applied: moved the section to after `## False Positive Awareness`.

### SUGGESTION

**[S1] `fe-test-runner.md` — duplicate "Rules" heading** (confidence: 50 → fixed)

New `### Rules` sub-section inside the Playwright block duplicates the existing top-level `## Rules` heading. Rename for clarity.

Fix applied: renamed to `### Playwright Rules`.

## Passing Checks

- 6 agent files changed as planned; no other source files touched.
- 22 Playwright tool names match `ui-reviewer.md` exactly on every file.
- `fe-test-runner.md` uses mandatory language ("MUST", "required", explicit "Do NOT" constraints). Karma workflow untouched. Model still `haiku`.
- Optional agents use permissive language ("MAY") only.
- `ui-reviewer.md` untouched.

## Resolution

W1 and S1 both auto-fixed per `workflow_scope = full` first review round.
