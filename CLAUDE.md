# CLAUDE.md

## Project

Full-stack CRM application with separate CIAM microservice. Spring Boot 4.0.3 (Java 21) backend, CIAM service in Kotlin (Spring Boot 4.0.3), Angular 21 frontend. German domain model: Firma, Person, Abteilung, Adresse, Gehalt, Aktivitaet, Vertrag, Chance. H2 file-based databases (separate DBs for CRM and CIAM).

## Build & Run

```bash
./start.sh                                        # Full stack (CIAM:8081 + backend:7070 + frontend:7200)
./start.sh --restart-ciam                         # Force restart CIAM (normally stays running)
./start.sh --reset-db                             # Delete DBs + restart CIAM (recreated on startup)
cd ciam && mvn spring-boot:run                     # CIAM only (must start first, generates RSA keys)
cd backend && mvn spring-boot:run                  # Backend only (needs CIAM's public key)
cd frontend && npx ng serve --port 7200 --proxy-config proxy.conf.json  # Frontend only
cd ciam && mvn clean compile                       # CIAM compile check
cd backend && mvn clean compile                    # Backend compile check
cd frontend && npx ng build                        # Frontend build check
```

**CIAM persistence:** CIAM stays running after Ctrl+C. Next `./start.sh` reuses it (skips ~10s startup). Use `--restart-ciam` to force restart.

**Hot reload during development:**
- **Backend:** DevTools auto-restarts on recompile. Change Java code → run `cd backend && mvn compile` (or use IDE auto-build) → backend restarts automatically.
- **Frontend:** Angular `ng serve` watches for file changes and reloads the browser automatically.
- **CIAM:** No DevTools. Restart manually with `./start.sh --restart-ciam` if needed.

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

Backend (7 files): Entity → DTO + CreateDTO → Mapper → Repository → Service → Controller at `/api/<plural>`. **Controller must have `@PreAuthorize`** — either `hasAuthority('PERMISSION')` (add permission to CIAM `Permission.kt` + `RolePermissionMapping.kt`) or `hasAnyRole(...)`.

Frontend (8+ files): Model interface → Service → Route file → List/Detail/Form components → register in `app.routes.ts` **with `canActivate: [permissionGuard('PERMISSION')]`** + add `permission: 'PERMISSION'` to sidebar item.

**Adding a new permission**: Add to `Permission.kt` enum → assign to roles in `RolePermissionMapping.kt` (ADMIN gets all via `allOf` automatically) → use `hasAuthority('NAME')` on controller → add `permissionGuard('NAME')` on frontend route + `permission: 'NAME'` on sidebar item.

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
| be-coder | Spring Boot / Java backend code (+ CIAM Kotlin) | coding |
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

Full system specs: [`docs/specs/SPECS.md`](docs/specs/SPECS.md) — root document linking to per-area specs (CIAM, backend, frontend, infrastructure).
