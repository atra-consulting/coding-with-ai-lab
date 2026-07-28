# Implementation Plan: TICKET-DEFINITION-STATUS

Add a **`DEFINITION`** status + leftmost column to the Kanban ticket system. Make ticket `status` a real DB enum. Rename the "Zu erledigen" column to "Zu bereit". Add two Definition actions on the ticket detail page.

## Test Command

- Backend: `cd backend && npx playwright test`
- Frontend: `cd frontend && npx ng test --watch=false --browsers=ChromeHeadless`

## Decisions (confirmed by user)

- New tickets **start in `DEFINITION`** (leftmost column), not `TODO`.
- Second button reads **"Nach Bereit"**. Column label becomes **"Zu bereit"** (status stays `TODO`).
- The two Definition buttons live on the **ticket detail page** (Aktionen panel), like the "Zurück an KI" action in Wartend. Board cards stay compact.
- `status` becomes an **enum**: DB-level `CHECK` constraint + Drizzle typed enum.

## Semantics

New status order (left → right): `DEFINITION → TODO ("Zu bereit") → IN_PROGRESS → ON_HOLD → DONE`.

`DEFINITION` = intake / refinement column. A human refines the ticket (comment thread, same as Wartend). Then, on the detail page:
- **"An KI übergeben"** → `owner=AI`, `status=TODO`. Ticket becomes claimable by the agent (`GET /next`).
- **"Nach Bereit"** → `status=TODO`, owner unchanged. Ready, but a human keeps it.

Agents still only claim `TODO`+`AI`. `DEFINITION` tickets are never auto-claimed.

---

## Tasks

### 1. Backend — enum + status value (db-coder / be-coder)

- [ ] `backend/src/db/schema/enums.ts`: add `'DEFINITION'` to `TICKET_STATUS`, first in the array: `['DEFINITION', 'TODO', 'IN_PROGRESS', 'ON_HOLD', 'DONE']`.
- [ ] `backend/src/config/migrate.ts`: make `status` a DB enum. Add a `CHECK (status IN ('DEFINITION','TODO','IN_PROGRESS','ON_HOLD','DONE'))` constraint to the `ticket.status` column. Change column `DEFAULT` from `'TODO'` to `'DEFINITION'`.
  - Note: `CREATE TABLE IF NOT EXISTS` does not alter an existing table. Existing local DBs need `./start.sh --reset-db`. Tests seed/reset a fresh DB, so the constraint applies there.
- [ ] `backend/src/db/schema/schema.ts`: type the column as an enum — `status: text('status', { enum: TICKET_STATUS }).notNull().default('DEFINITION')` (import `TICKET_STATUS` from `enums.ts`). Same for consistency-only; DDL is the source of truth for the DB.

### 2. Backend — service (be-coder)

- [ ] `TicketBoardDTO`: add `DEFINITION: TicketListItemDTO[]`.
- [ ] `getBoard()`: init board with `DEFINITION: []`; bucket rows with `status === 'DEFINITION'`.
- [ ] `getSummary()`: `byStatus` initial object includes `DEFINITION: 0`.
- [ ] `create()`: insert `status = 'DEFINITION'` (was `'TODO'`). Owner stays `HUMAN`.
- [ ] New method `handToAi(id)`: guarded UPDATE `SET owner='AI', status='TODO', updatedAt=? WHERE id=? AND status='DEFINITION'`. On 0 rows → `findById` (404 if missing) else `ConflictError` 409 ("nicht im Status DEFINITION"). Return fresh ticket. (Pattern mirrors `start()`.)
- [ ] "Nach Bereit" reuses existing `setStatus(id, 'TODO')` — no new service method needed (into non-DONE clears solution/resolvedAt; both already null).

### 3. Backend — routes (be-coder)

- [ ] `routes/tickets.ts`: add `POST /:id/hand-to-ai` (admin: `requireAuth` + `requireRole('ADMIN')`) → `ticketService.handToAi(id)`. Place among the parameterised admin endpoints.
- [ ] No zod changes needed: `StatusBodySchema` / list-filter validation already derive from `TICKET_STATUS`, so `DEFINITION` is accepted automatically (drag-to-Definition + `?status=DEFINITION`).

### 4. Frontend — model + service (fe-coder)

- [ ] `core/models/ticket.model.ts`: `TicketStatus` add `'DEFINITION'` (first). `TicketBoard` add `DEFINITION: Ticket[]`. `TicketSummary.byStatus` add `DEFINITION: number`.
- [ ] `core/services/ticket.service.ts`: add `handToAi(id): Observable<Ticket>` → `POST /api/tickets/${id}/hand-to-ai`. ("Nach Bereit" uses existing `setStatus(id, 'TODO')`.)

### 5. Frontend — board (fe-coder + ui-designer)

