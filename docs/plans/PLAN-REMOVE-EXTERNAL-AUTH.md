# Implementation Plan: REMOVE-EXTERNAL-AUTH

## Test Command
```bash
cd backend && mvn clean compile && cd ../frontend && npx ng build
```

## Tasks

### Phase 1: Backend Auth Replacement

#### 1.1 Create CrmPrincipal (replaces JwtPrincipal)
- [ ] Create `/backend/src/main/java/com/crm/security/CrmPrincipal.java`
- [ ] Java record with fields: `Long benutzerId`, `String benutzername`, `String vorname`, `String nachname`

#### 1.2 Create UserIdentityService
- [ ] Create `/backend/src/main/java/com/crm/security/UserIdentityService.java`
- [ ] Static maps for username → ID, username → vorname/nachname
- [ ] 5 users with stable IDs: admin=1, vertrieb=2, personal=3, allrounder=4, demo=5

#### 1.3 Remove JJWT dependencies from pom.xml
- [ ] Remove `jjwt-api`, `jjwt-impl`, `jjwt-gson` from `/backend/pom.xml`

#### 1.4 Clean application properties
- [ ] Remove `jwt.public-key-path` property from `/backend/src/main/resources/application.properties`
- [ ] Remove `app.demo-mode` property
- [ ] Update `/backend/src/main/resources/application-dev.properties`: remove `app.cookie.secure=false` (dead), add `server.servlet.session.cookie.secure=false` and `server.servlet.session.cookie.same-site=lax`

#### 1.5 Rewrite SecurityConfig
- [ ] Modify `/backend/src/main/java/com/crm/config/SecurityConfig.java`
- [ ] Remove JwtAuthenticationFilter injection and `.addFilterBefore()`
- [ ] Add `InMemoryUserDetailsManager` bean with 5 users (BCrypt passwords, roles + permissions as GrantedAuthority)
- [ ] Add `PasswordEncoder` bean (BCryptPasswordEncoder)
- [ ] Add `AuthenticationManager` bean via AuthenticationConfiguration
- [ ] Change `SessionCreationPolicy.STATELESS` → `SessionCreationPolicy.IF_REQUIRED`
- [ ] Add `/api/auth/login` and `/api/auth/logout` to permitAll matchers
- [ ] Remove `"Authorization"` from CORS `allowedHeaders` (no longer used)
- [ ] Keep `allowCredentials(true)` (needed for session cookies)

#### 1.6 Add BadCredentialsException handler
- [ ] Add `@ExceptionHandler(BadCredentialsException.class)` to `/backend/src/main/java/com/crm/exception/GlobalExceptionHandler.java` returning 401

#### 1.7 Create AuthController
- [ ] Create `/backend/src/main/java/com/crm/controller/AuthController.java`
- [ ] `POST /api/auth/login`: accepts `{ benutzername, passwort }`, authenticates via AuthenticationManager, creates CrmPrincipal, stores in session, returns `{ benutzername, vorname, nachname, rollen }`
- [ ] `POST /api/auth/logout`: invalidates session, returns 200
- [ ] `GET /api/auth/me`: returns `{ id, benutzername, vorname, nachname, email, rollen, permissions }`
- [ ] Use HttpSessionSecurityContextRepository to save context to session
- [ ] Replace UserDetails principal with CrmPrincipal in the Authentication token

#### 1.8 Update SavedReportController
- [ ] Modify `/backend/src/main/java/com/crm/controller/SavedReportController.java`
- [ ] Replace `JwtPrincipal` → `CrmPrincipal` (import + all 4 casts)
- [ ] Add `@PreAuthorize("hasAuthority('AUSWERTUNGEN')")` at class level

#### 1.9 Update DashboardConfigController
- [ ] Modify `/backend/src/main/java/com/crm/controller/DashboardConfigController.java`
- [ ] Replace `JwtPrincipal` → `CrmPrincipal` (import + both casts)
- [ ] Add `@PreAuthorize("hasAuthority('DASHBOARD')")` at class level

#### 1.10 Delete JWT security classes
**Note:** Must happen after 1.5 (SecurityConfig no longer references filter), 1.8, and 1.9 (no more JwtPrincipal imports). Tasks 1.3+1.4+1.5+1.10 should be treated as one atomic commit since removing the JWT property while the JwtService bean still exists would crash at runtime.
- [ ] Delete `/backend/src/main/java/com/crm/security/JwtPrincipal.java`
- [ ] Delete `/backend/src/main/java/com/crm/security/JwtService.java`
- [ ] Delete `/backend/src/main/java/com/crm/security/JwtAuthenticationFilter.java`

#### 1.11 Backend compile check
- [ ] Run `cd backend && mvn clean compile`

### Phase 2: Remove CIAM

#### 2.1 Delete CIAM directory
- [ ] Delete entire `ciam/` directory
- [ ] Note: `/api/benutzer/*` endpoints lived in CIAM, not backend. Deleting CIAM removes them. No backend BenutzerController exists.

### Phase 3: Frontend Changes

#### 3.1 Update auth model
- [ ] Modify `/frontend/src/app/core/models/auth.model.ts`
- [ ] Remove `accessToken` from `LoginResponse`
- [ ] Delete `RefreshResponse` interface
- [ ] Keep `LoginRequest` and `BenutzerInfo` unchanged

#### 3.2 Simplify AuthService and auth interceptor (atomic)
**Note:** Tasks 3.2 and 3.3 must be done together — the interceptor calls `authService.refresh()` and `authService.getAccessToken()` which are being removed.

