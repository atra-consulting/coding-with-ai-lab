# Implementation Plan: REMOVE-GEHALT-VERTRAG-DASHBOARD

**Spec:** `docs/superpowers/specs/2026-04-19-remove-gehalt-vertrag-repopulate-dashboard-design.md`
**Branch:** `remove-gehalt-vertrag-dashboard` (off `reduce-more-complexity`)

## Test Command

Primary: `cd frontend && npx ng build`
Secondary (smoke):
- Backend start: `./start.sh --reset-db` (auto-migrates + seeds)
- API check: `curl -b cookies.txt http://localhost:7070/api/dashboard`
- Dead-ref grep: `grep -ri "gehalt\|vertrag" backend/src frontend/src`

No unit test suite exists (no `*.spec.ts` files under `backend/src`). Verification = build + smoke.

## Tasks

### 1. Backend — Remove Gehalt

- [ ] Delete `backend/src/services/gehaltService.ts`
- [ ] Delete `backend/src/routes/gehaelter.ts`
- [ ] Remove `gehalt` export from `backend/src/db/schema/schema.ts`
- [ ] Remove `CREATE TABLE gehalt` + `idx_gehalt_personId` from `backend/src/config/migrate.ts`
- [ ] Remove `GEHALT_TYP` export from `backend/src/db/schema/enums.ts`
- [ ] Remove `GehaltCreateSchema` + `GehaltCreateDTO` + `GEHALT_TYP` import from `backend/src/utils/validation.ts`
- [ ] Remove `gehaelterRouter` import + `app.use('/api/gehaelter', …)` from `backend/src/app.ts` (spec says index.ts — actual location is app.ts)
- [ ] Seeder (`backend/src/seed/seeder.ts`): drop `gehalt` from `INSERT_SQL`, `INSERT_ORDER`, `Fixture` interface, and the final `console.log`
- [ ] Fixture (`backend/src/seed/fixture.json`): remove `gehalt` array

### 2. Backend — Remove Vertrag

- [ ] Delete `backend/src/services/vertragService.ts`
- [ ] Delete `backend/src/routes/vertraege.ts`
- [ ] Remove `vertrag` export from `backend/src/db/schema/schema.ts`
- [ ] Remove `CREATE TABLE vertrag` + `idx_vertrag_firmaId` + `idx_vertrag_status` from `backend/src/config/migrate.ts`
- [ ] Remove `VERTRAG_STATUS` export from `backend/src/db/schema/enums.ts`
- [ ] Remove `VertragCreateSchema` + `VertragCreateDTO` + `VERTRAG_STATUS` import from `backend/src/utils/validation.ts`
- [ ] Remove `vertraegeRouter` import + `app.use('/api/vertraege', …)` from `backend/src/app.ts`
- [ ] Seeder: drop `vertrag` from `INSERT_SQL`, `INSERT_ORDER`, `Fixture` interface, and the final `console.log`
- [ ] Fixture: remove `vertrag` array

### 3. Frontend — Remove Gehalt

- [ ] Delete `frontend/src/app/features/gehalt/` (gehalt-form, gehalt-list, gehalt.routes.ts)
- [ ] Delete `frontend/src/app/core/services/gehalt.service.ts` (if present)
- [ ] Delete `frontend/src/app/core/models/gehalt.model.ts` (if present)
- [ ] Remove `gehaelter` route entry from `frontend/src/app/app.routes.ts`
- [ ] Remove `faMoneyBillWave` import + entire "Personal" section from `frontend/src/app/layout/sidebar/sidebar.component.ts`

### 4. Frontend — Remove Vertrag + Flatten "Vertrieb"

- [ ] Delete `frontend/src/app/features/vertrag/` (vertrag-detail, vertrag-form, vertrag-list, vertrag.routes.ts)
- [ ] Delete `frontend/src/app/core/services/vertrag.service.ts` (if present)
- [ ] Delete `frontend/src/app/core/models/vertrag.model.ts` (if present)
- [ ] Remove `vertraege` route entry from `frontend/src/app/app.routes.ts`
- [ ] Remove `faFileContract` import + "Verträge" nav item from sidebar
- [ ] **Sidebar flatten (per PRD §5):** "Vertrieb" section after Vertrag removal still contains Chancen and Aktivitäten. PRD §5 says "flatten — render Chancen as a standalone item without a section heading". Interpret as: move Chancen out of the section, drop the "Vertrieb" title, move Aktivitäten into "Kunden & Kontakte" OR make both flat items. Decision: drop the "Vertrieb" section entirely; insert two new flat entries right after "Kunden & Kontakte" using a section with empty title, OR add a top-level flat-items block. Simplest: rename "Vertrieb" → empty title and let the sidebar render items without a header (requires template tweak: `@if (section.title && !layoutService.collapsed())`)

### 5. Backend — Dashboard Endpoint

