# Implementation Plan: ADD-AKTIVITAETEN-FIRMA-FILTER

## Test Command
`cd backend && npx playwright test`

## Tasks

### 1. Backend Service — aktivitaetService.ts
- [x] Add `import type { InValue } from '@libsql/client'`
- [x] Change `findAll` signature: `findAll(page, size, sort, firmaId?: number)`
- [x] Conditionally build WHERE clause on `ak.firmaId = ?` when `firmaId` is present
- [x] Apply WHERE to both COUNT query and rows query

### 2. Backend Route — aktivitaeten.ts
- [x] Parse `firmaId` from `req.query` (same pattern as personen route for abteilungId)
- [x] Pass parsed `firmaId` to `aktivitaetService.findAll`

### 3. Test Implementation
- [x] Add Playwright API test: `GET /api/aktivitaeten?firmaId=<id>` returns only matching activities
- [x] Add test: `GET /api/aktivitaeten?firmaId=0` or invalid → returns all (treated as no filter)
- [x] Add test: `GET /api/aktivitaeten?firmaId=<valid>` returns subset

### 4. Verification
- [x] Run backend tests
- [x] Confirm no regressions on existing aktivitaeten tests
