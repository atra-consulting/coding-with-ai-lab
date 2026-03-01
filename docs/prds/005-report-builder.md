# PRD-005: Report-Builder — Dynamische Auswertungen

## 1. Übersicht

Das CRM erhält einen konfigurierbaren Report-Builder, mit dem Nutzer eigene Auswertungen zusammenstellen können. Über eine Inline-Toolbar (Pivot-Tabellen-Stil, siehe [UXDR-001](../uxdr/001-report-builder-design.md)) wählen Nutzer Dimension, Metriken, Filter und Visualisierung — das Ergebnis aktualisiert sich live darunter. Fertige Auswertungen können als „Saved Reports" gespeichert und jederzeit wieder aufgerufen werden.

Dies ist Phase 3 des Auswertungs-Moduls, aufbauend auf dem statischen Dashboard (PRD-003) und der Dashboard-Konfigurierbarkeit (PRD-004).

## 2. Problemstellung

- **Starre Auswertungen**: Das bestehende Dashboard zeigt fünf feste Widgets. Nutzer können die Reihenfolge ändern, aber nicht die Fragestellung — z.B. „Pipeline-Wert nach Firma statt nach Phase" ist nicht möglich.
- **Keine zeitliche Eingrenzung**: Es gibt keinen Datumsbereich-Filter. Nutzer können nicht auswerten, wie sich die Pipeline im letzten Quartal entwickelt hat.
- **Keine Wiederverwendbarkeit**: Jede Fragestellung muss jedes Mal mental neu formuliert werden. Es gibt keine Möglichkeit, eine Auswertung zu speichern und später erneut aufzurufen.
- **Einzelne Perspektive**: Die Daten können nur nach Phase gruppiert werden. Gruppierung nach Firma, Person oder Zeitraum fehlt.

## 3. Ziele

- Nutzer können Dimension (Gruppierung), Metriken (Kennzahlen) und Visualisierung frei kombinieren.
- Ergebnisse aktualisieren sich live bei jeder Änderung.
- Optional kann nach Zeitraum und Phase gefiltert werden.
- Auswertungen können als „Saved Reports" gespeichert und wieder aufgerufen werden.
- Die bestehenden Pipeline-Dashboard-Widgets (Phase 1/2) bleiben unverändert erhalten.

## 4. Nicht-Ziele (Out of Scope)

- Entitätsübergreifende Auswertungen (Firmen, Aktivitäten, Verträge) — kann in einer späteren Iteration als weitere Datenquelle ergänzt werden.
- Export als PDF/Excel.
- Teilen von Reports zwischen Nutzern.
- Echtzeit-Synchronisation (WebSocket).
- Drill-Down von Chart-Elementen in gefilterte Listenansichten.
- Mehrere Dimensionen gleichzeitig (z.B. Phase × Firma als Matrix) — zunächst nur eine Dimension.
- Scheduled Reports (automatischer Versand per E-Mail).

## 5. Bestehendes System

### Backend

- **AuswertungService/Controller**: Drei feste Endpoints (`/pipeline/kpis`, `/pipeline/by-phase`, `/pipeline/top-firmen`) mit fest codierten Queries.
- **ChanceRepository**: Aggregat-Queries via `@Query` mit `Object[]`-Returns. H2-Eigenheit: `Double` statt `BigDecimal`.
- **DashboardConfig**: Entity für benutzergebundene Dashboard-Konfiguration (Widget-Reihenfolge).
- **Chance-Entity**: `titel`, `wert` (BigDecimal), `wahrscheinlichkeit` (int), `erwartetesDatum` (LocalDate), `phase` (ChancePhase), `firma` (FK), `kontaktPerson` (FK).

### Frontend

- **Pipeline-Dashboard**: Widget-basiert mit Edit-Mode, Drag & Drop, Chart.js-Charts, Pivot-Tabelle.
- **Routing**: `/auswertungen/pipeline` (Dashboard).
- **AuswertungService**: HTTP-Client für die drei festen Endpoints.
- **DashboardConfigService**: Laden/Speichern der Widget-Konfiguration.

## 6. Anforderungen

### 6.1 Backend

