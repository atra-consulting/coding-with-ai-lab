# Implementation Plan: PORT-FEEDBACK-TICKETS-APIS

## Summary

### Business Summary
Feedback items and work tickets live in two separate lists today. Nothing links them, so nobody can tell which feedback caused a ticket, or whether a feedback item was ever acted on. This change connects both directions, adds an invisible "ready to build" marker that automated flows use, and puts a small ticket number on every board card. It also carries two small extras: the wait-time colour in the Rechner tool changes to match the sibling app, and the test suite stops wiping the shared development database.

### Technical Summary
Port of a shipped feature from the sibling repo. Two new `ticket` columns (`fullyReady` INTEGER NOT NULL DEFAULT 0, `agentTaskId` nullable INTEGER REFERENCES `agent_task(id)` ON DELETE SET NULL) plus index `idx_ticket_agentTaskId`, added through two guarded idempotent ensure-functions in `migrate.ts` modelled on `ensureSzenarioAgileKiColumn()`. The index is created inside its ensure-function, never in the shared index batch. `AgentTaskDTO` gains a derived `ticketId` from a correlated subquery; in `findAll()` the subquery sits outside a pagination-first inner derived table so cost stays at page size. Coupled fix: `NODE_ENV=test` routes the Playwright suite to `backend/data/crmdb.test.sqlite`, set in `playwright.config.ts` so the runner process and the backend process open the same file. Plus a three-site hex colour swap in the Rechner and six spec-doc updates.

## Test Command
Backend: `cd backend && npm test`
Frontend: `cd frontend && npm test`

## Tasks

### 1. Database schema and migration
**Agent:** db-coder
**Model:** sonnet — schema + guarded ALTER, exact template already exists in `migrate.ts`

- [ ] `backend/src/db/schema/schema.ts` — add to the `ticket` table: `fullyReady: integer('fullyReady').notNull().default(0)` and `agentTaskId: integer('agentTaskId').references(() => agentTask.id, { onDelete: 'set null' })`. `agentTask` is declared above `ticket` in the same file, so no reordering is needed.
- [ ] `backend/src/config/migrate.ts` — add both columns to the `CREATE TABLE IF NOT EXISTS ticket` block (fresh databases). `fullyReady INTEGER NOT NULL DEFAULT 0`, `agentTaskId INTEGER REFERENCES agent_task(id) ON DELETE SET NULL`.
- [ ] Add `ensureTicketFullyReadyColumn()` — copy the `ensureSzenarioAgileKiColumn()` shape exactly: standalone `client.execute('PRAGMA table_info(ticket)')` (never batched), early return when the column exists, `ALTER TABLE ticket ADD COLUMN fullyReady INTEGER NOT NULL DEFAULT 0` in a `try/catch` that swallows only `duplicate column` and re-throws everything else. The early return is correct here — this function has no index to create, nothing runs after the ALTER.
- [ ] Add `ensureTicketAgentTaskIdColumn()` — **do not copy the template shape.** It needs different control flow, because it must also create an index. Write it in this exact order:
  1. Standalone `client.execute('PRAGMA table_info(ticket)')`. Compute `hasColumn`.
  2. **Only the ALTER is guarded.** When `hasColumn` is false, run `ALTER TABLE ticket ADD COLUMN agentTaskId INTEGER REFERENCES agent_task(id) ON DELETE SET NULL` inside a `try/catch` that swallows only `duplicate column` and re-throws everything else. When `hasColumn` is true, skip the ALTER — **skip it, do not `return`.** No `return` statement anywhere before step 3.
  3. **Unconditionally**, on every call, on both the column-already-there path and the just-added path, and also inside the swallowed-`duplicate column` path: `await client.execute('CREATE INDEX IF NOT EXISTS idx_ticket_agentTaskId ON ticket(agentTaskId)')`.
  - `ADD COLUMN` carries **no DEFAULT** — SQLite rejects `ADD COLUMN` with both a `REFERENCES` clause and a non-NULL default.
  - Why this matters: group 1 also puts `agentTaskId` into the fresh `CREATE TABLE`, so "column already exists" is the path taken on **every fresh database and every startup after the first migration**. An early return there ships a database with no index in the common case and breaks the pagination-first `findAll()` subquery this plan depends on.
- [ ] Do **not** put `idx_ticket_agentTaskId` in the shared `executeMultiple` index block — that block runs earlier, before the column exists on an upgraded DB.
- [ ] Call both ensure-functions from `runMigrations()` **directly after the shared index `executeMultiple` block and before `seedAgentTasks()`**. Order relative to `ensureSzenarioAgileKiColumn()` does not matter; the seeders use explicit column lists and are unaffected.
- [ ] **Export both ensure-functions** (`export async function ...`) so the migration spec files in group 7 can import and call them.

