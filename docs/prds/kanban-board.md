# PRD: Chancen-Pipeline als Kanban-Board

## 1. Übersicht

Die Chancen (Opportunities) des CRM sollen zusätzlich zur bestehenden Listenansicht als interaktives Kanban-Board dargestellt werden. Nutzer können Chancen per Drag & Drop zwischen Phasen verschieben und erhalten so einen visuellen Überblick über die Sales-Pipeline.

## 2. Problemstellung

Die aktuelle Listenansicht der Chancen zeigt alle Einträge in einer flachen Tabelle. Für Sales-Teams fehlt der visuelle Überblick:

- **Keine Pipeline-Sicht**: Man sieht nicht auf einen Blick, wie viele Chancen in welcher Phase stecken.
- **Umständliche Phase-Änderung**: Um die Phase einer Chance zu ändern, muss man in die Bearbeitungsansicht navigieren, das Dropdown ändern und speichern.
- **Fehlender Wert-Überblick**: Es gibt keine Aggregation des Gesamtwerts pro Phase.

## 3. Ziele

- Nutzer können die Sales-Pipeline auf einen Blick erfassen.
- Phase-Änderungen sind per Drag & Drop in unter 2 Sekunden möglich.
- Aggregierte Werte pro Phase sind sofort sichtbar.
- Die bestehende Listenansicht bleibt vollständig erhalten.
- Mittels eines Toggles kann zwischen Listenansicht und Piplelinesicht gewechselt werden.

## 4. Nicht-Ziele (Out of Scope)

- Inline-Bearbeitung von Chancen-Feldern direkt auf dem Board (außer Phase).
- Erstellen neuer Chancen per Drag auf das Board.
- Multi-Select und Bulk-Phase-Änderungen.
- Echtzeit-Synchronisation zwischen mehreren Nutzern (WebSocket).
- Filter- oder Suchfunktionalität auf dem Board (kann in einer späteren Iteration ergänzt werden).

## 5. Bestehendes System

### Backend

- **Entity**: `Chance` mit Feld `phase` vom Typ `ChancePhase` (Enum).
- **ChancePhase-Enum**: `NEU`, `QUALIFIZIERT`, `ANGEBOT`, `VERHANDLUNG`, `GEWONNEN`, `VERLOREN`.
- **Endpoints**: CRUD unter `/api/chancen` mit Pagination. Update via `PUT /api/chancen/{id}` erwartet ein vollständiges `ChanceCreateDTO`.
- **Seed-Daten**: 80 Chancen verteilt auf alle Phasen.

### Frontend

- **Listenansicht**: Tabelle mit Phase-Badges (farbcodiert), Pagination, Sortierung.
- **Detail/Form**: Vollständige CRUD-Operationen.
- **Routing**: `/chancen` (Liste), `/chancen/neu`, `/chancen/:id`, `/chancen/:id/bearbeiten`.

## 6. Anforderungen

### 6.1 Backend

#### 6.1.1 Neuer Endpoint: Chancen pro Phase (paginiert)

Das Kanban-Board lädt Chancen pro Spalte separat — paginiert mit konfigurierbarer Seitengröße (Default: 20). So werden nur die benötigten Daten geladen und das Board skaliert auch bei großen Datenmengen.

**Endpoint**: `GET /api/chancen/phase/{phase}`

**Query-Parameter**:
- `page` (int, default `0`) — Seite (0-indexiert)
- `size` (int, default `20`) — Anzahl pro Seite
- `sort` (String, default `wert,desc`) — Sortierung (höchster Wert zuerst)

**Response**: `Page<ChanceDTO>`

Die `Page`-Response enthält `totalElements` und `totalPages`, sodass das Frontend weiß, ob weitere Chancen in der Spalte vorhanden sind ("X weitere laden"-Button).

#### 6.1.2 Neuer Endpoint: Aggregate pro Phase

Für die Spalten-Header (Gesamtanzahl und Gesamtwert) wird ein eigener leichtgewichtiger Endpoint bereitgestellt. So stimmen die Aggregate auch dann, wenn nicht alle Chancen einer Spalte geladen sind.

**Endpoint**: `GET /api/chancen/board/summary`

**Response**:
```json
[
  { "phase": "NEU", "count": 12, "totalWert": 145000.00 },
  { "phase": "QUALIFIZIERT", "count": 8, "totalWert": 120000.00 },
  ...
]
```

