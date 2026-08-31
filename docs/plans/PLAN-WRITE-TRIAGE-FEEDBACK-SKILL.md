# Implementation Plan: WRITE-TRIAGE-FEEDBACK-SKILL

## Goal

Write a new project skill `/write-ticket`. Modeled on `tasks/advanced/Skill für Übungsaufgabe 2.md` and its shipped sibling `.claude/skills/do-factory-automatic/SKILL.md`. The skill triages one piece of feedback (an agent task) into a **new Kanban ticket**.

## Test Command

`n/a` — the deliverable is one Markdown skill file. Validated by the `skill-reviewer` agent, not an automated suite.

## Deliverable

One new file: `.claude/skills/write-ticket/SKILL.md`.

## Key design (please confirm at the checkpoint)

The skill keeps the template's shape (headless, autonomous, no `AskUserQuestion`). It claims one agent task, judges it, then **always** produces a Kanban ticket. It differs from `do-factory-automatic` on the outcome:

| Aspect | do-factory-automatic (template) | /write-ticket (this skill) |
|--------|--------------------------------|-------------------------------|
| Feedback source | agent task (`/api/agent-tasks`) | same |
| Judgment | `requirements-reviewer` subagent | same |
| Good enough → | builds via `plan-and-do`, opens nothing | creates ticket, leaves it unchanged (3b) |
| Not good enough → | rejects the agent task | creates ticket, comments to demand missing info (3a) |
| Always produces | a build or a reject | a new **ticket** (`DEFINITION`, owner `HUMAN`) |
| plan-and-do / PR / push | builds, no PR | none — no build, no push, no PR |
| Source agent task at end | done or rejected | marked **done**, comment links the new ticket |

### Assumptions baked into the plan (change any at the checkpoint)

1. **Feedback source = the agent-task queue** (`EMAIL`, `GITHUB_ISSUE`, `ERROR_REPORT`, `APP_LOG`), exactly like the template. Claim next, or load by numeric id parameter.
2. **A ticket is always created**, in both the 3a and 3b branches — the ticket is the deliverable. Creation happens in Step 3 (common), then 3a/3b act on it.
3. **The source agent task is marked `done`** at the end (Step 4) in both branches, with a comment naming the new ticket id. Triaging into a ticket *is* the resolution — the agent task is never rejected.
4. **Ticket create + comment use the agent token / loopback — no admin login.** As of the backend change in commit `cf58de4`, `POST /api/tickets` and `POST /:id/comments` accept `requireAgentTokenOrAdminSession` (agent token · loopback bypass · admin session). The skill sends the same `Authorization: Bearer $AGENT_API_TOKEN` it already uses for the agent-task calls — one token, both queues. No admin session, no cookie jar. Comments post as `author=HUMAN` (there is no author field).
5. **Ticket owner is always `HUMAN`.** New tickets are born `DEFINITION` + `HUMAN` from `POST /api/tickets`, and the skill leaves them that way — a human refines the intake ticket. No `PATCH /:id/owner` call. (This overrides the original brief's "AI zugewiesen", per the user's plan edit.)
6. **Ticket `type`** is required by `POST /api/tickets`. The skill infers it from the feedback: defect → `BUG`, maintenance → `CHORE`, else `FEATURE` (default). The `requirements-reviewer` verdict already reasons about the change; the skill maps its finding to a type, defaulting to `FEATURE` when unsure.
7. **Autonomous / headless**, like the template: never call `AskUserQuestion`, decide everything, exit on any blocker.

## Tasks

### 1. Skill file scaffold

- [ ] Create `.claude/skills/write-ticket/SKILL.md`.
- [ ] YAML frontmatter matching `do-factory-automatic` conventions:
  - `name: "project:write-ticket"`
  - `description:` one line — headless skill that triages one agent-task feedback item into a new Kanban ticket (Definition, owner AI); comments to demand missing info when the feedback is too thin.
  - `argument-hint: "[task-id]"`
  - `version: 1.0.0`, `last-modified: 2026-07-08`
  - `allowed-tools: [Read, Bash, Task]` (no `Skill` — no `plan-and-do` call; no push/PR).

