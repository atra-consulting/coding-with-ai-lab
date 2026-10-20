# Claude Code Workshop — Aufgaben

Dreizehn Aufgaben rund um das CRM-Lab, aufgeteilt in zehn
**Fortgeschrittenen-Aufgaben** (45–120 Min, mit KI-Integration, Karten,
Import-Pipelines oder komplett neuen Apps) und drei **Anfänger-Aufgaben**
(10–25 Min, gut als Warm-up).

Jede Aufgabe nutzt das `/plan-and-do`-Skill aus dem Lab-Repo. Das Skill
erkennt automatisch die Sub-Agenten aus der `CLAUDE.md` (be-coder, fe-coder,
be-reviewer, fe-reviewer, db-coder, …) und ruft sie in den richtigen Phasen
auf.

## Ablauf je Aufgabe

1. Claude Code im Projekt-Root starten: `claude --dangerously-skip-permissions`
2. Den Prompt aus der jeweiligen Aufgaben-Datei einfügen.
3. Bei den Checkpoints (PRD/Plan/Review) `Continue` wählen, außer ihr wollt
   den Plan editieren.
4. App starten und Ergebnis im Browser testen: `./start.sh`
   → Frontend auf <http://localhost:7200>, Login `admin / admin123`.

## Fortgeschrittenen-Aufgaben (45–120 Min)

| Nr | Aufgabe | Dauer | Bereiche |
|----|---------|-------|----------|
| 01 | [OpenStreetMap: Firmen auf der Karte](01-openstreetmap-firmenkarte.md) | ~60 Min | FE (+ optional BE) |
| 02 | [In-App CRM-Assistent (Chat)](02-in-app-crm-assistent.md) | ~75 Min | BE + FE |
| 03 | [Firmendossier via LLM (Gemini)](03-firmendossier-llm.md) | ~60 Min | BE + FE + Testdaten |
| 04 | [KI-Beziehungsanalyse (Google Gemini API)](04-ki-beziehungsanalyse-claude.md) | ~45 Min | BE + FE |
| 05 | [CSV-Import mit KI-Spalten-Mapping](05-csv-import-ki-mapping.md) | ~75 Min | BE + FE |
| 06 | [Duplikat-Erkennung](06-duplikat-erkennung.md) | ~60 Min | BE + FE |
| 07 | [Neue App: Künstler-Webseite (Next.js)](07-kuenstler-webseite-nextjs.md) | ~120+ Min | neues Projekt |
| 08 | [Chance-Erweiterungen: Phasen-Badges + Notiz-Feld](08-chance-erweiterungen.md) | ~40 Min | FE + BE + DB |
| 09 | [Dunkelmodus-Umschalter](09-dark-mode-toggle.md) | ~20 Min | FE |
| 10 | [Firmen als Favorit markieren](10-firma-favorit.md) | ~30 Min | BE + FE + DB |

Empfehlung: Mit Aufgabe 01 (OpenStreetMap) oder 04 (Beziehungsanalyse)
starten — beide bringen sichtbares Ergebnis und zeigen den Sub-Agent-Flow
ohne zu viel Setup. Aufgabe 07 ist ein eigenständiges Next.js-Projekt.

## Anfänger-Aufgaben (10–25 Min)

Kleinere Aufgaben für den Einstieg. Jede ist so geschnitten, dass sie
**in maximal 25 Minuten** komplett durchläuft — inklusive Plan-Checkpoints,
Implementierung, Review und Browser-Test.

| Nr | Aufgabe | Dauer | Bereiche |
|----|---------|-------|----------|
| 11 | [CSV-Export für Firmenliste](11-firma-csv-export.md) | ~25 Min | BE + FE |
| 12 | [Icons für Aktivitätstypen](12-aktivitaet-icons.md) | ~10 Min | FE |
| 13 | [Zähler-Badges im Seitenmenü](13-sidebar-counters.md) | ~15 Min | BE + FE |

Empfehlung: Mit Aufgabe 12 (Aktivitäts-Icons) oder 13 (Seitenmenü-Zähler)
starten — beide sind sehr visuell und schnell fertig. Aufgabe 11 zeigt den
kompletten Full-Stack-Durchlauf inklusive Datei-Download.

**Zeit-Angaben** beinhalten: Plan-Review durch den Teilnehmer, Implementierung
durch Claude (inklusive Sub-Agent-Orchestrierung), Code-Review, Dev-Server-Neustart
und kurzer Browser-Test. Reine Claude-Rechenzeit ist deutlich kürzer.

## Voraussetzungen

- **API-Keys (je nach Aufgabe):**
  - `GOOGLE_GEMINI_KEY` — für Aufgaben 02, 03, 04 und 05; bei 06 nur für den
    optionalen Schritt 3
  - Key vor dem Start exportieren: `export GOOGLE_GEMINI_KEY=…`
- **Aufgabe 01** benötigt keine Vorbereitung: Die Seed-Daten liefern bereits
  `latitude` / `longitude` für alle Adressen aus.

## Tipps für alle Aufgaben

- **`--dangerously-skip-permissions`:** Spart wertvolle Workshop-Zeit, da
  Claude Datei-Edits und Shell-Kommandos nicht einzeln bestätigen lässt.
  Nur in isolierten Workshop-Umgebungen verwenden — niemals in produktiven
  Projekten.
- **Plan-Checkpoint nutzen:** Bei Checkpoint 7 (Plan-Approval) zeigt Claude
  einen detaillierten Plan. Kurz durchlesen — wenn etwas fehlt, „Edit"
  wählen und ergänzen lassen.
- **Dev-Server neu starten:** Backend lädt per `tsx --watch` automatisch neu.
  Frontend auch. Bei Schema-Änderungen: `./start.sh --reset-db` verwenden,
  dann starten alle Tabellen frisch.
- **Agent-Sichtbarkeit:** Während der Plan- und Review-Phasen sieht man im
  Terminal, welche Agenten (z. B. `be-coder`, `fe-reviewer`) parallel laufen.
  Das ist didaktisch wertvoll — kurz darauf hinweisen.
- **Branch:** Jede `/plan-and-do`-Ausführung erzeugt einen eigenen Branch.
  Nach der Aufgabe zurück zum Start-Branch wechseln oder den neuen Branch
  behalten.
- **Icons:** Das Lab-Projekt verwendet **FontAwesome** (nicht Bootstrap
  Icons). Icons immer aus `@fortawesome/free-solid-svg-icons` importieren
  und via `<fa-icon [icon]="…"></fa-icon>` rendern.
- **Größere Aufgaben splitten:** Manche Aufgaben (02, 05, 07) sind zu
  umfangreich für eine einzige `/plan-and-do`-Runde. Schrittweise abarbeiten:
  erst Schritt 1, Ergebnis prüfen, dann Schritt 2 mit erneutem
  `/plan-and-do`.
