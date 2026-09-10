# Implementation Plan: PLAYWRIGHT-MCP-SIDEBAR-SCROLL

## Summary

### Business Summary

The app's left-hand menu gets cut off when the browser window is short. People cannot reach the lower menu entries — not with the mouse, not with the keyboard. This plan makes the menu scroll so every entry stays reachable. It also retires an AI browser-automation add-on the project no longer uses, and removes it from the participant handouts so nobody hunts for a feature that is gone.

### Technical Summary

Part 1 deletes `.mcp.json`, strips the `mcp__playwright__*` tool grants and the "Playwright MCP" prose blocks from seven `.claude/agents/*.md` files, cleans three stale MCP mentions in `skill-coder.md`, deletes the local `.playwright-mcp/` artifact directory plus its `.gitignore` entry, and drops the Playwright-MCP section from `README.MD`, `docs/welcome_EN.MD`, and `docs/welcome_DE.MD`. Part 2 fixes `.sidebar` in `frontend/src/styles.scss`: `min-height` → `height`, plus `scrollbar-gutter: stable` and `flex-shrink: 0` on the flex-column children so they overflow instead of squashing. The `@playwright/test` dev dependency in `backend/` stays — only the MCP *server* goes. Verification reuses that existing `backend` Playwright install via a throwaway script, so no new dependency is added.

---

## Context

Two unrelated changes, bundled by the task key.

**Part 1 — remove the Playwright MCP server.** `/Users/karsten/workspaces/fh/repos/coding-with-ai-lab/.mcp.json` registers one server (`@playwright/mcp@latest`). Seven agents grant `mcp__playwright__*` tools in frontmatter: `fe-coder`, `fe-reviewer`, `fe-test-coder`, `fe-test-reviewer`, `fe-test-runner`, `ui-designer`, `ui-reviewer`. Six of them also carry a prose "Playwright MCP" section (`ui-reviewer` has frontmatter only). `skill-coder.md` tells future agent authors to add these tools. Three participant-facing docs advertise the feature.

**Do not touch `@playwright/test`.** It is a live `backend` devDependency, with `backend/playwright.config.ts` and the API suite under `backend/src/test/`. Every Playwright mention in `docs/specs/`, `docs/SUBAGENTS.md`, `.github/workflows/deploy.yml`, and the `be-test-*` agents refers to that test runner, not the MCP server. Leave all of it alone. Historical docs under `docs/plans/`, `docs/prds/`, and `docs/reviews/` are a record of what happened — leave them alone too.

**Part 2 — sidebar scroll bug.** `frontend/src/styles.scss` line 23 sets `.sidebar { min-height: calc(100vh - 56px); }`. With `min-height`, the element grows past the viewport whenever the nav content is taller, so the `overflow-y: auto` on line 31 never activates and the lower items become unreachable. `frontend/src/app/layout/sidebar/sidebar.component.html` line 1 makes the sidebar a `d-flex flex-column`, so a naked `min-height` → `height` swap would let its children shrink instead of overflow. Both parts of the fix are needed.

## Test Command

`cd frontend && npm run test:ci`

---

## Tasks

### 1. Delete the MCP server registration and its local artifacts

**Agent:** skill-coder
**Model:** haiku — file deletion plus one spelled-out `.gitignore` edit, no judgement needed

- [ ] Delete the whole file `/Users/karsten/workspaces/fh/repos/coding-with-ai-lab/.mcp.json`. It holds nothing but the `playwright` server entry — no other server to preserve.
- [ ] In `/Users/karsten/workspaces/fh/repos/coding-with-ai-lab/.gitignore`, delete lines 32–34 (the `# Playwright MCP` comment, the `.playwright-mcp/` pattern, and the trailing blank line). Line 31 stays blank, so the file keeps exactly one blank line before `# Claude Code local settings`.
- [ ] Delete the local artifact directory: `rm -rf /Users/karsten/workspaces/fh/repos/coding-with-ai-lab/.playwright-mcp/`. It holds ~91 throwaway `console-*.log` and `page-*.yml` files written by the now-removed tool. No user data. Delete it in the same pass as the `.gitignore` edit — otherwise the ignore rule disappears and ~91 untracked files show up in `git status` with nothing gating a broad `git add`.
- [ ] Report what was deleted: the file, the `.gitignore` lines, and the directory with its file count. Report, do not ask.