#### 6.1.1 Dynamischer Query-Endpoint

Ein einzelner Endpoint, der Dimension, Metriken und Filter als Parameter entgegennimmt und die Ergebnisse dynamisch berechnet.

**Endpoint**: `POST /api/auswertungen/report`

**Request Body** (`ReportQueryDTO`):
```json
{
  "dimension": "FIRMA",
  "metriken": ["ANZAHL", "SUMME_WERT", "DURCHSCHNITT_WERT"],
  "filter": {
    "phasen": ["NEU", "QUALIFIZIERT", "ANGEBOT", "VERHANDLUNG"],
    "datumVon": "2026-01-01",
    "datumBis": "2026-03-31"
  }
}
```

**Response** (`ReportResultDTO`):
```json
{
  "dimension": "FIRMA",
  "metriken": ["ANZAHL", "SUMME_WERT", "DURCHSCHNITT_WERT"],
  "zeilen": [
    {
      "label": "Müller GmbH",
      "id": 1,
      "werte": {
        "ANZAHL": 5,
        "SUMME_WERT": 89000.00,
        "DURCHSCHNITT_WERT": 17800.00
      }
    },
    {
      "label": "Schmidt AG",
      "id": 2,
      "werte": {
        "ANZAHL": 3,
        "SUMME_WERT": 67000.00,
        "DURCHSCHNITT_WERT": 22333.33
      }
    }
  ]
}
```

**Dimensionen** (Enum `ReportDimension`):

| Wert | Gruppierung | Label-Feld | ID-Feld |
|------|-------------|------------|---------|
| `PHASE` | `c.phase` | Phase-Label (Enum-Name) | — |
| `FIRMA` | `c.firma.id, c.firma.name` | Firmenname | Firma-ID |
| `PERSON` | `c.kontaktPerson.id, ...` | Vor- + Nachname | Person-ID |
| `MONAT` | `YEAR(c.erwartetesDatum), MONTH(...)` | „2026-01" | — |
| `QUARTAL` | `YEAR(c.erwartetesDatum), QUARTER(...)` | „Q1 2026" | — |
| `JAHR` | `YEAR(c.erwartetesDatum)` | „2026" | — |

**Metriken** (Enum `ReportMetrik`):

| Wert | Aggregation | Beschreibung |
|------|-------------|--------------|
| `ANZAHL` | `COUNT(c)` | Anzahl Chancen |
| `SUMME_WERT` | `SUM(c.wert)` | Summierter Wert |
| `DURCHSCHNITT_WERT` | `AVG(c.wert)` | Durchschnittlicher Wert |
| `GEWICHTETER_WERT` | `SUM(c.wert * c.wahrscheinlichkeit / 100)` | Wahrscheinlichkeitsgewichteter Wert |
| `GEWINNRATE` | `COUNT(GEWONNEN) / COUNT(GEWONNEN + VERLOREN) * 100` | Gewinnrate in Prozent |

**Filter** (`ReportFilterDTO`):

| Feld | Typ | Beschreibung |
|------|-----|--------------|
| `phasen` | `List<ChancePhase>` | Nur diese Phasen einbeziehen. `null` oder leer = alle. |
| `datumVon` | `LocalDate` | Erwartetes Datum ab (inklusiv). `null` = kein Startfilter. |
| `datumBis` | `LocalDate` | Erwartetes Datum bis (inklusiv). `null` = kein Endfilter. |

**Implementierung**: Der `ReportService` baut die JPQL-Query dynamisch zusammen, basierend auf Dimension und Filter. Die Metriken werden als berechnete Spalten in die SELECT-Klausel eingefügt. Kein Raw-SQL, sondern JPQL mit `EntityManager.createQuery()` und dynamischem String-Bau.

**Hinweis zur Gewinnrate**: Die Metrik `GEWINNRATE` erfordert eine Sonderbehandlung. Sie wird nicht wie die anderen Metriken als einfache Aggregation berechnet, sondern als Verhältnis GEWONNEN/(GEWONNEN+VERLOREN) pro Gruppe. Wenn ein Phasen-Filter aktiv ist, der GEWONNEN oder VERLOREN ausschließt, wird die Gewinnrate als `null` zurückgegeben.

