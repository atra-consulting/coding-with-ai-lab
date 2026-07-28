# Implementation Plan: SHOW-TOTAL-PIPELINE-VALUE

## Test Command
`cd frontend && npx ng test --configuration=ci`

## Tasks

### 1. Frontend Component Update
- [ ] Add `totalWert = 0` property to `ChanceListComponent`
- [ ] Compute total in `ngOnInit` subscription: `this.totalWert = data.reduce((sum, c) => sum + (c.wert ?? 0), 0)`
- [ ] No backend changes needed (all data already fetched via `listAll()`)

### 2. Frontend Template Update
- [ ] Add total pipeline value display in the `.page-header` section of `chance-list.component.html`
- [ ] Format using existing `currencyFormatter` (de-DE, EUR)
- [ ] Show as a badge or text below/beside the title (e.g. "Gesamtwert: €1.234.567,00")

### 3. Test Implementation
- [ ] Write Jasmine unit test for `ChanceListComponent`
- [ ] Test: `totalWert` is computed correctly from `rowData`
- [ ] Test: `totalWert` is 0 when no data
- [ ] Test: `totalWert` handles null/undefined `wert` fields

### 4. Verification
- [ ] Run `cd frontend && npx ng test --configuration=ci` — all tests pass
- [ ] Run `cd frontend && npx ng build` — build succeeds

## Tests

### Unit Tests
- [ ] `totalWert` equals sum of all `wert` values when data loads
- [ ] `totalWert` is 0 on init (before data loads)
- [ ] `totalWert` treats null/undefined `wert` as 0
- [ ] Template renders the formatted total in the page header
