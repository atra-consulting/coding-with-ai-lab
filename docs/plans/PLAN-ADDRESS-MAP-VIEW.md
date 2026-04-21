# Implementation Plan: ADDRESS-MAP-VIEW

See: [PRD-ADDRESS-MAP-VIEW.md](../prds/PRD-ADDRESS-MAP-VIEW.md)

## Test Command

- Backend: `cd backend && npx playwright test`
- Frontend: `cd frontend && npx ng test --watch=false --browsers=ChromeHeadless`

## Phases

### Phase 1 — Backend (permission + endpoint)

- [ ] 1.1 Add `MAP_VIEW` permission constant and append to all three seed users in `backend/src/config/users.ts`.
- [ ] 1.2 Extend `backend/src/services/adresseService.ts` with `listMapMarkers(): MapMarkerRow[]`:
  - SQL: `SELECT a.id, a.street, a.houseNumber, a.postalCode, a.city, a.latitude, a.longitude, a.firmaId, f.name AS firmaName FROM adresse a LEFT JOIN firma f ON f.id = a.firmaId WHERE a.latitude IS NOT NULL AND a.longitude IS NOT NULL ORDER BY a.id ASC`.
  - Export `MapMarkerDTO` interface.
  - Map rows → DTOs (coerce `latitude`/`longitude` to numbers).
- [ ] 1.3 Register new route in `backend/src/routes/adressen.ts`:
  - `router.get('/map-markers', requireAuth, requirePermission('MAP_VIEW'), handler)`
  - **IMPORTANT**: place BEFORE `router.get('/:id', …)` so Express does not swallow it.
  - Handler returns `res.json(adresseService.listMapMarkers())`.
- [ ] 1.4 Verify `requirePermission` import path — if not yet exported from `middleware/auth.ts`, confirm with existing usage pattern.
- [ ] 1.5 Commit: `feat: Add /api/adressen/map-markers endpoint and MAP_VIEW permission. ADDRESS-MAP-VIEW`

### Phase 2 — Frontend dependencies + Leaflet wiring

- [ ] 2.1 `cd frontend && npm install leaflet && npm install --save-dev @types/leaflet`.
- [ ] 2.2 Add `@import 'leaflet/dist/leaflet.css';` to `frontend/src/styles.scss`.
- [ ] 2.3 Verify `ng build` succeeds with the new imports.
- [ ] 2.4 Commit: `feat: Add leaflet dependency and global css import. ADDRESS-MAP-VIEW`

### Phase 3 — Frontend core services + model

- [ ] 3.1 Create `frontend/src/app/core/models/map-marker.ts` — `MapMarker` interface matching backend DTO.
- [ ] 3.2 Create `frontend/src/app/core/services/karte.service.ts`:
  - `@Injectable({ providedIn: 'root' })`
  - Method `getMarkers(): Observable<MapMarker[]>` calling `GET /api/adressen/map-markers`.
- [ ] 3.3 Create `frontend/src/app/core/services/leaflet-map.factory.ts`:
  - `@Injectable({ providedIn: 'root' })`
  - `createMap(element, opts)` → `L.map(element, opts)`
  - `addTileLayer(map)` → tile layer with OSM URL + attribution
  - `createMarker(lat, lng, popupHtml)` → `L.marker([lat, lng]).bindPopup(popupHtml)`
  - Icon setup in module top (or in a module init block): `L.Icon.Default.mergeOptions({ ... })` with imports from `leaflet/dist/images/`. If Angular's build rejects these imports, copy PNGs to `frontend/src/assets/leaflet/` and use URL strings — fix according to build output.
- [ ] 3.4 Commit: `feat: Add KarteService, LeafletMapFactory, MapMarker model. ADDRESS-MAP-VIEW`

### Phase 4 — KarteComponent

