# Implementation Plan: FE-AGENTS-PLAYWRIGHT-MCP

## Task Summary

Update front-end agents in `.claude/agents/` so they CAN use Playwright MCP for UI review. Update `fe-test-runner.md` so it MUST use Playwright MCP for browser tests.

## Test Command

No automated tests apply. This task edits agent instruction markdown. Verification is manual: read the updated files and confirm frontmatter tools and body sections match the plan.

## Background

`.mcp.json` at the repo root registers a Playwright MCP server (`@playwright/mcp@latest`). Agents must list the relevant `mcp__playwright__*` tools in their frontmatter to actually call them. Currently only `ui-reviewer.md` lists the Playwright MCP tools.

## Scope: Which Agents Change

| Agent | Current state | Change |
|---|---|---|
| `fe-coder.md` | No MCP tools | ADD Playwright MCP tools + "Playwright MCP (Optional)" section |
| `fe-reviewer.md` | No MCP tools | ADD Playwright MCP tools + "Playwright MCP (Optional)" section |
| `fe-test-coder.md` | No MCP tools | ADD Playwright MCP tools + "Playwright MCP (Optional)" section |
| `fe-test-reviewer.md` | No MCP tools | ADD Playwright MCP tools + "Playwright MCP (Optional)" section |
| `ui-designer.md` | No MCP tools | ADD Playwright MCP tools + "Playwright MCP (Optional)" section |
| `fe-test-runner.md` | No MCP tools | ADD Playwright MCP tools + "Playwright MCP (Required for Browser Tests)" section |
| `ui-reviewer.md` | Already has full Playwright MCP tools | NO CHANGE |

## Tasks

### 1. Update optional users (CAN use Playwright MCP)

For each of `fe-coder.md`, `fe-reviewer.md`, `fe-test-coder.md`, `fe-test-reviewer.md`, `ui-designer.md`:

- [ ] Expand `tools:` frontmatter to include the Playwright MCP tools (same set used by `ui-reviewer.md`).
- [ ] Add a new section titled "Playwright MCP (Optional)" near the bottom of the body, before "Output Format" where one exists. Describe when the agent MAY use Playwright MCP to inspect the running UI at `http://localhost:7200` (verify rendered state, take screenshots, check console). Keep it short.

### 2. Update `fe-test-runner.md` (MUST use Playwright MCP for browser tests)

- [ ] Expand `tools:` frontmatter to include the Playwright MCP tools.
- [ ] Keep the existing Karma/Jasmine unit-test workflow unchanged — that remains the default run.
- [ ] Add a new section "Playwright MCP (Required for Browser Tests)" that:
  - States that any browser-based test or UI smoke check beyond Karma unit tests MUST use the `mcp__playwright__*` tools — not other approaches like raw curl, shell scripts, or external browsers.
  - Lists the typical flow: navigate to `http://localhost:7200`, take a snapshot or screenshot, assert key UI elements, close the browser.
  - Notes that the dev server must already be running (caller's responsibility, not the agent's).

### 3. Update agent table in CLAUDE.md (if needed)

- [ ] Verify the agent table in `CLAUDE.md` still accurately describes each agent. No content change expected — only the role/type column matters, and Playwright MCP is an implementation detail.

### 4. Verification

- [ ] Read each changed file and confirm:
  - YAML frontmatter parses (delimiters, indentation).
  - `tools:` list is syntactically valid (array form matches existing pattern).
  - New section heading exists and body is coherent.
- [ ] `git diff` spot-check to confirm only the 6 agent files are touched.

## Playwright MCP Tool List (to add to frontmatter)

Match the exact tool list already used by `ui-reviewer.md`:

```
mcp__playwright__browser_close
mcp__playwright__browser_resize
mcp__playwright__browser_console_messages
mcp__playwright__browser_handle_dialog
mcp__playwright__browser_evaluate
mcp__playwright__browser_file_upload
mcp__playwright__browser_fill_form
mcp__playwright__browser_install
mcp__playwright__browser_press_key
mcp__playwright__browser_type
mcp__playwright__browser_navigate
mcp__playwright__browser_navigate_back
mcp__playwright__browser_network_requests
mcp__playwright__browser_run_code
mcp__playwright__browser_take_screenshot
mcp__playwright__browser_snapshot
mcp__playwright__browser_click
mcp__playwright__browser_drag
mcp__playwright__browser_hover
mcp__playwright__browser_select_option
mcp__playwright__browser_tabs
mcp__playwright__browser_wait_for
```

## Non-Goals

- Do NOT change `ui-reviewer.md` — it already has the tools.
- Do NOT change back-end, db, or ba agents.
- Do NOT add Playwright MCP to `fe-test-runner`'s core run command. Karma/Jasmine unit tests still run with `ng test`.
- Do NOT write actual Playwright test specs. This task only updates agent instructions.
