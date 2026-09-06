# Feedback-Formular

Ein eigenständiges Feedback-Tool für Schulungen. Kein Backend, kein Login nötig. Teilnehmende scannen einen QR-Code und geben Feedback.

**Deployed unter:** <https://atra-feedback.vercel.app>

Das Tool lebt komplett in `frontend/src/app/features/feedback/` — unabhängig von der restlichen CRM-App.

## Zwei Seiten

| Seite | URL | Für wen |
|-------|-----|---------|
| Feedback-Formular | `/feedback` | Teilnehmende (scannen den QR-Code) |
| QR-Code-Seite | `/feedback-qr` | Trainer:innen (Beamer/Projektor) |

## Ein Feedback-Formular für eine neue Schulung anlegen

Eine Schulung braucht **keinen eigenen Deploy** mehr. Ein Deploy bedient beliebig viele Schulungen.

1. Öffne `/feedback-qr` im Browser.
2. Trage **Schulungsname** und **Trainer** in die beiden Textfelder ein.
3. QR-Code und Link darunter aktualisieren sich sofort — kein Speichern nötig.
4. Zeig den QR-Code während der Schulung (Beamer, Ausdruck, Folie).

Teilnehmende scannen den Code und landen auf `/feedback`. Titel und Trainer-Zeile zeigen automatisch, was du eingetragen hast.

**Der QR-Code zeigt immer auf <https://atra-feedback.vercel.app/feedback>** — auch wenn du `/feedback-qr` lokal auf `localhost` öffnest. Sonst wäre der Code auf dem Handy der Teilnehmenden wertlos.

**Beide Felder leer lassen** → das Formular zeigt den fest hinterlegten Standardtext (aktuell: „Agentic Engineering Bootcamp"). Bereits verteilte QR-Codes ohne Parameter funktionieren unverändert weiter.

**Maximal 200 Zeichen** pro Feld. Längerer Text wird beim Erzeugen des Links automatisch abgeschnitten — keine Fehlermeldung.

## Wie es technisch funktioniert

`/feedback-qr` baut den Link `/feedback?schulung=...&trainer=...`. `/feedback` liest diese zwei Parameter aus der URL:

- **Vorhanden und nicht leer** → Text im Formular kommt aus der URL.
- **Fehlt oder leer** → Formular zeigt den Standardtext.

Jede Antwort landet per JSON in einem Google Sheet (Google Apps Script, unverändert seit früheren Versionen). Jede Zeile trägt jetzt zusätzlich `schulung` und `trainerName`, damit Antworten mehrerer Schulungen später auseinandergehalten werden können.

**Achtung bei der Google-Sheet-Spalte:** Das Feld heißt `trainerName`, nicht `trainer`. Der Name `trainer` ist schon durch eine Bewertungsfrage im Formular belegt („Wie gut waren Aufbau und Struktur des Trainings?"). Wer das Sheet oder das Apps Script pflegt, braucht eine Spalte `trainerName` — nicht `trainer`.

## Mehr Details

- Fachliche Spezifikation: [docs/prds/PRD-FEEDBACK-FORM-QUERY-PARAMS.md](prds/PRD-FEEDBACK-FORM-QUERY-PARAMS.md)
- Frontend-Architektur: [docs/specs/SPECS-frontend.md](specs/SPECS-frontend.md) (Abschnitt „Feedback")
