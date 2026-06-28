# Implementation Plan: PRODUCTIVITY-CALCULATOR

Spec: `docs/prds/PRD-PRODUCTIVITY-CALCULATOR.md`

## Test Command

- Backend: `cd backend && npx playwright test`
- Frontend: `cd frontend && npx ng test` (CI: `npx ng test --configuration=ci`)
- Build check: `cd frontend && npx ng build`

## Model (corrected)

Each process has **N steps**, each with an **Arbeitszeit** (work). Between consecutive steps there is a **Wartezeit** (wait): **N−1** of them. No wait before step 1 or after the last step. Total cycle time = sum(works) + sum(waits). Stored per process as JSON `{ "works": number[N], "waits": number[N-1] }` in integer minutes.

Step counts: Menschlich 23 (waits 22), Halbautomatisch 6 (waits 5), Vollautomatisch 2 (waits 1).

## Shared default durations (minutes)

Used identically by the backend seed (`szenarioSeed.ts`) and the frontend default constant (`prozess-defaults.ts`).

**Menschlich**
- `works` (23): `[0,60,30,60,30,15,240,30,60,60,30,15,120,15,120,20,30,30,20,15,60,30,30]`
- `waits` (22): `[240,480,240,1440,2880,0,480,480,480,240,480,1440,480,240,480,480,240,240,480,1440,1440,480]`

**Halbautomatisch**
- `works` (6): `[0,5,15,10,30,20]`
- `waits` (5): `[240,480,0,480,0]`

**Vollautomatisch**
- `works` (2): `[0,20]`
- `waits` (1): `[240]`

---

## Tasks

### 1. Database