**Acceptance criteria**
- Fresh DB (`./start.sh --reset-db`): `PRAGMA table_info(ticket)` lists `fullyReady` and `agentTaskId`; `PRAGMA index_list(ticket)` lists `idx_ticket_agentTaskId`.
- Existing DB with neither column: startup succeeds, both columns appear, no data lost, no manual reset.
- Existing DB that already has `agentTaskId` but no index: startup still creates `idx_ticket_agentTaskId`. The has-column path must not skip the index.
- Second startup on the same DB: no error, no duplicate work, index still there.
- Running the shared index block against a DB missing `agentTaskId` never throws, because the index statement is not in that block.

---

### 2. Backend ticket API — new fields
**Agent:** be-coder
**Model:** sonnet — service + Zod change, pattern already in the file
**Depends on:** Group 1 (columns must exist)

- [ ] `backend/src/routes/tickets.ts` — Zod only, no DB access in this file.
  - `CreateBodySchema` gains `agentTaskId: z.number().int().nullable().optional()` and `fullyReady: z.boolean().optional()`.
  - `CommentBodySchema` gains `clearFullyReady: z.boolean().optional()`.
  - Pass all three through: `ticketService.create(dto)` already spreads the DTO; extend the `addComment` call to `ticketService.addComment(id, dto.body, dto.handBackToAi, dto.clearFullyReady)`.
- [ ] `backend/src/services/ticketService.ts` — DTOs and row types:
  - `TicketRow` gains `fullyReady: number` and `agentTaskId: number | null`.
  - `TicketDTO` and `TicketListItemDTO` gain `fullyReady: boolean` and `agentTaskId: number | null`. Exposed on `TicketListItemDTO` too, since rows come from `SELECT t.*` — costs nothing. `fullyReady` simply rides along unused in list/board JSON since group 5 deliberately keeps it off the frontend model.
  - `toDTO()` and `toListItemDTO()` map `fullyReady: Number(row.fullyReady) === 1` and pass `agentTaskId` through as-is. Integer-to-boolean conversion lives only in the mappers.
- [ ] `create()` — widen the parameter type with `agentTaskId?: number | null` and `fullyReady?: boolean`. **FK existence check lives here**, at the top: when `agentTaskId` is not null/undefined, run `SELECT id FROM agent_task WHERE id = ?`; on a miss throw `ValidationError` with message and `fieldErrors.agentTaskId` naming the field. Then extend the `INSERT ... RETURNING *` column list with `fullyReady` (`data.fullyReady ? 1 : 0`) and `agentTaskId` (`data.agentTaskId ?? null`).
- [ ] `addComment()` — add a fourth parameter `clearFullyReady?: boolean`. Keep the existing `findById()` 404 check and the existing `handBackToAi` `ON_HOLD` + `owner=HUMAN` guard, which throws `ConflictError` **before any statement is queued**. When `clearFullyReady` is true, push `UPDATE ticket SET fullyReady = 0, updatedAt = ? WHERE id = ?` into the same `stmts` array that already carries the comment insert and the optional hand-back update. One `client.batch(stmts, 'write')`. Never a separate `execute()`.
- [ ] No change to `setStatus()`, `setOwner()`, `handToAi()`, `done()`, `ask()`, `wontDo()`, `findNext()`, `start()`, `getBoard()`, `findAll()` — those all use `SELECT *` or re-fetch through `findById()`, so both new columns flow through unchanged.
- [ ] Do not touch the create modal or add any new auth rule. Both fields ride the existing `requireAgentTokenOrAdminSession` guard.

**Acceptance criteria**
- `POST /api/tickets` with no new fields → 201, `fullyReady: false`, `agentTaskId: null`.
- `POST /api/tickets` with `fullyReady: true` → 201, `fullyReady: true`.
- `POST /api/tickets` with a valid `agentTaskId` → 201, value stored, echoed back.
- `POST /api/tickets` with an unknown `agentTaskId` → 400, body `fieldErrors.agentTaskId` present.
- `POST /api/tickets` with a non-integer `agentTaskId` → 400 from Zod, field named.
- `POST /api/tickets/:id/comments` with `clearFullyReady: true` → 200, marker off.
- Same call with `handBackToAi: true` on a ticket that is not `ON_HOLD+HUMAN` → 409, **and** the comment count and `fullyReady` value are both unchanged.

---

### 3. Backend agent-task derived `ticketId`
**Agent:** be-coder
**Model:** sonnet — three call sites, SQL shape given below
**Depends on:** Group 1 (`ticket.agentTaskId` and its index must exist)

