# Implementation Plan: ADD-AKTIVITAETEN-FIRMA-FILTER

## Test Command
`cd backend && npx playwright test`

## Tasks

### 1. Backend Service — aktivitaetService.ts
- [ ] Add `import type { InValue } from '@libsql/client'`
- [ ] Change `findAll` signature: `findAll(page, size, sort, firmaId?: number)`
- [ ] Conditionally build WHERE clause on `ak.firmaId = ?` when `firmaId` is present
- [ ] Apply WHERE to both COUNT query and rows query

### 2. Backend Route — aktivitaeten.ts
- [ ] Parse `firmaId` from `req.query` (same pattern as personen route for abteilungId)
- [ ] Pass parsed `firmaId` to `aktivitaetService.findAll`

### 3. Test Implementation
- [ ] Add Playwright API test: `GET /api/aktivitaeten?firmaId=<id>` returns only matching activities
- [ ] Add test: `GET /api/aktivitaeten?firmaId=0` or invalid → returns all (treated as no filter)
- [ ] Add test: `GET /api/aktivitaeten?firmaId=<valid>` returns subset

### 4. Verification
- [ ] Run backend tests
- [ ] Confirm no regressions on existing aktivitaeten tests
