# Ü 3 — In-App CRM-Assistent (Chat)

**Umfang:** groß · **Bereiche:** Backend + Frontend · **Dauer:** ~75 Min

## Ziel

Ein Chat-Fenster in der Applikation, über das der User freie Fragen zu den
CRM-Daten stellen kann. Die KI bekommt die Firmen, Personen, Chancen und
Aktivitäten als strukturierten Kontext mit und antwortet in natürlicher
Sprache — Beispiel: „Welche Firmen aus München haben noch keine Aktivitäten
dieses Quartal?"

## Prompt

Claude starten und mit "Tab" in den Auto-Modus schalten. Mit `/model` Sonnet
auswählen und dann folgenden Prompt ausführen, der den
`/project:plan-and-do` Skill aufruft. 

```
/project:plan-and-do In-App CRM-Assistent als Chat-Widget. Erstellen keinen PR und
pushe nicht - du hast bei diesem Repo nicht die Rechte dazu. Schreibe keine Tests, 
die den Browser automatisieren. Aktualisiere am Schluss auch nicht die Specs und 
Subagents.

Unten rechts in der App erscheint ein aufklappbares Chat-Fenster. Der User stellt
Fragen zu den CRM-Daten (Firmen, Personen, Chancen, Aktivitäten); die Antworten
kommen von der Google gemini-2.5-flash API und werden auf Deutsch angezeigt. Das 
Backend holt zu jeder Frage die relevanten Daten aus dem CRM und schickt sie zusammen
mit der Frage an die KI. Der API-Key bleibt im Backend. Für den Einstieg reicht
eine einfache Stichwort-Suche über die Daten.

Logge die Ausführung im Backend so, dass Dir die Log-Einträge bei der
Fehlersuche helfen können.

Lege eine .env-Datei für den Google Gemini API Key und setzte diesen Wert:
AIzaSyAU2S4fPVIfYVQ51mpU0kHZpJuy0kVvgCk Ignoriere diese Datei in Git.
```

Wenn der Skill fragt, ob eine PRD erstellt werden soll, dann bitte zustimmen.

## Erwartetes Ergebnis

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

## Diskussionspunkte

- RAG-light vs. echte Vektor-Suche: wann lohnt sich ein Embeddings-Ansatz?
- Wie vermeidet man Prompt-Injection über User-Input in den CRM-Daten?
- Cost-Monitoring: Wie protokolliert man Token-Verbrauch pro Anfrage?
