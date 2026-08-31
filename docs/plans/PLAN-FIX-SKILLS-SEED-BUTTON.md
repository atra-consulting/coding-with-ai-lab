# Implementation Plan: FIX-SKILLS-SEED-BUTTON

Four batched workshop fixes on branch `solution-jfs-2026`.

## Test Command
- Backend: `cd backend && npm test` ⚠️ **wipes the shared dev ticket board** (memory `backend-tests-wipe-ticket-board`) — `tickets.spec.ts` calls `POST /api/tickets/reset` and `globalSetup.ts` runs against `crmdb.sqlite`. Any dev-board tickets with id > 12 are lost. You chose NOT to isolate the test DB.
- Frontend: `cd frontend && npm run test:ci`
- Skill markdown (`.claude/**`): no automated tests — `skill-reviewer` reviews.

## Interpretations (confirm or correct at checkpoint)

- **#1a "set the task to closed"** → write-ticket already closes the source agent-task (`POST /agent-tasks/:id/done`, Step 4). I read this as: make that closure explicit and robust in the skill text, and ensure it runs on every path that takes a task.
- **#1c "headings less prominent"** → change write-ticket's body template to use a lower heading level (`####`) / bold labels instead of `##`. Affects only NEW tickets from write-ticket, not the seeded ticket in the screenshot. (Alternative, not chosen: tone down heading CSS in the frontend ticket-detail view — that would shrink headings for ALL tickets. Say the word to switch.)
- **#3 seed contents** → the German notes-field email text. I will fix the paste artifact `AU0erdem` → `Außerdem`; keep the natural typo `Beschreiibungs-Feld` for realism unless you want it cleaned.
- **#4** → widen backend auth on the ticket verb endpoints; skill logic stays. Honest caveat: this makes the endpoints reachable via admin session / loopback too, but the agent token already worked, so it does **not** by itself stop the test suite from deleting the in-progress ticket. That environmental cause is out of scope per your choices.

## Tasks

### 1. write-ticket skill (`.claude/skills/write-ticket/SKILL.md`) — skill-coder
- [ ] 1a. Make it explicit that taking an agent-task ends with that task closed (DONE). Reinforce Step 4 so it fires on every task-backed path (queue / id / url), including after the 3a comment-error path where feasible. Keep freetext mode (no task) unchanged.
- [ ] 1b. Add an **acceptance-criteria** section to the generated ticket body. New section (e.g. `#### Akzeptanzkriterien`) after Technisch, filled from the requirements-reviewer subagent (Step 2). Update Step 2's requested content + Step 3's template + escaping note.
- [ ] 1c. Lower heading prominence in the ticket body template: `## Feedback` / `## Fachlich (für Business)` / `## Technisch (für Entwickler)` → `#### …` (or bold labels). Keep section order and the `>` feedback quote.
- [ ] Bump `version` + `last-modified`.

### 2. Ticket board "Kürzlich geändert" persistence (`frontend/src/app/features/admin/tickets/ticket-board.component.ts`) — fe-coder
- [ ] Persist `recentOnly` across navigation. On `toggleRecent()` write the value to `sessionStorage` (key e.g. `ticketBoard.recentOnly`); in `ngOnInit` read it back **before** `loadBoard()` so `refreshView()` honors it. sessionStorage = remembered while navigating to a ticket and back, cleared on tab close.
- [ ] Guard against unavailable/failing storage (private mode) — treat as `false`.

### 3. agent-task 23 seed (`backend/src/seed/agentTaskSeed.ts`) — db-coder
- [ ] Change row `id: 23`: `title` = `Improve chances`; `metadata.subject` = `Verbesserungen für Chancen` (keep `sender`); `body` = the notes-field + Phase-label-color German text (artifact `AU0erdem` → `Außerdem`).
- [ ] Note: `INSERT OR IGNORE` + fixed id → existing DBs keep the old row 23; only a fresh DB (`./start.sh --reset-db`) picks up the new values. Call this out; do not force-update existing rows unless asked.

### 4. Widen ticket verb-endpoint auth (`backend/src/routes/tickets.ts` + `docs/specs/SPEC-API-TICKETS.md`) — be-coder
- [ ] Change `/next`, `/:id/start`, `/:id/done`, `/:id/ask` from `requireAgentToken` → `requireAgentTokenOrAdminSession` (agent token · loopback bypass · admin session, first match wins) — same as create/status/owner/comments.
- [ ] Update the auth tables + per-endpoint auth lines in `SPEC-API-TICKETS.md` (lines ~114, ~116, and the per-endpoint headers).
- [ ] Verify `do-semi-automatic` In-Progress (`/start` + comment, Step 3b) and Done (`/done`, Step 4) logic is correct — expect no change needed; note the board-reset hazard in the skill if useful.

### 5. Test Implementation
- [ ] Backend (`be-test-coder`): tests that `/:id/start`, `/:id/done`, `/:id/ask` now accept an **admin session** (200) and still accept the agent token; update any existing test that asserted admin-session rejection on these. Seed test: agent-task 23 has the new title/subject on a fresh DB.
- [ ] Frontend (`fe-test-coder`): spec that `recentOnly` is restored from `sessionStorage` on init and written on toggle.

### 6. Verification
- [ ] `cd frontend && npm run test:ci` (safe).
- [ ] `cd backend && npm test` — ⚠️ resets the dev ticket board. Run knowingly.
- [ ] `cd frontend && npx ng build` build check.
- [ ] skill-reviewer on the write-ticket edits.

## Tests
### Backend (Playwright)
- [ ] `POST /:id/start` with admin session → 200 (newly allowed).
- [ ] `POST /:id/done` with admin session → 200; with agent token → 200 (unchanged).
- [ ] `POST /:id/ask` with admin session → 200.
- [ ] No-auth / wrong-token still → 401.
- [ ] Seed: agent-task 23 title = "Improve chances", metadata.subject = "Verbesserungen für Chancen" after fresh seed.

### Frontend (Karma)
- [ ] `ngOnInit` reads `recentOnly` from sessionStorage (true → view filtered).
- [ ] `toggleRecent()` writes the new value to sessionStorage.
- [ ] Missing/broken storage → defaults to `false`, no throw.