### 2. Step 0 — Load env vars (from `backend/.env`)

- [ ] Copy the template's Step 0 verbatim in intent: `source backend/.env` (guarded by `[ -f backend/.env ]`, `set -a`/`set +a`) before any API call.
- [ ] Hard-check `AGENT_API_TOKEN`. If empty/unset → print a clear error and exit. No further steps, no API calls.
- [ ] Note: `APP_BASE_URL` defaults to `http://localhost:7070`.

### 3. Step 1 — Claim / load the feedback (agent task)

- [ ] Claim-next flow across sources in priority order (`EMAIL`, `GITHUB_ISSUE`, `ERROR_REPORT`, `APP_LOG`), overridable via `TASK_SOURCE`. `GET /api/agent-tasks/next?source=…` with the bearer token.
  - `200` → keep `id`, `title`, `body`, `metadata` (now `IN_PROGRESS`); stop trying sources.
  - `204` → try next source. All `204` → "Keine offenen Aufgaben." and exit.
  - other → error, exit.
- [ ] Numeric-parameter flow: `GET /api/agent-tasks/<id>`, require `status == OPEN`, then `POST /…/start`. Same guards/exits as the template.

### 4. Step 2 — Judge with requirements-reviewer

- [ ] Dispatch the `requirements-reviewer` subagent (Task tool) with `title`, `body`, `metadata`.
- [ ] Ask for a binary verdict — **"gut genug zum Bauen"** vs **"ablehnen"** — plus a specific, actionable reason, and (new) a suggested ticket `type`.
- [ ] Follow the verdict without deviation.

### 5. Step 3 — Create the ticket (always)

- [ ] `POST /api/tickets` with the bearer token (`Authorization: Bearer $AGENT_API_TOKEN`) and `{"type": <inferred>, "title": <from feedback>, "body": <feedback body + salient title/metadata>}`. Expect `201`; keep the new ticket id. On non-201 → error, exit. The ticket lands `DEFINITION` + owner `HUMAN` — the exact target state. No owner change.

#### Step 3a — Not good enough → demand missing info

- [ ] `POST /api/tickets/<newId>/comments` with the bearer token and `{"body": "<exactly what is missing or unclear, so a human can complete it>"}`. Generic text ("unclear") is not acceptable — name the gaps concretely, from the reviewer's reason. (Comment posts as `author=HUMAN`.)

#### Step 3b — Good enough → leave the ticket unchanged

- [ ] Do nothing further to the ticket. No comment, no status/owner change.

### 6. Step 4 — Mark the source agent task done

- [ ] `POST /api/agent-tasks/<taskId>/done` (bearer token) with `{"comment": "Triagiert in Ticket #<newId> (Definition, Mensch). <3a: Rückfrage im Ticket hinterlegt | 3b: bereit zur Verfeinerung>."}`.
- [ ] Then exit. One feedback item per run.
- [ ] Explicitly: **no `git push`, no PR, no `plan-and-do`.**

### 7. Prose & conventions

- [ ] German prose, matching the template and `do-factory-automatic` voice.
- [ ] Follow CLAUDE.md writing style: short sentences, simple words, no passive voice, sentence fragments OK.
- [ ] Every `curl` shows how to read body + HTTP code and how to branch on the code, like the template.
- [ ] State the admin-endpoint auth split clearly: agent token for `agent-tasks/*`; admin session for `tickets/*` writes.

## Verification

- [ ] `skill-coder` writes the file; `skill-reviewer` reviews it (branching coverage, correct endpoints/auth split, headless-safety, no `AskUserQuestion`, no push/PR).
- [ ] Manual read-through against this plan and `SPEC-API-TICKETS.md` endpoint contracts.
- [ ] Confirm the frontmatter parses and `allowed-tools` lists only what the steps use.

## Out of scope

- No changes to backend/frontend code, DB, or specs.
- No calling `plan-and-do`. No branch/PR/push from the skill.
- No new automated tests (Markdown skill; reviewed by `skill-reviewer`).