Begründung: Wenn pro Spalte nur 20 Chancen geladen werden, kann das Frontend die Aggregate nicht selbst berechnen. Der Summary-Endpoint liefert die korrekten Gesamtzahlen unabhängig von der Pagination.

#### 6.1.3 Neuer Endpoint: Phase aktualisieren (PATCH)

Statt das vollständige `ChanceCreateDTO` zu senden, soll ein leichtgewichtiger PATCH-Endpoint nur die Phase aktualisieren.

**Endpoint**: `PATCH /api/chancen/{id}/phase`

**Request Body**:
```json
{
  "phase": "ANGEBOT"
}
```

**Response**: `ChanceDTO` (aktualisierte Chance)

**Validierung**: `phase` muss ein gültiger `ChancePhase`-Wert sein.

### 6.2 Frontend

#### 6.2.1 Kanban-Board-Komponente

**Route**: `/chancen/board`

**Layout**:
- 6 Spalten, eine pro `ChancePhase`, in der Reihenfolge: NEU → QUALIFIZIERT → ANGEBOT → VERHANDLUNG → GEWONNEN → VERLOREN.
- Jede Spalte hat einen Header mit Phasen-Name, Anzahl der Chancen und Summe der Werte (€).
- Horizontales Scrolling auf kleinen Bildschirmen.

**Karten**:
Jede Chance wird als Karte dargestellt mit:
- **Titel** (fett)
- **Firma** (Link zur Firma-Detailseite)
- **Wert** (formatiert als Währung, z.B. "€ 25.000,00")
- **Wahrscheinlichkeit** (als kleiner Badge, z.B. "70%")
- **Erwartetes Datum** (falls vorhanden)
- **Klick** auf die Karte navigiert zur Chance-Detailansicht.

**Drag & Drop**:
- Technologie: Angular CDK (`@angular/cdk/drag-drop`).
- Karten können zwischen Spalten verschoben werden.
- Beim Drop wird `PATCH /api/chancen/{id}/phase` aufgerufen.
- Optimistisches UI-Update: Karte wird sofort verschoben, bei Fehler zurückgesetzt mit Toast-Benachrichtigung.
- Nach erfolgreichem Drop wird der Summary-Endpoint erneut aufgerufen, um die Aggregate beider betroffenen Spalten zu aktualisieren.
- Visuelle Indikatoren: Drag-Placeholder und Drop-Zone-Highlight.

**Nachladen ("Mehr laden")**:
- Wenn eine Spalte mehr Chancen enthält als die initiale Seitengröße, wird am Spaltenende ein "X weitere laden"-Button angezeigt (basierend auf `totalElements` aus der Page-Response).
- Klick lädt die nächste Seite und hängt die Karten an.

#### 6.2.2 Navigation

- Neuer Tab/Toggle in der Chancen-Ansicht: "Liste" | "Board".
- Der Toggle wird oberhalb des Contents angezeigt und wechselt zwischen `/chancen` (Liste) und `/chancen/board` (Board).
- Beide Ansichten teilen den "Neue Chance"-Button.

#### 6.2.3 Spalten-Styling

Konsistentes Farbschema, passend zu den bestehenden Phase-Badges:

| Phase        | Farbe         | Bootstrap-Klasse |
|-------------|---------------|-------------------|
| NEU          | Blau          | `primary`         |
| QUALIFIZIERT | Cyan          | `info`            |
| ANGEBOT      | Gelb          | `warning`         |
| VERHANDLUNG  | Grau          | `secondary`       |
| GEWONNEN     | Grün          | `success`         |
| VERLOREN     | Rot           | `danger`          |

Die Spaltenheader verwenden die jeweilige Farbe als Akzent (farbiger oberer Rand).

## 7. UX-Wireframe

