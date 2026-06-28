# PRD: Produktivität → Rechner (Productivity Calculator)

## Source

Workshop training need. The CRM app demonstrates AI-assisted development. We need a concrete tool that shows the cycle-time difference between pure-human, fully-automated, and semi-automated software delivery. This calculator makes the contrast visible and measurable.

Freeform request by the user, plus the two autonomous-agent prompts it references (`process-next-task.md` = fully-automated, `process-next-ticket.md` = semi-automated).

---

## Problem Statement

Trainers and students want to compare three software delivery processes side by side. Today there is no tool in the app to do this. The gap forces trainers to use slides or spreadsheets — static, not interactive. Students cannot tweak assumptions and see the impact immediately.

---

## Solution

A new "Produktivität → Rechner" section in the Angular frontend. Users enter per-step durations (work time + wait time) for three processes. The app computes total cycle time for each and renders SVG visualizations on the fly. Users save named scenarios to the backend and reload them later.

---

## Users

All logged-in users. No admin role required.

---

## The Three Processes

### Prozess 1: Menschlich (Human Process)

23 steps. Every step has a work time (Arbeitszeit) and a wait time (Wartezeit).

| # | German step label |
|---|-------------------|
| 1 | Auslöser: Anfrage oder Fehler |
| 2 | BA analysiert die Situation |
| 3 | BA bespricht mit Entwickler |
| 4 | BA schreibt Ticket |
| 5 | Team bespricht Ticket im Refinement; Ticket → „Bereit" |
| 6 | Entwickler A übernimmt Ticket, startet Arbeit |
| 7 | Entwickler A beendet Arbeit, testet |
| 8 | Entwickler A erstellt PR, setzt Ticket auf „In Review" |
| 9 | Entwickler B reviewt PR, hat Kommentare |
| 10 | Entwickler A bearbeitet Kommentare, bittet um Re-Review |
| 11 | Entwickler B genehmigt PR |
| 12 | Entwickler A setzt Ticket auf „Abnahmetest" |
| 13 | Tester testet, fordert Änderungen, setzt Ticket zurück |
| 14 | Entwickler A übernimmt Ticket erneut, startet Arbeit |
| 15 | Entwickler A beendet Arbeit, testet |
| 16 | Entwickler A aktualisiert PR, setzt Ticket auf „In Review" |
| 17 | Entwickler B reviewt PR erneut, hat Kommentare |
| 18 | Entwickler A bearbeitet Kommentare, bittet um Re-Review |
| 19 | Entwickler B genehmigt PR erneut |
| 20 | Entwickler A setzt Ticket auf „Abnahmetest" |
| 21 | Tester bestätigt, setzt Ticket auf „Bereit für Deployment" |
| 22 | Release wird gebaut |
| 23 | Release wird in Produktion deployed |

### Prozess 2: Halbautomatisch (Semi-Automated)

6 steps. AI can ask the human questions.

| # | German step label |
|---|-------------------|
| 1 | Auslöser: Anfrage oder Fehler |
| 2 | KI schreibt Ticket, weist Mensch zu |
| 3 | Mensch weist Ticket an KI zur Umsetzung |
| 4 | KI analysiert, beginnt Code, braucht Input, weist Mensch zu |
| 5 | Mensch beantwortet Fragen, weist Ticket an KI |
| 6 | KI analysiert Antwort, schreibt Code, testet, deployed |

### Prozess 3: Vollautomatisch (Fully-Automated)

2 steps.

| # | German step label |
|---|-------------------|
| 1 | Auslöser: Anfrage oder Fehler |
| 2 | KI schreibt Ticket, Code, Tests und deployed |

**Display order:** Menschlich, Halbautomatisch, Vollautomatisch (longest to shortest — shows the contrast top to bottom).

---

## Decisions (confirmed with the user — do NOT re-open)