- [ ] `backend/src/services/agentTaskService.ts` — `AgentTaskDTO` and `AgentTaskRow` gain `ticketId: number | null`. `toDTO()` maps `ticketId: row.ticketId ?? null`.
- [ ] `findById()` — add the correlated subquery to the projection: newest matching ticket, `WHERE t.agentTaskId = <row id>`, `ORDER BY t.createdAt DESC, t.id DESC LIMIT 1`. The `id` tie-break matters — seed and test rows share ISO timestamps to the millisecond. Single-row lookup, no wrapper needed.
- [ ] `findAll()` — **must paginate before it looks up.** Replace `SELECT * FROM agent_task ${where} ORDER BY ... LIMIT ? OFFSET ?` with a wrapper form: the existing filtered/sorted/limited query becomes an inner derived table `p`, and the correlated subquery sits in the outer projection against `p.id`. Argument order stays `[...args, size, page * size]` because the placeholders remain inside the inner query. Do not bolt the subquery onto the outer `SELECT` — SQLite evaluates a projected correlated subquery once per row scanned for the sort, not once per row returned. Final shape:
  ```sql
  SELECT p.*,
         (SELECT t.id FROM ticket t WHERE t.agentTaskId = p.id
          ORDER BY t.createdAt DESC, t.id DESC LIMIT 1) AS ticketId
  FROM (
    SELECT * FROM agent_task ${where}
    ORDER BY ${sort.field} ${sort.direction}
    LIMIT ? OFFSET ?
  ) p
  ```
- [ ] `findNext()` — `RETURNING *` cannot carry a derived column. After the claim, re-fetch through `this.findById(row.id)` and return that. Keep the `null` return when no row was claimed.
- [ ] No change to `start()`, `reject()`, `done()` — all three already end in `this.findById(id)`.
- [ ] No route change in `backend/src/routes/agentTasks.ts`. No change to `parseSort`'s `agentTask` whitelist.

**Acceptance criteria**
- `GET /api/agent-tasks/:id` returns `ticketId` — the linked ticket's id, or `null`.
- `GET /api/agent-tasks` returns `ticketId` on every item in `content`.
- `GET /api/agent-tasks/next?source=X` returns `ticketId` on the claimed task.
- Two tickets pointing at one task → all three endpoints report the **newer** ticket id.
- Deleting the linked ticket → all three report `null`.
- The `findAll()` SQL string contains the inner `FROM ( SELECT * FROM agent_task ... LIMIT ? OFFSET ? ) p` shape. This is a reviewable structural criterion, not a timing test.

---

### 4. Test database isolation
**Agent:** be-coder
**Model:** sonnet — three small edits, but the failure mode is silent (wrong file) so it needs care
**Depends on:** nothing. Runs in parallel with groups 1-3.

- [ ] `backend/src/config/db.ts` — when `process.env['TURSO_DATABASE_URL']` is unset **and** `process.env['NODE_ENV'] === 'test'`, use `crmdb.test.sqlite` instead of `crmdb.sqlite`. Turso still wins, so CI and cloud are unaffected. Keep the `mkdirSync(dataDir)` guard exactly as-is.
- [ ] `backend/playwright.config.ts` — set `process.env['NODE_ENV'] = 'test'` at module top level, **above** `defineConfig`. **Essential.** Six spec files plus `helpers.ts` import `client` from `config/db.js` into the *runner* process, which `globalSetup` does not cover. Without this line the runner talks to the dev DB while the backend talks to the test DB.
- [ ] `backend/src/test/globalSetup.ts` — after the port-kill step and before `spawn`, `rmSync` the test DB file plus its `-journal`, `-wal` and `-shm` sidecars with `{ force: true }`. Skip the whole delete when `process.env['TURSO_DATABASE_URL']` is set. Resolve the path the same way `db.ts` does (from `__dirname`, not cwd). `NODE_ENV: 'test'` is already in the spawned child's env — leave it.
- [ ] No `.gitignore` change. `backend/data/` is already ignored (line 3).

**Acceptance criteria**
- Move a ticket on the board, run `cd backend && npm test`, reload the board — the ticket is where you left it.
- `backend/data/crmdb.test.sqlite` exists after a run; `backend/data/crmdb.sqlite` file mtime is unchanged by the run.
- The full existing backend suite still passes against the fresh test DB, including `agentTaskSeed.spec.ts` (23 rows) and `tickets.spec.ts` (12 seeds).
- With `TURSO_DATABASE_URL` set, nothing is deleted and the remote DB is used.

---

