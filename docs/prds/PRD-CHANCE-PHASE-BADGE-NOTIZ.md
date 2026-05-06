# PRD: CHANCE-PHASE-BADGE-NOTIZ

**Status:** Approved
**Date:** 2026-05-06

## Source

Internal product improvement. Two independent enhancements to the Chance (sales opportunity) entity. Grouped into one delivery because both touch the same entity files.

## Problem Statement

**Teil 1 — Phase badge**
The Chancen-Liste shows Phase as plain text. Users cannot scan pipeline status at a glance. The Chancen-Detailseite already renders Phase as a colored badge (`getPhaseBadgeClass` method in `chance-detail.component.ts`). The list view is visually inconsistent with the detail view.

**Teil 2 — Notiz field**
The Chance entity has no free-text notes field. Users record context, call notes, and next steps in external tools. Other major entities (Firma, Person) already have a notes-style field.

## Requirements

### Teil 1: Phase as Colored Badge in Chancen-Liste

**[REQ-001]** The AG Grid Phase column in the Chancen-Liste renders a Bootstrap badge using a `cellRenderer` function that returns an HTML string. No Angular cell renderer component required — an inline function returning an HTML snippet is acceptable.

**[REQ-002]** Badge color mapping (Bootstrap classes):

| Phase | Bootstrap classes |
|-------|-----------------|
| NEU | `bg-primary` |
| QUALIFIZIERT | `bg-info` |
| ANGEBOT | `bg-warning text-dark` |
| VERHANDLUNG | `bg-secondary` |
| GEWONNEN | `bg-success` |
| VERLOREN | `bg-danger` |

This mapping must exactly match the existing `getPhaseBadgeClass()` method in `chance-detail.component.ts`.

**[REQ-003]** The Chancen-Detailseite is already implemented and must not be modified. The existing `getPhaseBadgeClass()` method and template badge are the reference implementation.

### Teil 2: New Optional Notiz Field

**[REQ-004]** A new `notiz TEXT` column is added to the `chance` table via an idempotent migration. The migration uses a `PRAGMA table_info(chance)` check to determine whether the column already exists before running `ALTER TABLE chance ADD COLUMN notiz TEXT`. This ensures the migration is safe to run repeatedly on both fresh and existing databases.

**[REQ-005]** The `BASE_QUERY` in `chanceService.ts` is updated to include `c.notiz`. The `ChanceRow` interface, `ChanceDTO` interface, and `toDTO()` function are all updated to carry the `notiz` field. The `create()` and `update()` service methods accept and persist `notiz`. This ensures both the list endpoint (`listAll`) and the detail endpoint (`findById`) return `notiz`.

**[REQ-006]** The `ChanceCreateSchema` in `validation.ts` adds `notiz: z.string().max(2000).optional().nullable()`.

**[REQ-007]** The `Chance` interface in `chance.model.ts` adds `notiz?: string | null`. The `ChanceCreate` interface adds the same field.

**[REQ-008]** The Chance form component adds a textarea field for Notiz:
- Label: "Notiz"
- 3 visible rows (`rows="3"`)
- `maxlength="2000"` attribute
- Optional (form saves without a value)
- Positioned below the Beschreibung textarea

**[REQ-009]** The Chance detail component displays Notiz below all existing fields:
- Wrapped in `@if (chance.notiz)` — hidden when null or empty
- Rendered with `white-space: pre-line` to preserve line breaks

**[REQ-010]** The Chancen-Liste (AG Grid) does not display a Notiz column. The `columnDefs` in `chance-list.component.ts` must not include a `notiz` field. The field is returned in the API payload but not shown in the grid.

## Special Instructions

