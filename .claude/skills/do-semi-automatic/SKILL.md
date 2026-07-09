---
name: "project:do-semi-automatic"
description: "Headless skill that works one Ready+AI Kanban ticket per run — judges it, sends it back to Definition (owner HUMAN) if under-specified, or builds it fully via plan-and-do, documenting every status change with a comment. No push, no PR. For headless claude -p runs."
argument-hint: "[ticket-id | ticket-url] [comment]"
version: 1.2.0
last-modified: 2026-07-09
allowed-tools:
  - Read
  - Bash
  - Task
  - Skill
---

# Do Semi Automatic

Du bist ein autonomer Software-Ingenieur. Du läufst **headless** (`claude -p`) — kein Mensch kann Fragen beantworten. Entscheide alles selbst. Halte nie an, um Eingaben abzuwarten. Rufe niemals `AskUserQuestion` auf.

Auftrag: Ein Ticket in Spalte „Zu bereit" mit `owner=AI` finden (oder direkt per ID bzw. URL laden), seinen Thread lesen, beurteilen ob es gut genug zum Bauen ist, und es dann entweder zurück nach Definition geben oder vollständig umsetzen — unbeaufsichtigt. Ein Ticket pro Durchlauf.

API-Referenz: `docs/specs/SPEC-API-TICKETS.md` (Abschnitt „For skill authors").

## Konfiguration

- API-Basis-URL: Umgebungsvariable `APP_BASE_URL`, sonst `http://localhost:7070`.
- Auth-Header bei **jedem** API-Aufruf: `Authorization: Bearer $AGENT_API_TOKEN`. Lokal greift statt dessen der Loopback-Bypass (`AGENT_AUTH_ALLOW_LOOPBACK=1`), falls kein Header gesetzt ist — reiner Hintergrund-Kontext, dieser Skill sendet den Header immer, da Schritt 0 ohne gesetztes `AGENT_API_TOKEN` sofort abbricht. Dieser Skill nutzt **ausschließlich** den Agent-Token — kein Admin-Login, keine Admin-Session, keine Admin-Zugangsdaten an irgendeiner Stelle. Das gilt auch für `GET /api/tickets/board` und `PATCH /api/tickets/:id/status` — beide akzeptieren zusätzlich zur Admin-Session auch den Agent-Token bzw. den Loopback-Bypass.
- Ein Ticket pro Durchlauf.

## Parameter

Lies das Argument als `<erstes Token> [Rest…]`. Das **erste Token** (bis zum ersten Leerraum) ist die ID oder URL. Alles danach ist ein optionaler, freier `Hinweis` — er darf Leerraum enthalten. Trimme den `Hinweis`. Fehlt der Rest, oder bleibt nach dem Trimmen nur Leerraum, gibt es keinen `Hinweis`.

> Zur Benennung: `Hinweis` (in Backticks) meint immer diesen optionalen Aufruf-Text. Das Wort „Kommentar" bleibt für die Ticket-Kommentare reserviert, die dieser Skill über `POST /:id/comments` schreibt.

Drei Eingabemodi, je nach erstem Token. In dieser Reihenfolge prüfen:

1. **Leer** (kein Argument) → das nächste Ready+AI-Ticket suchen (Schritt 1, Board-Zweig). Kein `Hinweis` möglich — es gibt kein benanntes Ticket, an das er sich hängen könnte.
2. **Reine Zahl** als erstes Token (z. B. `/do-semi-automatic 8` oder `/do-semi-automatic 8 bitte nur das Backend anfassen`) → Ticket-ID. Die „Nächstes Ticket finden"-Auswahl in Schritt 1 überspringen. Statt dessen das Ticket per ID laden und prüfen, ob es Ready+AI ist (ID-Zweig unten). Der Rest nach dem ersten Token ist der optionale `Hinweis`.
3. **Ticket-URL** als erstes Token (z. B. `/do-semi-automatic http://localhost:7200/admin/tickets/11` oder mit angehängtem `Hinweis`) → auch eine Ticket-ID. **Nur** wenn das erste Token eine URL ist — es beginnt mit `http://`, `https://`, `/admin/` oder `/api/`. Dann die Ziffern nach `tickets/` als ID herausziehen (`11`) und wie eine Ticket-ID behandeln. Das Muster `tickets/<Ziffern>` matcht sowohl die Admin-URL (`/admin/tickets/11`) als auch die API-URL (`/api/tickets/11`); ein Schrägstrich, ein `?` oder das Ende danach ist erlaubt. Enthält die URL kein `tickets/<Ziffern>` (z. B. `.../tickets/board` oder `.../tickets/next`) → Fehler ausgeben und **beenden**. Der Rest nach dem ersten Token ist der optionale `Hinweis`.

Dieser Skill kennt **keinen** Freitext-Modus für das erste Token. Nur das **erste Token** muss reine Zahl oder URL sein — Text danach ist der optionale `Hinweis`, kein Fehler. Ist das erste Token weder reine Zahl noch URL (z. B. Prosa wie „Die Seite /admin/tickets/11 hängt", die mit einem Wort beginnt), ist das Argument ungültig → Fehler ausgeben und **beenden**.

Der geparste Wert heißt ab hier `Hinweis` (leer, wenn keiner übergeben wurde). Spätere Schritte verweisen auf diesen Namen. Gib den `Hinweis` **nicht** in Anführungszeichen ein — jedes Zeichen nach dem ersten Token gehört dazu, Anführungszeichen landen sonst wörtlich im Text.

## Fehlerbehandlung bei mutierenden Aufrufen

Gilt für **jeden** POST/PATCH-Aufruf in Schritt 3a, 3b, 3b-Blocker und 4. HTTP-Code immer erfassen (`-w '%{http_code}'` bzw. `-o /dev/null -w '%{http_code}'`, wie schon in Schritt 1). Bei jedem Nicht-2xx-Code: Endpunkt und Code ausgeben und **sofort beenden**, ohne die verbleibenden Aufrufe des Schritts auszuführen. Nie einen Erfolg (erledigt, zurückgegeben, blockiert) melden, wenn der zugehörige Aufruf fehlgeschlagen ist.

## Schritt 0 — Umgebungsvariablen laden

*(Immer zuerst ausführen — auch wenn eine Ticket-ID oder Ticket-URL übergeben wurde.)*

Alle Pfade sind relativ zum Projekt-Wurzelverzeichnis. Der Skill läuft aus dem Repo-Root.

```bash
if [ -f backend/.env ]; then
  set -a
  source backend/.env
  set +a
fi
```

Danach prüfen ob `AGENT_API_TOKEN` gesetzt ist:

```bash
if [ -z "$AGENT_API_TOKEN" ]; then
  echo "Fehler: AGENT_API_TOKEN ist nicht gesetzt. Bitte die Variable in backend/.env oder in der Shell definieren."
  exit 1
fi
```

Wenn `AGENT_API_TOKEN` leer oder ungesetzt ist: sofort beenden. Keine weiteren Schritte. Keine API-Aufrufe.

## Schritt 1 — Nächstes Ready+AI-Ticket finden (NICHT starten)

*(Überspringen, wenn eine Ticket-ID oder Ticket-URL als Parameter übergeben wurde — dann den ID-Zweig unten nutzen.)*

**Wichtig:** Dieser Schritt beansprucht das Ticket noch nicht. Es bleibt in `TODO`. Der Wechsel nach `IN_PROGRESS` passiert erst in Schritt 3b.

```bash
curl -s -w '\n%{http_code}' \
  -H "Authorization: Bearer $AGENT_API_TOKEN" \
  "${APP_BASE_URL:-http://localhost:7070}/api/tickets/board"
```

Body und HTTP-Code separat aus der Ausgabe lesen (`body` = alles vor der letzten Zeile, `http_code` = letzte Zeile).

- HTTP `200` → JSON parsen. Das `TODO`-Array (Spalte „Zu bereit") herausnehmen, es ist bereits nach `createdAt ASC` sortiert. Das älteste Ticket mit `owner=="AI"` wählen. Kein solches Ticket → „Keine Tickets bereit für AI." ausgeben und **beenden**.
- Jeder andere Code → Fehler ausgeben und **beenden**.

Dann das volle Ticket laden:

```bash
curl -s -w '\n%{http_code}' \
  -H "Authorization: Bearer $AGENT_API_TOKEN" \
  "${APP_BASE_URL:-http://localhost:7070}/api/tickets/<id>"
```

- HTTP `200` → JSON parsen. `id`, `title`, `body` und das **`comments`**-Array behalten. Weiter zu Schritt 2.
- Jeder andere Code → Fehler ausgeben und **beenden**.

**Wenn eine Ticket-ID als Parameter übergeben wurde**, statt dessen:

Parse einen optionalen `Hinweis` zusammen mit der ID bzw. URL (siehe „Parameter" oben). Führe ihn einfach mit. Er hat keinen Einfluss auf Laden, `owner`-Prüfung oder `status`-Prüfung.

```bash
curl -s -w '\n%{http_code}' \
  -H "Authorization: Bearer $AGENT_API_TOKEN" \
  "${APP_BASE_URL:-http://localhost:7070}/api/tickets/<ID>"
```

- HTTP `404` → „Ticket nicht gefunden." ausgeben und **beenden**.
- HTTP `200` → JSON parsen. `id`, `title`, `body`, `status`, `owner` und das **`comments`**-Array behalten.
  - `owner` nicht `"AI"` (auch `null` oder leer) → „Ticket <id>: owner=<owner> — Skill verarbeitet nur AI-Tickets. Durchlauf beendet." ausgeben und **beenden**.
  - `status` nicht `"TODO"` → „Ticket <id>: status=<status> — Skill verarbeitet nur Zu-bereit-Tickets (TODO). Durchlauf beendet." ausgeben und **beenden**.
  - Sonst (`owner == "AI"` und `status == "TODO"`) → weiter zu Schritt 2. Ticket bleibt `TODO` — noch nicht starten.
- Jeder andere Code → Fehler ausgeben und **beenden**.

**Wenn eine Ticket-URL übergeben wurde**: die Ziffern nach `tickets/` als `<ID>` herausziehen und exakt den ID-Zweig oben ausführen (laden, `owner`-Prüfung, `status`-Prüfung). Kein eigener Ablauf.

## Schritt 2 — Thread lesen

Das `comments`-Array ist die vollständige Konversation, älteste zuerst. Die neuesten `HUMAN`-Kommentare sind maßgeblich. Wurde eine frühere `AGENT`-Frage bereits beantwortet, nicht erneut fragen.

## Schritt 3 — Beurteilen: bauen oder zurückgeben

*(VOR dem Schreiben von Code entscheiden.)*

Den **`requirements-reviewer`-Subagenten** via Task-Tool beauftragen. `title`, `body`, den **`comments`-Thread** des Tickets und — falls vorhanden — den optionalen `Hinweis` übergeben. Er beurteilt:

- Beschreibt das Ticket EINE klare, konkrete Änderung?
- Sind alle Fakten vorhanden, die zur Umsetzung nötig sind — einschließlich aller Entscheidungen, die im Thread beantwortet wurden?
- Passt es zu dieser CRM-Codebasis (Express/Drizzle-Backend oder Angular-Frontend)?
- Gibt es einen offensichtlich richtigen Ansatz — keine ungelöste Produktentscheidung, kein Raten zwischen gültigen Optionen?

Der Subagent prüft das Ticket zusätzlich gegen den echten Code. Wenn das beschriebene Problem im aktuellen Code nicht existiert, ist das Ticket zurückzugeben.

Wurde ein `Hinweis` übergeben, darf der Subagent ihn als zusätzlichen Kontext berücksichtigen.

Der Subagent liefert ein klares, binäres Urteil: entweder **„gut genug zum Bauen"** oder **„zurückgeben"** mit dem spezifischen, noch offenen Entscheidungspunkt.

Dem Urteil des Subagenten ohne Abweichung folgen.

## Schritt 3a — Nicht gut genug → zurück auf Definition + Human

*(NICHT ablehnen, `plan-and-do` NICHT aufrufen.)*

Ein optionaler `Hinweis` bleibt hier ungenutzt — dieser Zweig ruft `plan-and-do` nicht auf.

Der Reihe nach, jeweils mit dem Agent-Token. Nach jedem Aufruf den HTTP-Code prüfen (siehe „Fehlerbehandlung bei mutierenden Aufrufen" oben) — schlägt einer fehl, sofort beenden und **nicht** als „zurückgegeben" melden:

1. Kommentar hinterlassen, der genau benennt, was fehlt bzw. welche Entscheidung offen ist:

   ```bash
   COMMENT_CODE=$(curl -s -o /dev/null -w '%{http_code}' -X POST \
     -H "Authorization: Bearer $AGENT_API_TOKEN" \
     -H "Content-Type: application/json" \
     -d '{"body": "GENAU WAS FEHLT ODER UNKLAR IST, damit ein Mensch das Ticket vervollständigen kann"}' \
     "${APP_BASE_URL:-http://localhost:7070}/api/tickets/<id>/comments")
   ```

2. Owner auf `HUMAN` setzen:

   ```bash
   OWNER_CODE=$(curl -s -o /dev/null -w '%{http_code}' -X PATCH \
     -H "Authorization: Bearer $AGENT_API_TOKEN" \
     -H "Content-Type: application/json" \
     -d '{"owner": "HUMAN"}' \
     "${APP_BASE_URL:-http://localhost:7070}/api/tickets/<id>/owner")
   ```

3. Status zurück auf `DEFINITION` setzen:

   ```bash
   STATUS_CODE=$(curl -s -o /dev/null -w '%{http_code}' -X PATCH \
     -H "Authorization: Bearer $AGENT_API_TOKEN" \
     -H "Content-Type: application/json" \
     -d '{"status": "DEFINITION"}' \
     "${APP_BASE_URL:-http://localhost:7070}/api/tickets/<id>/status")
   ```

Waren alle drei Codes `200`: **beenden**. Das Ticket landet in der Definition-Spalte bei `owner=HUMAN` und war nie `IN_PROGRESS`.

Generische Kommentare wie „unklar" sind nicht akzeptabel. Den fehlenden Punkt konkret benennen.

## Schritt 3b — Bauen (gut genug)

1. Ticket claimen:

   ```bash
   START_CODE=$(curl -s -o /dev/null -w '%{http_code}' -X POST \
     -H "Authorization: Bearer $AGENT_API_TOKEN" \
     "${APP_BASE_URL:-http://localhost:7070}/api/tickets/<id>/start")
   ```

   - HTTP `200` → Ticket ist jetzt `IN_PROGRESS`. Weiter mit Punkt 2 unten.
   - HTTP `409` → jemand/etwas anderes hat es beansprucht, oder es ist nicht mehr `TODO`+`AI`. Fehler ausgeben und **beenden**.
   - Jeder andere Code → Fehler ausgeben und **beenden**.

2. Statuswechsel dokumentieren (`/start` kennt kein Kommentarfeld):

   ```bash
   COMMENT_CODE=$(curl -s -o /dev/null -w '%{http_code}' -X POST \
     -H "Authorization: Bearer $AGENT_API_TOKEN" \
     -H "Content-Type: application/json" \
     -d '{"body": "In Bearbeitung genommen. Baue jetzt via plan-and-do."}' \
     "${APP_BASE_URL:-http://localhost:7070}/api/tickets/<id>/comments")
   ```

   HTTP-Code prüfen (siehe „Fehlerbehandlung bei mutierenden Aufrufen" oben). Nicht-2xx → Fehler ausgeben und **beenden**, `plan-and-do` NICHT aufrufen.

3. `plan-and-do` via Skill-Tool aufrufen. Ticket-Titel + Body plus die gelösten Entscheidungen aus den `HUMAN`-Kommentaren als Beschreibung übergeben.

   **Ohne `Hinweis`** — Beschreibung wie bisher:

   ```
   /project:plan-and-do "<Ticket-Titel + Body, plus die gelösten Entscheidungen aus den HUMAN-Kommentaren>"
   ```

   **Mit `Hinweis`** — den `Hinweis` **unverändert** und beschriftet als eigene Zeile an die Beschreibung anhängen:

   ```
   /project:plan-and-do "<Ticket-Titel + Body, plus die gelösten Entscheidungen aus den HUMAN-Kommentaren>
   Zusätzlicher Hinweis vom Aufruf (unverändert übernommen): <Hinweis>"
   ```

   Enthält der `Hinweis` selbst ein `"`, kann es die Anführungszeichen der Beschreibung sprengen — dann den `Hinweis` als eigene Zeile ohne umschließende Anführungszeichen anhängen bzw. das innere `"` maskieren.

   Diese Daueranweisungen dem Aufruf voranstellen und auf JEDEN Checkpoint anwenden, ohne je anzuhalten:

   > Vollständig autonom und unbeaufsichtigt ausführen. Zu keinem Zeitpunkt `AskUserQuestion` aufrufen oder auf Eingaben warten. Standardantworten:
   > - PRD überspringen → direkt zum Plan.
   > - Plan-Freigabe → „Approve, implement, and review" (kein PR).
   > - Jeder Review-Befund → alle Korrekturen genehmigen.
   > - Falls plan-and-do nach dem Test-Befehl fragt: für Backend-Änderungen `cd backend && npm test` antworten, für Frontend-Änderungen `cd frontend && npm run test:ci`; wenn unklar, `cd backend && npm test`.
   > - Jeder andere Checkpoint → Continue / empfohlene Option.
   >
   > Planungsdateien behalten. NIEMALS pushen, KEINEN PR anlegen. Wenn mitten im Bauen eine echte Produktentscheidung fehlt, ODER Tests/Build nach vertretbarem Versuch nicht automatisch grün werden: den Build stoppen und zu Schritt 3b-Blocker übergehen (siehe unten), statt zu raten oder zu hängen.

   `plan-and-do` bis zur Fertigstellung laufen lassen (umsetzen → testen → reviewen). **Keinen PR erstellen. Nichts pushen.** Das im Ergebnis explizit vermerken.

## Schritt 3b-Blocker — Frage oder Fehler während des Baus

Wenn mitten im Bauen eine echte, nicht beantwortbare Produktentscheidung fehlt, ODER Tests/der Build nach einem vertretbaren Versuch nicht automatisch grün werden: den Build abbrechen, NICHT raten, NICHT hängen bleiben.

```bash
ASK_CODE=$(curl -s -o /dev/null -w '%{http_code}' -X POST \
  -H "Authorization: Bearer $AGENT_API_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"question": "DIE GENAUE FRAGE ODER DER FEHLERTEXT, plus was bereits versucht wurde"}' \
  "${APP_BASE_URL:-http://localhost:7070}/api/tickets/<id>/ask")
```

- HTTP `200` → Das setzt das Ticket auf `ON_HOLD` („Wartet"), `owner` zurück auf `HUMAN`, und postet den Text als `AGENT`-Kommentar — `/ask` trägt seinen Kommentar selbst. Dann **beenden**. Das Ticket **nicht** als erledigt markieren.
- Jeder andere Code → Fehler ausgeben (Endpunkt, Code) und **beenden**. Nicht als „blockiert" melden — der Ticket-Status ist unklar, das Ticket steht weiterhin auf `IN_PROGRESS`.

## Schritt 4 — Erledigt markieren

*(Nur nach erfolgreichem Abschluss von Schritt 3b.)*

Zuerst den Branch-Namen ermitteln, den `plan-and-do` angelegt hat:

```bash
BRANCH=$(git branch --show-current)
```

Dann das Ticket als erledigt markieren. `$BRANCH` in den Kommentar einsetzen, `$AGENT_API_TOKEN` in den Header. Kein PR-Link — es gibt keinen PR:

```bash
DONE_CODE=$(curl -s -o /dev/null -w '%{http_code}' -X POST \
  -H "Authorization: Bearer $AGENT_API_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"comment\": \"KURZE ZUSAMMENFASSUNG WAS GEBAUT WURDE (Branch: $BRANCH)\"}" \
  "${APP_BASE_URL:-http://localhost:7070}/api/tickets/<id>/done")
```

- HTTP `200` → Dies setzt `solution=DONE`. Dann **beenden**. Ein Ticket pro Durchlauf.
- Jeder andere Code (z. B. `409`, weil das Ticket nicht mehr `IN_PROGRESS` ist) → Fehler ausgeben (Endpunkt, Code). **Nicht** als erledigt melden — das Ticket ist weiterhin `IN_PROGRESS` und muss manuell abgeschlossen werden. Dann **beenden**.

## Kommentar-Regel

Jede Statuswechsel-Entscheidung dieses Skills wird mit einem kleinen Ticket-Kommentar dokumentiert:

- `→ IN_PROGRESS` (Schritt 3b) und `→ DEFINITION` (Schritt 3a): jeweils per eigenem `POST /:id/comments`, da `/start`, `/owner` und `/status` selbst kein Kommentarfeld kennen.
- `→ ON_HOLD` (Schritt 3b-Blocker): der Kommentar kommt automatisch von `POST /:id/ask`.
- `→ DONE` (Schritt 4): der Kommentar kommt automatisch von `POST /:id/done`.

> Hinweis: Dieser Skill löst ein Ticket nie als „Won't Do" auf — das ist eine Aktion nur für Menschen. Seine einzigen Ergebnisse sind **erledigt** (Schritt 4), **zurück auf Definition** (Schritt 3a) oder **Blocked** (Schritt 3b-Blocker).