**Acceptance criteria**

- `.mcp.json` does not exist at the repo root.
- `.playwright-mcp/` does not exist at the repo root.
- `.gitignore` contains no `playwright` match, and no two consecutive blank lines where the block was.
- `git status` shows no new untracked entries beyond the intended edits.

---

### 2. Strip the MCP tool grants from agent frontmatter

**Agent:** skill-coder
**Model:** haiku — seven mechanical frontmatter edits, target value given for each

Seven files under `/Users/karsten/workspaces/fh/repos/coding-with-ai-lab/.claude/agents/`. Six use a single-line `tools:` list; `fe-reviewer.md` uses a YAML block list.

- [ ] `fe-coder.md` line 4 → `tools: Read, Write, Edit, Bash, Glob, Grep`
- [ ] `fe-test-coder.md` line 4 → `tools: Read, Write, Edit, Bash, Glob, Grep`
- [ ] `fe-test-reviewer.md` line 4 → `tools: Read, Grep, Glob, Bash`
- [ ] `fe-test-runner.md` line 4 → `tools: Read, Grep, Glob, Bash`
- [ ] `ui-designer.md` line 4 → `tools: Read, Write, Edit, Bash, Grep, Glob, WebSearch`
- [ ] `ui-reviewer.md` line 4 → `tools: Glob, Grep, Read, Bash`
- [ ] `fe-reviewer.md`: keep the block-list form. Keep lines 5–8 (`- Read`, `- Grep`, `- Glob`, `- Bash`). Delete lines 9–30, the 22 `- mcp__playwright__browser_*` entries. `model: sonnet` on line 31 stays.

Keep each agent's existing tool order and its non-MCP entries — `WebSearch` on `ui-designer`, `Write`/`Edit` on the coders. Do not reorder. Do not touch any `model:` line.

**Acceptance criteria**

- `grep -rn "mcp__" .claude/agents/` returns nothing.
- All seven files still have valid YAML frontmatter — three dashes, `name`, `description`, `tools`, `model`, three dashes.
- Each agent keeps every non-MCP tool it had before.

---

### 3. Remove the "Playwright MCP" prose sections from agent bodies

**Agent:** skill-coder
**Model:** sonnet — mostly deletion, but `fe-test-runner` needs a short replacement paragraph written in the file's voice

Six files. Delete each section together with the blank line that precedes it, so no double blank line and no trailing blank line survives.

- [ ] `fe-coder.md`: delete lines 71–83 (blank line + `## Playwright MCP (Optional)` through end of file). The file then ends at line 70, "Fix any TypeScript errors before committing."
- [ ] `fe-reviewer.md`: delete lines 115–125 (blank line + `## Playwright MCP (Optional)` through end of file). File ends at line 114.
- [ ] `fe-test-coder.md`: delete lines 84–89 (blank line + block through end of file). File ends at line 83.
- [ ] `fe-test-reviewer.md`: delete lines 87–92 (blank line + block through end of file). File ends at line 86.
- [ ] `ui-designer.md`: delete lines 73–83 — the `## Playwright MCP (Optional)` heading through the blank line before `## Output Format`. Line 72 stays blank, then `## Output Format` follows directly. This block sits mid-file, not at the end.
- [ ] `fe-test-runner.md`: delete lines 73–109 — blank line + the whole `## Playwright MCP (Required for Browser Tests)` section (its four subsections: "When Playwright MCP is required", "Typical flow", "Report format for browser tests", "Playwright Rules"). File ends at line 72.
- [ ] `fe-test-runner.md` only: after the deletion, append a short replacement under `## When to Escalate` stating that browser smoke checks and E2E runs are out of scope for this agent — it runs the Karma/Jasmine suite only, and reports back to the caller when asked for anything live in a browser. Two sentences maximum, project markdown style (blank line before lists).
- [ ] `ui-reviewer.md`: no body change. Its only MCP reference is the frontmatter line handled in Task 2.

