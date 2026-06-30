# Implementation Plan: ADD-SEARCH-AKTIVITAETEN

## Test Command
`cd backend && npx playwright test`

## Tasks

### 1. Backend service — aktivitaetService.findAll
- [x] Add optional `search?: string` param to `findAll` signature
- [x] Add `WHERE LOWER(ak.subject) LIKE LOWER('%' || ? || '%')` condition when search is set
- [x] Push search value to params array when active
- [x] File: `backend/src/services/aktivitaetService.ts`

### 2. Backend route — aktivitaeten GET /
- [x] Read `search` from `req.query['search']` as `string | undefined`
- [x] Pass `search` to `aktivitaetService.findAll`
- [x] File: `backend/src/routes/aktivitaeten.ts`

### 3. Test implementation
- [x] T-1: `?search=angebot` → 14 results (fixture count)
- [x] T-2: `?search=rechnung` → 5 results
- [x] T-3: `?search=xyzzy` → 200 with empty content
- [x] T-4: `?search=ANGEBOT` (uppercase) → same 14 results (case-insensitive)
- [x] T-5: no search param → 75 total (baseline unaffected)
- [x] T-6: `?search=angebot` without auth → 401
- [x] T-7: `?search=angebot&typ=ANRUF` → combined filters work (4 results)
- [x] T-8: `?search=` (empty string) → 75 total (no-filter fallback)
- [x] File: `backend/src/test/aktivitaeten-search.spec.ts`

## Tests

### Fixture facts (from backend/src/seed/fixture.json)
- Total aktivitaeten: 75
- Subjects containing "angebot" (case-insensitive): 14
- Subjects containing "rechnung" (case-insensitive): 5
- "xyzzy" matches: 0
- angebot + typ=ANRUF: 4

### Verification
- [x] Run `cd backend && npx playwright test src/test/aktivitaeten-search.spec.ts`
- [x] Confirm all tests pass (8/8 green)
