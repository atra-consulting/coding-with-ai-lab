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
- **Seed:** 23 Tasks, feste ids 1–23. Frischer Start oder `POST /reset` → **alle** stehen auf `OPEN`.
- Der Agent zieht die nächste Task. Er entscheidet: lösen oder ablehnen. Er setzt sie um und merged.

**Hinweis für Demos.** Filter nach einer Quelle, z. B. <http://localhost:7200/admin/agent-tasks?source=EMAIL>. Dann sind meist nur die **obersten zwei, drei** Einträge wirklich noch offen. Die älteren stehen zwar auch auf „Open", wurden aber in früheren automatischen Läufen (GitHub Actions) der Skills schon abgearbeitet. Für eine Demo nimmst du einen der obersten. (Auf einer frisch gestarteten lokalen App stehen dagegen alle 23 echt auf `OPEN` — dort ist noch nichts gelaufen.)

Den Skill, der eine Task zu einem Kanban-Ticket triagiert, findest du unter [`/write-ticket`](SKILLS.md#write-ticket--feedback-in-ein-neues-ticket-triagieren).

**Wozu?** Das Tool zeigt einen autonomen Agenten im „Software-Factory"-Betrieb. Der Skill dahinter: [`/do-factory-automatic`](SKILLS.md#do-factory-automatic--autonom-ohne-mensch).

Details zur API: [docs/specs/SPEC-API-TASKS.md](specs/SPEC-API-TASKS.md).

## Ticket-Board

**URL:** <http://localhost:7200/admin/tickets>
**Zugang:** Nur Admin (`admin` / `admin123`).

Ein Kanban-Board. Ein einfaches Ticketsystem für das Software-Factory-Training.

- **Fünf Spalten:** `DEFINITION` („Definition"), `TODO` („Zu bereit"), `IN_PROGRESS` („In Arbeit"), `ON_HOLD` („Wartet"), `DONE` („Erledigt").
- **Owner:** Jedes Ticket gehört `AI` oder `HUMAN`.
- **Seed:** 12 Workshop-Tickets. Läuft bei jedem Start (`INSERT OR IGNORE`, ids 1–12). `POST /reset` löscht alles und baut die 12 neu auf.
- Neue Tickets starten bei `HUMAN` und `DEFINITION`. Ein Mensch verfeinert das Ticket. Dann gibt er es an die KI ab.
- Der Agent arbeitet `AI`-Tickets. Er kann eine Frage stellen. Dann geht das Ticket zurück an den Menschen.
- Menschen arbeiten den Rest. Per Drag-and-Drop verschiebst du Tickets zwischen den Spalten.

**Skills dazu:** [`/do-semi-automatic`](SKILLS.md#do-semi-automatic--autonom-ein-ticket-pro-lauf) arbeitet ein `AI`-Ticket pro Lauf ab. [`/write-ticket`](SKILLS.md#write-ticket--feedback-in-ein-neues-ticket-triagieren) legt aus Feedback ein neues Ticket an.

**Wozu?** Das Tool zeigt die Zusammenarbeit von Mensch und KI an Tickets.

Details zur API: [docs/specs/SPEC-API-TICKETS.md](specs/SPEC-API-TICKETS.md).
