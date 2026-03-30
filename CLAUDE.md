# CLAUDE.md

## Project

Full-stack CRM application. Spring Boot 4.0.3 (Java 21) backend, Angular 21 frontend. German domain model: Firma, Person, Abteilung, Adresse, Gehalt, Aktivitaet, Vertrag, Chance. H2 file-based database. Authentication via hardcoded in-memory users with session-based auth (5 users: admin, vertrieb, personal, allrounder, demo).

## Build & Run

```bash
./start.sh                                        # Full stack (backend:7070 + frontend:7200)
./start.sh --reset-db                             # Delete H2 database (recreated on startup)
cd backend && mvn spring-boot:run                  # Backend only
cd frontend && npx ng serve --port 7200 --proxy-config proxy.conf.json  # Frontend only
cd backend && mvn clean compile                    # Backend compile check
cd frontend && npx ng build                        # Frontend build check
```

**Hot reload during development:**
- **Backend:** DevTools auto-restarts on recompile. Change Java code → run `cd backend && mvn compile` (or use IDE auto-build) → backend restarts automatically.
- **Frontend:** Angular `ng serve` watches for file changes and reloads the browser automatically.

## Coding Conventions

### Backend

- **`open-in-view=false`**: All service methods touching lazy collections must use `@Transactional(readOnly = true)`.
- **H2 quirk**: Aggregate `@Query` returning `Object[]` yields `Double` not `BigDecimal`. Cast via `BigDecimal.valueOf(((Number) val).doubleValue())`.
- **Sort parsing**: Sort arrives as `String[]`, parsed with `Sort.by(Direction.fromString(sort[1]), sort[0])`.
- **Authorization**: Every controller MUST have `@PreAuthorize` — see specs for permission/role patterns.

### Frontend

- **Angular 21 standalone components** — no NgModules, no `standalone: true` (it's the default). Use `imports: [...]` in `@Component`.
- **DI**: `private service = inject(Service)`, not constructor injection.
- **Control flow**: `@if`/`@for`/`@switch` blocks only, never `*ngIf`/`*ngFor`. `@for` requires `track`.
- **Pagination**: NgbPagination is 1-indexed, Spring Data is 0-indexed. Convert with `this.currentPage - 1` in service calls.

## Adding a New Entity

Backend (7 files): Entity → DTO + CreateDTO → Mapper → Repository → Service → Controller at `/api/<plural>`. **Controller must have `@PreAuthorize`** — either `hasAuthority('PERMISSION')` or `hasAnyRole(...)`.

Frontend (8+ files): Model interface → Service → Route file → List/Detail/Form components → register in `app.routes.ts` **with `canActivate: [permissionGuard('PERMISSION')]`** + add `permission: 'PERMISSION'` to sidebar item.

**Adding a new permission**: Add the permission string to the user's `GrantedAuthority` list in `SecurityConfig.java` → use `hasAuthority('NAME')` on controller → add `permissionGuard('NAME')` on frontend route + `permission: 'NAME'` on sidebar item.

## Commits & PRDs

- **Commit → PRD**: Wenn ein Commit eine PRD implementiert, Footer-Zeile in der Commit-Message: `PRD: docs/prds/<name>.md`
- **PRD → Commits**: Jede PRD enthält eine `## Implementierung`-Section mit Links zu den zugehörigen Commits und PRs.
- Beim Committen immer prüfen: Gibt es eine PRD unter `docs/prds/`, die zu dieser Änderung gehört? Falls ja, beides verknüpfen.

## Agents

| Agent | Purpose | Type |
|-------|---------|------|
| admin | Local dev environment, H2 databases, process management | ops |
| ba-reviewer | Review PRDs, specs, plans for gaps and issues | review |
| ba-writer | Create business specs, requirements, plans | writing |
| be-coder | Spring Boot / Java backend code | coding |
| be-reviewer | Review backend code, security, patterns | review |
| db-coder | JPA queries, entity schemas, data access | coding |
| db-reviewer | Review queries, JPA mappings, performance | review |
| fe-coder | Angular 21 frontend code, components, services | coding |
| fe-reviewer | Review frontend code, patterns, accessibility | review |
| md-reader | Read, search, summarize Markdown documentation | utility |
| ui-designer | UI/UX design, layout, styling, accessibility | coding |
| ui-reviewer | Critical UI evaluation, usability, WCAG audit | review |
| tester | Web app testing, bug finding, edge cases | testing |

Agent files: `.claude/agents/`

## Specifications

Full system specs: [`docs/specs/SPECS.md`](docs/specs/SPECS.md) — root document linking to per-area specs (backend, frontend, infrastructure).
