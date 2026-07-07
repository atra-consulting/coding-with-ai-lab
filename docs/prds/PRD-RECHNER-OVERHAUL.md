# PRD: Rechner Overhaul — Four Processes, Tabs, Pie Charts, Flowchart View

**Status:** Draft
**Feature area:** Produktivitäts-Rechner (`/produktivitaet/rechner`)

## Source

This PRD covers a rework of the productivity calculator page. The page compares
how long a ticket takes from request to production, across different ways of
working. Today it shows three processes: Menschlich, Halbautomatisch,
Vollautomatisch, plus a step-by-step "hero" story and saved scenarios
(Szenarien).

Stakeholders reviewed the page and made four decisions, locked in for this
PRD:

1. Write this as a full PRD.
2. Add a view switcher: a flowchart view as an alternative to the existing
   horizontal Arbeit/Warten bar. The bar stays the default view.
3. Persist the new fourth process the same way the other three are
   persisted today. It must survive save, reload, and scenario switching.
4. Use the exact default numbers spelled out in this document.

## Problem Statement

The calculator tells a good story today: work is a small share of total
time, waiting dominates. But it has four gaps.

**Gap 1 — No "AI coding, same ceremony" process.**
Teams ask: "If AI writes the code fast, doesn't that fix everything?" The
page has no process to answer this. Stakeholders want a process that keeps
the human agile ceremony (BA, refinement, review, test, release) but makes
AI do the actual coding in 5 minutes per step. The expected finding: total
time barely drops, because waiting between people — not coding — is the
real cost.

**Gap 2 — The hero narrative hides the other views.**
The page reveals processes one click at a time and only shows them inside
one card. Users can't jump straight to a process, see its numbers, or
compare views. There is no single place that says "here are all four
processes, pick one."

**Gap 3 — No pie charts.**
Nobody sees, per process, the split between working time and waiting time
as a simple pie. For the two processes with a human agile team, nobody sees
who did the work — BA, Developer, or Tester.

**Gap 4 — Unit switch is broken.**
Every step and wait field has a unit dropdown (Minuten/Stunden/Tage).
Switching the dropdown does not convert the number. It keeps the same
number and just relabels it. A 240-Minuten wait becomes a 240-Stunden wait
the moment a user picks "Stunden" — an 8,640-minute jump for a single
click. Users will notice and report this as broken.

**What this PRD adds:** a fourth process, a tab per process with its own
pie charts and a flowchart alternative, and a fix for the unit-switch bug.

### The four processes, side by side

| Process (new title) | Steps | Default total time |
|---|---|---|
| Agile mit Menschen | 19 | 3,880 min (~8.1 Arbeitstage) |
| Agile mit KI | 19 | 2,970 min (~6.2 Arbeitstage) |
| KI-Prozess mit Feedback | 7 | 290 min (~4.8 Stunden) |
| KI-Prozess vollautomatisch | 2 | 25 min |

Note the story in row 2: even though every AI-coding work step in "Agile
mit KI" drops to 5 minutes, total time barely changes (3,880 → 2,970 min,
a ~23% drop). Waiting eats 2,880 of those 2,970 minutes — ~97%. That is
the intended finding, not a data error. Call this out to reviewers and
developers so nobody "fixes" it by shortening the waits.

## Requirements

### R1 — Four processes: rename and restructure

Rename the three existing processes and add a fourth. Tab order matters —
this is also the order the four processes appear everywhere on the page.

