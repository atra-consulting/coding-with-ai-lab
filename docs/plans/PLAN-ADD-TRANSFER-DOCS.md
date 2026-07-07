# Implementation Plan: ADD-TRANSFER-DOCS

Neue deutsche Doku. Zwei Zielgruppen: Konferenz-Zuhörer (Skills + Subagents ins eigene Projekt übernehmen) und Workshop-Teilnehmer (Aufgaben lösen).

## Writing Style (harte Vorgabe für JEDE neue Zeile)

Gilt für alle Dateien in diesem Plan. Kein Kompromiss.

- Kurze Sätze. Ein Gedanke pro Satz.
- Kein Passiv. Aktiv schreiben. („Claude lädt die Agents" statt „Die Agents werden geladen".)
- Einfache Wörter. Nicht-Muttersprachler verstehen sie.
- Satzfragmente erlaubt.
- Deutsch. Fachbegriffe (Firma, Chance, Subagent, Skill) bleiben.
- Nach dem Schreiben jede Datei gegen diese Regeln prüfen. Passivsätze umschreiben.

## Test Command
`cd frontend && npx ng build` (Build-Check laut CLAUDE.md)

Reine Doku-Änderung. Keine Code-Dateien. Step 9 überspringt Tests, prüft stattdessen Links und Fakten.

## Tasks

### 1. Subagent löschen
- [ ] `.claude/agents/md-reader.md` löschen (`git rm`).
- [ ] Prüfen, ob `md-reader` in CLAUDE.md `## Agents`-Tabelle und in Spec-Reading-Listen steht. Falls ja: entfernen. (Doku-Sync, damit nichts auf einen gelöschten Agent zeigt.)

### 2. SUBAGENTS.md
- [ ] Neue Datei `docs/SUBAGENTS.md`.
- [ ] Erklärt: Was ist ein Subagent. Warum nutzen. Wie aufrufen (automatisch + per Name).
- [ ] Tabelle aller 24 Agents (nach `md-reader`-Löschung), gruppiert: CRM-domänengebunden (Coding/Review/Test) vs. allgemeine Tooling-Agents (`python-*`, `shell-*`, `skill-*`) vs. `admin` / `requirements-reviewer`.
- [ ] Spalten: Name, Zweck, Typ, Modell, Werkzeuge (kurz).
- [ ] Hinweis: `requirements-reviewer` fehlt aktuell in CLAUDE.md-Tabelle → hier vollständig auflisten.
- [ ] Verweis auf `.claude/agents/` und CLAUDE.md.

### 3. SKILLS.md
- [ ] Neue Datei `docs/SKILLS.md`.
- [ ] Erklärt: Was ist ein Custom-Skill. Wie aufrufen (`/name`).
- [ ] Ein Abschnitt pro Skill: `plan-and-do`, `review`, `update-claude-files`, `do-factory-automatic`.
- [ ] Je Skill: Zweck, wann nutzen, Argumente, Beispiel, Verweis auf Skill-Datei.
- [ ] Hinweis: `do-factory-automatic` läuft headless (CI), kein Mensch antwortet.

### 4. TRANSFER.md
- [ ] Neue Datei `docs/TRANSFER.md`.
- [ ] Zielgruppe: Konferenz-Zuhörer, die Skills + Subagents ins eigene Projekt übernehmen.
- [ ] Schritt-für-Schritt-Prozess (nummeriert):
  1. Subagents + Skills ins `.claude/`-Verzeichnis des anderen Projekts kopieren.
  2. Claude auffordern, sie an das Projekt anzupassen.
  3. Claude beenden und neu starten.
  4. `/review`-Prompt mind. 3× laufen lassen — stoppen, wenn keine nützlichen Findings mehr. (Beispiel-Prompt zeigen.)
  5. Claude beenden und neu starten.
  6. `/update-claude-files`-Prompt laufen lassen (Specs + Domain-Doku neu erstellen).
  7. `/review`-Prompt mind. 3× laufen lassen — stoppen, wenn keine nützlichen Findings mehr. (Beispiel-Prompt zeigen.)
  8. Claude beenden und neu starten.
- [ ] Konkrete Beispiel-Prompts als Code-Blöcke.
- [ ] Warum neu starten: Claude lädt Agents/Skills/CLAUDE.md beim Start.

### 5. TOOLS.md
- [ ] Neue Datei `docs/TOOLS.md`.
- [ ] Drei Tools erklären:
  - `http://localhost:7200/produktivitaet/rechner` — „Ein Ticket, vier Prozesse". Vergleicht 4 Prozessvarianten (Agile mit Menschen, Agile mit KI, KI-Prozess mit Feedback, KI-Prozess vollautomatisch) nach Arbeitszeit, Wartezeit, Rollen. Zeigt den Produktivitätsgewinn durch KI.
  - `http://localhost:7200/admin/agent-tasks` — Admin-Dashboard des Agent-Task-Runners. `agent_task`-Tabelle (Quellen EMAIL, GITHUB_ISSUE, APP_LOG, ERROR_REPORT). Autonomer CI-Agent löst/lehnt ab.
  - `http://localhost:7200/admin/tickets` — Kanban-Board (5 Spalten), Owner AI/HUMAN. Fake-Ticketsystem für Software-Factory-Training.
- [ ] Je Tool: Zweck, wer nutzt es, Verweis auf `docs/API-TASKS.md` / `docs/API-TICKETS.md`.
- [ ] Hinweis: Admin-Login nötig (`admin` / `admin123`).

### 6. README.md aktualisieren
- [ ] `## Inhalt` um neue Abschnitte erweitern.
- [ ] Zwei Zielgruppen klar trennen:
  - **Gemeinsam** (alle): Schnellstart, Login, Tools.
  - **Transfer** (Konferenz-Zuhörer): SUBAGENTS.md, SKILLS.md, TRANSFER.md.
  - **Training** (Workshop-Teilnehmer): Branch-Konvention, Aufgaben, plan-and-do.
- [ ] Links zu allen neuen Dokumenten in „Weiterführende Dokumentation".
- [ ] Neue Docs in Tabelle: SUBAGENTS.md, SKILLS.md, TRANSFER.md, TOOLS.md.

### 7. Verifikation
- [ ] Alle Links relativ und korrekt (Dateien existieren).
- [ ] Kein Verweis mehr auf `md-reader`.
- [ ] Deutsch, kurz, einfache Wörter, keine Passivsätze (CLAUDE.md Writing Style).
- [ ] `npx ng build` (optional, unbeeinflusst von Doku).

## Tests
### Konsistenz-Checks (manuell)
- [ ] `grep -ri "md-reader"` findet nur historische/keine aktiven Referenzen.
- [ ] Jeder README-Link zeigt auf existierende Datei.
- [ ] Agent-Anzahl in SUBAGENTS.md stimmt mit `.claude/agents/*.md` überein.
- [ ] Alle vier Skills in SKILLS.md dokumentiert.