**Acceptance criteria**

- No file under `.claude/agents/` contains the heading `## Playwright MCP`.
- Every touched file ends with a single newline, no trailing blank lines, no double blank lines at the seams.
- `fe-test-runner.md` still reads as a complete agent: run command, prerequisites, output format, rules, escalation — plus the new out-of-scope note.

---

### 4. Clean the stale MCP guidance in `skill-coder.md`

**Agent:** skill-coder
**Model:** sonnet — rewording guidance prose, not deleting it; wording judgement required

`/Users/karsten/workspaces/fh/repos/coding-with-ai-lab/.claude/agents/skill-coder.md` tells future authors to wire up Playwright MCP. No MCP server exists in this repo anymore, so every Playwright-specific example must go — but the general "only when the domain needs it" principle stays useful and stays.

- [ ] Line 84 (`## Skill Structure` → "Frontmatter rules for this project"): the sentence ends "MCP tools are allowed when the skill genuinely needs them (e.g. browser automation tools for a frontend skill); omit them otherwise." Drop the parenthetical example. Keep the principle: MCP tools are allowed when a skill genuinely needs them; omit them otherwise. Do not substitute a different example.
- [ ] Line 102 (`### Project-Specific Conventions`): drop "Frontend/UI agents may also carry `mcp__playwright__*` tools for browser automation —" and keep the rest of the sentence, so it reads as a plain instruction to include MCP tools only when the agent's domain requires them.
- [ ] Line 148 (`## Project Context`): drop "Frontend/UI agents intentionally include `mcp__playwright__*` tools —" and keep "add MCP tools only where the agent's domain requires them."
- [ ] **Do not touch line 90**: "**GitHub**: Use the `gh` CLI for GitHub operations (PRs, issues). This project does not rely on GitHub MCP servers." That line is correct and unrelated. It is the reason the acceptance check below is scoped, not a bare `mcp` grep.

**Acceptance criteria**

- A case-insensitive grep of `.claude/agents/skill-coder.md` for `playwright` returns nothing.
- Line 90's GitHub-MCP sentence is byte-identical to before.
- The three reworded sentences still give the same general guidance, with no dangling em dash, no orphan semicolon, no broken backticks.
- Repo-wide check, scoped to Playwright terms only: a case-insensitive grep of `.claude/` for `playwright` returns only the legitimate `@playwright/test` references (`be-test-coder.md`, `be-test-reviewer.md`, `be-test-runner.md`, `be-coder.md`, `be-reviewer.md`, `.claude/skills/plan-and-do/*`, `.claude/prompts/agent-github-refinement.md`). Zero `mcp__playwright` matches anywhere.

---

### 5. Remove the Playwright-MCP section from the participant docs

**Agent:** ba-writer
**Model:** haiku — pure deletion, exact line ranges given

**Scope note for readers of this task alone:** Tasks 1–4 already remove the MCP server itself — the `.mcp.json` registration, the agent tool grants, and the agent prose. This task removes only the participant-facing *marketing and documentation* mention of a capability that no longer exists. The two halves belong together; neither is complete on its own.

**Order matters.** Edit the body sections first, then the README table of contents — deleting the TOC line first shifts every later line number by one. Better still, match on the exact heading text and use the line numbers below only as a locator. Re-check before each edit.

