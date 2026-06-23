<p align="center">
  <a href="https://atra.consulting/">
    <img src="docs/assets/atra-logo.svg" alt="atra.consulting" width="320">
  </a>
</p>

<h1 align="center">AI Coding Lab — CRM Demo</h1>

<p align="center">
  <em>Eine produktionsnahe Full-Stack-Anwendung des <a href="https://atra.consulting/">atra.consulting</a> <strong>AI Coding Lab</strong> —<br>
  entstanden, um zu zeigen, wie AI-gestützte Softwareentwicklung in der Praxis funktioniert.</em>
</p>

<p align="center">
  <a href="LICENSE"><img alt="License: MIT" src="https://img.shields.io/badge/License-MIT-blue.svg"></a>
  <img alt="Node.js" src="https://img.shields.io/badge/Node.js-20.19%2B-339933.svg">
  <img alt="TypeScript" src="https://img.shields.io/badge/TypeScript-Express-3178c6.svg">
  <img alt="Angular 21" src="https://img.shields.io/badge/Angular-21-dd0031.svg">
  <img alt="SQLite" src="https://img.shields.io/badge/SQLite-Drizzle%20ORM-003b57.svg">
</p>

> **Erstmal hier starten:** Für die vollständige Installationsanleitung (Node.js, Claude Code, IDE) bitte **[SETUP.md](SETUP.md)** lesen.

---

## Inhalt

