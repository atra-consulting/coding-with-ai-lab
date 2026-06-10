# PRD: Chance – Phase als Badge und Notiz-Feld

## Quelle

Freie Aufgabe über den Plan-and-Do-Workflow. Zwei unabhängige Erweiterungen der Chance-Entity.

---

## Problembeschreibung

### Teil 1: Phase als Badge

Die Chancen-Liste zeigt die Phase als einfachen Text. Das ist schwer zu scannen. Der Nutzer muss lesen, vergleichen, interpretieren. Eine Farbe reicht, um den Status sofort zu erkennen.

Die Chancen-Detailseite zeigt die Phase bereits als farbiges Badge. Liste und Detail sind inkonsistent.

### Teil 2: Notiz-Feld fehlt

Vertriebsmitarbeiter notieren Gesprächsnotizen, nächste Schritte und Hintergründe zu Chancen. Dafür gibt es kein Feld. Informationen landen in E-Mails oder externen Notizen. Sie gehen verloren.

---

## Anforderungen

### Teil 1: Phase als farbiges Badge in der Liste

**[REQ-C01]** Die Chancen-Liste zeigt die Phase als farbiges Bootstrap-Badge.
- Priorität: Hoch
- Begründung: Konsistenz mit der Detailseite. Schnelleres Scannen für den Nutzer.
- Abnahme: Jede Phase hat die korrekte Badge-Farbe. Die Phase-Beschriftung ist lesbar.

**[REQ-C02]** Die Badge-Farben entsprechen der Detailseite exakt.

| Phase | Farbe | Bootstrap-Klasse |
|---|---|---|
| NEU | Blau | primary |
| QUALIFIZIERT | Cyan | info |
| ANGEBOT | Gelb | warning + dunkler Text |
| VERHANDLUNG | Grau | secondary |
| GEWONNEN | Grün | success |
| VERLOREN | Rot | danger |

- Priorität: Hoch
- Begründung: Konsistentes Farbschema über alle Chancen-Ansichten.
- Abnahme: Liste und Detail zeigen dieselbe Farbe für dieselbe Phase.
- Hinweis: Maßgeblich ist die Farbzuordnung der bestehenden Detailseite (Methode `getPhaseBadgeClass`), **nicht** die UI-Spezifikation. Die Phase ANGEBOT braucht zusätzlich dunklen Text, sonst ist die gelbe Beschriftung unlesbar. Die Liste übernimmt die Zuordnung von der Detailseite eins zu eins.

**[REQ-C03]** Die Detailseite wird auf korrekte Badge-Darstellung geprüft.
- Priorität: Mittel
- Begründung: Badge-Logik ist laut Analyse bereits vorhanden (`getPhaseBadgeClass`). Verifikation reicht.
- Abnahme: Detailseite zeigt für alle sechs Phasen das Badge mit der Farbzuordnung aus REQ-C02 (inklusive dunklem Text für ANGEBOT). Es ist keine Code-Änderung nötig, sofern die Darstellung bereits korrekt ist.

### Teil 2: Neues Notiz-Feld

**[REQ-C04]** Das Chancen-Datenmodell erhält ein neues optionales Feld "Notiz".
- Priorität: Hoch
- Begründung: Kernbedarf: Freitext pro Chance speichern.
- Abnahme: Datenbank enthält die neue Spalte. Bestehende Chancen sind nicht betroffen.

**[REQ-C05]** Das Notiz-Feld akzeptiert maximal 2000 Zeichen.
- Priorität: Hoch
- Begründung: Verhindert übermäßig lange Einträge.
- Abnahme: Validierung erfolgt auf zwei Ebenen. Das Formular begrenzt die Eingabe bereits clientseitig (Validator für die Maximallänge) und zeigt einen Hinweis. Zusätzlich lehnt das Backend Eingaben über 2000 Zeichen mit einem Feld-Fehler ab. Beide Ebenen sind aktiv.