- [ ] `/Users/karsten/workspaces/fh/repos/coding-with-ai-lab/README.MD` — delete lines 202–213 inclusive: the `## Playwright-MCP: Browser-Automation` heading, its intro line, its five bullets, the blank line, the `---` at line 212, and the blank line at 213. This is the unambiguous range. The block currently reads blank(199) / `---`(200) / blank(201) / section(202–210) / blank(211) / `---`(212) / blank(213) / `## Features`(214) — two separators, not one. Deleting 202–213 leaves blank / `---` / blank / `## Features`, which matches the single-separator pattern every other heading in this file uses. Exactly one horizontal rule survives between "Nützliche Befehle" and "Features".
- [ ] `README.MD` — then delete the TOC entry, currently line 61: `- [Playwright-MCP: Browser-Automation](#playwright-mcp-browser-automation)`. It sits under the `**Referenz**` group; `- [Features](#features)` becomes the first entry there.
- [ ] `/Users/karsten/workspaces/fh/repos/coding-with-ai-lab/docs/welcome_EN.MD` — delete lines 397–406 inclusive: the `## Playwright MCP: browser automation` heading through the blank line at 406. Include that trailing blank line — stopping at the last bullet (405) would leave two consecutive blank lines before `## Further documentation`. Result: line 395 table row, one blank line, then `## Further documentation`.
- [ ] `/Users/karsten/workspaces/fh/repos/coding-with-ai-lab/docs/welcome_DE.MD` — delete lines 397–406 inclusive, same shape: heading `## Playwright-MCP: Browser-Automation` through the blank line at 406. Result: one blank line before `## Weiterführende Dokumentation`.
- [ ] Neither welcome file has a table of contents. No TOC edit there.

**Acceptance criteria**

- A case-insensitive grep for `playwright` across `README.MD`, `docs/welcome_EN.MD`, and `docs/welcome_DE.MD` returns nothing.
- README has no orphaned TOC anchor and no back-to-back horizontal rules.
- No file has two consecutive blank lines at an edit seam.
- All three files still render as valid Markdown with intact heading order.

---

### 6. Fix the sidebar scroll bug

**Agent:** ui-designer
**Model:** sonnet — small CSS change, but flex-container interaction needs care

All edits in `/Users/karsten/workspaces/fh/repos/coding-with-ai-lab/frontend/src/styles.scss`, inside the `.sidebar` rule that starts at line 22.

- [ ] Line 23: change `min-height: calc(100vh - 56px)` to `height: calc(100vh - 56px)`. This is the root cause. `min-height` lets the element grow past the viewport, so `overflow-y: auto` never has anything to clip and never produces a scrollbar. A fixed `height` bounds it and the existing overflow rule takes over.
- [ ] Keep `overflow-y: auto` (line 31) and `overflow-x: hidden` (line 32) as they are. They are already correct — they just had nothing to act on.
- [ ] Add `scrollbar-gutter: stable` to the `.sidebar` rule. This file already solves this exact class of bug once, at the top: `html { scrollbar-gutter: stable; }` on lines 8–10, with a comment on lines 5–7 explaining why. Apply the same technique here. Without it, the scrollbar eats into the 60px collapsed width and clips the centered nav icons.
- [ ] Add `flex-shrink: 0` to the sidebar's direct flex children. The sidebar is `d-flex flex-column` (see `frontend/src/app/layout/sidebar/sidebar.component.html` line 1). Its direct children are `.nav-section-header`, each `ul.nav.flex-column`, `.sidebar-toggle-container`, and `.sidebar-footer`. Flex items default to `flex-shrink: 1`, so once the container has a fixed height they would compress to fit instead of overflowing — no scrollbar, squashed nav links. Scope the rule to direct children of `.sidebar` so it does not leak into nested content.
- [ ] Verify `ul.nav.mt-auto` (the bottom "Trainings-Feedback" group, line 35 in the SCSS, line 24 in the template) still pushes to the bottom when the nav content is short. `mt-auto` and `flex-shrink: 0` do not conflict, but confirm it visually.
- [ ] Add a short comment above the `height` line explaining why it is `height` and not `min-height`, matching the comment style used for the `html` rule on lines 5–7. This bug is easy to reintroduce.
- [ ] Run `cd /Users/karsten/workspaces/fh/repos/coding-with-ai-lab/frontend && npx ng build` — the SCSS must compile clean.

**Acceptance criteria**

