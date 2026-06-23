# 1 — CSV-Export für Firmenliste

**Umfang:** gering · **Bereiche:** Frontend · **Dauer:** ~20 Min

## Ziel

Über der Firmenliste erscheint ein „CSV-Export"-Button. Klick → Browser lädt
`firmen.csv` mit allen Firmen (nicht nur die aktuelle Seite). Backend liefert
CSV-Datei mit korrektem `Content-Type` und UTF-8-BOM für Excel-Kompatibilität.

## Prompt

Mit <Tab> in den Plan-Modus schalten (steht ganz unten links) und dann diesen Prompt einkopieren:

```
CSV-Export für die Firmenliste. Über der Firmen-Liste erscheint ein Button
'CSV-Export'. Klick lädt eine Datei firmen-YYYY-MM-DD.csv mit allen Firmen
herunter (nicht nur die aktuelle Seite). Die CSV enthält ID, Name, Branche,
Telefon, E-Mail und Erstelldatum. Excel soll die Datei direkt öffnen können,
auch mit deutschen Umlauten. Benutze keine Custom Skills in diesem Projekt 
und keine Subagents. Erstelle eine neue Git-Branche für Deine Arbeit, aber
keinen PR. Die @CLAUDE.md hat die Spezifikationen dieser App.
```

## Erwartetes Ergebnis

- Datei öffnet sich in Excel **mit korrekten Umlauten** dank BOM.
- Button in der Firmen-Liste erzeugt Download via `window.open` oder
  `<a href>`.

## Troubleshooting

| Problem | Lösung |
|---------|--------|
| „no such column: branche" / „telefon" | DB-Spalten heißen `industry` und `phone` (englisch). Prüfen: `backend/src/config/migrate.ts` und `firmaService.ts`. |
| Excel zeigt „Ã¤" statt „ä" | BOM fehlt. Response muss mit `\uFEFF` beginnen. |
| Download öffnet CSV im Browser-Tab statt herunterzuladen | `Content-Disposition: attachment; filename="…"` Header fehlt. |
| Komma im Firmennamen zerstört CSV | Felder mit Trennzeichen, Anführungszeichen oder Zeilenumbruch müssen in `"…"` eingeschlossen und interne `"` verdoppelt werden. |
| 401 Unauthorized beim Klick | Browser schickt Cookies nicht mit, wenn `target="_blank"` + CORS. Als Workaround: `<a>` mit gleicher Origin nutzen (Proxy erledigt das im Dev). |
| Button-Platzierung seltsam | Bootstrap-Klasse `d-flex justify-content-end` auf dem Header-Container. |

## Diskussionspunkte

- Was tun, wenn die Firmenliste 100 000 Einträge hat? Streaming statt
  String-Aufbau.
- Wie würde Excel-Export (`.xlsx`) aussehen? Library wie `exceljs`.
- Deutsche CSV-Header vs. englische DB-Feldnamen — wo mappt man das am
  saubersten?