- **D1 — Per-step work, between-step waits.** Each step has an Arbeitszeit (work time). Between two consecutive steps there is a Wartezeit (wait time) — time passes during the handoff. N steps → N work values + **(N−1)** wait values. There is **no** Wartezeit before the first step or after the last step. Total cycle time = sum of all Arbeitszeiten + sum of all Wartezeiten. (Clarified by the user after the first draft.)
- **D2 — German UI.** All labels, buttons, validation, step text in German.
- **D3 — Backend persistence.** Named scenarios saved to the backend (CRUD). Calculation and SVG stay client-side.
- **D4 — Placement.** New sidebar section "Produktivität" with item "Rechner" at `/produktivitaet/rechner`, for all logged-in users (`authGuard`).
- **D5 — Time unit & storage.** Store every duration as an integer in **minutes**. Input = a number field + a unit dropdown (Minuten / Stunden / Tage). Normalise to minutes before the HTTP call. Day = 8-hour workday = 480 min; Hour = 60 min.
- **D6 — Display format.** "Xd Yh Zm" using the 8-hour workday. Drop leading zero units; always keep at least one unit. `0` → `"0m"`. Examples: `1440` → `"3d"`, `90` → `"1h 30m"`, `30` → `"30m"`, `510` → `"1d 30m"`. Days are work-days.
- **D7 — Scenario ownership.** Scenarios are global / shared across all logged-in users (the app has 3 hardcoded users). Any user can create, load, update, delete any scenario.
- **D8 — Seed scenario.** Seed one "Standard-Szenario" (fixed id 1, `INSERT OR IGNORE`) from `runMigrations()` so the page shows numbers on first load. Deleting it is allowed; it reappears on the next startup (acceptable — it is a demo default, not user data).
- **D9 — Storage shape.** Per-process durations stored as JSON text columns, one per process. Each column holds `{ "works": number[N], "waits": number[N-1] }` in minutes. Lengths fixed: works 23 / 6 / 2, waits 22 / 5 / 1. No child table.
- **D10 — SVG scale.** Two visualizations: (a) a **comparison bar** with a shared scale across all three totals (dramatic contrast), and (b) **per-process bars** that each fill their container width to show internal work/wait composition.
- **D11 — Input layout.** Visualizations always on top. Step inputs below in **tabs**, one per process.

---

## Requirements

### Visualization

**[REQ-VIS-001]** Each process renders as SVG generated on the fly in the browser. No page reload.
Acceptance: All visualizations appear and update live.

**[REQ-VIS-002] Comparison bar (shared scale).** One stacked/grouped bar area shows the three process totals on a single shared scale. The longest process sets the scale; shorter ones render proportionally (may be small).
Acceptance: Bar lengths are proportional to each process's total minutes against the largest total. Numeric total (D6 format) shown next to each bar.

**[REQ-VIS-003] Per-process bars.** Each process renders its own horizontal step-flow bar that fills the available container width. Segments alternate: Arbeitszeit (step 1), Wartezeit (gap 1→2), Arbeitszeit (step 2), … ending on the last step's Arbeitszeit. The bar **starts and ends with a work segment** — no leading or trailing wait segment. Segment width is proportional to its share of that process's total.
Acceptance: Within one process, segment widths sum to the full bar width; first and last segments are Arbeitszeit; there are N work segments and N−1 wait segments.

**[REQ-VIS-004] Work vs wait must not rely on color alone (WCAG 1.4.1).** Arbeitszeit and Wartezeit segments differ by BOTH fill color AND a second cue: a fill pattern/hatch, or an inline "A"/"W" text marker when the segment is wide enough.
Acceptance: Distinguishable in greyscale.

**[REQ-VIS-005] SVG accessibility (WCAG 1.1.1).** Each `<svg>` has `role="img"` and a `<title>` (process name + total) plus a `<desc>` summary. Step segments that expose detail are keyboard-focusable with a visible focus outline (WCAG 2.1.1, 2.4.7).
Acceptance: Screen reader announces process name and total; segments reachable by keyboard.

**[REQ-VIS-006] Step detail is reachable without hover (WCAG 2.5.3, touch).** Step label + work/wait durations show via a visible label OR a tap/click/focus-triggered panel — never hover-only.
Acceptance: On touch and by keyboard, every step's label and durations are reachable.

**[REQ-VIS-007]** Each per-process bar shows its total cycle time (D6 format) in a consistent position (above the bar).
Acceptance: Total equals the sum of that process's step work + wait times.

### Per-Step Time Input

**[REQ-INP-001]** Each step has one editable Arbeitszeit field (number + unit dropdown Minuten / Stunden / Tage, per D5). Each gap between two consecutive steps has one editable Wartezeit field (number + unit). So a process with N steps has N Arbeitszeit fields and N−1 Wartezeit fields.
Acceptance: All work and wait values contribute to cycle time. Number fields are compact (≈80px); dropdown auto width.

**[REQ-INP-002]** Step 1 ("Auslöser") may have Arbeitszeit = 0. There is no Wartezeit before step 1 and none after the last step (D1).
Acceptance: Work = 0 on step 1 is valid; no validation error. The UI shows no wait input before step 1 or after the last step.

