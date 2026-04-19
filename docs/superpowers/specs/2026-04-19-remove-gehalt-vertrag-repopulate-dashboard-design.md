# Design: Remove Gehalt + Vertrag, Repopulate Dashboard

**Date:** 2026-04-19
**Related PRD:** `docs/prds/PRD-REDUCE-MORE-COMPLEXITY.md` (proposals A2, A6; dashboard repopulation is new scope beyond the PRD)

## 1. Scope

Three independent but bundled changes:

1. **Remove Gehalt entity** — PRD A2
2. **Remove Vertrag entity** — PRD A6
3. **Repopulate Dashboard** — replace static "Willkommen im CRM" placeholder with KPI tiles + recent lists

**Out of scope (deferred to workshop):**

- Updates to `CLAUDE.md` domain model list
- Updates to `docs/specs/SPECS-backend.md` / `SPECS-frontend.md`
- Filling in `## Implementierung` in `PRD-REDUCE-MORE-COMPLEXITY.md`

## 2. Gehalt Removal

No FK points at `gehalt`. Pure delete.

**Backend:**

- Delete `backend/src/services/gehaltService.ts`
- Delete `backend/src/routes/gehaelter.ts`
- Remove `gehalt` table from `backend/src/db/schema/schema.ts`
- Remove `gehalt` CREATE TABLE and `idx_gehalt_personId` from `backend/src/config/migrate.ts`
- Remove `GEHALT_TYP` enum from `backend/src/db/schema/enums.ts`
- Remove `GehaltCreateSchema` from `backend/src/utils/validation.ts`
- Remove `/api/gehaelter` registration from `backend/src/index.ts`
- Seeder: drop `gehalt` from `INSERT_ORDER`; remove from fixture interface and data in `backend/src/seed/seeder.ts` and `backend/src/seed/fixture.json`

**Frontend:**

- Delete `frontend/src/app/features/gehalt/` (all subfolders)
- Delete `frontend/src/app/core/services/gehalt.service.ts`
- Delete `frontend/src/app/core/models/gehalt.model.ts`
- Remove Gehalt route from `frontend/src/app/app.routes.ts`
- Remove Gehälter nav item from `frontend/src/app/layout/sidebar/sidebar.component.ts`

## 3. Vertrag Removal

No FK points at `vertrag`. Pure delete.

**Backend:**

- Delete `backend/src/services/vertragService.ts`
- Delete `backend/src/routes/vertraege.ts`
- Remove `vertrag` table from `backend/src/db/schema/schema.ts`
- Remove `vertrag` CREATE TABLE, `idx_vertrag_firmaId`, `idx_vertrag_status` from `backend/src/config/migrate.ts`
- Remove `VERTRAG_STATUS` enum from `backend/src/db/schema/enums.ts`
- Remove `VertragCreateSchema` from `backend/src/utils/validation.ts`
- Remove `/api/vertraege` registration from `backend/src/index.ts`
- Seeder: drop `vertrag` from `INSERT_ORDER`; remove from fixture interface and data

**Frontend:**

- Delete `frontend/src/app/features/vertrag/` (all subfolders)
- Delete `frontend/src/app/core/services/vertrag.service.ts`
- Delete `frontend/src/app/core/models/vertrag.model.ts`
- Remove Vertrag route from `frontend/src/app/app.routes.ts`
- Remove Verträge nav item from sidebar
- **Sidebar consolidation:** after Vertrag removal, the "Vertrieb" sidebar section contains only Chancen. Flatten the section — render Chancen as a standalone item without a section heading (per PRD §5)

## 4. Dashboard Repopulation

### 4.1 Backend

**New endpoint:** `GET /api/dashboard`