#### 6.1.2 Saved Reports — CRUD-Endpoints

Gespeicherte Reports werden als eigene Entity mit Benutzer-Beziehung modelliert.

**Entity**: `SavedReport`

| Feld | Typ | Beschreibung |
|------|-----|--------------|
| `id` | Long | PK |
| `benutzer` | Benutzer (FK) | Ersteller |
| `name` | String | Anzeigename |
| `config` | String (JSON) | Serialisierte `ReportQueryDTO` |
| `createdAt` | LocalDateTime | Erstellzeitpunkt |
| `updatedAt` | LocalDateTime | Letzte Änderung |

**Endpoints**:

| Methode | Pfad | Beschreibung |
|---------|------|--------------|
| `GET` | `/api/saved-reports` | Alle Reports des eingeloggten Benutzers |
| `POST` | `/api/saved-reports` | Neuen Report speichern |
| `PUT` | `/api/saved-reports/{id}` | Report umbenennen oder Config aktualisieren |
| `DELETE` | `/api/saved-reports/{id}` | Report löschen |

**Autorisierung**: Ein Benutzer kann nur seine eigenen Reports sehen, bearbeiten und löschen.

### 6.2 Frontend

#### 6.2.1 Neue Route und Navigation

**Route**: `/auswertungen/report-builder`

**Sidebar**: Neuer Eintrag „Report-Builder" unter dem bestehenden „Pipeline"-Eintrag in der Sektion „Auswertungen".

**Saved Report laden**: `/auswertungen/report-builder?report={id}` — lädt den gespeicherten Report und füllt die Toolbar vor.

#### 6.2.2 Inline-Konfigurator (Toolbar)

Kompakte Toolbar oberhalb des Ergebnisbereichs mit Dropdowns:

```
┌──────────────────────────────────────────────────────────────────────────────┐
│  Auswertungen > Report-Builder                                [Speichern]   │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  Gruppieren: [Phase      ▼]    Metrik: [Summe Wert ▼] [Anzahl ▼] [+]       │
│  Zeitraum:   [Alle Daten ▼]    Filter: [Alle Phasen ▼]                      │
│  Anzeige:    [Tabelle    ▼]                                                  │
│                                                                              │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  [Ergebnisbereich — Tabelle oder Chart]                                      │
│                                                                              │
├──────────────────────────────────────────────────────────────────────────────┤
│ Gespeicherte Reports:                                                        │
│ [📊 Pipeline nach Quartal] [📊 Top Firmen Q1] [+ Neuer Report]             │
└──────────────────────────────────────────────────────────────────────────────┘
```

**Toolbar-Elemente**:

| Element | Typ | Optionen | Default |
|---------|-----|----------|---------|
| Gruppieren | Dropdown (Einzelwahl) | Phase, Firma, Person, Monat, Quartal, Jahr | Phase |
| Metrik | Multi-Select Chips | Anzahl, Summe Wert, Ø Wert, Gewichteter Wert, Gewinnrate | Summe Wert |
| Zeitraum | Dropdown → Datepicker | „Alle Daten", „Letztes Quartal", „Letztes Jahr", „Benutzerdefiniert" (Von/Bis) | Alle Daten |
| Filter | Multi-Select Dropdown | Alle Phasen als Checkboxen | Alle ausgewählt |
| Anzeige | Dropdown (Einzelwahl) | Tabelle, Balkendiagramm, Liniendiagramm, Kreisdiagramm | Tabelle |

**Verhalten**:
- Jede Änderung an der Toolbar löst sofort einen neuen API-Call aus.
- Während des Ladens wird ein Spinner über dem Ergebnisbereich angezeigt (Overlay, nicht Ganzseitenspinner).
- Debounce von 300ms bei Datepicker-Eingaben, um übermäßige API-Calls zu vermeiden.

#### 6.2.3 Metriken-Auswahl

Die Metriken werden als Chips (kleine Badges) dargestellt. Aktive Metriken sind farbig hervorgehoben, inaktive ausgegraut.

```
Metrik: [Summe Wert ✕] [Anzahl ✕]  [+ Metrik hinzufügen ▼]
```

