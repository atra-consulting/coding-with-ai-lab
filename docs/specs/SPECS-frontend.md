# Frontend Specification

Angular 21.2.1 standalone components. Bootstrap 5.3.8 + ng-bootstrap 20.0.0. TypeScript 5.9.2.

Visual design, colors, layout measurements, and AG Grid theming: `docs/specs/SPECS-ui.md`.

## Architectural Rules

- **Standalone Components**: Uses Angular 21 standalone components exclusively. No NgModules, no `standalone: true` (default in Angular 21).
- **Dependency Injection**: Prefers `inject(Service)` over constructor injection.
- **Control Flow**: Uses modern `@if`, `@for`, and `@switch` syntax only. Never `*ngIf`/`*ngFor`. `@for` requires `track`.
- **Forms**: Reactive forms with `FormBuilder`.
- **Permissions**: Routes must be protected with `canActivate: [authGuard]` for authenticated routes, or `canActivate: [roleGuard('ROLE_ADMIN')]` for admin-only routes.

## Routing

```
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
  /chancen                      → Chance CRUD (list/detail/form)
  /admin                        → Admin subtree (roleGuard per route)
    /admin/agent-tasks          → AgentTasksDashboardComponent (roleGuard('ROLE_ADMIN'))
    /admin/agent-tasks/:id      → AgentTaskDetailComponent (roleGuard('ROLE_ADMIN'))
    /admin/cron                 → CronDashboardComponent (roleGuard('ROLE_ADMIN'))
**                              → redirect /login
```

Route sub-patterns per entity: `''` (list), `/neu` (create form), `/:id` (detail), `/:id/bearbeiten` (edit form).

## Authentication

Session-based auth. The server sets an HTTP-only session cookie on login. The frontend does not store or manage tokens.

### AuthService

- `login(LoginRequest)` → POST `/api/auth/login`, then calls `fetchCurrentUser()` to populate the user signal
- `logout()` → POST `/api/auth/logout`, clears user signal, redirects to `/login`
- `initializeAuth()` → called at app startup, calls `fetchCurrentUser()` to restore session from cookie
- `fetchCurrentUser()` (private) → GET `/api/auth/me`, updates the internal signal
- Signals: `currentUser` (readonly, public projection of the internal `currentUserSignal`), `isAuthenticated` (computed)

No `hasPermission()` method. No refresh token. No access token storage. Session persistence relies on the browser cookie.

### Guards

- **authGuard** (`core/guards/auth.guard.ts`): Checks `isAuthenticated()`, redirects to `/login` (no `returnUrl` parameter).
- **roleGuard** (`core/guards/role.guard.ts`): Factory `roleGuard(...requiredRoles: string[])`. Checks that `currentUser().rollen` includes at least one of the required roles. Redirects to `/dashboard` on failure. Used as `roleGuard('ROLE_ADMIN')`.

There is no `permissionGuard` and no `hasPermission()` in the codebase.

### Interceptors

- **authInterceptor**: Clones every request with `withCredentials: true` (sends session cookie). On 401, redirects to `/login` — but skips redirect if current path is already a public route (`/login`, `/feedback`, `/feedback-qr`, `/danke`). On 403, shows "Zugriff verweigert" toast. No Bearer token header. No refresh logic.
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
| chance.model.ts | ChancePhase, Chance, ChanceCreate |
| dashboard.model.ts | DashboardData, RecentChance, RecentAktivitaet (re-exports ChancePhase, AktivitaetTyp) |
| auth.model.ts | LoginRequest, LoginResponse, BenutzerInfo |
| page.model.ts | Page\<T\> (content, totalElements, totalPages, size, number, first, last) |
| agent-task.model.ts | AgentTaskSource, AgentTaskStatus, AgentTask, AgentTaskSummary |
| cron.model.ts | CronRunStatus, CronTrigger, CronRun, CronJobLastRun, CronJob |

`auth.model.ts` contains three interfaces. `LoginRequest` has `benutzername` and `passwort`. `LoginResponse` has `benutzername`, `vorname`, `nachname`, `rollen`. `BenutzerInfo` has `id`, `benutzername`, `vorname`, `nachname`, `email`, `rollen`, `permissions`. No `RefreshResponse`.

`DashboardData` has: `firmenCount`, `personenCount`, `offeneChancenCount`, `gewonneneChancenSumme`, `recentChancen` (array of `RecentChance`), `recentAktivitaeten` (array of `RecentAktivitaet`).

`chance.model.ts` does not contain a `BoardSummary` interface.

## Services (core/services/)

All services use `inject(HttpClient)` and wrap REST calls to `/api/<plural>`.

