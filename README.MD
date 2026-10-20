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

## Schulung? Hier starten

| Schulung | Deutsch | English |
|----------|---------|---------|
| **Claude-Code-Schulung** | [docs/welcome_DE.MD](docs/welcome_DE.MD) | [docs/welcome_EN.MD](docs/welcome_EN.MD) |
| **Copilot-Schulung** (GitHub Copilot CLI) | [docs/welcome-copilot_DE.MD](docs/welcome-copilot_DE.MD) | [docs/welcome-copilot_EN.MD](docs/welcome-copilot_EN.MD) |

Nimm die Einführung zu deiner Schulung. Beide Tools nutzen dieselben Skills, Subagents und Aufgaben.

> Vollständige Installationsanleitung (Node.js, KI-Assistent, IDE): **[docs/SETUP.md](docs/SETUP.md)**.

---

## Zwei Wege durch dieses Repo

Dieses Repo dient zwei Zielgruppen:

- **Konferenz-Zuhörer** wollen die Skills und Subagents in ihr eigenes Projekt holen. Start: [Skills & Subagents übernehmen](#für-konferenz-zuhörer-skills--subagents-übernehmen).
- **Workshop-Teilnehmer** wollen Aufgaben in dieser App lösen. Start: [Aufgaben bearbeiten](#für-workshop-teilnehmer-aufgaben-bearbeiten).

Der gemeinsame Teil (Schnellstart, Login, Tools) gilt für beide.

## Training

atra.consulting [bietet KI-Training an](https://atra.consulting/ki-loesungen/), inklusive zweier Hands-on-Training-Workshops für Agenten-basierte Entwicklung.

## Inhalt

**Gemeinsam**

- [Voraussetzungen](#voraussetzungen)
- [Schnellstart](#schnellstart)
- [Demo-Login](#demo-login)
- [Tools](#tools)

**Für Konferenz-Zuhörer**

- [Skills & Subagents übernehmen](#für-konferenz-zuhörer-skills--subagents-übernehmen)

**Für Workshop-Teilnehmer**

- [Aufgaben bearbeiten](#für-workshop-teilnehmer-aufgaben-bearbeiten)
- [Nützliche Befehle](#nützliche-befehle)

**Referenz**

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
| **Claude Code** oder **GitHub Copilot CLI** | aktuell | AI-gestütztes Programmieren im Terminal (je nach Schulung) |

Vollständige Installationsanleitung: **[docs/SETUP.md](docs/SETUP.md)**

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

## Tools

Die App hat drei Tools für Training und Demo. Starte die App, dann öffne die URL.

| Tool | URL | Zugang |
|------|-----|--------|
| **Produktivitäts-Rechner** | <http://localhost:7200/produktivitaet/rechner> | Jeder Login |
| **Agent-Task-Dashboard** | <http://localhost:7200/admin/agent-tasks> | Nur Admin |
| **Ticket-Board** | <http://localhost:7200/admin/tickets> | Nur Admin |

Details zu jedem Tool: **[docs/TOOLS.md](docs/TOOLS.md)**

---

## Für Konferenz-Zuhörer: Skills & Subagents übernehmen

Du willst die Skills und Subagents aus diesem Repo in dein eigenes Projekt holen? So geht es.

1. Lies, was es gibt: **[docs/SUBAGENTS.md](docs/SUBAGENTS.md)** (26 Subagents) und **[docs/SKILLS.md](docs/SKILLS.md)** (3 Skills).
2. Folge der Anleitung: **[docs/TRANSFER.md](docs/TRANSFER.md)**. Kopieren, anpassen lassen, prüfen — Schritt für Schritt.

| Dokument | Inhalt |
|----------|--------|
| [docs/SUBAGENTS.md](docs/SUBAGENTS.md) | Alle 26 Subagents. Zweck, Modell, Gruppen. |
| [docs/SKILLS.md](docs/SKILLS.md) | Alle 3 Skills. Zweck, Argumente, Beispiele. |
| [docs/TRANSFER.md](docs/TRANSFER.md) | Übernahme in dein Projekt. 8 Schritte. |

---

## Für Workshop-Teilnehmer: Aufgaben bearbeiten

### Eigenen Branch anlegen

Erstelle deinen eigenen Branch mit diesem Format:

```
training-<MMJJ>/<vornamenachname>
```

Beispiel: `training-0626/max-mustermann` (Juni 2026, Max Mustermann)

```bash
git checkout -b training-0626/max-mustermann
```

### Aufgabe starten

1. Die Aufgaben bekommst du im Schulungsportal.
2. Lies Ziel und Ergebnis der Aufgabe und beauftrage deinen KI-Assistenten (Claude Code oder Copilot CLI) im Klartext — so, wie du es einem neuen Kollegen erklären würdest. Lass dir zuerst den Plan zeigen, bevor gebaut wird.
3. Vor dem Abschluss: `/review` prüft deine Änderungen.

---

## Nützliche Befehle

| Befehl | Zweck |
|--------|-------|
| `/review` | Code-Änderungen mit iterativem Feedback prüfen |
| `/write-ticket` | Feedback in ein neues Kanban-Ticket verwandeln |
| `/update-agent-files` | Agents, Specs und `AGENTS.md` mit dem Code synchron halten |
| `/help` | Hilfe zum Tool |
| `/compact` | Kontext komprimieren |

`/review`, `/write-ticket` und `/update-agent-files` sind Projekt-Skills. Sie laufen in beiden Tools gleich. Weitere Befehle je Tool: [Claude-Code-Spickzettel](docs/CHEATSHEET-CLAUDE-CODE.md) · [Copilot-CLI-Spickzettel](docs/CHEATSHEET-COPILOT-CLI.md).

---

## Features

- **CRM-Stammdaten** — Firmen, Personen, Abteilungen, Adressen mit AG-Grid-Tabellen
- **Chancen & Aktivitäten** — Vertriebspipeline und Aktivitäten-Tracking
- **Dashboard** — KPI-Tiles und Übersicht der jüngsten Datensätze
- **Adress-Geocoding** — Admin-Tool für Nominatim-basiertes Geocoding mit Karten-Ansicht
- **Session-Authentifizierung** — bcrypt-Passwörter mit rollenbasierter Zugriffskontrolle

---

## Tech-Stack

| Schicht | Technologie |
|---------|-------------|
| **Backend** | Node.js · TypeScript · Express · Drizzle ORM · `@libsql/client` |
| **Frontend** | Angular 21 · Bootstrap 5 · AG Grid · Chart.js |
| **Datenbank** | SQLite (via `@libsql/client`, Turso-kompatibel) |
| **Auth** | Session-basiert (bcrypt + `express-session`) |

Architektur-Details: **[docs/specs/SPECS.md](docs/specs/SPECS.md)**

Konventionen und Patterns für AI-gestützte Entwicklung: **[AGENTS.md](AGENTS.md)**

---

## Weiterführende Dokumentation

| Dokument | Inhalt |
|----------|--------|
| [docs/SETUP.md](docs/SETUP.md) | Vollständige Installationsanleitung (Node.js, Claude Code / Copilot CLI, IDE) |
| [docs/CHEATSHEET-CLAUDE-CODE.md](docs/CHEATSHEET-CLAUDE-CODE.md) | Claude Code Spickzettel für Einsteiger |
| [docs/CHEATSHEET-COPILOT-CLI.md](docs/CHEATSHEET-COPILOT-CLI.md) | Copilot CLI Spickzettel für Einsteiger |
| [docs/welcome_DE.MD](docs/welcome_DE.MD) | Workshop-Einführung Claude Code (Deutsch) |
| [docs/welcome_EN.MD](docs/welcome_EN.MD) | Workshop introduction Claude Code (English) |
| [docs/welcome-copilot_DE.MD](docs/welcome-copilot_DE.MD) | Workshop-Einführung Copilot CLI (Deutsch) |
| [docs/welcome-copilot_EN.MD](docs/welcome-copilot_EN.MD) | Workshop introduction Copilot CLI (English) |
| [docs/SUBAGENTS.md](docs/SUBAGENTS.md) | Alle 26 Subagents erklärt |
| [docs/SKILLS.md](docs/SKILLS.md) | Alle 3 Custom-Skills erklärt |
| [docs/TRANSFER.md](docs/TRANSFER.md) | Skills & Subagents ins eigene Projekt übernehmen |
| [docs/TOOLS.md](docs/TOOLS.md) | Produktivitäts-Rechner, Agent-Tasks, Ticket-Board |
| [AGENTS.md](AGENTS.md) | Alle Projektregeln für AI-Coding-Assistenten (tool-neutral, gilt für beide Tools) |
| [CLAUDE.md](CLAUDE.md) | Importiert nur `AGENTS.md` (`@AGENTS.md`) |
| [docs/specs/SPECS.md](docs/specs/SPECS.md) | Detaillierte Spezifikationen pro Bereich |
| [docs/adr/](docs/adr/) | Architecture Decision Records |
| [docs/prds/](docs/prds/) | Product Requirement Documents |

### Projektstruktur

```
├── backend/          Node.js/TypeScript Backend (Express + Drizzle ORM)
│   ├── src/          config · db · middleware · routes · seed · services
│   └── data/         SQLite-Datenbankdatei (gitignored)
├── frontend/         Angular 21 SPA (core · features · layout · shared)
├── docs/             Installationsanleitung, Architektur, Specs, ADRs, PRDs, Tasks
├── start.sh          Startskript (macOS/Linux)
├── start.bat         Startskript (Windows)
├── .claude/          Skills und Subagents (Quelle, beide Tools)
├── .github/agents/   Copilot-Kopie der Subagents (generiert)
├── AGENTS.md         Projektregeln für AI-Coding-Assistenten (tool-neutral)
└── CLAUDE.md         Importiert nur AGENTS.md
```

---

## Lizenz

Veröffentlicht unter der **[MIT-Lizenz](LICENSE)** © 2026 [atra.consulting](https://atra.consulting/).
