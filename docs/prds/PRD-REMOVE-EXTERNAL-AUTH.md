# PRD: Replace CIAM with Hardcoded Authentication

**Task Key:** REMOVE-EXTERNAL-AUTH
**Date:** 2026-03-30
**Status:** Draft

---

## 1. Source

Internal request. Simplify the dev/lab environment by removing the external CIAM microservice.

---

## 2. Problem Statement

Running the app requires 3 separate processes (CIAM, backend, frontend). CIAM startup takes ~10 seconds, RSA key generation adds complexity, and the multi-service setup is too much overhead for a lab project. Replace with hardcoded logins shown directly on the login page.

---

## 3. Requirements

### 3.1 Remove CIAM Service

- Delete the `ciam/` directory entirely.
- Remove CIAM from `start.sh` and `stop.sh`.
- Remove `stop.sh` if its only purpose was managing CIAM.
- Remove the `ciam/keys/` directory and all RSA key files.

### 3.2 Backend: Replace JWT with Session-Based Auth

**Remove:**
- `JwtAuthenticationFilter`, `JwtService`, `JwtPrincipal` classes
- `jwt.public-key-path` property from `application.properties`
- JJWT Maven dependencies: `jjwt-api`, `jjwt-impl`, `jjwt-gson`

**Add:**
- `InMemoryUserDetailsService` in `SecurityConfig` with 5 hardcoded users
- Each user gets `GrantedAuthority` entries for both roles (ROLE_ prefix) and permissions (direct strings)
- Source of truth for role-permission mapping: existing CIAM `RolePermissionMapping.kt`

**Hardcoded users:**

| Username | Password | Roles | Permissions |
|---|---|---|---|
| admin | admin123 | ADMIN | All 11 permissions |
| vertrieb | test123 | VERTRIEB | DASHBOARD, FIRMEN, PERSONEN, ABTEILUNGEN, ADRESSEN, AKTIVITAETEN, VERTRAEGE, CHANCEN, AUSWERTUNGEN |
| personal | test123 | PERSONAL | DASHBOARD, FIRMEN, PERSONEN, ABTEILUNGEN, ADRESSEN, AKTIVITAETEN, GEHAELTER, AUSWERTUNGEN |
| allrounder | test123 | VERTRIEB, PERSONAL | Union of VERTRIEB + PERSONAL permissions |
| demo | demo1234 | ADMIN | All 11 permissions |

**Each user also gets a stable numeric ID** for database foreign keys:

| Username | ID |
|---|---|
| admin | 1 |
| vertrieb | 2 |
| personal | 3 |
| allrounder | 4 |
| demo | 5 |

**Session config:**
- Switch `SessionCreationPolicy.STATELESS` to `SessionCreationPolicy.IF_REQUIRED`
- Keep session fixation protection at default (migrate)
- CSRF stays disabled (lab project)
- CORS: `allowCredentials(true)` already set, keep it

**Auth endpoints (on backend, port 7070):**
- `POST /api/auth/login` — accepts JSON `{ "benutzername": "...", "passwort": "..." }`. Returns JSON `{ "benutzername", "vorname", "nachname", "rollen" }`. Creates HTTP session. No accessToken in response.
- `POST /api/auth/logout` — invalidates HTTP session. Returns 200.
- `GET /api/auth/me` — returns `{ "id", "benutzername", "vorname", "nachname", "email", "rollen", "permissions" }`. Must include `permissions` array (load-bearing for frontend guards and sidebar).
- Remove `/api/auth/refresh` — not needed with sessions.
- Remove `/api/auth/demo-mode` — superseded by card-click login.

**Fix JwtPrincipal usage in controllers:**
- `SavedReportController` and `DashboardConfigController` cast `authentication.getPrincipal()` to `JwtPrincipal`. Replace with a new `CrmPrincipal` or extract identity from `authentication.getName()` + a lookup for the numeric user ID.
- The `benutzerId` columns on `SavedReport` and `DashboardConfig` entities keep their `Long` type. The 5 hardcoded users have stable numeric IDs (see table above) so foreign keys remain valid.

**Remove Benutzer management from backend:**
- Remove `/api/benutzer/*` endpoints. No user CRUD needed.

**Keep all `@PreAuthorize` annotations unchanged.** Roles and permissions work via `GrantedAuthority`.

### 3.3 Frontend: Login Page Redesign

**New login page:**
- Show 5 clickable user cards. Each card displays: username, display name, role(s).
- Clicking a card calls `POST /api/auth/login` with the user's credentials (hardcoded in frontend).
- Per-card loading state: clicked card shows spinner, all cards disabled during login.
- Honor `returnUrl` query param after successful login (existing behavior).
- Remove the username/password form entirely.
- Remove `fillDemo()` and the `/api/auth/demo-mode` call.
- Remove `ReactiveFormsModule`, `faEye`/`faEyeSlash` imports (dead code).

