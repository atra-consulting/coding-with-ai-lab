# Tools

Diese App hat drei Tools für Training und Demo. Alle laufen lokal. Starte die App mit `./start.sh`. Dann öffne die URL im Browser.

Login-Daten stehen in der [README](../README.MD#demo-login).

## Produktivitäts-Rechner

**URL:** <http://localhost:7200/produktivitaet/rechner>
**Zugang:** Jeder eingeloggte Nutzer.

**Titel in der App:** „Ein Ticket, vier Prozesse".

Der Rechner vergleicht vier Wege, ein Ticket abzuarbeiten:

1. **Agile mit Menschen** — klassisches Team, nur Menschen.
2. **Agile mit KI** — Team mit KI-Unterstützung.
3. **KI-Prozess mit Feedback** — KI arbeitet, Mensch prüft.
4. **KI-Prozess vollautomatisch** — KI arbeitet allein.

Für jeden Weg zeigt der Rechner:

- **Arbeitszeit** — wie lange jemand aktiv arbeitet.
- **Wartezeit** — wie lange das Ticket liegt.
- **Rollen** — wer welchen Schritt macht.

Balken stellen die Zeiten dar. So siehst du sofort: KI spart Zeit. Du kannst eigene Szenarien anlegen und die Zahlen anpassen.

**Wozu?** Das Tool zeigt den Produktivitätsgewinn durch KI. Gut für Vorträge und Workshops.

## Agent-Task-Dashboard

**URL:** <http://localhost:7200/admin/agent-tasks>
**Zugang:** Nur Admin (`admin` / `admin123`).

Das Dashboard zeigt die `agent_task`-Tabelle. Ein autonomer Claude-Agent in CI arbeitet diese Tasks ab.

- **Quellen:** `EMAIL`, `GITHUB_ISSUE`, `APP_LOG`, `ERROR_REPORT`.
- **Lebenszyklus:** `OPEN → IN_PROGRESS → DONE | REJECTED`.
- Der Agent zieht die nächste Task. Er entscheidet: lösen oder ablehnen. Er setzt sie um und merged.

**Wozu?** Das Tool zeigt einen autonomen Agenten im „Software-Factory"-Betrieb. Der Skill dahinter: [`/do-factory-automatic`](SKILLS.md#do-factory-automatic--autonom-ohne-mensch).

Details zur API: [docs/API-TASKS.md](API-TASKS.md).

## Ticket-Board

**URL:** <http://localhost:7200/admin/tickets>
**Zugang:** Nur Admin (`admin` / `admin123`).

Ein Kanban-Board. Ein einfaches Ticketsystem für das Software-Factory-Training.

- **Fünf Spalten:** `DEFINITION` („Definition"), `TODO` („Zu bereit"), `IN_PROGRESS`, `ON_HOLD`, `DONE`.
- **Owner:** Jedes Ticket gehört `AI` oder `HUMAN`.
- Neue Tickets starten bei `HUMAN` und `DEFINITION`. Ein Mensch verfeinert das Ticket. Dann gibt er es an die KI ab.
- Der Agent arbeitet `AI`-Tickets. Er kann eine Frage stellen. Dann geht das Ticket zurück an den Menschen.
- Menschen arbeiten den Rest. Per Drag-and-Drop verschiebst du Tickets zwischen den Spalten.

**Wozu?** Das Tool zeigt die Zusammenarbeit von Mensch und KI an Tickets.

Details zur API: [docs/API-TICKETS.md](API-TICKETS.md).
