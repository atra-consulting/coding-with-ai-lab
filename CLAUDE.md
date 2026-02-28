# CLAUDE.md

## Project

Full-stack CRM application. Spring Boot 3.5.3 (Java 21) backend, Angular 20 frontend. German domain model: Firma, Person, Abteilung, Adresse, Gehalt, Aktivitaet, Vertrag, Chance. H2 file-based database.

## Build & Run

```bash
./start.sh                                        # Full stack (backend:8080 + frontend:4200)
cd backend && mvn spring-boot:run                  # Backend only (requires Java 21)
cd frontend && npx ng serve --proxy-config proxy.conf.json  # Frontend only
cd backend && mvn clean compile                    # Backend compile check
cd frontend && npx ng build                        # Frontend build check
```

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

## Key Files

- `backend/src/main/resources/application.properties` — DB config, `open-in-view=false`
- `backend/src/main/java/com/crm/seed/DataSeeder.java` — populates 50 Firmen + related data
- `backend/src/main/java/com/crm/exception/GlobalExceptionHandler.java` — maps exceptions to HTTP responses
- `frontend/src/main.ts` — `@angular/localize/init` import
- `frontend/src/app/app.routes.ts` — all feature routes (lazy-loaded)
- `frontend/src/app/app.config.ts` — providers including HTTP interceptor
- `frontend/proxy.conf.json` — `/api/*` → `localhost:8080`
- `frontend/src/app/features/chance/chance-board/` — Kanban board component (drag & drop pipeline)
