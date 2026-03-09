# Implementation Plan - Table Heading Enhancements

## Test Command
`cd frontend && npm test -- --watch=false`

## Tasks

### 1. Global Styling
- [ ] Update `frontend/src/styles.scss` to color `.page-header h2` with `$primary`.

### 2. Implementation in List Components
For each of the following components, implement row count logic:
- `AbteilungListComponent` (`frontend/src/app/features/abteilung/abteilung-list/`)
- `AdresseListComponent` (`frontend/src/app/features/adresse/adresse-list/`)
- `FirmaListComponent` (`frontend/src/app/features/firma/firma-list/`)
- `GehaltListComponent` (`frontend/src/app/features/gehalt/gehalt-list/`)
- `VertragListComponent` (`frontend/src/app/features/vertrag/vertrag-list/`)
- `BenutzerListComponent` (`frontend/src/app/features/benutzer/benutzer-list/`)
- `ChanceListComponent` (`frontend/src/app/features/chance/chance-list/`)
- `PersonListComponent` (`frontend/src/app/features/person/person-list/`)
- `AktivitaetListComponent` (`frontend/src/app/features/aktivitaet/aktivitaet-list/`)

#### Per Component Steps:
1.  **TypeScript**:
    *   Import `GridApi`, `GridReadyEvent` from `ag-grid-community`.
    *   Add `private gridApi?: GridApi;`.
    *   Add `totalRows = 0;` and `displayedRows = 0;`.
    *   Implement `onGridReady(params: GridReadyEvent): void`.
    *   Implement `onModelUpdated(): void`.
2.  **HTML**:
    *   Add `(gridReady)="onGridReady($event)"` and `(modelUpdated)="onModelUpdated()"` to `<ag-grid-angular>`.
    *   Update `<h2>` to display counts: `Title @if (totalRows > 0) { ({{ displayedRows < totalRows ? displayedRows + '/' + totalRows : totalRows }}) }`.

### 3. Verification
- [ ] Run tests to ensure no regressions.
- [ ] Manually verify UI in one or two components (mocking if possible or just visual check if running).
- [ ] Run `npm run lint` if available (check package.json).

## Tests
- [ ] Unit tests for `FirmaListComponent` to verify row count logic if tests exist for it.
- [ ] Add a new test case if necessary to verify the display logic.
