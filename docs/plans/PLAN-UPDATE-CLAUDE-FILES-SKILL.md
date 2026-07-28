# Implementation Plan: UPDATE-CLAUDE-FILES-SKILL

Implements `docs/prds/PRD-UPDATE-CLAUDE-FILES-SKILL.md`.

## Test Command

No automated test suite. These are Markdown skill files under `.claude/`. Test-inappropriate for the app's Playwright/Karma suites. Verification: `skill-reviewer` review + manual read-through of both files.

## Files Touched

- **New:** `.claude/skills/update-claude-files/SKILL.md`
- **Edit:** `.claude/skills/plan-and-do/SKILL.md` (Step 12 only)
- **Edit:** `.gitignore` (untrack the embedded result file)

No app code, no DB, no frontend. Single domain: `.claude/**` → `skill-coder` / `skill-reviewer`.

## Tasks

### 0. Untrack the embedded result file (prevents PC.1 sweep)

- [ ] `docs/state/UPDATE-CLAUDE-FILES-RESULT.md` is a **tracked** leftover from old `bpf` runs. The embedded skill rewrites it every run. If tracked, plan-and-do's PC.1 (`git add -u` "Final cleanup") would commit it even on the `no-changes`/`skipped` path — breaking R7's "commit nothing" contract.
- [ ] Add `docs/state/UPDATE-CLAUDE-FILES-RESULT.md` to `.gitignore`, then `git rm --cached docs/state/UPDATE-CLAUDE-FILES-RESULT.md`. Commit. Now the result file lives on disk only; no phase or cleanup can commit it.

### 1. Write `.claude/skills/update-claude-files/SKILL.md`

