# PRD: Address Map View (Karte)

## Source

Requested via `/plan-and-do` on 2026-04-21. Follows up on [PRD-ADDRESS-GEOCODING.md](PRD-ADDRESS-GEOCODING.md), which exposed `latitude`/`longitude` on addresses and provided a bulk-geocode admin endpoint. The geocoding PRD was explicitly motivated by "a future map view" — this is that view.

## Problem Statement

The CRM stores addresses with coordinates, but has no way to visualize them. Users cannot see where their customers are on a map, cannot spot regional clusters, and have no geographic overview. A dedicated map page fills this gap.

## Assumptions (User Away — No Interactive Clarification Possible)

These assumptions resolve spec ambiguities. Each is listed so a reviewer can flag if wrong.

- **A1** — The new permission is named `MAP_VIEW` (UPPERCASE, matching convention like `FIRMEN`, `CHANCEN`). Added to all three seed users in `backend/src/config/users.ts` so every existing login can use the feature.
- **A2** — Sidebar section for the new item: "Übersicht" group (top-level overview item), placed between `Dashboard` and the Kanban board. Label: `Karte`. Icon: `faMapLocationDot` from `@fortawesome/free-solid-svg-icons`.
- **A3** — Dedicated backend endpoint `GET /api/adressen/map-markers` is added. Returns a compact array of marker rows (id, street, houseNumber, postalCode, city, latitude, longitude, firmaId, firmaName) — one row per address where BOTH latitude and longitude are non-null. Addresses without coordinates are filtered server-side to save payload weight. Rationale: existing `GET /api/adressen/all` returns the full DTO including addresses with no coordinates; a dedicated endpoint keeps the contract explicit and avoids shipping unused fields.
- **A4** — Permission guard for the markers endpoint: `requirePermission('MAP_VIEW')` — chained after `requireAuth`. This matches `adressen.ts` pattern where routes use `requireAuth`, plus an added permission check.
- **A5** — Map library: **Leaflet 1.9.x** + **@types/leaflet**. Tile provider: OpenStreetMap (`https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png`). Attribution per OSM tile policy included in the map. No API key needed. This choice is final.
- **A6** — Frontend route: `/karte` (top-level, inside the authenticated parent route). Lazy-loaded under `features/karte/`.
- **A7** — Component strategy: a single standalone component `KarteComponent` that initializes Leaflet in `ngAfterViewInit`, fetches markers via `KarteService`, adds `L.marker` per row to a marker layer, fits `map.fitBounds()` to the marker group. On zero markers, center on Germany at `[51.1657, 10.4515]`, zoom 6.
- **A8** — Marker popup content (German):

  ```
  <strong>[firmaName]</strong>          ← link to /firmen/[firmaId] if firmaId
  [street] [houseNumber]
  [postalCode] [city]
  ```

  Fields are omitted when empty. If no `firmaId` is set on the address, show street/city without a link header.
- **A9** — Frontend permission guard: `permissionGuard('MAP_VIEW')` on the route. If the guard does not exist yet (it does — see `frontend/src/app/core/guards/`), reuse it.
- **A10** — Sidebar filtering: `NavItem` already supports `requiredRole`. Add `requiredPermission?: string` alongside it. The `visibleItems()` getter filters by both. If only `requiredPermission` is set, ignore role; if only `requiredRole`, ignore permission; if both, require both.
- **A11** — Map page layout: full-width, fixed-height map (e.g., `height: calc(100vh - 140px)`). No list/sidebar next to the map — markers only. A minimal header with title `Karte` and a count badge `[N] Adressen` under the title.
- **A12** — Marker icon: default Leaflet blue marker. No custom icons in this PRD. Leaflet's default icon image path needs explicit configuration when bundled through Angular's asset pipeline; the component must set `L.Icon.Default.mergeOptions({ iconUrl, iconRetinaUrl, shadowUrl })` using imports from `leaflet/dist/images/`.
- **A13** — No cluster / tile server proxy / offline mode. Out of scope.
- **A14** — No test hooks for the tile server; tests render the component with Leaflet stubbed or avoid actual tile loading. `KarteComponent` must be testable without a live DOM that loads tiles — the component delegates map construction to a small `LeafletMapFactory` service so the factory can be swapped in tests.
- **A15** — Response cap: map-markers endpoint returns all matching rows without pagination. For the seed fixture (100 addresses, all geocoded) this is fine. A future iteration can add `?limit=` if the dataset grows past a few thousand. Documented as known limitation.

