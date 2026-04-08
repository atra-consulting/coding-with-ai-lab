# Implementation Plan: REDUCE-APP-COMPLEXITY

## Goal

Simplify the CRM application for workshop use. Less code = fewer tokens burned when AI assistants read the codebase.

## Current State

~10,200 lines across 131 TypeScript files. 8 CRUD entities, report builder, Kanban board, configurable dashboard, feedback survey, 4 user roles with 11 permissions.

## Test Command
```bash
cd backend && npx playwright test
```

## Tasks

### Phase 1: Remove Report Builder & Auswertungen (~1,500 lines)

The report builder is the single largest component (658 lines) and pulls in pipeline dashboard, report widget, and multiple backend services.

- [ ] 1.1 Backend: Delete `src/routes/auswertungen.ts`, `src/routes/savedReports.ts`
- [ ] 1.2 Backend: Delete `src/services/auswertungService.ts`, `src/services/reportService.ts`, `src/services/savedReportService.ts`
- [ ] 1.3 Backend: Remove `savedReport` table from `db/schema/schema.ts` and `config/migrate.ts`
- [ ] 1.4 Backend: Remove route registrations from `app.ts`
- [ ] 1.5 Backend: Remove `REPORT_DIMENSION` and `REPORT_METRIK` from `db/schema/enums.ts`
- [ ] 1.6 Frontend: Delete `features/auswertung/` directory (report-builder, pipeline-dashboard, report-widget, routes)
- [ ] 1.7 Frontend: Delete `services/report.service.ts`, `services/saved-report.service.ts`
- [ ] 1.8 Frontend: Delete report-related model files
- [ ] 1.9 Frontend: Remove auswertung route from `app.routes.ts`
- [ ] 1.10 Frontend: Remove "Auswertungen" sidebar entry
- [ ] 1.11 Remove `AUSWERTUNGEN` permission from all users in `config/users.ts`
- [ ] 1.12 Run tests, fix any broken references
- [ ] 1.13 Commit: `refactor: Remove report builder and Auswertungen. REDUCE-APP-COMPLEXITY`

### Phase 2: Remove Dashboard Widgets & Config (~500 lines)

Replace the configurable widget dashboard with a simple static stats page.

- [ ] 2.1 Backend: Delete `src/routes/dashboard.ts`, `src/routes/dashboardConfig.ts`
- [ ] 2.2 Backend: Delete `src/services/dashboardService.ts`, `src/services/dashboardConfigService.ts`
- [ ] 2.3 Backend: Remove `dashboardConfig` table from `db/schema/schema.ts` and `config/migrate.ts`
- [ ] 2.4 Backend: Remove route registrations from `app.ts`
- [ ] 2.5 Frontend: Delete individual widget components (stats-overview, recent-activities, top-companies, salary-statistics, feedback-cta)
- [ ] 2.6 Frontend: Delete `services/dashboard.service.ts`, `services/dashboard-config.service.ts`
- [ ] 2.7 Frontend: Delete dashboard model/config files
- [ ] 2.8 Frontend: Simplify `dashboard.component.ts` to a static welcome/overview page (no API calls)
- [ ] 2.9 Frontend: Remove dashboard route guards if they referenced removed permissions
- [ ] 2.10 Run tests, fix any broken references
- [ ] 2.11 Commit: `refactor: Replace widget dashboard with static page. REDUCE-APP-COMPLEXITY`

### Phase 3: Remove Feedback Survey (~300 lines)

Workshop feedback form that posts to Google Sheets. Not part of the CRM domain.

- [ ] 3.1 Frontend: Delete `features/feedback/` directory (feedback-form, feedback-qr, thankyou)
- [ ] 3.2 Frontend: Remove feedback routes from `app.routes.ts`
- [ ] 3.3 Frontend: Remove "Feedback" sidebar entry (if present)
- [ ] 3.4 Run tests, fix any broken references
- [ ] 3.5 Commit: `refactor: Remove feedback survey. REDUCE-APP-COMPLEXITY`

### Phase 4: Remove Kanban Board (~250 lines)

Keep Chance as a standard CRUD entity, remove the drag-drop board view.

- [ ] 4.1 Backend: Remove board summary endpoint and service methods from `chanceService.ts` and `routes/chancen.ts`
- [ ] 4.2 Frontend: Delete `chance-board` component
- [ ] 4.3 Frontend: Remove board route from chance routes file
- [ ] 4.4 Frontend: Remove board navigation link (tab/button) from chance-list if present
- [ ] 4.5 Run tests, fix any broken references
- [ ] 4.6 Commit: `refactor: Remove Kanban board, keep Chance as CRUD. REDUCE-APP-COMPLEXITY`