### 5. Frontend models and admin UI links
**Agent:** fe-coder
**Model:** sonnet — model fields plus template edits, inline templates and styles
**Depends on:** Groups 2 and 3 (the API must return the new fields)

- [ ] `frontend/src/app/core/models/ticket.model.ts` — `Ticket` gains `agentTaskId: number | null`. **Do not add `fullyReady`** — REQ-003 keeps it out of the UI on purpose. `TicketCreate` and `TicketCommentCreate` stay unchanged; the human form never sets either field.
- [ ] `frontend/src/app/core/models/agent-task.model.ts` — `AgentTask` gains `ticketId: number | null`.
- [ ] **Both new fields are required, not optional — every existing object literal that builds a `Ticket` or an `AgentTask` must gain the field or TypeScript fails with TS2741.** `ng build` does not compile spec files, so this breakage stays invisible until `npm test` runs. Fix it in the same group. Add the new field with a `null` default to every `Ticket` / `AgentTask` object literal or factory in these five files, on top of the two spec files group 8 already touches:
  - `frontend/src/app/core/services/ticket.service.spec.ts` — `const MOCK_TICKET: Ticket = {...}` → add `agentTaskId: null`.
  - `frontend/src/app/core/services/agent-task.service.spec.ts` — `const mockTask: AgentTask = {...}` → add `ticketId: null`.
  - `frontend/src/app/features/admin/agent-tasks/agent-task-list.component.spec.ts` — the `makeTask(...)` factory → add `ticketId: null`.
  - `frontend/src/app/features/admin/tickets/ticket-board.component.spec.ts` — its own `makeTicket()` factory, separate from ticket-detail's → add `agentTaskId: null`.
  - `frontend/src/app/features/admin/agent-tasks/agent-task-detail.component.spec.ts` — `const MOCK_TASK: AgentTask = {...}` → add `ticketId: null`.
  - Grep for further literals before finishing. These five are the ones found; assume the list is a floor, not a ceiling.
- [ ] `frontend/src/app/features/admin/tickets/ticket-detail.component.ts` — inside the existing `<dl class="row mt-3 text-muted small">` metadata block (the one with Erstellt / Aktualisiert), add an `@if (ticket.agentTaskId)` guarded `<dt class="col-sm-4">/<dd class="col-sm-8">` pair. Label the `dd` link **"App-Feedback #<id>"**, `routerLink` to `/admin/agent-tasks/<id>`. `RouterLink` is already imported. Hide the whole pair when there is no link.
- [ ] `frontend/src/app/features/admin/agent-tasks/agent-task-detail.component.ts` — same treatment in its `<dl class="row">`: `@if (task.ticketId)`, `<dt class="col-sm-3">/<dd class="col-sm-9">`, link text **"Ticket #<id>"**, `routerLink` to `/admin/tickets/<id>`. `RouterLink` is already imported.
- [ ] `frontend/src/app/features/admin/tickets/ticket-board.component.ts` — add a `.ticket-number` `<span>` showing `#{{ ticket.id }}` inside `.ticket-body-click`, next to `.ticket-title`, in **all five** column blocks (DEFINITION, TODO, IN_PROGRESS, ON_HOLD, DONE). Add the matching `.ticket-number` rule to the component's inline `styles` array, next to the existing `.ticket-title` / `.ticket-badges` / `.ticket-comment-count` rules (around line 646). Small, muted, secondary to the title.
- [ ] All new visible text in German. No new service methods, no new HTTP calls.

**Acceptance criteria**
- Ticket detail with a link → "App-Feedback #7" renders and navigates to `/admin/agent-tasks/7`. Without a link → neither `dt` nor `dd` is in the DOM.
- Feedback detail with a ticket → "Ticket #12" renders and navigates to `/admin/tickets/12`. Without → row absent.
- Every card in all five board columns shows its number badge.
- `fullyReady` appears nowhere in any frontend file. Grep proves it.
- `cd frontend && npx ng build` succeeds.
- `cd frontend && npm test` compiles — no TS2741 "property missing" error from any of the five listed spec files. Existing assertions keep passing.

---

### 6. Rechner "Wartezeit" colour update
**Agent:** fe-coder
**Model:** sonnet — the colour is already decided, so this is a scoped literal swap, not a design task
**Depends on:** nothing. Fully independent — no file overlap with any other group.

**Path correction:** an earlier draft of this work referenced `frontend/src/app/features/rechner/`. The real directory is **`frontend/src/app/features/produktivitaet/`**. Verified against the codebase. The plan uses the real path throughout — this is settled, not an open item.

