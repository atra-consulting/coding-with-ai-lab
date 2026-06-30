# Implementation Plan: CHANCEN-PIPELINE-TOTAL

## Test Command
`cd frontend && npm run test:ci`

## Context
The Chancen list already shows total wert (`Gesamtwert`) and row count in the header.
Total wert is computed client-side from the `/api/chancen/all` response.
Row count already shows `displayed/total` when filters are active — wert display should be consistent.

No backend changes needed (wert field is already returned in all responses).

## Tasks

### 1. Frontend — Component (`chance-list.component.ts`)
- [ ] Add `displayedWert = 0` property (alongside `displayedRows`)
- [ ] In `updateCounts()`, add `forEachNodeAfterFilter` loop to compute `displayedWert`

### 2. Frontend — Template (`chance-list.component.html`)
- [ ] Show `displayedWert / totalWert` when `isFilterActive` is true
- [ ] Keep existing `totalWert`-only display when no filter is active
- [ ] Outer `@if (totalRows > 0)` guard stays unchanged

### 3. Frontend — Tests (`chance-list.component.spec.ts`)
- [ ] Add `displayedWert` initial state tests (mirrors existing `totalWert initial state`)
- [ ] Add template tests for conditional display (no-filter case and filter-active case)

## Tests

### Unit Tests
- `displayedWert` defaults to 0 before data loads
- Template shows no `/` separator when `isFilterActive` is false
- Template shows `displayedWert / totalWert` separator when `isFilterActive` is true

### Verification
- Run `cd frontend && npm run test:ci`
- All existing tests must stay green
