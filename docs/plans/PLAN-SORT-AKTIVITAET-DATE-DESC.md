# Implementation Plan: SORT-AKTIVITAET-DATE-DESC

## Test Command
`cd backend && npx playwright test`

## Status

The implementation is already complete:
- `backend/src/services/aktivitaetService.ts` `listAll()` uses `ORDER BY ak.datum DESC`
- `backend/src/routes/aktivitaeten.ts` defaults to `datum, DESC`
- `frontend/.../aktivitaet-list.component.ts` has `initialSort: 'desc'` on datum column
- Frontend unit tests already verify `initialSort === 'desc'`

The only gap: **no backend Playwright tests** for the aktivitaet routes.

## Tasks

### 1. Add Backend Playwright Tests
- [ ] Create `backend/src/test/aktivitaeten-crud.spec.ts`
- [ ] `beforeAll`: call `resetDatabase()` first, then `loginCtx('admin', 'admin123')`, then `playwrightRequest.newContext({ baseURL })` for anon. Declare `createdId: number | undefined`.
- [ ] `afterAll`: dispose both contexts.
- [ ] Test `GET /api/aktivitaeten/all` → 200, is an array, fixture data present, adjacent pairs satisfy `body[i].datum >= body[i+1].datum`
- [ ] Test `GET /api/aktivitaeten` (no params) → 200, Spring-Data-Page shape: `content`, `totalElements > 0`, `totalPages > 0`, `size > 0`, `number === 0`, `first` and `last` are booleans
- [ ] Test `GET /api/aktivitaeten` default sort → content has `content[i].datum >= content[i+1].datum` for all adjacent pairs
- [ ] Test `POST /api/aktivitaeten` → 201, body `{ typ: 'ANRUF', subject: 'Test Aktivitaet', datum: '2025-01-15T10:00:00.000Z' }`, assert `id`, `typ === 'ANRUF'`, `subject`, `datum`, `createdAt`, `updatedAt` are present. Store `createdId`.
- [ ] Test `GET /api/aktivitaeten/:createdId` → 200, `body.id === createdId`
- [ ] Test `PUT /api/aktivitaeten/:createdId` → body `{ typ: 'ANRUF', subject: 'Geänderter Betreff', datum: '2025-01-15T10:00:00.000Z' }`, assert 200 and `body.subject === 'Geänderter Betreff'`; follow-up GET reflects change
- [ ] Test `DELETE /api/aktivitaeten/:createdId` → 204; GET → 404
- [ ] Test `GET /api/aktivitaeten/99999` → 404 with `{ status: 404, message, timestamp, fieldErrors }`
- [ ] Test `GET /api/aktivitaeten` without session (anonCtx) → 401
- [ ] Test `GET /api/aktivitaeten/all` without session (anonCtx) → 401

### 2. Verification
- [ ] Run `cd backend && npx playwright test aktivitaeten-crud` — all tests pass
- [ ] Run full suite `cd backend && npx playwright test` — no regressions
