# Test Case: PROZESS-BALKEN-FILTER

## Setup
- Start: `./start.sh`
- Stop: `Ctrl+C`
- URL: `http://localhost:7200`

## Scenarios

### 1. Prozessvergleich bar filter cycles
- Navigate to: `/produktivitaet/rechner`
- Action: Find the "Alle Balken" button on the Prozessvergleich card. Click it four times.
- Verify (browser_snapshot after each click): visible comparison rows (`.cmp-row`) go 4 → 1 → 2 → 3 → 4. Button label goes "Alle Balken" → "Nur Balken 1" → "Balken 1–2" → "Balken 1–3" → "Alle Balken".
- Expected: bar widths of the still-visible bars do not change (scale stays fixed). Schritt-Zeiten tabs still show all four processes.

### 2. Ticket-Board "Kürzlich geändert" toggle
- Navigate to: `/admin/tickets` (log in as admin/admin123 first)
- Action: Click the "Kürzlich geändert" button in the header.
- Verify: only tickets created or updated in the last 60 minutes remain; button label flips to "Alle". Seed tickets are old, so columns show "Keine Tickets". Click "Alle" → all tickets return, label back to "Kürzlich geändert".
- Expected: KPI summary cards keep their global totals; dragging is disabled while filtered.

### 3. New EMAIL agent task present
- Navigate to: `/admin/agent-tasks?source=EMAIL`
- Action: View the EMAIL task queue.
- Verify: a task with body "Ich möchte Notizen für eine Person anlegen." appears (id 23). Requires a backend restart so the seeder runs.
- Expected: EMAIL source now lists 7 open tasks.
