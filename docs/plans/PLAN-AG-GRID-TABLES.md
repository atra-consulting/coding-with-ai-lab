# Implementation Plan: AG-GRID-TABLES

## Test Command
```bash
cd frontend && npx ng build
```

## Tasks

### 1. Install AG Grid
- [ ] `cd frontend && npm install ag-grid-community ag-grid-angular`
- [ ] Register AG Grid theme/styles in `angular.json` or component-level imports

### 2. Backend — Add Unpaginated "Get All" Endpoints
Add `GET /api/<entity>/all` returning `List<DTO>` to each controller. Keep existing paginated endpoints intact (Kanban board uses them).

- [ ] `FirmaController` — `GET /api/firmen/all` → `List<FirmaDTO>`
- [ ] `FirmaService` — `findAll()` without Pageable
- [ ] `PersonController` — `GET /api/personen/all` → `List<PersonDTO>`
- [ ] `PersonService` — `findAll()` without Pageable
- [ ] `AbteilungController` — `GET /api/abteilungen/all` → `List<AbteilungDTO>`
- [ ] `AbteilungService` — `findAll()` without Pageable
- [ ] `AdresseController` — `GET /api/adressen/all` → `List<AdresseDTO>`
- [ ] `AdresseService` — `findAll()` without Pageable
- [ ] `AktivitaetController` — `GET /api/aktivitaeten/all` → `List<AktivitaetDTO>`
- [ ] `AktivitaetService` — `findAll()` without Pageable
- [ ] `GehaltController` — `GET /api/gehaelter/all` → `List<GehaltDTO>`
- [ ] `GehaltService` — `findAll()` without Pageable
- [ ] `VertragController` — `GET /api/vertraege/all` → `List<VertragDTO>`
- [ ] `VertragService` — `findAll()` without Pageable
- [ ] `ChanceController` — `GET /api/chancen/all` → `List<ChanceDTO>`
- [ ] `ChanceService` — `findAll()` without Pageable
- [ ] `BenutzerController` (CIAM) — check if unpaginated endpoint exists or add one

### 3. Frontend Services — Add `getAll()` Methods
- [ ] `FirmaService` — `getAll(): Observable<Firma[]>` calling `/api/firmen/all`
- [ ] `PersonService` — `getAll(): Observable<Person[]>`
- [ ] `AbteilungService` — `getAll(): Observable<Abteilung[]>`
- [ ] `AdresseService` — `getAll(): Observable<Adresse[]>`
- [ ] `AktivitaetService` — `getAll(): Observable<Aktivitaet[]>`
- [ ] `GehaltService` — `getAll(): Observable<Gehalt[]>`
- [ ] `VertragService` — `getAll(): Observable<Vertrag[]>`
- [ ] `ChanceService` — `getAll(): Observable<Chance[]>`
- [ ] `BenutzerService` — `getAll(): Observable<Benutzer[]>` (check existing)

### 4. Frontend — Rewrite List Components with AG Grid
Each list component gets the same treatment:
- Remove: `FormsModule`, `NgbPagination`, search field, HTML `<table>`, Aktionen column, pagination state, `loadData(page)` method
- Add: `AgGridAngular` import, `ColDef[]` with column config, `rowData` array, `onRowClicked` handler → router navigate to detail
- AG Grid config: `domLayout='autoHeight'`, default column with `filter: true, sortable: true, resizable: true`

Components to rewrite:
- [ ] `firma-list` — columns: Name, Branche, E-Mail, Telefon, Personen (number)
- [ ] `person-list` — columns: Vorname, Nachname, E-Mail, Telefon, Position, Firma
- [ ] `abteilung-list` — columns: Name, Beschreibung, Firma, Mitarbeiter (number)
- [ ] `adresse-list` — columns: Strasse, PLZ, Ort, Land, Typ/Zuordnung
- [ ] `aktivitaet-list` — columns: Typ (enum filter), Betreff, Datum, Firma, Person
- [ ] `gehalt-list` — columns: Person, Typ (enum filter), Betrag (number format), Datum
- [ ] `vertrag-list` — columns: Titel, Firma, Status (enum filter), Beginn, Ende, Wert (number format)
- [ ] `chance-list` — columns: Titel, Firma, Kontaktperson, Phase (enum filter), Wert (number format), Wahrscheinlichkeit
- [ ] `benutzer-list` — columns: Benutzername, Vorname, Nachname, Rollen

