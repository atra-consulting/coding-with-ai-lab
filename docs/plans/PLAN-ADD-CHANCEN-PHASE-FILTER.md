# Implementation Plan: ADD-CHANCEN-PHASE-FILTER

## Test Command
`cd backend && npx playwright test --reporter=line 2>&1`

## Analysis

The `phase` filter is **already implemented** on `main` (via merge commit `2fa847f`, PR #110). No code changes needed.

Implemented in:
- `backend/src/routes/chancen.ts` — validates and passes `phase` query param
- `backend/src/services/chanceService.ts` — appends WHERE clause when phase is set

Tests already written in `backend/src/test/chancen-phase-filter.spec.ts`:
- F-1: Filter by NEU (expects 7 results)
- F-2: Filter by GEWONNEN (expects 10 results)
- F-3: No filter, all 40 results returned
- F-4: Invalid phase value → 400
- F-5: Filter by VERLOREN (expects 4 results)
- F-6: Unauthenticated → 401

## Tasks

### 1. Verification
- [x] Confirm implementation exists in routes/chancen.ts
- [x] Confirm implementation exists in services/chanceService.ts
- [x] Confirm tests exist in chancen-phase-filter.spec.ts

### 2. Test Execution
- [ ] Run backend tests to verify all phase filter tests pass

### 3. PR
- [ ] Create PR documenting that task was already implemented and verified
