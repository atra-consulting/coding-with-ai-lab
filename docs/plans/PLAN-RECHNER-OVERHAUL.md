# Implementation Plan: RECHNER-OVERHAUL

Overhaul the productivity calculator at `/produktivitaet/rechner`: 4 processes (rename + restructure), 4 tabs, pie charts, flowchart view, unit conversion, full-stack persistence of a new 4th process.

Authoritative spec: [`docs/prds/PRD-RECHNER-OVERHAUL.md`](../prds/PRD-RECHNER-OVERHAUL.md). This plan implements it; the PRD's R1a tables are the source of truth for every number.

## Test Command

- Backend: `cd backend && npm test` (Playwright API tests)
- Frontend: `cd frontend && npm run test:ci` (headless Karma/Jasmine)

## Canonical default durations (minutes) — single source of truth

Used identically in `szenarioSeed.ts` (backend) and `prozess-defaults.ts` (frontend). Stored values are always **integer minutes**.

- **Agile mit Menschen** (`humanSteps`, 19 steps)
  - works: `[0,60,30,60,30,15,240,30,60,60,30,15,120,15,120,20,20,15,60]`
  - waits: `[120,120,120,960,480,0,30,120,120,120,30,240,60,0,30,240,30,60]`
  - total 3,880 (work 1,000 + wait 2,880)
- **Agile mit KI** (`agileKiSteps`, 19 steps)
  - works: `[0,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5]`
  - waits: same as Agile mit Menschen
  - total 2,970 (work 90 + wait 2,880)
- **KI-Prozess mit Feedback** (`semiAutomatedSteps`, 7 steps)
  - works: `[0,5,15,15,10,30,20]`
  - waits: `[5,60,60,5,60,5]`
  - total 290 (work 95 + wait 195)
- **KI-Prozess vollautomatisch** (`automatedSteps`, 2 steps)
  - works: `[0,20]`
  - waits: `[5]`  ← changed from `[240]`; total 25
- **Role map** (agile processes only). Spelled out as a 0-indexed 19-element array (step 1 = index 0):
  `['-','BA','BA','BA','BA','Dev','Dev','Dev','Dev','Dev','Dev','Dev','Tester','Dev','Dev','Dev','Dev','Dev','Tester']`
  (use `null` for the `'-'` step-1 slot). Verify: BA 180 + Dev 640 + Tester 180 = 1,000 (Menschlich); 20 + 60 + 10 = 90 (KI). Same array reference for both agile processes.

Step counts for validation: **19 / 19 / 7 / 2** (human / agileKi / semiAutomated / automated).

**Agile-mit-KI default JSON string** (used verbatim in 3 backend spots — DDL default, ALTER default, seed): define it **once** as a shared constant so the CREATE, ALTER, and seed never drift:
`{"works":[0,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5],"waits":[120,120,120,960,480,0,30,120,120,120,30,240,60,0,30,240,30,60]}`

## Phase ordering & dependencies

1. **Phase 1 — Backend persistence** (db-coder + be-coder). Migration + column must exist before service/seed writes to it.
2. **Phase 2 — Frontend data + component logic** (fe-coder). Process-keyed refactor + unit conversion + load fallback. Exposes data the charts consume. **Includes collapsing the 3 hardcoded Schritt-Zeiten HTML blocks into the tab loop** (moved here from Phase 3 so the per-control `max` binding is written once, not 3× then rebuilt).
3. **Phase 3 — UI / charts** (ui-designer). Tabs layout, pies, flowchart, toggle, styles. Depends on Phase 2 exposing chart data + the collapsed tab loop.
4. **Phase 4 — Tests** (be-test-coder, fe-test-coder).
5. **Phase 5 — Docs + verification.**

Within Phase 1 there is a hard ordering constraint: the guarded `ALTER TABLE` (add `agileKiSteps`) must run **before** the seed `UPDATE` that writes that column on existing DBs.

---

## Tasks

### 1. Backend — DB / persistence

