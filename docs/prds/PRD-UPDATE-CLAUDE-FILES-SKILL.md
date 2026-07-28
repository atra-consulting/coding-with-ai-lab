# PRD: update-claude-files Skill

## Source

User request. Adapt `~/Desktop/custom-skills/production/update-claude-files/SKILL.md` (a Kotlin/Java + Angular Nx skill) into this project. This repo is Node/Express/TypeScript + Angular 21 + Drizzle/libSQL. A closer prior adaptation already exists as the installed `bpf-update-claude-files` skill — this PRD reuses its shape but tailors it to this project.

## Problem Statement

Docs drift from code. `.claude/agents/`, `docs/specs/`, and `CLAUDE.md` go stale as features land. No tool keeps them in sync. plan-and-do ends without a doc-sync step scoped to the branch it built.

## Goals

- New skill `project:update-claude-files` at `.claude/skills/update-claude-files/SKILL.md`.
- Updates this project's real docs: `.claude/agents/*.md`, `docs/specs/SPECS*.md`, `docs/specs/DOMAIN.md`, `CLAUDE.md`.
- Two modes: **standalone** and **embedded**.
- Runs from plan-and-do **before PR creation**, scoped to the branch's changes.
- Skips with a warning when no agents exist.

## Non-Goals

- **No agent file creation or deletion.** This project has a curated agent roster. The skill only updates the *content* of existing agent files. It never adds or removes an agent file.
- **No new spec files, no spec file deletion.** This project has a fixed spec set. The skill updates existing spec files in place. It never creates or deletes a spec file.
- **No help/doctor modes.** Out of scope. Only standalone and embedded.
- No changes to CRM app code, DB, or frontend.

## Requirements

### R1 — New skill file

Create `.claude/skills/update-claude-files/SKILL.md`. Frontmatter name `project:update-claude-files`. Follows this project's writing style (short, simple, active voice). `allowed-tools`: Read, Write, Edit, Grep, Glob, `Bash(git:*)`, `Bash(mkdir:*)`, `Bash(rm:*)`, `Task` (added in v1.1 — see below), AskUserQuestion.

### R2 — Update targets (this project's real docs)

- `.claude/agents/*.md` — the curated agent roster.
- `docs/specs/SPECS.md`, `DOMAIN.md`, `SPECS-backend.md`, `SPECS-database.md`, `SPECS-frontend.md`, `SPECS-ui.md`, `SPECS-testing.md`, `SPECS-infrastructure.md`.
- `CLAUDE.md` at repo root.

Skill discovers spec files by glob (`docs/specs/*.md`). It keeps this project's exact names (`SPECS-backend.md`, not `SPECS-back-end.md`). It updates content **in place**. It keeps `CLAUDE.md`'s `## Agents` table and `## Specifications` table in sync with the agent files and spec files.

**Preserve human-authored content.** Specs and agents are hand-written prose (German/English). The skill updates only facts that the source changes made stale. It preserves manual sections, domain language, and structure. It never overwrites carefully-written prose with generic phrasing. It may prune a content line only when the source clearly made it obsolete (e.g., a removed route, a renamed column).

### R3 — Agent guard (hard stop)

At start, glob `.claude/agents/*.md`. If none exist:
- Print a warning.
- Say: install the agents from `https://github.com/atra-consulting/coding-with-ai-lab/tree/main/.claude/agents` first.
- **Standalone:** print the warning, STOP. Do no updates.
- **Embedded:** write a result file marked `status: skipped-no-agents` (so the caller has one code path), print the warning, STOP. Do no updates.

This holds in both modes: with no agents, the skill never edits docs.

### R4 — Source → target mapping

One table drives both modes. Each source glob flags candidate targets. The skill then edits a flagged target only if the actual diff changed something that target documents (R2 "preserve" rule).

| Changed source | Candidate targets |
|---|---|
| `backend/src/db/**`, `config/migrate.ts`, `db/schema/**`, `seed/**` | `SPECS-database.md`, `db-coder`, `db-reviewer`; `DOMAIN.md` **only if** relationship / cascade / delete semantics changed |
| `backend/src/services/**`, `routes/**`, `middleware/**` | `SPECS-backend.md`, `be-coder`, `be-reviewer`; `DOMAIN.md` **only if** business meaning changed (entities, roles, pipeline, delete behavior) |
| other `backend/**` | `SPECS-backend.md`, `CLAUDE.md` |
| `frontend/**` (components, services, routes) | `SPECS-frontend.md`, `fe-coder`, `fe-reviewer`, `CLAUDE.md` |
| `frontend/**` (`*.scss`, templates, styling) | `SPECS-ui.md`, `ui-designer`, `ui-reviewer` |
| test files (`**/test/**`, `*.spec.ts`, `*.e2e.ts`) | `SPECS-testing.md`, `*-test-*` agents |
| build / config / startup (`package.json`, `start.sh`, `*.config.*`, `tsconfig*.json`) | `SPECS-infrastructure.md`, `CLAUDE.md`, `admin` |
| `.claude/agents/**` changed | affected agents, `CLAUDE.md` `## Agents` table |
| `docs/specs/**` changed | `CLAUDE.md` `## Specifications` table |

