# Implementation Plan: ADAPT-WORKSHOP-TASKS

## Ziel

Die zehn Workshop-Aufgaben in `docs/workshop/` an den aktuellen Stand von
`main` anpassen. Entfernte Entitäten (Gehalt, Vertrag) und bereits umgesetzte
Features (Dashboard-KPIs) werden berücksichtigt. Ergebnis: acht funktionierende
Aufgaben im Ziel-Repo `coding-with-ai-training-materials/tasks/new/`.

## Kontext: Was auf main geändert wurde

- **Gehalt** — komplett entfernt (REMOVE-GEHALT-VERTRAG-DASHBOARD)
- **Vertrag** — komplett entfernt
- **Dashboard** — hat bereits KPI-Kacheln (Firmen, Personen, offene Chancen,
  gewonnener Umsatz) via `/api/dashboard`
- **Icons** — FontAwesome (`@fortawesome/angular-fontawesome`), keine Bootstrap
  Icons installiert
- **Sidebar** — keine „Verträge"-Sektion mehr. FontAwesome-Icons via `FaIconComponent`

## Entscheidungen (vom User bestätigt)

1. Aufgabe 01 (Dashboard-Stats) und Aufgabe 03 (Vertrag-Status-Badges) **entfernen**
2. Verbleibende acht Aufgaben **neu nummerieren** 01–08
3. Alle Bootstrap-Icon-Referenzen auf **FontAwesome** umstellen
4. Dateien aus `docs/workshop/` **verschieben** (löschen) ins Ziel-Repo
5. Ziel-Ordner `new/` **anlegen** im `coding-with-ai-training-materials`-Repo

## Test Command

Dieses Vorhaben ändert nur Markdown. Kein automatischer Test. Manuelle
Verifizierung:

```bash
ls /Users/karsten/workspaces/fh/repos/coding-with-ai-training-materials/tasks/new/
```

## Renumbering Map

| Alt | Neu | Titel | Bereich |
|-----|-----|-------|---------|
| 01 | — | Dashboard-Statistik-Kacheln | **entfernt** (obsolet) |
| 02 | 01 | Farbige Phasen-Badges für Chancen | FE |
| 03 | — | Status-Badges für Verträge | **entfernt** (Vertrag weg) |
| 04 | 02 | „Neu"-Kennzeichnung für junge Firmen | BE + FE |
| 05 | 03 | Notiz-Feld für Personen | BE + FE + DB |
| 06 | 04 | CSV-Export für Firmenliste | BE + FE |
| 07 | 05 | Dunkelmodus-Umschalter | FE |
| 08 | 06 | Icons für Aktivitätstypen | FE |
| 09 | 07 | Firmen als Favorit markieren | BE + FE + DB |
| 10 | 08 | Zähler-Badges im Seitenmenü | BE + FE |

## Tasks

### 1. Verzeichnis anlegen und Inhalt klären

- [ ] Verzeichnis `/Users/karsten/workspaces/fh/repos/coding-with-ai-training-materials/tasks/new/` anlegen
- [ ] Branchverhältnis prüfen: Workshop-Dateien existieren aktuell auf Branch `adapt-workshop-tasks` (von `claude/workshop-tasks-markdown-NCVSk` geforkt, der auf `main` zurückhängt)
- [ ] Workshop-Dateien aus `docs/workshop/` lesen (bereits getan)

### 2. Aufgaben-Dateien adaptieren und ins Ziel kopieren

Für jede Aufgabe: Datei mit **neuer Nummer** ins Ziel-Repo schreiben. Dabei
die unten angegebenen Änderungen anwenden.

#### 2.1 Aufgabe 01 (war 02) — Chance-Phase-Badges

- [ ] Datei neu anlegen als `01-chance-phase-badges.md`
- [ ] Im Diskussionspunkt „Wie würde man die gleiche Logik für **Verträge** in
  Aufgabe 03 wiederverwenden?" streichen — Vertrag gibt es nicht mehr
- [ ] Ersetzen durch: „Wie würde man die gleiche Logik später auch für
  Aktivitätstypen wiederverwenden (Aufgabe 06)?"
- [ ] Titel-Nummer und Datei-Header aktualisieren

