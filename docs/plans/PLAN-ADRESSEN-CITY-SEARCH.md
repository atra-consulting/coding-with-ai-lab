# Implementation Plan: ADRESSEN-CITY-SEARCH

Add optional `search` query param to `GET /api/adressen`. Filter by city. Mirror `firmaService.findAll`.

Source: agent-task 22 (ERROR_REPORT).

## Test Command
`cd backend && npx playwright test`

## Tasks

### 1. Service — `backend/src/services/adresseService.ts`
- [ ] Change `findAll` signature: add `search: string | undefined` as first param. New order: `(search, page, size, sort)`.
- [ ] Import `InValue` type from `@libsql/client` (like firmaService).
- [ ] Build conditional `where`: `search ? "WHERE LOWER(a.city) LIKE LOWER('%' || ? || '%')" : ''`.
- [ ] Build `params: InValue[] = search ? [search] : []`.
- [ ] COUNT query: `SELECT COUNT(*) AS cnt FROM adresse a ${where}`, args `[...params]`. (Add alias `a` so the where-clause column `a.city` resolves.)
- [ ] Rows query: append `${where}` before `ORDER BY`, args `[...params, size, page * size]`.

### 2. Route — `backend/src/routes/adressen.ts`
- [ ] In `GET /`, read `const search = req.query['search'] as string | undefined`.
- [ ] Pass `search` as first arg: `adresseService.findAll(search, page, size, sort)`.
- [ ] Update the route comment to `// GET /api/adressen — paginated + search`.

### 3. Verification
- [ ] `cd backend && npx tsc --noEmit` (type check — confirms no other callers broke).
- [ ] Run Playwright suite.

## Tests

New file: `backend/src/test/adressen-search.spec.ts` (mirror existing adressen spec setup: `resetDatabase`, `loginCtx('admin','admin123')`, `BASE_URL`).

### Integration Tests
- [ ] `GET /api/adressen?search=<city>` returns only addresses whose city matches (case-insensitive). Seed/create two addresses with distinct cities; assert filtered `content` and `totalElements`.
- [ ] `GET /api/adressen?search=<partial>` matches substring (LIKE `%term%`).
- [ ] Search is case-insensitive (e.g. `berlin` matches `Berlin`).
- [ ] `GET /api/adressen` without `search` returns all (unchanged behavior, pagination intact).
- [ ] `GET /api/adressen?search=<nomatch>` returns empty `content`, `totalElements: 0`.

### Edge Cases
- [ ] Empty `search=` behaves like no search (returns all). Note: empty string is falsy → `where` stays empty. Verify.
- [ ] Auth still enforced: anon request → 401.