- Klick auf ein ✕ entfernt die Metrik.
- „+ Metrik hinzufügen" öffnet ein Dropdown mit den verbleibenden Metriken.
- Mindestens eine Metrik muss ausgewählt sein (letzte kann nicht entfernt werden).

#### 6.2.4 Ergebnisdarstellung — Tabelle

```
┌──────────────────────────────────────────────────────────────────┐
│ Phase        │ Summe Wert    │ Anzahl │                          │
├──────────────┼───────────────┼────────┤                          │
│ Neu          │ € 145.000,00  │ 12     │                          │
│ Qualifiziert │ € 120.000,00  │  8     │                          │
│ Angebot      │ €  89.000,00  │  5     │                          │
│ Verhandlung  │ €  67.000,00  │  3     │                          │
│ Gewonnen     │ € 234.000,00  │ 12     │                          │
│ Verloren     │ €  52.000,00  │  6     │                          │
├──────────────┼───────────────┼────────┤                          │
│ GESAMT       │ € 707.000,00  │ 46     │                          │
└──────────────────────────────────────────────────────────────────┘
```

- Erste Spalte = Dimensionslabel (Phase-Badge, Firmenname, Datumsformat).
- Folgespalten = gewählte Metriken.
- Summenzeile am Ende.
- Bootstrap-Tabelle (`table-striped table-hover`) im `table-container`.
- Sortierung: Klick auf Spaltenheader sortiert die Tabelle (auf-/absteigend).

#### 6.2.5 Ergebnisdarstellung — Charts

Die Chart-Darstellung nutzt die gleichen Daten wie die Tabelle:

| Anzeige | X/Y-Achse | Datenquelle |
|---------|-----------|-------------|
| Balkendiagramm | X = Dimension, Y = erste Metrik | Balken pro Gruppe, Farbe nach Dimension |
| Liniendiagramm | X = Dimension, Y = erste Metrik | Sinnvoll bei Zeitdimensionen (Monat, Quartal, Jahr) |
| Kreisdiagramm | Segmente = Dimension, Größe = erste Metrik | Bei wenigen Gruppen (< 10) |

**Hinweis**: Bei mehreren gewählten Metriken wird nur die erste Metrik im Chart visualisiert. Unterhalb des Charts wird immer die vollständige Tabelle mit allen Metriken angezeigt.

#### 6.2.6 Saved Reports

**Speichern**: Der „Speichern"-Button im Page-Header öffnet ein Modal:
- Eingabefeld für den Report-Namen.
- Wenn ein bestehender Report geladen ist: Vorausgefüllt mit dem bestehenden Namen + Option „Als neuen Report speichern" oder „Überschreiben".

**Report-Leiste**: Am unteren Rand des Ergebnisbereichs wird eine horizontale Leiste mit gespeicherten Reports angezeigt:
```
Gespeicherte Reports:
[📊 Pipeline Q1 ✕] [📊 Top Firmen ✕] [+ Neuer Report]
```
- Klick auf einen Report lädt dessen Konfiguration in die Toolbar.
- ✕ löscht den Report (mit Bestätigungsdialog).
- „+ Neuer Report" setzt die Toolbar auf Defaults zurück.

#### 6.2.7 Leerzustand

Beim ersten Besuch (keine gespeicherten Reports) wird die Toolbar mit Defaults befüllt (Phase, Summe Wert, Tabelle) und das Ergebnis sofort angezeigt — kein leerer Zustand.

## 7. UX-Wireframe