`SPECS.md` (root index) is flagged whenever any other spec file is flagged (it indexes them). `CLAUDE.md` is flagged whenever any backend/frontend/build target is flagged.

**DOMAIN.md vs SPECS-database.md rule:** `DOMAIN.md` is business meaning only (no schema). A pure schema change (column type, index) flags `SPECS-database.md` only. A change to relationships, cascade/delete behavior, roles, or pipeline flags `DOMAIN.md` too. The skill reads the diff to decide.

### R5 — Standalone mode (timestamps + commits)

Trigger: no args, or free-text special instructions.

- Guard: not a git repo → print how to fix, STOP.
- Staleness by git, not by injected timestamp lines (specs stay clean). Check **one target at a time**: target T is stale if any commit since T's own last-change time (`git log -1 --format=%cI -- <T>`) touched T's own mapped source globs. A target with no git history (never committed) is treated as stale → analyze fully.
- If no target is stale: say so, STOP.
- Interactive: show what will change. Prompt before large edits. Never prompt in a loop for trivia.
- On accept: apply edits, then commit: `docs: Update project documentation via update-claude-files`. Print a summary.

### R6 — Embedded mode (branch-scoped)

Trigger: first arg is `embedded`. Optional `base:<sha>`.

- First: `mkdir -p docs/state`, then `rm -f docs/state/UPDATE-CLAUDE-FILES-RESULT.md` (clear any stale result). This runs before the R3 guard so any later STOP can still write its result file.
- Then run R3 guard (writes skip result + STOP if no agents).
- Scope = branch changes:
  - If `base:<sha>` given: validate with `git rev-parse --verify "<sha>^{commit}"`. If valid, changed files = `git diff <sha>...HEAD --name-only`. If invalid/unreachable, warn and fall back to the R5 timestamp scan.
  - If no `base:<sha>`: fall back to the R5 timestamp scan.
- Apply the R4 mapping. Update only. Never prompt. Never delete a file.
- **Always write a result file** `docs/state/UPDATE-CLAUDE-FILES-RESULT.md` (uncommitted) — even when nothing changed (`status: no-changes`) or on skip. The caller commits real changes. Result file has a fixed schema: `status`, agents changed, specs changed, CLAUDE.md sections, files-modified list.
- Skip header and confirmations. Never call `AskUserQuestion`. On an internal error, log it into the result file and return — never propagate a hard stop that could block the PR.

### R7 — plan-and-do integration

Edit `.claude/skills/plan-and-do/SKILL.md` Step 12 (Documentation Updates). Step 12 runs before POST-COMPLETION PR creation (PC.2), and is reached only for `workflow_scope == "full"` — the scope that opens a PR unattended. This is the intended trigger.

- When `agents_available` and `is_git_repo`: invoke `update-claude-files` embedded, scoped to the branch: `embedded base:[original_head]`.
- When `is_git_repo` but no agents: print the R3 warning + URL, skip the doc update, continue (do not block the PR).
- When not a git repo: keep the existing manual-scan fallback text.
- After the embedded call: read `docs/state/UPDATE-CLAUDE-FILES-RESULT.md`. If `status` shows real changes, stage only the changed docs (not the result file — it is gitignored) and commit `docs: Update project documentation. [task_key]` (with `PRD:` footer when a PRD exists). If `status` is `no-changes`, `skipped-no-agents`, or `error`: display it, commit nothing, continue.

**Result file is gitignored.** `docs/state/UPDATE-CLAUDE-FILES-RESULT.md` is untracked and gitignored. The skill rewrites it every embedded run. Keeping it out of git stops plan-and-do's PC.1 cleanup from committing a stale result on the `no-changes` path.

**Known limitation:** Step 12 does not run for `workflow_scope == "implement"` or `"implement-review"`. If a user later opens a PR from one of those runs via PC.2, the doc-sync step did not run. Acceptable: those scopes are for small changes and stop before Step 12.

## Implementation Approach

