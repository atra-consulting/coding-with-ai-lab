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
- `PersonService.getAll()` and `listAll()` already pass `abteilungId` to the API
- `PersonListComponent` has `selectedAbteilungId`, loads all departments on init, and calls `onDepartmentChange()` on selection
- HTML template has a department dropdown wired via `[(ngModel)]` and `(ngModelChange)`

**Tests**
- Backend: `backend/src/test/personen-filter.spec.ts` — 6 test cases (F-1..F-6)
- Frontend: `frontend/src/app/features/person/person-list/person-list.component.spec.ts` — 9 test cases

## Tasks

### 1. Verification
- [x] Confirm backend route accepts `abteilungId` param — DONE (already exists)
- [x] Confirm service filters correctly — DONE (already exists)
- [x] Confirm frontend dropdown is wired — DONE (already exists)
- [ ] Run backend tests to confirm they pass
- [ ] Run frontend tests to confirm they pass

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

### Frontend (Jasmine/Karma)
- Component creation
- ngOnInit calls abteilungService.listAll()
- ngOnInit populates abteilungen
- ngOnInit calls personService.listAll()
- Default selectedAbteilungId is null
- onDepartmentChange() re-fetches persons
- onDepartmentChange() passes correct abteilungId
