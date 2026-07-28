# PRD: Kanban Ticket System

## Source

Workshop need. The advanced Claude Code training builds a "software factory." It needs a fake ticketing system the agents can work. We had this on GitHub (org project #7, label-driven). We bring it into the app, modeled on the existing `agent-tasks` feature.

## Problem Statement

Agents need tickets, not just tasks. Tasks are one-shot: pick, solve or reject, done. Tickets add a conversation. Claude Code can ask a question and wait for a human answer, then pick the ticket back up with full context.

The old GitHub flow used labels. We replace labels with one simple idea: every ticket has an **owner** — `AI` or `HUMAN`. A coding agent works tickets owned by `AI`. Humans work the rest. When the agent needs a decision, it hands the ticket back to a human. When the human answers, they hand it back to the AI.

We have no ticket entity, no board, no question flow. We build all three.

## Goals

- A `ticket` entity with a Kanban board: **To Do, In Progress, On Hold, Done**.
- An **owner** on every ticket: `AI` or `HUMAN`. It controls who works the ticket.
- A **solution** on resolved tickets: `Done` or `Won't Do`. Only a human can set `Won't Do`.
- An agent API copied from `agent-tasks` and adapted: claim, finish, and **ask a question** (hand back to a human).
- A comment thread so humans and agents talk on a ticket.
- Seed the real workshop tickets so the board works out of the box.

## Non-Goals

- No change to the existing `agent-tasks` feature. Tickets sit beside it.
- No real GitHub sync. Tickets live in the app database.
- No agent "reject". The ask-question flow replaces it. An agent either finishes or hands the ticket back to a human.
- No individual-user assignment. The owner is only `AI` or `HUMAN`, not a named person.
- No concurrent-agent design. A project skill works the board one ticket at a time — it finishes that ticket or hands it back to a human before taking the next. SQLite serialized writes make the claim safe anyway.
- No automatic timeout. A ticket handed back to a human waits until a human acts or an admin resets the board.

## Requirements

### Entity

A ticket has:

- **owner** — `AI` or `HUMAN`. Who works the ticket now. New tickets default to `HUMAN`.
- **type** — `FEATURE`, `BUG`, or `CHORE`. Drives summary cards and filtering.
- **title** and **body** — the work to do.
- **status** — the Kanban column: `TODO`, `IN_PROGRESS`, `ON_HOLD`, `DONE`.
- **solution** — the resolution, `DONE` or `WONT_DO`. Null until the ticket reaches the Done column. Only a human sets `WONT_DO`; the agent only produces `DONE`.
- **comments** — a thread in a `ticket_comment` table. Each comment has an author (`HUMAN` or `AGENT`), an optional `authorName`, a body, and a `createdAt`. Cascade-delete with the ticket.
- timestamps — `pickedUpAt`, `resolvedAt`, `createdAt`, `updatedAt`.

No label table. Owner plus status carry all the control the old labels did.

### Enums

Single source-of-truth constants in `enums.ts`: `TICKET_OWNER = ['AI','HUMAN']`, `TICKET_TYPE = ['FEATURE','BUG','CHORE']`, `TICKET_STATUS = ['TODO','IN_PROGRESS','ON_HOLD','DONE']`, `TICKET_SOLUTION = ['DONE','WONT_DO']`, `TICKET_COMMENT_AUTHOR = ['HUMAN','AGENT']`. Zod schemas and service allowlists reference these. No second copy.

### State machine

```
TODO (owner=AI) ──(agent claims: GET /next)──▶ IN_PROGRESS (owner=AI)
IN_PROGRESS ──(POST /done)─────────▶ DONE, solution=DONE
IN_PROGRESS ──(POST /ask)──────────▶ ON_HOLD, owner→HUMAN   (+ AGENT comment)
ON_HOLD (owner=HUMAN) ──(human answers: POST /comments handBackToAi)──▶ TODO, owner→AI  (+ HUMAN comment)
HUMAN-owned ──(admin: POST /wont-do)─▶ DONE, solution=WONT_DO   (only when owner=HUMAN)
any ──(admin drag-drop: PATCH /status)──▶ any    (board override; into Done → solution=DONE, out of Done → solution=null)
any ──(admin assign: PATCH /owner)──────▶ owner change only
```

- An agent claims only `TODO` tickets owned by `AI`. Oldest first by `createdAt`. Atomic single-statement claim — plain indexed columns, no race.
- `done` and `ask` work **only from `IN_PROGRESS`**. The UPDATE guards `status='IN_PROGRESS'`. If zero rows change, `findById` decides 404 (not found) vs 409 (wrong status).
- `done` sets `status='DONE'`, `solution='DONE'`, `resolvedAt`. The agent never sets `WONT_DO`.
- `ask` moves the ticket to `ON_HOLD`, sets `owner='HUMAN'`, and posts the question as an `AGENT` comment — one batched transaction.
- The human answers with `POST /comments` + `handBackToAi`. That posts a `HUMAN` comment, sets `status='TODO'`, sets `owner='AI'`, and clears `solution`/`resolvedAt` if the ticket was resolved — one batched transaction. The ticket re-enters the claim queue. The agent gets it again on its next `GET /next`, now with the full thread.
- **`Won't Do` is human-only, and only for human-owned tickets.** `POST /wont-do` (admin) works **only when `owner='HUMAN'`**; it sets `status='DONE'`, `solution='WONT_DO'`, `resolvedAt`, with an optional `HUMAN` comment. On an `AI`-owned ticket it returns 409 — reassign to `HUMAN` first. There is no agent endpoint for it.
- **Drag-drop changes status.** Dropping a card into the Done column sets `solution='DONE'` and `resolvedAt`; dragging a card out of Done clears `solution` and `resolvedAt`. It never changes the owner.
- Every `ticket` UPDATE sets `updatedAt = datetime('now')`. SQLite has no on-update default.

### API — agent endpoints (`requireAgentToken`)

- **GET /api/tickets/next** — claim oldest `TODO` ticket owned by `AI`. Optional `type` filter; if omitted, any type is eligible. Flip to `IN_PROGRESS`, set `pickedUpAt`. Return the ticket with its comment thread (oldest-first). 204 if none.
- **POST /api/tickets/:id/done** — `{ comment? }`. Only from `IN_PROGRESS`. Move to `DONE`, set `solution='DONE'` and `resolvedAt`. Optional closing `AGENT` comment.
- **POST /api/tickets/:id/ask** — `{ question }` (required, non-empty). Only from `IN_PROGRESS`. Move to `ON_HOLD`, set `owner='HUMAN'`, post the question as an `AGENT` comment. One batched transaction.

### API — admin endpoints (`requireAuth` + `requireRole('ADMIN')`)

- **GET /api/tickets** — paginated list. Filter by `type`, `status`, `owner`. Spring-Data page shape. (Tests and future list views; the board uses `/board`.)
- **GET /api/tickets/board** — every ticket grouped by status: `{ TODO: Ticket[], IN_PROGRESS: Ticket[], ON_HOLD: Ticket[], DONE: Ticket[] }`. Each ticket carries its owner, solution, and comment count.
- **GET /api/tickets/summary** — counts per status, per type, and per owner, for KPI cards. (Done split into `DONE` vs `WONT_DO` by solution.)
- **GET /api/tickets/:id** — detail with comment thread (oldest-first).
- **POST /api/tickets** — create a ticket. `{ type, title, body }`. Owner defaults to `HUMAN`, status `TODO`.
- **PATCH /api/tickets/:id/status** — `{ status }`. Move a card (drag-drop drop handler). Status only.
- **PATCH /api/tickets/:id/owner** — `{ owner }`. Assign to `AI` or `HUMAN`.
- **POST /api/tickets/:id/wont-do** — `{ comment? }`. Human-only resolution, allowed **only when `owner='HUMAN'`** (else 409). Move to `DONE`, set `solution='WONT_DO'` and `resolvedAt`, optional `HUMAN` comment. One batched transaction.
- **POST /api/tickets/:id/comments** — `{ body, handBackToAi? }`. Add a `HUMAN` comment. If `handBackToAi` is true, also set `status='TODO'` and `owner='AI'` — comment + status + owner in one batched transaction (all or nothing).
- **POST /api/tickets/reset** — delete all ticket data and re-run the seed. Returns the seeded count. Workshop reset. Admin session auth, **not** agent token.

Route order in `routes/tickets.ts`: register the literal paths (`/next`, `/board`, `/summary`, `/reset`) and `GET /` before the parameterized `/:id` routes, so `reset` and friends are not parsed as ids.

### Frontend

- `@angular/cdk` is already a dependency. No install. Import the standalone `CdkDropListGroup`, `CdkDropList`, `CdkDrag`.
- **Board page** at `/admin/tickets`. Four columns wrapped in `cdkDropListGroup`; each column a `cdkDropList` bound to its own `Ticket[]`; each card a `cdkDrag`. `(cdkDropListDropped)` calls `PATCH /status` with the new column. On HTTP error, move the card back with `transferArrayItem` and show an error toast (optimistic with rollback). Cards show title, type, an **owner badge** (AI / Human), and comment count. Cards in the Done column also show a **solution badge** (Done = green, Won't Do = grey). Loading spinner while `GET /board` loads.
- **Create ticket** — an NgbModal opened from the board. Submits `POST /api/tickets` with a typed `TicketCreate`.
- **Detail page** at `/admin/tickets/:id`. Full ticket (incl. solution when resolved). Comment thread (`@for ... track comment.id`). Add-comment form. A "Zurück an KI" button sets `handBackToAi: true`; disabled unless the ticket is owned by `HUMAN`. An owner toggle ("An KI übergeben" / "An Mensch übergeben") calls `PATCH /owner`. A "Won't Do" button calls `POST /wont-do`; shown only when `owner='HUMAN'` and the ticket is not yet in Done.
- **Summary KPI cards** above the board, like the agent-tasks dashboard. Service method `getSummary()`.
- **Sidebar item** "Tickets", admin-only (`requiredRole: 'ROLE_ADMIN'`).
- **Models** in `ticket.model.ts`: `Ticket` (with nullable `solution`), `TicketComment` (with `id`), `TicketBoard`, `TicketSummary`, `TicketCreate`, `TicketCommentCreate`, and the owner/type/status/solution string-union types. Reuse existing badge colors and `.page-header` / card styling.
- Route in `admin.routes.ts` with `roleGuard('ROLE_ADMIN')`; board, detail. Standalone components, `inject()` DI, `@if`/`@for` control flow.

### Seed

Seed the **12 real workshop tickets** from `coding-with-ai-training-materials/tasks/agent-factory/*.md` (01–12). Use each file's `title` and body. These are German CRM feature specs (e.g. "Dunkelmodus-Umschalter im Header", "CSV-Export für die Firmenliste", "Notiz-Feld für Chancen").

Owner and status mapping (all 12 were marked "Refinement needed" = ready for the AI):

- The three "Will ask" specs — **07 CSV-Export**, **09 Zähler-Badges**, **11 Notiz-Feld** — seed as `ON_HOLD`, `owner='HUMAN'`, each with a seeded `AGENT` comment holding its real "Rückfrage erforderlich" question. This pre-populates the On Hold column and lets the answer flow demo without running the agent first.
- The other nine specs (01–06, 08, 10, 12) — seed as `TODO`, `owner='AI'`. They fill the To Do column, ready for `GET /next`.
- Assign a `type` per ticket (mostly `FEATURE`; small UI polish like icons/badges as `CHORE`).
- All seeded tickets have `solution=null` (none resolved). The Done column starts empty.

Idempotent `INSERT OR IGNORE`, fixed ids, runs on every startup like `seedAgentTasks()`, wired into `runMigrations()` after it.

- **Two sequential batches** to respect the foreign key: first the `ticket` rows, then the `ticket_comment` rows. Never interleave parent and child in one batch (`PRAGMA foreign_keys = ON` would reject it).

## Special Instructions

- Copy the `agent-tasks` structure: enums, schema + raw DDL, idempotent seed, service with DTOs, route file, two-tier auth. Stay consistent with it.
- Markdown writing style per CLAUDE.md: short, brief, simple words, no passive voice.

## Implementation Approach

High level. Details in the plan.

- **Database** — add `ticket` and `ticket_comment` tables (Drizzle schema + raw DDL in `migrate.ts`), enums in `enums.ts`, and a `ticketSeed.ts`. Wire the seed into `runMigrations()` after `seedAgentTasks()`. Indexes: `idx_ticket_status_owner_createdAt` (claim + board), `idx_ticket_type_status` (summary + filter), `idx_ticket_comment_ticketId`.
- **Backend** — `ticketService.ts` (claim, done, ask, wontDo, list, board, summary, create, move status, set owner, comment/answer, reset) and `routes/tickets.ts` mounted at `/api/tickets`. Reuse `requireAgentToken` and `requireAuth`/`requireRole`. Reuse the pagination util; add a `ticket` sort allowlist. Use `client.batch(..., 'write')` for multi-write transitions (ask, answer, wontDo, reset).
- **Frontend** — `ticket.model.ts`, `ticket.service.ts`, a board component, a detail component, a create modal, sidebar item, route with `roleGuard('ROLE_ADMIN')`.
- **Docs** — new `docs/API-TICKETS.md` mirroring `API-TASKS.md`. Update `CLAUDE.md` and `docs/specs/SPECS-database.md` (new tables + indexes).

## Test Strategy

- **Backend (Playwright API)** — the full lifecycle: claim → ask → answer → re-claim → done (solution=DONE). Auth on every endpoint (agent token vs admin). Eligibility (only `TODO` + `owner=AI` claimed; `type` filter). Conflicts (done/ask from wrong status → 409; not found → 404). Validation (bad type/status/owner/solution, empty question). Comment thread order and authorship. Owner transitions on ask/answer. `POST /wont-do` is admin-only, works only on `owner=HUMAN` tickets (409 on `owner=AI`), and sets solution=WONT_DO; the agent has no won't-do path. Drag into Done sets solution=DONE, drag out clears it; drag-drop never changes owner. Reset deletes and reseeds.
- **Frontend (Jasmine/Karma)** — service methods hit the right URLs. Board groups by status into four arrays. Drop handler calls `PATCH /status` and rolls back on error. Done cards show the solution badge. Detail renders the thread. "Zurück an KI" calls the comment endpoint with `handBackToAi` and is disabled when owner is `AI`. "Won't Do" calls `POST /wont-do`.

## Non-Functional Requirements

- `@libsql/client` async throughout. Dates ISO-8601 text. `PRAGMA foreign_keys = ON` for cascade delete (already set at startup).
- Parameterized SQL. Sort field allowlist. Owner, status, and type validated against the `enums.ts` whitelists.
- Atomic claim in `GET /next`: single `UPDATE ticket SET status='IN_PROGRESS', pickedUpAt=?, updatedAt=? WHERE id = (SELECT id FROM ticket WHERE status='TODO' AND owner='AI' [AND type=?] ORDER BY createdAt ASC LIMIT 1) RETURNING *`. The `type` clause is added only when the filter is present.
- Multi-write transitions (ask, answer, reset) run in one `client.batch` transaction — all or nothing.
- Every `ticket` UPDATE sets `updatedAt`.
- Agent token compared constant-time (reuse `requireAgentToken`).

## Success Criteria

- New `ticket` and `ticket_comment` tables created, indexed, and seeded with the 12 workshop tickets on startup.
- All agent and admin endpoints work, guarded by the right auth, in the right route order.
- An agent can claim an `AI` ticket, ask a question (handing it to a human), get an answer, re-claim, and finish (solution `DONE`) — end to end.
- A human can resolve a `HUMAN`-owned ticket as `Won't Do`; the agent cannot, and `AI`-owned tickets cannot.
- The board shows four columns and moves cards by drag-and-drop, with rollback on error. Owner shows on each card and can be reassigned; Done cards show their solution.
- `agent-tasks` still works, untouched.
- Backend and frontend tests pass. `ng build` clean.
