# Frontend Specification

Angular 21.2.1 standalone components. Bootstrap 5.3.8 + ng-bootstrap 20.0.0. TypeScript 5.9.2.

## Architectural Rules

- **Standalone Components**: Uses Angular 21 standalone components exclusively.
- **Dependency Injection**: Prefers `inject(Service)` over constructor injection.
- **Control Flow**: Uses modern `@if`, `@for`, and `@switch` syntax.
- **Forms**: Reactive forms with `FormBuilder`.
- **Permissions**: Routes must be protected with `canActivate: [permissionGuard('PERMISSION')]`.

## Routing

```
/welcome                        → WelcomeComponent (no guard)
/login                          → LoginComponent (no guard)
/feedback                       → FeedbackFormComponent (no guard)
/danke                          → ThankyouComponent (no guard)
/feedback-qr                    → FeedbackQrComponent (no guard)
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
  **                            → redirect /welcome
```

Route sub-patterns per entity: `''` (list), `/neu` (create form), `/:id` (detail), `/:id/bearbeiten` (edit form).

## Authentication

Session-based auth. The server sets an HTTP-only session cookie on login. The frontend does not store or manage tokens.

### AuthService

- `login(LoginRequest)` → POST `/api/auth/login`, then calls `fetchCurrentUser()` to populate the user signal
- `logout()` → POST `/api/auth/logout`, clears user signal, redirects to `/login`
- `initializeAuth()` → called at app startup, calls `fetchCurrentUser()` to restore session from cookie
- `fetchCurrentUser()` (private) → GET `/api/auth/me`, updates `currentUserSignal`
- `hasPermission(permission)` → checks `permissions` array on `BenutzerInfo`
- Signals: `currentUserSignal` (readonly), `isAuthenticated` (computed)

No refresh token. No access token storage. Session persistence relies on the browser cookie.

### Guards

- **authGuard**: Checks `isAuthenticated()`, redirects to `/login` with returnUrl
- **permissionGuard(permission)**: Checks `hasPermission()`, redirects to `/dashboard` with error toast

### Interceptors

- **authInterceptor**: Clones every request with `withCredentials: true` (sends session cookie). On 401, redirects to `/welcome` — but skips redirect if current path is already a public route (`/login`, `/welcome`, `/feedback`, `/feedback-qr`, `/danke`). On 403, shows "Zugriff verweigert" toast. No Bearer token header. No refresh logic.
- **apiErrorInterceptor**: Catches non-401/403 errors. Shows German toast messages. Passes 401/403 through to `authInterceptor`.

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
| dashboard.model.ts | DashboardStats, TopFirma, DepartmentSalary |
| auth.model.ts | LoginRequest, LoginResponse, BenutzerInfo |
| page.model.ts | Page\<T\> (content, totalElements, totalPages, size, number, first, last) |
| report.model.ts | ReportDimension, ReportMetrik, ReportFilter, ReportQuery, ReportZeile, ReportResult, SavedReport, SavedReportCreate |
| auswertung.model.ts | PipelineKpis, PhaseAggregate, TopFirma |

`auth.model.ts` contains three interfaces. `LoginRequest` has `benutzername` and `passwort`. `LoginResponse` has `benutzername`, `vorname`, `nachname`, `rollen`. `BenutzerInfo` has `id`, `benutzername`, `vorname`, `nachname`, `email`, `rollen`, `permissions`. No `RefreshResponse`.

## Services (core/services/)

All services use `inject(HttpClient)` and wrap REST calls to `/api/<plural>`.

Standard entity services provide: `getAll(page?, size?, sort?, search?)`, `getById(id)`, `create(dto)`, `update(id, dto)`, `delete(id)`.

Additional methods:

| Service | Extra Methods |
|---------|--------------|
| FirmaService | `getPersonen(id, page, size)`, `getAbteilungen(id, page, size)` |
| AbteilungService | `getAllByFirmaId(firmaId)` |
| ChanceService | `getByPhase(phase, page, size, sort)`, `getBoardSummary()`, `updatePhase(id, phase)` |
| DashboardService | `getStats()`, `getRecentActivities()`, `getSalaryStatistics()`, `getTopCompanies()` |
| AuswertungService | `getPipelineKpis()`, `getPhaseAggregates()`, `getTopFirmen(limit?)` |
| ReportService | `executeReport(query)` |
| SavedReportService | `getAll()`, `create(dto)`, `update(id, dto)`, `delete(id)` |
| DashboardConfigService | `getConfig()`, `saveConfig(config)` |
| NotificationService | `success(msg)`, `error(msg)`, `info(msg)`, `warning(msg)` |
| LayoutService | `collapsed` (signal), `toggleSidebar()` |

## Feature Components

### Welcome

- Public landing page. No auth required.
- Entry point for unauthenticated users (401 redirects here).
- Contains link to `/login`.

### Login

- Reactive form with benutzername/passwort fields
- Demo mode button (loads flag from GET `/api/auth/demo-mode`)
- Password visibility toggle
- Redirects to returnUrl or `/dashboard` on success

### Feedback

Three public components. No auth required. No backend calls — data posts directly to a Google Apps Script URL.

- **FeedbackFormComponent** (`/feedback`): Multi-step survey. Question types: `stars` (1–5 rating), `choice` (single select), `multichoice` (multi select), `text` (free text). Submits JSON payload via `fetch` with `mode: no-cors`.
- **ThankyouComponent** (`/danke`): Confirmation page after submission.
- **FeedbackQrComponent** (`/feedback-qr`): Displays a QR code linking to `/feedback`. Uses the `qrcode` library. Intended for trainer display during sessions.

### Dashboard

- Stats overview (firmenCount, personenCount, aktivitaetenCount, offeneChancenCount, gesamtVertragswert, durchschnittsGehalt)
- Widget sub-components: recent activities, top companies, salary statistics

### Entity CRUD (Firma, Person, Abteilung, Adresse, Gehalt, Aktivitaet, Vertrag, Chance)

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

**Collapsible State**: The sidebar can be collapsed to a mini-view (60px) showing only icons. State is managed by `LayoutService` and persisted in `localStorage` (`sidebar_collapsed`).

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
/api  →  http://localhost:7070  (Backend)
```

Single rule. All `/api/*` calls proxy to the backend on port 7070. No CIAM service. No split routing.
