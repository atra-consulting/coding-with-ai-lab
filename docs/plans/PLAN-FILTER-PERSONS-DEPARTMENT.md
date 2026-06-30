# Implementation Plan: FILTER-PERSONS-DEPARTMENT

## Test Command
Backend: `cd backend && npx playwright test src/test/personen-filter.spec.ts`
Frontend: `cd frontend && npx ng test --watch=false --include=**/person-list.component.spec.ts`

## Status: Feature already fully implemented on main

### Investigation Result

All requested changes already exist on `main`:

**Backend**
- `GET /api/personen` already accepts `abteilungId` query param (route: `backend/src/routes/personen.ts`)
- `personService.findAll()` already filters by `abteilungId` (service: `backend/src/services/personService.ts`)

**Frontend**
- `PersonService.listAll()` passes `abteilungId` to the API (component uses `listAll()`, not the paginated `getAll()`)
- `PersonListComponent` has `selectedAbteilungId`, loads all departments on init, and calls `onDepartmentChange()` on selection
- HTML template has a department dropdown wired via `[(ngModel)]` and `(ngModelChange)`

**Tests**
- Backend: `backend/src/test/personen-filter.spec.ts` — 6 test cases (F-1..F-6)
- Frontend: `frontend/src/app/features/person/person-list/person-list.component.spec.ts` — 14 test cases

## Tasks

### 1. Verification
- [x] Confirm backend route accepts `abteilungId` param — DONE (already exists)
- [x] Confirm service filters correctly — DONE (already exists)
- [x] Confirm frontend dropdown is wired — DONE (already exists)
- [x] Run backend tests to confirm they pass — DONE (6/6 pass)
- [x] Run frontend tests to confirm they pass — DONE (14/14 pass)

### 2. No code changes needed
All implementation and tests already exist on `main`.

## Tests

### Backend (Playwright API)
- F-1: Filter by valid abteilungId → only that department's persons
- F-2: No filter → all 100 persons
- F-3: Non-existent abteilungId → 200 empty
- F-4: abteilungId=0 → treated as no filter
- F-5: abteilungId + search → both filters combine via AND
- F-6: Unauthenticated → 401

### Frontend (Jasmine/Karma) — 14 tests
- should create the component
- should call abteilungService.listAll() on init
- should populate abteilungen from the listAll response
- should call personService.listAll() on init
- should call personService.listAll() with undefined when selectedAbteilungId is null
- should default selectedAbteilungId to null
- should default abteilungen to an empty array
- should start with loading set to true before ngOnInit runs
- should set loading to false after personService responds
- should call personService.listAll() again when department changes
- should pass selectedAbteilungId when a department is selected
- should pass undefined (not null) when selectedAbteilungId is null
- should pass abteilungId=1 when selectedAbteilungId is 1
- should pass abteilungId=0 unchanged when selectedAbteilungId is 0
