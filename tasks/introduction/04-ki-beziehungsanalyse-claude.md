# 04 — KI-Beziehungsanalyse (Google Gemini API)

**Dauer:** 45 min
**Sozialform:** einzeln
**Werkzeug:** Claude Code
**Voraussetzung:** Lab läuft unter `localhost:7200`, `GOOGLE_GEMINI_KEY` exportiert
**Ziel:** Ein Knopf auf Firmen- und Personen-Detailseite fasst die Geschäftsbeziehung zusammen und schlägt nächste Schritte vor.
**Ergebnis:** Eine Karte mit höchstens 150 Wörtern Zusammenfassung und bis zu fünf nächsten Schritten.

Das System sammelt alle zugehörigen Aktivitäten und Chancen und übergibt sie
strukturiert an Gemini. Der API-Key bleibt im Backend.

## Schritte

1. Claude Code im Projekt-Root starten: `claude --dangerously-skip-permissions`.
2. Den Prompt einfügen und an den Checkpoints PRD, Plan und Review lesen,
   dann `Continue`.
3. App neu starten (`./start.sh`) und auf einer Firma mit Aktivitäten
   „Beziehungs-Summary" klicken.
4. Dasselbe auf einer Personen-Detailseite prüfen — und einmal auf einer
   Firma ohne Aktivitäten, ob der Fallback greift.
5. Diff ansehen: `git diff main --stat`.

## Prompt

```
/plan-and-do "KI-Beziehungsanalyse für Firmen und Personen. Auf der Firmen- und Personen-Detailseite gibt es einen Button 'Beziehungs-Summary'. Klick sammelt im Backend alle zugehörigen Aktivitäten und Chancen und schickt sie an die Google Gemini API. Die KI antwortet auf Deutsch mit einer kurzen Zusammenfassung (maximal 150 Wörter) und bis zu fünf nächsten Schritten als Bulletpoint-Liste. Das Ergebnis erscheint als Karte auf der Detailseite. Der API-Key bleibt im Backend."
```

## Abnahme

- Backend-Endpoints für Firma und Person liefern strukturiertes JSON.
- Frontend-Detailseiten haben Button und rendern das Ergebnis.
- Prompt ist kompakt (Token-Effizienz), Ausgabe deterministisch strukturiert.

## Troubleshooting

| Problem | Lösung |
|---------|--------|
| Keine Aktivitäten oder Chancen vorhanden | Fallback-Antwort im Backend: „Noch keine Beziehungsdaten vorhanden." API-Call komplett überspringen. |
| Gemini antwortet in Fließtext statt JSON | Google Gemini API mit strukturierter Ausgabe (`responseSchema`) nutzen. |
| Zusammenfassung zu lang | Prompt-Constraint schärfer: „Höchstens 150 Wörter, keine Einleitung, direkt auf den Punkt." |
| Personen-Aktivitäten vs. Firmen-Aktivitäten | Eine Aktivität kann `personId` oder `firmaId` haben — beim Person-Summary nur Aktivitäten der Person ziehen, nicht die der Firma. |
| API-Key lekt ins Frontend | Niemals API-Keys ans Frontend geben. Alle Gemini-Calls ausschließlich im Backend. |

## Diskussion

- Prompt Engineering: Wie formuliert man Strukturvorgaben (Wortlimit,
  JSON-Schema) robust?
- Kontextaufbereitung: CSV-Tabelle vs. Markdown-Liste vs. JSON — was liest
  Gemini am besten?
- Datenschutz: Dürfen Kundendaten an Dritte (Google) gesendet werden?
  Welche Anonymisierung ist sinnvoll?
