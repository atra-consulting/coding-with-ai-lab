# Implementation Plan: SORT-ACTIVITY-DATE-DESC

## Test Command
`cd frontend && npx ng test --configuration=ci`

## Tasks

### 1. Frontend — AG Grid Default Sort

- [ ] `frontend/src/app/features/aktivitaet/aktivitaet-list/aktivitaet-list.component.ts`
  — Add `initialSort: 'desc'` to the `datum` column definition in `columnDefs`.
  Use `initialSort` (not `sort`) so the default is applied once at grid creation and
  does not override user-applied sorts when column defs are re-evaluated.
  No template or other source file changes needed.
  Backend `listAll()` already returns `ORDER BY datum DESC` — no backend changes needed.

### 2. Test Implementation

- [ ] Create `frontend/src/app/features/aktivitaet/aktivitaet-list/aktivitaet-list.component.spec.ts`
  TestBed setup: standalone component import, `provideRouter([])`,
  `provideHttpClient()`, `provideHttpClientTesting()`,
  spy on `AktivitaetService.listAll` returning `of([])`.

  Test cases:
  - Component creates successfully
  - `datum` column definition has `initialSort: 'desc'`
  - `loading` starts as `true` before service responds
  - `loading` becomes `false` after service responds
  - Grid receives `rowData` from service response
  - Loading spinner shown while loading, hidden after load

### 3. Verification

- [ ] `cd frontend && npx ng build` — TypeScript compile check
- [ ] `cd frontend && npx ng test --configuration=ci` — all tests pass

## Tests

### Unit Tests
- [ ] `initialSort: 'desc'` on datum ColDef — directly asserts the change
- [ ] Loading state transitions — tests `@if (loading)` branch
- [ ] `rowData` populated from service — tests data-loaded state
- [ ] Spinner shown/hidden based on `loading` flag
