# PRD-008: CSV/Excel-Export

## 1. Übersicht

Das CRM erhält Export-Funktionen für alle Listenansichten und den Report-Builder. Nutzer können die aktuell angezeigte Datenmenge als CSV- oder Excel-Datei herunterladen. So können Vertriebsleiter Daten offline analysieren, Berichte für das Management erstellen oder Daten in andere Systeme überführen.

## 2. Problemstellung

- **Kein Datenexport**: Es gibt keine Möglichkeit, CRM-Daten zu exportieren. Für Berichte oder Analysen außerhalb des CRM müssen Daten manuell abgetippt oder per Screenshot dokumentiert werden.
- **Keine Offline-Analyse**: Management-Reports (z.B. „Pipeline-Übersicht Q1") können nicht als Datei erstellt und per E-Mail verschickt werden.
- **Keine Datenmigration**: Für den Transfer von Daten in andere Systeme (ERP, Buchhaltung) gibt es keinen strukturierten Export.
- **Report-Builder ohne Output**: Der Report-Builder (PRD-005) zeigt Ergebnisse nur im Browser an — eine „Mitnehm-Funktion" fehlt.

## 3. Ziele

- Alle Listenansichten bieten einen Export-Button für CSV und Excel.
- Der Report-Builder bietet Export des aktuellen Ergebnisses.
- Der Export berücksichtigt aktive Filter und Sortierung.
- CSV-Dateien sind UTF-8 mit BOM (für korrekte Umlaute in Excel).
- Excel-Dateien (.xlsx) enthalten formatierte Spalten (Währung, Datum, Prozent).
- Der Export erfolgt serverseitig (Backend generiert die Datei).

## 4. Nicht-Ziele (Out of Scope)

- PDF-Export (eigenes Feature mit Layout-Engine).
- Import von CSV/Excel-Dateien.
- Automatisierter Export (Scheduled Reports per E-Mail).
- Export von Detailansichten (nur Listenansichten).
- Export mit mehr als 10.000 Zeilen (Performance-Limit).
- Benutzerdefinierte Spaltenauswahl im Export (alle sichtbaren Spalten werden exportiert).

## 5. Bestehendes System

### Backend

- **Listen-Endpoints**: Alle Entitäten haben paginierte `GET /api/{plural}`-Endpoints mit `page`, `size`, `sort`-Parametern.
- **FirmaService**: Hat eine `search()`-Methode mit Freitext-Filter.
- **Report-Endpoint**: `POST /api/auswertungen/report` liefert dynamische Report-Ergebnisse als JSON.
- **Keine Export-Dependencies**: Weder Apache POI noch OpenCSV sind im Projekt vorhanden.

### Frontend

- **Listenansichten**: 8 Entitäts-Listen (Firmen, Personen, Abteilungen, Adressen, Gehälter, Aktivitäten, Verträge, Chancen) mit Pagination und teilweise Suchfunktion.
- **Report-Builder**: Zeigt Tabelle + Chart im Slide-over Panel.
- **Kein Download-Pattern**: Es gibt noch kein etabliertes Pattern für Datei-Downloads.

## 6. Anforderungen

### 6.1 Backend

#### 6.1.1 Export-Endpoints für Entitäts-Listen

Jede Entität erhält einen Export-Endpoint, der die gleichen Filter- und Sortier-Parameter wie der Listen-Endpoint akzeptiert, aber alle Ergebnisse (bis zum Limit) ohne Pagination zurückgibt.

**Endpoint-Pattern**: `GET /api/{plural}/export`

**Query-Parameter**:

| Parameter | Typ | Default | Beschreibung |
|-----------|-----|---------|--------------|
| `format` | String | `csv` | Export-Format: `csv` oder `xlsx` |
| `sort` | String[] | Entity-Default | Sortierung (wie Listen-Endpoint) |
| `search` | String | — | Suchbegriff (wo unterstützt, z.B. Firmen) |

**Konkrete Endpoints**:

| Endpoint | Exportierte Spalten |
|----------|-------------------|
| `GET /api/firmen/export` | Name, Branche, Website, Telefon, E-Mail, Erstellt am |
| `GET /api/personen/export` | Vorname, Nachname, E-Mail, Telefon, Position, Firma, Abteilung |
| `GET /api/abteilungen/export` | Name, Firma |
| `GET /api/adressen/export` | Straße, PLZ, Stadt, Land, Typ, Firma/Person |
| `GET /api/gehaelter/export` | Person, Betrag, Währung, Gültig ab, Gültig bis |
| `GET /api/aktivitaeten/export` | Typ, Betreff, Datum, Firma, Person |
| `GET /api/vertraege/export` | Titel, Wert, Währung, Status, Start, Ende, Firma, Kontaktperson |
| `GET /api/chancen/export` | Titel, Wert, Währung, Phase, Wahrscheinlichkeit, Erw. Datum, Firma, Kontaktperson |

**Response**:
- `Content-Type`: `text/csv; charset=UTF-8` oder `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`
- `Content-Disposition`: `attachment; filename="{entitaet}_{datum}.csv"` bzw. `.xlsx`
- Body: Datei-Inhalt als Byte-Stream.

#### 6.1.2 Export-Endpoint für Report-Builder

Der Report-Builder-Export nutzt den gleichen Query-Mechanismus wie der bestehende Report-Endpoint, gibt aber eine Datei zurück statt JSON.

**Endpoint**: `POST /api/auswertungen/report/export?format=csv`

**Request Body**: Identisch zu `POST /api/auswertungen/report` (`ReportQueryDTO`).

**Query-Parameter**:

| Parameter | Typ | Default | Beschreibung |
|-----------|-----|---------|--------------|
| `format` | String | `csv` | Export-Format: `csv` oder `xlsx` |

**Response**:
- Gleiche Header wie bei Entitäts-Exporten.
- Dateiname: `report_{dimension}_{datum}.csv` bzw. `.xlsx`.

**Spalten**: Dimension-Label als erste Spalte, dann eine Spalte pro gewählter Metrik.

#### 6.1.3 CSV-Generierung

**Format-Details**:
- Encoding: UTF-8 mit BOM (`\xEF\xBB\xBF`) — damit Excel Umlaute korrekt erkennt.
- Separator: Semikolon (`;`) — deutscher Standard, da Komma in Dezimalzahlen vorkommt.
- Zeilenumbruch: `\r\n` (Windows-kompatibel).
- Header-Zeile: Deutsche Spaltennamen.
- Zahlenformat: Punkt als Dezimaltrenner (`12345.67`).
- Datumsformat: `dd.MM.yyyy` (deutsches Format).
- Textfelder mit Semikolon oder Zeilenumbrüchen: In Anführungszeichen eingeschlossen.

**Implementierung**: Manuell mit `StringBuilder` oder einer leichtgewichtigen Bibliothek. Keine zusätzliche Dependency nötig für CSV.

#### 6.1.4 Excel-Generierung

**Library**: Apache POI (`poi-ooxml`).

**Format-Details**:
- Dateiformat: `.xlsx` (Office Open XML).
- Sheet-Name: Entitätsname (z.B. „Firmen", „Chancen").
- Header-Zeile: Fett, Hintergrundfarbe `#264892` (Primary), weiße Schrift.
- Spaltenbreite: Auto-Size basierend auf Inhalt.
- Währungsspalten: Format `#.##0,00 €`.
- Datumsspalten: Format `dd.MM.yyyy`.
- Prozentspalten: Format `0%`.
- Zahlen als numerische Zellen (nicht als Text).

#### 6.1.5 Zeilen-Limit

Exports sind auf **10.000 Zeilen** begrenzt. Bei Überschreitung wird ein HTTP 400 mit einer Fehlermeldung zurückgegeben:
```json
{
  "status": 400,
  "message": "Export überschreitet das Maximum von 10.000 Zeilen. Bitte Filter verwenden."
}
```

#### 6.1.6 Autorisierung

Export-Endpoints folgen der gleichen Autorisierung wie die zugehörigen Listen-Endpoints:
- Gehälter: Nur ADMIN und PERSONAL.
- Verträge: Nur ADMIN und VERTRIEB.
- Chancen: Nur ADMIN und VERTRIEB.
- Alle anderen: Alle authentifizierten Benutzer.

### 6.2 Frontend

#### 6.2.1 Export-Button in Listenansichten

Jede Listenansicht erhält einen Export-Button im Seiten-Header, neben dem bestehenden „Neu erstellen"-Button.

```
┌─────────────────────────────────────────────────────────────┐
│  Firmen                          [⬇ Export ▼] [+ Neue Firma]│
├─────────────────────────────────────────────────────────────┤
│  ...                                                         │
```

**Export-Button Dropdown**:
```
┌──────────────────┐
│  📄 Als CSV       │
│  📊 Als Excel     │
└──────────────────┘
```

**Verhalten**:
- Klick auf eine Option löst den Download aus.
- Während des Downloads: Button zeigt Spinner.
- Nach erfolgreichem Download: Kurze Erfolgsmeldung via Toast.
- Bei Fehler: Fehlermeldung via bestehenden `apiErrorInterceptor`.
- Der Export verwendet die aktuellen Filter- und Sortier-Parameter der Liste.

#### 6.2.2 Export-Button im Report-Builder

Der Report-Builder (Slide-over Panel) erhält einen Export-Button im Header, neben dem Speichern-Button.

```
┌──────────────────────────────────────────────────┐
│  Report-Builder                    [⬇] [💾] [✕]  │
├──────────────────────────────────────────────────┤
│  ...                                              │
```

**Verhalten**:
- Button mit Dropdown (CSV / Excel).
- Export verwendet die aktuelle Report-Konfiguration (Dimension, Metriken, Filter).
- Nur aktiv, wenn ein Ergebnis angezeigt wird.

#### 6.2.3 Download-Mechanismus

Der Download wird über einen `Blob`-Response im HttpClient realisiert:

```typescript
// Pattern für den Export-Service
export(format: string, params: HttpParams): Observable<Blob> {
  return this.http.get(`/api/{plural}/export`, {
    params: params.set('format', format),
    responseType: 'blob'
  });
}
```

Der Download wird via dynamisch erzeugtem `<a>`-Element ausgelöst:
```typescript
const url = window.URL.createObjectURL(blob);
const a = document.createElement('a');
a.href = url;
a.download = filename;
a.click();
window.URL.revokeObjectURL(url);
```

#### 6.2.4 Dateiname

Format: `{entitaet}_{datum}.{format}`

Beispiele:
- `firmen_2026-03-01.csv`
- `chancen_2026-03-01.xlsx`
- `report_phase_2026-03-01.xlsx`

Der Dateiname wird vom Backend im `Content-Disposition`-Header mitgeliefert.

## 7. Technische Umsetzung

### 7.1 Neue Dateien

**Backend (4 Dateien)**:
1. `service/ExportService.java` — Generische Export-Logik: CSV-Generierung, Excel-Generierung. Nimmt eine Liste von Spalten-Definitionen und Datenzeilen entgegen.
2. `dto/ExportColumnDefinition.java` — Record: name, typ (STRING, CURRENCY, DATE, PERCENT, NUMBER), getter (Function).
3. `config/ExportConfig.java` — Konstanten: Zeilen-Limit, Default-Format, Datumsformate.

**Frontend (2 Dateien)**:
1. `core/services/export.service.ts` — Generischer Download-Service mit Blob-Handling.
2. `shared/components/export-button/export-button.component.ts` — Wiederverwendbare Dropdown-Button-Komponente.

### 7.2 Geänderte Dateien

**Backend**:
- `FirmaController.java` — Neuer Endpoint `GET /api/firmen/export`.
- `PersonController.java` — Neuer Endpoint `GET /api/personen/export`.
- `AbteilungController.java` — Neuer Endpoint `GET /api/abteilungen/export`.
- `AdresseController.java` — Neuer Endpoint `GET /api/adressen/export`.
- `GehaltController.java` — Neuer Endpoint `GET /api/gehaelter/export`.
- `AktivitaetController.java` — Neuer Endpoint `GET /api/aktivitaeten/export`.
- `VertragController.java` — Neuer Endpoint `GET /api/vertraege/export`.
- `ChanceController.java` — Neuer Endpoint `GET /api/chancen/export`.
- `ReportController.java` — Neuer Endpoint `POST /api/auswertungen/report/export`.
- `pom.xml` — Neue Dependency: Apache POI.

**Frontend**:
- Alle 8 Listen-Komponenten — Export-Button im Header einbinden.
- `report-builder.component.ts/html` — Export-Button im Panel-Header.

### 7.3 Abhängigkeiten

**Backend — Neue Dependency**:
```xml
<dependency>
    <groupId>org.apache.poi</groupId>
    <artifactId>poi-ooxml</artifactId>
    <version>5.3.0</version>
</dependency>
```

**Frontend**: Keine neuen Dependencies.

## 8. Akzeptanzkriterien

1. **CSV-Export**: Alle 8 Entitäts-Listen bieten CSV-Export. Datei ist UTF-8 mit BOM und Semikolon-Separator.
2. **Excel-Export**: Alle 8 Entitäts-Listen bieten Excel-Export. Datei hat formatierte Header, korrekte Spaltentypen (Währung, Datum, Prozent).
3. **Report-Export**: Der Report-Builder bietet CSV- und Excel-Export des aktuellen Ergebnisses.
4. **Filter-Berücksichtigung**: Export enthält nur die gefilterten/sortierten Daten (gleiche Parameter wie die Listenansicht).
5. **Dateiname**: Enthält Entitätsname und Datum.
6. **Umlaute**: Korrekte Darstellung von Umlauten (ä, ö, ü, ß) in CSV und Excel.
7. **Währung**: Beträge in Excel als Zahl mit Währungsformat, nicht als Text.
8. **Zeilen-Limit**: Export mit mehr als 10.000 Zeilen wird mit Fehlermeldung abgelehnt.
9. **Autorisierung**: Export-Endpoints folgen den gleichen Berechtigungsregeln wie die Listen-Endpoints.
10. **Loading-State**: Export-Button zeigt Spinner während des Downloads.
11. **Fehlerbehandlung**: Bei Backend-Fehlern wird ein Toast angezeigt.
12. **Responsive**: Export-Button ist auch auf schmalen Bildschirmen erreichbar.

## 9. Offene Fragen

_Keine._
