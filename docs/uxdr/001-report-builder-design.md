# UXDR-001: Designansatz für den Report-Builder

**Status**: Entschieden — Option C (Inline-Konfigurator)
**Datum**: 2026-03-01
**Bezug**: [PRD-003: Auswertungen](../prds/003-auswertungen.md), Phase 2

## Kontext

Das Pipeline-Dashboard (Phase 1) liefert feste KPIs und Charts. In Phase 2 sollen Nutzer eigene Auswertungen zusammenstellen können: Dimensionen wählen (Gruppierung), Metriken wählen (was wird gemessen), filtern und das Ergebnis als Tabelle oder Chart visualisieren. Außerdem sollen fertige Auswertungen als „Saved Reports" speicherbar sein.

Die zentrale Designfrage: **Wie präsentieren wir dem Nutzer die Konfigurationsmöglichkeiten, ohne ihn zu überfordern?**

### Nutzergruppen

| Nutzer | Erwartung | Technisches Niveau |
|---|---|---|
| Vertriebsleiter | „Zeige mir Pipeline-Wert pro Quartal, gruppiert nach Firma" | Kennt Excel-Pivot gut |
| Account Manager | „Welche meiner Firmen hat den höchsten offenen Wert?" | Grundkenntnisse |
| Geschäftsführung | „Wie hat sich unsere Gewinnrate im letzten Jahr entwickelt?" | Will Ergebnisse, nicht konfigurieren |

### Verfügbare Bausteine

**Datenquellen** (zunächst nur Chancen, erweiterbar):
- Chancen mit Phase, Wert, Wahrscheinlichkeit, Firma, Person, Datum

**Dimensionen** (Gruppierung):
- Phase, Firma, Person, Monat, Quartal, Jahr

**Metriken** (Aggregation):
- Anzahl, Summe Wert, Durchschnitt Wert, Gewichteter Wert, Gewinnrate

**Visualisierungen**:
- Tabelle, Balkendiagramm, Liniendiagramm, Kreisdiagramm

---

## Option A: Seitenleisten-Konfigurator (Grafana-Stil)

Die Konfiguration erfolgt in einer Seitenleiste links, das Ergebnis wird rechts live angezeigt. Der Nutzer baut die Auswertung Schritt für Schritt auf.

```
┌──────────────────────────────────────────────────────────────────────────────┐
│  Auswertungen > Neuer Report                              [Speichern]       │
├───────────────────────┬──────────────────────────────────────────────────────┤
│ KONFIGURATION         │                                                      │
│                       │  Pipeline-Wert nach Firma                            │
│ Datenquelle           │                                                      │
│ ┌───────────────────┐ │  ┌──────────────────────────────────────────────┐    │
│ │ Chancen         ▼ │ │  │                                              │    │
│ └───────────────────┘ │  │  ████████████████████████  Müller   €89k     │    │
│                       │  │  ██████████████████  Schmidt  €67k           │    │
│ Gruppieren nach       │  │  ████████████  Weber  €45k                   │    │
│ ┌───────────────────┐ │  │  ████████  Koch  €32k                        │    │
│ │ Firma           ▼ │ │  │  ██████  Bauer  €28k                         │    │
│ └───────────────────┘ │  │                                              │    │
│                       │  └──────────────────────────────────────────────┘    │
│ Metrik                │                                                      │
│ ┌───────────────────┐ │  ┌──────────────────────────────────────────────┐    │
│ │ Summe Wert      ▼ │ │  │ Firma       │ Anzahl │ Summe Wert │ Ø Wert │    │
│ └───────────────────┘ │  ├─────────────┼────────┼────────────┼────────┤    │
│                       │  │ Müller GmbH │ 5      │ € 89.000   │ €17.800│    │
│ Zeitraum              │  │ Schmidt AG  │ 3      │ € 67.000   │ €22.333│    │
│ ┌────────┐ ┌────────┐ │  │ ...         │        │            │        │    │
│ │ Von    │ │ Bis    │ │  └──────────────────────────────────────────────┘    │
│ └────────┘ └────────┘ │                                                      │
│                       │                                                      │
│ Darstellung           │                                                      │
│ ○ Tabelle             │                                                      │
│ ● Balkendiagramm      │                                                      │
│ ○ Liniendiagramm      │                                                      │
│ ○ Kreisdiagramm       │                                                      │
│                       │                                                      │
│ Filter                │                                                      │
│ Phase: [Alle       ▼] │                                                      │
│                       │                                                      │
├───────────────────────┘                                                      │
│ GESPEICHERTE REPORTS                                                         │
│ ┌─────────────────────────────┐                                              │
│ │ 📊 Pipeline nach Quartal    │                                              │
│ │ 📊 Top Firmen Q1 2026      │                                              │
│ │ 📊 Gewinnrate Trend         │                                              │
│ └─────────────────────────────┘                                              │
└──────────────────────────────────────────────────────────────────────────────┘
```