- [ ] `frontend/src/app/features/produktivitaet/rechner.component.ts` line ~476 — `.flow-chip-wait { background: #f98752 }` → `#cf944f`.
- [ ] Same file, line ~1057 — the `getPieASlices()` entry `{ key: 'wait', ..., color: '#f98752', label: 'Wartezeit' }` → `#cf944f`.
- [ ] `frontend/src/app/features/produktivitaet/rechner.component.html` line ~41 — the `hatch-wait` pattern `<line ... stroke="#f98752" ...>` → `#cf944f`. Leave the `#f4e6d3` backing rect alone.
- [ ] **Do not touch** `frontend/src/styles.scss` line 191 — `.widget-card.warning` reuses `#f98752` as a border colour for an unrelated purpose.
- [ ] **Do not touch** AG Grid header colours anywhere. Out of scope per the PRD's Special Instructions.
- [ ] Do not touch the `barLimit` signal, `readBarLimit()`, `writeBarLimit()`, or the `rechner.barLimit` sessionStorage key. Verified byte-identical to the sibling repo. Documentation-only change lives in group 9.

**Acceptance criteria**
- `grep -r '#f98752' frontend/src/app/features/produktivitaet/` returns nothing except the spec file until group 8 lands.
- `grep -rn '#f98752' frontend/src/styles.scss` still returns line 191, unchanged.
- Pie slice, flow chip, and hatch stroke all render the new muted gold.

---

### 7. Backend tests
**Agent:** be-test-coder
**Model:** sonnet — new suites plus two migration specs with a non-obvious setup step
**Depends on:** Groups 1, 2, 3, 4

- [ ] Extend `backend/src/test/tickets.spec.ts`. Add `fullyReady: boolean` and `agentTaskId: number | null` to the local `Ticket` and `TicketListItem` interfaces at the top of the file. New describe blocks per the Test Strategy list, reproduced in the `## Tests` section below.
- [ ] Extend `backend/src/test/agentTasks.spec.ts`. Add `ticketId: number | null` to the local `AgentTaskDTO` interface. Cover the derived field on `/:id`, the list, and `/next`; newest-wins; ticket deleted → `null`.
- [ ] **The "no linked ticket → `ticketId === null`" case must mint its own throwaway `agent_task` row via a direct SQL INSERT, scoped to that one test.** Do not reuse one of the 23 seeded ids. Reason: `resetDatabase()` in `helpers.ts` never touches `ticket` / `ticket_comment`, so tickets created by earlier tests in the same file survive for the rest of the run. If an earlier new test already linked a ticket to the seeded id this case picks, the assertion passes or fails by execution order. A fresh row is provably unlinked. The "newest wins" cases are self-healing via the `id DESC` tie-break and can keep using seeded ids.
- [ ] **The "delete the linked feedback row" case needs a direct SQL DELETE inside the spec file.** There is no `DELETE /api/agent-tasks/:id` and no UI path — `POST /api/agent-tasks/reset` only flips status back to `OPEN`. Do not hunt for one.
- [ ] **Before that direct DELETE, run `await client.execute('PRAGMA foreign_keys = ON')` on the runner's own connection.** The spec file's `client` is a separate connection from the backend's, and it never runs `runMigrations()`, so `ON DELETE SET NULL` will not fire without this. Note also that `resetDatabase()` in `helpers.ts` deletes `agent_task` rows with foreign keys **OFF** and then re-seeds ids 1–23, so it neither triggers nor tests the cascade.
- [ ] New file `backend/src/test/ticketFullyReadyMigration.spec.ts` — import the exported `ensureTicketFullyReadyColumn()`. Case 1: call it twice, no throw, column present both times. Case 2: simulate a pre-existing DB — `ALTER TABLE ticket DROP COLUMN fullyReady`, assert it is gone, call the ensure-function, assert the column is back with default 0 on existing rows.
- [ ] New file `backend/src/test/ticketAgentTaskIdMigration.spec.ts` — same two cases for `ensureTicketAgentTaskIdColumn()`.
  - **Case 1 must assert the index, not just the column.** Call the ensure-function twice; after **each** call assert both that `PRAGMA table_info(ticket)` lists `agentTaskId` **and** that `PRAGMA index_list(ticket)` contains `idx_ticket_agentTaskId`. This is the case that exercises the "column already exists" branch — the branch that ships on every fresh DB and every restart. Without the index assertion here, an early-return implementation passes the suite while shipping no index.
  - Case 2 must `DROP INDEX IF EXISTS idx_ticket_agentTaskId` **before** `ALTER TABLE ticket DROP COLUMN agentTaskId` (SQLite refuses to drop an indexed column), then assert **both** the column and `idx_ticket_agentTaskId` come back. This is the regression guard for the index-ordering trap.
