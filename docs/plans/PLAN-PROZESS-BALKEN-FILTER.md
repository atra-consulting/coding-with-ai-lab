# Implementation Plan: PROZESS-BALKEN-FILTER

Three independent changes in one branch.

1. **Frontend:** Filter button on the Prozessvergleich card. Cycles which process bars show.
2. **Backend:** New EMAIL agent task. Body: "Ich möchte Notizen für eine Person anlegen."
3. **Frontend:** "Kürzlich geändert" toggle on the Ticket-Board. Shows only tickets changed in the last 60 minutes.

## Test Command

- Frontend: `cd frontend && npm run test:ci`
- Backend: `cd backend && npm test`

## Part 1 — Bar Filter Button (Frontend)

### Behavior

- Button sits on the Prozessvergleich card, next to the caption.
- Click cycles through 4 states:
  - **Alle** (default) — all four bars show.
  - **1** — only bar 1.
  - **1–2** — bars 1 and 2.
  - **1–3** — bars 1, 2, 3.
  - Next click → back to **Alle**.
- Button label shows the current state.
- Scale stays fixed. Bar widths keep using all four totals (`getComparisonBars` unchanged). Hiding a bar does not resize the others. Less surprising.
- Filter only affects the Prozessvergleich card. The Schritt-Zeiten tabs still show all four processes.

### Tasks

- [ ] `rechner.component.ts`: add `barLimit = signal(0)` (`0` = all; `1`/`2`/`3` = first N bars).
- [ ] `rechner.component.ts`: add `cycleBarLimit()` — advances `0 → 1 → 2 → 3 → 0`.
- [ ] `rechner.component.ts`: add `isBarVisible(index: number): boolean` — `barLimit() === 0 || index < barLimit()`.
- [ ] `rechner.component.ts`: add `barLimitLabel = computed(...)` — maps state to text ("Alle Balken", "Nur Balken 1", "Balken 1–2", "Balken 1–3").
- [ ] `rechner.component.html`: add a `btn btn-outline-primary btn-sm` button in the Prozessvergleich card header row. `(click)="cycleBarLimit()"`, `type="button"`, text `{{ barLimitLabel() }}`, plus an `aria-label` naming the action ("Sichtbare Balken wechseln").
- [ ] `rechner.component.html`: wrap the comparison `@for` row body in `@if (isBarVisible($index))`. Keep the `@for` and `track` intact — guard the inner `<div class="cmp-row">` only.
- [ ] Keep the visually-hidden `#cmp-desc` list unchanged (describes the full comparison).

### Frontend Tests

- [ ] `rechner.component.spec.ts`: default `barLimit()` is `0`; all four bars visible.
- [ ] `rechner.component.spec.ts`: `cycleBarLimit()` steps `0 → 1 → 2 → 3 → 0`.
- [ ] `rechner.component.spec.ts`: `isBarVisible` returns correct booleans for each state (e.g. state `2` → indexes 0,1 visible; 2,3 hidden).
- [ ] `rechner.component.spec.ts`: `barLimitLabel()` matches each state.
- [ ] (If feasible) render test: clicking the button reduces the number of `.cmp-row` elements.

## Part 2 — New EMAIL Agent Task (Backend)

### Tasks

- [ ] `backend/src/seed/agentTaskSeed.ts`: append row `id: 23`, `source: 'EMAIL'`, a fitting `title`, `body: 'Ich möchte Notizen für eine Person anlegen.'`, `status: 'OPEN'`, sensible `metadata` (sender + subject), `createdAt`/`updatedAt` after id 22 (e.g. `2026-06-15...`).

### Backend Test Updates (counts change 22 → 23, EMAIL 6 → 7)

