---
name: "project:update-claude-files"
description: "Update .claude/agents, docs/specs, and CLAUDE.md from source code changes — updates existing docs in place, and creates missing ones or removes obsolete ones when the code clearly demands it. Use when features land, the schema changes, or infrastructure shifts. Keeps project documentation in sync with the code."
argument-hint: (optional special instructions)
version: 1.2.1
last-modified: 2026-07-07
allowed-tools:
  - Read
  - Write
  - Edit
  - Grep
  - Glob
  - Bash(git:*)
  - Bash(mkdir:*)
  - Bash(rm:*)
  - Task
  - AskUserQuestion
---

# Update Claude Files

You keep this project's docs in sync with its code. Targets: `.claude/agents/*.md`, `docs/specs/*.md` (the `SPECS*.md` set plus `DOMAIN.md`), and `CLAUDE.md`.

This project: Node/Express/TypeScript backend (`backend/`) + Angular 21 frontend (`frontend/`), Drizzle ORM over libSQL/SQLite. Curated spec set. Curated agent roster. Default: you update existing docs in place. You may create a missing spec or agent file, or delete an obsolete one, but only when the code clearly demands it — see Create & Delete Docs below.

## Writing Style

Short and brief. Short sentences. Simple words non-native speakers understand. No passive voice. Use sentence fragments. Match each doc's existing tone — specs mix German domain terms with English prose. Keep German domain terms (Firma, Person, Chance, …).

## FILE PATH DISPLAY RULE

Show full absolute paths. Get the root with `pwd` and prepend it. This lets users Command-click paths in the terminal.

## HOW TO ASK THE USER FOR DECISIONS

Use the `AskUserQuestion` tool for every prompt. Never print a question as prose and wait. Never read stdin. **Embedded mode never prompts** — see PHASE 0.

## Preserve Human-Authored Content

Specs and agents are hand-written. Update only the facts the code changes made stale. Keep manual sections, domain language, and structure. Never replace careful prose with generic phrasing. Prune a line only when the source clearly made it wrong (a removed route, a renamed column, a deleted entity).

## Create & Delete Docs

Default: update an existing file. Create or delete only when the code leaves no honest alternative.

**Create a spec** when a code area exists but no spec file covers it. Bootstrap case: if `docs/specs/` is empty or missing but source code exists, author the full spec set from scratch by reading the code — `SPECS.md` (the index), `DOMAIN.md`, and one `SPECS-*.md` per area the code has. Use the same file names this skill already expects (Step 3.1).

**Create an agent** only when `special_instructions` asks for it explicitly. Never invent an agent on your own.

**Delete a spec or agent** only when the area it documents is fully gone from the code — an entity removed, a whole subsystem deleted. Never delete a file just because it looks stale.

**Standalone:** always confirm creates and deletes with `AskUserQuestion` before applying. List exactly which files you will create and which you will delete.
**Embedded:** may create a clearly-missing spec. Never delete a file — too risky mid-PR. Note any file you would have deleted in the result file's Notes instead.

## Subagents

This skill delegates the work in two phases:

- **Review** (PHASE 5) — reviewer agents compare code to docs and report the exact drift, or flag a missing file to author or an obsolete file to remove. They do not edit.
- **Apply** (PHASE 6) — writer/coder agents apply those edits, creating or deleting files where flagged.

Agent discovery comes from PHASE 2 (`.claude/agents/*.md`). Both modes may dispatch: the skill runs in the main loop (via the Skill tool), so `Task` works in standalone and embedded alike.

If a needed agent is missing from `existing_agents`, the skill falls back to doing that step inline (its own Read/Grep + Edit).

**Dispatch narration.** Before every `Task` call, print one line: `→ Launching <agent>: <purpose>`. For a parallel batch, print one line per agent first.

---

## PHASE 0: ARGUMENTS & MODE DETECTION

Skill receives: `$ARGUMENTS`

Parse the first token:

- **`embedded`** → Embedded mode. plan-and-do calls this before it opens a PR. Optional second token `base:<sha>` scopes the run to the branch. Skip the header and every confirmation. Never call `AskUserQuestion`.
- **Empty / whitespace** → Standalone mode (default).
- **Any other text** → Standalone mode. Treat the text as `special_instructions` — focus the update there, but still cover every stale target.

There is no `help` or `doctor` mode.

### Plan Mode Check (standalone only)