**Vorteile:**
- Konfiguration und Ergebnis sind gleichzeitig sichtbar — Live-Preview bei jeder Änderung.
- Vertrautes Pattern: Grafana, Metabase, Google Data Studio funktionieren ähnlich.
- Skaliert gut — weitere Dimensionen/Metriken können einfach als Dropdown hinzugefügt werden.
- Gespeicherte Reports direkt unterhalb der Konfiguration erreichbar.

**Nachteile:**
- Viele Dropdowns auf einmal können einschüchternd wirken (besonders für Nutzer mit wenig Erfahrung).
- Horizontal platzbedürftig — auf kleinen Bildschirmen wird die Ergebnisansicht gequetscht.
- Die Seitenleiste konkurriert visuell mit der App-Sidebar.

---

## Option B: Wizard / Schritt-für-Schritt (Excel-Pivot-Stil)

Die Konfiguration erfolgt in einem geführten Wizard mit 3–4 Schritten. Erst nach dem letzten Schritt wird das Ergebnis angezeigt.

```
Schritt 1: Was möchten Sie auswerten?
┌──────────────────────────────────────────────────────────────────────────────┐
│  Neuer Report                                      Schritt 1 von 4          │
│                                                                              │
│  Was möchten Sie auswerten?                                                  │
│                                                                              │
│  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐           │
│  │   📊             │  │   🏢             │  │   📋             │           │
│  │   Chancen-       │  │   Firmen-        │  │   Aktivitäten-   │           │
│  │   Pipeline       │  │   Übersicht      │  │   Auswertung     │           │
│  │                  │  │                  │  │                  │           │
│  │  [Auswählen]     │  │  [Auswählen]     │  │  [demnächst]     │           │
│  └──────────────────┘  └──────────────────┘  └──────────────────┘           │
│                                                                              │
│                                                         [Weiter →]          │
└──────────────────────────────────────────────────────────────────────────────┘

Schritt 2: Wie soll gruppiert werden?
┌──────────────────────────────────────────────────────────────────────────────┐
│  Neuer Report                                      Schritt 2 von 4          │
│                                                                              │
│  Wie möchten Sie die Daten gruppieren?                                       │
│                                                                              │
│  ┌────────────┐  ┌────────────┐  ┌────────────┐  ┌────────────┐            │
│  │   Phase    │  │   Firma    │  │  Quartal   │  │   Person   │            │
│  │    ✓       │  │            │  │            │  │            │            │
│  └────────────┘  └────────────┘  └────────────┘  └────────────┘            │
│                                                                              │
│  Welche Kennzahl?                                                            │
│  ┌────────────┐  ┌────────────┐  ┌────────────┐  ┌────────────┐            │
│  │ Summe Wert │  │  Anzahl   │  │ Ø Wert     │  │ Gewinnrate │            │
│  │    ✓       │  │    ✓      │  │            │  │            │            │
│  └────────────┘  └────────────┘  └────────────┘  └────────────┘            │
│                                                                              │
│                                              [← Zurück]  [Weiter →]        │
└──────────────────────────────────────────────────────────────────────────────┘

Schritt 3: Filter & Zeitraum
┌──────────────────────────────────────────────────────────────────────────────┐
│  Neuer Report                                      Schritt 3 von 4          │
│                                                                              │
│  Zeitraum (optional)                                                         │
│  ┌──────────────┐  bis  ┌──────────────┐                                    │
│  │ 01.01.2026   │       │ 31.03.2026   │     ○ Alle Daten                  │
│  └──────────────┘       └──────────────┘     ● Zeitraum wählen             │
│                                                                              │
│  Phase filtern                                                               │
│  ☑ Neu  ☑ Qualifiziert  ☑ Angebot  ☑ Verhandlung  ☐ Gewonnen  ☐ Verloren  │
│                                                                              │
│                                              [← Zurück]  [Weiter →]        │
└──────────────────────────────────────────────────────────────────────────────┘

Schritt 4: Darstellung & Ergebnis
┌──────────────────────────────────────────────────────────────────────────────┐
│  Neuer Report                                      Schritt 4 von 4          │
│                                                                              │
│  Darstellung:  [Tabelle ▼]                                                   │
│                                                                              │
│  ┌──────────────────────────────────────────────────────────────────────┐    │
│  │ Phase        │ Anzahl │ Summe Wert  │                                │    │
│  ├──────────────┼────────┼─────────────┤                                │    │
│  │ Neu          │ 12     │ € 145.000   │                                │    │
│  │ Qualifiziert │  8     │ € 120.000   │                                │    │
│  │ Angebot      │  5     │ €  89.000   │                                │    │
│  │ Verhandlung  │  3     │ €  67.000   │                                │    │
│  └──────────────────────────────────────────────────────────────────────┘    │
│                                                                              │
│                             [← Zurück]  [💾 Report speichern]               │
└──────────────────────────────────────────────────────────────────────────────┘
```