### 5. AG Grid Configuration Details

#### Enum Filters (use AG Grid text filter with predefined values via `filterParams`)
- **ChancePhase**: NEU, QUALIFIZIERT, ANGEBOT, VERHANDLUNG, GEWONNEN, VERLOREN
- **AktivitaetTyp**: ANRUF, EMAIL, MEETING, NOTIZ, AUFGABE
- **GehaltTyp**: GRUNDGEHALT, BONUS, PROVISION, SONDERZAHLUNG
- **VertragStatus**: ENTWURF, AKTIV, ABGELAUFEN, GEKUENDIGT

#### Number Formatting
- Currency columns (Wert, Betrag): `valueFormatter` with `Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' })`

#### Date Formatting
- Date columns: `valueFormatter` with `Intl.DateTimeFormat('de-DE')` or `date.toLocaleDateString('de-DE')`

#### Theme
- Use AG Grid's Quartz theme or Alpine theme, customize to match Bootstrap 5 look
- Import theme CSS in component or global styles

### 6. Row Click Navigation
- Each list component: `onRowClicked(event)` → `this.router.navigate(['/entity', event.data.id])`
- For entities without detail pages (Adresse, Aktivitaet, Gehalt): navigate to edit form `['/entity', id, 'bearbeiten']`

### 7. Add "Löschen" Button to Detail Pages
6 detail pages need a delete button with confirmation modal:

- [ ] `firma-detail` — add Löschen button, inject NgbModal + FirmaService, confirm → delete → navigate to list
- [ ] `person-detail` — same pattern
- [ ] `abteilung-detail` — same pattern
- [ ] `chance-detail` — same pattern
- [ ] `vertrag-detail` — same pattern
- [ ] `benutzer-detail` — same pattern

Pattern for each:
```typescript
onDelete(): void {
  const modalRef = this.modalService.open(ConfirmDialogComponent);
  modalRef.componentInstance.message = 'Wirklich löschen?';
  modalRef.result.then(() => {
    this.service.delete(this.id).subscribe(() => {
      this.notification.success('Gelöscht');
      this.router.navigate(['/entity']);
    });
  }).catch(() => {});
}
```

Button placement: between Bearbeiten and Zurück, styled `btn btn-outline-danger`.

### 8. Verification
- [ ] `cd frontend && npx ng build` — must pass
- [ ] `cd backend && mvn clean compile` — must pass
- [ ] Manual: each list loads all data, columns filterable/sortable
- [ ] Manual: row click navigates to detail (or edit for Adresse/Aktivitaet/Gehalt)
- [ ] Manual: enum filters show correct dropdown values
- [ ] Manual: number/date columns formatted correctly
- [ ] Manual: Löschen button works on all 6 detail pages

## Tests

### Build Checks
- [ ] Frontend `ng build` passes with no errors
- [ ] Backend `mvn clean compile` passes

### Manual Verification
- [ ] Firma list: all firms visible, Name/Branche/E-Mail sortable+filterable, click → detail
- [ ] Person list: filterable by all columns, click → detail
- [ ] Chance list: Phase column has enum dropdown filter with 6 values
- [ ] Aktivitaet list: Typ column has enum dropdown filter with 5 values
- [ ] Gehalt list: Typ enum filter, Betrag shows EUR formatting
- [ ] Vertrag list: Status enum filter, Wert shows EUR formatting
- [ ] All detail pages: Bearbeiten + Löschen + Zurück buttons present
- [ ] Löschen: shows confirmation, deletes on confirm, navigates back
