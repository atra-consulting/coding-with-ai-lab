# 02 — In-App CRM-Assistent (Chat)

**Dauer:** 75 min
**Sozialform:** einzeln
**Werkzeug:** Claude Code
**Voraussetzung:** Lab läuft unter `localhost:7200`, `GOOGLE_GEMINI_KEY` exportiert
**Ziel:** Ein Chat-Fenster in der Anwendung beantwortet freie Fragen zu den CRM-Daten.
**Ergebnis:** Ein aufklappbares Chat-Widget, dessen Antworten aus den vom Backend gelieferten CRM-Daten stammen.

Die KI bekommt die Firmen, Personen, Chancen und Aktivitäten als
strukturierten Kontext mit und antwortet in natürlicher Sprache — Beispiel:
„Welche Firmen aus München haben noch keine Aktivitäten dieses Quartal?"

Die Aufgabe ist zu umfangreich für eine einzige `/plan-and-do`-Runde:
schrittweise abarbeiten, erst den Backend-Teil, Ergebnis prüfen, dann das
Widget mit erneutem `/plan-and-do`.

## Schritte

1. Claude Code im Projekt-Root starten: `claude --dangerously-skip-permissions`.
2. Den Prompt einfügen und an den Checkpoints PRD, Plan und Review lesen,
   dann `Continue`.
3. App neu starten (`./start.sh`) und das Chat-Fenster unten rechts
   aufklappen.
4. „Welche Firmen haben die meisten Chancen?" fragen und die Antwort gegen
   die Firmenliste prüfen.
5. Diff ansehen: `git diff main --stat` — der API-Key darf in keiner
   Frontend-Datei stehen.

## Prompt

```
/plan-and-do "In-App CRM-Assistent als Chat-Widget. Unten rechts in der App erscheint ein aufklappbares Chat-Fenster. Der User stellt Fragen zu den CRM-Daten (Firmen, Personen, Chancen, Aktivitäten); die Antworten kommen von der Google Gemini API und werden auf Deutsch angezeigt. Das Backend holt zu jeder Frage die relevanten Daten aus dem CRM und schickt sie zusammen mit der Frage an die KI. Der API-Key bleibt im Backend. Für den Einstieg reicht eine einfache Stichwort-Suche über die Daten."
```

## Abnahme

- Chat-Widget unten rechts, aufklappbar.
- Eingaben wie „Welche Firmen haben die meisten Chancen?" liefern sinnvolle
  Antworten.
- CRM-Daten werden pro Anfrage vom Backend geholt und mitgeschickt —
  nicht client-seitig vorhanden.
- API-Key niemals im Frontend-Bundle.

## Troubleshooting

| Problem | Lösung |
|---------|--------|
| 401 von Google Gemini API | API-Key-Environment-Variable prüfen: `GOOGLE_GEMINI_KEY`. Backend-Prozess nach Setzen neu starten. |
| Token-Limit überschritten | Kontext zu groß. Stichwort-Filter vor dem Call schärfer machen oder auf die Top-N relevantesten Firmen beschränken. |
| Antwort ist generisch / halluziniert | System-Prompt strenger formulieren: „Beantworte nur auf Basis der gelieferten Daten. Wenn die Daten die Antwort nicht hergeben, sage das." |
| UI hängt während Gemini antwortet | Streaming nutzen (Gemini streamt standardmäßig) oder zumindest Loading-Indikator anzeigen. |
| CORS-Fehler | Assistant-Endpoint läuft über den Angular-Proxy (`/api/*` → Backend). Keine direkten Gemini-Calls vom Browser. |

## Diskussion

- RAG-light vs. echte Vektor-Suche: wann lohnt sich ein Embeddings-Ansatz?
- Wie vermeidet man Prompt-Injection über User-Input in den CRM-Daten?
- Cost-Monitoring: Wie protokolliert man Token-Verbrauch pro Anfrage?
