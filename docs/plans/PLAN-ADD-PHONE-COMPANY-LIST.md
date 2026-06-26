# Implementation Plan: ADD-PHONE-COMPANY-LIST

## Test Command
`cd frontend && npm run test:ci`

## Status: ALREADY IMPLEMENTED

All required pieces are already in place. No code changes needed.

## Tasks

### 1. Verify Feature (Already Complete)
- [x] `Firma` model has `phone: string` — confirmed
- [x] `firma-list.component.ts` `columnDefs` includes `{ field: 'phone', headerName: 'Telefon' }` — confirmed
- [x] Backend `firmaService.ts` selects `f.phone` in `BASE_QUERY` — confirmed
- [x] `firma-list.component.spec.ts` exists with phone column tests — confirmed

### 2. Verification
- [ ] Run `cd frontend && npm run test:ci` and confirm all tests pass

### 3. PR
- [ ] Create PR targeting `main` to close the agent task
