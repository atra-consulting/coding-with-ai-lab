# Code Review: SHOW-TOTAL-PIPELINE-VALUE

## Summary

No blocking issues found. Three findings surfaced; all were reviewed and determined to not require code changes.

## Findings

### 1. totalWert not updated when AG Grid filters are applied (CONFIRMED — design intent)

`chance-list.component.ts:83`

`totalWert` is computed once from the full dataset on load and not recalculated when column filters are applied. When filters are active, `displayedRows` updates but `totalWert` stays at the full pipeline total.

**Decision:** No fix. The issue specification explicitly requests "sum of all `wert` values across all Chancen records" — showing the global pipeline KPI regardless of filters is the intended behavior and a standard CRM dashboard pattern.

### 2. Redundant @if (totalRows > 0) guard on `<small>` element (CONFIRMED — intentional)

`chance-list.component.html:6`

The `@if (totalRows > 0)` on the `<small class="text-muted">` always evaluates the same way as the inline `@if` in the `<h2>`.

**Decision:** No fix. The guard is intentional: removing it would render "Gesamtwert: 0,00 €" when the list is empty or still loading, which would be confusing to the user. The guard serves a real UX purpose even though it evaluates identically to the count condition.

### 3. totalWert as stored field rather than getter (PLAUSIBLE — suggestion)

`chance-list.component.ts:34`

`totalWert` could be a getter over `rowData` to eliminate the class field and the assignment in `ngOnInit`.

**Decision:** No fix. The stored field approach is clear and correct for a single-load component. A getter would be called on every change detection cycle, adding minor overhead with no benefit since `rowData` never mutates after load.

## Result: No changes required
