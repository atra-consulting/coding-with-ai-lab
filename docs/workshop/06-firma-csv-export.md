# 06 — CSV-Export für Firmenliste

**Umfang:** mittel · **Bereiche:** Backend + Frontend · **Dauer:** ~25 Min

## Ziel

Über der Firmenliste erscheint ein „CSV-Export"-Button. Klick → Browser lädt
`firmen.csv` mit allen Firmen (nicht nur die aktuelle Seite). Backend liefert
CSV-Datei mit korrektem `Content-Type` und UTF-8-BOM für Excel-Kompatibilität.

## Prompt

```
/plan-and-do "CSV-Export für die Firmenliste. Backend: neuer Endpoint GET /api/firmen/export.csv liefert alle Firmen als CSV mit Spalten id, name, branche, telefon, email, createdAt. Semikolon als Trenner, UTF-8 mit BOM, Content-Type text/csv; charset=utf-8, Content-Disposition attachment mit Dateinamen firmen-YYYY-MM-DD.csv. Frontend: Button 'CSV-Export' rechts oben in der Firmen-Liste. Klick öffnet Download. Keine extra Library — Node-seitig String-Aufbau genügt."
```

## Erwartetes Ergebnis

- `GET /api/firmen/export.csv` liefert CSV-Download.
- Datei öffnet sich in Excel **mit korrekten Umlauten** dank BOM.
- Button in der Firmen-Liste erzeugt Download via `window.open` oder
  `<a href>`.

## Troubleshooting

| Problem | Lösung |
|---------|--------|
| Excel zeigt „Ã¤" statt „ä" | BOM fehlt. Response muss mit `\uFEFF` beginnen. |
| Download öffnet CSV im Browser-Tab statt herunterzuladen | `Content-Disposition: attachment; filename="…"` Header fehlt. |
| Komma im Firmennamen zerstört CSV | Felder mit Trennzeichen, Anführungszeichen oder Zeilenumbruch müssen in `"…"` eingeschlossen und interne `"` verdoppelt werden. |
| 401 Unauthorized beim Klick | Browser schickt Cookies nicht mit, wenn `target="_blank"` + CORS. Als Workaround: `<a>` mit gleicher Origin nutzen (Proxy erledigt das im Dev). |
| Button platzierung seltsam | Bootstrap-Klasse `d-flex justify-content-end` auf dem Header-Container. |

## Diskussionspunkte

- Was tun, wenn die Firmenliste 100 000 Einträge hat? Streaming statt
  String-Aufbau.
- Wie würde Excel-Export (`.xlsx`) aussehen? Library wie `exceljs`.
