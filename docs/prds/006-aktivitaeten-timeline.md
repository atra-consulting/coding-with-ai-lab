# PRD-006: Aktivitäten-Timeline — 360°-Kundenhistorie

## 1. Übersicht

Das CRM erhält eine chronologische Timeline-Ansicht, die alle relevanten Ereignisse zu einer Firma oder Person auf einer Seite zusammenführt. Aktivitäten, Chancen-Phasenwechsel und Vertragsereignisse werden als visueller Zeitstrahl dargestellt. So erhält der Vertrieb einen sofortigen 360°-Blick auf die gesamte Kundenbeziehung — ohne zwischen verschiedenen Listen wechseln zu müssen.

## 2. Problemstellung

- **Fragmentierte Informationen**: Aktivitäten, Chancen und Verträge werden in separaten Listenansichten angezeigt. Um die vollständige Historie einer Kundenbeziehung zu verstehen, muss der Nutzer zwischen 3–4 Seiten wechseln.
- **Kein zeitlicher Kontext**: Es gibt keine Möglichkeit zu sehen, was wann passiert ist — z.B. „Wann war der letzte Kontakt?", „Was geschah seit dem Angebot?".
- **Fehlende Aktivitätszuordnung**: Die Firma-Detailseite zeigt zwar Personen und Abteilungen in Tabs, aber keine Aktivitäten oder Vertragsereignisse.
- **Kein Überblick für Übergaben**: Wenn ein Vertriebsmitarbeiter einen Kunden übernimmt, fehlt eine kompakte Zusammenfassung der bisherigen Interaktionen.

## 3. Ziele

- Nutzer sehen alle Ereignisse zu einer Firma oder Person in einer einzigen, chronologisch sortierten Timeline.
- Verschiedene Ereignistypen (Aktivitäten, Chancen-Phasenwechsel, Verträge) sind visuell unterscheidbar.
- Die Timeline ist performant — auch bei Firmen mit vielen Ereignissen (Pagination).
- Filterung nach Ereignistyp ermöglicht gezieltes Durchsuchen.
- Die Timeline ist über die Firma- und Person-Detailseiten erreichbar.

## 4. Nicht-Ziele (Out of Scope)

- Automatische Erfassung von Phasenwechseln (erfordert Audit Trail — siehe späteres Feature).
- E-Mail-Integration (automatische Verknüpfung von E-Mails als Aktivitäten).
- Kommentare oder Antworten innerhalb der Timeline (kein Social-Feed).
- Echtzeit-Updates via WebSocket.
- Timeline als eigenständige Top-Level-Seite (nur als Tab in Firma/Person-Detail).

## 5. Bestehendes System

### Backend

- **Aktivitaet**: Entity mit `typ` (ANRUF, EMAIL, MEETING, NOTIZ, AUFGABE), `subject`, `description`, `datum`, `firma` (FK, nullable), `person` (FK, nullable).
- **Chance**: Entity mit `phase` (ChancePhase), `wert`, `firma` (FK), `kontaktPerson` (FK, nullable). Hat `createdAt` und `updatedAt`.
- **Vertrag**: Entity mit `status` (ENTWURF, AKTIV, ABGELAUFEN, GEKUENDIGT), `titel`, `wert`, `startDate`, `endDate`, `firma` (FK).
- **FirmaController**: Hat bereits Sub-Endpoints für `/api/firmen/{id}/personen` und `/api/firmen/{id}/abteilungen`.

### Frontend

- **Firma-Detail**: Tabbed Navigation mit NgbNavModule (Personen-Tab, Abteilungen-Tab).
- **Person-Detail**: Einfache Detailansicht ohne Tabs.
- **Aktivitäten-Liste**: Globale Listenansicht unter `/aktivitaeten`.

## 6. Anforderungen

### 6.1 Backend

#### 6.1.1 Timeline-Endpoint für Firma

Liefert alle Ereignisse einer Firma als einheitliche Timeline, chronologisch absteigend (neueste zuerst).

**Endpoint**: `GET /api/firmen/{id}/timeline`