#### 1.1 Schema — `backend/src/db/schema/schema.ts`
- [ ] Add `agileKiSteps: text('agileKiSteps').notNull()` to the `szenario` table, after `automatedSteps`. No Drizzle `.default()` (mirror the other 3 process columns).

#### 1.2 Migration — `backend/src/config/migrate.ts`
- [ ] Define the Agile-mit-KI default JSON as one shared constant (see Canonical section) and reuse it in both the CREATE and ALTER below — do not hand-type the 19/18 arrays twice.
- [ ] Add `agileKiSteps TEXT NOT NULL DEFAULT '<const>' CHECK (json_valid(agileKiSteps))` to the `CREATE TABLE IF NOT EXISTS szenario` DDL (fresh DBs).
- [ ] Add an idempotent guarded helper `ensureSzenarioAgileKiColumn()` for existing DBs: run `PRAGMA table_info(szenario)` (standalone `client.execute`, not batched), check if `agileKiSteps` is absent by column `name`, and if so run `ALTER TABLE szenario ADD COLUMN agileKiSteps TEXT NOT NULL DEFAULT '<const>' CHECK (json_valid(agileKiSteps))` (backfills every existing row).
  - [ ] **Wrap the `ALTER` in try/catch and swallow a "duplicate column name" error** (treat as already-migrated), re-throwing anything else. Reason: on Vercel, multiple serverless instances can cold-start concurrently against the same Turso DB (each has its own `initPromise`, not shared cross-instance — see `api/index.ts`); two can both pass the `table_info` check and both attempt the `ALTER`, and SQLite has no `ADD COLUMN IF NOT EXISTS`. The second would otherwise reject that instance's init and 500 all its requests until recycled. Mirror the existing `isUniqueConstraintError()` pattern in `szenarioService.ts`.
- [ ] Wire the call in `runMigrations()` **immediately before `await seedSzenario();`** (after the CREATE TABLE / CREATE INDEX blocks). Add a comment explaining this is the codebase's first real guarded `ALTER`-on-existing-table migration (do NOT reference the `ticket.status` comment as precedent — that comment says the opposite, telling users to `--reset-db`; there is no prior guarded-ALTER art here).
- [ ] Note SQLite ALTER appends the column last physically on upgraded DBs (vs. between `automatedSteps`/`createdAt` on fresh DBs); harmless because all access is by name (Drizzle + named params). Verify libSQL/Turso compatibility of the ALTER shape.

#### 1.3 Seed — `backend/src/seed/szenarioSeed.ts`
- [ ] Replace `HUMAN_WORKS`/`HUMAN_WAITS` with the new 19/18 arrays; `SEMI_WORKS`/`SEMI_WAITS` with the new 7/6 arrays; set `AUTO_WAITS = [5]` (was `[240]`); add `AGILE_KI_WORKS`/`AGILE_KI_WAITS` (19/18). The `agileKiSteps` JSON must be byte-identical to the migration constant (1.2) — reuse the same source values.
- [ ] Add `agileKiSteps` to the `INSERT OR IGNORE` column list + args (fresh DBs).
- [ ] Add an unconditional, idempotent `UPDATE szenario SET humanSteps=@…, agileKiSteps=@…, semiAutomatedSteps=@…, automatedSteps=@…, updatedAt=@… WHERE id=1 AND name='Standard-Szenario'` after the insert — rewrites the already-seeded row to new defaults on every startup (INSERT OR IGNORE never updates an existing row). Reuse the existing `FIXED_TIMESTAMP` constant for `updatedAt` (deterministic). Comment that this is a **permanent, standing** overwrite (runs every startup, forever) — any UI edit to the Standard-Szenario row is reverted on next restart, by design; not a one-shot migration.
- [ ] Ordering: the `UPDATE` needs the `agileKiSteps` column to exist → confirm `ensureSzenarioAgileKiColumn()` runs before `seedSzenario()`.

### 2. Backend — service / validation / routes

