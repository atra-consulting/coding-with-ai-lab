# Implementation Plan: CHANCE-BADGE-NOTIZ

Two extensions to the Chance entity:
- **Teil 1:** Phase as a colored badge in the Chancen list (detail page already has it).
- **Teil 2:** New optional multi-line `notiz` field (max 2000 chars).

PRD: `docs/prds/PRD-CHANCE-BADGE-NOTIZ.md`

## Verification Command
`cd frontend && npx ng build` (frontend build check) + `cd backend && npx tsc --noEmit` (backend type-check).
Per explicit user request, **no automated tests** are written. Verification is build + manual.

---

## Tasks

### 1. Database layer (db-coder)

- [ ] `backend/src/db/schema/schema.ts`: add `notiz: text('notiz'),` to the `chance` table, after the `beschreibung` column. Nullable (no `.notNull()`, no `.default()`).
- [ ] `backend/src/config/migrate.ts` — fresh DB: add `notiz TEXT,` to the `chance` `CREATE TABLE IF NOT EXISTS` column list, after `beschreibung`, before `wert`.
- [ ] `backend/src/config/migrate.ts` — existing DB: add an additive, idempotent migration. After the table-creation `sqlite.exec` block and before the index block, query `PRAGMA table_info(chance)`; only run `ALTER TABLE chance ADD COLUMN notiz TEXT` when the `notiz` column is absent. (This is the first additive migration in the file — no version-table pattern exists.) **Cast the result** to satisfy `strict` mode: `const cols = sqlite.prepare('PRAGMA table_info(chance)').all() as { name: string }[];` — otherwise `tsc --noEmit` fails on `c.name`.
- [ ] `backend/src/seed/fixture.json`: **no change** — nullable column, existing seed rows stay valid.

### 2. Backend service + validation (be-coder)

- [ ] `backend/src/utils/validation.ts`: add `notiz: z.string().max(2000, 'Notiz darf maximal 2000 Zeichen lang sein').optional().nullable()` to `ChanceCreateSchema`. Field-level error appears under key `notiz` via the existing `validate()` / `ValidationError` path.
- [ ] `backend/src/services/chanceService.ts`:
  - [ ] Add `notiz: string | null` to the `ChanceDTO` and `ChanceRow` interfaces.
  - [ ] Add `c.notiz` to the `SELECT` column list in `BASE_QUERY`.
  - [ ] Add `notiz: row.notiz` mapping in `toDTO()`.
  - [ ] In `create()` and `update()`: normalize `notiz` — trim and treat whitespace-only as `null` — then bind it. Add `notiz` to the INSERT column list / the `notiz=?` UPDATE SET clause.
- [ ] `backend/src/routes/chancen.ts`: no structural change. POST/PUT already call `validate(ChanceCreateSchema, ...)`; `notiz` flows through once the schema includes it. Confirm no edit needed.

### 3. Frontend — model, list badge (fe-coder)

- [ ] `frontend/src/app/core/models/chance.model.ts`: add `notiz?: string` to both `Chance` and `ChanceCreate`.
- [ ] `frontend/src/app/features/chance/chance-list/chance-list.component.ts`: add a function-style `cellRenderer` to the `phase` column. It looks the `ChancePhase` value up in a local `Record<ChancePhase, string>` map that mirrors `getPhaseBadgeClass` exactly (`NEU→bg-primary`, `QUALIFIZIERT→bg-info`, `ANGEBOT→bg-warning text-dark`, `VERHANDLUNG→bg-secondary`, `GEWONNEN→bg-success`, `VERLOREN→bg-danger`) and returns a `<span class="badge ...">` string. Badge markup is built ONLY from the fixed map (XSS-safe — the enum key is also the visible label; no raw data injected). Keep the column filter working (text filter on the phase value).
- [ ] `chance-list.component.ts`: confirm **no** `notiz` column is added (REQ-C10).
- [ ] `chance-detail.component.ts` / `.html`: verify only — badge already correct (REQ-C03), no change expected.

### 4. Frontend — form (fe-coder)

- [ ] `chance-form.component.ts`: add `notiz: ['', Validators.maxLength(2000)]` to the `fb.group({...})`. Edit-mode `patchValue` picks it up automatically.
- [ ] `chance-form.component.html`: after the `beschreibung` block, add a `<div class="mb-3">` with: label `"Notiz"` (no required asterisk), `<textarea rows="3" formControlName="notiz" class="form-control">`, `[class.is-invalid]` bound to invalid+touched, an `@if` maxlength `invalid-feedback` ("Max. 2000 Zeichen"), and a static `form-text` hint "Max. 2000 Zeichen".

### 5. Frontend — detail render + styling (fe-coder + ui-designer)

- [ ] `chance-detail.component.html`: after the `@if (chance.beschreibung)` block, full-width below the two-column fields, add:
  ```
  @if (chance.notiz) {
    <p><strong>Notiz:</strong></p>
    <p class="text-prewrap">{{ chance.notiz }}</p>
  }
  ```
  Plain-text interpolation only — never `[innerHTML]` (notiz is free user text → XSS risk).
- [ ] `frontend/src/styles.scss`: add utility class `.text-prewrap { white-space: pre-wrap; }` (Bootstrap 5 has no pre-wrap utility), placed near the existing utility rules.
- [ ] `frontend/src/styles.scss`: add `.ag-cell .badge { vertical-align: middle; }` in the AG Grid block so the list badge centers within the row height. No `!important` needed.

### 6. Verification

- [ ] `cd backend && npx tsc --noEmit` — backend compiles, no type errors.
- [ ] `cd frontend && npx ng build` — frontend builds clean.
- [ ] Manual smoke (per PRD Teststrategie): all six phase badges show correct colors in list and match the detail page (ANGEBOT readable); create/edit a Chance with a multi-line note → detail shows line breaks; empty/whitespace note → detail section hidden; >2000 chars → form + backend reject; no Notiz column in the list.

---

## Tests

Per explicit user request: **no automated tests** for this change. No Playwright API tests, no Jasmine specs. Manual verification only (see PRD Teststrategie and Task 6 above).
