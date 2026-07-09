# Subagents

Dieses Projekt hat 24 Subagents. Sie liegen in `.claude/agents/`. Jeder Agent ist eine Markdown-Datei.

## Was ist ein Subagent?

Ein Subagent ist ein Spezialist. Claude ruft ihn für eine klare Aufgabe auf. Der Subagent bekommt eigenen Kontext, eigene Werkzeuge und einen eigenen Auftrag.

Beispiel: Du willst neuen Backend-Code. Claude ruft `be-coder`. Der schreibt den Code. Danach ruft Claude `be-reviewer`. Der prüft den Code.

## Warum Subagents nutzen?

- **Fokus.** Jeder Agent kennt nur seinen Bereich. Er liest die passenden Specs. Er kennt die Regeln.
- **Weniger Fehler.** Ein Reviewer prüft, was ein Coder baut. Vier Augen.
- **Passendes Modell.** Einfache Aufgaben laufen auf `haiku`. Schwere auf `opus`. Das spart Zeit und Geld.
- **Sauberer Kontext.** Der Haupt-Chat bleibt kurz. Der Agent arbeitet in seinem eigenen Fenster.

## Wie rufst du einen Subagent auf?

Zwei Wege:

1. **Automatisch.** Claude liest die `description` jedes Agents. Passt die Aufgabe, ruft Claude den Agent selbst. Du machst nichts.
2. **Per Name.** Du bittest direkt: „Nutze den `be-reviewer`, um diese Route zu prüfen." Claude startet genau diesen Agent.

Skills wie `/plan-and-do` rufen viele Agents nacheinander. Erst Coder, dann Tester, dann Reviewer.

## Die Agents im Überblick

Jede Zeile: Name, Zweck, Modell. Das Modell steht in der Agent-Datei (`model:`).

### Coding — Code schreiben

| Agent | Zweck | Modell |
|-------|-------|--------|
| `be-coder` | Node.js / Express / TypeScript Backend. Routen, Services, Middleware. | sonnet |
| `fe-coder` | Angular 21 Frontend. Komponenten, Services, Routing. | sonnet |
| `db-coder` | SQLite-Queries, Drizzle-Schema, `migrate.ts`. | sonnet |
| `ui-designer` | UI/UX. Layout, Styling, SCSS, Barrierefreiheit. | sonnet |

### Review — Code und Anforderungen prüfen

| Agent | Zweck | Modell |
|-------|-------|--------|
| `be-reviewer` | Prüft Backend-Code. Bugs, Sicherheit, Muster. | sonnet |
| `fe-reviewer` | Prüft Frontend-Code. Bugs, Barrierefreiheit. | sonnet |
| `db-reviewer` | Prüft Queries und Schema. Performance, Schema-Drift. | sonnet |
| `ui-reviewer` | Prüft die UI. Usability, WCAG, UX-Probleme. | sonnet |
| `ba-reviewer` | Prüft PRDs, Specs, Pläne. Findet Lücken. | sonnet |
| `requirements-reviewer` | Prüft Anforderungen und User Stories. Findet fehlende Akzeptanzkriterien. | opus |

### Writing — Anforderungen schreiben

| Agent | Zweck | Modell |
|-------|-------|--------|
| `ba-writer` | Schreibt Business-Specs, User Stories, Prozessabläufe. | sonnet |

### Testing — Tests schreiben, prüfen, ausführen

| Agent | Zweck | Modell |
|-------|-------|--------|
| `be-test-coder` | Schreibt Playwright-API-Tests fürs Backend. | sonnet |
| `be-test-reviewer` | Prüft Backend-Tests. Abdeckung, Assertions. | sonnet |
| `be-test-runner` | Führt die Backend-Test-Suite aus. Meldet Pass/Fail. | haiku |
| `fe-test-coder` | Schreibt Jasmine/Karma-Unit-Tests fürs Frontend. | sonnet |
| `fe-test-reviewer` | Prüft Frontend-Tests. Abdeckung, DI-Setup. | sonnet |
| `fe-test-runner` | Führt die Frontend-Test-Suite aus. Meldet Pass/Fail. | haiku |

### Ops — Entwicklungsumgebung

| Agent | Zweck | Modell |
|-------|-------|--------|
| `admin` | Lokale Dev-Umgebung, SQLite-Datenbank, Prozesse. Fragt vor Änderungen. | sonnet |

### Tooling — allgemein, nicht an die CRM-Domäne gebunden