**v1.0 shipped with inline editing** — the main loop did the drift analysis and applied the doc edits itself. **v1.1 (see the revision section below) replaced that with subagent delegation.**

1. Write the new skill file. Phases modeled on `bpf-update-claude-files` but pinned to this project's stack, doc names, and curated agent roster. Add the R3 agent guard up front. Use git-based staleness (no `Updated:` line injection). Standalone and embedded modes only.
2. Edit plan-and-do Step 12 to call the skill embedded, guard for no agents, read the result file, and commit real changes before PR creation.
3. Verify both skill files parse (frontmatter valid) and cross-references are correct.

## Test Strategy

No unit tests — these are Markdown skill files. Verification:
- `skill-reviewer` reviews both files for correct branching, mode detection, guard logic, result-file contract, and best practices.
- Manual read-through: agent guard (both modes), standalone flow, embedded flow, plan-and-do call site, result-file read/commit.
- Confirm the spec glob matches this project's 7 `SPECS*.md` files (root `SPECS.md` + 6 `SPECS-*.md`) and that `DOMAIN.md` has a mapping path (backend business changes).
- Confirm idempotency: describe a dry second run that finds nothing stale and exits.

## Non-Functional Requirements

- Writing style per CLAUDE.md: short, simple, active voice, fragments OK.
- No new runtime deps. Git + coreutils only.
- Idempotent: a second run with no source changes does nothing.

## Success Criteria

- `.claude/skills/update-claude-files/SKILL.md` exists and is self-consistent.
- Standalone: detects stale docs per-target from commits since each doc's last change; updates in place; commits; exits cleanly when nothing is stale.
- Embedded: scoped to the branch diff (`base:<sha>`, validated); always writes a result file; never prompts; never blocks the PR.
- No agents → warning + GitHub URL → stop, in both modes.
- plan-and-do Step 12 calls the skill, reads the result, and commits real doc changes before the PR is opened; commits nothing when there are no changes.

---

## Revision — v1.1: Subagent Delegation

**Source:** follow-up user request. Make the skill use subagents like `plan-and-do` does, so reviewer agents review files and coder/writer agents update them. v1.0 did all analysis and edits inline in the main loop.

**Motivation:** for large or multi-area drift, one main loop eyeballing diffs is less reliable than dispatching a domain specialist per area (parallel, deeper). This mirrors how `plan-and-do` delegates.

### R8 — Two-phase agent model

- Add `Task` to `allowed-tools`. Discover agents from the PHASE 2 glob (`.claude/agents/*.md`).
- **PHASE 5 — Review.** One domain reviewer per flagged target compares current code to the doc and returns a precise change list (section, current text with unique context, replacement). Reviewers do not edit. Mapping:

  | Flagged target | Reviewer |
  |---|---|
  | `SPECS-backend.md` | `be-reviewer` |
  | `SPECS-database.md` | `db-reviewer` |
  | `SPECS-frontend.md` | `fe-reviewer` |
  | `SPECS-ui.md` | `ui-reviewer` |
  | `SPECS-testing.md` | `be-test-reviewer` / `fe-test-reviewer` |
  | `SPECS-infrastructure.md` | `admin` (read-only) |
  | `DOMAIN.md`, `SPECS.md`, `CLAUDE.md` | `ba-reviewer` |
  | `.claude/agents/*.md` | `skill-reviewer` |

  Catch-all `ba-reviewer` if none matches — no flagged target is silently dropped.
- **PHASE 6 — Apply.** `ba-writer` applies spec/CLAUDE/DOMAIN edits; `skill-coder` applies agent-file edits. Preserve rule and Non-Goals unchanged (never create/delete a file).
- **PHASE 7 — Verify.** Self-check the edited files (tables well-formed, CLAUDE.md tables match disk, no file added/deleted).

### R9 — Fallback and mode behavior

- **Inline fallback.** If a mapped agent is absent from `existing_agents`, the skill does that step inline (its own Read/Grep + Edit). The R3 empty-roster guard is unchanged.
- **Modes.** Standalone shows the consolidated change plan and confirms (Apply all / Apply some / Cancel). Embedded auto-applies — still never prompts, always writes the result file, never blocks the PR. Both modes may dispatch: the skill runs in the main loop via the Skill tool, so `Task` works in either.

### v1.1 Success Criteria (in addition to the above)

- Reviewer agents produce the drift analysis; writer/coder agents apply it. Reviewers never edit.
- Every flagged target has a reviewer (incl. `SPECS-infrastructure.md`).
- Missing agent → inline fallback, not failure.
- Embedded still never prompts and never blocks the PR.