- [ ] `backend/src/db/schema/schema.ts` — add `export const szenario = sqliteTable('szenario', {...})` after the `ticketComment` block. Columns: `id: integer('id').primaryKey({autoIncrement:true})`; `name: text('name').notNull().unique()` (the explicit `.unique()` keeps Drizzle in sync with the DDL `UNIQUE`); `humanSteps`/`semiAutomatedSteps`/`automatedSteps` text notNull; `createdAt`/`updatedAt` text notNull default `(datetime('now'))`. (CHECK constraints live only in migrate.ts — Drizzle sqlite-core has no declarative CHECK.)
- [ ] `backend/src/config/migrate.ts` — in the first `client.executeMultiple(...)` block (after `cron_run`) append `CREATE TABLE IF NOT EXISTS szenario (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL UNIQUE, humanSteps TEXT NOT NULL CHECK (json_valid(humanSteps)), semiAutomatedSteps TEXT NOT NULL CHECK (json_valid(semiAutomatedSteps)), automatedSteps TEXT NOT NULL CHECK (json_valid(automatedSteps)), createdAt TEXT NOT NULL DEFAULT (datetime('now')), updatedAt TEXT NOT NULL DEFAULT (datetime('now')))`.
- [ ] `backend/src/config/migrate.ts` — in the index `executeMultiple(...)` block append `CREATE INDEX IF NOT EXISTS idx_szenario_createdAt ON szenario(createdAt DESC);`.
- [ ] `backend/src/config/migrate.ts` — add `import { seedSzenario } from '../seed/szenarioSeed.js'` and call `await seedSzenario();` right after `await seedTickets();`.
- [ ] `backend/src/seed/szenarioSeed.ts` — new file, following the `agentTaskSeed.ts` style. Single row, so use `await client.execute({ sql, args })` (NOT `client.batch` — that's for the multi-row task seed): `INSERT OR IGNORE INTO szenario (id, name, humanSteps, semiAutomatedSteps, automatedSteps, createdAt, updatedAt) VALUES (1, 'Standard-Szenario', @humanSteps, @semiAutomatedSteps, @automatedSteps, @createdAt, @updatedAt)`. Values = `JSON.stringify({works, waits})` per process using the shared defaults above; both timestamps a fixed ISO string. Export `async function seedSzenario(): Promise<void>`; log `=== Seeder: szenario ensured (1 row, INSERT OR IGNORE) ===`. Note: the DDL `CHECK(json_valid(...))` only verifies JSON syntax — array lengths/structure are enforced by `prozessSchema` (Zod), not the DB.

### 2. Backend API

- [ ] `backend/src/utils/validation.ts` — add `export const PROCESS_STEP_COUNTS = { human: 23, semiAutomated: 6, automated: 2 } as const`.
- [ ] `backend/src/utils/validation.ts` — add `DurationSchema = z.number().int('Muss eine ganze Zahl sein').min(0, 'Darf nicht negativ sein').max(479520, 'Maximal 999 Tage')` and a helper `prozessSchema(workCount)` returning `z.object({ works: z.array(DurationSchema).length(workCount, \`Genau ${workCount} Arbeitszeiten\`), waits: z.array(DurationSchema).length(workCount - 1, \`Genau ${workCount-1} Wartezeiten\`) })`.
- [ ] `backend/src/utils/validation.ts` — add `SzenarioSchema = z.object({ name: z.string().min(1, 'Name ist erforderlich'), humanSteps: prozessSchema(23), semiAutomatedSteps: prozessSchema(6), automatedSteps: prozessSchema(2) })` and export the inferred DTO type. Reuse this ONE schema for both POST and PUT (the `chancen.ts` route reuses `ChanceCreateSchema` for create + update — follow that; do not create a separate identical update schema that can drift).
- [ ] `backend/src/services/szenarioService.ts` — new file. `SzenarioDTO` (works/waits arrays typed `number[]`), internal `SzenarioRow` (JSON columns as `string`), `toDTO(row)` JSON-parsing each column. Methods: `list()` (`SELECT * ... ORDER BY createdAt DESC`), `findById(id)` (throw `NotFoundError` if absent), `create(dto)` (`now = new Date().toISOString()` for both timestamps; `JSON.stringify` each `{works,waits}`; catch UNIQUE → `ConflictError('Ein Szenario mit diesem Namen existiert bereits')`), `update(id, dto)` (findById first; explicit `updatedAt`; catch UNIQUE → ConflictError), `delete(id)` (findById first; then DELETE). Import `ConflictError` (status 409) and `NotFoundError` directly from `utils/errors.ts` — both already exist.
- [ ] `backend/src/routes/szenario.ts` — new file. `Router`; all routes `requireAuth` + `asyncHandler`. `GET /` → list; `GET /:id` → findById; `POST /` → `validate(SzenarioSchema, req.body)` then create, 201; `PUT /:id` → `validate(SzenarioSchema, ...)` then update; `DELETE /:id` → delete, 204. Parse id via `parseInt(req.params['id'],10)`.
- [ ] `backend/src/app.ts` — add `import szenarienRouter from './routes/szenario.js'` with the other router imports, and `app.use('/api/szenarien', szenarienRouter)` after `cronRouter` and immediately before the final `app.use(errorHandler)` line.
- [ ] Verify: `cd backend && npx tsc --noEmit` clean.

### 3. Frontend — models, service, utils

- [ ] `frontend/src/app/core/models/szenario.model.ts` — `ProzessDauer { works: number[]; waits: number[] }`; `Szenario { id, name, humanSteps: ProzessDauer, semiAutomatedSteps: ProzessDauer, automatedSteps: ProzessDauer, createdAt, updatedAt }`; `SzenarioCreate` (name + three `ProzessDauer`); `type SzenarioUpdate = SzenarioCreate` (alias — same payload; `chance.model.ts` has only Chance+ChanceCreate, so no separate update interface).
- [ ] `frontend/src/app/core/models/prozess-defaults.ts` — `PROZESS_STEP_LABELS` (three German string arrays, verbatim from PRD: 23 / 6 / 2); `DEFAULT_DURATIONS: { menschlich: ProzessDauer; halbautomatisch: ProzessDauer; vollautomatisch: ProzessDauer }` using the shared default arrays above. Export a `PROZESSE` descriptor (key, German title, step labels, step count) so the component renders the three processes by iteration.
- [ ] `frontend/src/app/core/services/szenario.service.ts` — `@Injectable({providedIn:'root'})`, `inject(HttpClient)`, `baseUrl='/api/szenarien'`. `list()`, `getById(id)`, `create(dto)` POST, `update(id,dto)` PUT, `delete(id)` DELETE. Mirror `chance.service.ts`.
- [ ] `frontend/src/app/features/produktivitaet/einheit.ts` — `ZeitEinheit = 'Minuten'|'Stunden'|'Tage'`, `ZEITEINHEITEN`, `einheitZuFaktor(u)` → 1/60/480, `feldWertZuMinuten(value, unit)`. Feature-local util (there is no `shared/utils/` dir — `shared/` has only `components/` and `pipes/`; do NOT invent a new shared subtree). Export for reuse + tests.
- [ ] `frontend/src/app/shared/pipes/dauer.pipe.ts` — pure `@Pipe({name:'dauer'})` + exported `minutenZuDauer(min): string` implementing D6 (1d=480, 1h=60; drop leading zero units; `0`→`'0m'`; `1440`→`'3d'`, `90`→`'1h 30m'`, `510`→`'1d 30m'`). Follow `shared/pipes/currency.pipe.ts`.

### 4. Frontend — RechnerComponent (logic)

- [ ] `frontend/src/app/features/produktivitaet/produktivitaet.routes.ts` — `export const PRODUKTIVITAET_ROUTES: Routes = [{ path: 'rechner', component: RechnerComponent }]`.
- [ ] `frontend/src/app/app.routes.ts` — inside the guarded `children` block add `{ path: 'produktivitaet', loadChildren: () => import('./features/produktivitaet/produktivitaet.routes').then(m => m.PRODUKTIVITAET_ROUTES) }`. No second `canActivate`.
- [ ] `frontend/src/app/layout/sidebar/sidebar.component.ts` — import `faCalculator`; add a new `NavSection { title: 'Produktivität', items: [{ label: 'Rechner', route: '/produktivitaet/rechner', icon: faCalculator }] }` in the `sections` array, placed AFTER the Chancen/Aktivitäten section and BEFORE the Administration section. No `requiredRole`.
- [ ] `rechner.component.ts` — build form: root `FormGroup` with, per process, a `works` `FormArray` (N groups `{ value, unit }`) and a `waits` `FormArray` (N−1 groups `{ value, unit }`). Each value control `[Validators.required, Validators.min(0), Validators.max(479520)]`, unit default `'Minuten'`. Initialise from `DEFAULT_DURATIONS`.
- [ ] `rechner.component.ts` — live calc: subscribe `form.valueChanges.pipe(debounceTime(150), takeUntilDestroyed())` (import `takeUntilDestroyed` from `@angular/core/rxjs-interop`, inject in field initializer or pass `DestroyRef`) → `berechne()`: per process sum `works[i].value*faktor + waits[j].value*faktor`; set totals signals + `maxTotal`. Run once after build. Must unsubscribe on destroy (no leaked subscription).
- [ ] `rechner.component.ts` — expose an `SvgSnapshot` (signal/computed): per process `{ works: number[], waits: number[] (minutes), total }` + `maxTotal`. Template SVG reads only the snapshot, never the form.
- [ ] `rechner.component.ts` — tabs via `NgbNavModule` (as in `firma-detail`): three tabs Menschlich (23) / Halbautomatisch (6) / Vollautomatisch (2), below the visualization area; switching tabs must not reset values. `@for` over step/gap arrays with `track $index`.
- [ ] `rechner.component.ts` — scenario state signals: `szenarien`, `geladenSzenario`, `scenarioLoading`, `scenarioError`; inject `SzenarioService`, `NgbModal`, `NotificationService`. `ladeSzenarien()` in `ngOnInit`. `ladeScenario(s)` patches all FormArrays + sets `geladenSzenario`. `neuSpeichern()` (create; normalise to minutes via `feldWertZuMinuten`; on 400 `fieldErrors.name` show German inline error). `aktualisieren()` (update by id). `alsNeuSpeichern()` (create with new name). `loeschen(s)` via `NgbModal.open(ConfirmDialogComponent)` then set `componentInstance.title`, `.message`, `.confirmText` (plain public fields, German — not `@Input()`s, not browser `confirm()`); on confirm call delete, remove from list; if deleted id === loaded id → `geladenSzenario.set(null)`; do NOT clear inputs. All calls toggle `scenarioLoading` and disable their button.

### 5. Frontend — Visualization & Styling (UI)

- [ ] Pure coord fns (own file, e.g. `features/produktivitaet/svg-util.ts`): `computeSegments(works, waits, width)` → ordered segments `work(0), wait(0), work(1), wait(1), …, work(N-1)` (starts & ends with work; N work + N−1 wait), each `{x, width, type, index}`, proportional to process total; `computeComparisonBars(totals, width)` → largest total maps to full width, others proportional, all-zero → zero widths. Exported for unit tests.
- [ ] `rechner.component.html` — page `.page-header` + `<h2>Rechner</h2>`; visualization `.card` ABOVE the inputs `.card` at all widths.
- [ ] Comparison bar: one `<svg width="100%">` fluid `viewBox`, three stacked bars (Menschlich/Halbautomatisch/Vollautomatisch) on shared scale; `<text>` process name + D6 total per bar; grey track `#dedede`. `role="img"` + `<title>` "Prozessvergleich" + `<desc>` listing totals.
- [ ] Per-process bars: one `<svg width="100%">` each, `preserveAspectRatio="none"`, alternating `<rect>` segments from `computeSegments`. Arbeitszeit fill `$primary #264892` solid; Wartezeit fill `url(#hatch-wait)` (45° hatch, `#dc421e`) AND color — distinguishable in greyscale (REQ-VIS-004). When a segment is wide enough (≥24 viewBox units) overlay white `<text>` "A"/"W". D6 total `<text>` above each bar at a consistent `y`.
- [ ] A11y: each `<svg>` `role="img"` + `<title>`(name+total) + `<desc>`. Each work `<rect>` `tabindex="0" role="button"` + `aria-label` (step label + work, and the following wait, in D6); wait rects `aria-hidden="true"`. Visible focus outline on `:focus-visible`. A persistent detail panel below each bar shows the focused/clicked step's label + Arbeitszeit + following Wartezeit (not hover-only; touch + keyboard).
- [ ] Inputs: number `<input type="number" class="form-control">` ~80px + `<select class="form-select">` (Minuten/Stunden/Tage) auto width, in a `d-flex align-items-center gap-2` row. Render a work field per step; render a wait field in the gap between steps (N−1). Inline German validation error per invalid field linked via `aria-describedby`. Save/Update buttons `[disabled]="form.invalid || scenarioLoading()"`.
- [ ] Loaded-scenario indicator above scenario controls: `@if (geladenSzenario()) {…name…} @else {'Kein Szenario geladen'}`. Scenario list with `@for`, empty state "Keine Szenarien gespeichert", `<app-loading-spinner>` while `scenarioLoading()`.
- [ ] Styling in an inline `styles: [...]` block in `rechner.component.ts` (ticket-board precedent). Inline `styles` is plain CSS — SCSS `$primary`/`$danger`/`$light` variables are NOT available there; use the hex literals `#264892` / `#dc421e` / `#dedede` (or `var(--bs-*)`) directly. `overflow-x: hidden` on the viz card; verify no horizontal scroll at 320px.

### 6. Test Implementation

**Backend (Playwright, `backend/src/test/`)**
- [ ] CRUD happy path: POST create → 201 + body; GET list finds it **by id** (the seeded "Standard-Szenario" already exists, so do not assume an empty list); GET /:id returns it; PUT update changes it; DELETE → 204; subsequent GET /:id → 404.
- [ ] Auth: szenario endpoints (only `requireAuth`, no `requireRole`) without a session → 401. (`requireRole` would be 403 — not used here.)
- [ ] Validation: missing name → 400 + `fieldErrors.name`; wrong `works` length → 400 with key `humanSteps.works` (the dot-joined Zod path for the array, not an element); wrong `waits` length → 400 (`humanSteps.waits`); negative or >479520 duration → 400; duplicate name → **409** with message.
- [ ] Persistence: created scenario survives a re-fetch; assert the round-tripped `humanSteps.works` is exactly the 23-element array sent (element-count assertion, not just presence).

**Frontend (Jasmine, colocated)**
- [ ] `minutenZuDauer`: `1440`→`'3d'`, `90`→`'1h 30m'`, `510`→`'1d 30m'`, `30`→`'30m'`, `0`→`'0m'`.
- [ ] `einheit`: `feldWertZuMinuten(2,'Tage')`→960; `(1,'Stunden')`→60; `(5,'Minuten')`→5.
- [ ] `computeSegments`: known works/waits → first & last segment are `work`; counts N work + N−1 wait; widths proportional and sum to full width.
- [ ] `computeComparisonBars`: largest total → full width; ratios correct; all-zero → zero widths.
- [ ] RechnerComponent: totals = sum(works)+sum(waits); step-1 work 0 valid; negative invalid → save disabled. SzenarioService specs: list/get/create/update/delete hit correct URLs + methods (HttpTestingController).

### 7. Verification

- [ ] `cd backend && npx tsc --noEmit` clean; backend Playwright suite green.
- [ ] `cd frontend && npx ng build` clean; frontend Karma suite green.
- [ ] Manual smoke: `/produktivitaet/rechner` loads, shows seeded "Standard-Szenario" numbers, tabs switch, edits update all SVGs live, save/load/delete work, sidebar item visible for a normal user.
