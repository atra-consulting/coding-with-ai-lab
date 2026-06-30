# Implementation Plan: ADD-SEARCH-AKTIVITAETEN

## Test Command
`cd backend && npx playwright test`

## Tasks

### 1. Backend service — aktivitaetService.findAll
- [ ] Add optional `search?: string` param to `findAll` signature
- [ ] Add `WHERE LOWER(ak.subject) LIKE LOWER('%' || ? || '%')` condition when search is set
- [ ] Push search value to params array when active
- [ ] File: `backend/src/services/aktivitaetService.ts`

### 2. Backend route — aktivitaeten GET /
- [ ] Read `search` from `req.query['search']` as `string | undefined`
- [ ] Pass `search` to `aktivitaetService.findAll`
- [ ] File: `backend/src/routes/aktivitaeten.ts`

### 3. Test implementation
- [ ] T-1: `?search=angebot` → 14 results (fixture count)
- [ ] T-2: `?search=rechnung` → 5 results
- [ ] T-3: `?search=xyzzy` → 200 with empty content
- [ ] T-4: `?search=ANGEBOT` (uppercase) → same 14 results (case-insensitive)
- [ ] T-5: no search param → 75 total (baseline unaffected)
- [ ] T-6: `?search=angebot` without auth → 401
- [ ] T-7: `?search=angebot&typ=ANRUF` → combined filters work (subset of 14)
- [ ] File: `backend/src/test/aktivitaeten-search.spec.ts`

## Tests

### Fixture facts (from backend/src/seed/fixture.json)
- Total aktivitaeten: 75
- Subjects containing "angebot" (case-insensitive): 14
- Subjects containing "rechnung" (case-insensitive): 5
- "xyzzy" matches: 0

### Verification
- [ ] Run `cd backend && npx playwright test src/test/aktivitaeten-search.spec.ts`
- [ ] Confirm all tests pass
