# Implementation Plan: RENAME-BEREIT-LABEL

## Summary
Pure display-text rename in the ticket Kanban board admin UI: "Zu bereit" becomes "Bereit" in two template locations of `ticket-board.component.ts` (the TODO KPI tile label and the TODO column header). The underlying `TODO` status enum, backend, and DB stay untouched — this is a template-string-only change. One existing spec assertion in `ticket-board.component.spec.ts` must be updated to match the new label text so the suite keeps passing.

## Business Summary
The "Zu bereit" label shown on the ticket board (both in the summary counter and the column heading) will now read simply "Bereit". No ticket data, workflow, or status logic changes — only the wording users see on screen.

## Test Command
`cd frontend && npx ng test --configuration=ci`

## Tasks
### 1. Rename display label in ticket board component
**Agent:** fe-coder
**Model:** haiku — mechanical, fully-specified two-string text replacement in one file, no logic involved

- [ ] In `frontend/src/app/features/admin/tickets/ticket-board.component.ts` line 87, change `<div class="kpi-label">Zu bereit</div>` to `<div class="kpi-label">Bereit</div>`
- [ ] In `frontend/src/app/features/admin/tickets/ticket-board.component.ts` line 247, change `<span class="column-title">Zu bereit</span>` to `<span class="column-title">Bereit</span>`
- [ ] Confirm no other "Zu bereit" occurrences exist in `ticket-board.component.ts` (the two above are the only in-scope ones; `ticket-detail.component.ts` occurrences are explicitly out of scope and must not be touched)

### 2. Test Implementation
**Agent:** fe-coder
**Model:** haiku — one-line assertion-string update tied 1:1 to the task-1 rename, same file family, no new test design or coverage decisions required

- [ ] In `frontend/src/app/features/admin/tickets/ticket-board.component.spec.ts` lines 189-193, update the test title from `renders the "Zu bereit" column header for the TODO column (renamed from "Zu erledigen")` to `renders the "Bereit" column header for the TODO column (renamed from "Zu bereit")`
- [ ] In the same test block, change the assertion `expect(header.textContent).toContain('Zu bereit')` to `expect(header.textContent).toContain('Bereit')`

## Tests
### Unit Tests
- [ ] `ticket-board.component.spec.ts`: renamed test confirms the TODO column header renders "Bereit" (not "Zu bereit")
- [ ] Full existing suite (`npx ng test --configuration=ci`) passes with no other regressions — confirms the KPI tile and column-header markup changes did not break any other selector-based assertions in the spec file