- Short viewport, expanded sidebar (250px): the sidebar shows a vertical scrollbar and scrolls to reveal every nav item down to the footer. Nothing is unreachable.
- Tall viewport: no scrollbar, layout unchanged from today, bottom group still pinned to the bottom by `mt-auto`.
- Collapsed sidebar (60px) with an active scrollbar: the icon stays fully visible and centered, not clipped by the scrollbar.
- Keyboard: Tab through the sidebar links until focus reaches an item below the fold — for example "Trainings-Feedback" or an admin-only link when logged in as admin. The sidebar auto-scrolls to keep the focused link visible. This is the real accessibility defect behind the bug (WCAG keyboard reachability); a mouse-scroll check alone does not prove it.
- Nav items keep their normal height. No squashing. **Visual inspection is the intended method here** — eyeball the links against the current app; no numeric pixel baseline is needed or available.
- `npx ng build` succeeds.
- No horizontal scrollbar on the sidebar at either width.

---

### 7. Update the UI spec to match the fix

**Agent:** ui-designer
**Model:** haiku — two documentation lines, exact target given

`/Users/karsten/workspaces/fh/repos/coding-with-ai-lab/docs/specs/SPECS-ui.md`, `### Sidebar` section starting at line 61.

- [ ] Line 72 currently reads "- Min-height: `calc(100vh - 56px)`." Change it to state `Height: calc(100vh - 56px)`.
- [ ] Add one bullet in the same list: the sidebar scrolls internally via `overflow-y: auto` with `scrollbar-gutter: stable`, and its direct flex children carry `flex-shrink: 0` so they overflow instead of compressing.
- [ ] Change nothing else in the file. The `## Sidebar Navigation Styles` section at line 137 and the width/position bullets at lines 63–71 stay as they are.

**Depends on Task 6.** Write the spec against the code that shipped, not the code that was planned.

**Acceptance criteria**

- `SPECS-ui.md` describes `height`, not `min-height`.
- The scrolling behavior is documented in one bullet.
- Every other value in the `### Sidebar` section is unchanged.

---

### 8. Verification — review

**Agent:** skill-reviewer
**Model:** sonnet — standard review across a handful of small, related diffs

Reviews Tasks 1, 2, 3, and 4.

- [ ] Confirm `.mcp.json` and `.playwright-mcp/` are gone and `git status` is clean of stray untracked files.
- [ ] Confirm all seven agent frontmatter blocks still parse as YAML and kept every non-MCP tool.
- [ ] Confirm no agent body still references a tool the agent can no longer call.
- [ ] Confirm `fe-test-runner.md` reads coherently end to end after losing its largest section, and that the replacement out-of-scope note fits the file's voice.
- [ ] Confirm `skill-coder.md` line 90 (GitHub MCP) is untouched, and the three reworded sentences are grammatical.
- [ ] Confirm nothing touched `@playwright/test`: `backend/package.json`, `backend/playwright.config.ts`, `backend/src/test/`, `docs/specs/SPECS-testing.md`, `docs/specs/SPECS-infrastructure.md`, `.github/workflows/deploy.yml`, and the `be-test-*` agents are all unchanged.
- [ ] Confirm historical docs under `docs/plans/`, `docs/prds/`, and `docs/reviews/` were not rewritten.

**Acceptance criteria**

- Written review naming every file checked, with a pass/fail per Task 1–4.
- Any finding names the file, the line, and the fix.

---

### 9. Verification — automated + manual sidebar check

**Agent:** ui-designer
**Model:** sonnet — scripted browser check plus reading the result; the same agent that made the CSS change

**Prerequisite:** the full stack must already be running — `./start.sh` (backend on 7070, frontend on 7200). Do not start or stop it as part of this task if it is already up.

The Playwright *MCP server* is gone, but the `playwright` npm package is still installed under `/Users/karsten/workspaces/fh/repos/coding-with-ai-lab/backend/node_modules/playwright` (a dependency of the `@playwright/test` devDependency), with Chromium already cached. That is enough to drive a browser directly.

