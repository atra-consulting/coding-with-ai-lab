# Implementation Plan: ADAPT-SUBAGENTS

## Goal

Review the 6 new, untracked subagent files and adapt them to this project's conventions. Remove all foreign content — especially MCP tools and another machine's paths. Then register the agents in `CLAUDE.md`.

## New agent files

`.claude/agents/` — all untracked:
- python-coder.md, python-reviewer.md
- shell-coder.md, shell-reviewer.md
- skill-coder.md, skill-reviewer.md

## Findings (what is foreign / off-convention)

| File | Issues to fix |
|------|---------------|
| python-coder | `memory: project` field; **no `tools:`**; foreign "Persistent Agent Memory" block with path `/Users/karsten.silz/.../fonl-shared-tools/...`; no `## Specifications` |
| python-reviewer | `memory: project`; **`tools:` = huge foreign MCP list** (ghe, dynatrace, github, jira, jenkins…); foreign memory block; no `## Specifications` |
| shell-coder | `model: opus`; **no `tools:`**; no `## Specifications` (body is clean) |
| shell-reviewer | `memory: project`; **`tools:` = huge foreign MCP list**; foreign memory block; no `## Specifications` |
| skill-coder | `model: opus`; **no `tools:`**; body refs foreign repo layout: Jira, `perPage` GitHub-MCP, `claude-code/custom-skills/`, `PRD.md`, `~/.claude/commands`, `TODOS.md`; no `## Specifications` |
| skill-reviewer | `memory: project`; **`tools:` = huge foreign MCP list**; body ref `claude-code/custom-skills/`; foreign memory block; no `## Specifications` |

## Project conventions to apply

- Coders: `tools: Read, Write, Edit, Bash, Glob, Grep`, `model: sonnet`
- Reviewers: `tools: Read, Grep, Glob, Bash`, `model: sonnet`
- No `memory:` frontmatter field (no other project agent uses it)
- **No MCP tools** anywhere (per user instruction)
- Each agent gets a short `## Specifications` / project-context section pointing at `CLAUDE.md` + relevant `docs/specs/*` and the existing `.claude/agents/` & `.claude/skills/` patterns

## Tasks

### 1. Adapt frontmatter (all 6 files)
- [ ] Set `tools:` to the correct project list (coder vs reviewer set) — no MCP entries
- [ ] Set `model: sonnet` (standardize; remove `opus` on shell-coder, skill-coder)
- [ ] Remove `memory: project` field
- [ ] Keep `name` + `description` as-is (descriptions are good)

### 2. Remove foreign body content
- [ ] Delete the "Persistent Agent Memory" sections (python-coder, python-reviewer, shell-reviewer, skill-reviewer) — they point to another machine's path
- [ ] skill-coder: replace foreign repo refs with this project's layout:
  - `claude-code/custom-skills/` → `.claude/skills/`
  - drop `PRD.md` / `TODOS.md` / `~/.claude/commands` / Jira / `perPage` GitHub-MCP guidance
  - point at `docs/prds/`, `.claude/agents/`, project commit/PRD conventions
- [ ] skill-reviewer: `claude-code/custom-skills/` → `.claude/skills/`

### 3. Add `## Specifications` / project-context section to each
- [ ] python/shell: read `CLAUDE.md`; shell also `docs/specs/SPECS-infrastructure.md`; follow existing `scripts/` patterns
- [ ] skill: read `CLAUDE.md`; follow existing `.claude/skills/` and `.claude/agents/` patterns; PRDs in `docs/prds/`

### 4. Register agents in CLAUDE.md
- [ ] Add 6 rows to the `## Agents` table (python-coder/reviewer, shell-coder/reviewer, skill-coder/reviewer) with Type coding/review

### 5. Verification
- [ ] `grep` confirms zero `mcp__`, zero `karsten.silz`, zero foreign-repo refs remain in the 6 files
- [ ] Frontmatter parses (valid YAML, name/description/tools/model present)
- [ ] CLAUDE.md table lists all 6 new agents

## Tests

Docs/config-only change — no unit tests apply. Verification is the grep + frontmatter checks in Task 5.

## Branch & PR

Working on the current branch `prep-ws-intro-2026-06-22` (created by the user for this work). PR target if requested: `main`.
