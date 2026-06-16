# Frontend Specification

Angular 21.2.1 standalone components. Bootstrap 5.3.8 + ng-bootstrap 20.0.0. TypeScript 5.9.2.

Visual design, colors, layout measurements, and AG Grid theming: `docs/specs/SPECS-ui.md`.

## Architectural Rules

- **Standalone Components**: Uses Angular 21 standalone components exclusively. No NgModules, no `standalone: true` (default in Angular 21).
- **Dependency Injection**: Prefers `inject(Service)` over constructor injection.
- **Control Flow**: Uses modern `@if`, `@for`, and `@switch` syntax only. Never `*ngIf`/`*ngFor`. `@for` requires `track`.
- **Forms**: Reactive forms with `FormBuilder`.
- **Permissions**: Routes must be protected with `canActivate: [permissionGuard('PERMISSION')]` or `canActivate: [roleGuard('ROLE_ADMIN')]` for admin routes.

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
  /aktivitaeten                 → Aktivitaet CRUD (no detail)
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
| aktivitaet.model.ts | AktivitaetTyp, Aktivitaet, AktivitaetCreate |
| chance.model.ts | ChancePhase, Chance, ChanceCreate, BoardSummary |
| dashboard.model.ts | DashboardData, RecentChance, RecentAktivitaet (re-exports ChancePhase, AktivitaetTyp) |
| auth.model.ts | LoginRequest, LoginResponse, BenutzerInfo |
| page.model.ts | Page\<T\> (content, totalElements, totalPages, size, number, first, last) |
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
| DashboardService | `getDashboard()` → `DashboardData` (single GET `/api/dashboard`) |
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

- Single GET `/api/dashboard` returns `DashboardData`: firmenCount, personenCount, offeneChancenCount, gewonneneChancenSumme
- Widget sub-components: recent Chancen (`recentChancen`) and recent Aktivitaeten (`recentAktivitaeten`)

### Entity CRUD (Firma, Person, Abteilung, Adresse, Aktivitaet, Chance)

**List pattern**: Entity list views use **AG Grid** (`ag-grid-angular`, `themeQuartz` theme). AG Grid provides built-in column filtering, sorting, and resizing. `NgbPagination` is used only in detail views with child-list tabs (e.g. Firma detail shows paginated Personen and Abteilungen tabs) — not as the primary list mechanism. AG Grid theming details: `docs/specs/SPECS-ui.md`.

**Form pattern**: ReactiveFormsModule + FormBuilder. Edit mode detected via route param `:id`. Loads existing data with `patchValue()`. Navigates to detail/list on submit.

**Detail pattern**: Display fields, tabbed child lists (NgbNavModule), edit/delete buttons.

### Chance Board (Kanban)

- 6 columns for ChancePhase values
- @angular/cdk drag-drop between columns
- Optimistic phase update with rollback on error
- "Mehr laden" pagination per column
- BoardSummary (count, totalWert) per phase header
- Toggle between list and board view via btn-group
- Phase badge color map: `docs/specs/SPECS-ui.md`

## Layout Components

### Sidebar

Sections with role-filtered items. Items with a `requiredRole` are hidden when the current user does not have that role; items without `requiredRole` are always visible to authenticated users.

| Section | Items (requiredRole) |
|---------|---------------------|
| Übersicht | Dashboard (none) |
| Kunden & Kontakte | Firmen (none), Personen (none), Abteilungen (none), Adressen (none) |
| *(no title)* | Chancen (none), Aktivitäten (none) |

Empty sections are hidden. Uses FontAwesome icons (`fa-icon`) and `RouterLinkActive`.

**Bottom-anchored items**: A `bottomItems` array in `SidebarComponent` renders below the main sections, pushed to the bottom via `mt-auto`. Currently holds a single **Feedback** link to `/feedback` (public route, no permission required). A top border separates it from the main nav; the collapse toggle and footer sit below it.

**Collapsible State**: The sidebar can be collapsed to a mini-view. State is managed by `LayoutService` (`collapsed` signal). Persisted in `localStorage` under the key `sidebar_collapsed`. Items are filtered by role via `visibleItems()` in the sidebar component — role-filter logic, not permission-string logic.

Visual facts (widths, icon spacing, section-header colors, nav-link colors, active style): `docs/specs/SPECS-ui.md`.

### Navbar

- Current user name display
- Logout button

## Shared Components

Appearance and Bootstrap variant details: `docs/specs/SPECS-ui.md`.

### NotificationComponent

- Inject `NotificationService`. Call `success(msg)`, `error(msg)`, `info(msg)`, or `warning(msg)`.
- Component subscribes to the service's observable and renders the alert.

### ConfirmDialogComponent

- Open via `NgbModal.open(ConfirmDialogComponent)`. Pass message via `componentInstance.message`.
- Returns a promise that resolves on confirm, rejects on dismiss.

### LoadingSpinnerComponent

- Add `<app-loading-spinner>` in template. Show/hide with `@if(loading)`.

### EurCurrencyPipe

- Apply as `{{ value | eurCurrency }}` in templates.
- Pipe is standalone; import `EurCurrencyPipe` in the component's `imports` array.

## Proxy Configuration

See `docs/specs/SPECS-infrastructure.md` for proxy config (`/api` → `http://localhost:7070`).
