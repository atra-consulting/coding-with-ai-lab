# Implementation Plan: ADD-TYP-FILTER-AKTIVITAETEN

## Test Command
`cd backend && npx playwright test`

## Tasks

### 1. Service (`backend/src/services/aktivitaetService.ts`)
- [ ] Import `AktivitaetTyp` from `../db/schema/enums.js`
- [ ] Add `typ?: AktivitaetTyp` as fifth parameter to `findAll(page, size, sort, firmaId?, typ?)`
- [ ] Inside `findAll`, after the existing `firmaId` block, add: if `typ !== undefined`, push `'ak.typ = ?'` to `conditions` and `typ` to `params`

### 2. Route (`backend/src/routes/aktivitaeten.ts`)
- [ ] Import `AKTIVITAET_TYP`, `AktivitaetTyp` from `../db/schema/enums.js`
- [ ] Import `ValidationError` from `../utils/errors.js`
- [ ] After the `firmaId` extraction lines, extract `typRaw = req.query['typ'] as string | undefined`
- [ ] Validate: if `typRaw` is defined but not in `AKTIVITAET_TYP`, throw `new ValidationError('Ungültiger typ-Wert', { typ: 'Erlaubte Werte: ANRUF, EMAIL, MEETING, NOTIZ, AUFGABE' })`
- [ ] Cast to type: `const typ = typRaw as AktivitaetTyp | undefined`
- [ ] Pass `typ` to `aktivitaetService.findAll(page, size, sort, firmaId, typ)`

**Note:** `typ=INVALID → 400` is intentionally strict (unlike `firmaId=abc → 200` which falls back via NaN). String values need explicit enum validation — there is no safe numeric fallback.

### 3. Test Implementation
- [ ] Create `backend/src/test/aktivitaeten-typ-filter.spec.ts`
- [ ] Follow the exact pattern from `aktivitaeten-firma-filter.spec.ts` (suite-level contexts, `resetDatabase()` in `beforeAll`)
- [ ] Use these fixture constants (from `backend/src/seed/fixture.json`):
  - `TOTAL_AKTIVITAETEN = 75`
  - `ANRUF_COUNT = 17`
  - `MEETING_COUNT = 9`

### 4. Verification
- [ ] TypeScript check: `cd backend && npx tsc --noEmit` — zero errors
- [ ] Run all backend tests: `cd backend && npx playwright test`

## Tests (`backend/src/test/aktivitaeten-typ-filter.spec.ts`)

- **T-1** `GET /api/aktivitaeten?typ=ANRUF` — 200, every item in `content` has `typ === 'ANRUF'`, `totalElements === 17`
- **T-2** `GET /api/aktivitaeten?typ=MEETING` — 200, every item has `typ === 'MEETING'`, `totalElements === 9`
- **T-3** `GET /api/aktivitaeten?typ=ANRUF&firmaId=99999` — 200, empty `content`, `totalElements === 0` (both filters active, no matching rows)
- **T-4** `GET /api/aktivitaeten?typ=INVALID` — 400, `ValidationError` response
- **T-5** `GET /api/aktivitaeten` (no `typ`) — 200, `totalElements === 75` (baseline unaffected)
- **T-6** `GET /api/aktivitaeten?typ=ANRUF` without session — 401
