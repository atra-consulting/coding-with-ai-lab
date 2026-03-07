# Frontend Specification

Angular 20.3.0 standalone components. Bootstrap 5.3.8 + ng-bootstrap 19.0.1. TypeScript 5.9.2.

## Routing

```
/login                          → LoginComponent (no guard)
/ (authGuard)
  /dashboard                    → DashboardComponent
  /firmen                       → Firma CRUD (list/detail/form)
  /personen                     → Person CRUD
  /abteilungen                  → Abteilung CRUD
  /adressen                     → Adresse CRUD (no detail)
  /gehaelter                    → permissionGuard('GEHAELTER') → Gehalt CRUD (no detail)
  /aktivitaeten                 → Aktivitaet CRUD (no detail)
  /vertraege                    → permissionGuard('VERTRAEGE') → Vertrag CRUD
  /chancen                      → permissionGuard('CHANCEN') → Chance CRUD + /board
  /auswertungen                 → permissionGuard('AUSWERTUNGEN') → Pipeline dashboard
  /benutzer                     → permissionGuard('BENUTZERVERWALTUNG') → Benutzer CRUD
  **                            → redirect /dashboard
```

Route sub-patterns per entity: `''` (list), `/neu` (create form), `/:id` (detail), `/:id/bearbeiten` (edit form).

## Authentication

### AuthService

- `login(LoginRequest)` → POST `/api/auth/login`, stores access token
- `logout()` → POST `/api/auth/logout`, clears token, redirects to `/login`
- `refresh()` → POST `/api/auth/refresh` (withCredentials for cookie)
- `initializeAuth()` → called at app startup, attempts refresh to restore session
- `fetchCurrentUser()` → GET `/api/auth/me`, updates currentUserSignal
- `hasPermission(permission)` → checks JWT claims
- Signals: `currentUserSignal`, `isAuthenticated` (computed)

### Guards

- **authGuard**: Checks `isAuthenticated()`, redirects to `/login` with returnUrl
- **permissionGuard(permission)**: Checks `hasPermission()`, redirects to `/dashboard` with error toast

### Interceptors

- **authInterceptor**: Adds `Authorization: Bearer` header. On 401, attempts silent refresh with request queuing via BehaviorSubject. Shows 403 errors.
- **apiErrorInterceptor**: Catches non-401/403 errors, shows German toast messages.

## Models (core/models/)

Each entity has a response interface and a `*Create` input interface.

| File | Interfaces |
|------|-----------|
| firma.model.ts | Firma, FirmaCreate |
| person.model.ts | Person, PersonCreate |
| abteilung.model.ts | Abteilung, AbteilungCreate |
| adresse.model.ts | Adresse, AdresseCreate |
| gehalt.model.ts | GehaltTyp, Gehalt, GehaltCreate |
| aktivitaet.model.ts | AktivitaetTyp, Aktivitaet, AktivitaetCreate |
| vertrag.model.ts | VertragStatus, Vertrag, VertragCreate |
| chance.model.ts | ChancePhase, Chance, ChanceCreate, BoardSummary |
| benutzer.model.ts | Benutzer, BenutzerCreate |
| dashboard.model.ts | DashboardStats, TopFirma, DepartmentSalary |
| auth.model.ts | LoginRequest, LoginResponse, RefreshResponse, BenutzerInfo |
| page.model.ts | Page\<T\> (content, totalElements, totalPages, size, number, first, last) |
| report.model.ts | ReportDimension, ReportMetrik, ReportFilter, ReportQuery, ReportZeile, ReportResult, SavedReport, SavedReportCreate |
| auswertung.model.ts | PipelineKpis, PhaseAggregate, TopFirma |

## Services (core/services/)

All services use `inject(HttpClient)` and wrap REST calls to `/api/<plural>`.

Standard entity services provide: `getAll(page?, size?, sort?, search?)`, `getById(id)`, `create(dto)`, `update(id, dto)`, `delete(id)`.

Additional methods:

