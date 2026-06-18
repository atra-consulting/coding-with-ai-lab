# Implementation Plan: ADD-SEARCH-TO-CHANCEN

## Test Command
`cd /home/runner/work/coding-with-ai-lab/coding-with-ai-lab/backend && npx playwright test`

## Tasks

### 1. Backend Service — chanceService.ts
- [ ] Add `search: string | undefined` as first parameter to `findAll`
- [ ] Add search condition: `LOWER(c.titel) LIKE LOWER('%' || ? || '%')` when search is provided
- [ ] Push search value into `params` before phase param to maintain correct SQL order

### 2. Backend Route — chancen.ts
- [ ] Read `req.query['search'] as string | undefined`
- [ ] Pass `search` as first argument to `chanceService.findAll`

### 3. Test Implementation — chancen-search.spec.ts
- [ ] S-1: search=ERP returns 5 matches, all titles contain "ERP"
- [ ] S-2: search=CRM returns 7 matches, all titles contain "CRM"
- [ ] S-3: search with no results returns 200 with empty content array
- [ ] S-4: search=CRM combined with phase=GEWONNEN returns 3 matches
- [ ] S-5: no search param — baseline unaffected (all 40 chancen)
- [ ] S-6: unauthenticated request returns 401

### 4. Verification
- [ ] Run backend Playwright tests
- [ ] Confirm all tests pass

## Tests

### S-1: Search by "ERP"
- 5 chancen with "ERP" in title in fixture
- All returned titles must contain "ERP" (case-insensitive)

### S-2: Search by "CRM"
- 7 chancen with "CRM" in title
- All returned titles must contain "CRM"

### S-3: No-match search
- Search for "XYZNONEXISTENT" → 200, content=[], totalElements=0

### S-4: Combined search + phase
- search=CRM + phase=GEWONNEN → 3 results (Werner, Wagner, Schäfer)

### S-5: Baseline (no search)
- Returns all 40 chancen

### S-6: Auth check
- 401 without session
