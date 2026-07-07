# PRD: UPDATE-PROZESSE-TICKETS

## Source

User request. Update the process-comparison page ("Ein Ticket, vier Prozesse"). Restructure the seed tickets at `/admin/tickets`.

## Problem Statement

Two workshop artifacts need work.

1. The process-comparison page compares four delivery processes. It shows no assumptions. Users cannot see *why* each process is faster or slower. The "Agile mit KI" process shares the same waiting times as the human process, so its speed-up looks too small. The "KI-Prozess mit Feedback" process skips the human review loop.
2. The seed tickets mix business and technical content in one blob. Comments do not name who should answer.

## Requirements

### Part A — Process-comparison page

**A1. "Annahmen" column.** Add a column on the right of the comparison bars. Two bullets per process:

| Process | Bullet 1 | Bullet 2 |
|---------|----------|----------|
| Agile mit Menschen | Mensch macht alles | Mensch macht Fehler |
| Agile mit KI | KI macht alles | KI macht Fehler |
| KI-Prozess mit Feedback | KI macht alles | Ausführung fehlerfrei |
| KI-Prozess vollautomatisch | KI macht alles | Planung und Ausführung fehlerfrei |

**A2. Reduce "Agile mit KI" waiting times from step 5.** Today "Agile mit KI" reuses the human waiting times. Cut each waiting time from step 5 onward. Steps 1–4 stay the same (human refinement phase).

Rule (confirmed): from the wait after step 5 onward, cut to 50 %. All halved values land on multiples of 5, so no rounding is needed.

- Current waits: `[120,120,120,960,480,0,30,120,120,120,30,240,60,0,30,240,30,60]`
- New waits: `[120,120,120,960,240,0,15,60,60,60,15,120,30,0,15,120,15,30]`
- Work stays `[0,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5]` (sum 90).
- New total: 90 work + 2,100 wait = **2,190 min** (was 2,970).

**A3. Caption under the "Agile mit KI" bar.** Small explanatory line:
> Agiler Prozess mit Refinement und PR-Review, Business Analyst, Entwickler, Tester

**A4. Replace "BA" with "Business Analyst" in step labels.** Three shared step labels:
- `BA analysiert die Situation` → `Business Analyst analysiert die Situation`
- `BA bespricht mit Entwickler` → `Business Analyst bespricht mit Entwickler`
- `BA schreibt Ticket` → `Business Analyst schreibt Ticket`

Scope (confirmed): step **labels** only. The role chips and Pie B legend keep the short `BA` code (changing the `Rolle` type ripples into pie charts and many tests).

**A5. Extend "KI-Prozess mit Feedback" steps.** From step 3, insert a human review loop. Business Analyst and Entwickler run it in sequence. Each does: give feedback → AI fixes → approve. Then continue with the current step 5 onward.

New 11-step labels (all hand-offs name a role — no generic "Mensch"):
1. Auslöser: Anfrage oder Fehler
2. KI schreibt Ticket, weist Business Analyst zu
3. Business Analyst gibt KI Feedback, weist an KI zu
4. KI überarbeitet, weist Business Analyst zu
5. Business Analyst genehmigt, weist an KI zu
6. Entwickler gibt KI Feedback, weist an KI zu
7. KI überarbeitet, weist Entwickler zu
8. Entwickler genehmigt, weist an KI zu
9. KI analysiert, beginnt Code, braucht Input, weist Entwickler zu *(was step 5)*
10. Entwickler beantwortet Fragen, weist an KI zu *(was step 6)*
11. KI analysiert Antwort, schreibt Code, testet *(was step 7)*

Proposed durations:
- Work: `[0,5,10,10,5,10,10,5,10,30,20]` (sum 115)
- Waits: `[5,60,5,60,60,5,60,5,60,5]` (sum 325)
- New total: **440 min** (was 290). Step count 7 → 11.

### Part B — Seed tickets

