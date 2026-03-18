# Aufgabe 6: In-App CRM-Assistent (Chat)

## Beschreibung

Baue ein Chat-Fenster in die Applikation ein, über das der User Fragen zu den CRM-Daten stellen kann.

## Anforderungen

- Kleines Chat-Fenster in der UI (z.B. als aufklappbares Widget)
- Die KI kennt die CRM-Daten (Firmen, Personen, Aktivitäten) und kann Fragen dazu beantworten
- Beispiel-Frage: *„Welche Firmen aus München haben noch keine Aktivitäten dieses Quartal?"*
- Die Antworten sollen per Streaming angezeigt werden (Token für Token)

## Lernziel

- RAG-Konzept light: Wie stellt man dem LLM die relevanten Daten als Kontext bereit?
- API-Integration: Anbindung einer LLM-API ans Backend
- Streaming: Server-Sent Events oder ähnliches für Echtzeit-Antworten