### Phase 5: Simplify Auth to 2 Roles (~200 lines)

Reduce from 4 roles (ADMIN, VERTRIEB, PERSONAL, ALLROUNDER) + 11 permissions to 2 roles (ADMIN, USER) with all permissions.

- [ ] 5.1 Backend: Rewrite `config/users.ts` — keep 3 users: admin, user, demo. All get the same permissions.
- [ ] 5.2 Backend: Replace all `requirePermission(...)` calls with `requireAuth()` in route files
- [ ] 5.3 Backend: Simplify `middleware/auth.ts` — remove `requirePermission` and `requireRole` if no longer needed
- [ ] 5.4 Frontend: Remove `permissionGuard` from all routes in `app.routes.ts`
- [ ] 5.5 Frontend: Remove `permission` property from sidebar items
- [ ] 5.6 Frontend: Simplify `auth.service.ts` — remove permission-checking logic
- [ ] 5.7 Frontend: Remove or simplify `permission.guard.ts`
- [ ] 5.8 Run tests, fix any broken references
- [ ] 5.9 Commit: `refactor: Simplify auth to 2 roles, all permissions. REDUCE-APP-COMPLEXITY`

### Phase 6 (Optional): Drop Gehalt Entity (~400 lines)

Gehalt (salary) is standalone — removing it doesn't break other entities.

- [ ] 6.1 Backend: Delete `src/routes/gehaelter.ts`, `src/services/gehaltService.ts`
- [ ] 6.2 Backend: Remove `gehalt` table from `db/schema/schema.ts` and `config/migrate.ts`
- [ ] 6.3 Backend: Remove route registration from `app.ts`
- [ ] 6.4 Backend: Remove `GEHALT_TYP` from `db/schema/enums.ts`
- [ ] 6.5 Frontend: Delete `features/gehalt/` directory
- [ ] 6.6 Frontend: Delete `services/gehalt.service.ts` and gehalt model files
- [ ] 6.7 Frontend: Remove gehalt route from `app.routes.ts`
- [ ] 6.8 Frontend: Remove "Gehaelter" sidebar entry
- [ ] 6.9 Remove seed data for Gehalt
- [ ] 6.10 Run tests, fix any broken references
- [ ] 6.11 Commit: `refactor: Remove Gehalt entity. REDUCE-APP-COMPLEXITY`

### Phase 7 (Optional): Drop Aktivitaet Entity (~400 lines)

Aktivitaet (activity log) is also standalone.

- [ ] 7.1 Backend: Delete `src/routes/aktivitaeten.ts`, `src/services/aktivitaetService.ts`
- [ ] 7.2 Backend: Remove `aktivitaet` table from `db/schema/schema.ts` and `config/migrate.ts`
- [ ] 7.3 Backend: Remove route registration from `app.ts`
- [ ] 7.4 Backend: Remove `AKTIVITAET_TYP` from `db/schema/enums.ts`
- [ ] 7.5 Frontend: Delete `features/aktivitaet/` directory
- [ ] 7.6 Frontend: Delete `services/aktivitaet.service.ts` and aktivitaet model files
- [ ] 7.7 Frontend: Remove aktivitaet route from `app.routes.ts`
- [ ] 7.8 Frontend: Remove "Aktivitaeten" sidebar entry
- [ ] 7.9 Remove seed data for Aktivitaet
- [ ] 7.10 Run tests, fix any broken references
- [ ] 7.11 Commit: `refactor: Remove Aktivitaet entity. REDUCE-APP-COMPLEXITY`

## Expected Savings

| Phase | Lines removed | Cumulative |
|-------|-------------|------------|
| 1 — Report Builder | ~1,500 | ~1,500 |
| 2 — Dashboard Widgets | ~500 | ~2,000 |
| 3 — Feedback Survey | ~300 | ~2,300 |
| 4 — Kanban Board | ~250 | ~2,550 |
| 5 — Simplify Auth | ~200 | ~2,750 |
| 6 — Drop Gehalt | ~400 | ~3,150 |
| 7 — Drop Aktivitaet | ~400 | ~3,550 |

Phases 1-5 reduce the app by ~27% while keeping all 8 CRUD entities.
Phases 1-7 reduce the app by ~35% with 6 entities remaining.

## What Stays

- 6-8 CRUD entities with list/form/detail views
- Session-based authentication with login page
- Pagination, sorting, search
- Entity relationships (Firma → Person → Adresse, etc.)
- Express + Drizzle ORM + SQLite backend
- Angular 21 standalone components frontend