- [ ] `ALTER TABLE ... DROP COLUMN` is confirmed working on this repo's installed `@libsql/client@^0.17.3` / SQLite 3.45.1, including the drop-index-then-drop-column sequence, the re-add via `ADD COLUMN`, and the `duplicate column` error text the guard matches on. No fallback path needed.
- [ ] **Document the DROP COLUMN side effect in each migration spec's file-top doc comment:** dropping and re-adding a column resets `fullyReady` / `agentTaskId` to their column defaults for **every existing ticket row**, not just the schema. Harmless today — `workers: 1` keeps files serial, `tickets.spec.ts` fully resets the ticket table in its own `beforeAll` via `POST /api/tickets/reset`, and file ordering keeps these specs clear of anything reading persisted values. Say it out loud so a future spec author does not assume column values survive a migration-spec run.
- [ ] Both migration specs: use `test.describe.serial`, and restore a clean state in `afterAll` by calling the ensure-function once more. `workers: 1` keeps files serial, so later suites see a consistent schema.
- [ ] Follow existing conventions: file-top doc comment listing coverage, `agentCtx()` / `anonCtx()` / `loginCtx()` context factories, `resetDatabase()` in `beforeAll` where the suite depends on seed state.

**Acceptance criteria**
- `cd backend && npm test` passes, old suites included.
- `ticketAgentTaskIdMigration.spec.ts` Case 1 fails if `ensureTicketAgentTaskIdColumn()` returns early on the has-column path instead of always creating the index.
- Both migration specs fail if the index creation is moved back into the shared `executeMultiple` block.
- The feedback-delete test fails if `ON DELETE SET NULL` is missing from the column definition.
- The "no linked ticket" case passes regardless of which order the file's tests run in.

---

### 8. Frontend tests
**Agent:** fe-test-coder
**Model:** sonnet — extend three existing specs, update four literals in a fourth
**Depends on:** Groups 5 and 6

- [ ] `frontend/src/app/features/admin/tickets/ticket-detail.component.spec.ts` — add `agentTaskId` to the `makeTicket()` factory (default `null`). Two cases: link rendered with correct text and `href` when `agentTaskId` is set; `dt`/`dd` absent when `null`.
- [ ] `frontend/src/app/features/admin/agent-tasks/agent-task-detail.component.spec.ts` — same two cases for `ticketId` and the "Ticket #<id>" link. Group 5 already added the `null` default to `MOCK_TASK`; build the cases on top of it.
- [ ] `frontend/src/app/features/admin/tickets/ticket-board.component.spec.ts` — assert every card in all five columns renders the `.ticket-number` badge with the right id. Existing drag-drop, badge-helper, and `recentOnly` tests must keep passing.
- [ ] `frontend/src/app/features/produktivitaet/svg-util.spec.ts` — update the **four** `'#f98752'` wait-series literals (lines 148, 204, 228, 257) to `'#cf944f'`. These are the "colour-literal test assertions" the PRD refers to; they live frontend-side, not backend-side.
- [ ] `frontend/src/app/features/produktivitaet/rechner.component.spec.ts` — no changes. It has no colour literals, and its `barLimit` persistence tests cover untouched code.

**Acceptance criteria**
- `cd frontend && npm test` passes.
- No test asserts on `fullyReady` — the field is deliberately absent from the frontend.

---

### 9. Specs and documentation
**Agent:** ba-writer
**Model:** sonnet — six files, all facts already verified in the PRD and confirmed against code
**Depends on:** nothing factual. Can run in parallel with groups 1-8. Land it after groups 2 and 6 so wording matches shipped behaviour — group 2 for the ticket API fields, group 6 for the Rechner colour values.

- [ ] `docs/specs/SPEC-API-TICKETS.md`
  - "Ticket object" JSON sample (line ~39) and its bullet list: add `fullyReady` (boolean, default false, set at create only, never shown in the UI) and `agentTaskId` (nullable, write-once at create, link to an app-feedback item).
  - "Ticket list item" section (line ~69): note both fields are present there too.
  - `POST /api/tickets` (line ~299): body gains `agentTaskId?` and `fullyReady?`. Add the 400 row for an unknown `agentTaskId` naming `fieldErrors.agentTaskId`. No auth change — both fields ride the existing guard.
  - `POST /api/tickets/:id/comments` (line ~394): body gains `clearFullyReady?`. State that `clearFullyReady` and `handBackToAi` are independent, and that a rejected `handBackToAi` writes nothing at all.
  - **Fix the pre-existing seed bug** at line 497: the sentence claims the ticket seed "does not run on every startup — only when the DB is empty". Wrong. `runMigrations()` calls `seedTickets()` unconditionally and `ticketSeed.ts` uses `INSERT OR IGNORE` with fixed ids — same mechanism as `seedAgentTasks()`. Rewrite it accordingly.
  - **Wording caution:** describe the `fullyReady` consumer generically as "an automated, headless ticket-writing flow using the machine token". Never name a skill — this repo has none.
