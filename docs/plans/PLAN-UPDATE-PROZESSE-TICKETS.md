# Implementation Plan: UPDATE-PROZESSE-TICKETS

## Test Command
- Backend: `cd backend && npm test`
- Frontend: `cd frontend && npm run test:ci`

PRD: `docs/prds/PRD-UPDATE-PROZESSE-TICKETS.md`

## Canonical data (single source of truth — copy exactly)

**agileKi waits (A2, 50 % from step 5):**
`[120,120,120,960,240,0,15,60,60,60,15,120,30,0,15,120,15,30]`
(works unchanged `[0,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5]`; total 2,190)

**halbautomatisch (A5, 11 steps):**
- works `[0,5,10,10,5,10,10,5,10,30,20]` (sum 115)
- waits `[5,60,5,60,60,5,60,5,60,5]` (sum 325; total 440)
- labels:
  1. `Auslöser: Anfrage oder Fehler`
  2. `KI schreibt Ticket, weist Business Analyst zu`
  3. `Business Analyst gibt KI Feedback, weist an KI zu`
  4. `KI überarbeitet, weist Business Analyst zu`
  5. `Business Analyst genehmigt, weist an KI zu`
  6. `Entwickler gibt KI Feedback, weist an KI zu`
  7. `KI überarbeitet, weist Entwickler zu`
  8. `Entwickler genehmigt, weist an KI zu`
  9. `KI analysiert, beginnt Code, braucht Input, weist Entwickler zu`
  10. `Entwickler beantwortet Fragen, weist an KI zu`
  11. `KI analysiert Antwort, schreibt Code, testet`

**A4 label replacements (menschlich labels, shared by agileKi):**
- `BA analysiert die Situation` → `Business Analyst analysiert die Situation`
- `BA bespricht mit Entwickler` → `Business Analyst bespricht mit Entwickler`
- `BA schreibt Ticket` → `Business Analyst schreibt Ticket`

**A1 Annahmen bullets (keyed by ProzessKey):**
- `menschlich`: `Mensch macht alles`, `Mensch macht Fehler`
- `agileKi`: `KI macht alles`, `KI macht Fehler`
- `halbautomatisch`: `KI macht alles`, `Ausführung fehlerfrei`
- `vollautomatisch`: `KI macht alles`, `Planung und Ausführung fehlerfrei`

**A3 caption (agileKi only):**
`Agiler Prozess mit Refinement und PR-Review, Business Analyst, Entwickler, Tester`

## Tasks

### 1. Frontend model — `frontend/src/app/core/models/prozess-defaults.ts` (fe-coder)
- [ ] Apply the 3 A4 label replacements in `MENSCHLICH_LABELS`.
- [ ] Give `agileKi` its **own** waits array (the A2 array above). Do NOT reuse `MENSCHLICH_WAITS`. Works stay the shared/KI array.
- [ ] Remove/replace the stale comment at lines ~66–69 ("Same waits array reference… do not fix it") — it now contradicts A2.
- [ ] Replace `PROZESS_STEP_LABELS.halbautomatisch` with the 11 labels above.
- [ ] Replace `DEFAULT_DURATIONS.halbautomatisch` works/waits with the A5 arrays.
- [ ] Bump `PROZESSE[2].stepCount` 7 → 11.
- [ ] Add exported `PROZESS_ANNAHMEN: Record<ProzessKey, string[]>` (two bullets each, above).
- [ ] Add exported caption for agileKi — e.g. `PROZESS_CAPTION: Partial<Record<ProzessKey, string>>` with the A3 string. (Component reads it; only agileKi set.)