## Requirements

### REQ-001: New permission `MAP_VIEW`

Add `MAP_VIEW` to the permission constants in `backend/src/config/users.ts`:

- Add to the permission list (wherever `FIRMEN`, `CHANCEN`, etc. are declared).
- Append `MAP_VIEW` to all three seed users' permission arrays (admin, user, demo).
- Priority: High.
- Acceptance: all three users can call the new endpoint; no user would receive 403 for lack of this permission.

### REQ-002: Backend endpoint `GET /api/adressen/map-markers`

A new route under the existing `/api/adressen` router, returning all addresses with non-null coordinates.

- Gated by `requireAuth` + `requirePermission('MAP_VIEW')`.
- Query: `SELECT id, street, houseNumber, postalCode, city, latitude, longitude, firmaId, (SELECT name FROM firma WHERE id = adresse.firmaId) AS firmaName FROM adresse WHERE latitude IS NOT NULL AND longitude IS NOT NULL`.
- Response shape: `MapMarkerDTO[]`:
  ```typescript
  interface MapMarkerDTO {
    id: number;
    street: string | null;
    houseNumber: string | null;
    postalCode: string | null;
    city: string | null;
    latitude: number;      // non-null by construction
    longitude: number;     // non-null by construction
    firmaId: number | null;
    firmaName: string | null;
  }
  ```