**Embedded:** skip this check and the header. Jump to PHASE 1.

**Standalone:** if Claude Code is in plan mode, display:
```
Plan mode detected. This skill cannot run in plan mode.
Exit plan mode, then run: /update-claude-files
```
Then STOP.

### Skill Header (standalone only)

```
Update Claude Files (v1.2.1)
****************************

Sync .claude/agents, docs/specs, and CLAUDE.md with the code.
```

If `special_instructions` set, add:
```
Focus: [special_instructions]
```

---

## PHASE 1: INIT & VALIDATION

### Step 1.1: Embedded Housekeeping (embedded only, first)

Do this as the very first embedded action — before the git check — so any later STOP can still write its result file:

```bash
mkdir -p docs/state
rm -f docs/state/UPDATE-CLAUDE-FILES-RESULT.md
```

This clears any stale result from a previous run. The result file is gitignored — it never gets committed.

### Step 1.2: Git Check

```bash
git rev-parse --git-dir
```

If it fails (not a git repository):
- **Standalone:** display "Not a git repository. Run this skill inside the repo." Then STOP.
- **Embedded:** write `docs/state/UPDATE-CLAUDE-FILES-RESULT.md` with `status: error` (PHASE 8 schema, note "not a git repo"), then STOP. Never block the caller.

Capture `project_root` (`pwd`) and `current_branch` (`git branch --show-current`).

---

## PHASE 2: AGENT GUARD & DISCOVERY

Glob `.claude/agents/*.md`. Store matches as `existing_agents`. This set drives dispatch: PHASE 5 picks reviewer agents from it, PHASE 6 picks writer/coder agents. A target whose mapped agent is absent falls back to inline handling.

**If `existing_agents` is empty:**

Print this warning:
```
No agents found in .claude/agents/.

This skill updates the project's agents, specs, and CLAUDE.md together.
It needs the agent roster to run.

Install the agents first:
  https://github.com/atra-consulting/coding-with-ai-lab/tree/main/.claude/agents
```

- **Standalone:** STOP. Change nothing.
- **Embedded:** write a result file with `status: skipped-no-agents` (PHASE 8 schema), then STOP. Change nothing. The caller continues to the PR.

With no agents, this skill never edits a doc.

Only an empty **agent** roster stops the run here. An empty or missing `docs/specs/` with `existing_agents` present is not a stop condition — it's the bootstrap case (Step 3.3), where the skill authors the full spec set from scratch.

---

## PHASE 3: DISCOVER DOCS & DETERMINE SCOPE

### Step 3.1: Discover Doc Targets

- `existing_agents` — from PHASE 2 (`.claude/agents/*.md`).
- Glob `docs/specs/*.md` → `existing_specs`. Expect the fixed set: `SPECS.md`, `DOMAIN.md`, `SPECS-backend.md`, `SPECS-database.md`, `SPECS-frontend.md`, `SPECS-ui.md`, `SPECS-testing.md`, `SPECS-infrastructure.md`. Use the real names on disk — never invent `SPECS-back-end.md` style names.
- `CLAUDE.md` at the root.

### Step 3.2: Determine Changed Source Files

**Embedded mode:**

- If `base:<sha>` was given: validate it.
  ```bash
  git rev-parse --verify "<sha>^{commit}"
  ```
  - Valid → `changed_files = git diff <sha>...HEAD --name-only`. This is the branch's diff against its base.
  - Invalid / unreachable → print a warning ("base <sha> unreachable, falling back to timestamps") and use the standalone timestamp scan below.
- If no `base:<sha>` → use the standalone timestamp scan below.

**Standalone mode — per-target staleness:**

Check one target at a time. For each doc target `T`:
1. Get its last-change time: `git log -1 --format=%cI -- <T>`. If this returns nothing (never committed), mark `T` stale and analyze it fully.
2. `T` is stale if any commit since that time touched a source path that maps to `T` (PHASE 4 table). Get candidate source changes with:
   ```bash
   git log --since="<T-last-change>" --name-only --pretty=format:"" -- <T's mapped source globs> | sort -u
   ```
3. A non-empty result → `T` is stale.

Collect stale targets as `stale_targets`. Then apply roll-ups — these two targets have no direct source-glob rows for the categories below: if any other spec file (`SPECS-*.md` **or** `DOMAIN.md`) is stale, add `SPECS.md` (the index). If any backend, frontend, or build/config target (spec or agent) is stale, add `CLAUDE.md`.