**AuthService** (`/frontend/src/app/core/services/auth.service.ts`):
- [ ] Remove `accessToken` field and `getAccessToken()` method
- [ ] Remove `refresh()` method
- [ ] Change `initializeAuth()` to call `fetchCurrentUser()` directly (returns `Observable<BenutzerInfo | null>`, compatible with `app.config.ts` `firstValueFrom` call)
- [ ] Simplify `login()`: remove token storage from tap

#### 3.3 Simplify auth interceptor
**Auth interceptor** (`/frontend/src/app/core/interceptors/auth.interceptor.ts`):
- [ ] Remove `isRefreshing`, `refreshTokenSubject`, and all token refresh logic (including `authService.refresh()` call)
- [ ] Remove `Authorization: Bearer` header injection
- [ ] Add `withCredentials: true` to all outgoing requests (covers session cookie for all calls including `/api/auth/me`)
- [ ] On 401: redirect to `/login`, no retry
- [ ] Keep 403 handling unchanged
- [ ] Delete the `handle401Error` function entirely

#### 3.4 Update proxy config
- [ ] Modify `/frontend/proxy.conf.json`
- [ ] Remove `/api/auth`, `/api/benutzer`, `/.well-known` entries (all pointed to 8081)
- [ ] Keep single `/api` → `http://localhost:7070` rule

#### 3.5 Remove benutzer route and sidebar
- [ ] Remove benutzer route from `/frontend/src/app/app.routes.ts`
- [ ] Remove Administration section from `/frontend/src/app/layout/sidebar/sidebar.component.ts`
- [ ] Remove `faUsersCog` import

#### 3.6 Delete benutzer feature files
- [ ] Delete `/frontend/src/app/features/benutzer/` directory (routes, list, detail, form components)
- [ ] Delete `/frontend/src/app/core/services/benutzer.service.ts`
- [ ] Delete `/frontend/src/app/core/models/benutzer.model.ts` (if exists)

#### 3.7 Redesign login component
- [ ] Rewrite `/frontend/src/app/features/login/login.component.ts`
  - Define 5 UserCard objects with benutzername, passwort, displayName, rollen, color
  - `loginAs(user)` method: calls authService.login, handles returnUrl redirect
  - `loadingUser` signal for per-card loading state
  - Remove form, password toggle, demo mode logic (including `ngOnInit` `/api/auth/demo-mode` call)
- [ ] Rewrite `/frontend/src/app/features/login/login.component.html`
  - 5 clickable user cards in a grid
  - Each card: colored header stripe, display name, username, role badge, spinner when loading
  - Error message alert
  - No form, no input fields
- [ ] Update `/frontend/src/app/features/login/login.component.scss`
  - Remove form-related styles
  - Add user-card grid styles

#### 3.8 Frontend build check
- [ ] Run `cd frontend && npx ng build`

### Phase 4: Scripts and Documentation

#### 4.1 Update start.sh
- [ ] Remove CIAM startup, wait, health check
- [ ] Remove `--restart-ciam` flag
- [ ] Evaluate `--reset-db` flag (keep if serves CRM DB)
- [ ] Start backend + frontend only

#### 4.2 Evaluate stop.sh
- [ ] Remove or simplify `stop.sh` (remove CIAM management)

#### 4.3 Update CLAUDE.md
- [ ] Remove all CIAM references
- [ ] Update Build & Run section
- [ ] Update architecture description
- [ ] Remove CIAM compile check command

### Phase 5: Automated E2E Tests (Playwright MCP)

#### 5.1 Start services
- [ ] Start backend: `cd backend && mvn spring-boot:run` (background)
- [ ] Start frontend: `cd frontend && npx ng serve --port 7200 --proxy-config proxy.conf.json` (background)
- [ ] Wait for both services to be ready

#### 5.2 Test all 5 user logins
For each user (admin, vertrieb, personal, allrounder, demo):
- [ ] Navigate to `http://localhost:7200/login`
- [ ] Verify 5 user cards are visible on the login page
- [ ] Click the user's card
- [ ] Verify redirect to `/dashboard`
- [ ] Verify correct sidebar items visible for the user's role:
  - **admin/demo (ADMIN):** All sections including Gehälter, Verträge, Chancen, Auswertungen
  - **vertrieb (VERTRIEB):** Verträge, Chancen visible. Gehälter NOT visible
  - **personal (PERSONAL):** Gehälter visible. Verträge, Chancen NOT visible
  - **allrounder (VERTRIEB+PERSONAL):** Gehälter, Verträge, Chancen all visible
- [ ] Verify logout works: click logout, verify redirect to login page

#### 5.3 Test access control
- [ ] Log in as `vertrieb`, navigate to `/gehaelter` directly, verify access denied / redirect
- [ ] Log in as `personal`, navigate to `/vertraege` directly, verify access denied / redirect

#### 5.4 Test session persistence
- [ ] Log in as `admin`
- [ ] Refresh the browser page
- [ ] Verify user is still logged in (not redirected to login)

#### 5.5 Test negative cases
- [ ] Verify `/benutzer` route does not exist in sidebar
- [ ] Verify no "Administration" section in sidebar for any user

#### 5.6 Stop services
- [ ] Stop frontend and backend processes

## Verification
- [ ] `cd backend && mvn clean compile` passes
- [ ] `cd frontend && npx ng build` passes
- [ ] All Playwright E2E tests pass
