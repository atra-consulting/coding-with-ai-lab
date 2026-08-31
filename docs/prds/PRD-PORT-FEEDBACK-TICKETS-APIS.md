# PRD: PORT-FEEDBACK-TICKETS-APIS

## Summary

### Business Summary

Today the app collects user feedback in one place and tracks work in a Kanban ticket board in another. Nothing connects the two. Once a feedback item becomes a ticket, nobody can see which feedback started it, and nobody can see whether a feedback item was ever acted on. This change links the two — a ticket shows the feedback that spawned it, and a feedback item shows the ticket it became. It also adds a small "ready to build" marker that automated ticket-writing flows use, and a visible ticket number on every board card. It also carries one small, unrelated visual fix requested alongside this work: the wait-time color in the Rechner (calculator) tool changes to match the sibling app.

### Technical Summary

Port of an already-shipped feature from the sibling repo `coding-with-ai-demo`. Adds two new `ticket` fields — a `fullyReady` flag and a nullable `agentTaskId` link — both set once at creation, with a safe upgrade path for existing databases. A feedback item's ticket reference is a derived field, computed cheaply via a paginated query, never stored. Coupled in scope: the backend test suite moves to its own database file, so tests stop wiping the shared dev database. Also in scope, at the user's request: the Rechner color update and one missing spec sentence, both described under REQ-012 below.

---

## Source

This is a **port**, not a new design. The feature already exists, ships, and passes tests in the sibling repository at `/Users/karsten/workspaces/fh/repos/coding-with-ai-demo`.

That lowers the risk. The shape of the solution is known. The edge cases were already found and fixed there (the migration ordering trap, the atomic-write requirement, the derived-field re-fetch). We copy behavior, not guesswork.

The port covers the app feedback items, the ticket system, and their APIs. Skills and agent definitions in the sibling repo are **not** part of this port.

---

## Problem Statement

The CRM training app has two work queues that never talk to each other.

**App feedback** arrives as `agent_task` rows — from email, GitHub issues, application logs, and error reports. An admin reviews them at `/admin/agent-tasks`.

**Tickets** live on a Kanban board at `/admin/tickets`. A human or an automated flow files a ticket, refines it, hands it to the AI, and the AI works it.

The natural path is: feedback comes in → someone turns it into a ticket → the ticket gets built. But nothing records that step.

Three concrete problems:

1. **No trace back.** Open a ticket. You cannot tell which piece of user feedback caused it. The original wording, the reporter's context, the error payload — all lost.
2. **No trace forward.** Open a feedback item. You cannot tell whether it turned into a ticket, or whether it was quietly dropped. An admin has no way to answer "did we do anything about this?"
3. **No readiness signal for automation.** An automated ticket-writing flow can file a well-specified ticket or a thin one. Nothing marks the difference, so a downstream agent cannot tell "this is ready to build" from "this still needs a human".

A fourth, separate problem makes the fix risky to test: **the backend test suite runs against the live development database.** Running the tests today resets the ticket board to its 12 seed tickets and destroys any ticket a person or an agent was working on. This change adds several new ticket tests, which makes that damage more frequent.

---

## Requirements

### REQ-001 — A ticket remembers the feedback it came from

A ticket can carry a reference to exactly one app-feedback item. The reference is set **once**, when the ticket is created. No later action changes it or clears it.

In practice only automated callers set it. The human "Neues Ticket" form does not offer the field.

**No new access restriction.** Any caller already authorized to reach the create API may set this field — machine token, loopback, or admin session. The user interface simply never exposes it.

### REQ-002 — A feedback item shows the ticket it became

Every app-feedback item reports the ticket that points back at it. This is **derived**, never stored — the system looks it up on read. No extra column on the feedback item, no risk of the two sides disagreeing.

If several tickets point at the same feedback item, the **newest** ticket wins. If none point at it, the feedback item reports "no ticket".

The lookup applies everywhere a feedback item is returned: the single-item read, the paginated admin list, and the machine-facing claim endpoint.

### REQ-003 — A "fully ready" marker on a ticket

A ticket carries a yes/no marker: is this ticket complete enough to build without further human input?

- Defaults to **no** for every ticket.
- Set at creation time only.
- **Not shown anywhere in the user interface.** It is a signal between automated flows, deliberately invisible to humans on the board and the detail page.

Same rule as REQ-001: any caller already authorized to reach the create API may set it. No new access restriction. The create dialog just never offers it.

### REQ-004 — A human comment can revoke "fully ready"

When someone adds a comment to a ticket, they may also reset the "fully ready" marker back to **no**. Meaning: "I looked at this, it is not as complete as claimed."

