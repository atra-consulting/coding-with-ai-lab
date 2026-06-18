# Implementation Plan: FILTER-PERSONS-BY-DEPARTMENT

## Test Command
Backend: `cd backend && npm test`
Frontend: `cd frontend && npx ng test --watch=false --browsers=ChromeHeadless`

## Tasks

### 1. Backend — personService.ts
- [ ] Add `abteilungId?: number` parameter to `findAll()`
- [ ] Extend WHERE clause: if `abteilungId` provided, add `AND p.abteilungId = ?` (combined with existing search filter)
- [ ] Update COUNT query to also filter by `abteilungId`
- [ ] Update `params` array to include `abteilungId` when present

### 2. Backend — personen.ts route
- [ ] Parse `abteilungId` from `req.query` as optional integer
- [ ] Pass `abteilungId` to `personService.findAll()`

### 3. Frontend — person.service.ts
- [ ] Add `abteilungId?: number` parameter to `getAll()`
- [ ] Append `abteilungId` to HttpParams when provided

### 4. Frontend — person-list.component.ts
- [ ] Import `AbteilungService` and `Abteilung` model
- [ ] Import `FormsModule` for ngModel on the dropdown
- [ ] Add `abteilungen: Abteilung[] = []` and `selectedAbteilungId: number | null = null`
- [ ] Load departments via `AbteilungService.listAll()` in `ngOnInit`
- [ ] Switch data loading from `listAll()` to `getAll()` to support the abteilungId parameter (extract `page.content` for `rowData`, `page.totalElements` for `totalRows`)
- [ ] Add `onDepartmentChange()` method that reloads persons with `selectedAbteilungId`
- [ ] Update `totalRows` assignment from paginated response

### 5. Frontend — person-list.component.html
- [ ] Add department dropdown (`<select>`) in the page-header area
- [ ] Bind to `selectedAbteilungId` with `(change)="onDepartmentChange()"`
- [ ] Include "Alle Abteilungen" as default option (value null)
- [ ] Loop over `abteilungen` with `@for`

### 6. Test Implementation
- [ ] Backend test: `GET /api/personen?abteilungId=X` returns only persons in that department
- [ ] Backend test: `GET /api/personen` without `abteilungId` returns all persons (unchanged)
- [ ] Backend test: `GET /api/personen?abteilungId=X&search=Y` combines both filters
- [ ] Frontend unit test: `PersonService.getAll()` appends `abteilungId` param when provided
- [ ] Frontend unit test: `PersonListComponent` loads departments on init
- [ ] Frontend unit test: `onDepartmentChange()` reloads with correct abteilungId

### 7. Verification
- [ ] Run backend tests (`cd backend && npm test`)
- [ ] Run frontend tests (`cd frontend && npx ng test --watch=false --browsers=ChromeHeadless`)
- [ ] Build check (`cd frontend && npx ng build`)

## Tests

### Backend Integration Tests
- [ ] `GET /api/personen?abteilungId=<valid-id>` — returns persons in department, count matches
- [ ] `GET /api/personen?abteilungId=<valid-id>&search=<name>` — both filters applied
- [ ] `GET /api/personen?abteilungId=99999` — returns empty list (not 404)
- [ ] `GET /api/personen` — unaffected, returns all persons

### Frontend Unit Tests
- [ ] `PersonService.getAll(0, 10, 'lastName,asc', '', 5)` — HttpParams includes `abteilungId=5`
- [ ] `PersonService.getAll(0, 10)` — HttpParams does NOT include `abteilungId`
- [ ] `PersonListComponent` — loads `abteilungen` on init
- [ ] `PersonListComponent.onDepartmentChange()` — calls `personService.getAll()` with correct id