| Service | Extra Methods |
|---------|--------------|
| FirmaService | `getPersonen(id, page, size)`, `getAbteilungen(id, page, size)` |
| AbteilungService | `getAllByFirmaId(firmaId)` |
| ChanceService | `getByPhase(phase, page, size, sort)`, `getBoardSummary()`, `updatePhase(id, phase)` |
| BenutzerService | `toggleActive(id)` |
| DashboardService | `getStats()`, `getRecentActivities()`, `getSalaryStatistics()`, `getTopCompanies()` |
| AuswertungService | `getPipelineKpis()`, `getPhaseAggregates()`, `getTopFirmen(limit?)` |
| ReportService | `executeReport(query)` |
| SavedReportService | `getAll()`, `create(dto)`, `update(id, dto)`, `delete(id)` |
| DashboardConfigService | `getConfig()`, `saveConfig(config)` |
| NotificationService | `success(msg)`, `error(msg)`, `info(msg)`, `warning(msg)` |

## Feature Components

### Login

- Reactive form with benutzername/passwort fields
- Demo mode button (loads flag from GET `/api/auth/demo-mode`)
- Password visibility toggle
- Redirects to returnUrl or `/dashboard` on success

### Dashboard

- Stats overview (firmenCount, personenCount, aktivitaetenCount, offeneChancenCount, gesamtVertragswert, durchschnittsGehalt)
- Widget sub-components: recent activities, top companies, salary statistics

### Entity CRUD (Firma, Person, Abteilung, Adresse, Gehalt, Aktivitaet, Vertrag, Chance, Benutzer)

**List pattern**: Pagination (NgbPagination, 1-indexed → 0-indexed), search input, delete with ConfirmDialogComponent modal, loading spinner.

**Form pattern**: ReactiveFormsModule + FormBuilder. Edit mode detected via route param `:id`. Loads existing data with `patchValue()`. Navigates to detail/list on submit.

**Detail pattern**: Display fields, tabbed child lists (NgbNavModule), edit/delete buttons.

### Chance Board (Kanban)

- 6 columns for ChancePhase values
- @angular/cdk drag-drop between columns
- Optimistic phase update with rollback on error
- "Mehr laden" pagination per column
- BoardSummary (count, totalWert) per phase header
- Toggle between list and board view via btn-group

### Auswertungen (Pipeline Dashboard)

- Configurable widget layout (drag-drop reorder)
- Widget types: KPI tiles, bar chart (phase value), doughnut chart (distribution), top companies, pivot table
- Chart.js integration (bar, doughnut, horizontal bar)
- Dashboard config persisted per user
- Report builder slide-over for custom reports
- Saved reports as custom widgets

## Layout Components

### Sidebar

Sections with permission-filtered items:

| Section | Items (Permission) |
|---------|-------------------|
| Ubersicht | Dashboard (DASHBOARD) |
| Kunden & Kontakte | Firmen (FIRMEN), Personen (PERSONEN), Abteilungen (ABTEILUNGEN), Adressen (ADRESSEN) |
| Vertrieb | Chancen (CHANCEN), Aktivitaten (AKTIVITAETEN), Vertrage (VERTRAEGE) |
| Auswertungen | Pipeline (AUSWERTUNGEN) |
| Personal | Gehalter (GEHAELTER) |
| Administration | Benutzer (BENUTZERVERWALTUNG) |

Empty sections are hidden. Uses FontAwesome icons and RouterLinkActive.

### Navbar

- Current user name display
- Logout button

### Shared Components

- **NotificationComponent**: Fixed top-right Bootstrap alerts, auto-hide 5s
- **ConfirmDialogComponent**: NgbModal for delete confirmations
- **LoadingSpinnerComponent**: Bootstrap spinner
- **EurCurrencyPipe**: Formats as EUR (de-DE locale, 2 decimals)

## Styling

- Bootstrap 5 + SCSS with custom variables
- Primary: `#264892`, Secondary: `#777777`, Danger: `#dc421e`
- Body background: `#f5f6f8`
- Font: "Helvetica Neue", Helvetica, Arial, sans-serif
- Phase badge colors: bg-primary (NEU), bg-info (QUALIFIZIERT), bg-warning (ANGEBOT), bg-secondary (VERHANDLUNG), bg-success (GEWONNEN), bg-danger (VERLOREN)

## Proxy Configuration

```
/api/auth       → http://localhost:8081 (CIAM)
/api/benutzer   → http://localhost:8081 (CIAM)
/.well-known    → http://localhost:8081 (CIAM JWKS)
/api/*          → http://localhost:8080 (Backend)
```
