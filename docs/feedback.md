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

Die Basis-URL steht fest im Code: die Konstante `FEEDBACK_BASE_URL` in `frontend/src/app/features/feedback/feedback-qr.component.ts`. Zieht das Tool auf eine andere Domain um, muss diese Konstante mit — sonst zeigen alle neuen QR-Codes weiter auf die alte Adresse.

Jede Antwort landet per JSON in einem Google Sheet. Der Payload enthält `schulung` und `trainerName` zusätzlich zu den Antworten — damit Antworten mehrerer Schulungen auseinandergehalten werden können.

**Das Senden allein genügt nicht.** Was im Sheet ankommt, entscheidet das Google Apps Script, und das steht außerhalb dieses Repos. Siehe [Der Webhook](#der-webhook).

**Achtung beim Feldnamen:** Das Feld heißt `trainerName`, nicht `trainer`. Der Name `trainer` ist schon durch eine Bewertungsfrage im Formular belegt („Wie gut waren Aufbau und Struktur des Trainings?"). Beide gehen getrennt raus.

## Der Webhook

Das Google Apps Script, das die Zeilen ins Sheet schreibt, liegt als Kopie unter [scripts/feedback-webhook.gs](../scripts/feedback-webhook.gs). **Die Kopie ist nicht die laufende Fassung** — der Code wird in Google ausgeführt und muss dort von Hand nachgezogen werden.

`doPost` schreibt mit `sheet.appendRow([...])` eine **fest verdrahtete Liste von Werten** in fester Reihenfolge. Es gibt kein Mapping über die Kopfzeile des Sheets. Daraus folgen zwei Dinge, die man leicht falsch macht:

- Ein neues Feld im Payload landet **nirgends**, solange es nicht in `appendRow` steht. Der Payload wächst, das Sheet nicht.
- Eine neue Spalte im Sheet allein bewirkt **gar nichts**. Der Code muss zuerst.

| Spalte | Payload-Feld |
|--------|--------------|
| A Schulungsdatum | `schulungsDatum` |
| B Timestamp | `timestamp` |
| C Gesamteindruck (1-5) | `gesamteindruck` |
| D Praxisnutzen (1-5) | `praxisnutzen` |
| E Struktur (1-5) | `trainer` ← die Sterne-Frage |
| F AI-Erfahrung | `aiErfahrung` |
| G Vorwissen | `vorwissen` |
| H KI-Zukunft | `kiZukunft` |
| I Advanced-Themen | `advancedThemen` |
| J Highlight | `highlight` |
| K Verbesserung | `verbesserung` |
| L Schulung | `schulung` |
| M Trainer (Name) | `trainerName` |

### Eine Änderung am Script ausrollen

1. Code im [Script-Editor](https://script.google.com/d/1C-iyfZfWKqP89ptjjD_qVW-Jx3KJLDWvkXrhoWBo87IKIIfQRPJv2bcT/edit) anpassen — und dieselbe Änderung in `scripts/feedback-webhook.gs` committen.
2. **Bereitstellung verwalten** → Stift → Version **Neu** → **Bereitstellen**. Ohne diesen Schritt läuft weiter der alte Code.
3. **Nicht** „Neue Bereitstellung" wählen: das vergibt eine neue `/exec`-URL, und die steht als `GOOGLE_SCRIPT_URL` fest im Frontend.

### Prüfen, ob die Kette lebt

```bash
curl -sL "$(grep -o 'https://script.google.com/macros/s/[A-Za-z0-9_-]*/exec' \
  frontend/src/app/features/feedback/feedback-form.component.ts | head -1)"
# lebt: 200 + "Feedback webhook is running."
# tot:  403 + "Sie benötigen Zugriff"
```

Der 403 tritt auf, wenn die Web-App ihre OAuth-Autorisierung verliert — das passiert bei nicht verifizierten Apps, deren Consent-Screen im Status *Testing* steht. Der Fix sitzt nicht in den Zugriffseinstellungen, sondern unter „Bereitstellungen verwalten → Zugriff gewähren".

**Der GET-Test beweist nur, dass die Web-App antwortet** — nicht, dass `doPost` ein neues Feld auch schreibt. Weil das Formular mit `mode: 'no-cors'` sendet, verwirft der Browser die Antwort: Der Teilnehmer sieht „Vielen Dank", auch wenn das Script die Zeile verwirft oder ein Feld fallen lässt. Nach jeder Änderung am Payload oder am Script deshalb eine Testzeile abschicken und im Sheet nachsehen.

## Deploy

Ein Repo, zwei Vercel-Projekte. Beide bauen dieselbe Angular-App.

| Projekt | URL | Job in `deploy.yml` | Secret mit der Projekt-ID |
|---------|-----|---------------------|---------------------------|
| CRM-App | <https://coding-with-ai-lab.vercel.app> | `deploy` | `VERCEL_PROJECT_ID` |
| Feedback-Seite | <https://atra-feedback.vercel.app> | `deploy-feedback` | `VERCEL_PROJECT_ID_FEEDBACK` |

Jeder Push auf `main` deployt beide — nach den Tests, parallel. `vercel.json` setzt `git.deploymentEnabled: false`. Vercel deployt also nie von allein. Die GitHub Action ist der einzige Weg.

Beide Projekte liegen im selben Vercel-Team (viewconic) und teilen sich `VERCEL_TOKEN` und `VERCEL_ORG_ID`.

**Für Teilnehmende zählt nur atra-feedback.** Dorthin zeigt jeder QR-Code. Deployst du nur die CRM-App, erzeugt die QR-Seite Links auf einen alten Stand der Feedback-Seite — `?schulung=` und `?trainer=` laufen dann ins Leere.

Genau das war bis zum 06.09.2026 der Fall: Den Job `deploy-feedback` gab es noch nicht, die Feedback-Seite stand auf dem Build vom 02.09.2026 und ignorierte die Parameter.

## Mehr Details

- Fachliche Spezifikation: [docs/prds/PRD-FEEDBACK-FORM-QUERY-PARAMS.md](prds/PRD-FEEDBACK-FORM-QUERY-PARAMS.md)
- Frontend-Architektur: [docs/specs/SPECS-frontend.md](specs/SPECS-frontend.md) (Abschnitt „Feedback")
- Deploy-Infrastruktur: [docs/specs/SPECS-infrastructure.md](specs/SPECS-infrastructure.md) (Abschnitt „Vercel Deployment")