### Step 3.3: Nothing To Do

**Bootstrap exception first.** If `docs/specs/` is empty or missing while `backend/` or `frontend/` source exists, this is not "nothing to do" — it's the bootstrap-create case (Create & Delete Docs). Treat the full fixed spec set (Step 3.1, limited to areas the code actually has) **plus `CLAUDE.md`** as `stale_targets` / the embedded target list, and skip the empty check below. `CLAUDE.md` always joins a bootstrap run — its `## Agents` and `## Specifications` tables need every file the run creates.

If `changed_files` is empty (embedded) or `stale_targets` is empty (standalone):
- **Standalone:** display "All docs up to date. No source changes since the last doc update." STOP.
- **Embedded:** write a result file with `status: no-changes` (PHASE 8 schema). STOP.

---

## PHASE 4: MAP CHANGES TO TARGETS

Map each changed / stale source path to its candidate doc targets. Edit a candidate only if the diff actually changed something that target documents (Preserve rule).

| Changed source | Candidate targets |
|---|---|
| `backend/src/db/**`, `backend/src/config/migrate.ts`, `backend/src/db/schema/**`, `backend/src/seed/**` | `SPECS-database.md`, agents `db-coder` + `db-reviewer`; `DOMAIN.md` **only if** relationship / cascade / delete semantics changed |
| `backend/src/services/**`, `backend/src/routes/**`, `backend/src/middleware/**` | `SPECS-backend.md`, agents `be-coder` + `be-reviewer`; `DOMAIN.md` **only if** business meaning changed (entities, roles, pipeline, delete behavior) |
| other `backend/**` (`app.ts`, `utils/**`, `config/**`) | `SPECS-backend.md`, `CLAUDE.md` |
| `frontend/src/app/**` (components, services, routes, guards) | `SPECS-frontend.md`, agents `fe-coder` + `fe-reviewer`, `CLAUDE.md` |
| `frontend/**` styling (`*.scss`, `styles.scss`, templates) | `SPECS-ui.md`, agents `ui-designer` + `ui-reviewer` |
| test files (`backend/src/test/**`, `**/*.spec.ts`, `**/*.e2e.ts`) | `SPECS-testing.md`, `*-test-*` agents |
| build / config / startup (`package.json`, `start.sh`, `*.config.*`, `tsconfig*.json`, `.github/workflows/**`) | `SPECS-infrastructure.md`, `CLAUDE.md`, agent `admin` |
| `.claude/agents/**` changed | the affected agent files, `CLAUDE.md` `## Agents` table |
| `docs/specs/**` changed | `CLAUDE.md` `## Specifications` table |

Roll-up rules:
- `SPECS.md` (root index) is a candidate whenever any other spec file is a candidate — it indexes them.
- `CLAUDE.md` is a candidate whenever any backend, frontend, or build target is a candidate.

**Create / delete triggers (non-bootstrap).** These fire even when `docs/specs/` is not empty — the partial case, one new or removed area among specs that otherwise still exist:
- A changed source path maps (by the table above) to a spec file that does not exist yet → add that spec as a **create** target, tagged `create`, plus `SPECS.md` and `CLAUDE.md` (roll-up rules).
- A changed source path shows an entity, route group, or whole subsystem fully removed (Grep confirms zero references left in code) → add its now-orphaned spec/agent file as a **delete** target, tagged `delete`.

Every other target from this table is tagged `update`. PHASE 5 and PHASE 6 branch on this tag.

**DOMAIN.md vs SPECS-database.md.** `DOMAIN.md` holds business meaning only — no schema. A pure schema change (column type, index, nullable) flags `SPECS-database.md` only. A change to relationships, cascade / delete behavior, roles, or the sales pipeline flags `DOMAIN.md` too. Read the diff to decide.

Build the final edit list: intersect candidate targets with `stale_targets` (standalone) or with what the diff actually changed (embedded). Track `agents_changed`, `specs_changed`, `claude_md_changed` for the summary.

**No target flagged.** If the final edit list is empty — the changes touched only files outside this mapping (e.g. only `.claude/skills/**`, `docs/**`, `.gitignore`) — there is nothing to update:
- **Standalone:** display "No documentation updates needed." STOP.
- **Embedded:** write `status: no-changes` (PHASE 8 schema). STOP.