- [ ] `docs/specs/SPECS-database.md` — Ticket table (lines ~34-52): add both column rows. Replace "No FKs" with the `agentTaskId → agent_task(id) ON DELETE SET NULL` FK. Add `idx_ticket_agentTaskId` to the table's index line and to the index summary table (~line 282).
- [ ] `docs/specs/SPECS-backend.md` — Tickets section (~line 161): note the two new optional create fields and the new comment field. Add a line to the agent-tasks section noting the derived, never-stored `ticketId` on all three read paths and the pagination-first list query.
- [ ] `docs/specs/SPECS-testing.md` — add `ticketFullyReadyMigration.spec.ts` and `ticketAgentTaskIdMigration.spec.ts` to the backend file table (~line 172). Update the `tickets.spec.ts` and `agentTasks.spec.ts` rows. Update the "Global setup" section (~line 37) to describe the separate `crmdb.test.sqlite` file, its deletion at run start, and the `NODE_ENV=test` line in `playwright.config.ts`.
- [ ] `docs/specs/SPECS-ui.md` — exactly two lines: line 213 `Warten` value → `#cf944f`, and line 218 rewritten so the work/wait sentence names the new wait colour. **Leave line 130 (`.warning` = `#f98752`) alone** — different purpose. **No AG Grid header colour edits.**
- [ ] `docs/specs/SPECS-frontend.md` — Produktivität → Rechner section (~line 159): add the one missing sentence describing the bar-filter "remember my last choice" behaviour (`barLimit` persisted to `sessionStorage` under key `rechner.barLimit`). **Documentation only. No code change accompanies this line.**
- [ ] `docs/specs/DOMAIN.md` — no change. Confirmed.
- [ ] Add an `## Implementierung` section to `docs/prds/PRD-PORT-FEEDBACK-TICKETS-APIS.md` linking the commits/PR, per the repo's Commits & PRDs rule. Commit messages get the footer `PRD: docs/prds/PRD-PORT-FEEDBACK-TICKETS-APIS.md`.

**Acceptance criteria**
- Every statement in the six docs matches shipped code.
- The seed sentence in `SPEC-API-TICKETS.md` is corrected.
- No skill is named as the `fullyReady` consumer.
- None of the four out-of-scope items appear.

---

### 10. Verification
**Agent:** be-test-runner
**Model:** haiku — running suites and reporting pass/fail, no judgement needed
**Depends on:** everything. Last group.

- [ ] Run `cd backend && npm test`. Report pass/fail per suite. Hand `fe-test-runner` the frontend half (`cd frontend && npm test`) — coding and review agents never run suites themselves.
- [ ] Run `cd frontend && npx ng build`. Confirm success.
- [ ] Confirm `backend/data/crmdb.sqlite` is untouched by the backend run (compare mtime before and after).
- [ ] Confirm `backend/data/crmdb.test.sqlite` was created fresh.
- [ ] Start the app twice in a row against a pre-existing dev DB. Both startups clean, both columns present, `idx_ticket_agentTaskId` present after each, no data lost.
- [ ] Report results. Do not fix failures — route them back to the owning group's agent.

---

## Parallelism

- **Wave 1 (parallel):** Group 1, Group 4, Group 6, Group 9.
- **Wave 2 (parallel, after Group 1):** Group 2, Group 3. Both touch different files — no conflict.
- **Wave 3 (parallel, after Wave 2):** Group 5 (needs 2 and 3), Group 7 (needs 1-4 — all done by end of Wave 2). No file overlap: group 5 is frontend only, group 7 is backend tests only.
- **Wave 4:** Group 8 alone. It needs Group 5.
- **Wave 5:** Group 10.

Group 6 shares no file with any other group. Start it whenever a frontend slot is free.

Per repo convention, each coding group's diff goes to its matching reviewer before Group 10: `db-reviewer` for group 1, `be-reviewer` for 2-4, `fe-reviewer` for 5-6, `be-test-reviewer` for 7, `fe-test-reviewer` for 8, `ba-reviewer` for 9. `ui-reviewer` is optional on group 5's badge styling.

---

## Tests