#### 2.1 Validation — `backend/src/utils/validation.ts`
- [ ] `PROCESS_STEP_COUNTS` → `{ human: 19, agileKi: 19, semiAutomated: 7, automated: 2 } as const`.
- [ ] Add `agileKiSteps: prozessSchema(PROCESS_STEP_COUNTS.agileKi)` to `SzenarioSchema` (after `humanSteps`). `prozessSchema` already derives waits = works−1.
- [ ] `DurationSchema` unchanged (`.int().min(0).max(479520)`) — stored values are integer minutes; R5 unit scaling is frontend-only.

#### 2.2 Service — `backend/src/services/szenarioService.ts`
- [ ] Add `agileKiSteps` to `SzenarioDTO` (`ProzessDauer`) and `SzenarioRow` (`string`), after `humanSteps`.
- [ ] `toDTO()`: `agileKiSteps: JSON.parse(row.agileKiSteps) as ProzessDauer`. No null guard — relies on the NOT NULL backfill from 1.2 (state this ordering dependency; do not mask a missing migration with a fallback).
- [ ] `create()` INSERT + args and `update()` SET + args: add `agileKiSteps` with `JSON.stringify(dto.agileKiSteps)`. Positional `?` params — no compiler safety net, so the round-trip test (§6) is load-bearing (must use `agileKiSteps` values distinct from the other processes to catch a column-swap). `list()`/`findById()` use `SELECT *` — no change.

#### 2.3 Routes — `backend/src/routes/szenario.ts`
- [ ] Confirm handlers pass the validated `dto` straight through — no per-field edits needed. Confirm `requireAuth` stays on all routes. No code change expected; verify only.

### 3. Frontend — data models & defaults

#### 3.1 `frontend/src/app/core/models/prozess-defaults.ts`
- [ ] Add a `Rolle` type = `'BA' | 'Dev' | 'Tester'`.
- [ ] Restructure `PROZESS_STEP_LABELS` to 4 keys. `menschlich`: delete old steps 17,18,22,23 → 19 labels. `agileKi`: reference `PROZESS_STEP_LABELS.menschlich` (same reference, never hand-copied).
- [ ] `halbautomatisch`: **replace** the current 6-label array with the new 7-label array (this is an insertion + relabel, not an index swap). New order per PRD R1a: 1 "Auslöser: Anfrage oder Fehler", 2 "KI schreibt Ticket, weist Mensch zu", 3 "Mensch gibt KI Feedback zur Anfrage", 4 "Mensch weist Ticket an KI zur Umsetzung", 5 "KI analysiert, beginnt Code, braucht Input, weist Mensch zu", 6 "Mensch beantwortet Fragen, weist Ticket an KI", 7 "KI analysiert Antwort, schreibt Code, testet" (dropped ", deployed").
- [ ] `vollautomatisch`: relabel step 2 → "KI schreibt Ticket, Code und Tests" (dropped "und deployed").
- [ ] Replace `DEFAULT_DURATIONS` with the 4 canonical arrays above. `agileKi.waits` references `menschlich.waits`. Add a source comment noting the small Agile-mit-KI improvement is intentional (waiting dominates) — do not "fix" it.
- [ ] Add role map `PROZESS_ROLLEN: Record<'menschlich'|'agileKi', (Rolle|null)[]>` using the explicit 19-element array from the Canonical section (same reference for both).
- [ ] Extend `ProzessDescriptor.key` union with `'agileKi'`. Add a per-descriptor `arbeitszeitLabel` field ('Arbeitszeit' for the two agile, 'KI-Arbeitszeit' for the two KI processes).
- [ ] Rebuild `PROZESSE` with 4 entries in R1 order + correct titles + `stepCount` (19/19/7/2). No leftover old titles.

#### 3.2 Models, service & its spec — `szenario.model.ts`, `szenario.service.ts`, `szenario.service.spec.ts`
- [ ] Add `agileKiSteps: ProzessDauer` to `Szenario`, `SzenarioCreate` (→ `SzenarioUpdate`).
- [ ] Add a `ProzessKey → Szenario field` mapping const (`menschlich→humanSteps`, `agileKi→agileKiSteps`, `halbautomatisch→semiAutomatedSteps`, `vollautomatisch→automatedSteps`) — the bridge the component loop uses. `SzenarioService` needs no signature change (passthrough).
- [ ] **`szenario.service.spec.ts`: add `agileKiSteps` to the `mockSzenario`/`mockCreate`/`mockUpdate` literals** — otherwise the now-required field breaks `ng build`/Karma compile.

