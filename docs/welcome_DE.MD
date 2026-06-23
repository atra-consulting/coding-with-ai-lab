# Willkommen zum AI Coding Lab

## Trainings-Setup

- Du arbeitest mit einer Full-Stack-CRM-Anwendung (Node.js/TypeScript Backend, Angular Frontend)
- Die Anwendung enthält vordefinierte Features und Bugs
- Du implementierst diese Features und Fixes mit KI-Unterstützung
- Wir sind hier, um dich zu leiten

## Was du zum Starten brauchst

- **Claude Code**: Für die Aufgaben im Workshop benötigst du **Claude Code** (erfordert ein Claude-Abo auf Claude.com). Die Slash-Befehle (`/plan-and-do`, `/review` usw.) sind Claude-Code-spezifisch.
- **Node.js & npm**: Für das Starten des Projekts
  - **Windows:** Im Node.js-Installer die Checkbox **"Automatically install the necessary tools. [...]"** aktivieren — damit werden Build-Tools (Python, Visual Studio Build Tools) mitinstalliert, die für native Module benötigt werden.
  - **Windows:** Bei Berechtigungsproblemen (Skripte dürfen nicht ausgeführt werden) in PowerShell ausführen:
    ```powershell
    Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
    ```
- **Git CLI**: Für Versionskontrolle, Branching und zum Erstellen von PRs mit Claude

Vollständige Installationsanleitung: **[SETUP.md](../SETUP.md)**

## Wie du das Projekt startest

Klone das Repository:

```bash
git clone https://github.com/atra-consulting/coding-with-ai-lab.git
cd coding-with-ai-lab
```

Stack starten:

```bash
./start.sh           # macOS / Linux
start.bat            # Windows
```

| URL | Beschreibung |
|-----|-------------|
| <http://localhost:7200> | Frontend |
| <http://localhost:7070> | Backend API |

## Branch-Konvention

Erstelle deinen eigenen Branch mit diesem Format:

```
training-<MMJJ>/<vornamenachname>
```

Beispiel: `training-0626/max-mustermann` (Juni 2026, Max Mustermann)

```bash
git checkout -b training-0626/max-mustermann
```

## Wie du an Aufgaben arbeitest

1. Aufgaben findest du im Ordner **`/tasks/`**
2. Starte eine Aufgabe mit dem **`/plan-and-do`**-Skill in Claude Code:
   - Tippe `/plan-and-do` mit deiner Aufgabenbeschreibung
   - Der Skill übernimmt Planung, Implementierung, Testing und Code Review automatisch

## Nützliche Befehle

| Befehl | Zweck |
|--------|-------|
| `/plan-and-do <Aufgabe>` | End-to-End-Implementierung (Planung → Coding → Testing → Review) |
| `/review` | Code-Änderungen mit iterativem Feedback prüfen |
| `/simplify` | Code auf Qualität, Wiederverwendung und Effizienz prüfen |
| `/help` | Hilfe zu Claude Code |
| `/clear` | Konversationshistorie löschen |
| `/compact` | Kontext komprimieren |

## Playwright-MCP: Browser-Automation

Playwright-MCP ermöglicht der AI, direkt mit der laufenden Anwendung im Browser zu interagieren:

- **Screenshots** der UI machen und Änderungen visuell validieren
- **Formulare ausfüllen und Buttons klicken** um Features zu testen
- Durch die Anwendung **navigieren** und Workflows verifizieren
- **Grenzfälle** und Benutzerinteraktionen automatisch testen
- **UI-Probleme debuggen** durch visuelle Kontrolle der Anwendung

## Vollständige Dokumentation

| Dokument | Inhalt |
|----------|--------|
| [CHEATSHEET-CLAUDE-CODE.md](./CHEATSHEET-CLAUDE-CODE.md) | Claude Code Spickzettel für Einsteiger |
| [Systemspezifikationen](./specs/SPECS.md) | Detaillierte Architektur, API-Specs, Coding-Konventionen |

---

**Fragen?** Schau in die Specs oder frag um Hilfe. Viel Erfolg beim Programmieren!