This is independent of the existing "hand back to the AI" action on the same call. Either can happen alone. Both can happen together.

**Both must succeed or both must fail.** If the hand-back is rejected because the ticket is in the wrong state, nothing is written at all — no comment, no marker change.

Resetting an already-reset marker is harmless and produces no error.

### REQ-005 — Bad links are rejected at creation

If a create request names a feedback item that does not exist, the request fails with a clear validation error naming the offending field. Same for a value that is not a whole number.

A create request with **no** feedback reference succeeds as it does today, and the ticket simply has no link.

### REQ-006 — Deleting a feedback item does not break the ticket

If a feedback item disappears, the ticket survives. Its link becomes empty. The ticket is never deleted along with it.

Likewise, if a ticket is deleted, the feedback item simply reports "no ticket" again.

Note: today no API and no screen deletes a feedback item. This is defensive database-level safety for a future delete path, not a behavior a user can trigger now.

### REQ-007 — Links are visible in the admin UI

- **Ticket detail page:** when the ticket has a link, show **"App-Feedback #<id>"** as a clickable link to that feedback item's page. Hide the row entirely when there is no link.
- **Feedback detail page:** when the feedback item has a ticket, show **"Ticket #<id>"** as a clickable link to that ticket's page. Hide the row entirely when there is none.

The "fully ready" marker stays invisible in both places (see REQ-003).

### REQ-008 — Ticket number badge on board cards

Every card on the Kanban board shows a small badge with its ticket number (`#7`). All five columns. Small, low-contrast, secondary to the title.

Bundled with this feature because it ships together in the source repo and costs almost nothing.

### REQ-009 — Existing databases upgrade in place

Databases that already exist — a developer laptop, the shared cloud database — must pick up both new fields on the next startup, without a manual reset and without losing data.

The upgrade must be safe to run repeatedly, and safe when two application instances start at the same time against the same database.

### REQ-010 — Isolate the backend test database *(coupled fix, in scope)*

**This is not part of the feature. It is a known defect that this feature would make worse, so we fix it in the same change.**

Today the backend test suite runs against the shared development database. Every test run wipes the ticket board back to its 12 seed tickets. Anyone — human or agent — with work in progress on the board loses it.

Required: the backend test suite runs against its **own separate database file**, deleted and rebuilt fresh at the start of each run. The development database is never touched. Running against the cloud database (CI) is unaffected.

No change to ignored-files configuration is needed — the data folder is already excluded from version control.

### REQ-011 — Specifications stay accurate

Update the written specs so they match the shipped behavior:

- **Tickets API reference** — document both new ticket fields and the two changed request contracts. Also correct a pre-existing error in this document: it claims the ticket seed data only loads on an empty database. It does not — it loads on every startup and skips rows that already exist.
- **Database spec** — the two new columns and the new index.
- **Backend spec** — the new request fields and the derived field on the feedback item.
- **Testing spec** — the new test files and the separate test database.
- **Domain spec** — no change. Confirmed.

### REQ-012 — Rechner "Wartezeit" color update *(scope added by user request)*

The wait-time color in the Rechner's process-comparison pie chart changes from a warm orange to a muted gold, matching the sibling repo. Narrow and cosmetic — not a redesign.

- Color change: `#f98752` → `#cf944f`, applied everywhere "Wartezeit" (wait time) is shown — the pie-chart slice, the matching flow-chip background, and the SVG hatch-pattern stroke for the same data series.
- The old hex value also appears elsewhere in the stylesheet as the shared `.widget-card.warning` border color — that usage does **not** change. This update is scoped strictly to the Rechner wait-time visualization.
- Fix a documentation gap while touching this area: the frontend spec is missing one sentence, present in the sibling repo, describing the bar-filter "remember my last choice" behavior. That behavior **already works** in this app's code today — only the sentence describing it is missing. No behavior change, no code change for this part — just add the missing sentence.

---

## Special Instructions

### Explicitly out of scope — do not port, do not re-add later

The sibling repo differs in several other places. These are **deliberately excluded**:

1. **All skills and agent definitions** (`.claude/agents/**`, `.claude/skills/**`, and anything else under `.claude/`). The sibling repo has more of them. Not wanted here.
2. **The feedback seed data title fix** — a cosmetic English-to-German wording change on one seeded feedback item. Unrelated content edit.
3. **The broader Rechner overhaul** (tracked as `PRD-RECHNER-OVERHAUL.md` / `PLAN-RECHNER-OVERHAUL.md` in the sibling repo) beyond the single color change in REQ-012. Everything else in that overhaul is a separate, unrelated feature.
4. **AG Grid header color changes** — both the UI spec text and the actual grid styling. Pure styling drift, unrelated, even though it sits in the same stylesheet as the REQ-012 color change.