**Query-Parameter**:

| Parameter | Typ | Default | Beschreibung |
|-----------|-----|---------|--------------|
| `page` | int | `0` | Seitennummer (0-indexiert) |
| `size` | int | `20` | Einträge pro Seite |
| `typen` | String[] | alle | Filter: `AKTIVITAET`, `CHANCE`, `VERTRAG` |

**Response** (`Page<TimelineEventDTO>`):
```json
{
  "content": [
    {
      "typ": "AKTIVITAET",
      "datum": "2026-02-28T14:30:00",
      "titel": "Nachfass-Call nach Angebot",
      "beschreibung": "Kunde hat Rückfragen zum Wartungsvertrag...",
      "icon": "ANRUF",
      "referenzId": 42,
      "referenzTyp": "AKTIVITAET",
      "personName": "Max Müller",
      "personId": 7,
      "meta": {}
    },
    {
      "typ": "CHANCE",
      "datum": "2026-02-25T10:15:00",
      "titel": "ERP-Migration → Phase: Angebot",
      "beschreibung": null,
      "icon": "ANGEBOT",
      "referenzId": 15,
      "referenzTyp": "CHANCE",
      "personName": "Lisa Schmidt",
      "personId": 3,
      "meta": {
        "phase": "ANGEBOT",
        "wert": 85000.00,
        "wahrscheinlichkeit": 60
      }
    },
    {
      "typ": "VERTRAG",
      "datum": "2026-01-15",
      "titel": "Support-Vertrag Verlängert",
      "beschreibung": null,
      "icon": "AKTIV",
      "referenzId": 8,
      "referenzTyp": "VERTRAG",
      "personName": null,
      "personId": null,
      "meta": {
        "status": "AKTIV",
        "wert": 24000.00,
        "endDate": "2027-01-15"
      }
    }
  ],
  "totalElements": 87,
  "totalPages": 5,
  "size": 20,
  "number": 0,
  "first": true,
  "last": false
}
```

**TimelineEventDTO**:

| Feld | Typ | Beschreibung |
|------|-----|--------------|
| `typ` | String | Ereigniskategorie: `AKTIVITAET`, `CHANCE`, `VERTRAG` |
| `datum` | String | Zeitpunkt des Ereignisses (ISO 8601) |
| `titel` | String | Zusammenfassender Titel |
| `beschreibung` | String | Optionaler Detailtext |
| `icon` | String | Sub-Typ für Icon-Auswahl (AktivitaetTyp, ChancePhase oder VertragStatus) |
| `referenzId` | Long | ID der referenzierten Entität |
| `referenzTyp` | String | Entitätstyp für Navigation |
| `personName` | String | Zugehörige Kontaktperson (nullable) |
| `personId` | Long | ID der Kontaktperson (nullable) |
| `meta` | Map | Typspezifische Zusatzdaten (Phase, Wert, Status etc.) |

**Zusammenbau der Timeline**:

Der `TimelineService` sammelt Daten aus drei Quellen und merged sie:

1. **Aktivitäten**: `aktivitaetRepository.findByFirmaId(firmaId)` → `datum` als Zeitpunkt, `typ` als Icon.
2. **Chancen**: `chanceRepository.findByFirmaId(firmaId)` → `updatedAt` als Zeitpunkt, `phase` als Icon, Titel = `"{titel} → Phase: {phase}"`.
3. **Verträge**: `vertragRepository.findByFirmaId(firmaId)` → `startDate` als Zeitpunkt (bei AKTIV/ENTWURF) oder `endDate` (bei ABGELAUFEN/GEKUENDIGT), `status` als Icon.

Die drei Listen werden in-memory zusammengeführt, nach `datum` absteigend sortiert und manuell paginiert.

#### 6.1.2 Timeline-Endpoint für Person

Gleiche Logik, aber gefiltert nach Person.

**Endpoint**: `GET /api/personen/{id}/timeline`

**Query-Parameter**: Identisch zu 6.1.1.

