# Implementation Plan: KANBAN-TICKET-SYSTEM

Spec: `docs/prds/PRD-KANBAN-TICKET-SYSTEM.md`

## Test Command

- Backend: `cd backend && npx playwright test`
- Frontend unit: `cd frontend && npx ng test --configuration=ci`
- Frontend build: `cd frontend && npx ng build`

## Model summary (the contract)

- **ticket**: `id`, `owner` (`AI`|`HUMAN`, default `HUMAN`), `type` (`FEATURE`|`BUG`|`CHORE`), `title`, `body`, `status` (`TODO`|`IN_PROGRESS`|`ON_HOLD`|`DONE`, default `TODO`), `solution` (`DONE`|`WONT_DO`, nullable), `pickedUpAt`, `resolvedAt`, `createdAt`, `updatedAt`.
- **ticket_comment**: `id`, `ticketId` (FK → ticket, cascade), `author` (`HUMAN`|`AGENT`), `authorName` (nullable), `body`, `createdAt`.
- Indexes: `idx_ticket_status_owner_createdAt`, `idx_ticket_type_status`, `idx_ticket_comment_ticketId`.

## Tasks

### 1. Database & enums (db-coder)
- [ ] Add enums to `backend/src/db/schema/enums.ts`: `TICKET_OWNER`, `TICKET_TYPE`, `TICKET_STATUS`, `TICKET_SOLUTION`, `TICKET_COMMENT_AUTHOR` (const arrays + exported types).
- [ ] Add Drizzle tables `ticket` and `ticketComment` to `backend/src/db/schema/schema.ts` (mirror `agentTask` style). `ticketComment.ticketId` references `ticket.id` with `onDelete: 'cascade'`.
- [ ] Add raw `CREATE TABLE IF NOT EXISTS` for `ticket` and `ticket_comment` in `backend/src/config/migrate.ts` (FK on ticket_comment.ticketId, `ON DELETE CASCADE`). `solution` nullable. `owner` default `'HUMAN'`. `status` default `'TODO'`.
- [ ] Add the three indexes to the index block in `migrate.ts`.
- [ ] Add `await seedTickets();` in `runMigrations()` right after `await seedAgentTasks();`.

### 2. Seed (db-coder)
- [ ] Create `backend/src/seed/ticketSeed.ts` mirroring `agentTaskSeed.ts` (idempotent `INSERT OR IGNORE`, fixed ids 1–12, `client.batch(..., 'write')`).
- [ ] Source content = `coding-with-ai-training-materials/tasks/agent-factory/01..12-*.md` titles + bodies (copy text into the seed; the lab repo cannot read the sibling repo at runtime).
- [ ] Owner/status mapping: 07, 09, 11 → `status='ON_HOLD'`, `owner='HUMAN'`, each with one seeded `AGENT` comment holding its "Rückfrage erforderlich" question. Others (01–06, 08, 10, 12) → `status='TODO'`, `owner='AI'`. All `solution=null`.
- [ ] Types: mostly `FEATURE`; `08` (icons) and `10` (badges) → `CHORE`.
- [ ] Two sequential batches: insert `ticket` rows first, then `ticket_comment` rows (FK order).
- [ ] Export `seedTickets()`.