- [ ] `backend/src/test/agentTaskSeed.spec.ts`: change all `toBe(22)` → `toBe(23)`; `EMAIL: 6` → `EMAIL: 7`; header comment "22 rows" and "6 rows for EMAIL" → 23 / 7.
- [ ] `backend/src/test/agentTasks.spec.ts`:
  - EMAIL-claim test (~line 152): loop `i < 6` → `i < 7`; `unique.size).toBe(6)` → `toBe(7)`; title/comments "all 6 claimed" → "all 7 claimed"; "7th call returns 204" → "8th call returns 204".
  - `totalElements` `toBe(22)` (~line 594) → `toBe(23)`.
  - reset `toBe(22)` (~line 794) → `toBe(23)`.
  - ID-range doc comment (~line 26): add id 23 to the EMAIL range.
- [ ] Scan for any other hardcoded `22` / EMAIL `6` count in `backend/src/test/`.

## Part 3 — "Kürzlich geändert" Ticket Toggle (Frontend)

File: `frontend/src/app/features/admin/tickets/ticket-board.component.ts` (+ its spec).

### Behavior

- Toggle button in the page header, next to "Neues Ticket".
- Default label **"Kürzlich geändert"** — all tickets show.
- Pressed → board shows only tickets whose `createdAt` **or** `updatedAt` is within the last 60 minutes. Label flips to **"Alle"**.
- Pressed again → all tickets show, label back to **"Kürzlich geändert"**.
- Filter is a client-side view over the already-loaded board. No backend change.

### Drag-drop interaction

- The 5 board arrays (`definition`, `todo`, …) stay the full source of truth (CDK mutates them on drop).
- Render *view* arrays (`viewDefinition`, …). When filter off, `viewX = X` (same reference — drag-drop works exactly as today). When on, `viewX = X.filter(isRecent)`.
- `@for` and `[cdkDropListData]` bind to the `viewX` arrays.
- Disable dragging while filtered (`[cdkDragDisabled]="recentOnly"`) — rearrange in "Alle" mode. Avoids index mismatch between filtered view and full array.
- KPI summary cards keep showing global totals (server `summary`) — unaffected by the view filter.

### Tasks

- [ ] Add `recentOnly = false` and `readonly RECENT_WINDOW_MS = 60 * 60 * 1000`.
- [ ] Add `viewDefinition/viewTodo/viewInProgress/viewOnHold/viewDone` arrays.
- [ ] Add `isRecent(ticket): boolean` — `now - Date.parse(updatedAt) <= window || now - Date.parse(createdAt) <= window`.
- [ ] Add `refreshView()` — sets each `viewX` from the full array (filtered when `recentOnly`).
- [ ] Add `toggleRecent()` — flips `recentOnly`, calls `refreshView()`.
- [ ] Call `refreshView()` at the end of `loadBoard()` and after each drop's optimistic update.
- [ ] Template: add toggle button in `.page-header`. Label `{{ recentOnly ? 'Alle' : 'Kürzlich geändert' }}`, `type="button"`, `[attr.aria-pressed]="recentOnly"`, `btn btn-outline-secondary`.
- [ ] Template: point every column's `@for`, count badge, empty check, and `[cdkDropListData]` at the matching `viewX` array; add `[cdkDragDisabled]="recentOnly"` on each `cdkDrag` card.

### Frontend Tests (Part 3)

- [ ] Default `recentOnly` false; all board tickets visible in the view arrays.
- [ ] `isRecent` boundary: a ticket updated 30 min ago → true; 90 min ago → false.
- [ ] `toggleRecent()` flips state and filters the view arrays; toggling back restores full arrays.
- [ ] (If feasible) render: pressing the button reduces `.ticket-card` count and button text becomes "Alle".

## Verification

- [ ] `cd frontend && npm run test:ci` — green.
- [ ] `cd backend && npm test` — green.
- [ ] `cd frontend && npx ng build` — builds clean.
- [ ] Manual/Playwright: Prozessvergleich button cycles bars; Ticket-Board toggle hides old tickets; `/admin/agent-tasks?source=EMAIL` shows the new task after backend restart.
