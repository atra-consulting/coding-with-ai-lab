# Test Case: TICKET-DETAIL-BEREIT-LABEL

## Setup
- Start: `./start.sh`
- Stop: `Ctrl+C`
- URL: `http://localhost:7200`

**Note:** This is a manual browser-based E2E check that runs separately from and in addition to the automated Angular unit test suite (`cd frontend && npx ng test --configuration=ci`), which already covers the `statusLabel('TODO')` case via assertions in `ticket-detail.component.spec.ts`.

## Scenarios
### 1. Ticket detail page shows "Bereit" for a TODO ticket
- Navigate to: `/admin/tickets` (log in as `admin` / `admin123` if prompted), then open a ticket that is in the "Bereit" (TODO) column
- Action: none — just load the detail page
- Verify: use browser_snapshot or browser_take_screenshot to inspect the status badge on the ticket detail page
- Expected: the status badge shows "Bereit"; "Zu bereit" does not appear anywhere on the page; other ticket fields are unaffected

### 2. "Nach Bereit" action tooltip and toast use the new label
- Navigate to: `/admin/tickets`, open a `DEFINITION` ticket with `owner=HUMAN`
- Action: hover the "Nach Bereit" button, then click it
- Verify: use browser_snapshot to inspect the button's tooltip text before clicking, and the success toast text after clicking
- Expected: tooltip reads `...und nach "Bereit" verschieben`; toast reads `...und nach "Bereit" verschoben.`; "Zu bereit" does not appear
