# Implementation Plan: CHANCE-NOTIZ-UND-PHASE-BADGE

Ticket 13 "Improve chances". Two independent changes to Chance.

## Test Command
- Backend: `cd backend && npm test`
- Frontend: `cd frontend && npm run test:ci`

## Tasks

### 1. Backend — DB (db-coder)
- [ ] `backend/src/db/schema/schema.ts`: add `notiz: text('notiz')` to `chance` (nullable, after `beschreibung`).
- [ ] `backend/src/config/migrate.ts`: add `notiz TEXT` column to the `CREATE TABLE IF NOT EXISTS chance` DDL (after `beschreibung`).
- [ ] `backend/src/config/migrate.ts`: add a guarded idempotent column-add for existing DBs — new `ensureChanceNotizColumn()` modeled on `ensureSzenarioAgileKiColumn()` (PRAGMA table_info check + ALTER TABLE chance ADD COLUMN notiz TEXT, swallow "duplicate column"). Call it in `runMigrations()` next to the szenario one.

### 2. Backend — service + validation (be-coder)
- [ ] `backend/src/utils/validation.ts`: add `notiz: z.string().optional().nullable()` to `ChanceCreateSchema` (mirrors `beschreibung`).
- [ ] `backend/src/services/chanceService.ts`: add `notiz: string | null` to `ChanceDTO` and `ChanceRow`; select `c.notiz` in `BASE_QUERY`; map in `toDTO`; add `notiz` to INSERT (`create`) and UPDATE (`update`) column lists + args as `dto.notiz ?? null`.
- [ ] `backend/src/routes/chancen.ts`: no change — route passes the whole validated DTO through already.

### 3. Frontend — model + form + detail (fe-coder)
- [ ] `frontend/src/app/core/models/chance.model.ts`: add `notiz?: string | null` to `Chance` and `ChanceCreate`.
- [ ] `frontend/src/app/features/chance/chance-form/chance-form.component.ts`: add `notiz: ['']` to the form group (no validator).
- [ ] `frontend/src/app/features/chance/chance-form/chance-form.component.html`: add a multiline `<textarea formControlName="notiz" rows="3">` field labeled "Notiz", analog to Beschreibung, no required marker.
- [ ] `frontend/src/app/features/chance/chance-detail/chance-detail.component.html`: add `@if (chance.notiz)` block showing the Notiz, analog to the Beschreibung block.

### 4. Frontend — shared phase badge + list (fe-coder / ui-designer)
- [ ] Extract the phase→badge-class map into ONE shared source so list and detail share it. Add `getPhaseBadgeClass(phase: ChancePhase): string` helper next to `ChancePhase` in `chance.model.ts` (or a small helper file). Keep the exact map incl. `ANGEBOT: 'bg-warning text-dark'` and the `|| 'bg-secondary'` fallback.
- [ ] `chance-detail.component.ts`: delegate its `getPhaseBadgeClass` to the shared helper (no behavior change).
- [ ] `chance-list.component.ts`: give the `phase` column a `cellRenderer` that returns `<span class="badge ...">PHASE</span>` using the shared map. Renders a colored badge instead of plain grey text.

## Tests

### Backend (be-test-coder → Playwright)
- [ ] Create chance with `notiz` → response JSON includes `notiz`; GET by id returns it; list/all returns it.
- [ ] Create chance without `notiz` → succeeds, `notiz` is null.
- [ ] Update chance `notiz` independently of `beschreibung` → both persist separately.
- [ ] Notiz with newlines round-trips unchanged.

### Frontend (fe-test-coder → Jasmine)
- [ ] Form renders a `notiz` textarea; control present, not required; save without notiz valid.
- [ ] Detail shows notiz only when filled.
- [ ] Shared `getPhaseBadgeClass` returns correct class per phase incl. fallback.
- [ ] List phase column cellRenderer produces a `badge` span with the right class.

## Verification
- [ ] `cd backend && npm test` green.
- [ ] `cd frontend && npm run test:ci` green.
- [ ] `cd frontend && npx ng build` compiles.
