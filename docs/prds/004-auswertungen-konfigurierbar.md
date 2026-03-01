# PRD-004: Konfigurierbares Pipeline-Dashboard

## 1. Übersicht

Das bestehende Pipeline-Dashboard (Phase 1) zeigt fünf Widgets in fester Reihenfolge. In diesem Schritt wird das Dashboard konfigurierbar: Nutzer können Widgets verschieben, entfernen und entfernte Widgets wieder hinzufügen. Die Widget-Typen selbst bleiben unverändert — es geht ausschließlich um Layout-Personalisierung.

Dies ist ein Zwischenschritt zwischen dem statischen Dashboard (Phase 1) und dem vollständig konfigurierbaren Report-Builder (Phase 2).

## 2. Problemstellung

- **Keine Personalisierung**: Alle Nutzer sehen die gleichen fünf Widgets in derselben Reihenfolge, unabhängig davon, welche Auswertungen für sie relevant sind.
- **Informationsüberflutung**: Nicht jeder Nutzer braucht alle fünf Widgets. Ein Vertriebsleiter interessiert sich z.B. primär für die KPIs und die Pivot-Tabelle, ein Account Manager für die Top-Firmen.
- **Kein individueller Fokus**: Wichtige Widgets können nicht nach oben priorisiert werden.

## 3. Ziele

- Nutzer können die Reihenfolge der Dashboard-Widgets per Drag & Drop ändern.
- Nutzer können einzelne Widgets entfernen (ausblenden).
- Entfernte Widgets können über ein Menü wieder hinzugefügt werden.
- Die Konfiguration wird persistent gespeichert, sodass sie beim nächsten Besuch erhalten bleibt.
- Ein „Zurücksetzen"-Button stellt die Standard-Anordnung wieder her.

## 4. Nicht-Ziele (Out of Scope)

- Erstellen neuer/benutzerdefinierter Widgets (Phase 2).
- Ändern der Größe von Widgets (z.B. halbe vs. volle Breite).
- Widget-spezifische Einstellungen (z.B. Anzahl der Top-Firmen ändern).
- Teilen von Dashboard-Konfigurationen zwischen Nutzern.
- Mehrspaltige Drag & Drop Layouts (Widgets bleiben in ihrer vordefinierten Spalten-Struktur, nur die vertikale Reihenfolge ändert sich).

## 5. Bestehendes System

### Pipeline-Dashboard (Phase 1)

Fünf Widget-Bereiche in fester Reihenfolge:

| # | Widget-ID | Titel | Typ | Layout |
|---|-----------|-------|-----|--------|
| 1 | `kpi-cards` | KPI-Kacheln | 4 Kacheln in einer Reihe | Volle Breite (row mit 4x col-xl-3) |
| 2 | `bar-chart` | Pipeline-Wert nach Phase | Vertikales Balkendiagramm | 7/12 Breite (col-lg-7) |
| 3 | `doughnut-chart` | Verteilung nach Phase | Doughnut-Chart | 5/12 Breite (col-lg-5) |
| 4 | `top-firmen` | Top 10 Firmen | Horizontales Balkendiagramm | Volle Breite |
| 5 | `pivot-table` | Übersicht nach Phase | Tabelle mit Summenzeile | Volle Breite |

**Hinweis**: Die Widgets #2 und #3 teilen sich eine Zeile (7/12 + 5/12). Beim Verschieben werden sie als eigenständige Widgets behandelt. Wenn beide nebeneinander stehen, teilen sie sich die Zeile; stehen sie nicht nebeneinander, nehmen sie jeweils die volle Breite ein.

### Technologie

- Angular CDK `@angular/cdk/drag-drop` ist bereits als Dependency vorhanden (für das Kanban-Board).
- Kein Charting-Umbau nötig — die bestehenden Chart-Konfigurationen bleiben unverändert.

## 6. Anforderungen

### 6.1 Widget-Registry

Jedes Widget wird durch eine ID und Metadaten beschrieben:

```typescript
interface WidgetDefinition {
  id: string;           // z.B. 'kpi-cards'
  title: string;        // Anzeigename, z.B. 'KPI-Kacheln'
  icon: IconDefinition; // FontAwesome-Icon für das Hinzufügen-Menü
}
```