Diese sechs Agents kennen die CRM-Specs nicht. Sie lesen nur die Root-`CLAUDE.md`. `shell-*` liest zusätzlich `docs/specs/SPECS-infrastructure.md`. Du kannst sie leicht in andere Projekte übernehmen.

| Agent | Zweck | Modell |
|-------|-------|--------|
| `python-coder` | Schreibt plattformübergreifende Python-Skripte. Datenanalyse. | sonnet |
| `python-reviewer` | Prüft Python. Korrektheit, Portabilität, externe Daten. | sonnet |
| `shell-coder` | Schreibt Shell-Skripte für macOS, Linux, WSL. | sonnet |
| `shell-reviewer` | Prüft Shell-Skripte. Hänger, Endlosschleifen, Portabilität. | sonnet |
| `skill-coder` | Erstellt und ändert Claude-Code-Skills und -Subagents. | sonnet |
| `skill-reviewer` | Prüft Skills und Subagents. | sonnet |

## Domänengebunden oder allgemein?

- **18 Agents sind an die CRM-Domäne gebunden.** Sie lesen die Specs in `docs/specs/`. Sie kennen Firma, Person, Chance und die Regeln. Willst du sie übernehmen, passt du die Specs an dein Projekt an. Siehe [TRANSFER.md](TRANSFER.md).
- **6 Tooling-Agents sind allgemein** (`python-*`, `shell-*`, `skill-*`). Sie passen fast überall.

## CI-Workflow: `do-semi-automatic.yml`

Die Subagents laufen nicht nur lokal. Ein GitHub-Actions-Workflow startet die ganze Kette unbeaufsichtigt in CI. Datei: `.github/workflows/do-semi-automatic.yml`.

Der Workflow ruft den Skill `/do-semi-automatic` headless auf (`claude -p`). Der Skill treibt dann die Subagents: erst `requirements-reviewer` (bauen oder zurückgeben?), dann — beim Bauen — die volle `plan-and-do`-Kette aus Coder-, Test- und Reviewer-Agents. Ein Ticket pro Lauf.

**Wann läuft er?**

- **Manuell** (`workflow_dispatch`) — mit optionaler Eingabe `ticket_id`. Leer → der Skill nimmt das nächste Ready+AI-Ticket.
- **Täglich** (`schedule`) — 02:00 UTC.
- **Auf Zuruf** (`repository_dispatch`, Typ `solve-tickets`) — schlummert noch. Kein Backend-Cron feuert diesen Typ bisher.

Nur eine Instanz zur Zeit (`concurrency`). Überlappende Läufe warten in der Schlange.

**Was macht er?**

1. Repo auschecken (volle History, damit `plan-and-do` branchen kann), Node einrichten, `npm ci`, Claude Code installieren, Git-Identität setzen.
2. `claude -p "/project:do-semi-automatic [id]"` laufen lassen. Die Eingabe `ticket_id` muss eine **positive ganze Zahl** sein — der Workflow lehnt alles andere ab (`exit 1`). Ticket-URLs sind nur für den lokalen/interaktiven Aufruf; CI nutzt die reine ID.
3. Nach dem Lauf: uncommittete Änderungen sichern. Gibt es Commits über dem Basis-Stand? → gebaut. Der Skill selbst pusht nie und öffnet keinen PR. Also pusht **der Workflow** den Branch und öffnet einen PR gegen den Basis-Branch. Nichts wird je automatisch gemergt.
4. Kam der Lauf aus dem Vercel-Cron (`client_payload.cronRunId`), meldet der Workflow das Ergebnis an den Cron-Run zurück.

Nicht-Bau-Ausgänge des Skills (zurück nach Definition, oder `ON_HOLD` bei einem Blocker) erzeugen keine Commits — also keinen PR.

**Nötige Secrets:** `AGENT_API_TOKEN`, `APP_BASE_URL` (die DEPLOYTE App), `CLAUDE_CODE_OAUTH_TOKEN` (per `claude setup-token` erstellt — **nicht** zusätzlich `ANTHROPIC_API_KEY` setzen). `GITHUB_TOKEN` kommt automatisch und pusht den Branch bzw. öffnet den PR. Ohne diese Secrets läuft der Workflow nicht sinnvoll.

Skill-Details: [SKILLS.md](SKILLS.md) · API-Hintergrund: [docs/specs/SPEC-API-TICKETS.md](specs/SPEC-API-TICKETS.md).

## Mehr Details

- Agent-Dateien: `.claude/agents/`
- Rollen-Tabelle und Spec-Zuordnung: [CLAUDE.md](../CLAUDE.md)
- Übernahme in dein Projekt: [TRANSFER.md](TRANSFER.md)
