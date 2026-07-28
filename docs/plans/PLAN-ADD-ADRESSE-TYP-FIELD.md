# Implementation Plan: ADD-ADRESSE-TYP-FIELD

## Test Command
`cd backend && npx playwright test`

## Tasks

### 1. Backend Service Changes (`backend/src/services/adresseService.ts`)
- [ ] Add `typ: string | null` to the `AdresseDTO` interface
- [ ] Add `typ: string | null` to the `AdresseRow` interface
- [ ] Add `a.typ` to the SELECT column list in `BASE_QUERY`
- [ ] Map `typ: row.typ` in the `toDTO()` function
- [ ] Add `typ` to the INSERT column list in `create()`, with value `dto.typ ?? null`
- [ ] Add `typ=?` to the SET clause in `update()` and pass `dto.typ ?? null` as the corresponding arg

### 2. Validation Schema (`backend/src/utils/validation.ts`)
- [ ] Add `typ: z.string().max(50).optional().nullable()` to `AdresseCreateSchema`

### 3. Test Coverage (new file `backend/src/test/adressen-typ.spec.ts`)
- [ ] Test `POST /api/adressen` with a `typ` value — confirm round-trip
- [ ] Test `POST /api/adressen` without `typ` — confirm response has `typ: null`
- [ ] Test `GET /api/adressen/:id` — confirm `typ` key present in response
- [ ] Test `GET /api/adressen` (list) — confirm every item carries a `typ` key
- [ ] Test `PUT /api/adressen/:id` with new `typ` — confirm field updated
- [ ] Test `PUT /api/adressen/:id` omitting `typ` — confirm null stored
- [ ] Test `POST /api/adressen` with `typ` longer than 50 chars — confirm `400`

### 4. Verification
- [ ] Run `cd backend && npx tsc --noEmit` — zero errors
- [ ] Run `cd backend && npx playwright test` — all tests pass
