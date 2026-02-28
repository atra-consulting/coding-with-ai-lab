# PRD: Auswertungen — Chancen-Pipeline Analytics

## 1. Übersicht

Das CRM erhält ein Auswertungs-Modul mit Fokus auf die Chancen-Pipeline. In **Phase 1** werden feste Dashboard-Kacheln mit KPIs, Diagrammen und einer Pivot-ähnlichen Tabelle bereitgestellt. In **Phase 2** (separates PRD) folgt ein konfigurierbarer Report-Builder, in dem Nutzer Dimensionen und Metriken frei kombinieren können.

Dieses PRD beschreibt **Phase 1**.

## 2. Problemstellung

- **Kein Reporting**: Aktuell gibt es keine Möglichkeit, die Chancen-Pipeline analytisch auszuwerten. Nutzer müssen Daten manuell zusammentragen oder exportieren.
- **Fehlende KPIs**: Kennzahlen wie Gewinnrate, durchschnittliche Deal-Größe oder Pipeline-Entwicklung über die Zeit sind nicht verfügbar.
- **Kein Trend-Überblick**: Es gibt keine zeitliche Darstellung, wie sich die Pipeline verändert — ob sie wächst, schrumpft oder stagniert.

## 3. Ziele

- Nutzer erhalten einen sofortigen Überblick über die wichtigsten Pipeline-Kennzahlen.
- Diagramme visualisieren Verteilung, Trends und Top-Performer.
- Eine Pivot-ähnliche Tabelle ermöglicht gruppierte Auswertungen nach Phase.
- Das Dashboard lädt performant über dedizierte Aggregat-Endpoints.

## 4. Nicht-Ziele (Out of Scope — Phase 1)

- Konfigurierbarer Report-Builder (Phase 2).
- Export als PDF/Excel.
- Entitätsübergreifende Auswertungen (Firmen, Personen, Aktivitäten, Verträge).
- Echtzeit-Updates via WebSocket.
- Drill-Down von Chart-Elementen in gefilterte Listenansichten.
- Datumsbereich-Filter (Phase 1 zeigt immer den Gesamtbestand).

## 5. Bestehendes System

### Backend

- **Entity**: `Chance` mit Feldern `titel`, `wert` (BigDecimal), `wahrscheinlichkeit` (int), `erwartetesDatum` (LocalDate), `phase` (ChancePhase-Enum), `firma` (FK), `person` (FK).
- **ChancePhase-Enum**: `NEU`, `QUALIFIZIERT`, `ANGEBOT`, `VERHANDLUNG`, `GEWONNEN`, `VERLOREN`.
- **Board-Endpoints** (bereits vorhanden): `GET /api/chancen/board/summary` liefert Count und Summe pro Phase.
- **H2-Eigenheit**: Aggregate via `@Query` liefern `Double` statt `BigDecimal` — Konvertierung über `BigDecimal.valueOf(((Number) val).doubleValue())`.

### Frontend

- **Routing**: `/chancen` (Liste), `/chancen/board` (Kanban), `/chancen/neu`, `/chancen/:id`, `/chancen/:id/bearbeiten`.
- **Charting**: Noch keine Charting-Library vorhanden.
- **Sidebar**: Navigation mit Sektionen (Stammdaten, Vertrieb, etc.).

## 6. Anforderungen

### 6.1 Backend

#### 6.1.1 Endpoint: Pipeline-KPIs

Liefert die vier zentralen Kennzahlen als einzelnes Objekt.

**Endpoint**: `GET /api/auswertungen/pipeline/kpis`

**Response** (`PipelineKpisDTO`):
```json
{
  "gesamtwert": 1250000.00,
  "anzahlOffen": 35,
  "gewinnrate": 62.5,
  "durchschnittlicherWert": 25000.00
}
```

| Feld | Berechnung |
|------|-----------|
| `gesamtwert` | Summe `wert` aller Chancen mit Phase ∉ {GEWONNEN, VERLOREN} |
| `anzahlOffen` | Anzahl Chancen mit Phase ∉ {GEWONNEN, VERLOREN} |
| `gewinnrate` | `GEWONNEN / (GEWONNEN + VERLOREN) * 100` — `null` wenn keine abgeschlossenen Chancen |
| `durchschnittlicherWert` | Durchschnitt `wert` aller Chancen (alle Phasen) |

