# CLAUDE.md

## Project

Full-stack CRM application with separate CIAM microservice. Spring Boot 3.5.3 (Java 21) backend + CIAM service, Angular 20 frontend. German domain model: Firma, Person, Abteilung, Adresse, Gehalt, Aktivitaet, Vertrag, Chance. H2 file-based databases (separate DBs for CRM and CIAM).

## Build & Run

```bash
./start.sh                                        # Full stack (CIAM:8081 + backend:8080 + frontend:4200)
cd ciam && mvn spring-boot:run                     # CIAM only (must start first, generates RSA keys)
cd backend && mvn spring-boot:run                  # Backend only (needs CIAM's public key)
cd frontend && npx ng serve --proxy-config proxy.conf.json  # Frontend only
cd ciam && mvn clean compile                       # CIAM compile check
cd backend && mvn clean compile                    # Backend compile check
cd frontend && npx ng build                        # Frontend build check
```

## CIAM Service

Separate microservice under `/ciam` for Identity & Access Management (Port 8081).

- **Responsibilities**: Login, JWT issuance (RS256), user management, JWKS endpoint.
- **JWT Signing**: RSA-2048 asymmetric. CIAM signs with private key, CRM validates with public key.
- **Token Claims**: `sub` (username), `benutzerId`, `rollen`, `permissions`, `vorname`, `nachname`.
- **Key Pair**: Auto-generated on first start at `ciam/keys/`. Public key shared with CRM via filesystem.
- **JWKS**: `GET /.well-known/jwks.json` exposes public key in JWK format.
- **Own H2 DB**: `ciam/data/ciamdb` — stores Benutzer + RefreshToken tables.
- **Seed Users**: 5 users (admin, vertrieb, personal, allrounder, demo) — same as before.

## CRM Backend (Resource Server)

The CRM backend at `/backend` (Port 8080) is a pure resource server.

- **No Auth Endpoints**: All `/api/auth/**` and `/api/benutzer` requests go to CIAM via frontend proxy.
- **JWT Validation Only**: Reads RSA public key from `../ciam/keys/public.pem` (configurable via `jwt.public-key-path`).
- **JwtPrincipal**: Record `(benutzerId, benutzername, vorname, nachname)` replaces `BenutzerDetails` as auth principal.
- **Claims-based Auth**: Roles/permissions read from JWT claims, no DB lookup. `@PreAuthorize("hasRole('ADMIN')")` works via `ROLE_` authorities from claims.
- **User-scoped Entities**: `DashboardConfig` and `SavedReport` use `Long benutzerId` (no JPA FK to Benutzer).

## Backend Patterns

Each entity follows: Entity → `*DTO` + `*CreateDTO` (Java records) → `*Mapper` → `*Repository` → `*Service` → `*Controller`.

- **`open-in-view=false`**: All service methods touching lazy collections must use `@Transactional(readOnly = true)`.
- **Mapper variants**: Simple (`FirmaMapper.toEntity(dto)`), Single-FK (`AbteilungMapper.toEntity(dto, firma)`), Dual-FK (`ChanceMapper.toEntity(dto, firma, person)`) — service resolves FK entities before passing to mapper.
- **H2 quirk**: Aggregate `@Query` returning `Object[]` yields `Double` not `BigDecimal`. Cast via `BigDecimal.valueOf(((Number) val).doubleValue())`.
- **Controllers**: Pagination via `page`/`size`/`sort` query params. Sort arrives as `String[]`, parsed with `Sort.by(Direction.fromString(sort[1]), sort[0])`.
- **Board endpoints** (Chance): `GET /api/chancen/phase/{phase}` (paginated by phase), `GET /api/chancen/board/summary` (aggregates per phase), `PATCH /api/chancen/{id}/phase` (phase update). Extra DTOs: `PhaseUpdateDTO`, `BoardSummaryDTO`.

## Frontend Patterns

- **Angular 20 standalone components** — no NgModules, no `standalone: true` (it's the default). Use `imports: [...]` in `@Component`.
- **DI**: `private service = inject(Service)`, not constructor injection.
- **Control flow**: `@if`/`@for`/`@switch` blocks only, never `*ngIf`/`*ngFor`. `@for` requires `track`.
- **Forms**: `ReactiveFormsModule` with `FormBuilder`. Edit mode via route param `id`, populate with `patchValue()`.
- **Pagination**: NgbPagination is 1-indexed, Spring Data is 0-indexed. Convert with `this.currentPage - 1` in service calls.
- **`@angular/localize/init`** must be imported in `main.ts` — required by NgbPagination.
- **Models**: Separate `Firma` (response) and `FirmaCreate` (input) interfaces in `core/models/`.
- **Services**: One per entity in `core/services/`, wrapping HttpClient calls to `/api/<plural>`.
- **Features**: `features/<entity>/` with `<entity>.routes.ts` (lazy-loaded from `app.routes.ts`), list/detail/form components.
- **Errors**: `apiErrorInterceptor` catches HTTP errors → `NotificationService` shows toasts.
- **Modals**: `NgbModal` with `ConfirmDialogComponent` for delete confirmations.
- **Styling**: Bootstrap 5 + SCSS.
- **Kanban Board**: `@angular/cdk` drag-drop for board views. Board component at `features/chance/chance-board/`. Optimistic drag updates with rollback on error. Columns paginiert via "Mehr laden". Liste/Board toggle via `btn-group` in page header.

## Adding a New Entity

Backend (7 files): Entity → DTO + CreateDTO → Mapper → Repository → Service → Controller at `/api/<plural>`.

Frontend (8+ files): Model interface → Service → Route file → List/Detail/Form components → register in `app.routes.ts`.

## Commits & PRDs

- **Commit → PRD**: Wenn ein Commit eine PRD implementiert, Footer-Zeile in der Commit-Message: `PRD: docs/prds/<name>.md`
- **PRD → Commits**: Jede PRD enthält eine `## Implementierung`-Section mit Links zu den zugehörigen Commits und PRs.
- Beim Committen immer prüfen: Gibt es eine PRD unter `docs/prds/`, die zu dieser Änderung gehört? Falls ja, beides verknüpfen.

## Key Files

- `ciam/src/main/resources/application.properties` — CIAM config, Port 8081, RSA key paths
- `ciam/src/main/java/com/crm/ciam/config/KeyPairConfig.java` — RSA key pair generation/loading
- `ciam/src/main/java/com/crm/ciam/security/JwtService.java` — RS256 JWT signing + validation
- `ciam/src/main/java/com/crm/ciam/seed/UserSeeder.java` — seeds 5 users on first start
- `backend/src/main/resources/application.properties` — DB config, `open-in-view=false`, `jwt.public-key-path`
- `backend/src/main/java/com/crm/security/JwtService.java` — RSA public key JWT validation only
- `backend/src/main/java/com/crm/security/JwtAuthenticationFilter.java` — claims-based auth filter
- `backend/src/main/java/com/crm/security/JwtPrincipal.java` — authentication principal record
- `backend/src/main/java/com/crm/seed/DataSeeder.java` — populates Firmen + related data (no users)
- `backend/src/main/java/com/crm/exception/GlobalExceptionHandler.java` — maps exceptions to HTTP responses
- `frontend/src/main.ts` — `@angular/localize/init` import
- `frontend/src/app/app.routes.ts` — all feature routes (lazy-loaded)
- `frontend/src/app/app.config.ts` — providers including HTTP interceptor
- `frontend/proxy.conf.json` — routes auth to CIAM:8081, rest to CRM:8080
- `frontend/src/app/features/chance/chance-board/` — Kanban board component (drag & drop pipeline)
