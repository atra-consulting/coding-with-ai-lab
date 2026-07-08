# Implementation Plan: RECHNER-PROZESS-VERBESSERUNGEN

Two changes on `/produktivitaet/rechner`. Task 3 (human/AI pie chart) was dropped.

## Test Command
- Frontend: `cd frontend && npx ng test --watch=false`
- Backend: `cd backend && npx playwright test`

(Both scopes change. Run via `fe-test-runner` + `be-test-runner`.)

## Task 1 — Persist "Alle Prozesse" button state across screens

The "Alle Prozesse" button is the `barLimit` toggle in the Prozessvergleich card
(`rechner.component.ts`). It cycles 0 → 1 → 2 → 3 → 0 (Alle / Nur Prozess 1 /
Prozesse 1–2 / Prozesse 1–3). Today `barLimit = signal(0)` — it resets on every
page load and every navigation.

Mirror the tickets-board pattern (`ticket-board.component.ts`,
`RECENT_ONLY_STORAGE_KEY` + `sessionStorage`): remember the value for the browser
session, survives navigation between screens. `sessionStorage` = "across screens",
same lifetime as the tickets toggle.

`barLimit` is written in three places (`cycleBarLimit`, `revealProcess`,
`selectProzess`→`revealProcess`). An Angular `effect()` persists every change in
one spot — no need to touch each writer.

### Files
- [ ] `frontend/src/app/features/produktivitaet/rechner.component.ts`
  - [ ] Add `private readonly BAR_LIMIT_STORAGE_KEY = 'rechner.barLimit';`
  - [ ] Initialize from storage: `barLimit = signal(this.readBarLimit());`
  - [ ] Add `private readBarLimit(): number` — read key, parse int, return it only
        if it is 0/1/2/3, else `0`. Wrap in try/catch → `0` (private-browsing safe).
  - [ ] Add `private writeBarLimit(value: number): void` — `sessionStorage.setItem`
        in try/catch (ignore errors), same shape as `writeRecentOnly`.
  - [ ] Add a field-initializer `effect()` (runs in injection context) that calls
        `this.writeBarLimit(this.barLimit())` whenever the signal changes.

### Tests (Task 1)
- [ ] `rechner.component.spec.ts`:
  - [ ] `cycleBarLimit()` writes the new value to `sessionStorage` under
        `rechner.barLimit`.
  - [ ] A component created with `rechner.barLimit = '2'` already in `sessionStorage`
        starts with `barLimit() === 2` (persistence survives re-creation = "across
        screens").
  - [ ] A junk / out-of-range stored value (e.g. `'9'`, `'x'`) falls back to `0`.
  - [ ] Clear `sessionStorage` in `afterEach` so specs stay isolated.

## Task 2 — KI-Arbeitszeit = 1h for processes 3 and 4

Set the AI coding time to **1 hour total** for the two KI-only processes. Change
the single source of truth in the frontend **and** its backend mirror. Keep waits
unchanged. Keep human feedback steps (Business Analyst / Entwickler) unchanged —
only the KI-labelled work steps scale to 60 min.

### KI-Prozess mit Feedback (halbautomatisch, process 3)
KI work steps = the five steps whose label starts with "KI" (indices 1, 3, 6, 8, 10).
Today they sum to 5+10+10+10+20 = **55**. Scale proportionally to **60** min:

| idx | step | actor | old | new |
|----|------|-------|----:|----:|
| 0 | Auslöser | — | 0 | 0 |
| 1 | KI schreibt Ticket | KI | 5 | 5 |
| 2 | Business Analyst gibt Feedback | human | 10 | 10 |
| 3 | KI überarbeitet | KI | 10 | 11 |
| 4 | Business Analyst genehmigt | human | 5 | 5 |
| 5 | Entwickler gibt Feedback | human | 10 | 10 |
| 6 | KI überarbeitet | KI | 10 | 11 |
| 7 | Entwickler genehmigt | human | 5 | 5 |
| 8 | KI analysiert, beginnt Code | KI | 10 | 11 |
| 9 | Entwickler beantwortet Fragen | human | 30 | 30 |
| 10 | KI analysiert Antwort, schreibt Code, testet | KI | 20 | 22 |

- New `works` = `[0, 5, 10, 11, 5, 10, 11, 5, 11, 30, 22]` (KI = 60, human = 60, total = **120**).
- `waits` unchanged = `[5, 60, 5, 60, 60, 5, 60, 5, 60, 5]` (325).
- New process total: 120 + 325 = **445** (was 440).

### KI-Prozess vollautomatisch (vollautomatisch, process 4)
Single KI step "KI schreibt Ticket, Code und Tests" (index 1): 20 → **60**.
- New `works` = `[0, 60]` (total = **60**).
- `waits` unchanged = `[5]`.
- New process total: 60 + 5 = **65** (was 25).

### Files
- [ ] `frontend/src/app/core/models/prozess-defaults.ts`
  - [ ] `DEFAULT_DURATIONS.halbautomatisch.works` → `[0, 5, 10, 11, 5, 10, 11, 5, 11, 30, 22]`
  - [ ] `DEFAULT_DURATIONS.vollautomatisch.works` → `[0, 60]`
  - [ ] Fix the sum comments (line ~76 `115 work … = 440` → `120 work … = 445`;
        the vollautomatisch `[240]`/`[0,20]` comment context).
- [ ] `backend/src/seed/szenarioSeed.ts`
  - [ ] `SEMI_WORKS` → `[0,5,10,11,5,10,11,5,11,30,22]`, fix comment `115 … 440` → `120 … 445`
  - [ ] `AUTO_WORKS` → `[0,60]`, fix comment `work 20 + wait 5 = 25` → `work 60 + wait 5 = 65`
  - [ ] (`SEMI_WAITS` / `AUTO_WAITS` unchanged.)

### Tests (Task 2)
- [ ] `backend/src/test/szenario.spec.ts` — the seed-assertion test breaks unless updated:
  - [ ] `SEMI_WORKS_11` → `[0, 5, 10, 11, 5, 10, 11, 5, 11, 30, 22]`
  - [ ] `AUTO_WORKS_2` → `[0, 60]`
  - [ ] `semiAutomatedSteps` sum step: `440` → `445`
  - [ ] `automatedSteps` sum step: `25` → `65`
  - [ ] Header comment `canonical totals (3,880 / 2,190 / 440 / 25)` → `… / 445 / 65`
- [ ] `rechner.component.spec.ts` — add a guard:
  - [ ] The KI-labelled steps of `DEFAULT_DURATIONS.halbautomatisch` sum to 60.
  - [ ] `DEFAULT_DURATIONS.vollautomatisch.works` sums to 60.
  - [ ] (Existing self-contained fixtures with 777/5000 sentinels stay untouched.)

## Verification
- [ ] `npx ng test --watch=false` green (frontend).
- [ ] `npx playwright test` green (backend) — needs the local backend running per its config.
- [ ] Manual smoke (optional): toggle "Alle Prozesse", navigate away and back → state kept.
      Open process 3/4 tab → KI-Arbeitszeit totals 1h.

## Out of scope
- Task 3 (new human/AI pie chart) — dropped by the user.
- No DB migration: `szenarioSeed.ts` overwrites the Standard-Szenario row on every
  startup, so the new defaults apply automatically.