- [ ] `ticket-board.component.ts`: add `definition: Ticket[] = []`; `loadBoard()` assigns `board.DEFINITION`.
- [ ] Add a new **leftmost** Definition column (before the TODO column): header "Definition", `cdkDropList id="list-DEFINITION"`, `(cdkDropListDropped)="onDrop($event, 'DEFINITION')"`. Card markup identical to other columns (no inline buttons — actions live on detail page).
- [ ] Update **all** `[cdkDropListConnectedTo]` arrays: every column connects to `list-DEFINITION`, and the Definition column connects to the other four.
- [ ] Rename TODO column header "Zu erledigen" → **"Zu bereit"**.
- [ ] KPI tiles: rename the TODO tile label "Zu erledigen" → "Zu bereit"; add a 5th KPI tile for `summary.byStatus.DEFINITION` (label "Definition").
- [ ] Styles: `.board-container` grid `repeat(4, 1fr)` → `repeat(5, 1fr)`; add `.column-definition` header color + a `.kpi-definition` tile style. Keep responsive breakpoints working (2-col / 1-col fallbacks).

### 6. Frontend — detail page (fe-coder)

- [ ] `statusLabel()`: add `'DEFINITION'` → "Definition"; change `'TODO'` → "Zu bereit".
- [ ] `statusBadgeClass()`: add a `'DEFINITION'` case (e.g. `badge bg-info text-dark`).
- [ ] Aktionen panel: when `ticket.status === 'DEFINITION'`, show a **Definition actions** group with two buttons: **"An KI übergeben"** (calls `handToAi`) and **"Nach Bereit"** (calls `setStatus(id,'TODO')`). Hide the generic owner-toggle button while `status === 'DEFINITION'` to avoid duplicate "An KI übergeben".
- [ ] Add `handToAi()` and `moveToReady()` handlers (loading flags, success/error notifications, update `this.ticket` from response).
- [ ] Update `toggleOwner()` success message + `toggleOwnerTitle` strings: "Zu erledigen" → "Zu bereit".

### 7. Rename sweep

- [ ] Grep `Zu erledigen` across `frontend/src` and rename every occurrence that labels the `TODO` status → "Zu bereit" (board header, KPI label, detail status label, toggleOwner strings). Leave unrelated strings untouched.

### 8. Docs

- [ ] `docs/API-TICKETS.md`:
  - Add `DEFINITION` to the status lifecycle diagram + state machine, as the new leftmost/intake status.
  - Board shape (`GET /board`) gains a `DEFINITION` array; summary shape (`GET /summary`) `byStatus` gains `DEFINITION`.
  - Create section: note new tickets are created with `status=DEFINITION` (was `TODO`). (The create call itself is **already documented** — `POST /api/tickets`, no new call to add.)
  - Document the new `POST /api/tickets/:id/hand-to-ai` (admin) endpoint + result table.
  - Add the `DEFINITION → TODO` transitions (hand-to-ai; "Nach Bereit" via `PATCH /status`).
  - Sortable/filterable `status` now includes `DEFINITION`.
- [ ] `CLAUDE.md` Ticket System section: "four columns" → "five columns" incl. `DEFINITION`; note new tickets default to `DEFINITION`.

---

## Tests

### Backend — Playwright (`backend/src/test/tickets.spec.ts`) (be-test-coder)

- [ ] **Create** now returns `status: 'DEFINITION'` (update any existing assertion that expected `TODO`).
- [ ] **Board** response includes a `DEFINITION` array; a freshly created ticket appears in it.
- [ ] **Summary** `byStatus` includes `DEFINITION` with correct count.
- [ ] **hand-to-ai happy path**: `POST /:id/hand-to-ai` on a `DEFINITION` ticket → 200, `owner=AI`, `status=TODO`.
- [ ] **hand-to-ai guard**: on a non-`DEFINITION` ticket → 409; unknown id → 404; non-admin → 401/403.
- [ ] **"Nach Bereit"**: `PATCH /:id/status {status:'TODO'}` on a `DEFINITION` ticket → 200, `status=TODO`, owner unchanged.
- [ ] **Enum**: `?status=DEFINITION` filter accepted (200); invalid status still 400.
- [ ] Regression: agent `GET /next` does NOT claim `DEFINITION` tickets (only `TODO`+`AI`).

### Frontend — Jasmine/Karma (fe-test-coder)

- [ ] `ticket.service.spec.ts`: add `handToAi` posts to the right URL.
- [ ] `ticket-board.component.spec.ts`: renders 5 columns incl. Definition; "Zu bereit" header present; Definition list populated from board data.
- [ ] `ticket-detail.component.spec.ts`: for a `DEFINITION` ticket both buttons render; "An KI übergeben" calls `handToAi`; "Nach Bereit" calls `setStatus(id,'TODO')`; status label shows "Definition"; generic owner-toggle hidden.

### Verification

- [ ] Run backend Playwright suite — all green.
- [ ] Run frontend Karma suite — all green.
- [ ] `cd frontend && npx ng build` — no type errors.