- No test files to be created (test authoring skipped per user request).
- No updates to agent files or specs documentation.
- Do not modify the Chancen-Detailseite badge implementation.
- For the migration, use `PRAGMA table_info(chance)` to check for column existence before ALTER TABLE. Do not introduce a migration version table.
- `notiz` naming follows the German domain model convention (consistent with CLAUDE.md). The existing `notes` fields on Firma/Person use English; `notiz` is intentionally German to align with the Chance entity's German naming (`beschreibung`, `wahrscheinlichkeit`, `erwartetesDatum`).
- The `beschreibung` null-guard inconsistency in the detail template is a pre-existing issue and is out of scope for this delivery.

## Implementation Approach

**Backend order:**
1. `backend/src/db/schema/schema.ts` — add `notiz: text('notiz')` to the Chance table definition.
2. `backend/src/config/migrate.ts` — add idempotent ALTER TABLE using PRAGMA table_info check.
3. `backend/src/services/chanceService.ts` — add `notiz` to `ChanceDTO`, `ChanceRow`, `BASE_QUERY` SELECT, `toDTO()`, `create()`, `update()`.
4. `backend/src/utils/validation.ts` — add `notiz: z.string().max(2000).optional().nullable()` to `ChanceCreateSchema`.

**Frontend order:**
1. `frontend/src/app/core/models/chance.model.ts` — add `notiz?: string | null` to `Chance` and `ChanceCreate`.
2. `frontend/src/app/features/chance/chance-list/chance-list.component.ts` — add `cellRenderer` function to the `phase` column definition that returns a Bootstrap badge HTML string.
3. `frontend/src/app/features/chance/chance-form/chance-form.component.html` and `.ts` — add `notiz` textarea and form control.
4. `frontend/src/app/features/chance/chance-detail/chance-detail.component.html` — add `@if (chance.notiz)` block with `white-space: pre-line`.

**No changes to:**
- `chance-detail.component.ts` (badge already implemented)
- `chance-list.component.html` (AG Grid uses component TS for column defs)

## Test Strategy

Manual smoke tests only (no automated test authoring):
- Create a Chance without Notiz. Confirm save succeeds.
- Create a Chance with Notiz including line breaks. Confirm detail displays line breaks.
- Edit Notiz to exceed 2000 characters. Confirm frontend maxlength prevents submission.
- Open Chancen-Liste. Confirm Phase column shows colored badges matching detail view colors.
- Open Chancen-Detailseite. Confirm badge colors unchanged.

## Non-Functional Requirements

| Attribute | Requirement |
|-----------|-------------|
| Performance | Badge rendering adds no measurable latency to list load |
| Backward compatibility | Existing Chance records remain valid; `notiz` defaults to NULL |
| Data integrity | Migration runs safely on a populated database without data loss |
| Build | `ng build` and backend `npx tsx src/index.ts` complete without errors |

## Success Criteria

- Chancen-Liste Phase column shows color-coded badges. Colors match the detail view exactly.
- `notiz` field stores, retrieves, and displays free-text notes up to 2000 characters.
- Line breaks in Notiz render correctly on the detail page.
- No regressions on existing Chance create, read, update, delete flows.
- Backend migration runs on an existing database without data loss.
- `ng build` passes cleanly.

## Out of Scope

- Notiz in the Chancen-Liste grid column.
- Full-text search across Notiz values.
- Rich-text or markdown rendering for Notiz.
- Changes to the Chancen-Detailseite badge implementation.
- Automated test creation.
- Updates to agent or specs documentation.
- Fixing the pre-existing `beschreibung` null-guard inconsistency in the detail template.

## Implementierung

Branch: `chance-phase-badge-notiz`

| Commit | Beschreibung |
|--------|-------------|
| `04881ad` | feat: Add notiz column to chance table schema and migration |
| `a70303b` | feat: Add notiz field to Chance service and validation |
| `5db07e2` | feat: Add Phase badge to list and Notiz field to Chance frontend |
| `5efbd13` | fix: Add notiz TEXT to CREATE TABLE chance DDL for accuracy |
| `5d0d42e` | fix: Address code review findings in chance list and form |