- No pagination. Sorted by `id ASC` for deterministic test output.
- Priority: High.
- Acceptance:
  - `GET /api/adressen/map-markers` as admin returns HTTP 200 with an array.
  - Every array entry has `latitude` and `longitude` as numbers (never null).
  - Addresses without coordinates are absent from the response.
  - Without login: HTTP 401 (via `requireAuth`).
  - With login but without `MAP_VIEW` permission (simulated by clearing a user's permissions in test): HTTP 403 with standard error shape.

### REQ-003: Frontend route `/karte` with permission guard

A new Angular route `/karte` inside the authenticated section.

- `canActivate: [permissionGuard('MAP_VIEW')]`.
- Lazy-loaded: `loadChildren: () => import('./features/karte/karte.routes').then(m => m.KARTE_ROUTES)`.
- `KARTE_ROUTES` has a single entry at path `''` loading `KarteComponent`.
- Priority: High.
- Acceptance: navigation to `/karte` works for a user with `MAP_VIEW`; users without it are redirected or shown a 403 state (whatever `permissionGuard` already does).

### REQ-004: Sidebar entry `Karte`

A new `NavItem` in the `SidebarComponent`.

- Label: `Karte`.
- Route: `/karte`.
- Icon: `faMapLocationDot`.
- Section: "Übersicht" (the first group).
- Position: directly after the `Dashboard` entry.
- `requiredPermission: 'MAP_VIEW'`.
- The `NavItem` interface gains an optional `requiredPermission?: string`. The `visibleItems()` filter must consider it (AND logic with any existing `requiredRole`).
- Priority: High.
- Acceptance: users with `MAP_VIEW` see the entry. Users without it (simulated in tests by stripping the permission from the current user) do not see it.

### REQ-005: `KarteComponent` renders a Leaflet map

Standalone Angular component at `frontend/src/app/features/karte/karte.component.ts`.

- Uses `inject(KarteService)` to load markers on init.
- Uses `inject(LeafletMapFactory)` for map construction (REQ-009).
- On `ngAfterViewInit`, creates the map instance, adds the OSM tile layer, adds all markers, and calls `fitBounds` on the marker group. If zero markers, centers on `[51.1657, 10.4515]` at zoom 6.
- Map container: a `<div #mapContainer>` with a CSS class giving it full width and fixed height.
- Above the map: `<h1>Karte</h1>` and a small `<span class="badge">[N] Adressen</span>`.
- Cleans up the map instance in `ngOnDestroy` (`map.remove()`).
- Priority: High.
- Acceptance:
  - Component renders without JS errors for the admin user.
  - After data loads, the DOM contains one `.leaflet-marker-icon` per marker row.
  - Badge shows the marker count.

### REQ-006: Marker popup (German)

Every marker has a popup on click.

- Popup HTML is assembled from the marker row. Leaflet's `bindPopup(html)` takes the string.
- Line 1: `<strong>${firmaName}</strong>` wrapped in an `<a href="/firmen/${firmaId}">` when `firmaId` is present. If no `firmaId`, show a plain strong line with "Kein Firma-Bezug" (German), or omit the line entirely — pick omit.
- Line 2: `${street} ${houseNumber}` (stripped of extra spaces if one is null).
- Line 3: `${postalCode} ${city}`.
- Empty fields skipped; empty lines not rendered.
- HTML-escape user-provided content (street/city/firmaName/postalCode/houseNumber) before injecting into the popup string to prevent XSS — use a tiny local `escapeHtml()` helper.
- Priority: High.
- Acceptance:
  - Clicking a marker shows a popup with firma name (linked), street+houseNumber, postalCode+city.
  - A marker for an address without `firmaId` shows only the address lines.
  - A marker where `firmaName` contains `<script>` does not execute it (XSS test).

### REQ-007: Fit bounds / fallback center

On load, after markers are added:

- If at least one marker: `map.fitBounds(markerGroup.getBounds(), { padding: [40, 40] })`.
- If zero markers: `map.setView([51.1657, 10.4515], 6)`. Also render a small muted text block above the map: "Keine Adressen mit Koordinaten vorhanden."
- Priority: High.
- Acceptance:
  - Seed fixture (100 markers): all visible within viewport after load.
  - Empty-marker case (simulated in test): map centers on Germany, message visible.

### REQ-008: Add Leaflet as a dependency

`frontend/package.json`:

- `leaflet` as a `dependencies` entry (pin latest 1.9.x).
- `@types/leaflet` as a `devDependencies` entry.
- `frontend/src/styles.scss` imports `leaflet/dist/leaflet.css` (or per-component `styleUrls`).
- Angular build: verify the Leaflet CSS is bundled (Angular 21 handles this automatically for `@import` in `styles.scss`).
- Priority: High.
- Acceptance: `npm install` succeeds; `ng build` succeeds; Leaflet CSS loaded in the browser (visible on a manual check).

### REQ-009: `LeafletMapFactory` for testability

A thin Angular service that wraps Leaflet's map/tile/marker construction.

- Purpose: component tests mock this factory so they never need Leaflet to touch the DOM or load tiles.
- Interface:
  ```typescript
  interface LeafletMapFactory {
    createMap(element: HTMLElement, opts?: L.MapOptions): L.Map;
    addTileLayer(map: L.Map): L.TileLayer;
    createMarker(lat: number, lng: number, popupHtml: string): L.Marker;
  }
  ```
- Default implementation uses real Leaflet. Component injects it via `inject(LeafletMapFactory)`.
- Priority: Medium.
- Acceptance: component test can substitute a jasmine spy factory, avoiding `L` calls entirely.

### REQ-010: `KarteService` for fetching markers

Frontend service at `frontend/src/app/core/services/karte.service.ts`.

- Method: `getMarkers(): Observable<MapMarker[]>` → calls `GET /api/adressen/map-markers`.
- `MapMarker` TypeScript interface matches `MapMarkerDTO` from the backend.
- Priority: High.
- Acceptance: component test mocks this service with an Observable of fake markers; assertions on the resulting map content pass.

### REQ-011: Error handling

If `GET /api/adressen/map-markers` fails (network error, 500, etc.):

- Render a Bootstrap `alert-danger` above the map container: "Karte konnte nicht geladen werden. Bitte später erneut versuchen."
- Do NOT initialize the map at all in the error case — no empty map shell.
- Log the HTTP error to `console.error`.
- Priority: Medium.
- Acceptance: a component test that makes the service return `throwError` shows the error alert and no map container.

## Special Instructions

- No changes to existing `adresseService.ts` data shape beyond the new markers endpoint. Do not touch `AdresseDTO`.
- Leaflet's default marker icon needs special handling because Webpack-style asset resolution is not default in Angular 21. Use the documented workaround:
  ```typescript
  import iconRetinaUrl from 'leaflet/dist/images/marker-icon-2x.png';
  import iconUrl from 'leaflet/dist/images/marker-icon.png';
  import shadowUrl from 'leaflet/dist/images/marker-shadow.png';
  L.Icon.Default.mergeOptions({ iconRetinaUrl, iconUrl, shadowUrl });
  ```
  If Angular's build pipeline doesn't like those imports, copy the three PNGs to `frontend/src/assets/leaflet/` and set URL strings manually. Solve whichever way the build actually accepts.

## Implementation Approach

### Backend

1. **`backend/src/config/users.ts`** — add `MAP_VIEW` to the permissions list; append to all three users.
2. **`backend/src/services/adresseService.ts`** — add a `listMapMarkers()` function: runs the filtered SQL, returns `MapMarkerDTO[]`. Stays in the existing service (no new service needed).
3. **`backend/src/routes/adressen.ts`** — add `router.get('/map-markers', requireAuth, requirePermission('MAP_VIEW'), handler)`. **Place this route BEFORE `router.get('/:id', …)`** or Express will match `/map-markers` as `:id`. Returns the array directly (no pagination envelope).

### Frontend

4. **`frontend/package.json`** — add `leaflet` + `@types/leaflet`.
5. **`frontend/src/styles.scss`** — `@import 'leaflet/dist/leaflet.css';`
6. **`frontend/src/app/core/models/map-marker.ts`** — TypeScript interface.
7. **`frontend/src/app/core/services/karte.service.ts`** — HttpClient-based service.
8. **`frontend/src/app/core/services/leaflet-map.factory.ts`** — factory service wrapping Leaflet construction.
9. **`frontend/src/app/features/karte/karte.component.ts`** (+ `.html`, `.scss`) — standalone component.
10. **`frontend/src/app/features/karte/karte.routes.ts`** — single route loading `KarteComponent`.
11. **`frontend/src/app/app.routes.ts`** — add `{ path: 'karte', canActivate: [permissionGuard('MAP_VIEW')], loadChildren: () => … }` under the authenticated parent.
12. **`frontend/src/app/layout/sidebar/sidebar.component.ts`** — extend `NavItem` with `requiredPermission?`, update `visibleItems()`, add the `Karte` entry in the Übersicht section with `requiredPermission: 'MAP_VIEW'`.

## Test Strategy

### Backend (Playwright, under `backend/src/test/`)

New file `adressen-map-markers.spec.ts`:

- Admin: `GET /api/adressen/map-markers` returns HTTP 200 with a non-empty array (seed fixture has 100 geocoded rows).
- Every returned row has `latitude` and `longitude` as numbers, never null.
- Every returned row's lat is in `[-90, 90]` and lng in `[-180, 180]`.
- Response count equals the count of seed rows where `latitude IS NOT NULL AND longitude IS NOT NULL`.
- Anonymous: `GET /api/adressen/map-markers` without session returns 401.
- Authenticated user without `MAP_VIEW` (simulated — requires a test helper that mutates the in-memory user permissions, then restores): 403 with standard error shape.
  - Fallback: if mutating `users.ts` is too invasive for a test, ship the test as a `test.skip` with a note — the 401 check already exercises the middleware.
- Route precedence: `GET /api/adressen/map-markers` does NOT match the `/:id` route (verify returned JSON is an array of markers, not a single `AdresseDTO`).

### Frontend (Jasmine under `frontend/src/app/`)

`karte.component.spec.ts`:

- Component renders the title "Karte" and a count badge.
- When `KarteService.getMarkers()` emits three markers, `LeafletMapFactory.createMarker` is called three times.
- When `KarteService.getMarkers()` emits zero markers, the fallback message appears and no markers are created.
- When `KarteService.getMarkers()` emits an error, the `alert-danger` is shown and `LeafletMapFactory.createMap` is NOT called.
- Marker popup HTML is correctly assembled (firma name, address lines).
- XSS guard: `firmaName = '<script>alert(1)</script>'` ends up HTML-escaped in the popup string.

`karte.service.spec.ts`:

- `getMarkers()` calls `GET /api/adressen/map-markers` (verify via `HttpTestingController`).
- Returns the array as-is.

`sidebar.component.spec.ts` (extend existing spec):

- A user with `MAP_VIEW` sees the `Karte` entry in `visibleItems()`.
- A user without `MAP_VIEW` does not see it.

### CI / Non-Functional

- No live network calls (no real tile loads in tests).
- Backend test runs against the seed fixture in an integration mode (standard pattern already in use).
- Frontend test runs under Karma + ChromeHeadless without a live Leaflet (factory is mocked).

## Non-Functional Requirements

- **Performance**: 100 markers rendering is trivial for Leaflet; no clustering needed for the seed dataset. Future: add `Leaflet.markercluster` if count exceeds ~1,000.
- **Accessibility**: the map is a visual-first feature; keyboard accessibility comes from Leaflet defaults. Tab reaches each marker. Popups are closable via the `×` button. No additional a11y work in this PRD.
- **Browser support**: same as the rest of the app (modern Chromium/Firefox/Safari).
- **Security**: popup HTML is escaped to prevent XSS from user-provided address/firma data.
- **No new secrets.** OSM tiles are free; attribution in the map is mandatory and included.

## Success Criteria

- [ ] Admin user navigates to `/karte`, sees 100 markers on a zoomed-to-fit Germany map, each marker is clickable with a popup.
- [ ] A marker popup links to the Firma detail page when the address has a `firmaId`.
- [ ] A non-`MAP_VIEW` user (simulated by stripping permission) does NOT see the sidebar entry and cannot reach `/karte`.
- [ ] `GET /api/adressen/map-markers` returns only rows with both coordinates non-null.
- [ ] `npm install` and `ng build` succeed with the new Leaflet dependencies.
- [ ] All existing backend and frontend tests pass.
- [ ] New tests: backend (markers endpoint), frontend (component, service, sidebar filtering).
- [ ] No existing address endpoints or DTOs are broken.

## Implementation

Implemented on branch `address-map-view`:

- `dc8f871` — Backend: `MAP_VIEW` permission, `requirePermission` middleware, `listMapMarkers()` service, `GET /api/adressen/map-markers` route (before `/:id`).
- `589c09a` — Frontend: install Leaflet 1.9.x + `@types/leaflet`; import Leaflet CSS; copy marker image assets into `public/leaflet/`.
- `c535b27` — Frontend: `KarteService`, `LeafletMapFactory`, `MapMarker` model.
- `951a92e` — Frontend: `KarteComponent` (template/style), `permissionGuard`, `/karte` route.
- `31de1d2` — Frontend: sidebar `Karte` entry with `requiredPermission: 'MAP_VIEW'`; `NavItem` extended with `requiredPermission`; `visibleItems()` filter updated.
- `7a8b55b` — Tests: backend Playwright spec for `/map-markers`; frontend Jasmine specs for `KarteComponent`, `KarteService`, `permissionGuard`, sidebar permission filter.
- `41f2121` — Test fixups: skip cross-process 403 test with justification; fix component-spec closure typing.
- `1dafe2f` — Review fixes: `requirePermission` returns 401 (not 403) when session missing; `MapMarkerRow` coords typed nullable with narrowing filter; `KarteComponent` uses `takeUntilDestroyed` + `afterNextRender` instead of bare `subscribe` + `queueMicrotask` to prevent leaks and fix timing against `OnPush`.

Deviations from PRD: the 403-on-missing-permission integration test is ship-skipped (REQ-002 acceptance). Reason: the Playwright harness spawns the backend in a child process, so mutating `USERS.permissions` in the test worker does not reach the server. The 401 test still exercises the middleware chain. A full 403 test would require either a test-only admin endpoint that toggles permissions, or restarting the backend with modified users — both out of scope.