### Wording caution in the API spec

The sibling repo's spec text names a specific automation skill as the consumer of the "fully ready" marker. **That skill does not exist in this repository** and skills are out of scope. Describe the consumer generically — "an automated, headless ticket-writing flow using the machine token" — and never name a skill this repo does not have.

### Correction to the brief

The brief says the derived ticket reference is applied on the feedback item's "create" operation. This repository's feedback service has **no create operation**. The three places are: the single-item read, the paginated list, and the **claim** operation. The claim operation needs a re-read after the claim, because the claim's own return value cannot carry a derived field.

### The create-ticket modal is unchanged

Both new fields are set by automated callers only. The human "Neues Ticket" dialog needs no new inputs and no new code. No access rule changes — see REQ-001 and REQ-003.

---

## Implementation Approach

High-level, in dependency order.

**1. Database first.** Add both fields to the schema definition and to the fresh-database creation script. Then add two separate, guarded upgrade routines for databases that already exist — one per field — and call both during startup migration. Each routine checks whether the column is already there before adding it, and tolerates the case where a second instance added it a moment earlier.

The index on the link field belongs **inside** its own upgrade routine, after the column is confirmed to exist. It must not go into the shared block of index statements, because on an upgraded database that block runs before the column exists and would fail.

**2. Backend service and routes.** Extend the ticket create path to accept and validate both new fields. Extend the comment path to accept the marker-reset flag and fold it into the existing single atomic write. Extend the feedback service so all three read paths carry the derived ticket reference — with the list path paginating before the lookup runs.

**3. Test database isolation.** Change the database client to choose a separate file when running in test mode. Make the test suite's setup delete that file (and its sidecar files) before starting the backend. Make the test runner configuration set test mode for itself too, not just for the backend it spawns — test files talk to the database directly and must open the same file.

**4. Frontend.** Add the link field to the ticket model and the ticket reference to the feedback model. Add the two conditional links to the two detail pages. Add the number badge to the board cards with matching styles.

**5. Tests.** Backend API tests, backend migration tests, frontend component tests.

**6. Specs.** Update the four documents named in REQ-011.

Steps 1 through 3 gate everything else. Step 4 depends on step 2 shipping the new fields. Steps 5 and 6 follow.

---

## Test Strategy

### Backend API tests — ticket suite

**"Fully ready" marker**
- Create without the field → marker is off.
- Create with the field on → marker is on.
- Create with the field off explicitly → marker is off.
- Comment with the reset flag → marker turns off.
- Reset again on an already-off marker → still off, no error.
- Reset combined with hand-back on a valid ticket → both applied.
- Reset combined with hand-back on an **invalid** ticket → rejected, and **nothing** written: no comment added, marker unchanged.
- Unrelated updates (status change, owner change, hand-to-ai, wont-do) leave the marker untouched. Only the explicit comment-reset flag changes it.

**Feedback link**
- Create with no link → link is empty.
- Create with an explicit empty link → link is empty.
- Create with a valid feedback item → link is stored.
- Create with a feedback item that does not exist → rejected, error names the field.
- Create with a non-whole-number value → rejected, error names the field.
- The link comes back unchanged from the single read, the paginated list, the board, and the claim endpoint.
- Unrelated updates (status change, owner change, comments, done) leave the link untouched.

### Backend API tests — feedback suite

- A feedback item with a linked ticket reports that ticket.
- A feedback item with no linked ticket reports none.
- Two tickets pointing at one feedback item → the newest ticket wins.
- Delete the linked ticket → the feedback item reports none again.
- Delete the linked feedback row → the ticket survives, its link becomes empty. **Do this with a direct SQL DELETE inside the test file.** No API and no screen deletes a feedback row — there is no `DELETE /api/agent-tasks/:id`, and the reset endpoint only flips status back to `OPEN`. The database-level rule is defensive engineering with no current app-level trigger. Do not hunt for a UI or API path; there is none.
- The derived reference appears on the single read, the list, and the claim endpoint.

### Backend migration tests — one file per new field

Named to match the source repo: a "fully ready" migration spec and an "agent task id" migration spec.

- Running the upgrade twice is safe.
- On a database created **before** the field existed, the upgrade adds the field and the index in the correct order, and does not fail.

This second case is the regression guard for the ordering trap described in the implementation approach.

