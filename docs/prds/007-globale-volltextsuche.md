# PRD-007: Globale Volltextsuche

## 1. Übersicht

Das CRM erhält eine globale Suchleiste in der Navbar, die über alle Entitäten gleichzeitig sucht. Der Nutzer tippt einen Suchbegriff ein und erhält sofort kategorisierte Ergebnisse — Firmen, Personen, Chancen, Verträge und Aktivitäten — in einem Dropdown. So findet der Vertrieb in Sekunden den richtigen Datensatz, ohne erst zur richtigen Listenansicht navigieren zu müssen.

## 2. Problemstellung

- **Keine globale Suche**: Um einen Datensatz zu finden, muss der Nutzer zuerst die richtige Listenansicht öffnen (Firmen, Personen, Chancen etc.) und dort suchen — falls die Liste überhaupt eine Suchfunktion hat.
- **Suche nur bei Firmen**: Aktuell bietet nur die Firmen-Liste eine Suche (nach Name). Alle anderen Entitäten haben keine Suchfunktion.
- **Kein Querverweise-Suchen**: Der Nutzer kann nicht nach „Müller" suchen und sowohl die Firma „Müller GmbH" als auch die Person „Max Müller" finden.
- **Langsame Navigation**: Für eine einfache Frage wie „Welche Chancen hat die Schmidt AG?" sind 3 Klicks nötig (Firmen → Suchen → Firma öffnen → Chancen-Tab).

## 3. Ziele

- Ein einziges Suchfeld in der Navbar durchsucht alle relevanten Entitäten gleichzeitig.
- Ergebnisse sind nach Entitätstyp kategorisiert und sofort navigierbar.
- Die Suche reagiert schnell (Debounce + performante Backend-Queries).
- Mindestens 3 Zeichen lösen die Suche aus (Schutz vor zu breiten Queries).
- Die Suche unterstützt Teilwort-Matching (z.B. „Müll" findet „Müller GmbH").

## 4. Nicht-Ziele (Out of Scope)

- Elasticsearch oder andere externe Suchengines — die Suche nutzt JPQL `LIKE`-Queries auf der H2-Datenbank.
- Fuzzy-Matching oder Tippfehler-Toleranz.
- Volltextsuche in Freitext-Feldern wie `description` oder `notes` (nur strukturierte Felder).
- Suchhistorie oder „Letzte Suchen".
- Erweiterte Filter innerhalb der globalen Suche (z.B. nach Datum, Status).
- Tastaturnavigation innerhalb der Suchergebnisse (kann später ergänzt werden).

## 5. Bestehendes System

### Backend

- **FirmaService**: Hat bereits `search(String query, Pageable pageable)` mit `findByNameContainingIgnoreCase`.
- **Alle anderen Services**: Haben keine Suchmethoden.
- **Entitäten mit suchbaren Feldern**:
  - Firma: `name`, `industry`, `email`
  - Person: `firstName`, `lastName`, `email`, `position`
  - Chance: `titel`, `beschreibung`
  - Vertrag: `titel`
  - Aktivitaet: `subject`

### Frontend

- **Navbar**: Zeigt CRM-System-Branding, aktuellen Benutzernamen und Logout-Button. Kein Suchfeld.
- **Firmen-Liste**: Einzige Ansicht mit Suchfunktion (query an Backend-Endpoint).

## 6. Anforderungen

### 6.1 Backend

#### 6.1.1 Globaler Such-Endpoint

Ein einzelner Endpoint, der einen Suchbegriff entgegennimmt und Ergebnisse aus allen Entitäten zurückgibt.

**Endpoint**: `GET /api/suche?q={suchbegriff}&limit={limit}`

**Query-Parameter**:

| Parameter | Typ | Default | Beschreibung |
|-----------|-----|---------|--------------|
| `q` | String | (required) | Suchbegriff, mindestens 3 Zeichen |
| `limit` | int | `5` | Max. Ergebnisse pro Kategorie |

**Response** (`GlobalSearchResultDTO`):
```json
{
  "query": "müller",
  "firmen": [
    {
      "id": 1,
      "titel": "Müller GmbH",
      "untertitel": "IT & Software · info@mueller.de",
      "typ": "FIRMA"
    }
  ],
  "personen": [
    {
      "id": 7,
      "titel": "Max Müller",
      "untertitel": "Vertriebsleiter · Müller GmbH",
      "typ": "PERSON"
    },
    {
      "id": 23,
      "titel": "Anna Müller",
      "untertitel": "Einkauf · Schmidt AG",
      "typ": "PERSON"
    }
  ],
  "chancen": [
    {
      "id": 15,
      "titel": "ERP-Migration Müller GmbH",
      "untertitel": "Angebot · € 85.000",
      "typ": "CHANCE"
    }
  ],
  "vertraege": [],
  "aktivitaeten": [
    {
      "id": 42,
      "titel": "Nachfass-Call Müller GmbH",
      "untertitel": "Anruf · 28.02.2026",
      "typ": "AKTIVITAET"
    }
  ]
}
```