### Backend integration tests — ticket suite (`tickets.spec.ts`)
- [ ] Create without `fullyReady` → response `fullyReady === false`.
- [ ] Create with `fullyReady: true` → `true`.
- [ ] Create with `fullyReady: false` explicitly → `false`.
- [ ] Comment with `clearFullyReady: true` on a `fullyReady` ticket → marker off.
- [ ] Comment with `clearFullyReady: true` on an already-off ticket → still off, 200, no error.
- [ ] Comment with `clearFullyReady: true` **and** `handBackToAi: true` on an `ON_HOLD+HUMAN` ticket → both applied, status `TODO`, owner `AI`.
- [ ] Comment with both flags on an **ineligible** ticket → 409, comment count unchanged, `fullyReady` unchanged. Assert both.
- [ ] `PATCH /:id/status`, `PATCH /:id/owner`, `POST /:id/hand-to-ai`, `POST /:id/wont-do` leave `fullyReady` untouched.
- [ ] Create with no `agentTaskId` → `null`.
- [ ] Create with `agentTaskId: null` → `null`.
- [ ] Create with a valid `agentTaskId` → stored, echoed.
- [ ] Create with a non-existent `agentTaskId` → 400, `fieldErrors.agentTaskId` present.
- [ ] Create with a non-integer `agentTaskId` (e.g. `1.5` or `"abc"`) → 400, field named.
- [ ] `agentTaskId` returns unchanged from `GET /:id`, `GET /api/tickets` (list), `GET /board`, and `GET /next`.
- [ ] Status change, owner change, comment, and done leave `agentTaskId` untouched.

### Backend integration tests — feedback suite (`agentTasks.spec.ts`)
- [ ] Feedback item with a linked ticket → `ticketId` is that ticket.
- [ ] Feedback item with no link → `ticketId === null`. Uses a freshly INSERTed throwaway `agent_task` row, not a seeded id.
- [ ] Two tickets pointing at one feedback item → the **newest** wins (create them in order; the `id DESC` tie-break covers same-millisecond timestamps).
- [ ] Delete the linked ticket via direct SQL → feedback item reports `null` again.
- [ ] Direct SQL DELETE of the feedback row (with `PRAGMA foreign_keys = ON` set on the runner connection first) → the ticket still exists, its `agentTaskId` is `null`, the ticket is not deleted.
- [ ] `ticketId` appears on `GET /:id`, on every item of the paginated list, and on `GET /next`.

### Backend migration tests
- [ ] `ticketFullyReadyMigration.spec.ts` — calling `ensureTicketFullyReadyColumn()` twice is safe; after `DROP COLUMN` the ensure-function re-adds the column and existing rows read back `0`.
- [ ] `ticketAgentTaskIdMigration.spec.ts` — calling `ensureTicketAgentTaskIdColumn()` twice is safe, and **both the column and `idx_ticket_agentTaskId` are present after each of the two calls**; after dropping the index and then the column, the ensure-function restores **both**, in that order, without error.
- [ ] **Side-effect caveat, stated in each file's doc comment:** `DROP COLUMN` resets that column's value on every existing ticket row to its default, not just the schema. Harmless under `workers: 1` with `tickets.spec.ts` resetting its own table, but do not assume persistence across a migration-spec run.
- [ ] **Concurrency caveat, stated in each file's doc comment:** these cover sequential re-runs only. Two-instance safety rests structurally on the `duplicate column` catch. A green suite is not proof of tested concurrency.

### Frontend unit tests
- [ ] Ticket detail shows "App-Feedback #<id>" with the right `routerLink` when `agentTaskId` is set; the row is absent when `null`.
- [ ] Feedback detail shows "Ticket #<id>" with the right `routerLink` when `ticketId` is set; absent when `null`.
- [ ] Board renders a `.ticket-number` badge on every card in all five columns.
- [ ] `svg-util.spec.ts` asserts `#cf944f` for the wait series in all four places.

### Edge cases and regression
- [ ] Existing API requests that omit all three new fields behave exactly as before.
- [ ] Every pre-existing ticket reads back `fullyReady: false`, `agentTaskId: null`.
- [ ] The full existing backend and frontend suites pass unchanged. All `Ticket` / `AgentTask` literals across the seven frontend spec files compile.
- [ ] `cd frontend && npx ng build` succeeds.
- [ ] Running the backend suite does not modify `backend/data/crmdb.sqlite`.

---

## Open Questions

1. **`agent_task` id reuse in `resetDatabase()`.** The helper deletes `agent_task` rows with foreign keys OFF, then re-seeds the same fixed ids 1–23. A ticket linked to id 5 before the reset still points at id 5 after it — a different row conceptually, same id. Harmless for the planned tests, but confirm no test should assert otherwise.