**Datenquellen**:
1. **Aktivitäten**: `findByPersonId(personId)`
2. **Chancen**: `findByKontaktPersonId(personId)`
3. **Verträge**: `findByKontaktPersonId(personId)` (falls vorhanden)

#### 6.1.3 Repository-Erweiterungen

Neue Query-Methoden in bestehenden Repositories:

**AktivitaetRepository**:
```java
Page<Aktivitaet> findByFirmaIdOrderByDatumDesc(Long firmaId, Pageable pageable);
List<Aktivitaet> findByFirmaIdOrderByDatumDesc(Long firmaId);
List<Aktivitaet> findByPersonIdOrderByDatumDesc(Long personId);
```

**ChanceRepository**:
```java
List<Chance> findByFirmaIdOrderByUpdatedAtDesc(Long firmaId);
List<Chance> findByKontaktPersonIdOrderByUpdatedAtDesc(Long personId);
```

**VertragRepository**:
```java
List<Vertrag> findByFirmaIdOrderByCreatedAtDesc(Long firmaId);
List<Vertrag> findByKontaktPersonIdOrderByCreatedAtDesc(Long personId);
```

### 6.2 Frontend

#### 6.2.1 Timeline-Komponente

Wiederverwendbare Standalone-Komponente, die in Firma-Detail und Person-Detail eingebunden wird.

**Komponente**: `TimelineComponent`

**Inputs**:
- `entityTyp`: `'firma' | 'person'`
- `entityId`: `number`

**Darstellung**:

```
┌─────────────────────────────────────────────────────────────┐
│  Timeline                                                    │
│  Filter: [Alle ▼] [Aktivitäten] [Chancen] [Verträge]       │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ── 28. Feb 2026 ──────────────────────────────────────────  │
│                                                               │
│  14:30  📞  Nachfass-Call nach Angebot                       │
│             Max Müller                                        │
│             Kunde hat Rückfragen zum Wartungsvertrag...       │
│                                                               │
│  ── 25. Feb 2026 ──────────────────────────────────────────  │
│                                                               │
│  10:15  💼  ERP-Migration → Angebot                          │
│             Lisa Schmidt · € 85.000 · 60%                    │
│                                                               │
│  ── 15. Jan 2026 ──────────────────────────────────────────  │
│                                                               │
│         📄  Support-Vertrag Verlängert                        │
│             Status: Aktiv · € 24.000 · bis 15.01.2027       │
│                                                               │
│  ── 10. Jan 2026 ──────────────────────────────────────────  │
│                                                               │
│  09:00  📧  Angebot per E-Mail versendet                     │
│             Max Müller                                        │
│                                                               │
├─────────────────────────────────────────────────────────────┤
│                    [Mehr laden]                                │
└─────────────────────────────────────────────────────────────┘
```

#### 6.2.2 Visuelle Unterscheidung der Ereignistypen

| Typ | Farbe | Icons (nach Sub-Typ) |
|-----|-------|---------------------|
| Aktivität: Anruf | `primary` | `fa-phone` |
| Aktivität: E-Mail | `info` | `fa-envelope` |
| Aktivität: Meeting | `warning` | `fa-handshake` |
| Aktivität: Notiz | `secondary` | `fa-sticky-note` |
| Aktivität: Aufgabe | `dark` | `fa-tasks` |
| Chance | `success` | `fa-chart-line` |
| Vertrag | `danger` | `fa-file-contract` |

#### 6.2.3 Filterleiste

Toggle-Buttons (btn-group) im Header der Timeline:
- **Alle** (Default, aktiv): Zeigt alle Ereignistypen.
- **Aktivitäten**: Nur Aktivitäten.
- **Chancen**: Nur Chancen.
- **Verträge**: Nur Verträge.

Filter wird als Query-Parameter `typen` an den Backend-Endpoint übergeben.

#### 6.2.4 Pagination

- Default: 20 Ereignisse pro Seite.
- „Mehr laden"-Button am Ende der Timeline (kein klassischer Paginator).
- Neue Ereignisse werden an die bestehende Liste angehängt (Infinite-Scroll-Pattern ohne Auto-Load).