**Caveat on REQ-009's concurrency claim.** These tests cover sequential re-runs only. Safety for two instances starting at the same moment is verified **structurally** — by the duplicate-column guard in the upgrade routine — not by a literal concurrency test. Nobody should read a green suite as proof of tested concurrency.

### Frontend tests

- Ticket detail: shows the "App-Feedback #<id>" link when a link exists; hides it when not.
- Feedback detail: shows the "Ticket #<id>" link when a ticket exists; hides it when not.
- Board: every card in all five columns renders the number badge.
- Rechner: the four existing color-literal test assertions for the wait-time visualization update to the new hex value. No other Rechner test changes — the bar-filter persistence tests already pass unchanged, since that code is untouched.

### Regression

The full existing backend and frontend suites must still pass. The frontend build must still succeed.

---

## Non-Functional Requirements

**Data safety.** No existing data may be lost. Existing databases upgrade in place. No manual reset required for developers or for the cloud deployment.

**Idempotence.** Startup migration may run any number of times, including several instances starting at once, with the same result and no errors.

**Backward compatibility.** Every existing API request that works today keeps working unchanged. Both new request fields are optional. Every existing ticket reads back with the marker off and no link.

**Performance.** No measurable slowdown on the feedback list page as the table grows. The ticket-reference lookup must scale with the page size shown, not with the number of rows the database scans. See the plan for the specific query structure.

**Test isolation.** After this change, running the backend test suite must not modify the development database in any way.

**Consistency.** The comment endpoint's writes stay atomic — a rejected request leaves zero traces.

**Language.** All user-visible text in German, matching the rest of the admin UI.

---

## Success Criteria

1. Create a ticket through the machine API with a feedback reference. Open the ticket in the admin UI. The "App-Feedback #<id>" link appears and opens the right feedback item.
2. Open that feedback item. The "Ticket #<id>" link appears and opens the right ticket.
3. Point two tickets at the same feedback item. The feedback item shows the **newer** ticket, not the older one.
4. Create a ticket with a feedback reference that does not exist. The request is rejected with a validation error naming the field.
5. Delete a feedback item that has a linked ticket. The ticket still exists; its App-Feedback link is gone. The ticket is not deleted.
6. The "fully ready" marker appears nowhere in the user interface — not on the board, not on the ticket detail page, not in the create dialog.
7. A comment request that resets the marker **and** hands back an ineligible ticket writes nothing at all.
8. Start the app against a database created before this change. It starts cleanly, both fields are present, no data lost, no manual reset.
9. Start it twice in a row. Same result, no errors either time.
10. Every card on the Kanban board shows its number badge, in all five columns.
11. Note a ticket you moved on the board. Run the backend test suite. Re-open the board. Your ticket is exactly where you left it.
12. All backend and frontend tests pass, including the new ones. The frontend build succeeds.
13. The four specification documents match the shipped behavior, including the corrected seed-data statement.
14. None of the four out-of-scope items appear in the change.
15. Open the Rechner and compare process types. The wait-time color in the pie chart, the flow chip, and the hatch pattern all show the new muted gold (`#cf944f`), not the old orange. Nothing else in the Rechner changed.

---

## Implementierung

Branch: `port-feedback-tickets-apis-compare-demo`.

Commits (base `0531385`):

- `5ed61fe` docs: Initialize state tracking
- `d45d314` docs: Add specifications (PRD)
- `3b20ffb` docs: Add detailed plan
- `97cd6c2` feat: Update Rechner wait-time color to match sibling app
- `0bef25b` fix: Isolate backend Playwright suite onto a separate test database
- `8d2e0a5` feat: Add ticket.fullyReady and ticket.agentTaskId columns with migration
- `e3491cc` docs: Update specs for feedback-ticket link and Rechner color change
- `9ef0d02` feat: Accept fullyReady and agentTaskId on ticket create and comment endpoints
- `31da20a` feat: Add derived ticketId to agent-task reads
- `0dbef12` feat: Add feedback-ticket cross-links and ticket number badge to admin UI
- `1254fa4` test: Add backend tests for feedback-ticket link and migration functions
- `2cdf2ea` test: Add frontend tests for feedback-ticket cross-links and Rechner color
- `9fea5a2` fix: Require positive agentTaskId in ticket create schema
- `76a1d62` docs: Trim PRD to WHAT/WHY and add Implementierung section
- `f443c50` docs: Remove dangling references to deleted PRD Technical Notes section
- `d80c8f8` fix: Strengthen ticketId list assertion and add agentTaskId boundary tests

PR: not opened yet. Link goes here once available.