**SearchResultItemDTO**:

| Feld | Typ | Beschreibung |
|------|-----|--------------|
| `id` | Long | ID der Entität |
| `titel` | String | Primärtext (Name, Titel) |
| `untertitel` | String | Sekundärtext (Kontext: Branche, Firma, Phase, Typ+Datum) |
| `typ` | String | Entitätstyp für Navigation und Icon |

#### 6.1.2 Such-Logik pro Entität

Jede Entität wird mit `LOWER(feld) LIKE LOWER('%suchbegriff%')` durchsucht. Die Queries werden parallel oder sequenziell im Service ausgeführt.

| Entität | Durchsuchte Felder | Untertitel-Aufbau |
|---------|-------------------|-------------------|
| Firma | `name`, `industry`, `email` | `"{industry} · {email}"` |
| Person | `firstName`, `lastName`, `email` | `"{position} · {firma.name}"` |
| Chance | `titel` | `"{phase} · € {wert}"` |
| Vertrag | `titel` | `"{status} · € {wert}"` |
| Aktivitaet | `subject` | `"{typ} · {datum formatiert}"` |

**Hinweis**: Person wird über `firstName + ' ' + lastName` oder `lastName + ' ' + firstName` gesucht, damit sowohl „Max Müller" als auch „Müller Max" gefunden wird.

#### 6.1.3 Repository-Erweiterungen

**FirmaRepository** (bestehende Suche erweitern):
```java
@Query("SELECT f FROM Firma f WHERE LOWER(f.name) LIKE LOWER(CONCAT('%', :q, '%')) OR LOWER(f.industry) LIKE LOWER(CONCAT('%', :q, '%')) OR LOWER(f.email) LIKE LOWER(CONCAT('%', :q, '%'))")
List<Firma> searchGlobal(@Param("q") String query, Pageable pageable);
```

**PersonRepository**:
```java
@Query("SELECT p FROM Person p WHERE LOWER(CONCAT(p.firstName, ' ', p.lastName)) LIKE LOWER(CONCAT('%', :q, '%')) OR LOWER(CONCAT(p.lastName, ' ', p.firstName)) LIKE LOWER(CONCAT('%', :q, '%')) OR LOWER(p.email) LIKE LOWER(CONCAT('%', :q, '%'))")
List<Person> searchGlobal(@Param("q") String query, Pageable pageable);
```

**ChanceRepository**:
```java
@Query("SELECT c FROM Chance c WHERE LOWER(c.titel) LIKE LOWER(CONCAT('%', :q, '%'))")
List<Chance> searchGlobal(@Param("q") String query, Pageable pageable);
```

**VertragRepository**:
```java
@Query("SELECT v FROM Vertrag v WHERE LOWER(v.titel) LIKE LOWER(CONCAT('%', :q, '%'))")
List<Vertrag> searchGlobal(@Param("q") String query, Pageable pageable);
```

**AktivitaetRepository**:
```java
@Query("SELECT a FROM Aktivitaet a WHERE LOWER(a.subject) LIKE LOWER(CONCAT('%', :q, '%'))")
List<Aktivitaet> searchGlobal(@Param("q") String query, Pageable pageable);
```

#### 6.1.4 Autorisierung

Der Such-Endpoint ist für alle authentifizierten Benutzer zugänglich. Die Ergebnisse werden nicht nach Rolle gefiltert — alle Entitäten sind für alle Rollen sichtbar (konsistent mit den bestehenden Listenansichten).

### 6.2 Frontend

#### 6.2.1 Suchfeld in der Navbar

Die Navbar erhält ein Suchfeld zwischen dem Branding und dem Benutzernamen.

```
┌─────────────────────────────────────────────────────────────────────┐
│  🏢 CRM System     [🔍 Suchen...                    ]   Max M. [⏻] │
└─────────────────────────────────────────────────────────────────────┘
```

**Verhalten**:
- Fokus auf das Suchfeld: Shortcut `Ctrl+K` / `Cmd+K` (gängige Konvention).
- Mindestens 3 Zeichen → Debounce 300ms → API-Call.
- Unter 3 Zeichen: Dropdown schließt sich.
- Escape oder Klick außerhalb: Dropdown schließt sich.
- Suchfeld zeigt einen Placeholder: „Suchen… (⌘K)".

#### 6.2.2 Ergebnis-Dropdown

Unterhalb des Suchfelds erscheint ein Dropdown mit kategorisierten Ergebnissen:

```
┌──────────────────────────────────────────┐
│  🔍 "müller"                              │
├──────────────────────────────────────────┤
│  FIRMEN                                   │
│  🏢 Müller GmbH                           │
│     IT & Software · info@mueller.de       │
├──────────────────────────────────────────┤
│  PERSONEN                                 │
│  👤 Max Müller                             │
│     Vertriebsleiter · Müller GmbH         │
│  👤 Anna Müller                            │
│     Einkauf · Schmidt AG                  │
├──────────────────────────────────────────┤
│  CHANCEN                                  │
│  💼 ERP-Migration Müller GmbH              │
│     Angebot · € 85.000                    │
├──────────────────────────────────────────┤
│  AKTIVITÄTEN                              │
│  📋 Nachfass-Call Müller GmbH              │
│     Anruf · 28.02.2026                    │
├──────────────────────────────────────────┤
│  5 Firmen · 12 Personen · 3 Chancen      │
│  → Alle Ergebnisse anzeigen               │
└──────────────────────────────────────────┘
```