| Order | Process | Title (was) | Steps |
|---|---|---|---|
| 1 | menschlich | **Agile mit Menschen** (was "Menschlich") | 19 (was 23 — steps 17, 18, 22, 23 deleted, rest renumbered) |
| 2 | agileKi (new) | **Agile mit KI** | 19 (new — copy of row 1's labels) |
| 3 | halbautomatisch | **KI-Prozess mit Feedback** (was "Halbautomatisch") | 7 (was 6, one new step) |
| 4 | vollautomatisch | **KI-Prozess vollautomatisch** (was "Vollautomatisch") | 2 (unchanged) |

**"Agile mit KI"** is a new process. It reuses the 19 step labels from
"Agile mit Menschen" unchanged. The point: the human agile ceremony stays
exactly the same. Only the coding work becomes AI work, and AI is fast.

**"KI-Prozess mit Feedback"** keeps the human-feedback step added earlier:
step 2 is the AI drafting the ticket, step 3 is a human giving the AI
feedback on it, before the ticket goes to the AI for implementation. The
process stays 7 steps.

Priority: High
Reason: The whole page's story depends on these four processes and their
exact numbers.
Acceptance:
- All four tabs show the titles in the table above, in that order.
- "Agile mit KI" has the same 19 step labels as "Agile mit Menschen".
- "KI-Prozess mit Feedback" has 7 steps, with the human-feedback step in
  position 3.
- Saving, loading, and switching between saved Szenarien works for all
  four processes without data loss.
- The system rejects a saved process whose step count does not match its
  process (19 / 19 / 7 / 2).

### R1a — Default durations (must match exactly)

**Agile mit Menschen** and **Agile mit KI** share the same 19 step labels
and the same wait times. Only the work time per step differs — and step 1
("Auslöser") is 0 in both, because a trigger event is not work. Steps 17,
18, 22, and 23 from the earlier 23-step list were deleted (both release
steps and one PR review/re-review pair) and the rest renumbered — the
process is now 19 steps. The table also carries the role for the
BA/Dev/Tester pie (see R3).

| # | Step | Work: Agile mit Menschen (min) | Work: Agile mit KI (min) | Wait after step (min) | Role |
|---|---|---|---|---|---|
| 1 | Auslöser: Anfrage oder Fehler | 0 | 0 | 120 | – |
| 2 | BA analysiert die Situation | 60 | 5 | 120 | BA |
| 3 | BA bespricht mit Entwickler | 30 | 5 | 120 | BA |
| 4 | BA schreibt Ticket | 60 | 5 | 960 | BA |
| 5 | Team bespricht Ticket im Refinement; Ticket → „Bereit" | 30 | 5 | 480 | BA |
| 6 | Entwickler A übernimmt Ticket, startet Arbeit | 15 | 5 | 0 | Dev |
| 7 | Entwickler A beendet Arbeit, testet | 240 | 5 | 30 | Dev |
| 8 | Entwickler A erstellt PR, setzt Ticket auf „In Review" | 30 | 5 | 120 | Dev |
| 9 | Entwickler B reviewt PR, hat Kommentare | 60 | 5 | 120 | Dev |
| 10 | Entwickler A bearbeitet Kommentare, bittet um Re-Review | 60 | 5 | 120 | Dev |
| 11 | Entwickler B genehmigt PR | 30 | 5 | 30 | Dev |
| 12 | Entwickler A setzt Ticket auf „Abnahmetest" | 15 | 5 | 240 | Dev |
| 13 | Tester testet, fordert Änderungen, setzt Ticket zurück | 120 | 5 | 60 | Tester |
| 14 | Entwickler A übernimmt Ticket erneut, startet Arbeit | 15 | 5 | 0 | Dev |
| 15 | Entwickler A beendet Arbeit, testet | 120 | 5 | 30 | Dev |
| 16 | Entwickler A aktualisiert PR, setzt Ticket auf „In Review" | 20 | 5 | 240 | Dev |
| 17 | Entwickler B genehmigt PR erneut | 20 | 5 | 30 | Dev |
| 18 | Entwickler A setzt Ticket auf „Abnahmetest" | 15 | 5 | 60 | Dev |
| 19 | Tester bestätigt, setzt Ticket auf „Bereit für Deployment" | 60 | 5 | – (last step) | Tester |

**KI-Prozess mit Feedback** — still 7 steps; steps 2 and 3 reordered (the
AI drafts the ticket first, then the human gives feedback on it), and
step 7's label is shortened (dropped ", deployed" — this process no
longer claims to deploy):