Die Standard-Reihenfolge (`DEFAULT_WIDGET_ORDER`) definiert die initiale Anordnung:
```typescript
const DEFAULT_WIDGET_ORDER = ['kpi-cards', 'bar-chart', 'doughnut-chart', 'top-firmen', 'pivot-table'];
```

### 6.2 Bearbeitungsmodus

Ein Toggle-Button im Page-Header aktiviert den Bearbeitungsmodus:

```
┌──────────────────────────────────────────────────────────────────┐
│  Auswertungen: Pipeline                    [✏ Anpassen]         │
└──────────────────────────────────────────────────────────────────┘
```

Im Bearbeitungsmodus:

```
┌──────────────────────────────────────────────────────────────────┐
│  Auswertungen: Pipeline          [+ Widget] [↺ Zurücksetzen] [✓ Fertig] │
└──────────────────────────────────────────────────────────────────┘
```

### 6.3 Drag & Drop (Reihenfolge ändern)

- Im Bearbeitungsmodus erhalten alle Widgets einen Drag-Handle (⠿ Griff-Icon) im Header.
- Die Widgets können vertikal per Drag & Drop umsortiert werden.
- Visueller Drag-Placeholder und Drop-Zone-Highlight (konsistent mit dem Kanban-Board).
- **Technologie**: Angular CDK `cdkDropList` + `cdkDrag` (bereits vorhanden).

### 6.4 Widget entfernen

- Im Bearbeitungsmodus zeigt jedes Widget einen Entfernen-Button (✕) im Header.
- Klick blendet das Widget sofort aus (kein Bestätigungsdialog nötig — es kann jederzeit wieder hinzugefügt werden).
- Entfernte Widgets werden aus der aktiven Liste entfernt und in einer „verfügbare Widgets"-Liste geführt.

### 6.5 Widget hinzufügen

- Der „+ Widget"-Button (nur im Bearbeitungsmodus sichtbar) öffnet ein Dropdown/Popover mit allen aktuell entfernten Widgets.
- Jeder Eintrag zeigt Icon + Titel des Widgets.
- Klick fügt das Widget am Ende der aktiven Liste hinzu.
- Wenn alle Widgets sichtbar sind, ist der Button deaktiviert (disabled).

### 6.6 Zurücksetzen

- Der „↺ Zurücksetzen"-Button stellt die Standard-Reihenfolge und -sichtbarkeit aller Widgets wieder her.
- Kein Bestätigungsdialog nötig.

### 6.7 Persistierung

Die Konfiguration wird persistent gespeichert und beim nächsten Seitenaufruf wiederhergestellt.

**Gespeicherte Daten:**
```json
{
  "visibleWidgets": ["kpi-cards", "pivot-table", "bar-chart"]
}
```

Die Reihenfolge im Array bestimmt die Darstellungsreihenfolge. Nicht enthaltene Widget-IDs gelten als entfernt.

**Speicherort**: Siehe Offene Fragen (Abschnitt 10).

## 7. UX-Wireframe

### Normalmodus
```
┌──────────────────────────────────────────────────────────────────┐
│  Auswertungen: Pipeline                         [✏ Anpassen]    │
├──────────────────────────────────────────────────────────────────┤
│  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐              │
│  │ KPI 1   │ │ KPI 2   │ │ KPI 3   │ │ KPI 4   │              │
│  └─────────┘ └─────────┘ └─────────┘ └─────────┘              │
│  ┌──────────────────────┐ ┌────────────────────┐                │
│  │ Balkendiagramm       │ │ Doughnut           │                │
│  └──────────────────────┘ └────────────────────┘                │
│  ┌─────────────────────────────────────────────┐                │
│  │ Top Firmen                                  │                │
│  └─────────────────────────────────────────────┘                │
│  ┌─────────────────────────────────────────────┐                │
│  │ Pivot-Tabelle                               │                │
│  └─────────────────────────────────────────────┘                │
└──────────────────────────────────────────────────────────────────┘
```