### 2. Frontend UI — `rechner.component.html` (+ `.ts` if needed) (ui-designer, then fe-coder)
- [ ] In the "Prozessvergleich" card (lines ~176–259), render an **Annahmen column** to the right of each process's total. Two bullets per row as a real HTML `<ul><li>` (accessibility NFR — not SVG `<text>`).
- [ ] Convert the card to a **hybrid row layout**: each process is an HTML row = name + bar (keep the SVG bar, still driven by `getComparisonBars(...)`, shared scale) + total + Annahmen list. Reuse the `#procBar`/HTML pattern already on the page.
- [ ] Keep the whole row one clickable/focusable target (preserve today's "click anywhere in row selects tab" + keyboard). Do not regress the `cmp-hit` behavior.
- [ ] Render the A3 caption as a small muted line under the **Agile mit KI** bar only (read from the model caption map; render nothing for others).
- [ ] Expose the Annahmen map + caption on the component class (import from model) so the template can bind them.
- [ ] Keep German copy short; match existing `text-muted small` styling.

### 3. Backend seed + validation + migration (db-coder / be-coder)
- [ ] `backend/src/seed/szenarioSeed.ts`: set `AGILE_KI_WAITS` to the A2 array (own literal, stop `= HUMAN_WAITS`); set `SEMI_WORKS`/`SEMI_WAITS` to the A5 arrays. Update the header comment sums (agileKi 2,190; semi 440).
- [ ] `backend/src/config/migrate.ts`: update `AGILE_KI_DEFAULT_JSON` waits to the A2 array (keep works). Byte-identical to szenarioSeed.
- [ ] `backend/src/utils/validation.ts`: `PROCESS_STEP_COUNTS.semiAutomated` 7 → 11. **(Critical — else scenario save 400s.)**

### 4. Ticket seed content — `backend/src/seed/ticketSeed.ts` (ba-writer drafts copy, be-coder edits file)
- [ ] Rewrite all 12 `body` strings so each has a `## Business` section (goal, value, what the user sees) and a `## Technical` section (columns, endpoints, libraries, hints). Keep existing `Rückfrage erforderlich` and `Fertig, wenn` blocks (fold under the right heading). Vague tickets 1–5: short Business section; Technical section states what is still open.
- [ ] Rewrite all 7 `TICKET_COMMENT_SEED` bodies to open by naming the addressee: `@Business Analyst:` for comments 1,2,3,4,5,7; `@Entwickler:` for comment 6 (CSV separator). Keep each comment's existing question intent.
- [ ] Do NOT change ids, `ticketId`, `author`, `status`, `owner`, `type`, or row counts (12 tickets / 7 comments). Keep timestamps.
- [ ] Writing style: short, simple German, no passive voice.

### 5. Specs / docs (db-coder)
- [ ] `docs/specs/SPECS-database.md` (~line 127): `semiAutomatedSteps` JSON shape `number[7]/[6]` → `number[11]/[10]`.

### 6. Test updates
Frontend (fe-test-coder):
- [ ] `prozess-defaults.spec.ts`: **delete** the "agileKi waits is the same array reference as menschlich waits" `.toBe()` test; agileKi total 2,970 → 2,190; halbautomatisch works/waits arrays → A5; halbautomatisch total 290 → 440; step counts `[19,19,7,2]` → `[19,19,11,2]`; halbautomatisch label count 7 → 11; add asserts for the 3 new "Business Analyst" labels and for `PROZESS_ANNAHMEN`/caption.
- [ ] `rechner.component.spec.ts`: `semiAutomatedSteps` factory/fixtures 7/6 → 11/10 (lines ~71, ~212 keep the `777` marker at index 1); `works.length` 7→11 / `waits.length` 6→10 (~475). The flow-box-count-per-`stepCount` loop (~532) should pass once `stepCount`=11.
- [ ] Add a test asserting the Annahmen column renders 2 bullets per process and the caption shows under agileKi only.

Backend (be-test-coder):
- [ ] `backend/src/test/szenario.spec.ts`: widen all `semiAutomatedSteps` fixtures 7/6 → 11/10; length-validation test "6 not 7" → "10 not 11"; seeded totals 2,970 → 2,190 and 290 → 440; give `SEED_AGILE_KI_WAITS` its own array (stop `= HUMAN_WAITS_18`).
- [ ] `backend/src/test/tickets.spec.ts`: confirm still green (asserts only ids/status/owner/type/counts — no body-text coupling). Add an assert that a Definition-ticket body contains both `## Business` and `## Technical` after reset, and that comment 6 body starts with `@Entwickler`.

### 7. Verification
- [ ] `cd backend && npm test` green.
- [ ] `cd frontend && npm run test:ci` green.
- [ ] `cd frontend && npx ng build` compiles.
- [ ] Manual: restart backend (szenario auto-updates) → page shows Annahmen column, caption, halved waits, 11-step feedback process. Reset tickets (`POST /api/tickets/reset`) → bodies split, comments role-addressed.

## Tests (what they verify)
- **Model unit**: canonical arrays, totals, step counts, new labels, Annahmen map, caption present/absent per process.
- **Component unit**: Annahmen bullets render (2 per process); caption only under agileKi; row still selects tab on click; flow-box count matches stepCount for all 4 tabs.
- **Backend API**: seeded szenario returns new agileKi waits + 11-step semi arrays and correct totals; POST/PUT `/api/szenarien` with 11/10-length semi arrays succeeds (and 10-not-11 → 400); tickets reset yields Business/Technical bodies + role-addressed comments; counts unchanged.
- **Edge**: loading a legacy 7-length semi scenario falls back to defaults without error (documented, acceptable).

## Notes
- Keep frontend `prozess-defaults.ts`, backend `szenarioSeed.ts`, `migrate.ts`, and `validation.ts` in sync.
- szenario changes need only a restart; ticket changes need a reset.