- [ ] Create `backend/src/services/dashboardService.ts`:
  - Exports `getDashboard(): Promise<DashboardData>`
  - Query 1: `SELECT COUNT(*) FROM firma` → `firmenCount`
  - Query 2: `SELECT COUNT(*) FROM person` → `personenCount`
  - Query 3: `SELECT COUNT(*) FROM chance WHERE phase NOT IN ('GEWONNEN','VERLOREN')` → `offeneChancenCount`
  - Query 4: `SELECT COALESCE(SUM(wert),0) FROM chance WHERE phase='GEWONNEN'` → `gewonneneChancenSumme`
  - Query 5: `SELECT c.id, c.titel, c.wert, c.currency, c.phase, f.name AS firmaName, c.createdAt FROM chance c JOIN firma f ON f.id=c.firmaId ORDER BY c.createdAt DESC LIMIT 5`
  - Query 6: `SELECT a.id, a.typ, a.subject, a.datum, f.name AS firmaName, (p.firstName || ' ' || p.lastName) AS personName, a.createdAt FROM aktivitaet a LEFT JOIN firma f ON f.id=a.firmaId LEFT JOIN person p ON p.id=a.personId ORDER BY a.createdAt DESC LIMIT 5`
  - Use `sqlite.prepare(...).all()` / `.get()` from `config/db.ts`
- [ ] Create `backend/src/routes/dashboard.ts`:
  - `import { Router } from 'express'`
  - `requireAuth` only (no permission check — permissions were removed in PR #40 per spec)
  - `router.get('/', async (req, res, next) => { try { res.json(await getDashboard()); } catch (e) { next(e); } })`
- [ ] Register in `backend/src/app.ts`: `app.use('/api/dashboard', dashboardRouter)`

### 6. Frontend — Dashboard Repopulation

- [ ] Create `frontend/src/app/core/models/dashboard.model.ts` with `DashboardData`, `RecentChance`, `RecentAktivitaet`, `ChancePhase`, `AktivitaetTyp` interfaces/types (reuse existing enum types if available)
- [ ] Create `frontend/src/app/core/services/dashboard.service.ts`:
  - `@Injectable({ providedIn: 'root' })`
  - `getDashboard(): Observable<DashboardData>` → `GET /api/dashboard`
- [ ] Rewrite `frontend/src/app/features/dashboard/dashboard.component.ts`:
  - Use external template (`.html`) + styles (`.css`) for maintainability OR inline template if concise
  - Imports: `CommonModule`, `CurrencyPipe`, `DatePipe`, `RouterLink`, `FaIconComponent`
  - `loading = signal(true)`, `data = signal<DashboardData | null>(null)`, `error = signal<string | null>(null)`
  - `ngOnInit` → call service, populate signals
  - Layout: page-header, KPI row (`col-md-6 col-lg-3` x 4), list row (`col-md-6` x 2)
  - KPI tile: `card` with small muted label + display-6 number
  - List card: `card` with `card-header` title + `list-group list-group-flush`
  - Row `routerLink` → `/chancen/:id` / `/aktivitaeten/:id`
  - Currency pipe: `{{ val | currency:'EUR':'symbol':'1.0-0':'de-DE' }}`
  - Date pipe: `{{ val | date:'dd.MM.yyyy' }}`
  - Empty state: "Noch keine Chancen" / "Noch keine Aktivitäten"
  - Loading state: "Lade…"
  - `de-DE` locale: ensure `registerLocaleData` is active in the app (check `main.ts` / `app.config.ts` — if not, the `date` pipe param `'dd.MM.yyyy'` works without locale; `currency` pipe with locale param requires registration → use locale param only if registered, else omit)

### 7. Verification

- [ ] `cd frontend && npx ng build` → zero errors
- [ ] Delete `backend/data/crmdb.sqlite`, run `./start.sh` → backend seeds without FK errors; frontend serves
- [ ] `curl` `/api/auth/login` then `/api/dashboard` → valid JSON matching shape
- [ ] Manual browser check: login → Dashboard renders 4 tiles + 2 lists → click a Chance row → detail loads
- [ ] `grep -ri "gehalt\|vertrag" backend/src frontend/src` → zero matches (case-insensitive)
- [ ] Sidebar: no "Gehälter", no "Verträge", no "Vertrieb"/"Personal" headings; Chancen + Aktivitäten visible as flat items

## Tests

### Build Checks
- [ ] Frontend `ng build` compiles clean
- [ ] Backend `tsx src/index.ts` starts; hits `/api/health` 200

### Integration Smoke
- [ ] Fresh DB seeds without FK errors
- [ ] `/api/dashboard` returns correct counts matching seeded fixture
- [ ] Login cookies work across requests

### Regression
- [ ] Firma list, create, edit, delete still works
- [ ] Person CRUD works
- [ ] Chance CRUD works (detail routing works for dashboard row-click)
- [ ] Aktivitaet CRUD works

### Edge Cases
- [ ] Dashboard with 0 Chancen → shows "Noch keine Chancen"
- [ ] Dashboard with 0 Aktivitaeten → shows "Noch keine Aktivitäten"
- [ ] `gewonneneChancenSumme = 0` when no GEWONNEN chance → formats as "0 €"
- [ ] Aktivitaet with both firma and person → shows both names; with only one → shows only one; with neither → empty cell
- [ ] No dead references remain: grep returns zero matches
