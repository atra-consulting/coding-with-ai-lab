# Implementation Plan: PLAN-AND-DO-TICKET-MODE

Two changes. No app code. Markdown + skill file + file moves only.

## Test Command
No app code changed. Verify with a link/existence check (Step 3 below), not the app suite:
```bash
test -f docs/specs/SPEC-API-TASKS.md && test -f docs/specs/SPEC-API-TICKETS.md \
  && ! grep -rn "docs/API-TASKS.md\|docs/API-TICKETS.md\|](API-TASKS.md)\|](API-TICKETS.md)\|](../API-TASKS.md)\|](../API-TICKETS.md)" \
       CLAUDE.md docs/TOOLS.md docs/SKILLS.md docs/specs .github .claude/skills tasks 2>/dev/null \
  && echo "LINK CHECK PASS"
```

## Tasks

### 1. Move the two API docs to docs/specs/ (git mv, keep history)

- [ ] `git mv docs/API-TASKS.md docs/specs/SPEC-API-TASKS.md`
- [ ] `git mv docs/API-TICKETS.md docs/specs/SPEC-API-TICKETS.md`
- [ ] Fix internal `../` links inside `SPEC-API-TASKS.md` (now one dir deeper): lines with `](../.github/...)` and `](../.claude/...)` → `](../../...)` (3 links: github-issue-agent.yml x2, agent-github-refinement.md).
- [ ] Fix cross-file text refs inside the moved files:
  - `SPEC-API-TASKS.md`: `docs/API-TICKETS.md` → `docs/specs/SPEC-API-TICKETS.md` (2 spots: "What's different from tickets", "See also").
  - `SPEC-API-TICKETS.md`: `docs/API-TASKS.md` → `docs/specs/SPEC-API-TICKETS`... → `docs/specs/SPEC-API-TASKS.md` (2 spots).
- [ ] Update the "Source of truth" / "Full requirement-level spec" plain-text `docs/prds/...` mentions: leave as-is (still valid absolute-from-root text).

### 2. Update LIVE references to the moved files (leave archival records untouched)

Update only current/live docs. Do NOT touch `docs/plans/*`, `docs/state/*`, `docs/reviews/*`, `docs/prds/*` — those are historical records of past work.

- [ ] `CLAUDE.md` lines 9, 14: `docs/API-TASKS.md` → `docs/specs/SPEC-API-TASKS.md` (link + text).
- [ ] `CLAUDE.md` line 18: `docs/API-TICKETS.md` → `docs/specs/SPEC-API-TICKETS.md`.
- [ ] `docs/TOOLS.md` line 44: `[docs/API-TASKS.md](API-TASKS.md)` → `[docs/specs/SPEC-API-TASKS.md](specs/SPEC-API-TASKS.md)`.
- [ ] `docs/TOOLS.md` line 61: ticket equivalent.
- [ ] `docs/SKILLS.md` line 85: `[docs/API-TASKS.md](API-TASKS.md)` → `specs/SPEC-API-TASKS.md`.
- [ ] `docs/specs/DOMAIN.md` line 90: `[docs/API-TASKS.md](../API-TASKS.md)` → `[docs/specs/SPEC-API-TASKS.md](SPEC-API-TASKS.md)` (now same dir).
- [ ] `docs/specs/SPECS-backend.md` line 152: `[docs/API-TICKETS.md](../API-TICKETS.md)` → `[docs/specs/SPEC-API-TICKETS.md](SPEC-API-TICKETS.md)`.
- [ ] `tasks/advanced/Skill für Übungsaufgabe 2.md` line 7: `docs/API-TASKS.md` → `docs/specs/SPEC-API-TASKS.md`.
- [ ] `tasks/advanced/Skill für Übungsaufgabe 4.md` line 7: `docs/API-TICKETS.md` → `docs/specs/SPEC-API-TICKETS.md`.
- [ ] `.claude/skills/do-factory-automatic/SKILL.md` line 20: `docs/API-TASKS.md` → `docs/specs/SPEC-API-TASKS.md`.
- [ ] `.github/workflows/agent-task-runner.yml` line 25 (comment): `docs/API-TASKS.md` → `docs/specs/SPEC-API-TASKS.md`.

### 3. Add TICKET MODE to `.claude/skills/plan-and-do/SKILL.md`

Accept a ticket reference as input and drive the Kanban ticket API. Reference spec: `docs/specs/SPEC-API-TICKETS.md`.

**Terminology map (user words → German board column → API), documented in the skill.**
Verified against `frontend/.../ticket-detail.component.ts` + `ticket-board.component.ts` — the board shows **German labels only**, no English:

| User term | German board column | `status` enum |
|-----------|---------------------|---------------|
| "Ready" column | **Zu bereit** | `TODO` |
| "In Progress" | **In Arbeit** | `IN_PROGRESS` |
| "Blocked" | **Wartet** | `ON_HOLD` |
| "Done" | **Erledigt** | `DONE` |
| (intake, unused here) | Definition | `DEFINITION` |

Owner is a **separate field** (`AI` or `HUMAN`), not a column/label. Claimable = `status=TODO` **AND** `owner=AI`.
Assign to "Human" = `owner=HUMAN` (the `/ask` call does this automatically).
Full status enum (from `backend/src/config/migrate.ts` CHECK constraint): `DEFINITION, TODO, IN_PROGRESS, ON_HOLD, DONE`.

**Input detection (augment Step 1 / PARAMETER PARSING):**
- [ ] If the trimmed input matches `…/admin/tickets/<id>` (any host/port) → ticket mode; extract `<id>`.
- [ ] Else if the trimmed input is a bare positive integer `^\d+$` → ticket mode; `<id>` = the number.
- [ ] Else → existing freeform behavior, unchanged.
- [ ] Set `ticket_mode=true`, `ticket_id`, `ticket_url` (rebuild `http://localhost:7200/admin/tickets/<id>` when only a number was given).
- [ ] API base default `http://localhost:7070`; token from `backend/.env` `AGENT_API_TOKEN` (sent as `Authorization: Bearer`), else rely on localhost loopback bypass. Add `Bash(curl:*)` to `allowed-tools`.

**New `## TICKET MODE` section (referenced from Steps 1, 4, 13):**
- [ ] **Resolve** — `GET /api/tickets/:id`. 404 → tell user, STOP.
- [ ] **Verify claimable** — require `status=TODO` AND `owner=AI`. If not, display the actual status/owner and STOP (never process a non-Ready/AI ticket). This enforces "only works on tickets with the AI label in the Ready column."
- [ ] **Derive** `task_key = TICKET-<id>-<kebab-title>`; `user_description` = ticket title + body (+ any prior comment thread).
- [ ] **Claim → In Progress** — `POST /api/tickets/:id/start` (TODO+AI → IN_PROGRESS). Then leave a state-change comment (see comment strategy).
- [ ] Then run the normal plan-and-do flow (branch, plan, implement, test, review) with the ticket body as the task.
- [ ] **Finish → Done** — on successful completion: `POST /api/tickets/:id/done` with a summary `comment` (the Done comment is the state-change comment).
- [ ] **Question / error → Blocked + Human** — on an unanswerable question or unrecoverable error: `POST /api/tickets/:id/ask` with `{question}` = the question or error text → ON_HOLD + owner=HUMAN. The `/ask` call posts an AGENT comment (the state-change comment) and reassigns to Human in one shot.

**Comment strategy — "leave a comment for every state change" (KEY DECISION):**
The agent API carries a comment on `/done` (comment field) and `/ask` (question → AGENT comment), but `/start` (→ In Progress) has **no** comment field. To comment on the claim too, the skill opens a short-lived **admin session** (`POST /api/auth/login` with `admin/admin123` from the workshop users) and posts the In-Progress notice via `POST /api/tickets/:id/comments`. Transitions still use the agent verbs; only the extra In-Progress comment uses the admin session.
- **Recommended (this plan):** agent verbs for transitions + one admin-session comment on claim. Fully meets "comment on every state change."
- Alternative if you prefer no admin login: comment only where the agent API allows (Done, Blocked) and record the claim via `pickedUpAt` only. Pick this at the checkpoint by choosing "Edit".

**Wire into existing steps:**
- [ ] Step 1 / parsing: ticket detection + resolve + verify.
- [ ] Step 3.3 state JSON: add `ticket_mode`, `ticket_id`, `ticket_url`, `ticket_api_base` to `config`.
- [ ] Step 4 (after branch): if `ticket_mode`, claim + In-Progress comment.
- [ ] POST-COMPLETION / Quit / error paths: if `ticket_mode`, Done+comment on success; Ask (Blocked+Human)+comment on question/error/quit.
- [ ] Bump `version` and `last-modified` in the SKILL.md frontmatter; note the change in the usage header comment.

## Verification
- [ ] `git mv` used → history preserved (`git log --follow`).
- [ ] Link check command (top) prints `LINK CHECK PASS` — no live file points to old paths.
- [ ] `SPEC-API-TASKS.md` `../../` links resolve (github workflow, prompt files exist at target).
- [ ] `plan-and-do/SKILL.md` still valid: frontmatter parses, `allowed-tools` includes `Bash(curl:*)`, TICKET MODE section self-consistent with `SPEC-API-TICKETS.md` endpoints.
- [ ] skill-reviewer + ba-reviewer pass.

## Tests
Docs/skill change — no unit tests authored. Verification is the link check + reviewer pass above.