- [ ] Frontmatter: name `project:update-claude-files`, description, `argument-hint`, version `1.0.0`, `last-modified`, `allowed-tools` = Read, Write, Edit, Grep, Glob, `Bash(git:*)`, `Bash(ls:*)`, `Bash(mkdir:*)`, `Bash(rm:*)`, AskUserQuestion. (R1)
- [ ] Writing-style + file-path-display + AskUserQuestion preamble (mirror bpf skill and this project's style).
- [ ] **PHASE 0 — Arguments & mode detection.** Empty/free-text → standalone. First arg `embedded` (+ optional `base:<sha>`) → embedded. No help/doctor. Plan-mode check for standalone only; embedded skips header. (R5, R6, Non-Goals)
- [ ] **PHASE 1 — Init & validation.** `git --version` + `git rev-parse --git-dir`; standalone stops if not a git repo. Capture `project_root`, `current_branch`. **Embedded only, first:** `mkdir -p docs/state` then `rm -f docs/state/UPDATE-CLAUDE-FILES-RESULT.md` — so the guard in Phase 2 can write a skip-result on a fresh checkout. (R5, R6 guard + housekeeping order)
- [ ] **PHASE 2 — Agent guard.** Glob `.claude/agents/*.md`. If none: standalone prints warning + the URL `https://github.com/atra-consulting/coding-with-ai-lab/tree/main/.claude/agents` and STOPs; embedded writes result `status: skipped-no-agents`, prints warning, STOPs. (R3)
- [ ] **PHASE 3 — Discover docs + determine scope.**
  - Discover targets: glob `.claude/agents/*.md` and `docs/specs/*.md`; note `CLAUDE.md`. Pin this project's exact doc names (`SPECS-backend.md`, `DOMAIN.md`, …). (R2)
  - Embedded scope: if `base:<sha>`: `git rev-parse --verify "<sha>^{commit}"` → valid: `git diff <sha>...HEAD --name-only`; invalid: warn + timestamp fallback. No base: timestamp fallback. (R6)
  - Standalone scope: per-target staleness. For each doc target T: `git log -1 --format=%cI -- <T>` = last change; T stale if any commit since then touched T's own mapped source globs. No git history for T → stale. (R5)
  - If nothing stale/changed: standalone says so + STOP; embedded writes `status: no-changes` result + STOP. (R5, R6)
- [ ] **PHASE 4 — Map changes to targets.** Encode the R4 source→target table verbatim, incl. `SPECS.md` index rule, `CLAUDE.md` roll-up rule, and the `DOMAIN.md` vs `SPECS-database.md` business-vs-schema rule. Pin this project's exact doc names and agent roster.
- [ ] **PHASE 5 — Update `.claude/agents/`.** Update only flagged, existing agent files' content (scope, key locations, standards, `## Specifications` list). Never create/delete an agent file. Preserve hand-written prose. Keep `CLAUDE.md` `## Agents` table in sync. **Standalone: preview the change + confirm before large edits.** Embedded applies directly, no prompt. (R2, R5, R6, Non-Goals)
- [ ] **PHASE 6 — Update `docs/specs/`.** Update only flagged, existing spec files in place. Never create/delete a spec file. Preserve manual sections + domain language. Keep `SPECS.md` index accurate. **Standalone: preview + confirm before large edits.** Embedded applies directly. (R2, R5, R6)
- [ ] **PHASE 7 — Update `CLAUDE.md`.** Update flagged sections; keep `## Agents` + `## Specifications` tables in sync with files on disk. Preserve user rules. **Standalone: show diff + confirm.** Embedded applies directly. (R2, R5, R6)
- [ ] **PHASE 8 — Commit / result.**
  - Standalone: apply, commit `docs: Update project documentation via update-claude-files`, print summary. (R5)
  - Embedded: **always** write `docs/state/UPDATE-CLAUDE-FILES-RESULT.md` (uncommitted) with fixed schema — `status` (`updated` | `no-changes` | `skipped-no-agents` | `error`), agents changed, specs changed, CLAUDE.md sections, files-modified list. Never prompt. On internal error: log to result file, return (never block the PR). (R6)

### 2. Edit `.claude/skills/plan-and-do/SKILL.md` — Step 12

- [ ] Replace Step 12.2 body so that, before POST-COMPLETION PR creation:
  - `agents_available` + `is_git_repo`: invoke the skill with the literal call `/update-claude-files "embedded base:[original_head]"` (mirrors Step 10.1's `/review "embedded base:[original_head]"`; substitute the real SHA from `config.original_head`). Then read `docs/state/UPDATE-CLAUDE-FILES-RESULT.md`; if `status` shows real changes, stage the changed docs, commit `docs: Update project documentation. [task_key]` (+ `PRD:` footer when a PRD exists). If `no-changes`/`skipped-no-agents`: display, commit nothing, continue. Do NOT stage the result file (gitignored per Task 0).
  - `is_git_repo` + no agents: print R3 warning + URL, skip, continue (do not block PR).
  - not a git repo: keep existing manual-scan fallback.
  - Note the known limitation: Step 12 runs only for `workflow_scope == "full"`. (R7)
- [ ] Trim Step 12.1's scan text: the new skill owns `.claude/agents/`, `docs/specs/`, and `CLAUDE.md`. Drop `docs/prds/` from the auto-update scope (out of scope per Non-Goals). Keep 12.1's manual-scan wording only for the non-git fallback path.

### 3. Verification

- [ ] Frontmatter of both files parses (valid YAML, closing `---`).
- [ ] Cross-references correct: skill name, result-file path, `base:[original_head]` matches how Step 10.1 already calls `/review`.
- [ ] Spec glob matches disk: 7 `SPECS*.md` (root `SPECS.md` + 6 `SPECS-*.md`) + `DOMAIN.md`.
- [ ] `git ls-files docs/state/UPDATE-CLAUDE-FILES-RESULT.md` returns nothing (untracked + gitignored).
- [ ] `skill-reviewer` review; fix findings.

## Tests (verification checks, no runner)

### Guard
- [ ] No `.claude/agents/*.md` → standalone: warning + URL + stop; embedded: `skipped-no-agents` result + stop.

### Standalone
- [ ] Per-target staleness uses each target's own last-change time and own source globs.
- [ ] Nothing stale → clean exit, no commit.
- [ ] Idempotency: immediate second run finds nothing stale.

### Embedded
- [ ] Valid `base:<sha>` → scope = `git diff base...HEAD`.
- [ ] Missing/invalid `base` → timestamp fallback, warn on invalid.
- [ ] Always writes a result file (updated / no-changes / skipped / error).
- [ ] Never calls AskUserQuestion; internal error never propagates.

### plan-and-do integration
- [ ] Step 12 calls the skill embedded before PC.2 for `full` scope.
- [ ] Reads result; commits only real changes; `no-changes` commits nothing.
- [ ] No-agents and non-git paths do not block the PR.