**Vorteile:**
- Geführter Prozess — auch unerfahrene Nutzer kommen zum Ergebnis.
- Weniger kognitiver Overhead pro Schritt: Der Nutzer trifft immer nur eine Entscheidung.
- Klare visuelle Karten statt abstrakter Dropdowns — einladender.
- Gut für Mobile/Tablet: Jeder Schritt nutzt die volle Breite.

**Nachteile:**
- Kein Live-Preview bis zum letzten Schritt — der Nutzer arbeitet „blind".
- Änderungen erfordern Zurück-Navigation durch den Wizard.
- Iteratives Arbeiten (schnell Dimensionen wechseln) ist umständlich.
- Wizard-Fatigue: Nutzer, die wissen was sie wollen, empfinden die Schritte als langsam.

---

## Option C: Inline-Konfigurator (Pivot-Tabellen-Stil)

Die Konfiguration erfolgt direkt über dem Ergebnis als kompakte Toolbar-Zeile. Dropdowns inline, Ergebnis aktualisiert sich live darunter.

```
┌──────────────────────────────────────────────────────────────────────────────┐
│  Auswertungen > Neuer Report                              [Speichern]       │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  Gruppieren: [Phase      ▼]    Metrik: [Summe Wert ▼] [Anzahl ▼] [+]       │
│  Zeitraum:   [Alle Daten ▼]    Filter: [Alle Phasen ▼]                      │
│  Anzeige:    [Balkendiagramm ▼]                                              │
│                                                                              │
│  ┌──────────────────────────────────────────────────────────────────────┐    │
│  │                                                                      │    │
│  │  ████████████████████████████████████  Neu         € 145.000        │    │
│  │  ██████████████████████████  Qualifiziert          € 120.000        │    │
│  │  ████████████████████  Angebot                     €  89.000        │    │
│  │  ██████████████  Verhandlung                       €  67.000        │    │
│  │  ████████████████████████████████████████  Gewonnen € 234.000       │    │
│  │  ████████  Verloren                                €  52.000        │    │
│  │                                                                      │    │
│  └──────────────────────────────────────────────────────────────────────┘    │
│                                                                              │
│  ┌──────────────────────────────────────────────────────────────────────┐    │
│  │ Phase        │ Anzahl │ Summe Wert  │ Ø Wert     │                   │    │
│  ├──────────────┼────────┼─────────────┼────────────┤                   │    │
│  │ Neu          │ 12     │ € 145.000   │ € 12.083   │                   │    │
│  │ Qualifiziert │  8     │ € 120.000   │ € 15.000   │                   │    │
│  │ ...          │        │             │            │                   │    │
│  ├──────────────┼────────┼─────────────┼────────────┤                   │    │
│  │ GESAMT       │ 50     │ € 707.000   │ € 14.140   │                   │    │
│  └──────────────────────────────────────────────────────────────────────┘    │
│                                                                              │
├──────────────────────────────────────────────────────────────────────────────┤
│ Gespeicherte Reports:                                                        │
│ [📊 Pipeline nach Quartal] [📊 Top Firmen Q1] [📊 Gewinnrate Trend] [+ Neu]│
└──────────────────────────────────────────────────────────────────────────────┘
```

**Vorteile:**
- Kompakt — alles auf einer Seite, maximaler Platz für das Ergebnis.
- Live-Preview bei jeder Änderung — sofortiges Feedback.
- Schnelles Iterieren: Dimension wechseln = ein Klick im Dropdown.
- Erinnert an Excel-Pivot — vertraut für die Zielgruppe.
- Gespeicherte Reports als Tab-Leiste am unteren Rand — schneller Wechsel.
- Responsive-freundlicher als Option A (keine Seitenleiste).