**AuthService changes:**
- Remove `accessToken` field and all token storage.
- Remove `refresh()` method and `RefreshResponse` model.
- `initializeAuth()` calls `/api/auth/me` directly (no refresh step). If 401, user is not authenticated.
- `login()` sends POST, then calls `fetchCurrentUser()`. No token in response.
- `logout()` sends POST to `/api/auth/logout`. Clears currentUser signal. Navigates to login.
- Keep `hasPermission()`, `isAuthenticated`, `currentUser` signal unchanged.

**Auth interceptor changes:**
- Remove `Authorization: Bearer` header injection entirely.
- Remove `isRefreshing` flag, `refreshTokenSubject`, and token refresh logic.
- On 401: redirect to `/login`. No retry.
- Ensure `withCredentials: true` on all requests (session cookie).

**Model changes:**
- `LoginRequest`: keep `{ benutzername, passwort }` shape (matches backend contract).
- `LoginResponse`: remove `accessToken`. Keep `{ benutzername, vorname, nachname, rollen }`.
- Remove `RefreshResponse` interface.
- `BenutzerInfo`: keep `{ id, benutzername, vorname, nachname, email, rollen, permissions }` (matches `/api/auth/me` response).

**Remove Benutzer management feature:**
- Remove `/benutzer` route from `app.routes.ts`.
- Remove `BENUTZERVERWALTUNG` from sidebar items.
- Remove `BenutzerService` and benutzer feature components (list, detail, form).
- Keep `BENUTZERVERWALTUNG` in the permission list itself (no harm, may be used later).

### 3.4 Frontend Proxy Config

Final `proxy.conf.json`:
- Remove `/api/auth` entry (was routing to 8081).
- Remove `/api/benutzer` entry (was routing to 8081).
- Remove `/.well-known` entry (was routing to 8081).
- Keep `/api` entry routing to `http://localhost:7070`.
- Result: single proxy rule `/api` → `http://localhost:7070`.

### 3.5 Build and Start Scripts

- `start.sh`: remove CIAM startup, wait, health check. Start backend + frontend only.
- Remove `--restart-ciam` flag.
- Keep `--reset-db` if it serves CRM H2 DB. Remove if CIAM-only.
- `stop.sh`: remove if only purpose was CIAM management. Keep if it stops backend/frontend too.
- Update `CLAUDE.md` to reflect simplified architecture.

---

## 4. Special Instructions

- Do NOT change any `@PreAuthorize` annotations on existing controllers.
- CRM H2 database stays untouched. Only CIAM H2 database disappears.
- Add missing `@PreAuthorize` to `SavedReportController` and `DashboardConfigController` while refactoring JwtPrincipal (pre-existing gap).

---

## 5. Implementation Approach

**Phase 1 — Backend auth replacement.** Add InMemoryUserDetailsService, auth controller, /api/auth/me endpoint. Replace JwtPrincipal with new principal. Switch to session-based auth. Remove JWT classes and dependencies.

**Phase 2 — Remove CIAM.** Delete `ciam/` directory. Remove RSA keys.

**Phase 3 — Frontend changes.** Redesign login page with user cards. Simplify AuthService (remove tokens). Simplify interceptor. Remove benutzer feature. Update proxy config.

**Phase 4 — Scripts and docs.** Update `start.sh`, remove `stop.sh` if needed. Update `CLAUDE.md` and specs.

---

## 6. Test Strategy

**Manual tests:**
- Each of the 5 users can log in via their card.
- After login, correct sidebar items appear based on role.
- VERTRIEB user cannot access GEHAELTER pages (403).
- ADMIN user can access all pages.
- Logout works. Subsequent requests redirect to login.
- Browser refresh keeps user logged in (session cookie).
- Direct URL to protected route while logged out redirects to login with returnUrl.
- After login via redirect, user lands on original URL.
- SavedReport and DashboardConfig endpoints work with new principal.

**Regression tests:**
- All `@PreAuthorize`-protected endpoints enforce permissions correctly.
- Permission guard on frontend routes blocks unauthorized access.

**Negative tests:**
- Accessing `/api/benutzer/*` returns 404.
- No JWT, RSA, or CIAM references in codebase.

---

## 7. Non-Functional Requirements

| Concern | Requirement |
|---|---|
| Startup time | Under 30 seconds total. No CIAM wait. |
| Simplicity | Full auth flow understandable in under 10 minutes. |
| Compatibility | All existing features work without changes outside auth layer. |
| No external deps | No external services, no RSA key files, no separate CIAM DB. |

---

## 8. Success Criteria

- [ ] `ciam/` directory deleted.
- [ ] `start.sh` starts only backend and frontend.
- [ ] Login page shows 5 clickable user cards. No password field.
- [ ] All 5 users can log in and see role-appropriate UI.
- [ ] All `@PreAuthorize` checks pass correctly for each role.
- [ ] No JWT, RSA keys, or refresh tokens in the codebase.
- [ ] `/api/benutzer/*` endpoints return 404.
- [ ] Frontend proxy routes all `/api/*` to port 7070 only.
- [ ] `CLAUDE.md` reflects simplified architecture.
- [ ] SavedReport and DashboardConfig work with new user identity.
- [ ] Benutzer management feature removed from frontend.