### 3. Backend service (be-coder + db-coder)
- [ ] Create `backend/src/services/ticketService.ts` with DTOs (`TicketDTO`, `TicketCommentDTO`, `TicketBoardDTO`, `TicketSummaryDTO`, `TicketFilters`) and methods:
  - [ ] `findNext(type?)` — atomic `UPDATE ... WHERE id=(SELECT id FROM ticket WHERE status='TODO' AND owner='AI' [AND type=?] ORDER BY createdAt ASC LIMIT 1) RETURNING *`; set `status='IN_PROGRESS'`, `pickedUpAt`, `updatedAt`. Build the `type` clause only when present. Return ticket + its comments (oldest-first), or null.
  - [ ] `findById(id)` — ticket + comments oldest-first; `NotFoundError` if missing.
  - [ ] `done(id, comment?)` — guard `status='IN_PROGRESS'`; set `status='DONE'`, `solution='DONE'`, `resolvedAt`, `updatedAt`; optional `AGENT` comment. 0 rows → findById → 404 vs 409.
  - [ ] `ask(id, question)` — guard `status='IN_PROGRESS'`; batch: set `status='ON_HOLD'`, `owner='HUMAN'`, `updatedAt` + insert `AGENT` comment. 0 rows → 404 vs 409.
  - [ ] `wontDo(id, comment?)` — guard `status != 'DONE' AND owner='HUMAN'`; batch: set `status='DONE'`, `solution='WONT_DO'`, `resolvedAt`, `updatedAt` + optional `HUMAN` comment. 0 rows → findById → 404 vs 409 (wrong owner/status).
  - [ ] `findAll(filters{type,status,owner}, page, size, sort)` — paginated `PageResult`, default `createdAt DESC`.
  - [ ] `getBoard()` — return `{TODO,IN_PROGRESS,ON_HOLD,DONE}` arrays; each ticket includes `commentCount`.
  - [ ] `getSummary()` — counts per status, per type, per owner (Done split by solution).
  - [ ] `create({type,title,body})` — `owner='HUMAN'`, `status='TODO'`, `solution=null`.
  - [ ] `setStatus(id, status)` — set status + `updatedAt`. Into `DONE` → `solution='DONE'`, `resolvedAt`. Out of `DONE` → `solution=null`, `resolvedAt=null`. Owner untouched.
  - [ ] `setOwner(id, owner)` — set owner + `updatedAt`.
  - [ ] `addComment(id, body, handBackToAi?)` — batch: insert `HUMAN` comment; if `handBackToAi` → set `status='TODO'`, `owner='AI'`, clear `solution`/`resolvedAt`, `updatedAt`.
  - [ ] `resetAll()` — delete all `ticket_comment` then `ticket`, re-run `seedTickets()`; return seeded count.
- [ ] Every `ticket` UPDATE sets `updatedAt = datetime('now')` (ISO via `new Date().toISOString()` consistent with existing services).
- [ ] Add `ticket` sort allowlist to `backend/src/utils/pagination.ts` (`createdAt`, `updatedAt`, `status`, `type`, `owner`, `title`).

### 4. Backend routes (be-coder)
- [ ] Create `backend/src/routes/tickets.ts`. Register literal paths before `/:id`: `GET /next`, `GET /board`, `GET /summary`, `POST /reset`, `GET /`, then `GET /:id`, `PATCH /:id/status`, `PATCH /:id/owner`, `POST /:id/done`, `POST /:id/ask`, `POST /:id/wont-do`, `POST /:id/comments`.
- [ ] Auth: agent token on `GET /next`, `POST /:id/done`, `POST /:id/ask`. `requireAuth` + `requireRole('ADMIN')` on all admin endpoints (board, summary, reset, list, detail, status, owner, wont-do, comments, create).
- [ ] Zod body schemas; validate `type`/`status`/`owner`/`solution` against the enums; `ask.question` and `comments.body` non-empty; `wont-do.comment` optional.
- [ ] Validate `type` query on `/next` and filters on `GET /` against enums (400 on bad value).
- [ ] Wrap handlers in `asyncHandler`.
- [ ] Mount in `backend/src/app.ts`: `app.use('/api/tickets', ticketsRouter);` (after agent-tasks).

### 5. Frontend model + service (fe-coder)
- [ ] `frontend/src/app/core/models/ticket.model.ts`: `TicketOwner`, `TicketType`, `TicketStatus`, `TicketSolution` unions; `Ticket`, `TicketComment` (with `id`), `TicketBoard`, `TicketSummary`, `TicketCreate`, `TicketCommentCreate`.
- [ ] `frontend/src/app/core/services/ticket.service.ts` (HttpClient, base `/api/tickets`): `getBoard()`, `getSummary()`, `getById(id)`, `getAll(...)`, `create(dto)`, `setStatus(id,status)`, `setOwner(id,owner)`, `wontDo(id,comment?)`, `addComment(id,dto)`. (No agent endpoints from the UI.)

