# Claude Code Workshop — Aufgaben für Anfänger

Zehn kleine Aufgaben, um Claude Code kennenzulernen. Jede Aufgabe nutzt das
`/plan-and-do`-Skill aus diesem Repo. Das Skill erkennt automatisch die
Sub-Agenten aus der `CLAUDE.md` (be-coder, fe-coder, be-reviewer,
fe-reviewer, db-coder, ...) und ruft sie in den richtigen Phasen auf.

## Ablauf je Aufgabe

1. Claude Code im Projekt-Root starten: `claude`
2. Den Prompt aus der jeweiligen Aufgaben-Datei einfügen.
3. Bei den Checkpoints (PRD/Plan/Review) `Continue` wählen, außer ihr wollt
   den Plan editieren.
4. App starten und Ergebnis im Browser testen: `./start.sh`
   → Frontend auf <http://localhost:7200>, Login `admin / admin123`.

## Aufgaben-Reihenfolge

| Nr | Aufgabe | Umfang | Bereiche |
|----|---------|--------|----------|
| 01 | [Dashboard-Statistik-Kacheln](01-dashboard-stats.md) | klein | BE + FE |
| 02 | [Farbige Phasen-Badges für Chancen](02-chance-phase-badges.md) | klein | FE |
| 03 | [Status-Badges für Verträge](03-vertrag-status-badges.md) | klein | FE |
| 04 | [„Neu"-Kennzeichnung für junge Firmen](04-firma-neu-badge.md) | klein | BE + FE |
| 05 | [Notiz-Feld für Personen](05-person-notiz-feld.md) | mittel | BE + FE + DB |
| 06 | [CSV-Export für Firmenliste](06-firma-csv-export.md) | mittel | BE + FE |
| 07 | [Dunkelmodus-Umschalter](07-dark-mode-toggle.md) | klein | FE |
| 08 | [Icons für Aktivitätstypen](08-aktivitaet-icons.md) | klein | FE |
| 09 | [Firmen als Favorit markieren](09-firma-favorit.md) | mittel | BE + FE + DB |
| 10 | [Zähler-Badges im Seitenmenü](10-sidebar-counters.md) | klein | BE + FE |

Empfehlung: Mit Aufgabe 01 oder 02 starten — beide sind sehr visuell und
schnell fertig. Aufgaben 05 und 09 zeigen den kompletten Full-Stack-Durchlauf
inklusive Datenbank-Migration.

## Tipps für alle Aufgaben

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