### Gesamtansicht mit Tabelle
```
┌──────────────────────────────────────────────────────────────────────────────┐
│  Auswertungen > Report-Builder                                [💾 Speichern]│
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  Gruppieren: [Phase      ▼]    Metrik: [Summe Wert ✕] [Anzahl ✕] [+ ▼]    │
│  Zeitraum:   [Alle Daten ▼]    Phase:  [Alle Phasen ▼]                      │
│  Anzeige:    [Tabelle    ▼]                                                  │
│                                                                              │
│  ┌──────────────────────────────────────────────────────────────────────┐    │
│  │ Phase          │ Summe Wert     │ Anzahl │                           │    │
│  ├────────────────┼────────────────┼────────┤                           │    │
│  │ ■ Neu          │ € 145.000,00   │ 12     │                           │    │
│  │ ■ Qualifiziert │ € 120.000,00   │  8     │                           │    │
│  │ ■ Angebot      │ €  89.000,00   │  5     │                           │    │
│  │ ■ Verhandlung  │ €  67.000,00   │  3     │                           │    │
│  │ ■ Gewonnen     │ € 234.000,00   │ 12     │                           │    │
│  │ ■ Verloren     │ €  52.000,00   │  6     │                           │    │
│  ├────────────────┼────────────────┼────────┤                           │    │
│  │ GESAMT         │ € 707.000,00   │ 46     │                           │    │
│  └──────────────────────────────────────────────────────────────────────┘    │
│                                                                              │
│  Gespeicherte Reports:                                                       │
│  [📊 Pipeline nach Quartal] [📊 Top Firmen offen] [+ Neuer Report]         │
└──────────────────────────────────────────────────────────────────────────────┘
```

### Gesamtansicht mit Chart + Tabelle
```
┌──────────────────────────────────────────────────────────────────────────────┐
│  Auswertungen > Report-Builder                                [💾 Speichern]│
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  Gruppieren: [Quartal    ▼]    Metrik: [Summe Wert ✕] [+ ▼]                │
│  Zeitraum:   [Letztes Jahr ▼]  Phase:  [Alle Phasen ▼]                      │
│  Anzeige:    [Liniendiagramm ▼]                                              │
│                                                                              │
│  ┌──────────────────────────────────────────────────────────────────────┐    │
│  │ €                                                                    │    │
│  │ 250k ┤                                              ●               │    │
│  │ 200k ┤                            ●                                  │    │
│  │ 150k ┤              ●                                                │    │
│  │ 100k ┤ ●                                                             │    │
│  │      └────────────────────────────────────────────────────           │    │
│  │        Q1 2025    Q2 2025    Q3 2025    Q4 2025                      │    │
│  └──────────────────────────────────────────────────────────────────────┘    │
│                                                                              │
│  ┌──────────────────────────────────────────────────────────────────────┐    │
│  │ Quartal   │ Summe Wert     │                                         │    │
│  ├───────────┼────────────────┤                                         │    │
│  │ Q1 2025   │ € 105.000,00   │                                         │    │
│  │ Q2 2025   │ € 148.000,00   │                                         │    │
│  │ Q3 2025   │ € 198.000,00   │                                         │    │
│  │ Q4 2025   │ € 256.000,00   │                                         │    │
│  ├───────────┼────────────────┤                                         │    │
│  │ GESAMT    │ € 707.000,00   │                                         │    │
│  └──────────────────────────────────────────────────────────────────────┘    │
│                                                                              │
│  Gespeicherte Reports:                                                       │
│  [📊 Pipeline nach Quartal] [📊 Top Firmen offen] [+ Neuer Report]         │
└──────────────────────────────────────────────────────────────────────────────┘
```

## 8. Technische Umsetzung

### 8.1 Neue Dateien

**Backend (8 Dateien)**:
1. `entity/enums/ReportDimension.java` — Enum: PHASE, FIRMA, PERSON, MONAT, QUARTAL, JAHR.
2. `entity/enums/ReportMetrik.java` — Enum: ANZAHL, SUMME_WERT, DURCHSCHNITT_WERT, GEWICHTETER_WERT, GEWINNRATE.
3. `dto/ReportQueryDTO.java` — Record: dimension, metriken, filter.
4. `dto/ReportFilterDTO.java` — Record: phasen, datumVon, datumBis.
5. `dto/ReportResultDTO.java` — Record: dimension, metriken, zeilen (List\<ReportZeileDTO\>).
6. `dto/ReportZeileDTO.java` — Record: label, id, werte (Map\<String, Number\>).
7. `service/ReportService.java` — Dynamische JPQL-Query-Erstellung, Aggregation.
8. `controller/ReportController.java` — `POST /api/auswertungen/report`.