**Darstellung**:
- Kategorien werden nur angezeigt, wenn sie Ergebnisse enthalten.
- Maximal `limit` Ergebnisse pro Kategorie (Default 5).
- Kategorie-Header in Uppercase, grau, kleiner Font.
- Jedes Ergebnis hat Icon + Titel (fett) + Untertitel (grau).
- Klick auf ein Ergebnis navigiert zur Detailansicht und schließt das Dropdown.
- Kategorien ohne Ergebnisse werden ausgeblendet.

#### 6.2.3 Leerzustand und Ladezustand

- **Laden**: Spinner im Dropdown während des API-Calls.
- **Keine Ergebnisse**: „Keine Ergebnisse für ‚{suchbegriff}'" mit Hinweis „Versuchen Sie einen anderen Suchbegriff."
- **Fehler**: Toast via bestehenden `apiErrorInterceptor`.

#### 6.2.4 Navigation aus Suchergebnissen

| Typ | Ziel-Route |
|-----|-----------|
| Firma | `/firmen/{id}` |
| Person | `/personen/{id}` |
| Chance | `/chancen/{id}` |
| Vertrag | `/vertraege/{id}` |
| Aktivitaet | `/aktivitaeten` (Liste — keine Detailseite vorhanden) |

#### 6.2.5 Styling

- Dropdown: Weißer Hintergrund, Box-Shadow, `z-index: 1060` (über Modals).
- Breite: Mindestens 400px, maximal 500px.
- Position: Direkt unterhalb des Suchfelds, linksbündig.
- Suchfeld: Bootstrap `form-control` mit Such-Icon links.
- Hover-Effekt auf Ergebnissen: Leichte Hintergrundfarbe (`#f5f6f8`).

## 7. Technische Umsetzung

### 7.1 Neue Dateien

**Backend (4 Dateien)**:
1. `dto/GlobalSearchResultDTO.java` — Record mit Listen pro Entitätstyp.
2. `dto/SearchResultItemDTO.java` — Record: id, titel, untertitel, typ.
3. `service/GlobalSearchService.java` — Koordiniert Suche über alle Repositories.
4. `controller/GlobalSearchController.java` — `GET /api/suche`.

**Frontend (4 Dateien)**:
1. `core/models/search.model.ts` — Interfaces: `GlobalSearchResult`, `SearchResultItem`.
2. `core/services/search.service.ts` — HTTP-Client für Such-Endpoint.
3. `layout/navbar/search/navbar-search.component.ts` — Suchfeld + Dropdown-Komponente.
4. `layout/navbar/search/navbar-search.component.html` — Template.
5. `layout/navbar/search/navbar-search.component.scss` — Styling.

### 7.2 Geänderte Dateien

**Backend**:
- `FirmaRepository.java` — Neue `searchGlobal()`-Methode.
- `PersonRepository.java` — Neue `searchGlobal()`-Methode.
- `ChanceRepository.java` — Neue `searchGlobal()`-Methode.
- `VertragRepository.java` — Neue `searchGlobal()`-Methode.
- `AktivitaetRepository.java` — Neue `searchGlobal()`-Methode.

**Frontend**:
- `navbar.component.ts/html` — Einbindung der Suchkomponente.

### 7.3 Abhängigkeiten

Keine neuen Dependencies.

## 8. Akzeptanzkriterien

1. **Suchfeld**: In der Navbar sichtbar, fokussierbar via `Ctrl+K` / `Cmd+K`.
2. **Debounce**: Suche wird erst 300ms nach der letzten Eingabe ausgelöst.
3. **Mindestlänge**: Unter 3 Zeichen wird kein API-Call gemacht.
4. **Kategorisierte Ergebnisse**: Ergebnisse sind nach Entitätstyp gruppiert mit Icons.
5. **Navigation**: Klick auf ein Ergebnis navigiert zur Detailansicht und schließt das Dropdown.
6. **Leerzustand**: Bei keinen Ergebnissen wird ein Hinweis angezeigt.
7. **Ladezustand**: Spinner während des API-Calls.
8. **Schließen**: Escape oder Klick außerhalb schließt das Dropdown.
9. **Performance**: Suche antwortet in unter 200ms (Backend-seitig, bei 100 Firmen, 600 Personen).
10. **Teilwort-Matching**: „Müll" findet „Müller GmbH" und „Max Müller".
11. **Case-Insensitive**: „müller" findet „Müller".
12. **Responsive**: Suchfeld passt sich auf schmalen Bildschirmen an (ggf. nur Icon mit Expand).

## 9. Offene Fragen

_Keine._