**[REQ-INP-003]** Unit conversion: Minuten = ×1, Stunden = ×60, Tage = ×480 (8h workday). Normalise to minutes before saving.
Acceptance: "2 Tage" → 960 min; "1 Stunde" → 60 min.

**[REQ-INP-004]** Validation: each value is an integer ≥ 0 and ≤ 999 Tage (479 520 min). Non-numeric or out-of-range blocks save. Messages in German.
Acceptance: Save disabled until all inputs valid; inline German error per affected field, linked via `aria-describedby`.

**[REQ-INP-005] Tabs (D11).** Inputs grouped in three tabs: Menschlich (23), Halbautomatisch (6), Vollautomatisch (2). Visualizations stay visible above the tabs and update as the user edits any tab.
Acceptance: Switching tabs does not reset values; edits in any tab update all visualizations.

### Cycle-Time Calculation

**[REQ-CALC-001]** Total cycle time for a process = sum of all steps' (Arbeitszeit + Wartezeit) in minutes. Recalculates live on any input change (no submit). Recalculation is debounced or signal-batched to stay smooth with ~93 controls.
Acceptance: Totals and SVGs update within ~200 ms of an edit; no visible jank on the 23-step process.

**[REQ-CALC-002]** Totals display in the D6 human-readable format throughout the page.
Acceptance: Format consistent everywhere.

### Scenario Persistence

**[REQ-SCN-001] Create vs update are distinct, clear actions.** When no scenario is loaded, the user enters a name and clicks "Neu speichern" (create). When a scenario is loaded, the user clicks "Aktualisieren" (update the loaded scenario by id) or "Als neu speichern" with a new name.
Acceptance: A visible indicator shows the currently loaded scenario name (or "Kein Szenario geladen"). Creating with a name that already exists returns a German field error (name must be unique).

**[REQ-SCN-002]** Users list all saved scenarios and load one. Loading replaces all current inputs.
Acceptance: List appears; selecting a scenario populates all step fields and sets the loaded-scenario indicator. Empty list shows a German empty-state message.

**[REQ-SCN-003]** Users delete a scenario via the shared `ConfirmDialogComponent` (German text). After delete: if the deleted scenario was loaded, the indicator resets to "Kein Szenario geladen"; current inputs are not cleared.
Acceptance: Deleted scenario disappears from the list; no browser `confirm()`.

**[REQ-SCN-004]** Scenario data persists in the backend DB. Calculation and SVG never call the backend.
Acceptance: Scenarios survive a backend restart; no backend call fires on input change.

**[REQ-SCN-005]** Save / load / delete show a loading state (existing `LoadingSpinnerComponent`) and disable the triggering control while the call is in flight.
Acceptance: No duplicate submits on a slow network.

### Navigation and Access

**[REQ-NAV-001]** New sidebar `NavSection` "Produktivität" with one `NavItem` "Rechner" (FontAwesome `faCalculator`). Visible to all logged-in users.
Acceptance: No `requiredRole`; item appears for every logged-in user.

**[REQ-NAV-002]** Route `/produktivitaet/rechner`, registered inside the existing guarded `children` block in `app.routes.ts` via `loadChildren` → `PRODUKTIVITAET_ROUTES`. No redundant second guard (inherited from parent).
Acceptance: Direct URL works; unauthenticated users redirect to login.

---

## Special Instructions

**ASK ME IF YOU'RE NOT SURE!** All open decisions above were confirmed with the user (D1–D11). If a NEW product decision surfaces during the plan or build, stop and ask — do not assume.

---

## Implementation Approach

High level only. Detail goes in the plan.

**Backend**
- New `szenario` table — Drizzle schema in `db/schema/schema.ts` + raw DDL in `config/migrate.ts` (inside the existing `executeMultiple` block). Columns: `id INTEGER PRIMARY KEY AUTOINCREMENT`, `name TEXT NOT NULL UNIQUE`, `humanSteps TEXT NOT NULL`, `semiAutomatedSteps TEXT NOT NULL`, `automatedSteps TEXT NOT NULL`, `createdAt TEXT NOT NULL`, `updatedAt TEXT NOT NULL`. Add `CHECK (json_valid(...))` on each JSON column and `CREATE INDEX idx_szenario_createdAt`.
- Each JSON column = `{ "works": number[], "waits": number[] }` — `works` length 23 / 6 / 2, `waits` length 22 / 5 / 1 (waits sit between steps; see D1/D9).
- `szenarioService.ts` — list, getById, create, update, delete. Async `@libsql/client`. Sets `updatedAt = new Date().toISOString()` explicitly on create and update. Serialises the works/waits objects to JSON strings.
- `routes/szenario.ts` — mounted at `/api/szenarien` in `app.ts` (before `errorHandler`), guarded by `requireAuth`. Handlers wrapped in `asyncHandler`. Errors use the standard `{ status, message, timestamp, fieldErrors }` shape.
- Zod schemas `SzenarioCreateSchema` / `SzenarioUpdateSchema` in `utils/validation.ts`: validate name (non-empty, unique enforced via DB), and each process object `{ works, waits }` — `works` exact length (23/6/2), `waits` exact length (22/5/1), every entry int 0..479520. Define a `PROCESS_STEP_COUNTS` constant (works count) from which the waits count (count−1) derives.
- Seed `szenarioSeed.ts` (`INSERT OR IGNORE`, fixed id 1) called from `runMigrations()` after the ticket seed.

