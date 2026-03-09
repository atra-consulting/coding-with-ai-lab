# PRD: AG Grid Tables Migration

## Source
User request to replace HTML tables with AG Grid across all list views.

## Problem Statement
Current list views use hand-built HTML tables with server-side pagination. Each list has a "Suchen..." search bar and an "Aktionen" column with inline Bearbeiten/Löschen buttons. This approach limits filtering to a single global search, has no per-column sorting/filtering, and clutters the table with action buttons. Detail pages have "Bearbeiten" but lack "Löschen".

## Requirements

### Must Have
1. **Replace all list tables with AG Grid Community** — 9 list components: Firma, Person, Abteilung, Adresse, Aktivitaet, Gehalt, Vertrag, Chance, Benutzer.
2. **Load all data at once** — No server-side pagination. Backend needs "get all" endpoints (unpaginated). Frontend loads full dataset into AG Grid.
3. **Per-column filtering** — AG Grid built-in column filters on every column.
4. **Per-column sorting** — AG Grid built-in sorting on every column.
5. **Remove "Suchen..." search bar** — AG Grid's column filters replace global search.
6. **Remove "Aktionen" column** — No inline edit/delete buttons in tables.
7. **Row click navigates to detail page** — Clicking a row opens the detail view.
8. **Add "Löschen" button to all detail pages** — Currently only "Bearbeiten" exists. Add "Löschen" with confirmation dialog.
9. **Custom enum filters** where columns contain enum values:
   - Chance: `Phase` — NEU, QUALIFIZIERT, ANGEBOT, VERHANDLUNG, GEWONNEN, VERLOREN
   - Aktivitaet: `Typ` — ANRUF, EMAIL, MEETING, NOTIZ, AUFGABE
   - Gehalt: `Typ` — GRUNDGEHALT, BONUS, PROVISION, SONDERZAHLUNG
   - Vertrag: `Status` — ENTWURF, AKTIV, ABGELAUFEN, GEKUENDIGT

10. **AG Grid theme matching Bootstrap 5 styling** — consistent look with the rest of the app.
11. **Number columns formatted with locale-aware number formatting** — Wert, Gehalt amounts, etc.
12. **Date columns formatted consistently** — uniform date display across all grids.

## Scope

### In Scope
- All 9 list components (Firma, Person, Abteilung, Adresse, Aktivitaet, Gehalt, Vertrag, Chance, Benutzer).
- All 6 existing detail components (Firma, Person, Abteilung, Chance, Vertrag, Benutzer) — add Löschen.
- 3 missing detail components (Adresse, Aktivitaet, Gehalt) — add Löschen to their detail pages if they exist, or note that these entities navigate to edit form directly.
- Backend: Add unpaginated "get all" endpoints to all controllers.
- Frontend services: Add `getAll()` methods.

### Out of Scope
- Chance Kanban board — not affected (separate view).
- Dashboard, Auswertungen — not tables, not affected.
- Server-side filtering/sorting — AG Grid handles client-side.

## Implementation Approach

### Backend
Add a `GET /api/<entity>/all` endpoint to each controller returning `List<DTO>`. Keep existing paginated endpoints for backward compatibility (Kanban board uses them).

### Frontend
1. Install `ag-grid-community` and `ag-grid-angular`.
2. Create a shared AG Grid configuration/theme setup.
3. Rewrite each list component: remove pagination, search bar, HTML table. Replace with `<ag-grid-angular>` using column definitions with appropriate filters.
4. Add row click handler navigating to detail page.
5. Enum columns use AG Grid's built-in set filter with predefined values.
6. Add "Löschen" button + confirmation modal to all detail pages.

## Enum Filter Values

| Entity | Column | Values |
|--------|--------|--------|
| Chance | Phase | NEU, QUALIFIZIERT, ANGEBOT, VERHANDLUNG, GEWONNEN, VERLOREN |
| Aktivitaet | Typ | ANRUF, EMAIL, MEETING, NOTIZ, AUFGABE |
| Gehalt | Typ | GRUNDGEHALT, BONUS, PROVISION, SONDERZAHLUNG |
| Vertrag | Status | ENTWURF, AKTIV, ABGELAUFEN, GEKUENDIGT |

## Detail Pages — Current State

| Entity | Has Detail Page | Has Bearbeiten | Has Löschen |
|--------|----------------|----------------|-------------|
| Firma | Yes | Yes | No → Add |
| Person | Yes | Yes | No → Add |
| Abteilung | Yes | Yes | No → Add |
| Adresse | No detail page | N/A | N/A → Check routes |
| Aktivitaet | No detail page | N/A | N/A → Check routes |
| Gehalt | No detail page | N/A | N/A → Check routes |
| Chance | Yes | Yes | No → Add |
| Vertrag | Yes | Yes | No → Add |
| Benutzer | Yes | Yes | No → Add |

## Test Strategy
- `ng build` must pass with no errors.
- Manual verification: each list loads all data, columns are filterable/sortable, row click navigates, enum filters show correct values.
- Detail pages: Löschen button shows confirmation, deletes on confirm, navigates back to list.

## Success Criteria
- All 9 list views use AG Grid with client-side filtering/sorting.
- No pagination controls, no search bar, no Aktionen column.
- Row click navigates to detail.
- Enum columns have dropdown/set filters.
- All detail pages have both Bearbeiten and Löschen buttons.
- `ng build` passes cleanly.