**B1. Split each ticket body into "Business" and "Technical".** All 12 tickets. Each body gets a `## Business` section (the goal, the value, what the user sees) and a `## Technical` section (implementation hints, columns, endpoints, libraries). Keep the "Rückfrage erforderlich" and "Fertig, wenn" blocks. Vague tickets (1–5) get a short Business section and a Technical section that states what is still open.

**B2. Address each comment to a role.** All 7 baked-in comments. Each opens by naming who must answer: **Business Analyst** (business/scope questions) or **Entwickler** (technical questions). Example prefix: `@Business Analyst:` or `@Entwickler:`.

Proposed role per comment:
- Comment 1 (Firmenkarte, data source/click behavior) → **Business Analyst**
- Comment 2 (KI-Chat, scope/data) → **Business Analyst**
- Comment 3 (Firmendossier, content/source) → **Business Analyst**
- Comment 4 (Beziehungsanalyse, what to analyze/output) → **Business Analyst**
- Comment 5 (CSV-Import, formats/columns/duplicates) → **Business Analyst**
- Comment 6 (CSV-Export separator, comma vs semicolon) → **Entwickler**
- Comment 7 (Sidebar counter, all vs open Chancen) → **Business Analyst**

## Special Instructions

None beyond the request.

## Implementation Approach (high level)

### Frontend

- **Model** (`prozess-defaults.ts`): update the three shared labels (A4); give `agileKi` its **own distinct** waits array (A2) — remove the "same reference / do not fix it" comment (lines 66–69) that A2 contradicts; rewrite `halbautomatisch` labels/works/waits (A5); bump `PROZESSE[2].stepCount` 7 → 11 (drives tab label, flowchart aria, and `ladeScenario()` length-match — a miss silently discards stored scenario data); add an Annahmen data structure keyed by `ProzessKey` (A1); add a caption field for `agileKi` (A3).
- **Component** (`rechner.component.html`, maybe `.ts`): render the Annahmen bullets next to each bar in the "Prozessvergleich" card and the caption under the "Agile mit KI" bar. The current card is one fixed-viewBox SVG. Use a **hybrid row layout** (real HTML: name + bar SVG + total + Annahmen `<ul>`) — this matches the existing `#procBar` pattern already used elsewhere on the page and satisfies the accessibility NFR (SVG `<text>` inside `role="img"` is not reliably exposed). ui-designer picks the exact layout. Two constraints: keep the bar wired to `getComparisonBars()` (shared scale), not `getSegments()`; keep the whole row one clickable/focusable target so "click anywhere in the row selects the tab" does not regress.
- **No change needed** in `rechner.component.ts` logic beyond the arrays: `getSegments`, `getFlowchartSchritte`, pies, and form-array construction are all driven by `works.length`/`waits.length`. Pie B already gates to `menschlich`/`agileKi`, so `halbautomatisch` gets no role split (by design).

### Backend

- **Seed** (`szenarioSeed.ts`): mirror the new `agileKi` waits and `halbautomatisch` works/waits. `AGILE_KI_WAITS` currently `= HUMAN_WAITS` — decouple it into its own literal.
- **Migration** (`config/migrate.ts`): update `AGILE_KI_DEFAULT_JSON` waits to match A2. (No change for `semiAutomatedSteps` — that column has no baked-in DEFAULT.)
- **Validation** (`backend/src/utils/validation.ts`) — **critical**: `PROCESS_STEP_COUNTS.semiAutomated` 7 → 11. Missed → the Zod length check 400s **every** scenario save (POST/PUT `/api/szenarien`) after this ships, for all four processes.
- **Ticket seed** (`ticketSeed.ts`): rewrite 12 bodies (B1) and 7 comments (B2). Ids, status, owner, type, and row counts stay the same (backend tests assert only on those, not on body text).

### Specs / docs

