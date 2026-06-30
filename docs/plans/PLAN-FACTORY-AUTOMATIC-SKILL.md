# Implementation Plan: FACTORY-AUTOMATIC-SKILL

## Goal

Create a new project skill `/project:do-factory-automatic`. It runs headless. It claims the next agent task, judges build-or-reject, then rejects or builds it fully unattended. Modeled on `tasks/advanced/Skill für Übungsaufgabe 2.md`.

## Test Command

`cd backend && npm test` (Playwright).

**Note:** This change is a single markdown skill file under `.claude/`. No app code changes. So the change is **test-inappropriate** — no automated tests apply. Verification is structural (valid frontmatter, valid bash snippets, all spec steps present).

## Constraints (from user)

- Do NOT push to remote. Do NOT create a PR.
- Skill MUST load env vars from `backend/.env` and set them BEFORE any app API call.

## File

- New: `.claude/skills/do-factory-automatic/SKILL.md`

## Tasks

### 1. Frontmatter

- [ ] `name: "project:do-factory-automatic"`
- [ ] `description:` — one line. Headless autonomous skill. Claims next agent task, judges, rejects or builds via plan-and-do.
- [ ] `argument-hint:` — optional task id (e.g. `[task-id]`)
- [ ] `version: 1.0.0`, `last-modified: 2026-06-30`
- [ ] `allowed-tools:` — `Read`, `Bash(curl:*)`, `Bash(git:*)`, `Bash(source:*)`, `Bash(set:*)`, `Task`, `Skill`

### 2. Headless preamble

- [ ] State clearly: runs headless (`claude -p`), no human can answer. Never call `AskUserQuestion`. Never wait for input. Decide everything alone.
- [ ] State the API reference: `docs/API-TASKS.md` ("For skill authors" section).

### 3. Configuration section

- [ ] API base URL: env `APP_BASE_URL`, else `http://localhost:7070`.
- [ ] Auth header on every call: `Authorization: Bearer $AGENT_API_TOKEN`.
- [ ] Source priority: `EMAIL`, `GITHUB_ISSUE`, `ERROR_REPORT`, `APP_LOG`. Overridable with env `TASK_SOURCE` (then only that one).

### 4. Parameter handling

- [ ] If called with a number (e.g. `/do-factory-automatic 14`) → task id. Skip Step 1. Load that id in Step 2.

### 5. Step 0 — Load env vars (ALWAYS FIRST)

- [ ] Run even when a task id was passed.
- [ ] `if [ -f backend/.env ]; then set -a; source backend/.env; set +a; fi`
- [ ] Guard: if `AGENT_API_TOKEN` empty/unset → print error, `exit 1`. No API calls.

### 6. Step 1 — Claim next task

- [ ] Skip if task id passed.
- [ ] For each source (or only `$TASK_SOURCE`): `GET /api/agent-tasks/next?source=<SRC>` with bearer header, capture body + http code.
  - 200 → parse `id`, `title`, `body`, `metadata`. Task now `IN_PROGRESS`. Stop trying sources. Go to Step 2.
  - 204 → next source.
  - all 204 → print "Keine offenen Aufgaben." and exit.
  - other → print error and exit.
- [ ] If task id passed instead: `GET /api/agent-tasks/<id>`.
  - 200 → parse `id`, `title`, `body`, `metadata`, `status`.
    - status != `OPEN` → print message, exit.
    - status == `OPEN` → `POST /api/agent-tasks/<id>/start`. 200 → Step 2. other → print error, exit.
  - 404 → "Aufgabe nicht gefunden.", exit.
  - other → print error, exit.

### 7. Step 2 — Judge: build or reject

- [ ] Dispatch the `requirements-reviewer` subagent (via Task tool). Pass `title`, `body`, `metadata`.
- [ ] Ask it: one clear concrete change? all facts present? fits this CRM codebase (Express/Drizzle or Angular)? obvious right approach (no product decision, no guessing)?
- [ ] Subagent also checks the task against real code — if the problem does not exist in current code, reject.
- [ ] Subagent returns a clear verdict: "gut genug zum Bauen" OR "ablehnen" with a specific, actionable reason.
- [ ] Follow the verdict without deviation.

### 8. Step 3a — Reject

- [ ] No question channel. `POST /api/agent-tasks/<id>/reject` with `{"comment": "<specific, actionable reason>"}`.
- [ ] Generic comments not acceptable. Do NOT call plan-and-do. Then exit.

### 9. Step 3b — Build via plan-and-do, unattended

- [ ] Invoke `/project:plan-and-do "<task body + concrete details from title/metadata>"`.
- [ ] Prepend the standing autonomous instructions (verbatim from spec) so every checkpoint is pre-authorized:
  - Fully autonomous, never call AskUserQuestion, never wait.
  - PRD decision: **skip PRD**, go straight to plan.
  - Plan approval: **"Approve, implement, and review"** (no PR).
  - Every review-finding checkpoint: **approve all fixes**.
  - Any other checkpoint: **Continue** / recommended option.
  - Keep planning files. Never stop to ask.
  - If tests/build fail and cannot be auto-fixed after a reasonable attempt → abort, go to Step 3a (reject with a comment explaining the failure) instead of hanging.
- [ ] Run plan-and-do to completion (implement → test → review). **No PR. No push.** (matches user constraint and spec.)

### 10. Step 4 — Mark task done

- [ ] **Adaptation:** Spec mentions a PR link, but this skill creates no PR. So the done comment carries a short summary + the branch name (not a PR link).
- [ ] `POST /api/agent-tasks/<id>/done` with `{"comment": "<short summary of what was built> + branch: <branch-name>"}`.
- [ ] Then exit. One task per run.

### 11. Style

- [ ] German body (match the source spec language and `tasks/` docs).
- [ ] Short sentences. Simple words. No passive voice (per CLAUDE.md writing style).

## Verification

- [ ] Frontmatter valid YAML; `name` is `project:do-factory-automatic`.
- [ ] All bash snippets syntactically valid.
- [ ] All 5 spec steps (0–4) present and faithful.
- [ ] Env load + token guard precede every API call.
- [ ] No PR / no push anywhere.
- [ ] skill-reviewer pass (Step 8 phase review).

## Tests

Test-inappropriate (markdown skill file, no app code). No Playwright/Karma tests added. Verification is structural + skill-reviewer review.