#### 6.1.2 Endpoint: Wert pro Phase

Liefert Anzahl, Summe und Durchschnittswert gruppiert nach Phase — für das Balkendiagramm und die Pivot-Tabelle.

**Endpoint**: `GET /api/auswertungen/pipeline/by-phase`

**Response** (`List<PhaseAggregateDTO>`):
```json
[
  {
    "phase": "NEU",
    "anzahl": 12,
    "summeWert": 145000.00,
    "durchschnittWert": 12083.33,
    "summeGewichtet": 29000.00
  },
  ...
]
```

| Feld | Berechnung |
|------|-----------|
| `phase` | ChancePhase-Wert |
| `anzahl` | Count pro Phase |
| `summeWert` | Summe `wert` pro Phase |
| `durchschnittWert` | Durchschnitt `wert` pro Phase |
| `summeGewichtet` | Summe von `wert * wahrscheinlichkeit / 100` pro Phase |

#### 6.1.3 Endpoint: Top-Firmen nach Pipeline-Wert

Liefert die Firmen mit dem höchsten offenen Pipeline-Wert (Phasen ∉ {GEWONNEN, VERLOREN}).

**Endpoint**: `GET /api/auswertungen/pipeline/top-firmen?limit=10`

**Query-Parameter**:
- `limit` (int, default `10`) — Anzahl Firmen

**Response** (`List<TopFirmaDTO>`):
```json
[
  {
    "firmaId": 1,
    "firmaName": "Müller GmbH",
    "anzahlChancen": 5,
    "summeWert": 89000.00
  },
  ...
]
```

#### 6.1.4 Endpoint: Phasen-Verteilung (für Kreisdiagramm)

Kann von 6.1.2 abgeleitet werden — kein separater Endpoint nötig. Das Frontend nutzt `anzahl` aus `/by-phase`.

### 6.2 Frontend

#### 6.2.1 Neue Route und Navigation

**Route**: `/auswertungen`

**Sidebar**: Neuer Navigations-Abschnitt „Auswertungen" mit Eintrag „Pipeline" unterhalb des bestehenden Vertrieb-Bereichs.

#### 6.2.2 Dashboard-Layout

Das Dashboard besteht aus vier Bereichen, angeordnet in einem responsiven Grid:

```
┌─────────────────────────────────────────────────────────────────────┐
│  Auswertungen: Pipeline                                             │
├────────────┬────────────┬────────────┬────────────┐                 │
│  Offener    │  Offene     │  Gewinn-   │  Ø Deal-   │                │
│  Pipeline-  │  Chancen    │  rate      │  Größe     │                │
│  Wert       │             │            │            │                │
│  € 1.25 Mio│  35         │  62,5 %    │  € 25.000  │                │
├────────────┴────────────┴────────────┴────────────┘                 │
├─────────────────────────────────┬───────────────────────────────────┤
│  Pipeline-Wert nach Phase       │  Verteilung nach Phase            │
│  ┌──────────────────────────┐   │  ┌───────────────────────────┐    │
│  │  ████                    │   │  │         ████               │    │
│  │  ██████████              │   │  │      ███    ███            │    │
│  │  ████████                │   │  │    ██          ██          │    │
│  │  ██████                  │   │  │     ███    ███             │    │
│  │  ████████████████        │   │  │        ████               │    │
│  │  ██                      │   │  └───────────────────────────┘    │
│  └──────────────────────────┘   │  Kreisdiagramm (Anzahl)          │
│  Balkendiagramm (€)             │                                   │
├─────────────────────────────────┴───────────────────────────────────┤
│  Top 10 Firmen nach offenem Pipeline-Wert                           │
│  ┌────────────────────────────────────────────────────────────────┐  │
│  │  ████████████████████████████████████████  Müller GmbH  €89k  │  │
│  │  ██████████████████████████████  Schmidt AG  €67k             │  │
│  │  ████████████████████  Weber & Co  €45k                       │  │
│  │  ...                                                          │  │
│  └────────────────────────────────────────────────────────────────┘  │
│  Horizontales Balkendiagramm                                        │
├─────────────────────────────────────────────────────────────────────┤
│  Übersicht nach Phase                                               │
│  ┌──────────────┬────────┬────────────┬──────────┬─────────────┐   │
│  │ Phase        │ Anzahl │ Summe Wert │ Ø Wert   │ Gewichteter │   │
│  │              │        │            │          │ Wert        │   │
│  ├──────────────┼────────┼────────────┼──────────┼─────────────┤   │
│  │ NEU          │ 12     │ € 145.000  │ € 12.083 │ € 29.000   │   │
│  │ QUALIFIZIERT │  8     │ € 120.000  │ € 15.000 │ € 48.000   │   │
│  │ ...          │        │            │          │             │   │
│  ├──────────────┼────────┼────────────┼──────────┼─────────────┤   │
│  │ GESAMT       │ 50     │ € 890.000  │ € 17.800 │ € 312.000  │   │
│  └──────────────┴────────┴────────────┴──────────┴─────────────┘   │
│  Pivot-Tabelle mit Summenzeile                                      │
└─────────────────────────────────────────────────────────────────────┘
```