### 4. Frontend — component refactor (`rechner.component.ts` + `.html`)

#### 4.1 Process-keyed refactor (CRITICAL — PRD NFR)
- [ ] Replace the 3 hardcoded total signals + 6 works/waits signals with ONE `signal<Record<ProzessKey, ProzessSnapshot>>` seeded from `DEFAULT_DURATIONS`.
- [ ] `svgSnapshot`, `baueFormular`, `berechne`, `formZuPayload`, `ladeScenario`/`patchProzessArray`: all loop `PROZESSE` keyed by `p.key` + the field mapping — no per-process named property access anywhere. Grep the `.ts` after refactor to confirm no literal `menschlich`/`halbautomatisch`/`vollautomatisch` outside the loop constructs / mapping table. (HTML literals are cleared in 4.7.)
- [ ] Tighten `getWorksArray`/`getWaitsArray`/`getWaitValueCtrl`/`getWaitUnitCtrl` param type from `string` to `ProzessKey`.

#### 4.2 Scenario load fallback + recompute (Special Instructions + fe review Critical #1/#2)
- [ ] In the load loop, for EACH process: if `s[field]` is missing OR `works.length !== expected stepCount`, patch that whole process from `DEFAULT_DURATIONS[key]` instead of index-patching. Per-process & independent; never throws. (Backend guarantees `waits.length === works.length-1`, so checking `works.length` suffices; note this assumption.)
- [ ] Patch every touched control's `value` AND `unit` (`unit`='Minuten') AND **reset its `max` validator back to the Minuten factory** (`setValidators(durationValidatorsFor('Minuten'))` + `updateValueAndValidity({emitEvent:false})`) — otherwise a field left on "Tage" (max 999) before load stays capped at 999 and rejects a legitimately large loaded minute value.
- [ ] **After the load loop, explicitly recompute**: call `this.berechne(this.form.getRawValue())` (or write the Record signal directly from the loaded/fallback arrays). Required because the `{emitEvent:false}` patches (4.3) propagate up and suppress the root `form.valueChanges` → `berechne` that normally refreshes totals/bars/pies. Without this, loading a Szenario leaves the display stale (violates R2 "load updates all four tabs").
- [ ] Reset `viewMode` to `'balken'` on load (see 4.4).

#### 4.3 Unit conversion (R5) — `einheit.ts` + component
- [ ] `einheit.ts`: add `maxWertFuerEinheit(unit) = 479520 / einheitZuFaktor(unit)` (479520 / 7992 / 999 — exact) and a `durationValidatorsFor(unit)` factory returning `[required, min(0), max(maxWertFuerEinheit(unit))]`. Replace the module-level `DURATION_VALIDATORS` constant with this factory (used at build + on unit change).
- [ ] For every step group (works + waits, all 4 processes, built in the 4.1 loop), subscribe to the `unit` control's `valueChanges` with `startWith(unit)` + `pairwise()` + `takeUntilDestroyed`. On `[prev,cur]` (skip if equal): convert value prev→minutes→cur, round to ≤2 decimals (`Math.round(x*100)/100`), `patchValue` the value control; and `setValidators(durationValidatorsFor(cur))` + `updateValueAndValidity()` on it.
- [ ] Guard scenario-load: patch `value`+`unit` with `{ emitEvent: false }` so the unit `valueChanges` conversion pipeline never fires during a load. Optional `isLoading` signal as a second-line guard in the handler.

#### 4.4 Tab & view-toggle state
- [ ] `activeTab` (1..4) drives the single `ngbNav`. Add `viewMode = signal<'balken'|'flussdiagramm'>('balken')`; reset to `'balken'` on `(navChange)` and in `ladeScenario`. Not persisted. Add `toggleView()`/setters; expose `viewMode` read-only.