**Nachteile:**
- Alle Optionen auf einmal sichtbar — kann bei vielen Dimensionen/Metriken unübersichtlich werden.
- Weniger Führung als der Wizard — Nutzer müssen selbst wissen, was sie wollen.
- Bei vielen Filtern wird die Toolbar-Zeile schnell mehrreihig.
- Mehrere Metriken gleichzeitig auswählen ist in einer Dropdown-Zeile schwieriger als in einer Seitenleiste.

---

## Vergleichsmatrix

| Kriterium | A: Seitenleiste | B: Wizard | C: Inline |
|---|---|---|---|
| **Einstiegshürde** | Mittel | Niedrig | Mittel |
| **Iterationsgeschwindigkeit** | Hoch | Niedrig | Sehr hoch |
| **Live-Preview** | Ja | Nur am Ende | Ja |
| **Platz für Ergebnis** | Eingeschränkt (7/12) | Voll (nur Schritt 4) | Voll |
| **Mobile/Tablet** | Schlecht | Gut | Mittel |
| **Vertrautheit** | Grafana/BI-Tools | Setup-Assistenten | Excel-Pivot |
| **Erweiterbarkeit** | Sehr gut | Gut | Gut (wird bei vielen Optionen eng) |
| **Cognitive Load** | Hoch (alles sichtbar) | Niedrig (pro Schritt) | Mittel |
| **Gespeicherte Reports** | Gut integrierbar | Separate Liste nötig | Tab-Leiste möglich |
| **Implementierungsaufwand** | Mittel | Hoch (Multi-Step-State) | Gering–Mittel |

---

## Empfehlung

**Option C (Inline-Konfigurator)** als primärer Ansatz, weil:

1. **Zielgruppe passt**: CRM-Nutzer kennen Excel-Pivots. Die Toolbar-Dropdowns fühlen sich vertraut an.
2. **Maximaler Ergebnisplatz**: Kein Bildschirmplatz geht an eine Seitenleiste verloren.
3. **Schnellstes Iterieren**: Dimension wechseln = ein Klick. Kein Wizard-Zurück-Navigieren.
4. **Geringster Aufwand**: Kein Multi-Step-State wie beim Wizard, keine zweite Sidebar wie bei Option A.
5. **Konsistent**: Passt zum bestehenden Dashboard-Design (Toolbar oben, Content darunter).

Für die Geschäftsführung (will Ergebnisse, nicht konfigurieren) lösen die **Saved Reports** das Problem — sie laden einen gespeicherten Report und sehen sofort das Ergebnis.

**Entscheidung**: Option C — Inline-Konfigurator. Siehe [PRD-005: Report-Builder](../prds/005-report-builder.md).

---

## Nachtrag: Slide-over statt eigene Seite (2026-03-01)

Nach der ersten Implementierung als separate Route (`/auswertungen/report-builder`) wurde festgestellt, dass eine eigene Seite den Nutzer aus dem Dashboard-Kontext reißt. Der Report Builder fühlt sich losgelöst an, obwohl er konzeptionell zum Auswertungsbereich gehört.

**Evaluierte Alternativen:**

| Ansatz | Beschreibung | Bewertung |
|--------|-------------|-----------|
| Slide-over Panel | Von rechts einfahrendes Panel (ca. 60% Viewport-Breite) | Bleibt im Dashboard-Kontext, fühlt sich wie ein Werkzeug an |
| Report als Widget | Report Builder als Dashboard-Widget | Zu wenig Platz für Toolbar + Ergebnis |
| Tabs | Tab-Wechsel Pipeline/Report Builder | Immer noch eine gewisse Trennung |
| Fullscreen-Modal | 90%-Modal über dem Dashboard | Verdeckt Dashboard komplett |

**Entscheidung**: Slide-over Panel — der Report Builder wird als Panel geöffnet, das von rechts über das Dashboard gleitet. Das Pipeline-Dashboard bleibt im Hintergrund sichtbar. Der Inline-Konfigurator (Option C) bleibt als Toolbar-Design innerhalb des Panels erhalten.

**Vorteile:**
- Nutzer bleibt im Dashboard-Kontext
- Der Report Builder wirkt wie ein temporäres Werkzeug, nicht wie eine eigene Applikation
- Schließen des Panels bringt sofort zum Dashboard zurück
- Kein separater Sidebar-Eintrag nötig — ein Button im Dashboard öffnet das Panel
