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
| ORM | Drizzle ORM + better-sqlite3 | aktuell |
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
| TypeScript | | 5.9.2 |

## Domain-Modell (Deutsch)

| Entity | Übersetzung | Wichtige Beziehungen |
|--------|------------|----------------------|
| Firma | Unternehmen | hat viele: Person, Abteilung, Adresse, Aktivitaet, Vertrag, Chance |
| Person | Kontaktperson | gehört zu Firma, optional Abteilung; hat viele: Adresse, Gehalt, Aktivitaet |
| Abteilung | Abteilung | gehört zu Firma; hat viele Person |
| Adresse | Adresse | gehört zu Firma oder Person |
| Gehalt | Gehalt | gehört zu Person |
| Aktivitaet | Aktivität | optional Firma und/oder Person |
| Vertrag | Vertrag | gehört zu Firma, optional kontaktPerson |
| Chance | Verkaufschance | gehört zu Firma, optional kontaktPerson; hat Kanban-Phasen |
| Benutzer | Benutzer | hardcodiert in `config/users.ts`; Rollen: ADMIN, USER |

## Spezifikationsdokumente

| Dokument | Inhalt |
|----------|--------|
| [SPECS-backend.md](SPECS-backend.md) | CRM-Backend: Entities, API-Endpunkte, Services |
| [SPECS-frontend.md](SPECS-frontend.md) | Angular-Frontend: Komponenten, Routing, Services |
| [SPECS-infrastructure.md](SPECS-infrastructure.md) | Build, Konfiguration, Datenbank, Projektstruktur |

## Seed-Daten

- **Benutzer**: 3 Benutzer — hardcodiert in `config/users.ts`, nicht in der Datenbank
  - `admin` / `admin123` — Rolle: ADMIN
  - `user` / `test123` — Rolle: USER
  - `demo` / `demo1234` — Rolle: ADMIN
- **Backend**: 100 Firmen, ~250 Abteilungen, ~600 Personen, 500 Adressen, ~600 Gehaelter, 1000 Aktivitaeten, 200 Vertraege, 300 Chancen