#### 4.5 Remove hero reveal + orphaned "gespart/Basis" framing
- [ ] Delete `revealStep`, `showDetails`, `reveal`, `scrollToDetail`, the `hero*` computeds, and the `DOCUMENT` inject if now unused.
- [ ] **Drop the shared-scale "Basis / ↓ X gespart" per-bar framing**: it was rendered only via the hero's `shared=true` path. Delete `getSharedSegments()` and `getGesparteZeit()` and the `shared` branch of the `#procBar` template. The comparison chart keeps its own shared-scale SVG (`getComparisonBars`) — that is separate and stays. (Per PRD Special Instructions, baseline framing is "if kept"; we drop it to avoid dead code. Agile mit Menschen remains index 0.)
- [ ] Ensure template no longer references any deleted member.

#### 4.6 Chart data helpers (data only)
- [ ] `getWorkWaitTotals(index): {work,wait}` (Pie A input).
- [ ] `getArbeitszeitLabel(index): string` (from descriptor).
- [ ] `getRollenSplit(index): {ba,dev,tester}|null` — narrow on `p.key === 'menschlich' || 'agileKi'` (the Record has only those 2 keys), else `null`. (The "sum === work total" check is a fe-test assertion, §7, not a runtime throw.)
- [ ] `getFlowchartSchritte(index): {nr,label,work,wait|null}[]` (per-box flowchart data; last step `wait=null`).

#### 4.7 Collapse the 3 Schritt-Zeiten HTML blocks (moved from Phase 3)
- [ ] Collapse the 3 near-identical Schritt-Zeiten blocks (`rechner.component.html:415-640`) into a `@for (p of prozesse; track p.key)` loop; key per-field ids by `p.key` (no `menschlich-`/`halb-`/`voll-` literals). Bind each value input's `max` to the per-control validator max (not the literal `479520`). This produces the single tab-content template the layout (5.1) wires up.

### 5. Frontend — UI / charts (`.html`, `svg-util.ts`, styles)

#### 5.1 Layout
- [ ] Delete the hero `<section>` (5–115); add a static intro (title + one-line subtitle, no CTAs). Remove the `@if (showDetails())` wrapper so tabs/comparison/Szenarien always render.
- [ ] **Remove the "Zur Eingabe springen" skip link outright** (`rechner.component.html:218-222`) + its dead anchor — the tabs are directly keyboard-reachable, no single input landing area remains.
- [ ] Build ONE `ngbNav` 4-tab strip (`@for (p of prozesse; track p.key)`). Tab body order: **title+total → Balken/Flussdiagramm toggle → [Balken bar `#procBar` | Flussdiagramm] → pie(s) → that process's Schritt-Zeiten form inline** (toggle sits immediately above the view it switches). After edit, exactly one `<ul ngbNav>` remains.
- [ ] **Comparison section: keep only the shared-scale comparison SVG; DELETE the second per-process `procBar` (`shared:false`) loop** (`rechner.component.html:304-310`) — otherwise each bar renders twice (in its tab and again here). Replace the hardcoded 3-process `<desc id="cmp-desc">` with a loop over all 4 processes. Verify the `viewBox` height scales to 4 rows. Szenarien card stays below.

#### 5.2 Pie helper — `svg-util.ts`
- [ ] Add pure `computePieSlices(slices, cx, cy, r)` returning path data + percent (rounded to 1 decimal so ~3% slices show) + `isEmpty` (total 0) + `isFullCircle` (single 100% slice → render `<circle>`, not a 360° arc). Deterministic for unit tests.

#### 5.3 Pie A (all 4 tabs, 2 slices)
- [ ] Work `#264892`, wait solid `#cf944f` (no hatch). **Add a thin ~1px stroke (white or `#495057`) around every slice** so edges are visible against the white card (solid tan alone is <3:1 vs white). Work-slice label from `getArbeitszeitLabel`. Caption "Arbeit vs. Warten". Always-visible legend (swatch + label + `| dauer` minutes + percent). Empty state = grey circle + "Keine Daten".