- [Voraussetzungen](#voraussetzungen)
- [Schnellstart](#schnellstart)
- [Demo-Login](#demo-login)
- [Workshop: Branch-Konvention](#workshop-branch-konvention)
- [Workshop: Aufgaben bearbeiten](#workshop-aufgaben-bearbeiten)
- [Nützliche Befehle](#nützliche-befehle)
- [Playwright-MCP: Browser-Automation](#playwright-mcp-browser-automation)
- [Features](#features)
- [Tech-Stack](#tech-stack)
- [Weiterführende Dokumentation](#weiterführende-dokumentation)
- [Lizenz](#lizenz)

---

## Voraussetzungen

| Tool | Version | Zweck |
|------|---------|-------|
| **Node.js** | 20.19+ | Backend + Frontend bauen und starten |
| **Git CLI** | beliebig | Versionskontrolle und Branches |
| **Claude Code** | aktuell | AI-gestütztes Programmieren im Terminal |

Vollständige Installationsanleitung: **[SETUP.md](SETUP.md)**

---

## Schnellstart

Repository klonen:

```bash
git clone https://github.com/atra-consulting/coding-with-ai-lab.git
cd coding-with-ai-lab
```

Stack starten:

```bash
./start.sh           # macOS / Linux
start.bat            # Windows
```

Das Skript installiert npm-Abhängigkeiten, startet Backend und Frontend und wartet, bis beide bereit sind.

| URL | Beschreibung |
|-----|-------------|
| <http://localhost:7200> | Frontend |
| <http://localhost:7070> | Backend API |

### Startskript-Flags

| Flag | Beschreibung |
|------|-------------|
| `--reset-db` | SQLite-Datenbank löschen (wird beim nächsten Start neu aufgebaut) |

### Einzeln starten

```bash
cd backend  && npx tsx --watch src/index.ts                                      # Port 7070, Hot Reload
cd frontend && npx ng serve --port 7200 --proxy-config proxy.conf.json           # Port 7200, Hot Reload
```

---

## Demo-Login

Drei vorkonfigurierte Benutzer:

| Benutzername | Passwort | Rolle | Zweck |
|--------------|----------|-------|-------|
| `admin` | `admin123` | ADMIN | Voller Zugriff inkl. Admin-Bereich |
| `user` | `test123` | USER | Standard-CRM-Nutzer |
| `demo` | `demo1234` | ADMIN | Schnellstart-Login für Demos |

---

## Workshop: Branch-Konvention

Erstelle deinen eigenen Branch mit diesem Format:

```
training-<MMJJ>/<vornamenachname>
```

Beispiel: `training-0626/max-mustermann` (Juni 2026, Max Mustermann)

```bash
git checkout -b training-0626/max-mustermann
```

---

## Workshop: Aufgaben bearbeiten

1. Aufgaben findest du im Ordner **`/docs/tasks/`**
2. Starte eine Aufgabe mit dem **`/plan-and-do`**-Skill in Claude Code:

```
/plan-and-do <Aufgabenbeschreibung>
```

Der Skill übernimmt Planung, Implementierung, Testing und Code Review automatisch.

---

## Nützliche Befehle

| Befehl | Zweck |
|--------|-------|
| `/plan-and-do <Aufgabe>` | End-to-End-Implementierung (Planung → Coding → Testing → Review) |
| `/review` | Code-Änderungen mit iterativem Feedback prüfen |
| `/simplify` | Code auf Qualität, Wiederverwendung und Effizienz prüfen |
| `/help` | Hilfe zu Claude Code |
| `/clear` | Konversationshistorie löschen |
| `/compact` | Kontext komprimieren |

---

## Playwright-MCP: Browser-Automation

Playwright-MCP ermöglicht der AI, direkt mit der laufenden Anwendung im Browser zu interagieren:

- **Screenshots** der UI machen und Änderungen visuell validieren
- **Formulare ausfüllen und Buttons klicken** um Features zu testen
- Durch die Anwendung **navigieren** und Workflows verifizieren
- **Grenzfälle** und Benutzerinteraktionen automatisch testen
- **UI-Probleme debuggen** durch visuelle Kontrolle der Anwendung

---

## Features

- **CRM-Stammdaten** — Firmen, Personen, Abteilungen, Adressen mit AG-Grid-Tabellen
- **Chancen & Aktivitäten** — Vertriebspipeline und Aktivitäten-Tracking
- **Dashboard** — KPI-Tiles und Übersicht der jüngsten Datensätze
- **Adress-Geocoding** — Admin-Tool für Nominatim-basiertes Geocoding mit Karten-Ansicht
- **Feedback** — Nutzerfeedback per QR-Code mit Thank-You-Page
- **Session-Authentifizierung** — bcrypt-Passwörter mit rollenbasierter Zugriffskontrolle

---

## Tech-Stack

| Schicht | Technologie |
|---------|-------------|
| **Backend** | Node.js · TypeScript · Express · Drizzle ORM · `@libsql/client` |
| **Frontend** | Angular 21 · Bootstrap 5 · AG Grid · Chart.js |
| **Datenbank** | SQLite (via `@libsql/client`, Turso-kompatibel) |
| **Auth** | Session-basiert (bcrypt + `express-session`) |

Architektur-Details: **[docs/architecture.md](docs/architecture.md)**

---

## Weiterführende Dokumentation

| Dokument | Inhalt |
|----------|--------|
| [SETUP.md](SETUP.md) | Vollständige Installationsanleitung (Node.js, Claude Code, IDE) |
| [CLAUDE.md](CLAUDE.md) | Anweisungen und Konventionen für AI-Coding-Assistenten |
| [docs/architecture.md](docs/architecture.md) | Systemarchitektur mit Mermaid-Diagrammen |
| [docs/specs/SPECS.md](docs/specs/SPECS.md) | Detaillierte Spezifikationen pro Bereich |
| [docs/adr/](docs/adr/) | Architecture Decision Records |
| [docs/prds/](docs/prds/) | Product Requirement Documents |

### Projektstruktur

```
├── backend/          Node.js/TypeScript Backend (Express + Drizzle ORM)
│   ├── src/          config · db · middleware · routes · seed · services
│   └── data/         SQLite-Datenbankdatei (gitignored)
├── frontend/         Angular 21 SPA (core · features · layout · shared)
├── docs/             Architektur, Specs, ADRs, PRDs, Tasks
├── start.sh          Startskript (macOS/Linux)
├── start.bat         Startskript (Windows)
├── SETUP.md          Installationsanleitung
└── CLAUDE.md         Anweisungen für AI-Coding-Assistenten
```

---

## Lizenz

Veröffentlicht unter der **[MIT-Lizenz](LICENSE)** © 2026 [atra.consulting](https://atra.consulting/).
