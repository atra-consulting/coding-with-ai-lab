# Implementation Plan: TICKET-DETAIL-BEREIT-LABEL

## Summary
Finish the TODO-column label rename from "Zu bereit" to "Bereit" that PR #130 already applied to the ticket board. Six occurrences remain in `frontend/src/app/features/admin/tickets/ticket-detail.component.ts` — a button tooltip, a code comment, two toast messages, a getter tooltip string, and the `statusLabel()` return value that drives the status badge in the detail template. All six are literal string replacements with no logic changes. Add one new unit test asserting `statusLabel('TODO')` returns `'Bereit'`, mirroring the existing `statusLabel('DEFINITION')` test.

## Business Summary
The ticket detail page still shows the old label "Zu bereit" in several places, even though the board view was already updated to say "Bereit". This plan aligns the detail page wording with the board so users see consistent labels everywhere. No behavior changes — only text.

## Test Command
`cd frontend && npx ng test --configuration=ci`

## Tasks
### 1. Rename label occurrences in ticket-detail.component.ts
**Agent:** fe-coder
**Model:** haiku — six spelled-out, unambiguous string replacements in one file, no design decisions

- [ ] File: `frontend/src/app/features/admin/tickets/ticket-detail.component.ts`, line 185: change `title="Eigentümer auf KI setzen und nach &quot;Zu bereit&quot; verschieben"` to `title="Eigentümer auf KI setzen und nach &quot;Bereit&quot; verschieben"`
- [ ] Line 552: change `// "Nach Bereit": assign owner to AI and move to TODO ("Zu bereit").` to `// "Nach Bereit": assign owner to AI and move to TODO ("Bereit").`
- [ ] Line 565: change `this.notification.success('Ticket der KI zugewiesen und nach "Zu bereit" verschoben.');` to `this.notification.success('Ticket der KI zugewiesen und nach "Bereit" verschoben.');`
- [ ] Line 596: change `? 'Eigentümer auf "KI" gesetzt und Status auf "Zu bereit" zurückgesetzt.'` to `? 'Eigentümer auf "KI" gesetzt und Status auf "Bereit" zurückgesetzt.'`
- [ ] Line 615: change `return 'Eigentümer auf KI setzen und Status auf "Zu bereit" zurücksetzen';` to `return 'Eigentümer auf KI setzen und Status auf "Bereit" zurücksetzen';`
- [ ] Line 701: change `return 'Zu bereit';` (inside `statusLabel(status: string)`, `case 'TODO':` branch) to `return 'Bereit';`

### 2. Test Implementation
**Agent:** fe-coder
**Model:** haiku — one new test added by copying an existing adjacent test's exact pattern, no new setup or logic

- [ ] File: `frontend/src/app/features/admin/tickets/ticket-detail.component.spec.ts` — add a test asserting `statusLabel('TODO')` returns `'Bereit'`, inserted after line 728's closing brace, right below the existing `statusLabel('DEFINITION')` test, following the same structure/naming convention

## Tests
### Unit Tests
- [ ] `statusLabel('TODO')` returns `'Bereit'` (new test, mirrors existing `statusLabel('DEFINITION')` → `'Definition'` test)
- [ ] Full existing `ticket-detail.component.spec.ts` suite still passes (no assertions were pinned to the old "Zu bereit" string, so no regressions expected)