- [ ] 4.1 Create `frontend/src/app/features/karte/karte.component.ts`:
  - Standalone component, `selector: 'app-karte'`.
  - Template: title `Karte`, badge `{{markerCount()}} Adressen`, an error alert (shown when error), fallback message (shown when zero markers), `<div #mapContainer>`.
  - `@ViewChild('mapContainer')` for map init.
  - Signals: `markers = signal<MapMarker[]>([])`, `errored = signal(false)`, `loaded = signal(false)`.
  - `ngAfterViewInit()`: subscribe to `karteService.getMarkers()`. On data: init map, add tile layer, iterate markers → factory.createMarker + addTo group. Fit bounds or fallback-center. On error: set `errored(true)`, do NOT init map.
  - `ngOnDestroy()`: `map?.remove()`.
  - `buildPopupHtml(marker)`: assemble German popup with HTML-escaped fields.
  - Local `escapeHtml(value)` helper.
- [ ] 4.2 Create `frontend/src/app/features/karte/karte.component.html` (or inline template).
- [ ] 4.3 Create `frontend/src/app/features/karte/karte.component.scss` — `.map-container { height: calc(100vh - 200px); width: 100%; }`.
- [ ] 4.4 Create `frontend/src/app/features/karte/karte.routes.ts` — single default route.
- [ ] 4.5 Register route in `frontend/src/app/app.routes.ts`: `{ path: 'karte', canActivate: [permissionGuard('MAP_VIEW')], loadChildren: () => import('./features/karte/karte.routes').then(m => m.KARTE_ROUTES) }`.
- [ ] 4.6 Commit: `feat: Add KarteComponent and /karte route. ADDRESS-MAP-VIEW`

### Phase 5 — Sidebar integration

- [ ] 5.1 In `frontend/src/app/layout/sidebar/sidebar.component.ts`:
  - Extend `NavItem` with `requiredPermission?: string`.
  - Update `visibleItems()` getter / computed signal to also filter by permission via `AuthService.currentUser()?.berechtigungen` (or whatever the field is called — verify in `AuthService`).
  - Add `Karte` item with `faMapLocationDot`, `route: '/karte'`, `requiredPermission: 'MAP_VIEW'` in the Übersicht section (directly after Dashboard).
- [ ] 5.2 Commit: `feat: Add Karte item to sidebar, extend NavItem with requiredPermission. ADDRESS-MAP-VIEW`

### Phase 6 — Tests

- [ ] 6.1 Backend test file `backend/src/test/adressen-map-markers.spec.ts`:
  - Login helpers (reuse pattern from existing tests).
  - `test.beforeAll`: resetDatabase, login as admin.
  - Tests: 200 for admin, count > 0, every row has lat/lng numbers, anonymous → 401, lat/lng within valid ranges, route precedence (URL `/map-markers` does NOT match `/:id`).
  - 403 test: if simulating permission removal is too invasive, ship as `test.skip` with comment.
- [ ] 6.2 Frontend spec `frontend/src/app/features/karte/karte.component.spec.ts`:
  - TestBed with mocked `KarteService` + `LeafletMapFactory`.
  - Three markers case: factory called 3x.
  - Zero markers case: fallback message visible, factory NOT called.
  - Error case: alert visible, factory NOT called.
  - Popup HTML contains escaped firmaName.
- [ ] 6.3 Frontend service spec `frontend/src/app/core/services/karte.service.spec.ts`:
  - HttpClientTestingModule, flush a fake response, verify URL.
- [ ] 6.4 Extend `frontend/src/app/layout/sidebar/sidebar.component.spec.ts` (or create if missing):
  - User with `MAP_VIEW` → Karte item in `visibleItems()`.
  - User without `MAP_VIEW` → Karte item absent.
- [ ] 6.5 Commit: `test: Add tests for map view feature. ADDRESS-MAP-VIEW`

### Phase 7 — Verification

- [ ] 7.1 Run backend test suite. Fix failures.
- [ ] 7.2 Run frontend test suite. Fix failures.
- [ ] 7.3 Verify `cd frontend && npx ng build` succeeds.
- [ ] 7.4 Commit any fix-up changes.

## Assumptions (from PRD)

A1–A15 — see PRD-ADDRESS-MAP-VIEW.md § Assumptions. All assumptions proceed without blocking.

## Out of scope

- Marker clustering, custom icons, tile server proxy, offline mode, pagination of map-markers endpoint — all deferred to a future iteration.