- `frontend/.../prozess-defaults.spec.ts`: totals 2,970 → 1,810 and 290 → 440; step counts `[19,19,7,2]` → `[19,19,11,2]`; halbautomatisch label count 7 → 11; **delete** the "agileKi waits is the same array reference" `.toBe()` identity test (A2 makes it structurally wrong); add asserts for the new "Business Analyst" labels.
- `frontend/.../rechner.component.spec.ts`: update the `semiAutomatedSteps` factory/fixtures from 7/6 to 11/10 length (lines ~71, ~212), and `works.length` 7 → 11 / `waits.length` 6 → 10 asserts (lines ~475). The flow-box-count-per-`stepCount` loop (~532) is the safety net for the `stepCount` bump.
- `backend/src/test/szenario.spec.ts`: widen all 7/6-length `semiAutomatedSteps` fixtures to 11/10; change the length-validation test (6-not-7 → 10-not-11); update seeded-total asserts 2,970 → 1,810 and 290 → 440; give `SEED_AGILE_KI_WAITS` its own array (stop reusing `HUMAN_WAITS_18`).
- `docs/specs/SPECS-database.md` (line ~127): `semiAutomatedSteps` JSON shape `number[7]/[6]` → `number[11]/[10]`.

## Test Strategy

- Backend: Playwright API tests (`backend/src/test/szenario.spec.ts`, `tickets.spec.ts`). Verify seeded szenario durations, the new step counts, and ticket rows after reset.
- Frontend: Jasmine/Karma. Update existing assertions (totals, step counts, labels); add assertions for the Annahmen data and the caption.
- Manual: **szenario changes appear on a plain restart** (seed does an unconditional `UPDATE` every startup) — no `--reset-db` needed for Part A. **Ticket changes need a reset** (`POST /api/tickets/reset` or the "Reset" button, or `--reset-db`) because the ticket seed is `INSERT OR IGNORE` only. Open the page: confirm the Annahmen column, caption, reduced waits, extended feedback steps. Open `/admin/tickets`: confirm Business/Technical split and role-addressed comments.

## Non-Functional Requirements

- Frontend defaults and backend seed stay in sync (single source of truth mirrored across `prozess-defaults.ts`, `szenarioSeed.ts`, `migrate.ts`, `validation.ts`).
- Accessibility: the Annahmen bullets must be real, screen-reader-readable text (an HTML list), not decorative SVG.
- Writing style: short, simple German. No passive voice.
- **Rollout note**: existing local/Turso DBs keep the old ticket bodies until someone runs a reset. Existing *saved* scenarios lose any custom `halbautomatisch` values (array length 7 ≠ 11 → silent fallback to defaults on load) — acceptable, by design.

## Success Criteria

- [ ] Annahmen column shows two correct bullets per process.
- [ ] "Agile mit KI" waits cut 50 % from step 5; new total 2,190 min.
- [ ] Caption under "Agile mit KI" bar.
- [ ] "BA" replaced with "Business Analyst" in the three step labels (chips/legend unchanged).
- [ ] "KI-Prozess mit Feedback" has 11 steps with the BA-then-Dev review loop, all hand-offs role-named; new total 440 min.
- [ ] `PROCESS_STEP_COUNTS.semiAutomated` = 11 (scenario save still works).
- [ ] All 12 ticket bodies split into Business / Technical.
- [ ] All 7 comments address a Business Analyst or Entwickler.
- [ ] Frontend and backend stay in sync; all tests pass.

## Resolved Decisions

1. **Wait reduction (A2):** cut to **50 %** from step 5 onward. New total 2,190 min.
2. **"BA" scope (A4):** step **labels only**; role chips and Pie B legend keep `BA`.
3. **Step 9–11 wording (A5):** name the role — hand-offs use **Entwickler** (and step 2/4 use Business Analyst), no generic "Mensch" left.
4. **New feedback-step durations (A5):** work `[0,5,10,10,5,10,10,5,10,30,20]`, waits `[5,60,5,60,60,5,60,5,60,5]` (total 440).
5. **Comment role assignment (B2):** comments 1–5 and 7 → Business Analyst; comment 6 (CSV separator) → Entwickler.
