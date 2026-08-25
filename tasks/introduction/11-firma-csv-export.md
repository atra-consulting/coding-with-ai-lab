# 11 — CSV-Export für Firmenliste

**Dauer:** 25 min
**Sozialform:** einzeln
**Werkzeug:** Claude Code
**Voraussetzung:** Lab läuft unter `localhost:7200`
**Ziel:** Ein Knopf über der Firmenliste lädt alle Firmen als CSV-Datei herunter.
**Ergebnis:** Eine `firmen-YYYY-MM-DD.csv`, die Excel direkt und mit korrekten Umlauten öffnet.

Die Datei enthält alle Firmen, nicht nur die aktuelle Seite. Das Backend
liefert sie mit passendem `Content-Type` und UTF-8-BOM für die
Excel-Kompatibilität.

## Schritte

1. Claude Code im Projekt-Root starten: `claude --dangerously-skip-permissions`.
2. Den Prompt einfügen und an den Checkpoints PRD, Plan und Review lesen,
   dann `Continue`.
3. App neu starten (`./start.sh`) und über der Firmenliste „CSV-Export"
   klicken.
4. Die heruntergeladene Datei in Excel öffnen und die Umlaute prüfen.
5. Diff ansehen: `git diff main --stat`.

## Prompt

```
/plan-and-do "CSV-Export für die Firmenliste. Über der Firmen-Liste erscheint ein Button 'CSV-Export'. Klick lädt eine Datei firmen-YYYY-MM-DD.csv mit allen Firmen herunter (nicht nur die aktuelle Seite). Die CSV enthält ID, Name, Branche, Telefon, E-Mail und Erstelldatum. Excel soll die Datei direkt öffnen können, auch mit deutschen Umlauten."
```

## Abnahme

- `GET /api/firmen/export.csv` liefert CSV-Download.
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

## Diskussion

- Was tun, wenn die Firmenliste 100 000 Einträge hat? Streaming statt
  String-Aufbau.
- Wie würde Excel-Export (`.xlsx`) aussehen? Library wie `exceljs`.
- Deutsche CSV-Header vs. englische DB-Feldnamen — wo mappt man das am
  saubersten?