All entity services provide a `listAll()` method (GET `/api/<plural>/all`) returning an unfiltered array. Standard paginated listing is `getAll(page?, size?, sort?)`, plus `getById(id)`, `create(dto)`, `update(id, dto)`, `delete(id)`.

`search` parameter availability by service:

| Service | `getAll` accepts `search`? |
|---------|--------------------------|
| FirmaService | Yes |
| PersonService | Yes (also accepts optional `abteilungId`) |
| AbteilungService | No |
| AdresseService | No |
| AktivitaetService | No |
| ChanceService | No (`getAll` not present — uses `listAll()` only) |

Additional methods:

| Service | Extra Methods |
|---------|--------------|
| FirmaService | `getPersonen(id, page, size)`, `getAbteilungen(id, page, size)` |
| AbteilungService | `getAllByFirmaId(firmaId)` |
| AgentTaskService | `getAll(page, size, sort, source?, status?)`, `getById(id)`, `getSummary()`, `resetAll()` |
| CronService | `getJobs()`, `getRuns(page, size, job?)`, `triggerNow(job?)` |
| DashboardService | `getDashboard()` → `DashboardData` (single GET `/api/dashboard`) |
| NotificationService | `success(msg)`, `error(msg)`, `info(msg)`, `warning(msg)` |
| LayoutService | `collapsed` (signal), `toggleSidebar()` |

## Feature Components

### Login

- Displays three hardcoded user cards (admin, user, demo) — no form fields, no ReactiveFormsModule.
- Clicking a card calls `loginAs(user)`, which calls `AuthService.login()` directly with the hardcoded credentials.
- Redirects to `returnUrl` query param (if present and safe) or `/dashboard` on success.
- No demo-mode button, no `/api/auth/demo-mode` call, no password visibility toggle.

### Feedback

Three public components. No auth required. No backend calls — data posts directly to a Google Apps Script URL.

- **FeedbackFormComponent** (`/feedback`): Multi-step survey. Question types: `stars` (1–5 rating), `choice` (single select), `multichoice` (multi select), `text` (free text). Submits JSON payload via `fetch` with `mode: no-cors`.
- **ThankyouComponent** (`/danke`): Confirmation page after submission.
- **FeedbackQrComponent** (`/feedback-qr`): Displays a QR code linking to `/feedback`. Uses the `qrcode` library. Intended for trainer display during sessions.

### Dashboard

- Single GET `/api/dashboard` returns `DashboardData`: `firmenCount`, `personenCount`, `offeneChancenCount`, `gewonneneChancenSumme`, `recentChancen`, `recentAktivitaeten`.
- Widget sub-components: recent Chancen (`recentChancen`) and recent Aktivitaeten (`recentAktivitaeten`).

### Entity CRUD (Firma, Person, Abteilung, Adresse, Aktivitaet, Chance)

**List pattern**: Entity list views use **AG Grid** (`ag-grid-angular`, `themeQuartz` theme). AG Grid provides built-in column filtering, sorting, and resizing. `NgbPagination` is used only in detail views with child-list tabs (e.g. Firma detail shows paginated Personen and Abteilungen tabs) — not as the primary list mechanism. AG Grid theming details: `docs/specs/SPECS-ui.md`.

**Form pattern**: ReactiveFormsModule + FormBuilder. Edit mode detected via route param `:id`. Loads existing data with `patchValue()`. Navigates to detail/list on submit.

**Detail pattern**: Display fields, tabbed child lists (NgbNavModule), edit/delete buttons.

### Administration (Admin Routes)

Admin routes live under `/admin`, defined in `features/admin/admin.routes.ts`. All three routes use `canActivate: [roleGuard('ROLE_ADMIN')]`.

- `/admin/agent-tasks` → `AgentTasksDashboardComponent`: summary cards per source, per-source task list, reset button.
- `/admin/agent-tasks/:id` → `AgentTaskDetailComponent`: task detail view.
- `/admin/cron` → `CronDashboardComponent`: cron job list with last-run status, run history, manual trigger button.

## Layout Components

### Sidebar

Sections with role-filtered items. Items with a `requiredRole` are hidden when the current user does not have that role; items without `requiredRole` are always visible to authenticated users.

| Section | Items (requiredRole) |
|---------|---------------------|
| Übersicht | Dashboard (none) |
| Kunden & Kontakte | Firmen (none), Personen (none), Abteilungen (none), Adressen (none) |
| *(no title)* | Chancen (none), Aktivitäten (none) |
| Administration | Agent-Aufgaben (ROLE_ADMIN), Cron-Jobs (ROLE_ADMIN) |

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