**Frontend**
- Feature folder `frontend/src/app/features/produktivitaet/`: `produktivitaet.routes.ts` (exports `PRODUKTIVITAET_ROUTES`), `rechner.component.ts/.html` (page: visualizations + tabbed inputs + scenario controls). Optionally extract `process-bar` and `comparison-bar` presentational components and a `process-input-tab` — design choice for the plan.
- `szenario.service.ts` in `core/services/`, `szenario.model.ts` in `core/models/` (match existing entity convention).
- Reactive form: root `FormGroup` with three `FormArray`s (`menschlich`, `halbautomatisch`, `vollautomatisch`); each element `FormGroup({ workValue, workUnit, waitValue, waitUnit })`. Recalc via `valueChanges` (debounced) or Angular signals/`computed` into a snapshot the SVG reads. `@for` over step arrays uses `track $index`.
- SVG generated inline via Angular bindings; a pure function converts the duration snapshot to coordinates. No external SVG library.
- Sidebar: add `faCalculator` import + new `NavSection` in `layout/sidebar/sidebar.component.ts`.
- Default step labels (German, above) and default durations (below) live as a frontend constant so the page renders before any scenario loads.

**Default durations (seed + frontend default)**
- First step ("Auslöser"): Arbeitszeit 0 in every process. No Wartezeit before it.
- The first Wartezeit (gap step 1→2) carries the initial reaction delay (~240 min).
- Human steps: small work (15–240 min), larger waits between steps (240 min–several days) to show queue dominance.
- The exact default `works[]` / `waits[]` arrays are fixed in the plan; the frontend default constant and the backend seed use the identical values.

---

## Test Strategy

**Backend (Playwright API tests)**
- CRUD: create, list, getById, update, delete `/api/szenarien`.
- Auth: unauthenticated → 401.
- Validation: missing name → 400 with `fieldErrors`; wrong array length → 400; negative/over-max duration → 400; duplicate name → 400/409.
- Persistence: created scenario survives a re-fetch.

**Frontend (Jasmine/Karma unit tests)**
- Total cycle time = correct sum across all steps.
- Unit converter: "2 Tage" → 960 min; display 1440 → "3d", 90 → "1h 30m", 30 → "30m", 0 → "0m".
- SVG: known durations → correct proportional widths (per-process) and comparison-bar ratios.
- Validation: step-1 work 0 valid; negative invalid; over-max invalid.
- Scenario service: list / get / create / update / delete call correct URLs and methods.

---

## Non-Functional Requirements

- Calculation client-side only; no backend call on input change.
- SVG render < 1 s for any valid input set; recalculation smooth (debounced/batched).
- All UI text in German.
- Backend `@libsql/client` async throughout; durations stored as integer minutes; parameterised SQL; Zod validation.
- Route and service follow existing patterns (`asyncHandler`, mounted in `app.ts`, validation in `utils/validation.ts`).
- WCAG: non-color cue for work/wait, SVG `role="img"`+`<title>`/`<desc>`, keyboard-focusable detail, German error text linked via `aria-describedby`.

---

## Success Criteria

- "Produktivität → Rechner" appears in the sidebar for all logged-in users.
- All three processes render: a shared-scale comparison bar plus per-process bars with correct German step labels and proportional, color-plus-pattern segments.
- Total cycle time updates live on any input change.
- Users can create, load, update, and delete named scenarios; data survives backend restart.
- Work/wait distinguishable in greyscale; SVG has text alternatives; step detail reachable by keyboard and touch.
- All UI text in German.
- Backend Playwright tests pass (CRUD, auth, validation). Frontend Jasmine tests pass (calc, conversion, SVG, service). `ng build` clean.

---

## Implementierung

_Links to implementing commits and PRs will be added here after implementation._