#### 6.2.3 KPI-Kacheln (Zeile 1)

Vier Kacheln im bestehenden `widget-card`-Stil (wie bereits auf anderen Seiten verwendet):

| Kachel | Wert | Farbe | Icon |
|--------|------|-------|------|
| Offener Pipeline-Wert | `gesamtwert` formatiert als Währung | `primary` | `fa-euro-sign` |
| Offene Chancen | `anzahlOffen` | `info` | `fa-handshake` |
| Gewinnrate | `gewinnrate` formatiert als Prozent | `success` | `fa-trophy` |
| Ø Deal-Größe | `durchschnittlicherWert` formatiert als Währung | `warning` | `fa-chart-bar` |

#### 6.2.4 Balkendiagramm — Pipeline-Wert nach Phase (Zeile 2, links)

- **Typ**: Vertikales Balkendiagramm.
- **X-Achse**: Phasen (NEU bis VERLOREN).
- **Y-Achse**: Summe Wert (€).
- **Farben**: Phasen-Farben aus dem Kanban-Board (primary, info, warning, secondary, success, danger).
- **Datenquelle**: `/by-phase` → `summeWert`.

#### 6.2.5 Kreisdiagramm — Verteilung nach Phase (Zeile 2, rechts)

- **Typ**: Doughnut-Chart.
- **Segmente**: Eine pro Phase, Größe nach `anzahl`.
- **Farben**: Wie Balkendiagramm.
- **Legende**: Rechts oder unterhalb, mit Phase-Name und Anzahl.
- **Datenquelle**: `/by-phase` → `anzahl`.

#### 6.2.6 Horizontales Balkendiagramm — Top-Firmen (Zeile 3)

- **Typ**: Horizontales Balkendiagramm.
- **Y-Achse**: Firmenname.
- **X-Achse**: Offener Pipeline-Wert (€).
- **Max. 10 Firmen**, sortiert absteigend.
- **Farbe**: Einheitlich `primary`.
- **Datenquelle**: `/top-firmen`.

#### 6.2.7 Pivot-Tabelle — Übersicht nach Phase (Zeile 4)

- **Spalten**: Phase, Anzahl, Summe Wert, Ø Wert, Gewichteter Wert.
- **Zeilen**: Eine pro Phase + Summenzeile „GESAMT" am Ende.
- **Formatierung**: Währungswerte als `€ XX.XXX,XX`, Phase als farbcodierter Badge.
- **Datenquelle**: `/by-phase`.
- **Styling**: Bootstrap-Tabelle (`table-striped table-hover`) im bestehenden `table-container`.

### 6.3 Charting-Library

**Chart.js** mit **ng2-charts** als Angular-Wrapper.

- Leichtgewichtig (~60 KB gzipped).
- Unterstützt Bar, Doughnut, Line, Horizontal Bar.
- Deklarative Nutzung via `<canvas baseChart ...>`.
- Gut dokumentiert und weit verbreitet im Angular-Ökosystem.

**Installation**:
```bash
npm install chart.js ng2-charts
```

