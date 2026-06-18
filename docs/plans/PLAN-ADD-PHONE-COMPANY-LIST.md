# Implementation Plan: ADD-PHONE-COMPANY-LIST

## Test Command
`cd frontend && npx ng test --watch=false --browsers=ChromeHeadless`

## Tasks

### 1. Verify Feature (Already Complete)
- [x] `Firma` model has `phone: string` — confirmed
- [x] `firma-list.component.ts` `columnDefs` includes `{ field: 'phone', headerName: 'Telefon' }` — confirmed
- [x] Backend `firmaService.ts` selects `f.phone` in `BASE_QUERY` — confirmed

### 2. Test Implementation
- [ ] Create `frontend/src/app/features/firma/firma-list/firma-list.component.spec.ts`
  - Verify component instantiates
  - Verify `listAll()` is called on init
  - Verify `columnDefs` contains a `phone` entry
  - Verify phone column `headerName` is `'Telefon'`
  - Verify phone column appears after email column

### 3. Verification
- [ ] Run frontend unit tests
- [ ] Confirm all tests pass

## Tests

### Unit Tests for FirmaListComponent
- `'creates the component'` — basic instantiation
- `'calls listAll() on init'` — service interaction
- `'columnDefs contains a phone column'` — field presence
- `'phone column has headerName "Telefon"'` — correct label
- `'phone column is defined after email column'` — correct ordering