**Backend — Saved Reports (5 Dateien)**:
9. `entity/SavedReport.java` — Entity mit Benutzer-FK, name, config (JSON).
10. `dto/SavedReportDTO.java` — Record für API.
11. `dto/SavedReportCreateDTO.java` — Record für Create/Update.
12. `repository/SavedReportRepository.java` — `findByBenutzerId()`.
13. `service/SavedReportService.java` — CRUD-Logik.
14. `controller/SavedReportController.java` — CRUD-Endpoints.

**Frontend (5 Dateien)**:
1. `core/models/report.model.ts` — TypeScript-Interfaces für Query, Result, SavedReport.
2. `core/services/report.service.ts` — HTTP-Client für Report-Query.
3. `core/services/saved-report.service.ts` — HTTP-Client für Saved Reports CRUD.
4. `features/auswertung/report-builder/report-builder.component.ts` — Komponente mit Toolbar-Logik, Chart-Bau, Saved-Report-Verwaltung.
5. `features/auswertung/report-builder/report-builder.component.html` — Template.
6. `features/auswertung/report-builder/report-builder.component.scss` — Styling.

### 8.2 Geänderte Dateien

**Frontend**:
- `auswertung.routes.ts` — Neue Route `/report-builder`.
- `sidebar.component.ts` — Neuer Eintrag „Report-Builder".

### 8.3 Dynamische Query-Erstellung (Backend)

Der `ReportService` baut die JPQL-Query dynamisch zusammen:

```java
// Pseudocode
String jpql = "SELECT " + dimensionSelect(dimension) + ", "
            + metrikSelects(metriken)
            + " FROM Chance c"
            + " LEFT JOIN c.firma f"
            + " LEFT JOIN c.kontaktPerson p"
            + whereClause(filter)
            + " GROUP BY " + dimensionGroupBy(dimension)
            + " ORDER BY " + dimensionOrderBy(dimension);
```

Jede Dimension und Metrik hat eine definierte Mapping-Funktion, die den JPQL-Fragment-String zurückgibt. Es werden keine Benutzereingaben in die Query eingebaut (nur Enum-Werte und parametrisierte Werte) — SQL-Injection ist damit ausgeschlossen.

### 8.4 Abhängigkeiten

- Keine neuen Dependencies. Chart.js und Angular CDK sind bereits vorhanden.

## 9. Akzeptanzkriterien

1. **Dimensionswahl**: Dropdown mit 6 Dimensionen. Wechsel aktualisiert das Ergebnis sofort.
2. **Metrikenwahl**: Mindestens eine, bis zu alle fünf Metriken gleichzeitig wählbar. Chips mit Entfernen-Funktion.
3. **Filter — Phasen**: Multi-Select-Dropdown, um bestimmte Phasen ein-/auszuschließen. Default: alle.
4. **Filter — Zeitraum**: Dropdown mit Presets („Alle Daten", „Letztes Quartal", „Letztes Jahr") plus „Benutzerdefiniert" mit Datepicker.
5. **Visualisierung — Tabelle**: Korrekte Tabelle mit Dimensionslabel, allen gewählten Metriken und Summenzeile.
6. **Visualisierung — Charts**: Balken-, Linien- und Kreisdiagramm zeigen die erste Metrik. Tabelle immer zusätzlich sichtbar.
7. **Saved Reports — Speichern**: Report-Name vergeben, Konfiguration wird im Backend persistiert.
8. **Saved Reports — Laden**: Klick auf gespeicherten Report füllt Toolbar und zeigt Ergebnis.
9. **Saved Reports — Löschen**: Mit Bestätigungsdialog.
10. **Saved Reports — Aktualisieren**: Bestehenden Report überschreiben.
11. **Live-Update**: Jede Toolbar-Änderung löst einen neuen API-Call aus. Ladespinner über dem Ergebnis.
12. **Leerer Zustand**: Beim ersten Besuch werden Default-Werte verwendet — kein leeres Dashboard.
13. **Navigation**: „Report-Builder" in der Sidebar unter „Auswertungen" erreichbar.
14. **Autorisierung**: Benutzer sehen nur eigene Saved Reports.
15. **Responsive**: Toolbar bricht auf kleinen Bildschirmen sinnvoll um.

## 10. Offene Fragen

_Keine._