This is separate from PHASE 3.3: there the changed/stale set was empty; here it was non-empty but mapped to no doc target.

**Bootstrap exception.** If Step 3.3's bootstrap case applied, `stale_targets` already holds the full spec set plus `CLAUDE.md` — this check never fires. Carry every spec file straight into the edit list, tagged `create` (`CLAUDE.md` is `update` — it already exists), and continue to PHASE 5.

---

## PHASE 5: REVIEW — REVIEWER AGENTS FIND DRIFT

Note: PHASE 4 already stopped if the edit list was empty, so here at least one target is flagged.

Pick a reviewer per flagged target from the table. Dispatch only reviewers whose target is flagged. Launch them in parallel via `Task`, narrated (Dispatch narration rule). If a mapped reviewer is not in `existing_agents`, review that target **inline** instead (Read the doc + Grep the code yourself).

| Flagged target | Reviewer agent |
|---|---|
| `SPECS-backend.md` | `be-reviewer` |
| `SPECS-database.md` | `db-reviewer` |
| `SPECS-frontend.md` | `fe-reviewer` |
| `SPECS-ui.md` | `ui-reviewer` |
| `SPECS-testing.md` | `be-test-reviewer` and/or `fe-test-reviewer` (by changed scope) |
| `SPECS-infrastructure.md` | `admin` (read-only reviewer — infra specialist) |
| `DOMAIN.md`, `SPECS.md`, `CLAUDE.md` | `ba-reviewer` |
| `.claude/agents/<name>.md` | `skill-reviewer` |

Every flagged target must have a reviewer row above — no target is silently dropped. If none matches, use `ba-reviewer` as the catch-all.

Each reviewer gets: the target doc path, the changed source files (from PHASE 3), its tag (`update`, `create`, or `delete` — from PHASE 4), and one of three instructions —

**`update` (file exists):**

> "Compare the current code to this doc. List **only** what the source changes made stale or missing. For each, give the exact edit: section, the current text with enough surrounding context to locate it **uniquely** in the file, and the replacement. Do not rewrite prose that is still correct. Preserve human-authored content. Do NOT edit any file — report the change list only."

**`create` (file does not exist yet — bootstrap or a new code area):**

> "This file does not exist yet: `<path>`. It should cover: `<one line — the area, from the PHASE 4 mapping>`. There is no diff to anchor to. Read the code and write the **FULL** file content, not a diff. Match the structure and tone of sibling docs already in `docs/specs/` or `.claude/agents/`. Do NOT create the file yourself — report the full content only."

**`delete` (area fully gone from the code):**

> "Confirm the area this file documents is fully gone from the code — Grep for zero remaining references. Report `confirm-delete`, or `keep` with why if the area still exists."

Collect each reviewer's output. Merge into one `change_plan` keyed by file, each entry carrying its tag (`update` / `create` / `delete`).

**"No change needed" collapse.** If every `update`-tagged reviewer reports "no change needed" (the code and docs already agree — the Preserve rule) **and** there are no `create` or `delete` targets: standalone displays "Docs already match the code."; embedded writes `status: no-changes`. STOP. A missing file is never "already matches the code" — any `create` or `delete` target always keeps the run going.

**Standalone:** show `change_plan` grouped by tag: Update — [files with their edits]; **Create — [exact file paths]**; **Delete — [exact file paths]**. List the create and delete paths explicitly, by name, before the prompt — this is the confirmation the Create & Delete Docs section promises. `AskUserQuestion`: 1-Apply all, 2-Apply some (pick which files), 3-Cancel. On "Apply some", drop the unpicked files from `change_plan` before PHASE 6. On Cancel: STOP, change nothing.
**Embedded:** no prompt. Apply all `update` and `create` targets. Drop `delete` targets from `change_plan` first — embedded never deletes (Create & Delete Docs). Note any dropped delete target in the result file's Notes.

PHASE 6 acts on the (possibly narrowed) `change_plan` only.

---

## PHASE 6: APPLY — WRITER / CODER AGENTS UPDATE FILES

Apply the approved `change_plan`, grouped by updater and by tag (`update` / `create` / `delete`). Dispatch in parallel via `Task`, narrated. If an updater agent is missing from `existing_agents`, apply that group **inline**: `create` → Write tool, `update` → Edit tool, `delete` → `git rm`.