- [ ] **Do NOT install anything.** No `npm install`, no new entry in any `package.json`, no `npx playwright install`. Reuse the existing `backend` install — either require it by absolute path from `backend/node_modules/playwright`, or run the script with `NODE_PATH` pointed at that directory. State in the report which approach was used, so the next person does not add a dependency.
- [ ] Write a **throwaway** script — not a permanent test file, not under `backend/src/test/`, never committed. Put it in the session scratchpad directory. Delete it when the check is done.
- [ ] The script: launch Chromium, set a short viewport (roughly 1280 × 700), navigate to `http://localhost:7200`, log in as `admin` / `admin123`, wait for `nav.sidebar`.
- [ ] Assert `sidebar.scrollHeight > sidebar.clientHeight` — the sidebar overflows and therefore scrolls. Save a screenshot as the audit artifact.
- [ ] Scroll the sidebar to the bottom and assert the footer ("Made by atra.consulting") is inside the visible box. Screenshot.
- [ ] Click the collapse toggle, then screenshot the 60px state with the scrollbar active — the nav icons must be fully visible and centered, not clipped.
- [ ] Keyboard check: Tab until focus lands on the last sidebar link, then assert the focused element's bounding box sits within the sidebar's visible box. This proves the WCAG keyboard-reachability fix.
- [ ] Capture browser console messages and confirm no new errors.
- [ ] Close the browser. Delete the script. Keep the screenshots only long enough for the human look below, then remove them.
- [ ] **Human sanity look:** show the screenshots to the user for a quick eyeball — expanded scrolled to bottom, and collapsed with scrollbar. This replaces a longer manual click-through. One look, not a full script.

**Depends on Task 6.** Run after the CSS change lands and `ng build` passes.

**Acceptance criteria**

- The scripted check runs to completion and every assertion passes.
- No new package appears in any `package.json` or lockfile; `git status` shows no script or screenshot file.
- The temporary script is deleted after the run.
- The user has seen the screenshots and confirms the sidebar looks right in both states.

---

## Why no separate Test Implementation task

No new automated tests are written for this task.

- **Part 1** changes Markdown agent definitions and JSON/gitignore config. No unit-test harness covers `.claude/agents/*.md` content or `.mcp.json`. Verification is review plus grep (Task 8).
- **Part 2** changes SCSS. The existing Jasmine specs (`sidebar.component.spec.ts`, `layout.service.spec.ts`) test component logic and DOM structure, not computed layout in a real viewport, and cannot meaningfully assert that a fixed-position box scrolls. Verification is the scripted browser check in Task 9 instead.

The frontend suite (`npm run test:ci`) still runs once as a **regression check**, alongside `npx ng build`.

---

## Parallelism

- **Tasks 1, 2, 5, and 6 run in parallel.** Different files, no shared state. Task 5 (`ba-writer`, docs) and Task 6 (`ui-designer`, CSS) are fully independent of the agent-file work.
- **Task 3 waits for Task 2** — same seven files. Running both at once risks a lost edit. Sequential, same agent.
- **Task 4 runs in parallel with Tasks 1–3.** `skill-coder.md` is not one of the seven agent files.
- **Task 7 waits for Task 6.** Document the CSS that shipped.
- **Task 8 waits for Tasks 1, 2, 3, and 4.** It reviews all four.
- **Task 9 waits for Task 6.** It needs the fix in the running dev server.
- **Tasks 8 and 9 run in parallel** with each other.

Fastest path: start 1, 2, 4, 5, 6 together → then 3 (after 2), 7 and 9 (after 6) → then 8.

---

## Files Touched

**Part 1 — MCP removal**