#### 5.4 Pie B (2 agile tabs only, 3 slices)
- [ ] Gate with `@if p.key in (menschlich, agileKi)`. Caption "Arbeitsverteilung nach Rolle" + note "Summe = nur Arbeitszeit". Shared legend template with Pie A. Lay Pie A + Pie B side by side (responsive) on agile tabs.
- [ ] **Palette must be colorblind-safe AND accessible.** Pick 3 role colors that: (a) each reach ≥3:1 contrast vs the white card; (b) differ from each other in **lightness** (not only hue) so they survive grayscale/colorblind viewing; (c) are distinct in hue from the existing tokens — work `#264892`, wait `#cf944f`, gespart green `#198754`, danger `#dc421e`, warning `#f98752`, success `#a7c6eb`. Suggested starting set (verify each with a contrast checker, adjust as needed): BA `#6f42c1` (purple), Dev `#0f766e` (dark teal, ~4.5:1), Tester `#9a6700` (dark goldenrod/olive, avoids the 0–30° red band that collides with danger/warning). Same 3 colors on both agile tabs. Add these to SPECS-ui.md (§9).

#### 5.5 Flowchart (R4)
- [ ] Per-process HTML boxes in a `overflow-x:auto` scroll container (`.flow-track` non-wrapping). Fixed box size reused across all processes. Each box: step number, truncated label (CSS ellipsis + `ngbTooltip` full text), work chip, following-wait chip (omit on last step). Decorative `→` connectors (`aria-hidden`). Chart-level `role="group"` + aria-label wrapper.
- [ ] **Per-box focus: ALL boxes are `tabindex="0"` with their own `aria-label`** (step number, label, work, following wait), including the 0-min "Auslöser" step. This intentionally differs from the Balken bar (which skips focus on 0-work segments) — R4 requires per-box focus; the NFR "same information" is about content, not identical tab-stop counts. Document this decision in a comment. `:focus-visible` matches `.seg-rect`. Work/wait chip colors `#264892`/`#cf944f` (dark text on tan for contrast).