#### 2.2 Aufgabe 02 (war 04) — Firma-Neu-Badge

- [ ] Datei neu anlegen als `02-firma-neu-badge.md`
- [ ] Keine inhaltlichen Änderungen nötig — Firma existiert, `createdAt` auch
- [ ] Titel-Nummer aktualisieren

#### 2.3 Aufgabe 03 (war 05) — Person-Notiz-Feld

- [ ] Datei neu anlegen als `03-person-notiz-feld.md`
- [ ] Keine inhaltlichen Änderungen nötig — Person existiert unverändert
- [ ] Titel-Nummer aktualisieren

#### 2.4 Aufgabe 04 (war 06) — Firma-CSV-Export

- [ ] Datei neu anlegen als `04-firma-csv-export.md`
- [ ] Keine inhaltlichen Änderungen nötig
- [ ] Titel-Nummer aktualisieren

#### 2.5 Aufgabe 05 (war 07) — Dunkelmodus-Umschalter

- [ ] Datei neu anlegen als `05-dark-mode-toggle.md`
- [ ] **Icon-Anpassung:** `bi-moon` / `bi-sun` → **FontAwesome** `faMoon` / `faSun`
- [ ] Prompt anpassen: Erwähnen, dass `@fortawesome/free-solid-svg-icons`
  verwendet wird (bereits im Projekt). Beispiel-Import:
  `import { faMoon, faSun } from '@fortawesome/free-solid-svg-icons';`
- [ ] Troubleshooting-Eintrag „Bootstrap-Icons nicht geladen" entfernen
- [ ] Titel-Nummer aktualisieren

#### 2.6 Aufgabe 06 (war 08) — Aktivitaet-Icons

- [ ] Datei neu anlegen als `06-aktivitaet-icons.md`
- [ ] **Icon-Mapping auf FontAwesome umstellen:**
  - `bi-telephone` → `faPhone`
  - `bi-envelope` → `faEnvelope`
  - `bi-people` → `faUsers` oder `faUserGroup`
  - `bi-sticky` → `faNoteSticky` oder `faStickyNote`
  - Fallback `bi-circle` → `faCircle`
- [ ] Prompt anpassen auf FontAwesome-Integration via `FaIconComponent`
- [ ] Troubleshooting-Eintrag „Bootstrap-Icons nicht geladen" ersetzen durch
  „Neue FA-Icons müssen in `imports` der Komponente stehen und aus
  `@fortawesome/free-solid-svg-icons` importiert werden"
- [ ] Titel-Nummer aktualisieren

#### 2.7 Aufgabe 07 (war 09) — Firma-Favorit

- [ ] Datei neu anlegen als `07-firma-favorit.md`
- [ ] **Icon-Anpassung:** `bi-star` / `bi-star-fill` → FontAwesome
  `faStar` (solid) und `faStar` aus `free-regular-svg-icons` (outline).
  Hinweis: Falls `free-regular-svg-icons` **noch nicht** installiert ist
  (checken: `package.json`), alternativ mit Solid-Star + CSS-Opacity arbeiten
  (`opacity: 0.3` für nicht-Favorit)
- [ ] Prompt anpassen
- [ ] Titel-Nummer aktualisieren

#### 2.8 Aufgabe 08 (war 10) — Sidebar-Counters

- [ ] Datei neu anlegen als `08-sidebar-counters.md`
- [ ] **„Verträge" aus Ziel-Menüpunkten streichen** — nur noch Firmen,
  Personen, Chancen, Aktivitäten
- [ ] Referenz zu Aufgabe 01 (existiert nicht mehr) entfernen
- [ ] Bestehenden `/api/dashboard`-Endpoint als Quelle empfehlen (liefert
  bereits `firmenCount`, `personenCount`, `offeneChancenCount`,
  `gewonneneChancenSumme`) **oder** neuen `/api/sidebar-counts` bauen
- [ ] Antwort-Felder entsprechend anpassen (keine `vertraege`-Zahl)
- [ ] Troubleshooting-Eintrag „Duplikate mit Aufgabe 01" entfernen
- [ ] Titel-Nummer aktualisieren

### 3. README.md im Ziel-Ordner