### 6. Frontend board, detail, create (fe-coder + ui-designer)
- [ ] Board component `frontend/src/app/features/admin/tickets/ticket-board.component.ts`: four `cdkDropList` columns in a `cdkDropListGroup`, cards `cdkDrag`. Local arrays per column from `getBoard()`. `(cdkDropListDropped)` → `transferArrayItem` + `setStatus`; on error roll back + toast. Loading spinner. KPI summary cards on top. "Neues Ticket" button → modal.
- [ ] Card shows title, type badge, owner badge (AI/Human); Done cards show solution badge (Done green / Won't Do grey); comment count.
- [ ] Create modal (NgbModal) `ticket-create.component.ts` (or inline): form `{type,title,body}` → `create()` → refresh board.
- [ ] Detail component `ticket-detail.component.ts` at `/admin/tickets/:id`: full ticket + solution; comment thread `@for ... track comment.id`; add-comment form; "Zurück an KI" (sets `handBackToAi`, enabled only when `owner==='HUMAN'`); owner toggle → `setOwner`; "Won't Do" button shown only when `owner==='HUMAN'` and status ≠ `DONE`.
- [ ] Route registration in `frontend/src/app/features/admin/admin.routes.ts`: `tickets` (board) and `tickets/:id` (detail), both `canActivate: [roleGuard('ROLE_ADMIN')]`.
- [ ] Sidebar item in `frontend/src/app/layout/sidebar/sidebar.component.ts`: label "Tickets", route `/admin/tickets`, an icon (e.g. `faTableColumns`), `requiredRole: 'ROLE_ADMIN'`.

### 7. Docs (be-coder / md)
- [ ] New `docs/API-TICKETS.md` mirroring `docs/API-TASKS.md` (endpoints, auth, error shapes, lifecycle, env).
- [ ] Update `docs/specs/SPECS-database.md` (new tables + indexes + enums).
- [ ] Update `CLAUDE.md` (mention the ticket feature + `/admin/tickets` + `/api/tickets`).

### 8. Tests

#### Backend Playwright (`backend/src/test/`) — be-test-coder
- [ ] Auth: each agent endpoint rejects without token (401); each admin endpoint rejects without admin session (401/403).
- [ ] `GET /next`: claims oldest `TODO`+`owner=AI`; flips to `IN_PROGRESS` + `pickedUpAt`; returns comments; `type` filter; 204 when none.
- [ ] Eligibility: a `TODO`+`owner=HUMAN` ticket is never claimed.
- [ ] `done`: only from `IN_PROGRESS` → `DONE`+`solution=DONE`+`resolvedAt`; 409 from other states; 404 missing.
- [ ] `ask`: `IN_PROGRESS` → `ON_HOLD`+`owner=HUMAN`+`AGENT` comment; empty question 400; 409 wrong state.
- [ ] answer flow: `POST /comments` `handBackToAi` → `TODO`+`owner=AI`, clears solution; re-claim via `/next` returns full thread oldest-first.
- [ ] `wont-do`: on `owner=HUMAN` → `DONE`+`solution=WONT_DO`; on `owner=AI` → 409; no agent path exists.
- [ ] `PATCH /status`: into Done sets solution=DONE; out of Done clears it; never changes owner.
- [ ] `PATCH /owner`: flips owner only.
- [ ] `create`: defaults owner=HUMAN, status=TODO, solution=null.
- [ ] validation: bad type/status/owner → 400.
- [ ] `reset`: deletes mutations and reseeds 12 tickets (07/09/11 on hold with seeded question).
- [ ] Isolation: reset at start of suite or per-group so order does not break tests.

#### Frontend Jasmine (`*.spec.ts`) — fe-test-coder
- [ ] `TicketService`: each method hits the right URL/verb/body.
- [ ] Board: `getBoard()` result splits into four column arrays; drop handler calls `setStatus` and rolls back on error.
- [ ] Board: Done card renders the solution badge; owner badge renders.
- [ ] Detail: thread renders; "Zurück an KI" calls `addComment` with `handBackToAi` and is disabled when owner=AI; "Won't Do" hidden when owner=AI.

### 9. Verification
- [ ] `cd backend && npx playwright test` green.
- [ ] `cd frontend && npx ng test --configuration=ci` green.
- [ ] `cd frontend && npx ng build` clean.
- [ ] Manual sanity: start app, open `/admin/tickets`, see 9 To Do + 3 On Hold; drag a card; open a detail; agent-tasks page still works.

## Tests (what they verify)

- **Lifecycle**: claim → ask → answer → re-claim → done proves the owner hand-off and comment thread.
- **Won't Do guard**: proves human-only + owner=HUMAN-only resolution.
- **Eligibility**: proves the agent only ever touches `AI`+`TODO` tickets.
- **Drag-drop semantics**: proves status moves set/clear solution and never touch owner.
- **Auth matrix**: proves agent token vs admin session separation on every route.
- **Reset/seed**: proves the workshop board rebuilds deterministically.