#### 5.6 Toggle + accessibility
- [ ] Per-tab button/btn-group with `aria-pressed`, bound to `viewMode`/`setViewMode`; default Balken; ≥44px hit area. Schritt-Zeiten form sits OUTSIDE the balken/flussdiagramm `@if` so toggling never touches form DOM.
- [ ] Each pie SVG: `role="img"` + linked `<title>`/`<desc>` (uniquely id'd per tab+pie); slices `aria-hidden` (legend carries data). Verify keyboard walkthrough, heading order after hero removal, color-blind distinguishability of Pie B hues, legend contrast.

#### 5.7 Styles
- [ ] Remove dead hero styles. Add `.pie-block`/`.pie-svg`/`.pie-caption`/`.pie-note`/`.pie-legend*`/`.pie-empty-label` and `.flow-scroll`/`.flow-track`/`.flow-box*`/`.flow-connector` + `.flow-box:focus-visible`. Bootstrap-first for the toggle. Cross-check new color literals against SPECS-ui.md tokens.

---

## Tests

### 6. Backend Playwright — `backend/src/test/szenario.spec.ts` (be-test-coder)
- [ ] Resize helper constants: human 19/18, semi 7/6; add `AGILE_KI_WORKS_19`/`AGILE_KI_WAITS_18` (values **distinct** from the other processes to catch column-swaps); confirm auto values (0,20 / 5). Update `validPayload()` to include `agileKiSteps`. Add `agileKiSteps` to every inline payload literal (else Zod rejects them once the field is required). Update the local `SzenarioDTO` interface + doc header (19/19/7/2).
- [ ] New length-mismatch validation cases for `agileKiSteps` (wrong works length, wrong waits length). Update round-trip/persistence assertions from 23/22 → 19/18 and add an exact element-by-element `agileKiSteps` round-trip.
- [ ] Seed behavior (achievable in-harness against the fresh CI DB): after startup the Standard-Szenario reflects new totals (3,880 / 2,970 / 290 / 25) and has a valid `agileKiSteps`. (The pre-existing-DB upgrade path is NOT automatable in the current harness — it is a manual/scripted step in §8, not a Playwright test.)

### 7. Frontend Jasmine (fe-test-coder)
- [ ] Unit conversion: `einheitZuFaktor`/`feldWertZuMinuten`/`maxWertFuerEinheit` + the component handler — R5 examples (240 Min → 4 Std → 0.5 Tage → back), ≤2-decimal rounding, round-trip within tolerance.
- [ ] Scenario-load does NOT convert (handler not invoked during load) AND **positively refreshes** — after `ladeScenario`, `svgSnapshot()`/totals reflect the loaded values (guards the 4.2 recompute).
- [ ] Scenario-load validator reset: a field switched to "Tage" then a load leaves it on Minuten with a Minuten-scale max (large loaded value stays valid).
- [ ] Role-split aggregation: `getRollenSplit` sums to work total (1,000 / 90) for the agile processes, `null` for the KI ones.
- [ ] Defaults wiring: `DEFAULT_DURATIONS` matches R1a exactly; totals 3,880/2,970/290/25; `PROZESSE`/labels have 4 entries in order with 19/19/7/2; `agileKi` labels === `menschlich` labels.
- [ ] Scenario-fallback: mismatched-length or missing process falls back to defaults for that process only, others patched from stored data, no throw.
- [ ] `computePieSlices` geometry: 2-slice, 3-slice, zero-total (empty), single-100% (full circle), AND an explicit ~3% small-share input asserting percent rounds to 1 decimal (e.g. 90 of 2,970 → "3.0", not "0").
- [ ] `getFlowchartSchritte`: correct `nr`/label/work mapping per process; last step `wait === null`.
- [ ] DOM-level (TestBed) assertions for R2/R4: exactly one tab strip with 4 tabs; no "Menschlich"/"Halbautomatisch"/"Vollautomatisch" text in the rendered page; each flowchart box has a non-empty `aria-label`.

### 8. Verification
- [ ] `cd backend && npx tsc --noEmit`; `cd frontend && npx ng build`.
- [ ] **Run both suites and confirm green** (Success Criterion): `cd backend && npm test` and `cd frontend && npm run test:ci`.
- [ ] Fresh-DB: `./start.sh --reset-db` → confirm `PRAGMA table_info(szenario)` has `agileKiSteps` and Standard-Szenario totals via json_each sums (3,880/2,970/290/25) and array lengths (19/18, 19/18, 7/6, 2/1).
- [ ] Upgrade path (manual/scripted, not CI): copy the current `crmdb.sqlite` (old 3-column shape) aside, run startup, confirm the column is added, rows backfilled, Standard-Szenario updated; restart to confirm idempotency (no "duplicate column" error — the try/catch handles the concurrent case).
- [ ] **Mandatory manual pass (Playwright MCP)** at `http://localhost:7200/produktivitaet/rechner`: one 4-tab strip, no CTAs, no old titles; per-tab order title→toggle→view→pies→form; each bar appears once (not duplicated in comparison); 19-step flowchart scrolls horizontally not wraps; narrow viewport legends stack; focus rings on segments/toggle/boxes; zero-fill → empty pie; a 100%-slice → full circle; Pie B role colors visually distinct.

### 9. Docs (Phase 5)
- [ ] Update `docs/specs/SPECS-database.md` szenario section (4 processes, new `agileKiSteps` column, guarded-ALTER migration note, array shapes 19/18·19/18·7/6·2/1).
- [ ] Update `docs/specs/SPECS-frontend.md` (line ~151 currently says "Compares three software-delivery processes…") → 4 processes, tabs, pies, flowchart, no hero.
- [ ] Add a "Rechner Chart Colors" subsection to `docs/specs/SPECS-ui.md` (work `#264892`, wait `#cf944f`, and the finalized BA/Dev/Tester role hexes), mirroring the existing "Phase Badge Color Map" pattern.
- [ ] Check `docs/specs/SPECS.md` if it enumerates the processes (it does not currently mention Rechner — verify only).