```
┌─────────────────────────────────────────────────────────────────────────┐
│  Chancen                                    [Liste | Board]  [+ Neu]   │
├───────────┬───────────┬───────────┬───────────┬───────────┬────────────┤
│ ■ NEU     │ ■ QUALIF. │ ■ ANGEBOT │ ■ VERHANDL│ ■ GEWONNEN│ ■ VERLOREN│
│ 5 Stk.    │ 8 Stk.    │ 4 Stk.    │ 3 Stk.    │ 12 Stk.   │ 6 Stk.   │
│ € 45.000  │ € 120.000 │ € 89.000  │ € 67.000  │ € 234.000 │ € 52.000 │
│───────────│───────────│───────────│───────────│───────────│───────────│
│ ┌───────┐ │ ┌───────┐ │ ┌───────┐ │ ┌───────┐ │ ┌───────┐ │ ┌───────┐│
│ │Projekt│ │ │Website│ │ │ERP    │ │ │Cloud  │ │ │CRM    │ │ │App    ││
│ │Alpha  │ │ │Relaun.│ │ │Migrat.│ │ │Lösung │ │ │Impl.  │ │ │Entw.  ││
│ │───────│ │ │───────│ │ │───────│ │ │───────│ │ │───────│ │ │───────││
│ │Müller │ │ │Schmidt│ │ │Weber  │ │ │Bauer  │ │ │Koch   │ │ │Richter││
│ │€5.000 │ │ │€12.00 │ │ │€25.00 │ │ │€18.00 │ │ │€30.00 │ │ │€8.000 ││
│ │  20%  │ │ │  40%  │ │ │  60%  │ │ │  70%  │ │ │ 100%  │ │ │   0%  ││
│ └───────┘ │ └───────┘ │ └───────┘ │ └───────┘ │ └───────┘ │ └───────┘│
│ ┌───────┐ │ ┌───────┐ │           │           │ ┌───────┐ │          │
│ │...    │ │ │...    │ │           │           │ │...    │ │          │
│ └───────┘ │ └───────┘ │           │           │ └───────┘ │          │
└───────────┴───────────┴───────────┴───────────┴───────────┴───────────┘
```

## 8. Technische Umsetzung

### 8.1 Neue Dateien

**Backend (4 Dateien)**:
1. `PhaseUpdateDTO.java` — Record mit einzelnem `phase`-Feld.
2. `BoardSummaryDTO.java` — Record mit `phase`, `count`, `totalWert`.
3. Ergänzungen in `ChanceService.java` — Methoden `findByPhase()`, `getBoardSummary()` und `updatePhase()`.
4. Ergänzungen in `ChanceController.java` — Neue Endpoints.

**Frontend (4 Dateien)**:
1. `chance-board.component.ts` — Kanban-Board-Logik.
2. `chance-board.component.html` — Board-Template.
3. `chance-board.component.scss` — Board-Styling.
4. Ergänzungen in `chance.service.ts` — Neue Service-Methoden.

### 8.2 Geänderte Dateien

**Backend**:
- `ChanceRepository.java` — Neue Query-Methoden.
- `ChanceService.java` — Neue Methoden.
- `ChanceController.java` — Neue Endpoints.

**Frontend**:
- `chance.service.ts` — Neue Methoden (`getByPhase()`, `getBoardSummary()`, `updatePhase()`).
- `chance.routes.ts` — Neue Route für Board.
- `chance-list.component.html` — Toggle-Navigation ergänzen.
- `chance-list.component.ts` — Toggle-Logik.

### 8.3 Abhängigkeiten

- **Angular CDK** (`@angular/cdk`) — Wird als Dependency hinzugefügt. Enthält `DragDropModule` für Drag & Drop. Kein zusätzliches Drittanbieter-Paket nötig.

## 9. Akzeptanzkriterien

1. **Board zeigt Chancen pro Spalte**: Chancen werden pro Phase geladen (Default: 50 pro Spalte) und korrekt angezeigt.
2. **Spalten-Aggregate**: Jede Spalte zeigt korrekte Gesamtanzahl und Gesamtwert an (via Summary-Endpoint, unabhängig von Pagination).
3. **Nachladen**: Wenn mehr Chancen vorhanden sind als geladen, wird ein "Mehr laden"-Button angezeigt und funktioniert.
4. **Drag & Drop funktioniert**: Karten können zwischen Spalten verschoben werden, Phase wird im Backend aktualisiert.
5. **Fehlerbehandlung**: Bei fehlgeschlagenem API-Call wird die Karte zurückgesetzt und ein Fehler-Toast angezeigt.
6. **Navigation**: Toggle zwischen Listen- und Board-Ansicht funktioniert.
7. **Karten-Klick**: Klick auf Karte navigiert zur Detailansicht.
8. **Responsive**: Board ist horizontal scrollbar auf kleinen Bildschirmen.
9. **Bestehende Funktionalität**: Listenansicht, Detail, Formular bleiben unverändert.

## 10. Offene Fragen

_Keine — das Feature baut auf bestehender Infrastruktur auf und erfordert keine architekturellen Entscheidungen._
