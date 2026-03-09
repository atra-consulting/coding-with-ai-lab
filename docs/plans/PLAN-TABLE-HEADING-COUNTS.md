# Implementation Plan: TABLE-HEADING-COUNTS

## Test Command
`cd frontend && npx ng build`

## Problem
Heading shows "Firmen: 0/100" on initial load (no filter active) because `displayedRows` is 0 before grid renders rows. The count comparison `displayedRows === totalRows` is unreliable for detecting filter state.

## Solution
Use `gridApi.isAnyFilterPresent()` to detect active filters instead of comparing row counts.

## Tasks

### 1. Add `isFilterActive` property to all 9 list components (.ts)
- [ ] Add `isFilterActive = false;` property
- [ ] In `updateCounts()`: set `this.isFilterActive = this.gridApi.isAnyFilterPresent();`

### 2. Update heading template in all 9 list components (.html)
- [ ] Change from: `displayedRows === totalRows ? totalRows : displayedRows + '/' + totalRows`
- [ ] Change to: `isFilterActive ? displayedRows + '/' + totalRows : totalRows`

### 3. Verification
- [ ] `npx ng build` passes
- [ ] No filter → "Firmen: 100"
- [ ] Filter active → "Firmen: 10/100"

## Components (9 total)
1. abteilung-list
2. adresse-list
3. aktivitaet-list
4. benutzer-list
5. chance-list
6. firma-list
7. gehalt-list
8. person-list
9. vertrag-list
