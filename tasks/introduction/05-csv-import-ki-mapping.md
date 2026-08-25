# 05 — Intelligenter CSV-Import mit KI-Spalten-Mapping

**Dauer:** 75 min
**Sozialform:** einzeln
**Werkzeug:** Claude Code
**Voraussetzung:** Lab läuft unter `localhost:7200`, `GOOGLE_GEMINI_KEY` exportiert
**Ziel:** Beim CSV-Import schlägt die KI vor, welche CSV-Spalte zu welchem CRM-Feld gehört.
**Ergebnis:** Ein Import, bei dem der Nutzer den KI-Vorschlag pro Spalte bestätigt oder korrigiert, bevor Daten entstehen.

Der User lädt eine Firmen-Liste hoch, die KI schlägt ein Mapping vor, der
User bestätigt oder korrigiert, dann werden die Daten importiert.

Die Aufgabe ist zu umfangreich für eine einzige `/plan-and-do`-Runde:
schrittweise abarbeiten, erst Schritt 1 des Prompts, Ergebnis prüfen, dann
den nächsten mit erneutem `/plan-and-do`.

## Schritte

1. Claude Code im Projekt-Root starten: `claude --dangerously-skip-permissions`.
2. Den Prompt einfügen und an den Checkpoints PRD, Plan und Review lesen,
   dann `Continue`.
3. App neu starten (`./start.sh`) und eine CSV mit absichtlich anders
   benannten Spalten hochladen.
4. Ein Ziel-Feld im Vorschlag ändern, eine Spalte auf „ignorieren" setzen
   und den Import laufen lassen.
5. Diff ansehen: `git diff main --stat`.

## Prompt

```
/plan-and-do "Intelligenter CSV-Import für Firmen. Schritt 1: Neue Seite 'Firmen importieren' mit Datei-Upload. Der User lädt eine CSV-Datei hoch. Schritt 2: Die Google Gemini API schaut sich die Kopfzeile und die ersten Datenzeilen an und schlägt vor, welche CSV-Spalte zu welchem CRM-Feld gehört (Name, Branche, Website, Telefon, E-Mail, Notizen). Schritt 3: Der Vorschlag erscheint als Tabelle; der User kann pro Spalte das Ziel-Feld ändern oder auf 'ignorieren' setzen. Schritt 4: Nach Bestätigung läuft der Import. Am Ende sieht der User, wie viele Firmen importiert, wie viele übersprungen wurden und welche Zeilen Fehler hatten."
```

## Abnahme

- CSV-Upload mit Drag-and-Drop oder File-Picker.
- KI-Mapping-Vorschlag, bearbeitbar.
- Erfolgreicher Import erzeugt neue Firmen; Fehler pro Zeile werden gesammelt
  und angezeigt.

## Troubleshooting

| Problem | Lösung |
|---------|--------|
| CSV mit BOM / Windows-Line-Endings | Parser so wählen, dass er beides toleriert (z. B. `csv-parse` mit `bom: true`). |
| KI schlägt nicht existierende Felder vor | Im Prompt die Liste der **erlaubten** Zielfelder explizit nennen: `name \| industry \| website \| phone \| email \| notes \| IGNORE`. Response-Schema erzwingen. |
| Mapping-Dropdown hat leere Optionen | Frontend sendet `null` als „ignorieren" — im Backend explizit auf `null` prüfen, nicht `undefined`. |
| Import schlägt bei einzelnen Zeilen fehl | Pro Zeile einzeln validieren (Zod-Schema für Firma) und bei Fehler weitermachen, nicht abbrechen. Fehler als `{ row: 5, field: 'email', message: '…' }` sammeln. |
| Sehr große CSVs (> 10 000 Zeilen) | Streaming-Import statt alles in den Speicher. Batch-Inserts à 100 Zeilen. |

## Diskussion

- Strukturierte LLM-Outputs: JSON-Schema, Tool-Use, oder freies Prompt mit
  Parser — welche Variante ist am robustesten?
- Wann ist die KI für Spalten-Mapping wirklich nötig, und wann würden simple
  Heuristiken (Levenshtein gegen Zielnamen) genügen?
- Wie testet man einen KI-basierten Feature automatisiert?
