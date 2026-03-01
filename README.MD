# AI Coding Lab — CRM Demo

> Ein Testprojekt des [atra.consulting](https://atra.consulting/) **AI Coding Lab**.
> Ziel ist es, anhand einer realistischen Full-Stack-Anwendung zu zeigen, wie AI-gestütztes Coding in der Praxis funktioniert.

## Tech-Stack

| Schicht  | Technologie |
|----------|-------------|
| Backend  | Spring Boot 3.5.3 · Java 21 |
| Frontend | Angular 20 · Bootstrap 5 · SCSS |
| Datenbank | H2 (file-based, automatisch befüllt) |

## Schnellstart

```bash
# Voraussetzungen: Java 21, Node.js, Maven
./start.sh
```

Das Skript startet Backend (Port 8080) und Frontend (Port 4200) und wartet, bis beide bereit sind.
Im Demo-Modus (Standard) wird auf der Login-Seite ein Button **„Demodaten ausfüllen"** angezeigt, der Benutzername und Passwort automatisch einträgt.

| URL | Beschreibung |
|-----|-------------|
| http://localhost:4200 | Frontend |
| http://localhost:8080 | Backend API |
| http://localhost:8080/h2-console | H2-Datenbank-Konsole |

### Demo-Login

Im Demo-Modus steht ein vorkonfigurierter Benutzer zur Verfügung:

| Benutzername | Passwort | Rolle |
|--------------|----------|-------|
| `demo` | `demo1234` | ADMIN |

### Startskript-Flags

| Flag | Beschreibung |
|------|-------------|
| `--reset-db` | H2-Datenbank löschen (wird beim nächsten Start neu aufgebaut) |
| `--no-demo` | Demo-Modus deaktivieren (versteckt den Demo-Button auf der Login-Seite) |

```bash
./start.sh              # Standardstart mit Demo-Modus
./start.sh --reset-db   # Datenbank zurücksetzen
./start.sh --no-demo    # Ohne Demo-Modus
```

### Einzeln starten

```bash
# Nur Backend
cd backend && mvn spring-boot:run

# Nur Frontend (Proxy auf Backend)
cd frontend && npx ng serve --proxy-config proxy.conf.json
```

## Projektstruktur

```
├── backend/          Spring Boot API
│   └── data/         H2-Datenbankdateien (gitignored)
├── frontend/         Angular SPA
├── docs/
│   ├── adr/          Architecture Decision Records
│   ├── prds/         Product Requirement Documents
│   └── uxdr/         UX Design Records
├── start.sh          Full-Stack-Startskript
└── CLAUDE.md         Anweisungen für AI-Coding-Assistenten
```

## Domänenmodell

Die Anwendung bildet ein deutschsprachiges CRM ab:

**Stammdaten** — Firma, Person, Abteilung, Adresse
**Finanzen & Vertrieb** — Gehalt, Aktivitaet, Vertrag, Chance

## Features

- **Chancen-Pipeline** — Kanban-Board mit Drag & Drop und paginierte Listen-Ansicht
- **Dashboard** — Konfigurierbares Dashboard mit Widgets
- **Auswertungen** — Pipeline-Dashboard und Report Builder mit dynamischen Abfragen
- **Benutzerverwaltung** — Authentication mit Login, Rollen und Demo-Modus

## Architektur

### Backend

Jede Entität folgt dem gleichen Muster:

```
Entity → DTO + CreateDTO → Mapper → Repository → Service → Controller
```

REST-Endpunkte unter `/api/<plural>` mit Pagination (`page`, `size`, `sort`).

### Frontend

Angular 20 Standalone-Komponenten mit:
- Lazy-loaded Feature-Routen
- Reactive Forms
- NgbPagination (1-indexed → 0-indexed Konvertierung)
- CDK Drag & Drop für das Kanban-Board

## Lizenz

Internes Schulungsprojekt von [atra.consulting](https://atra.consulting/).