**[REQ-C06]** Das Notiz-Feld ist optional.
- Priorität: Hoch
- Begründung: Nicht jede Chance hat eine Notiz. Pflichtfeld wäre zu restriktiv.
- Abnahme: Eine Chance lässt sich ohne Notiz anlegen und speichern. Eine Notiz, die nur aus Leerzeichen oder Zeilenumbrüchen besteht, gilt als leer: Das Backend normalisiert sie auf "keine Notiz", und die Detailseite blendet den Abschnitt aus.

**[REQ-C07]** Das Chancen-Formular enthält ein mehrzeiliges Eingabefeld für die Notiz.
- Priorität: Hoch
- Begründung: Nutzer müssen Text komfortabel eingeben.
- Abnahme: Textarea mit 3 sichtbaren Zeilen. Label "Notiz". Kein Pflichtfeld-Marker.

**[REQ-C08]** Die Detailseite zeigt die Notiz mit erhaltenen Zeilenumbrüchen.
- Priorität: Hoch
- Begründung: Zeilenumbrüche aus dem Formular müssen sichtbar bleiben.
- Abnahme: Vom Nutzer eingegebene Zeilenumbrüche werden als sichtbare Zeilenumbrüche dargestellt. Die Notiz wird als reiner Text gebunden (kein HTML-Einschleusen), die Zeilenumbrüche entstehen über CSS. Die Notiz steht – wie die Beschreibung – als eigener Abschnitt über die volle Breite unterhalb der zweispaltigen Felder.

**[REQ-C09]** Ist die Notiz leer, zeigt die Detailseite nichts.
- Priorität: Mittel
- Begründung: Ein leeres Feld mit Beschriftung erzeugt unnötigen Leerraum.
- Abnahme: Ohne Notiz erscheint das Notiz-Feld auf der Detailseite nicht.

**[REQ-C10]** Die Chancen-Liste zeigt das Notiz-Feld nicht.
- Priorität: Hoch
- Begründung: Freitext in einer Listen-Spalte ist unleserlich und unnötig.
- Abnahme: AG-Grid-Tabelle enthält keine Notiz-Spalte.

---

## Besondere Hinweise

- Kein Code, kein SQL, keine TypeScript-Beispiele in diesem Dokument.
- Keine automatisierten Tests für diese Änderungen (explizite Nutzerentscheidung).
- Keine Aktualisierungen von Spezifikationsdokumenten oder Subagenten.

---

## Implementierungsansatz (High-Level)

### Teil 1: Badge in der Liste

**Backend:** Keine Änderung nötig. Die Phase wird bereits als Text geliefert.

**Frontend – Chancen-Liste:**
Die AG-Grid-Spalte für "Phase" erhält einen Cell Renderer. Dieser wandelt den Phasenwert in ein Badge mit der passenden Bootstrap-Klasse um. Die Farbzuordnung entspricht der Tabelle in REQ-C02 und wird von der Detailseite übernommen.
- Sicherheit: Das Badge-Markup wird ausschließlich aus der festen Phase-Farbzuordnung gebaut. Es werden keine freien Nutzerdaten in das Markup eingefügt. Der Phasenwert ist ein fester Aufzählungswert, kein Freitext.

**Frontend – Chancen-Detailseite:**
Nur Verifikation. Die `getPhaseBadgeClass()`-Logik ist bereits vorhanden. Falls korrekt, ist kein Umbau nötig.

### Teil 2: Notiz-Feld

**Datenbankschicht:**
- Schema: Neues optionales Textfeld "notiz" in der Chance-Tabelle.
- Migration: Die Tabellendefinition nutzt `CREATE TABLE IF NOT EXISTS`. Für eine bestehende Datenbank fügt dieses Muster keine neue Spalte hinzu. Daher braucht die Migration zusätzlich ein additives `ALTER TABLE ... ADD COLUMN` für die neue, nullable Spalte. Das Statement muss idempotent ausgeführt werden (vorhandene Spalte ignorieren), damit Neustarts nicht fehlschlagen. Für eine frische Datenbank reicht die erweiterte Tabellendefinition.
- Seed-Daten: Die `fixture.json` muss **nicht** angepasst werden. Die Spalte ist nullable; die bestehenden Seed-Chancen bleiben ohne Notiz gültig.