#### 6.2.5 Navigation

Klick auf ein Timeline-Ereignis navigiert zur Detailansicht der referenzierten Entität:
- Aktivität → `/aktivitaeten/{id}` (oder öffnet Inline-Detail, falls keine Detailseite existiert)
- Chance → `/chancen/{referenzId}`
- Vertrag → `/vertraege/{referenzId}`

Klick auf den Personennamen navigiert zu `/personen/{personId}`.

#### 6.2.6 Integration in bestehende Detailseiten

**Firma-Detail** (`firma-detail.component`):
- Neuer Tab „Timeline" neben „Personen" und „Abteilungen".
- Timeline-Tab wird beim ersten Klick geladen (Lazy).

**Person-Detail** (`person-detail.component`):
- Umstellung auf Tabbed-Layout (wie Firma-Detail) mit Tabs „Details" und „Timeline".
- „Details"-Tab zeigt die bisherige Detailansicht.
- „Timeline"-Tab zeigt die Timeline-Komponente.

## 7. Technische Umsetzung

### 7.1 Neue Dateien

**Backend (4 Dateien)**:
1. `dto/TimelineEventDTO.java` — Record mit den Feldern aus 6.1.1.
2. `service/TimelineService.java` — Merged Aktivitäten, Chancen, Verträge zu Timeline.
3. `controller/TimelineController.java` — Alternativ: Endpoints in FirmaController und PersonController.

**Frontend (4 Dateien)**:
1. `core/models/timeline.model.ts` — `TimelineEvent`-Interface.
2. `core/services/timeline.service.ts` — HTTP-Client für Timeline-Endpoints.
3. `shared/components/timeline/timeline.component.ts` — Wiederverwendbare Timeline-Komponente.
4. `shared/components/timeline/timeline.component.html` — Template.
5. `shared/components/timeline/timeline.component.scss` — Styling (vertikale Linie, Event-Cards).

### 7.2 Geänderte Dateien

**Backend**:
- `AktivitaetRepository.java` — Neue Query-Methoden.
- `ChanceRepository.java` — Neue Query-Methoden.
- `VertragRepository.java` — Neue Query-Methoden.
- `FirmaController.java` oder `PersonController.java` — Timeline-Endpoints (falls nicht eigener Controller).

**Frontend**:
- `firma-detail.component.ts/html` — Neuer Tab „Timeline".
- `person-detail.component.ts/html` — Umstellung auf Tabbed-Layout + Timeline-Tab.

### 7.3 Abhängigkeiten

Keine neuen Dependencies. FontAwesome-Icons und NgbNavModule sind bereits vorhanden.

## 8. Akzeptanzkriterien

1. **Firma-Timeline**: Tab „Timeline" in Firma-Detail zeigt alle Ereignisse der Firma chronologisch absteigend.
2. **Person-Timeline**: Tab „Timeline" in Person-Detail zeigt alle Ereignisse der Person.
3. **Ereignistypen**: Aktivitäten, Chancen und Verträge sind visuell unterscheidbar (Farbe + Icon).
4. **Filter**: Toggle-Buttons filtern nach Ereignistyp. Filterwechsel lädt neue Daten vom Backend.
5. **Pagination**: „Mehr laden"-Button lädt die nächste Seite und hängt Ereignisse an.
6. **Navigation**: Klick auf ein Ereignis navigiert zur Detailansicht der Entität.
7. **Meta-Informationen**: Chancen zeigen Phase, Wert und Wahrscheinlichkeit. Verträge zeigen Status, Wert und Laufzeit.
8. **Datums-Gruppierung**: Ereignisse werden nach Datum gruppiert (Tages-Header).
9. **Leerzustand**: Bei keinen Ereignissen wird eine Hinweismeldung angezeigt.
10. **Performance**: Timeline lädt innerhalb von 500ms (Backend sammelt und merged die Daten serverseitig).
11. **Responsive**: Timeline passt sich an schmale Bildschirme an.

## 9. Offene Fragen

_Keine._
