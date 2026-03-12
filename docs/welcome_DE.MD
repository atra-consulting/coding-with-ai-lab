# Willkommen zu Coding with AI

## Zweck dieses Trainings

Praktische Erfahrung im Programmieren mit KI sammeln. Dieses Training lehrt dir, KI-Tools (Claude, Copilot) effektiv einzusetzen, um Features zu implementieren, Bugs zu beheben und deinen Entwicklungsworkflow in einer echten Full-Stack-Anwendung zu beschleunigen.

## Zielgruppe

Entwickler mit grundlegendem KI-Wissen. Keine bisherige Erfahrung mit der CRM-Anwendung erforderlich.

## Trainings-Setup

Du wirst mit einer Standard-CRM-Anwendung arbeiten (Full-Stack: Java/Spring Boot Backend, Angular Frontend, Kotlin CIAM Service), die eine Reihe vordefinierter Features und Bugs enthält. Während des Trainings wirst du diese Features und Fixes mit KI-Unterstützung implementieren. Wir sind hier, um dich zu leiten.

## Was du zum Starten brauchst

- **KI-Abonnement**: Claude (Claude.com) oder GitHub Copilot
- **Node.js & npm**: Für Frontend-Entwicklung
- **Java**: JDK 21+ für Backend
- **Git CLI**: Für Versionskontrolle, Branching und zum Erstellen von PRs mit Claude

## Wie du das Projekt startest

Klone zunächst das Repository:

```bash
git clone https://github.com/atra-consulting/coding-with-ai-lab.git
cd coding-with-ai-lab
```

Dann aus dem Root-Folder:

```bash
./start.sh
```

Dies startet den kompletten Stack:
- Backend: http://localhost:7070
- Frontend: http://localhost:7200
- CIAM Service: http://localhost:8081

## Branch-Konvention

Erstelle deinen eigenen Branch mit diesem Format:

```
training-<MMJJ>/<vornamenachname>
```

Beispiel: `training-0304/john-doe` (März 2024, John Doe)

## Wie du an Tasks arbeitest

1. Finde Tasks im Ordner `/docs/tasks`
2. Verwende den **`plan-and-do`** Skill um mit einem Task zu starten:
   - Tippe `/plan-and-do` mit deiner Task-Beschreibung
   - Der Skill handhabt Planung, Implementierung, Testing und Code Review automatisch

## Nützliche Befehle

Diese Befehle helfen dir, effizienter in Claude Code zu arbeiten:

| Befehl | Zweck |
|--------|-------|
| `/plan-and-do <task>` | Starte End-to-End Implementierung (Planung → Coding → Testing → Review) |
| `/review` | Überprüfe Code-Änderungen mit iterativem Feedback |
| `/simplify` | Analysiere Code auf Qualität, Wiederverwendung und Effizienz |
| `/help` | Hilfe zu Claude Code Funktionen |
| `/clear` | Lösche die Konversationshistorie |

## Playwright-MCP: Browser-Automation

Playwright-MCP ist ein leistungsstarkes Tool, das es der KI ermöglicht, direkt mit deiner Anwendung im Browser zu interagieren. Nutze es um:

- **Screenshots** der UI zu machen und Änderungen visuell zu validieren
- **Formulare auszufüllen und Buttons zu klicken** um Features zu testen
- Durch die Anwendung zu **navigieren** und Workflows zu verifizieren
- **Grenzfälle** und Benutzerinteraktionen automatisch zu testen
- **UI-Probleme zu debuggen** durch visuelle Kontrolle der Anwendung

Mit Playwright-MCP kannst du die KI bitten, deine Anwendung zu navigieren, Aktionen durchzuführen und zu verifizieren, dass alles wie erwartet funktioniert. Dies ist besonders nützlich beim Testen von Frontend-Features oder bei der Validierung, dass deine Code-Änderungen in der UI korrekt funktionieren.

## Vollständige Dokumentation

Für detaillierte Architektur, API-Spezifikationen und Coding-Konventionen siehe die [Systemspezifikationen](./specs/SPECS.md).

---

**Fragen?** Schau in die Specs oder frag um Hilfe. Viel Erfolg beim Programmieren! 🚀