- `/Users/karsten/workspaces/fh/repos/coding-with-ai-lab/.mcp.json` — deleted
- `/Users/karsten/workspaces/fh/repos/coding-with-ai-lab/.playwright-mcp/` — deleted (~91 untracked artifact files)
- `/Users/karsten/workspaces/fh/repos/coding-with-ai-lab/.gitignore` — lines 32–34 removed
- `/Users/karsten/workspaces/fh/repos/coding-with-ai-lab/.claude/agents/fe-coder.md` — frontmatter line 4, body lines 71–83
- `/Users/karsten/workspaces/fh/repos/coding-with-ai-lab/.claude/agents/fe-reviewer.md` — frontmatter lines 9–30, body lines 115–125
- `/Users/karsten/workspaces/fh/repos/coding-with-ai-lab/.claude/agents/fe-test-coder.md` — frontmatter line 4, body lines 84–89
- `/Users/karsten/workspaces/fh/repos/coding-with-ai-lab/.claude/agents/fe-test-reviewer.md` — frontmatter line 4, body lines 87–92
- `/Users/karsten/workspaces/fh/repos/coding-with-ai-lab/.claude/agents/fe-test-runner.md` — frontmatter line 4, body lines 73–109, plus a short replacement note
- `/Users/karsten/workspaces/fh/repos/coding-with-ai-lab/.claude/agents/ui-designer.md` — frontmatter line 4, body lines 73–83
- `/Users/karsten/workspaces/fh/repos/coding-with-ai-lab/.claude/agents/ui-reviewer.md` — frontmatter line 4 only
- `/Users/karsten/workspaces/fh/repos/coding-with-ai-lab/.claude/agents/skill-coder.md` — lines 84, 102, 148 reworded; line 90 untouched
- `/Users/karsten/workspaces/fh/repos/coding-with-ai-lab/README.MD` — line 61 (TOC), lines 202–213 (section)
- `/Users/karsten/workspaces/fh/repos/coding-with-ai-lab/docs/welcome_EN.MD` — lines 397–406
- `/Users/karsten/workspaces/fh/repos/coding-with-ai-lab/docs/welcome_DE.MD` — lines 397–406

**Part 2 — sidebar fix**

- `/Users/karsten/workspaces/fh/repos/coding-with-ai-lab/frontend/src/styles.scss` — `.sidebar` rule from line 22
- `/Users/karsten/workspaces/fh/repos/coding-with-ai-lab/docs/specs/SPECS-ui.md` — line 72 plus one added bullet

**Explicitly not touched**

`backend/package.json`, `backend/playwright.config.ts`, `backend/src/test/**`, `docs/specs/SPECS-testing.md`, `docs/specs/SPECS-infrastructure.md`, `docs/SUBAGENTS.md`, `.github/workflows/deploy.yml`, the `be-*` agents, `.claude/skills/plan-and-do/**`, `.claude/prompts/**`, and everything under `docs/plans/`, `docs/prds/`, `docs/reviews/`.

---

## Open Questions

1. **`.claude/settings.local.json` still enables the MCP server.** Lines 18–21 set `"enableAllProjectMcpServers": true` and list `"playwright"` under `enabledMcpjsonServers`. The file is gitignored, so it is personal machine config, not repo content — and no task touches it by default. With `.mcp.json` gone the entry is inert, but it is stale. **Needs your explicit OK** — see the plan-approval checkpoint.
2. **Scroll the whole sidebar, or pin the footer and scroll only the nav?** This plan scrolls the whole sidebar — the collapse toggle and the "Made by atra.consulting" footer scroll out of view on short viewports. Pinning them would need a second scroll container and more CSS. **Proceeding with the simple fix**, since the footer is decorative and the toggle is reachable after one scroll.
3. **Delete the docs section, or replace it with something?** Task 5 deletes the Playwright-MCP section outright rather than swapping in a note about what participants can do instead. **Proceeding with delete** — the capability is gone, and a "this used to exist" note only raises questions in a workshop handout.

**Resolved during review:** the `.playwright-mcp/` directory question (now handled in Task 1 — delete it, do not just report it) and the ordering risk it created. Also dropped as out of scope: `fe-coder.md` line 68 ("Smoke-test the affected route in the dev server") makes no reference to Playwright or MCP and predates the MCP work — it stays as is.