| Files | Tag | Updater |
|---|---|---|
| `docs/specs/*.md` (`SPECS*`, `DOMAIN.md`), `CLAUDE.md` | `update`, `create` | `ba-writer` |
| `docs/specs/*.md` (`SPECS*`, `DOMAIN.md`) | `delete` | orchestrator, inline — never `ba-writer` (no Bash tool) |
| `.claude/agents/*.md` | `update`, `create`, `delete` | `skill-coder` (has Bash) |

Each updater gets its change list plus these rules:

- Apply the listed edits exactly. Use Edit (not full-file rewrite) to preserve unmatched sections.
- Preserve human prose, manual sections, structure, and German domain terms.
- For a `create` target: write the full file content the reviewer drafted, with the Write tool.
- Creates and deletes happen only after the standalone confirmation (embedded: `create` only — `delete` targets were already dropped in PHASE 5).
- For `CLAUDE.md`: also keep the `## Agents` table (one row per `.claude/agents/` file) and the `## Specifications` table (one row per `docs/specs/*.md`) in sync with the files on disk. Never drop a user-written rule.

**Deleting a spec.** `ba-writer` has no Bash tool — it cannot run `rm` or `git rm`. Do not route `delete`-tagged spec/`CLAUDE.md` targets to it. The orchestrator deletes these itself, inline, right here in PHASE 6:

```bash
git rm <path>
```

`git rm` deletes the file and stages the removal in one step. Agent-file deletes stay with `skill-coder` — it has Bash and can run `git rm` itself.

Collect the files each updater (and the orchestrator, for spec deletes) changed, created, and deleted. Track `agents_changed`, `agents_created`, `agents_deleted`, `specs_changed`, `specs_created`, `specs_deleted`, `claude_md_changed` for the summary.

Report: "Agents: [N] updated. Specs: [N] updated. CLAUDE.md: [sections or none]."

---

## PHASE 7: VERIFY

Quick self-check on the edited files:

- Each edited doc still parses — headings intact, tables well-formed.
- Any file created or deleted this run was warranted by the code — matches a Create & Delete Docs case, not a guess.
- `CLAUDE.md` `## Agents` and `## Specifications` tables list every file now on disk, including files created this run and excluding files deleted this run.
- Human-authored prose preserved — the diff touches only stale facts.

Fix any issue inline with the Edit tool. Then continue to PHASE 8.

---

## PHASE 8: COMMIT / RESULT

### Standalone

Commit the docs you changed, including any file you created or deleted:
```bash
git add -A -- .claude/agents docs/specs CLAUDE.md
git commit -m "docs: Update project documentation via update-claude-files"
```
`git add -A` on these paths stages new and deleted files too, not just edits. Stage only the areas you touched. If nothing changed, say "No changes to commit." Then print a summary:
```
=== Documentation Update Complete ===
Branch: [current_branch]
Agents updated:  [list or "none"]
Agents created:  [list or "none"]
Agents deleted:  [list or "none"]
Specs updated:   [list or "none"]
Specs created:   [list or "none"]
Specs deleted:   [list or "none"]
CLAUDE.md:       [sections or "none"]
Files modified:  [N]
```

### Embedded

Do NOT commit — the caller (plan-and-do Step 12) commits real changes. Always write the result file so the caller has one code path:

```bash
mkdir -p docs/state
```

Write `docs/state/UPDATE-CLAUDE-FILES-RESULT.md` (gitignored, never committed) with this exact schema:

```markdown
# Documentation Update Result

status: updated | no-changes | skipped-no-agents | error

## Agents
- Updated: [list or "none"]
- Created: [list or "none"]
- Deleted: [list or "none"]

## Specs
- Updated: [list or "none"]
- Created: [list or "none"]
- Deleted: [list or "none"]

## CLAUDE.md
- Sections updated: [list or "none"]

## Notes
[one or two lines: what changed and why, or why nothing changed, or the error. Embedded mode never deletes — if a file looked ripe for deletion, note it here instead.]

## Files Modified
[full paths, one per line, or "none"]
```

Never call `AskUserQuestion` in embedded mode. If anything fails mid-run, write `status: error` with the reason into the result file and return — never propagate a hard stop that could block the PR.

STOP — update complete.

---

## Context Recovery

No state file. All state comes from the project: re-glob `.claude/agents/` and `docs/specs/`, re-read `CLAUDE.md`, and re-run the PHASE 3 scan to rebuild scope.
