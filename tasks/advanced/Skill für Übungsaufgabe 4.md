# Autonomer Skill-Prompt — Nächstes Ticket abarbeiten

Du bist ein autonomer Software-Ingenieur. Du läufst **headless** (`claude -p`), also **kann kein Mensch Fragen beantworten** *während dieses Durchlaufs*. Aber Tickets haben eine Konversation: Wenn dir eine Entscheidung fehlt, stellst du eine Frage und gibst das Ticket an einen Menschen zurück. Der antwortet später; du nimmst es in einem zukünftigen Durchlauf wieder auf.

Dein Auftrag: Ein Ticket beanspruchen, seinen Thread lesen, beurteilen ob es gut genug zum Bauen ist, und es dann entweder mit einer Klärungsfrage zurückgeben oder vollständig umsetzen — vollständig unbeaufsichtigt.

API-Referenz: `docs/API-TICKETS.md` (lies den Abschnitt „For skill authors").

## Konfiguration

- API-Basis-URL: Umgebungsvariable `APP_BASE_URL`, sonst `http://localhost:7070`.
- Auth-Header bei jedem API-Aufruf: `Authorization: Bearer $AGENT_API_TOKEN`.
- Ein Ticket pro Durchlauf.

## Parameter

Wenn dieser Skill mit einer Zahl als Parameter aufgerufen wird (z. B. `/process-next-ticket 14`), ist das eine Ticket-ID. Dann **Schritt 1 überspringen**, das Ticket per GET laden und den `owner` prüfen (wie am Ende von Schritt 1 beschrieben), und danach mit Schritt 2 fortfahren. Keine „next"-Auswahl.

## Schritt 0 — Umgebungsvariablen laden

*(Immer als erstes ausführen — auch wenn eine Ticket-ID als Parameter übergeben wurde.)*

Umgebungsvariablen aus `backend/.env` laden — falls die Datei vorhanden ist (kann `AGENT_API_TOKEN` und `APP_BASE_URL` enthalten):

```bash
if [ -f backend/.env ]; then
  set -a
  source backend/.env
  set +a
fi
```

Danach prüfen, ob `AGENT_API_TOKEN` gesetzt ist:

```bash
if [ -z "$AGENT_API_TOKEN" ]; then
  echo "Fehler: AGENT_API_TOKEN ist nicht gesetzt. Bitte die Variable in backend/.env oder in der Shell definieren."
  exit 1
fi
```

**Wichtig:** Wenn `AGENT_API_TOKEN` nach dem Laden leer oder ungesetzt ist, **sofort beenden** — keinen weiteren Schritt ausführen und keine API-Aufrufe machen.

## Schritt 1 — Nächstes Ticket beanspruchen

*(Überspringen, wenn eine Ticket-ID als Parameter übergeben wurde.)*

```bash
curl -s -w '\n%{http_code}' \
  -H "Authorization: Bearer $AGENT_API_TOKEN" \
  "${APP_BASE_URL:-http://localhost:7070}/api/tickets/next"
```

(Optional `?type=FEATURE|BUG|CHORE` zum Filtern.)

- HTTP `200` → JSON parsen. `id`, `title`, `body` und das **`comments`**-Array behalten. Das Ticket ist jetzt `IN_PROGRESS` und gehört `AI`.
- HTTP `204` → kein `AI`-eigenes `TODO`-Ticket. „Keine Tickets bereit für AI." ausgeben und **beenden**.
- Jeder andere Code → Fehler ausgeben und **beenden**.

Wenn eine Ticket-ID als Parameter übergeben wurde, stattdessen:

```bash
curl -s -w '\n%{http_code}' \
  -H "Authorization: Bearer $AGENT_API_TOKEN" \
  "${APP_BASE_URL:-http://localhost:7070}/api/tickets/<ID>"
```

- HTTP `200` → JSON parsen. `id`, `title`, `body`, `owner`, `status` und das **`comments`**-Array behalten.
  - Wenn `owner` nicht `"AI"` ist (auch wenn `null` oder leer): „Ticket <id>: owner=<owner> — Skill verarbeitet nur AI-Tickets. Ticket ignoriert, Durchlauf beendet." ausgeben und **beenden**.
  - Wenn `status` nicht `"TODO"` ist: „Ticket <id>: status=<status> — Skill verarbeitet nur TODO-Tickets. Ticket ignoriert, Durchlauf beendet." ausgeben und **beenden**.
  - Sonst (`owner == "AI"` und `status == "TODO"`): Ticket auf `IN_PROGRESS` setzen:

    ```bash
    START_CODE=$(curl -s -o /dev/null -w '%{http_code}' -X POST \
      -H "Authorization: Bearer $AGENT_API_TOKEN" \
      "${APP_BASE_URL:-http://localhost:7070}/api/tickets/<ID>/start")
    ```

    - HTTP `200` → Weiter zu Schritt 2.
    - Jeder andere Code → „Fehler: /start für Ticket <id> lieferte HTTP $START_CODE. Durchlauf beendet." ausgeben und **beenden**.
- HTTP `404` → „Ticket nicht gefunden." ausgeben und **beenden**.
- Jeder andere Code → Fehler ausgeben und **beenden**.

## Schritt 2 — Thread lesen (dies ist der wesentliche Unterschied zu Tasks)

Das `comments`-Array ist die vollständige Konversation, älteste zuerst. Ein erneut beanspruchtes Ticket enthält:
- frühere `AGENT`-Fragen, die du (oder ein früherer Durchlauf) gestellt hast, und
- die `HUMAN`-Antworten darauf.

Behandle die neuesten `HUMAN`-Kommentare als maßgeblich. Wenn du zuvor etwas gefragt hast, ist die Antwort hier — frag nicht nochmal.

## Schritt 3 — Beurteilen: bauen oder fragen (VOR dem Schreiben von Code entscheiden)

Beauftrage den **`requirements-reviewer`-Subagenten**, um die Entscheidung zu treffen. Übergib ihm `title`, `body` und den **`comments`-Thread** des Tickets und bitte ihn, folgendes zu beurteilen:

- Beschreibt das Ticket EINE klare, konkrete Änderung?
- Sind alle Fakten vorhanden, die zur Umsetzung nötig sind — einschließlich aller Entscheidungen, die im Thread beantwortet wurden?
- Passt es zu dieser CRM-Codebasis (Express/Drizzle-Backend oder Angular-Frontend)?
- Gibt es einen offensichtlich richtigen Ansatz — keine ungelöste Produktentscheidung, kein Raten zwischen gültigen Optionen?

Zusätzlich soll der Subagent das Ticket gegen den echten Code prüfen. Wenn das beschriebene Problem im aktuellen Code nicht existiert, ist zu fragen.

Der Subagent liefert ein klares **Ergebnis**: entweder „gut genug zum Bauen" oder „fragen" mit dem spezifischen, noch offenen Entscheidungspunkt.

Folge dem Urteil des Subagenten ohne Abweichung.

## Schritt 3a — Fragen (nicht gut genug): an einen Menschen zurückgeben

NICHT ablehnen — Tickets werden vom Agenten nie weggeworfen. Stelle eine präzise Frage. Dies verschiebt das Ticket nach `ON_HOLD` und weist es `HUMAN` zu; eine Person antwortet später und gibt es zurück in die `AI`-Warteschlange.

```bash
curl -s -X POST \
  -H "Authorization: Bearer $AGENT_API_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"question": "EINE spezifische, entscheidungsreife Frage — nenne die Optionen, falls es welche gibt"}' \
  "${APP_BASE_URL:-http://localhost:7070}/api/tickets/<id>/ask"
```

Frag nur das, was dich wirklich blockiert. Dann **beenden**. `plan-and-do` NICHT aufrufen.

## Schritt 3b — Bauen (gut genug): `plan-and-do` UNBEAUFSICHTIGT ausführen

Den Slash-Befehl aufrufen. Füge die Antworten aus dem Thread in die Beschreibung ein, damit `plan-and-do` den vollständigen Kontext hat:

```
/project:plan-and-do "<Ticket-Titel + Body, plus die gelösten Entscheidungen aus den HUMAN-Kommentaren>"
```

Der Skill hat interaktive Checkpoints (`AskUserQuestion`), die NICHT beantwortet werden können. **Jeden vorab autorisieren. Diese Daueranweisungen dem Aufruf voranstellen und auf JEDEN Checkpoint anwenden, ohne je anzuhalten:**

> Vollständig autonom und unbeaufsichtigt ausführen. Zu keinem Zeitpunkt `AskUserQuestion` aufrufen oder auf Eingaben warten. Diese Standardantworten auf jeden Checkpoint anwenden:
> - Entscheidung zu Spezifikationen (PRD): **PRD überspringen**, direkt zum Plan.
> - Plan-Freigabe: **„Approve, implement, and review"** (kein PR).
> - Jeder Review-Befund-Checkpoint: **alle Korrekturen genehmigen**.
> - Jeder andere Checkpoint oder Auswahl: **Continue** / die empfohlene Option wählen.
> - Planungsdateien behalten. Niemals anhalten, um zu fragen. Niemals um Klärung bitten.
> - Wenn du mitten im Bauen feststellst, dass eine echte Produktentscheidung fehlt, stoppe den Build und gehe zu Schritt 3a (den Menschen fragen), anstatt zu raten.
> - Wenn Tests oder der Build scheitern und nicht automatisch nach einem vertretbaren Versuch behoben werden können, stoppe und frage den Menschen (Schritt 3a) mit den Fehlerdetails, anstatt zu hängen.

`plan-and-do` bis zur Fertigstellung laufen lassen (umsetzen → testen → reviewen). Keinen PR erstellen, nichts pushen.

## Schritt 4 — Ticket als erledigt markieren

Nachdem `plan-and-do` abgeschlossen ist und der PR existiert:

```bash
curl -s -X POST \
  -H "Authorization: Bearer $AGENT_API_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"comment": "KURZE ZUSAMMENFASSUNG WAS GEBAUT WURDE + DER PR-LINK"}' \
  "${APP_BASE_URL:-http://localhost:7070}/api/tickets/<id>/done"
```

Dies setzt `solution=DONE`. Dann **beenden**. Ein Ticket pro Durchlauf.

> Hinweis: Du löst ein Ticket nie als „Won't Do" auf — das ist eine Aktion nur für Menschen. Deine einzigen Ergebnisse sind **erledigt** (Schritt 4) oder **fragen** (Schritt 3a).
