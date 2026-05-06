# Implementation Plan: CHANCE-PHASE-BADGE-NOTIZ

## Build Verification Command
`cd frontend && npx ng build`

## Overview

Two features for the Chance entity:
1. **Phase badge**: Show Phase as colored Bootstrap badge in the Chancen-Liste (detail view already done)
2. **Notiz field**: New optional free-text field (max 2000 chars) — backend + frontend form + detail

**Tests skipped** per user request. **Agents & Specs updates skipped** per user request.

---

## Tasks

### 1. Database Layer

- [ ] `backend/src/db/schema/schema.ts` — add `notiz: text('notiz')` to the Drizzle `chance` table definition, after `erwartetesDatum` and before `firmaId`. No `notNull()`, no `.default()` — must remain nullable for existing rows.
- [ ] `backend/src/config/migrate.ts` — add idempotent ALTER TABLE block after the main DDL statement that creates all tables. Pattern: read `sqlite.prepare('PRAGMA table_info(chance)').all()`, check if any row has `name === 'notiz'`, only run `sqlite.prepare('ALTER TABLE chance ADD COLUMN notiz TEXT').run()` if column is absent.

### 2. Backend Service & Validation

- [ ] `backend/src/utils/validation.ts` — add `notiz: z.string().max(2000).optional().nullable()` to `ChanceCreateSchema`.
- [ ] `backend/src/services/chanceService.ts` — add `notiz: string | null` to the `ChanceDTO` interface.
- [ ] `backend/src/services/chanceService.ts` — add `notiz: string | null` to the `ChanceRow` interface.
- [ ] `backend/src/services/chanceService.ts` — add `c.notiz` to the `BASE_QUERY` SELECT column list.
- [ ] `backend/src/services/chanceService.ts` — add `notiz: row.notiz` mapping in the `toDTO()` function.
- [ ] `backend/src/services/chanceService.ts` — add `notiz` to the `create()` method: add to INSERT column list, add `?` to VALUES list, add `dto.notiz ?? null` to the `.run()` call (position: after `kontaktPersonId ?? null`, before `now`).
- [ ] `backend/src/services/chanceService.ts` — add `notiz=?` to the `update()` method SET clause and add `dto.notiz ?? null` to the `.run()` call (position: after `kontaktPersonId ?? null`, before `now`).

### 3. Frontend Model

- [ ] `frontend/src/app/core/models/chance.model.ts` — add `notiz?: string | null` to the `Chance` interface and to the `ChanceCreate` interface.

### 4. Frontend — Chancen-Liste (Phase Badge)

- [ ] `frontend/src/app/features/chance/chance-list/chance-list.component.ts` — add `cellRenderer` to the `phase` column definition. The renderer function must use a `Record<ChancePhase, string>` whitelist map (same mapping as `getPhaseBadgeClass()` in the detail component) and fall back to `'bg-secondary'` for unknown values. Return an HTML string: `<span class="badge CLASSES">VALUE</span>`. Badge classes: NEU→`bg-primary`, QUALIFIZIERT→`bg-info`, ANGEBOT→`bg-warning text-dark`, VERHANDLUNG→`bg-secondary`, GEWONNEN→`bg-success`, VERLOREN→`bg-danger`. Note: `cellRenderer` and `valueFormatter` are mutually exclusive in AG Grid; since the phase column has no existing `valueFormatter`, no removal needed.

### 5. Frontend — Chance Form (Notiz Textarea)

- [ ] `frontend/src/app/features/chance/chance-form/chance-form.component.ts` — add `notiz: [null]` (not empty string) to the FormGroup definition. Using `null` ensures an empty textarea sends `null` to the backend, matching the `string | null` model type.
- [ ] `frontend/src/app/features/chance/chance-form/chance-form.component.html` — add a Notiz textarea block **before** the `<div class="d-flex gap-2">` button row (i.e., after the existing Beschreibung `<div class="mb-3">`). Use `<div class="mb-3">`, label "Notiz", `<textarea rows="3" maxlength="2000" formControlName="notiz">`.

### 6. Frontend — Chance Detail (Notiz Display)

- [ ] `frontend/src/app/features/chance/chance-detail/chance-detail.component.html` — add `@if (chance.notiz)` block below the existing `beschreibung` block. Display notiz in a `<p>` with `style="white-space: pre-line"` to preserve line breaks.

### 7. Verification

- [ ] Run `cd frontend && npx ng build` — must complete with zero errors.
- [ ] Run `cd backend && npx tsc --noEmit` — must complete with zero errors.
- [ ] Manual smoke tests: create Chance with notiz (with line breaks), verify detail shows line breaks; open list, verify Phase column shows colored badges.