| # | Step | Work (min) | Wait after step (min) |
|---|---|---|---|
| 1 | Auslöser: Anfrage oder Fehler | 0 | 5 |
| 2 | KI schreibt Ticket, weist Mensch zu | 5 | 60 |
| 3 | Mensch gibt KI Feedback zur Anfrage | 15 | 60 |
| 4 | Mensch weist Ticket an KI zur Umsetzung | 15 | 5 |
| 5 | KI analysiert, beginnt Code, braucht Input, weist Mensch zu | 10 | 60 |
| 6 | Mensch beantwortet Fragen, weist Ticket an KI | 30 | 5 |
| 7 | KI analysiert Antwort, schreibt Code, testet | 20 | – (last step) |

Pattern: wait before a human step = 60 min. Wait before an AI step = 5 min.

**KI-Prozess vollautomatisch** — still 2 steps; step 2's label is
shortened (dropped "und deployed" — was "KI schreibt Ticket, Code, Tests
und deployed"):

| # | Step | Work (min) | Wait after step (min) |
|---|---|---|---|
| 1 | Auslöser: Anfrage oder Fehler | 0 | 5 |
| 2 | KI schreibt Ticket, Code und Tests | 20 | – (last step) |

Priority: High
Reason: These numbers carry the page's whole argument. Getting one wrong
changes the story the calculator tells.
Acceptance:
- Every value in the four tables above matches the stored default exactly,
  for every step, work and wait.
- Sums match: Agile mit Menschen = 3,880 min. Agile mit KI = 2,970 min.
  KI-Prozess mit Feedback = 290 min. KI-Prozess vollautomatisch = 25 min.
- For both agile processes, the work total (Pie A's work slice) equals
  the sum of the BA + Dev + Tester role split (Pie B's total): 1,000 min
  for Agile mit Menschen, 90 min for Agile mit KI (18 steps × 5 min,
  since step 1 has 0 work). This is what keeps Pie A and Pie B consistent
  with each other (see R3).

### R2 — Four tabs replace the hero reveal

Remove the current hero "reveal" narrative: the click-to-reveal CTA
buttons that unlock Menschlich, then Halbautomatisch, then Vollautomatisch
one at a time. Replace the reveal mechanic with a tab strip: one tab per
process, in the R1 order.

Keep a short static intro above the tabs — a title and a one-line
subtitle stating what the page shows. No CTA buttons, no step-by-step
unlocking. Everything below the intro is the tab strip.

Each process tab shows, top to bottom:
- The process title and its total duration.
- Its horizontal Arbeit/Warten bar (today's style), as the default view.
- A button to switch to the flowchart view for this process (R4).
- Its pie chart(s) (R3).
- Its "Schritt-Zeiten" step-time form — the same input fields that exist
  today, but scoped to this one process only.

Below the four tabs, in its own section, keep the existing "compare all
processes on one shared scale" bar chart, extended to show all four
processes side by side.

Below that, in its own card, keep scenario save/load/delete (Szenarien),
working exactly as it does today. Loading a saved Szenario must update
all four tabs; saving must capture all four processes.

**Avoid two competing tab strips.** Today the "Schritt-Zeiten" step-time
form already has its own 3-tab strip (one tab per process). Do not keep
that as a second, separate tab strip next to the new 4 process tabs — two
tab strips selecting "the same process" in two places will confuse users.
Instead: the new process tabs are the only navigation. Each process tab
shows that one process's Schritt-Zeiten form inline (no second tab strip
needed, since the outer tab already picked the process).

Priority: High
Reason: Users currently can't jump to a process or compare pies and views
side by side. The hero reveal is a one-time story, not a working tool.
Acceptance:
- A short static title + subtitle sits above the tabs. No click-to-reveal
  CTA buttons remain anywhere on the page.
- The page shows exactly one tab strip with 4 tabs, titled per R1.
- Selecting a tab shows that process's bar, pie(s), flowchart button, and
  step-time form — nothing else is duplicated in a second tab strip.
- The 4-way comparison chart sits in its own section below the tabs, and
  the Szenarien card sits below that.
- Scenario save/load/delete still works and updates all four processes.
- No leftover copy references the old titles ("Menschlich",
  "Halbautomatisch", "Vollautomatisch") anywhere on the page.

### R3 — Pie charts under each chart

Every process tab gets at least one pie chart below its bar. Some tabs get
two. Pie A always has exactly 2 slices. Pie B, where it appears, always
has exactly 3 slices — never one slice per step.

**Pie A — Arbeitszeit vs. Wartezeit (all 4 tabs, 2 slices).** Shows the
split between total working time and total waiting time for that
process. Caption: "Arbeit vs. Warten".
- For "KI-Prozess mit Feedback" and "KI-Prozess vollautomatisch", label the
  work slice "KI-Arbeitszeit" — these processes are AI-driven end to end.
- For "Agile mit Menschen" and "Agile mit KI", label the work slice
  "Arbeitszeit" — a human/AI mix, broken down further in Pie B.
- Colors: reuse the existing work color (#264892) for the work slice and
  a solid tan color (#cf944f) for the wait slice. Pies use solid fills
  only — no diagonal hatch pattern; the hatch stays a bar-chart-only
  convention.

**Pie B — Work split by role (only "Agile mit Menschen" and "Agile mit
KI", 3 slices).** Shows how the total work time splits across BA,
Entwickler (Dev), and Tester, using the fixed role map in R1a's table
(column "Role"). Step 1 has 0 work minutes and no role — it contributes
nothing to Pie B. Caption: "Arbeitsverteilung nach Rolle", with a note
next to it stating Pie B's total equals only Pie A's work slice, not the
whole process (waiting time is not part of Pie B).
- Colors: 3 fixed, named colors — one each for BA, Dev, Tester — that do
  not collide with the app's existing success/danger semantic colors
  (green/red). The same 3 colors mean the same 3 roles on both agile
  tabs.

**Legends are always visible, not hover-only.** Each pie shows its legend
directly next to or below the chart, listing every slice's label, exact
minutes, and percentage. This is required, not optional: "Agile mit KI"'s
work slice is ~3% of its pie (90 of 2,970 min) — too thin to read or tap
reliably without a legend.

**Empty and near-empty pies must have a defined look.** If a process's
total is 0 (all fields at 0), the pie renders a defined empty state —
a plain empty/grey circle with a "keine Daten" label — never a broken or
NaN-sized slice. If one slice is 100% of the total, that slice renders as
a full circle, not a missing or zero-width shape.

Priority: High
Reason: Stakeholders want to see who spends the time, not just how much.
Acceptance:
- Every one of the 4 tabs shows Pie A (2 slices), correctly split into
  work vs. wait minutes, matching the totals in R1a.
- Only the 2 agile tabs additionally show Pie B (3 slices).
- Pie B's three slices (BA + Dev + Tester) sum to the same total minutes
  as Pie A's work slice, for both agile processes: 1,000 min for Agile
  mit Menschen, 90 min for Agile mit KI.
- Every pie shows an always-visible legend with exact minutes and percent
  per slice, and a caption per the names above.
- Pie A uses #264892 (work) and a solid #cf944f (wait), no hatch. Pie B
  uses 3 fixed colors, identical across both agile tabs, distinct from
  Bootstrap success/danger colors.
- A zero-total process shows a defined empty state, not NaN or a broken
  shape. A 100%-single-slice process renders as a full circle.

### R4 — View switcher: Balken ↔ Flussdiagramm

Add a button on each process tab that toggles between two views of that
process:
- **Balken** (default, current style): the horizontal Arbeit/Warten bar.
- **Flussdiagramm** (new): the same steps as connected boxes, left to
  right. Each box has a fixed width and height. Each box shows the step
  number and a short label; a long label is truncated in the box, with
  the full label available on hover/focus (tooltip). The box also shows
  its work time and the wait time that follows it.
- On narrow viewports, the Flussdiagramm sits inside a horizontally
  scrolling container instead of wrapping to more rows — for the 19-step
  processes, forced wrapping produces an unreadable wall of boxes. A
  scroll container keeps each box a readable, fixed size.

**Per-box accessibility.** Each step box is individually focusable and
carries its own accessible label (step number, short label, work time,
and the wait time that follows it) — the same per-segment pattern the
existing bar chart already uses (each work/wait segment is its own
focusable, labeled element). One chart-level description is not enough;
every box needs its own.

Priority: Medium — but the effort for the 19-step processes ("Agile mit
Menschen", "Agile mit KI") is bigger than a typical Medium toggle. A
19-box scrolling flowchart with per-box focus and tooltips is closer to a
small feature in its own right; plan and estimate it accordingly.
Reason: Some users read a flow of boxes faster than a proportional bar,
especially for processes with many steps.
Acceptance:
- Each process tab has one toggle button. Default view on tab open is
  Balken.
- Clicking the toggle swaps to Flussdiagramm and back, without losing any
  entered step values.
- The toggle is reachable and operable by keyboard alone (Tab to focus,
  Enter/Space to activate).
- Flussdiagramm boxes have a fixed width and height; long labels truncate
  with the full text available on hover/focus.
- On a narrow viewport, the Flussdiagramm scrolls horizontally inside its
  own container instead of wrapping into unreadable rows.
- Every box is its own focusable element with its own aria-label carrying
  step number, label, work time, and following wait time.
- Both views expose the same information to screen readers (see
  Non-Functional Requirements).

### R5 — Fix unit conversion in step-time fields

Today, changing a step's unit dropdown (Minuten/Stunden/Tage) leaves the
number unchanged, silently changing the real duration. Fix this: changing
the unit must convert the number so the real duration stays the same.

Example: a field holds `240` with unit `Minuten` (240 minutes). User
switches the unit to `Stunden`. The field must now show `4` (240 minutes =
4 hours) — same real duration, new unit. Switching that `4 Stunden` to
`Tage` must show `0.5` (4 hours = half a workday of 8 hours / 480
minutes).

This applies to every value field in the step-time forms — work time and
wait time — for all four processes.

**Rounding rule:** round the converted, displayed number to at most 2
decimal places. Do not show long decimal strings like `3.9999999`.

**Loading a Szenario must not trigger this conversion.** Loading a saved
Szenario always sets a field's unit to Minuten and shows the stored
minutes directly — it never runs the unit-switch conversion logic. The
conversion only fires when a user actively changes a field's unit
dropdown themselves.

**The value field's allowed range must scale with the unit.** The current
maximum (479,520) is a minutes number — 999 Arbeitstage. That same 999-day
ceiling must still be the real limit no matter which unit is showing:
7,992 when the field shows Stunden, 999 when it shows Tage — not 479,520
in every unit, which would let someone enter "479,520 Tage" (over 1,300
years). The minimum stays 0 in every unit.

Priority: High
Reason: This is a live bug. Users will hit it the first time they touch a
unit dropdown, and it silently corrupts their numbers.
Acceptance:
- Switching a field's unit converts its displayed number so the real
  duration is unchanged (240 Minuten → 4 Stunden → 0.5 Tage, and back).
- The process total shown on screen does not change just because one
  field's unit was switched (only the displayed number and unit change).
- Converted numbers round to at most 2 decimal places — no long strings
  of decimals like `3.9999999`.
- Switching units repeatedly (Minuten → Stunden → Tage → Minuten) returns
  to a value within rounding tolerance of the original number.
- Loading a saved Szenario shows every field in Minuten with the stored
  minute value, unchanged by the conversion logic.
- A field's maximum accepted value changes with its unit, so the real
  ceiling stays fixed at 999 Arbeitstage (479,520 minutes) regardless of
  which unit is currently selected.

## Special Instructions

- **The "Agile mit KI" result is supposed to look unimpressive.** Total
  time only drops ~23% versus "Agile mit Menschen" (3,880 → 2,970 min)
  because waiting, not coding, is the bottleneck. Do not shorten "Agile
  mit KI"'s wait times to make the improvement look bigger — that defeats
  the point of adding this process.
- **Comparison view.** The existing "compare all processes on one shared
  scale" bar chart (today comparing 3 processes) extends to all 4
  processes. It lives in its own section below the four tabs, not inside
  any one tab.
- **"Time saved vs. baseline" framing**, if kept, should keep using "Agile
  mit Menschen" as the baseline — it is still the realistic as-is process.
- **Static intro stays, click-to-reveal story goes.** Remove the
  click-to-reveal CTA buttons ("Was kostet wie viel Zeit?" and similar)
  entirely — the four tabs are now the way to explore each process. Keep a
  short static intro above the tabs: a title and a one-line subtitle
  stating what the page shows (for example: "Ein Ticket bis in
  Produktion" / "Vier Wege, ein Ziel — vergleiche Arbeitszeit,
  Wartezeit und Rollen"). No CTA buttons, no step-by-step unlocking.

### Existing databases: this is a real migration, not just new-table setup

The app today only creates tables that do not exist yet; it never changes
a table that is already there. That is not enough for this change —
databases already running in local dev and in production already have a
scenario table and an already-seeded "Standard-Szenario" row. Two things
must happen on top of that, and both must be safe to run repeatedly:

- **Add the fourth process's column to every existing database, not just
  new ones.** New databases get the new column for free when their table
  is first created. Existing databases need an explicit, repeat-safe step
  that adds the column and backfills every existing row's new column with
  the standard "Agile mit KI" defaults (R1a) — so no row is ever left with
  missing data.
- **Update the seeded "Standard-Szenario" row to the new numbers.** That
  row already exists in every already-provisioned database. A seed step
  that only inserts a row if it's missing will never touch an existing
  one. Add an explicit, repeat-safe update step that rewrites the
  Standard-Szenario row to the new R1a numbers for all four processes on
  every startup — so local and production databases both show the
  corrected totals, not just freshly created ones.

### Loading old saved Szenarien: fall back per process, never patch by index

A saved Szenario can be older than this change in a few ways: it may have
no data at all for "Agile mit KI" (the process didn't exist yet); its
"KI-Prozess mit Feedback" data may still have the old 6-step shape (before
the feedback step was added); or its two agile processes may still have
the earlier 19-step revision's 23-step shape (before steps 17, 18, 22, 23
were deleted). All of these must load without error, and none may
silently corrupt data.

The rule: when loading any saved Szenario, check each of the four
processes separately. If a process's stored work/wait array length does
not match that process's current expected step count (19 / 19 / 7 / 2),
do **not** patch the stored values into the form by index — index-patching
a 23-element array into the new 19-slot form (or a 6-element array into
the 7-slot form) would silently shift steps onto the wrong label.
Instead, fall back to that process's standard default durations (R1a) for
the whole process. A Szenario with no data at all for "Agile mit KI"
falls back the same way. This check runs per process — a Szenario can
have three matching processes and only one reset to defaults.

### Decisions (previously open, now locked in)

1. The Szenarien (save/load/delete) card sits in its own card below the
   four tabs. Its behavior is unchanged from today.
2. The Balken/Flussdiagramm toggle always resets to Balken when a tab
   opens or a Szenario loads. The choice is not saved or persisted
   anywhere.
3. Old saved Szenarien with mismatched or missing process data fall back
   to standard defaults per process, on read — see the loading rule
   above. This never blocks loading and never shows an error.

## Implementation Approach

High-level only — the how-to-build plan is a separate document.

- Add "Agile mit KI" as a fourth process definition, alongside the
  existing three, using the same per-step work/wait data shape already in
  use.
- Restructure the page from "hero narrative first" to "tabs first": four
  tabs, one per process, each bundling its bar, its pie(s), its
  Balken/Flussdiagramm toggle, and its own step-time form.
- Extend the saved-scenario record so it carries data for all four
  processes end to end — from the save/load screens through validation
  and storage to the default seed data — mirroring how the existing three
  processes are already handled today, plus the real migration steps for
  already-existing databases described under Special Instructions (new
  column + backfill, and an update to the Standard-Szenario row).
- Change unit-switching from "relabel the number" to "recompute the
  number, so the real duration is unchanged," and make the value field's
  validation ceiling scale with the selected unit (see R5).
- Add a small, reusable pie-chart building block alongside the existing
  bar/segment chart helpers, so pies match the page's current visual
  style without introducing a new charting library.
- Drive all four processes from one process-keyed structure — one list of
  processes, looped over to build signals, form groups, and template
  blocks — instead of four hardcoded copies of the same signals/form-
  group/HTML block. The current three processes are already close to
  hardcoded copies; adding a fourth without this refactor multiplies the
  copy-paste risk and makes it easy for the 4-way logic to drift out of
  sync.

## Test Strategy

**Backend (Playwright):**
- Saving and loading a Szenario round-trips all four processes, including
  the new one, without data loss.
- Saving a process with the wrong step count (not 19 / 19 / 7 / 2) is
  rejected.
- The default seed still loads successfully and includes the fourth
  process with its default values.
- Loading a pre-existing Szenario with old-shape data (a 23-step agile
  process, a 6-step "KI-Prozess mit Feedback", or no "Agile mit KI" data
  at all) still loads without error and falls back to standard defaults
  for the mismatched process only (see the loading rule under Special
  Instructions).
- Existing DB gains the 4th column and the Standard-Szenario reflects the
  new default totals after startup — checked against a database seeded
  before this change, not only a fresh one.

**Frontend (Jasmine):**
- The unit-conversion helper converts Minuten ↔ Stunden ↔ Tage correctly,
  rounds to at most 2 decimal places, and does not drift the underlying
  minutes beyond rounding tolerance, for the exact examples in R5.
- Loading a Szenario sets fields to Minuten without triggering the
  unit-conversion logic (no double conversion on load).
- The BA/Dev/Tester role-split aggregation sums correctly for both agile
  processes and matches Pie A's work total (1,000 min / 90 min).
- Pie and flowchart geometry/segment helpers compute correct proportions
  for a range of inputs, including a zero-total process and a single
  100%-slice process.
- All four processes' default durations are wired up correctly and match
  the tables in R1a.

## Non-Functional Requirements

- Keep to the existing frontend conventions: Angular standalone
  components, signals, reactive forms, control-flow blocks with `track`.
  Use Bootstrap/ng-bootstrap for the tab strip and toggle button.
- Do not add a new charting library for the pies. Build them the same way
  the existing bar/segment charts are built (inline SVG), for visual
  consistency and to avoid new dependencies.
- Backend changes follow existing conventions: async database calls,
  ISO-8601 dates, and the same validation/error-response patterns already
  used for the other three processes.
- Every chart (bar, pie, flowchart) needs a text alternative — an aria
  label, title/description, or equivalent — so screen-reader users get the
  same numbers as sighted users.
- The Balken/Flussdiagramm toggle and any new interactive control must be
  reachable and usable by keyboard alone.
- The component must not hold four hardcoded, parallel copies of
  signals, form groups, or template blocks — one per process. Drive all
  per-process state and markup from one process-keyed loop, so adding or
  changing a process cannot silently miss a spot.
- Existing entity access rules apply unchanged: the calculator page
  requires a logged-in user, same as today.

## Success Criteria

- [ ] Four process tabs exist, titled and ordered per R1, each showing its
      own bar, pie(s), flowchart toggle, and step-time form.
- [ ] "Agile mit KI" reuses the 19 "Agile mit Menschen" labels, has
      work = 0 min on step 1 (Auslöser) and 5 min on every other step, and
      reuses the same 18 wait values.
- [ ] "KI-Prozess mit Feedback" has 7 steps, with the human-feedback
      step in position 3, and the values in R1a.
- [ ] "KI-Prozess vollautomatisch" keeps its 2 steps with a 5-minute wait.
- [ ] All default numbers match the tables in R1a exactly; totals are
      3,880 / 2,970 / 290 / 25 minutes.
- [ ] Pie A's work slice equals Pie B's BA+Dev+Tester total for both
      agile processes (1,000 min and 90 min).
- [ ] Every process tab shows an Arbeitszeit-vs-Wartezeit pie; the two
      agile tabs additionally show a BA/Dev/Tester work-split pie that
      sums correctly.
- [ ] The Balken/Flussdiagramm toggle works on every tab, keyboard-
      reachable, without losing entered data.
- [ ] Switching a field's time unit converts the number so the real
      duration is unchanged; the process total does not shift from a unit
      switch alone.
- [ ] The fourth process is saved and loaded through the same Szenario
      save/load/delete flow as the other three, with no data loss.
- [ ] Existing saved Szenarien (created before this change) still load
      without error.
- [ ] Backend and frontend automated tests listed under Test Strategy all
      pass.
