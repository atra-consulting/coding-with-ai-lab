# Architecture Decision Records (ADRs)

Übersicht aller ADRs des CRM-Projekts.

| #   | Titel                                                        | Status      | Bezug-PRD | Datei                                                                          |
|-----|--------------------------------------------------------------|-------------|-----------|--------------------------------------------------------------------------------|
| 001 | Architekturentscheidungen Authentifizierung & Benutzerverwaltung | Entschieden | [PRD-002](../prds/002-authentication-user-management.md) | [001-authentication-architecture.md](001-authentication-architecture.md) |
| 002 | Speicherort der Dashboard-Konfiguration                      | Entschieden | [PRD-004](../prds/004-auswertungen-konfigurierbar.md)    | [002-dashboard-konfiguration-speicherort.md](002-dashboard-konfiguration-speicherort.md) |
| 003 | CIAM-Microservice-Architektur                                | Entschieden | [PRD-009](../prds/009-ciam-microservice.md)              | [003-ciam-microservice.md](003-ciam-microservice.md) |
| 004 | Technologiewahl fuer den CIAM-Microservice                   | Implementiert | [ADR-003](003-ciam-microservice.md)                      | [004-ciam-technologie-portierung.md](004-ciam-technologie-portierung.md) |

## Konventionen

- **Nummerierung**: Jede ADR erhält eine fortlaufende dreistellige Nummer (`001`, `002`, …) im Dateinamen und Titel.
- **Status**: `Vorgeschlagen` → `Entschieden` → ggf. `Ersetzt durch ADR-XXX`.
- **Bezug**: Jede ADR verlinkt auf die PRD, aus der die Fragestellung hervorgeht.
- **PRDs**: Die zugehörigen Product Requirements Documents sind unter [PRDs](../prds/README.md) zu finden.