**Backend – Service:**
- Notiz bei Lesen (GET), Anlegen (POST) und Aktualisieren (PUT) berücksichtigen.
- Längenvalidierung: maximal 2000 Zeichen. Fehler auf Feldebene zurückgeben.
- Notiz, die nur aus Leerzeichen/Zeilenumbrüchen besteht, auf "keine Notiz" normalisieren.

**Backend – Route:**
Keine strukturelle Änderung. Notiz fließt durch den bestehenden Request/Response-Zyklus.

**Frontend – Datenmodell:**
Das TypeScript-Interface für Chance erhält das optionale Feld `notiz`.

**Frontend – Service:**
Kein Umbau. Notiz wird automatisch über das bestehende Modell transportiert.

**Frontend – Formular (`chance-form`):**
- Neues Textarea-Feld mit Label "Notiz".
- 3 sichtbare Zeilen. Nicht Pflicht.
- Clientseitiger Validator für die Maximallänge (2000 Zeichen) plus sichtbarer Hinweis "Max. 2000 Zeichen". So sieht der Nutzer das Limit sofort, ohne Server-Roundtrip.

**Frontend – Detailseite (`chance-detail`):**
- Notiz-Abschnitt mit `white-space: pre-wrap` (Inline-Style oder eigene CSS-Klasse; Bootstrap hat keine passende Utility-Klasse), um Zeilenumbrüche zu erhalten.
- Notiz als reine Text-Interpolation binden, **nicht** über `[innerHTML]` (Notiz ist Freitext – sonst XSS-Risiko).
- Abschnitt wird mit `@if` ausgeblendet, wenn Notiz leer oder nicht vorhanden.

---

## Teststrategie

Auf Wunsch des Nutzers werden **keine automatisierten Tests** für diese Änderungen geschrieben.

### Manuelle Verifikation

**Teil 1 – Badge:**
1. Chancen-Liste öffnen. Prüfen: Jede Phase zeigt ein farbiges Badge statt Text.
2. Alle sechs Phasen einzeln prüfen. Farben mit der Tabelle in REQ-C02 abgleichen.
3. Chancen-Detailseite öffnen. Prüfen: Badge-Farbe stimmt mit der Liste überein.

**Teil 2 – Notiz:**
1. Neue Chance anlegen ohne Notiz. Speichern. Detailseite öffnen: Kein Notiz-Abschnitt sichtbar.
2. Chance bearbeiten, Notiz mit mehreren Zeilen eingeben. Speichern. Detailseite: Zeilenumbrüche sichtbar.
3. Notiz mit mehr als 2000 Zeichen eingeben. Speichern: Fehlermeldung erscheint.
4. Notiz leeren, speichern. Detailseite: Notiz-Abschnitt wieder ausgeblendet.
5. Chancen-Liste öffnen: Keine Notiz-Spalte sichtbar.

---

## Nicht-funktionale Anforderungen

- **Konsistenz:** Badge-Farben sind identisch auf Liste und Detailseite.
- **Performance:** Badge-Rendering hat keinen messbaren Einfluss auf die Ladezeit.
- **Datenmigration:** Bestehende Chancen ohne Notiz bleiben unverändert gültig.
- **Abwärtskompatibilität:** Kein bestehendes Feld der Chance-Entity wird verändert oder umbenannt.

---

## Erfolgskriterien

- Chancen-Liste zeigt Phase als farbiges Badge mit korrekten Bootstrap-Farben.
- Liste und Detailseite verwenden dieselbe Farbzuordnung.
- Neue Chance lässt sich mit und ohne Notiz anlegen.
- Notiz wird mehrzeilig und mit Zeilenumbrüchen auf der Detailseite angezeigt.
- Eingabe über 2000 Zeichen wird abgelehnt.
- Chancen-Liste zeigt keine Notiz-Spalte.
- `ng build` läuft ohne Fehler durch.

---

## Implementierung

Commits und Pull Requests werden hier nach Abschluss verlinkt.