### Bearbeitungsmodus
```
┌──────────────────────────────────────────────────────────────────┐
│  Auswertungen: Pipeline     [+ Widget] [↺ Zurücksetzen] [✓ Fertig] │
├──────────────────────────────────────────────────────────────────┤
│  ┌─ ⠿ ─────────────────────────────────────────────── ✕ ──┐    │
│  │  KPI-Kacheln                                            │    │
│  │  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐      │    │
│  │  │ KPI 1   │ │ KPI 2   │ │ KPI 3   │ │ KPI 4   │      │    │
│  │  └─────────┘ └─────────┘ └─────────┘ └─────────┘      │    │
│  └────────────────────────────────────────────────────────┘     │
│  ┌─ ⠿ ──────────────────────────────────────────── ✕ ──┐      │
│  │  Pipeline-Wert nach Phase                            │      │
│  │  ┌──────────────────────────────────────────┐        │      │
│  │  │ ████████                                 │        │      │
│  │  └──────────────────────────────────────────┘        │      │
│  └──────────────────────────────────────────────────────┘      │
│  ...                                                            │
└──────────────────────────────────────────────────────────────────┘
```

### Widget-hinzufügen-Dropdown
```
┌──────────────────────┐
│ + Widget hinzufügen   │
├──────────────────────┤
│ 📊 Balkendiagramm    │
│ 🏢 Top 10 Firmen     │
└──────────────────────┘
```

## 8. Technische Umsetzung

### 8.1 Geänderte Dateien

**Frontend:**
- `pipeline-dashboard.component.ts` — Widget-Logik: Registry, Reihenfolge-State, Drag & Drop Handler, Persistierung, Edit-Mode Toggle.
- `pipeline-dashboard.component.html` — Template-Umbau: `@for` über aktive Widgets mit `@switch` für Widget-Rendering, Drag-Handles, Entfernen-Buttons, Toolbar.
- `pipeline-dashboard.component.scss` — Styling für Edit-Mode (Drag-Handle, Rahmen, Buttons).

### 8.2 Backend-Änderungen (Persistierung)

Gemäß [ADR-002](../adr/002-dashboard-konfiguration-speicherort.md) wird die Konfiguration serverseitig in einer eigenen `DashboardConfig`-Entity gespeichert.

**Neue Dateien:**
- `DashboardConfig.java` — Entity mit `@OneToOne` zu `Benutzer` und `config` (JSON-String).
- `DashboardConfigDTO.java` — Record für API-Response/Request.
- `DashboardConfigRepository.java` — JPA Repository.
- `DashboardConfigService.java` — Lade-/Speicherlogik.
- `DashboardConfigController.java` — `GET /api/dashboard-config`, `PUT /api/dashboard-config`.

**Hinweis**: Auch wenn ein Widget entfernt wird, werden die Daten weiterhin geladen (einfacherer Code, vernachlässigbare Performance-Auswirkung bei nur 3 API-Calls).

### 8.3 Abhängigkeiten

- **Angular CDK** (`@angular/cdk/drag-drop`) — bereits vorhanden.
- Keine neuen Dependencies.

## 9. Akzeptanzkriterien

1. **Bearbeitungsmodus**: „Anpassen"-Button aktiviert den Edit-Mode mit Drag-Handles und Entfernen-Buttons.
2. **Drag & Drop**: Widgets können per Drag & Drop umsortiert werden. Reihenfolge wird korrekt übernommen.
3. **Entfernen**: Klick auf ✕ entfernt das Widget sofort. Dashboard passt sich an.
4. **Hinzufügen**: „+ Widget"-Button zeigt alle entfernten Widgets. Klick fügt sie am Ende hinzu.
5. **Zurücksetzen**: Stellt Standard-Reihenfolge und alle Widgets wieder her.
6. **Persistierung**: Konfiguration bleibt nach Seiten-Reload erhalten.
7. **Normalmodus**: Ohne Bearbeitungsmodus sieht das Dashboard genauso aus wie bisher (keine Drag-Handles, keine Buttons).
8. **Leeres Dashboard**: Wenn alle Widgets entfernt sind, wird ein Hinweis angezeigt („Keine Widgets ausgewählt. Klicken Sie auf ‚+ Widget', um Widgets hinzuzufügen.").
9. **Charts nach Drag**: Charts rendern korrekt nach dem Verschieben (kein Canvas-Sizing-Bug).

## 10. Offene Fragen

_Keine — die offene Frage zum Speicherort wurde in [ADR-002](../adr/002-dashboard-konfiguration-speicherort.md) entschieden: Backend-Persistierung mit eigener `DashboardConfig`-Entity._