- [ ] `README.md` für `tasks/new/` anlegen (Vorlage: `docs/workshop/README.md`)
- [ ] Tabelle mit acht Aufgaben statt zehn
- [ ] Verweis auf entfernte Aufgaben 01 und 03 streichen
- [ ] Empfehlungstext „Mit Aufgabe 02 oder 08 starten" → auf neue Nummern
  umschreiben: „Mit Aufgabe 01 (Chance-Badges) oder 06 (Aktivität-Icons)
  starten"
- [ ] Full-Stack-Hinweis auf neue Nummern anpassen: „Aufgaben 03 und 07 zeigen
  den kompletten Full-Stack-Durchlauf inklusive Datenbank-Migration"
- [ ] Hinweis auf `./start.sh` / Login-Daten beibehalten
- [ ] Hinweis auf Sub-Agenten beibehalten

### 4. Aufgaben-Dateien im Quell-Repo löschen (Move)

- [ ] `git rm docs/workshop/01-dashboard-stats.md`
- [ ] `git rm docs/workshop/02-chance-phase-badges.md`
- [ ] `git rm docs/workshop/03-vertrag-status-badges.md`
- [ ] `git rm docs/workshop/04-firma-neu-badge.md`
- [ ] `git rm docs/workshop/05-person-notiz-feld.md`
- [ ] `git rm docs/workshop/06-firma-csv-export.md`
- [ ] `git rm docs/workshop/07-dark-mode-toggle.md`
- [ ] `git rm docs/workshop/08-aktivitaet-icons.md`
- [ ] `git rm docs/workshop/09-firma-favorit.md`
- [ ] `git rm docs/workshop/10-sidebar-counters.md`
- [ ] `git rm docs/workshop/README.md`
- [ ] `rmdir docs/workshop` (falls leer)
- [ ] Commit: `chore: Move workshop tasks to training-materials repo. ADAPT-WORKSHOP-TASKS`

### 5. Commit im Ziel-Repo

- [ ] Im Ziel-Repo prüfen: Git-Status, aktuelle Branch
- [ ] Neuer Branch im Ziel-Repo: `add-workshop-tasks` oder direkt auf `main` (Rückfrage an User)
- [ ] `git add tasks/new/` und committen
- [ ] Commit-Message: `docs: Add adapted beginner workshop tasks`

### 6. Verifizierung

- [ ] Alle acht Dateien im Ziel-Ordner vorhanden
- [ ] README.md im Ziel-Ordner listet genau acht Aufgaben
- [ ] Keine Aufgabe referenziert Gehalt oder Vertrag
- [ ] Keine Aufgabe referenziert Bootstrap Icons (`bi-*`)
- [ ] Alle Prompts lassen sich so formuliert wieder über `/plan-and-do` ausführen

## Tests

### Verifikation je Aufgabe

- [ ] Aufgabe 01: Chance-Enums existieren (NEU, QUALIFIZIERT, ANGEBOT,
  VERHANDLUNG, GEWONNEN, VERLOREN) — prüfen via Grep auf `main`
- [ ] Aufgabe 02: `createdAt`-Spalte auf Firma-Tabelle — prüfen in migrate.ts
- [ ] Aufgabe 03: Person-Schema auf `main` prüfen, ob `notiz` noch nicht existiert
- [ ] Aufgabe 04: Firma-Liste-Komponente existiert auf `main`
- [ ] Aufgabe 05: FontAwesome Moon/Sun in `free-solid-svg-icons` verfügbar
- [ ] Aufgabe 06: Aktivitaet-Typ-Enum-Werte auf `main` (ANRUF, EMAIL, MEETING, NOTIZ)
- [ ] Aufgabe 07: `firma`-Tabelle hat noch kein `is_favorit`
- [ ] Aufgabe 08: `/api/dashboard` liefert geeignete Zählfelder

### Edge Cases

- [ ] Beim Entfernen der Quell-Dateien: `docs/workshop/` komplett leer? Dann
  Ordner entfernen
- [ ] Falls das Ziel-Repo uncommitted changes hat: User warnen, nicht still
  überschreiben
- [ ] FontAwesome-Icon-Namen verifizieren (`free-solid-svg-icons` exportiert
  die vorgeschlagenen Icons)
