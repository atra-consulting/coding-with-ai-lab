# Implementation Plan: DO-SEMI-AUTOMATIC-SKILL

## Goal

Write a new project skill **`/do-semi-automatic`**: a headless, unattended skill that works ONE Kanban ticket per run (claim → judge → send back or build). Modeled on `tasks/advanced/Skill für Übungsaufgabe 4.md` and `.claude/skills/do-factory-automatic/SKILL.md`, with the user's state-machine differences.

Plus a supporting backend + spec change so the skill needs **no admin session** — it drives the whole flow with the agent token / loopback bypass ("local workaround").

## Test Command

`cd backend && npm test` (Playwright). Runs the backend API suite, incl. `backend/src/test/tickets.spec.ts`. Applies to the backend auth change. The skill markdown itself has no test suite — it is validated by the `skill-reviewer` subagent.

## Key design decisions

1. **Skill name = `do-semi-automatic`.** Follows the user's exact wording (dir `.claude/skills/do-semi-automatic/`, frontmatter `name: "project:do-semi-automatic"`). (Sibling is `do-factory-automatic`; exercise doc says `do-factory-semi-automatic` — user's wording wins.)

2. **State machine (per the user's differences).**
   - **Schritt 1** — eligible ticket must be `TODO` ("Ready"/"Zu bereit") **and** `owner=AI`.
   - **Schritt 3a** (requirements not good enough) — ticket → **`DEFINITION`** + `owner=HUMAN` (NOT the reference's `/ask`→`ON_HOLD`).
   - **Schritt 3b** (build) — ticket → **`IN_PROGRESS`**. Mid-build unanswerable question/problem → **`ON_HOLD`** ("Blocked") + `owner=HUMAN` + comment. Finished → **`DONE`**.
   - **Every status change** gets a small ticket comment.

3. **`IN_PROGRESS` only on the build path.** Schritt 1 only *reads/peeks* the ticket (does not claim). `POST /:id/start` (→`IN_PROGRESS`) happens at the start of Schritt 3b. The reject path (3a) never enters `IN_PROGRESS`.

4. **No admin session — agent token / loopback "local workaround" everywhere.** (Revised per user.) Two admin-only endpoints the skill needs get the same `requireAgentTokenOrAdminSession` treatment already used by `POST /`, `GET /:id`, `PATCH /:id/owner`, `POST /:id/comments`:
   - **`PATCH /:id/status`** — needed for the Schritt 3a `→DEFINITION` move.
   - **`GET /board`** — needed to peek the next `TODO`+`AI` ticket without claiming (no-param mode).
   - Change is backward compatible: the admin dashboard still works via session; local skills work via agent token or loopback bypass; production without a token/session still `401`/`403`.

## Tasks

### 1. Backend — extend the local workaround (be-coder)

File: `backend/src/routes/tickets.ts`. `requireAgentTokenOrAdminSession` is already imported.
- [ ] `GET /board` (currently `requireAuth, requireRole('ADMIN')`) → `requireAgentTokenOrAdminSession`. Update the "must come before /:id" comment to note skill/loopback access.
- [ ] `PATCH /:id/status` (currently `requireAuth, requireRole('ADMIN')`) → `requireAgentTokenOrAdminSession`. Add a comment mirroring the other skill-accessible endpoints.
- [ ] Leave `GET /`, `GET /summary`, `POST /reset`, `POST /:id/wont-do`, `POST /:id/hand-to-ai` admin-only (unchanged).
- [ ] No service-layer change — `getBoard()` and `setStatus()` already exist and are auth-agnostic.

### 2. Spec — document the workaround (be-coder / ba)

File: `docs/specs/SPEC-API-TICKETS.md`.
- [ ] **Authentication** section: move `GET /board` and `PATCH /:id/status` from the "Admin-only" list into the "agent token · loopback bypass · admin session" list. Update the intro sentence listing which write endpoints skills use.
- [ ] Endpoint sections for `GET /board` and `PATCH /:id/status`: change the **Auth** line to "agent token · loopback bypass · admin session (first match wins)"; add the loopback note. Add the `401` (bad token, no session) row where relevant.
- [ ] **For skill authors** table: add `GET /board` (peek the queue without claiming) and `PATCH /:id/status` (move a ticket to any column, incl. `DEFINITION`). Note the `→DEFINITION` use for a semi-automatic "send back to refinement" flow.
- [ ] Keep the state-machine diagram accurate (transitions unchanged; only auth widened).

### 3. Skill file — `.claude/skills/do-semi-automatic/SKILL.md` (skill-coder)

- [ ] Frontmatter: `name: "project:do-semi-automatic"`, German one-line `description`, `argument-hint: "[ticket-id]"`, `version: 1.0.0`, `last-modified: 2026-07-08`, `allowed-tools: [Read, Bash, Task, Skill]`.
- [ ] Intro: autonomous, headless (`claude -p`), never call `AskUserQuestion`, one ticket per run. Point to `docs/specs/SPEC-API-TICKETS.md` ("For skill authors").
- [ ] **Konfiguration**: `APP_BASE_URL` (default `http://localhost:7070`), agent-token header on every call, loopback bypass note, one ticket per run. No admin credentials anywhere.
- [ ] **Parameter**: a number = ticket ID → skip the "next" pick; load by ID; verify Ready+AI.
- [ ] **Schritt 0 — Umgebungsvariablen laden**: `source backend/.env` (guarded `if [ -f ]`), then verify `AGENT_API_TOKEN` set; if empty → error + exit. No API calls before this. (Satisfies the env requirement.)
- [ ] **Schritt 1 — Nächstes Ready+AI-Ticket finden (NICHT starten)**:
  - No parameter: `GET /board` (agent token) → `TODO` column → oldest `owner==AI`. None → "Keine Tickets bereit für AI." + exit.
  - Parameter (ID): `GET /:id` (agent token). Verify `status==TODO` && `owner==AI`; else print reason + exit. `404` → "Ticket nicht gefunden." + exit.
  - Do NOT call `/start`. Ticket stays `TODO`.
- [ ] **Schritt 2 — Thread lesen**: read `comments` (oldest first); newest `HUMAN` comments authoritative; don't re-ask an answered question.
- [ ] **Schritt 3 — Beurteilen**: dispatch the **`requirements-reviewer`** subagent (Task tool) with `title`, `body`, `comments`. Judges: one clear concrete change? all facts present (incl. thread answers)? fits the CRM codebase? one obviously-right approach? Also check against real code. Binary verdict + reason. Follow it without deviation.
- [ ] **Schritt 3a — Nicht gut genug → zurück auf Definition + Human**:
  - `POST /:id/comments` (agent token): comment naming exactly what's missing.
  - `PATCH /:id/owner {HUMAN}` (agent token).
  - `PATCH /:id/status {DEFINITION}` (agent token — now works via the local workaround).
  - Do NOT reject, do NOT call plan-and-do. Exit. (Ticket never touched `IN_PROGRESS`.)
- [ ] **Schritt 3b — Bauen**:
  - `POST /:id/start` (agent token) → `IN_PROGRESS`; handle `409` (someone else claimed) → exit. Then `POST /:id/comments`: small "In Bearbeitung genommen …" comment (documents the `→IN_PROGRESS` change; `/start` has no comment field).
  - Invoke `plan-and-do` via the Skill tool with the standing pre-authorization block: skip PRD, "Approve, implement, and review", auto-approve all review fixes, never call `AskUserQuestion`, keep planning files. **No PR, no push** — state explicitly.
  - Mid-build unanswerable question/problem, OR tests/build fail and not auto-fixable after a reasonable attempt → `POST /:id/ask {question}` → `ON_HOLD` ("Blocked") + `owner=HUMAN` + comment. Exit.
- [ ] **Schritt 4 — Erledigt markieren**: on success `POST /:id/done {comment}` — comment = short summary of what was built + branch name (NO PR link, since no PR). Sets `DONE`. Exit. One ticket per run.
- [ ] **Kommentar-Regel** (documented once): every status change → a small comment. `→IN_PROGRESS`, `→DEFINITION` via a separate `POST /:id/comments`; `→ON_HOLD` via `/ask`; `→DONE` via `/done`.
- [ ] Note: the agent never resolves "Won't Do" (human-only). Outcomes: **done**, **back-to-Definition**, or **Blocked**.

### 4. Tests (be-test-coder)

Extend `backend/src/test/tickets.spec.ts`:
- [ ] `GET /board` reachable with the agent token (200) and via loopback; still reachable via admin session.
- [ ] `PATCH /:id/status` reachable with the agent token (200, e.g. move a ticket to `DEFINITION`); wrong token → `401`; still works via admin session.
- [ ] Regression: admin-only endpoints (`GET /`, `GET /summary`, `/reset`, `/wont-do`, `/hand-to-ai`) still reject the agent token appropriately (unchanged behavior).

### 5. Verification / review

- [ ] `skill-reviewer` reviews the skill file (branching coverage, headless-safety, no `AskUserQuestion`, correct endpoints/auth, cross-platform bash).
- [ ] `be-reviewer` / `db-reviewer` review the route + spec change.
- [ ] `be-test-runner` runs `cd backend && npm test`; green.
- [ ] Cross-check every skill curl against `SPEC-API-TICKETS.md` (base URL, header, endpoints).

## Tests / edge cases the work must cover

- Missing `AGENT_API_TOKEN` → exit before any API call.
- No Ready+AI ticket (`GET /board` empty) → exit.
- ID not Ready+AI, or `404` → exit with reason.
- `/start` `409` (already claimed) → exit.
- Mid-build blocker → `/ask` (`ON_HOLD`).
- `/done` `409` (not IN_PROGRESS) → surfaced.
- Backend: agent token / loopback allowed on `GET /board` + `PATCH /:id/status`; admin session still works; bad token → `401`.

## Out of scope

- No push to remote, no PR — for the skill's own behavior AND the plan-and-do run it triggers.
- No changes to admin-only endpoints other than `GET /board` and `PATCH /:id/status`.
- No frontend changes.