## 7. Technische Umsetzung

### 7.1 Neue Dateien

**Backend (5 Dateien)**:
1. `AuswertungController.java` — REST-Controller unter `/api/auswertungen`.
2. `AuswertungService.java` — Business-Logik für Aggregationen.
3. `PipelineKpisDTO.java` — Record für KPI-Endpoint.
4. `PhaseAggregateDTO.java` — Record für Phase-Aggregation.
5. `TopFirmaDTO.java` — Record für Top-Firmen.

**Frontend (6 Dateien)**:
1. `core/models/auswertung.model.ts` — Interfaces für DTOs.
2. `core/services/auswertung.service.ts` — HTTP-Client-Wrapper.
3. `features/auswertung/auswertung.routes.ts` — Route-Konfiguration.
4. `features/auswertung/pipeline-dashboard/pipeline-dashboard.component.ts` — Dashboard-Logik.
5. `features/auswertung/pipeline-dashboard/pipeline-dashboard.component.html` — Template.
6. `features/auswertung/pipeline-dashboard/pipeline-dashboard.component.scss` — Styling.

### 7.2 Geänderte Dateien

**Backend**:
- `ChanceRepository.java` — Neue `@Query`-Methoden für Aggregationen (oder Nutzung in `AuswertungService`).

**Frontend**:
- `app.routes.ts` — Neue lazy-loaded Route `/auswertungen`.
- `sidebar.component.html` — Neuer Navigations-Eintrag.
- `sidebar.component.ts` — Ggf. Import für neues Icon.
- `package.json` — Dependencies `chart.js` und `ng2-charts`.

### 7.3 Abhängigkeiten

- **chart.js** — Charting-Engine.
- **ng2-charts** — Angular-Directive-Wrapper für Chart.js.

## 8. Akzeptanzkriterien

1. **KPI-Kacheln**: Vier Kacheln zeigen korrekte, live berechnete Kennzahlen an.
2. **Balkendiagramm**: Zeigt Pipeline-Wert pro Phase mit korrekten Phasen-Farben.
3. **Kreisdiagramm**: Zeigt Chancen-Verteilung nach Anzahl pro Phase.
4. **Top-Firmen**: Horizontales Balkendiagramm zeigt die 10 Firmen mit höchstem offenen Pipeline-Wert.
5. **Pivot-Tabelle**: Tabelle zeigt alle Phasen mit Anzahl, Summe, Durchschnitt und gewichtetem Wert. Summenzeile am Ende.
6. **Navigation**: „Pipeline" ist in der Sidebar unter „Auswertungen" erreichbar.
7. **Responsive**: Dashboard passt sich an verschiedene Bildschirmgrößen an (Grid bricht um).
8. **Performance**: Alle Daten werden über drei API-Calls parallel geladen. Ladeindikator während des Ladens.
9. **Fehlerbehandlung**: Bei API-Fehlern wird ein Toast angezeigt (bestehender `apiErrorInterceptor`).
10. **Konsistenz**: Styling passt zum bestehenden Design (Bootstrap 5, widget-cards, Farbschema).

## 9. Phase 2 — Ausblick (separates PRD)

Für Phase 2 ist ein konfigurierbarer Report-Builder geplant:

- **Dimensionen wählbar**: Nutzer können nach Phase, Firma, Monat/Quartal/Jahr, Person gruppieren.
- **Metriken wählbar**: Anzahl, Summe, Durchschnitt, Gewichteter Wert, Gewinnrate.
- **Datumsbereich-Filter**: Von/Bis-Datum für zeitliche Eingrenzung.
- **Visualisierung wählbar**: Tabelle, Balkendiagramm, Liniendiagramm, Kreisdiagramm.
- **Speicherbare Reports**: Nutzer können Auswertungen als "Saved Reports" abspeichern.
- **Erweiterung auf andere Entitäten**: Aktivitäten, Verträge, Firmen.

## 10. Offene Fragen

_Keine — Phase 1 nutzt ausschließlich vorhandene Chancen-Daten und erfordert keine architekturellen Entscheidungen über das beschriebene hinaus._

## 11. Implementierung

_Noch nicht implementiert._
