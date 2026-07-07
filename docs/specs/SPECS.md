# System Specifications

Full-Stack-CRM-Anwendung. Node.js/TypeScript-Backend mit Angular-Frontend.

## Architektur-Übersicht

```
┌─────────────┐     ┌─────────────────┐
│  Angular 21  │────▶│  Node.js/Express│
│  Frontend    │     │  Backend (CRM)  │
│  Port 7200   │     │  Port 7070      │
└─────────────┘     └─────────────────┘
                            │
                     SQLite-Datenbank
                  backend/data/crmdb.sqlite
```

- **Monorepo**: Zwei Verzeichnisse in einem Git-Repo (`backend/`, `frontend/`)
- **Auth-Flow**: Session-basierte Authentifizierung (express-session + bcryptjs)
- **Benutzer**: Hardcodiert in `config/users.ts` — nicht in der Datenbank
- **Proxy**: Angular Dev Server leitet `/api` an Backend:7070 weiter
- **Datenbank**: Einzelne SQLite-Datei, Drizzle ORM verwaltet Schema und Migrationen

## Tech Stack

| Schicht | Technologie | Version |
|---------|------------|---------|
| Backend | Node.js / TypeScript mit Express | 4.21 (Node.js 20.19+) |
| ORM | Drizzle ORM + @libsql/client (libSQL/Turso) | aktuell |
| Auth | express-session + bcryptjs | aktuell |
| Validierung | Zod | aktuell |
| TS-Ausführung | tsx (mit Hot Reload) | aktuell |
| Datenbank | SQLite | single file |
| Frontend | Angular | 21.2.1 |
| UI Framework | Bootstrap + ng-bootstrap | 5.3.8 / 20.0.0 |
| Icons | @fortawesome/angular-fontawesome | 4.0.0 |
| Charts | Chart.js + ng2-charts | 4.5.1 / 10.0.0 |
| Datentabelle | AG Grid | 35.1.0 |
| Drag & Drop | @angular/cdk | 21.2.1 |
| QR-Code | qrcode | 1.5.4 |
| TypeScript (Backend) | | ^5.8.3 |
| TypeScript (Frontend) | | ~5.9.2 |

## Domain-Modell (Deutsch)

**CRM-Entities (Geschäftsdaten):**

| Entity | Übersetzung | Wichtige Beziehungen |
|--------|------------|----------------------|
| Firma | Unternehmen | hat viele: Person, Abteilung, Adresse, Aktivitaet, Chance |
| Person | Kontaktperson | gehört zu Firma, optional Abteilung; hat viele: Adresse, Aktivitaet |
| Abteilung | Abteilung | gehört zu Firma; hat viele Person |
| Adresse | Adresse | gehört zu Firma oder Person; mit Geokodierung (latitude, longitude) |
| Aktivitaet | Aktivität | optional Firma und/oder Person |
| Chance | Verkaufschance | gehört zu Firma, optional kontaktPerson; hat Kanban-Phasen |
| Benutzer | Benutzer | hardcodiert in `config/users.ts`; Rollen: ADMIN, USER |

**Operative/System-Tabellen (kein CRM-Geschäftsinhalt):**

| Tabelle | Zweck |
|---------|-------|
| `agent_task` | Autonome KI-Aufgaben; Lifecycle: OPEN → IN_PROGRESS → DONE / REJECTED; Quellen: EMAIL, GITHUB_ISSUE, APP_LOG, ERROR_REPORT |
| `ticket` + `ticket_comment` | Kanban-Ticketsystem für Workshop-Aufgaben; Owner AI oder HUMAN; Status DEFINITION → TODO → IN_PROGRESS → ON_HOLD → DONE |
| `cron_run` | Laufzeitprotokoll für Cron-Jobs (Trigger, Status, Dauer, GitHub-Run-URL) |
| `sessions` | Persistente express-session-Einträge; verwaltet von `LibsqlSessionStore` (kein in-memory Store) |
| `szenario` | Gespeicherte Szenarien für den Produktivität-Rechner (Zykluszeit-Vergleich von vier Software-Delivery-Prozessen) |

## Spezifikationsdokumente

| Dokument | Inhalt |
|----------|--------|
| [DOMAIN.md](DOMAIN.md) | Geschäftsdomäne (Business Domain): Bedeutung der Entities, Beziehungen, Lösch-Verhalten, Verkaufs-Pipeline, Rollen — fachlich, kein Schema |
| [SPECS-backend.md](SPECS-backend.md) | CRM-Backend-API: Routen, Services, Auth, Fehlerbehandlung, Pagination, Code-Muster |
| [SPECS-database.md](SPECS-database.md) | Datenbank: Entities, Schema, Spalten, Enums, Foreign Keys, Migrationen |
| [SPECS-frontend.md](SPECS-frontend.md) | Angular-Frontend: Architektur, Routing, Auth, Guards, Models, Services, Komponenten |
| [SPECS-ui.md](SPECS-ui.md) | UI & Design-System: Styling, Farben, AG Grid, Layout-Komponenten, Shared Components |
| [SPECS-testing.md](SPECS-testing.md) | Tests: Playwright-Backend-API-Tests, Jasmine/Karma-Frontend-Unit-Tests, Testmuster |
| [SPECS-infrastructure.md](SPECS-infrastructure.md) | Build, Konfiguration, Datenbank-Engine, Startup, Projektstruktur |

Daneben liegen im selben Ordner zwei **API-Referenz-Dokumente** (Präfix `SPEC-API-`, nicht `SPECS-`): sie beschreiben die Agenten-APIs der fortgeschrittenen Schulung und gehören **nicht** zur Lese-Liste eines Subagenten.

| Dokument | Inhalt |
|----------|--------|
| [SPEC-API-TASKS.md](SPEC-API-TASKS.md) | Agent-Task-API (`/api/agent-tasks`) + Cron-Runner: Endpunkte, Auth, Lifecycle |
| [SPEC-API-TICKETS.md](SPEC-API-TICKETS.md) | Kanban-Ticket-API (`/api/tickets`): Endpunkte, Auth, Status-Maschine, Board |

## Seed-Daten

- **Benutzer**: 3 Benutzer — hardcodiert in `config/users.ts`, nicht in der Datenbank
  - `admin` / `admin123` — Rolle: ADMIN
  - `user` / `test123` — Rolle: USER
  - `demo` / `demo1234` — Rolle: ADMIN
- **Backend** (aus `backend/src/seed/fixture.json`): 25 Firmen, 50 Abteilungen, 100 Personen, 100 Adressen, 75 Aktivitaeten, 40 Chancen. Keine Gehalt- oder Vertrag-Seed-Daten.