**Auth:** login required (all 3 users have access; no permission check needed — permissions were removed in PR #40).

**Response shape:**

```ts
interface DashboardData {
  firmenCount: number;
  personenCount: number;
  offeneChancenCount: number;       // phase NOT IN ('GEWONNEN', 'VERLOREN')
  gewonneneChancenSumme: number;    // SUM(wert) WHERE phase = 'GEWONNEN', EUR
  recentChancen: RecentChance[];    // max 5, ORDER BY createdAt DESC
  recentAktivitaeten: RecentAktivitaet[]; // max 5, ORDER BY createdAt DESC
}

interface RecentChance {
  id: number;
  titel: string;
  wert: number | null;
  currency: string;
  phase: ChancePhase;
  firmaName: string;
  createdAt: string;
}

interface RecentAktivitaet {
  id: number;
  typ: AktivitaetTyp;
  subject: string;
  datum: string;
  firmaName: string | null;
  personName: string | null;
  createdAt: string;
}
```

**New files:**

- `backend/src/services/dashboardService.ts` — exports `getDashboard(): Promise<DashboardData>`. Runs 6 queries (4 aggregates + 2 recent lists joined to firma/person for display names).
- `backend/src/routes/dashboard.ts` — single GET handler, registered under `/api/dashboard` in `backend/src/index.ts`.

**Currency assumption:** `gewonneneChancenSumme` sums `wert` across all currencies as if EUR. Acceptable for a training project; flag in the PR description.

### 4.2 Frontend

**Edited:** `frontend/src/app/features/dashboard/dashboard.component.ts` (currently a 17-line placeholder).

**New files:**

- `frontend/src/app/core/services/dashboard.service.ts` — `getDashboard(): Observable<DashboardData>`
- `frontend/src/app/core/models/dashboard.model.ts` — `DashboardData` + nested interfaces

**Layout (Bootstrap 5):**

```
┌────────────────────────────────────────────────────────────┐
│ Dashboard                                                  │
├────────────────────────────────────────────────────────────┤
│ [ Firmen ] [ Personen ] [ Offene Chancen ] [ Gewonnen € ]  │
├────────────────────────────────┬───────────────────────────┤
│ Letzte Chancen                 │ Letzte Aktivitäten        │
│ (max 5, clickable rows)        │ (max 5, clickable rows)   │
└────────────────────────────────┴───────────────────────────┘
```

**Details:**

- KPI tiles: `row` with `col-md-6 col-lg-3` (1 col on xs, 2 cols on md, 4 cols on lg+). Each tile = Bootstrap `card` with a small label and a large number.
- List cards: `row` with `col-md-6` (stacks on mobile). Each card uses `list-group list-group-flush`.
- Row click → `routerLink` to `/chancen/:id` / `/aktivitaeten/:id`.
- Currency: Angular `CurrencyPipe` with `EUR`, locale `de-DE`.
- Dates: `DatePipe` with `dd.MM.yyyy`.
- Empty state text: "Noch keine Chancen" / "Noch keine Aktivitäten".
- Loading state: "Lade…" while the single HTTP request resolves.

## 5. Test Strategy

1. **Frontend build check:** `cd frontend && npx ng build` → zero errors.
2. **Backend start check:** `cd backend && npx tsx src/index.ts` → no errors.
3. **Reset DB:** `./start.sh --reset-db` → seeds without FK violations.
4. **Dashboard endpoint:** `curl -b <cookie> http://localhost:7070/api/dashboard` → valid JSON matching `DashboardData` shape.
5. **Manual golden path:** login as admin/admin123 → Dashboard renders all 4 tiles + two lists → click a Chance row → navigates to detail.
6. **Dead-reference grep:** `grep -ri "gehalt\|vertrag" backend/src frontend/src` → zero matches.
7. **Sidebar nav:** Gehälter / Verträge items gone; Chancen is a flat sidebar item, not nested under "Vertrieb".

## 6. Success Criteria

- All 7 test steps above pass.
- Login + Firma CRUD still works.
- Dashboard displays live data that reflects the seeded fixture.
- Dashboard is the default post-login landing page (unchanged from current routing).
