# 03 — Firmendossier via LLM (Gemini)

**Dauer:** 60 min
**Sozialform:** einzeln
**Werkzeug:** Claude Code
**Voraussetzung:** Lab läuft unter `localhost:7200`, `GOOGLE_GEMINI_KEY` exportiert
**Ziel:** Ein Knopf auf der Firmen-Detailseite holt über die Gemini API ein Dossier zur Firma.
**Ergebnis:** Eine Karte mit Zusammenfassung und drei aktuellen Presseberichten, deren Links aus dem Web-Grounding stammen.

Gute Aufgabe, um Web-Grounding und strukturierte LLM-Responses zu zeigen —
dafür kommen erst real existierende Firmen in die Testdaten, sonst hat die
KI nichts zu recherchieren.

## Schritte

1. Claude Code im Projekt-Root starten: `claude --dangerously-skip-permissions`.
2. Den Prompt einfügen und an den Checkpoints PRD, Plan und Review lesen,
   dann `Continue`.
3. App mit frischer Datenbank starten (`./start.sh --reset-db`), damit die
   neuen Fixture-Firmen geladen werden.
4. Eine der realen Firmen öffnen, „Firmendossier abrufen" klicken und
   prüfen, ob Ladeindikator, Zusammenfassung und verlinkte Presseberichte
   erscheinen.
5. Diff ansehen: `git diff main --stat`.

## Prompt

```
/plan-and-do "Firmendossier über Gemini API. Schritt 1: Die Testdaten um einige real existierende Firmen erweitern (z. B. Apple, Microsoft, Alphabet, Amazon, Meta, Nvidia, Tesla) mit realistischen Stammdaten. Schritt 2: Ein Button 'Firmendossier abrufen' auf der Firmen-Detailseite. Klick ruft die Gemini API mit Web-Grounding auf und holt ein deutsches Dossier zur Firma: kurze Zusammenfassung plus drei aktuelle Presseberichte (Titel, Datum, Quelle). Schritt 3: Während die KI antwortet, zeigt die UI einen Ladeindikator. Das Ergebnis erscheint als Karte: Zusammenfassung oben, Presseberichte darunter als Liste mit verlinkten Titeln."
```

## Abnahme

- Fixture enthält mindestens drei der MAG7-Firmen mit realistischen Daten.
- `GET /api/firmen/:id/dossier` liefert strukturiertes JSON.
- Firmen-Detailseite hat Button „Firmendossier abrufen" und rendert das
  Ergebnis als Card mit Zusammenfassung + Presseberichte.

## Troubleshooting

| Problem | Lösung |
|---------|--------|
| Fixture-Daten werden nicht geladen | Fixture wird bei leerer DB via Migration geladen. `./start.sh --reset-db` und neu starten. |
| Gemini-API 403 | API-Key fehlt oder hat kein Grounding-Feature freigeschaltet. Key via Google AI Studio prüfen. |
| Quellen-Links sind Halluzinationen | Ohne Web-Grounding kennt das Modell keine aktuellen URLs. Grounding-Option aktivieren und nur dann Links rendern, wenn die API sie liefert. |
| Antwort ist kein valides JSON | Gemini mit `responseSchema` aufrufen (strukturierte Ausgabe) statt freies Prompt. |
| Dossier-Endpoint langsam | Gemini-Call kann mehrere Sekunden dauern. Im Frontend deutlicher Loading-State + optional Caching im Backend pro `firmaId`. |

## Diskussion

- Caching-Strategie: Wie lange ist ein Firmendossier „frisch"?
- Strukturierte Ausgaben und Grounding: Wann ist ein festes Schema sinnvoll,
  wann reicht freies Prompting?
- Quellenangabe: Muss man Presseberichte rechtlich zitieren oder verlinken?
