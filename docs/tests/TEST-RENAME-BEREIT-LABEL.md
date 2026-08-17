# Test Case: RENAME-BEREIT-LABEL

## Setup
- Start: `./start.sh`
- Stop: `Ctrl+C`
- URL: `http://localhost:7200`

**Note:** This is a manual browser-based E2E check that runs separately from and in addition to the automated Angular unit test suite (`cd frontend && npx ng test --configuration=ci`), which already covers this rename via assertions in `ticket-board.component.spec.ts`.

## Scenarios
### 1. Ticket board shows "Bereit" instead of "Zu bereit"
- Navigate to: `/admin/tickets` (log in as `admin` / `admin123` if prompted)
- Action: none — just load the page
- Verify: use browser_snapshot or browser_take_screenshot to inspect the TODO KPI tile label and the TODO column header
- Expected: both show "Bereit"; "Zu bereit" does not appear anywhere on the page; the KPI count and column ticket list are unaffected
