---
name: "project:write-ticket"
description: "Headless autonomous skill that claims one agent-task feedback item (or takes a task ID, a task URL, or free-floating feedback text), judges it, and files a new Kanban ticket (Definition, owner HUMAN) from it — commenting on the ticket to demand missing info when the feedback is too thin. Never builds, pushes, or opens a PR."
argument-hint: "[task-id | task-url | feedback-text]"
version: 1.1.0
last-modified: 2026-07-08
allowed-tools:
  - Read
  - Bash
  - Task
---

# Write Ticket

Du bist ein autonomer Software-Ingenieur. Du läufst **headless** (`claude -p`) — kein Mensch kann Fragen beantworten. Entscheide alles selbst. Halte nie an, um Eingaben abzuwarten. Rufe niemals `AskUserQuestion` auf.

Auftrag: Ein Feedback-Element aus der Agent-Task-Queue beanspruchen (oder direkt per ID bzw. Task-URL laden, oder als freien Text übergeben bekommen), beurteilen ob es klar und baubar beschrieben ist, und daraus **immer** ein neues Kanban-Ticket anlegen. Dieser Skill baut nie Code, pusht nie, öffnet nie einen PR. Er triagiert nur.

API-Referenz: `docs/specs/SPEC-API-TASKS.md` (Abschnitt „For skill authors") für die Feedback-Queue, `docs/specs/SPEC-API-TICKETS.md` (Abschnitt „For skill authors") für die Ticket-Erstellung.

## Konfiguration

- API-Basis-URL: Umgebungsvariable `APP_BASE_URL`, sonst `http://localhost:7070`.
- Auth-Header bei jedem API-Aufruf: `Authorization: Bearer $AGENT_API_TOKEN`. Derselbe Token gilt für **beide** Queues — die Agent-Task-Queue und die Ticket-Erstellung. Ticket-Anlage und Kommentare akzeptieren den Agent-Token (bzw. den Loopback-Bypass), also ist **kein Admin-Login** nötig.
- Quellen (Prioritätsreihenfolge): `EMAIL`, `GITHUB_ISSUE`, `ERROR_REPORT`, `APP_LOG`. Mit `TASK_SOURCE` überschreibbar — dann nur diese eine Quelle.

## Parameter

Vier Eingabemodi, je nach Argument. In dieser Reihenfolge prüfen:

1. **Leer** (kein Argument) → nächstes Feedback aus der Agent-Task-Queue beanspruchen (Schritt 1, Beanspruchen-Zweig).
2. **Reine Zahl** (z. B. `/write-ticket 14`) → Task-ID. Den ID-Zweig von Schritt 1 nutzen (siehe „Wenn eine Task-ID als Parameter übergeben wurde" unten).
3. **Task-URL** (z. B. `/write-ticket http://localhost:7200/admin/agent-tasks/23`) → auch eine Task-ID. **Nur** wenn das GANZE Argument eine URL ist — es beginnt mit `http://`, `https://`, `/admin/` oder `/api/` **und** enthält keinen Leerraum. Dann die Ziffern nach `agent-tasks/` als ID herausziehen (`23`) und wie eine Task-ID behandeln. Das Muster `agent-tasks/<Ziffern>` matcht sowohl die Admin-URL (`/admin/agent-tasks/23`) als auch die API-URL (`/api/agent-tasks/23`); ein Schrägstrich, ein `?` oder das Ende danach ist erlaubt.
4. **Sonstiger freier Text** (z. B. `/write-ticket Dark-Mode-Umschalter im Header ergänzen`) → direktes Prosa-Feedback. Schritt 1 komplett überspringen (keine Agent-Task-Queue). Weiter mit dem Freitext-Zweig unten. Schritt 4 entfällt.

Unterscheidung: leer → Queue. Nur Ziffern → Task-ID. Ganzes Argument ist eine URL (ohne Leerraum) mit `agent-tasks/<Ziffern>` → Task-ID aus der URL. Sonst nicht-leer → freier Text. **Wichtig:** Prosa, die nur nebenbei einen `agent-tasks/…`-Pfad erwähnt (z. B. „Die Seite /admin/agent-tasks/23 stürzt ab"), enthält Leerraum und ist keine reine URL — also freier Text, keine Task-ID.

## Schritt 0 — Umgebungsvariablen laden

*(Immer zuerst ausführen — auch wenn eine Task-ID, Task-URL oder freier Text übergeben wurde. Der Freitext-Modus braucht `AGENT_API_TOKEN` für die Ticket-Erstellung in Schritt 3.)*

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

## Schritt 1 — Feedback beanspruchen / laden (Agent-Task)

*(Überspringen, wenn eine Task-ID, eine Task-URL oder freier Text als Parameter übergeben wurde.)*

Jede Quelle der Reihe nach probieren (oder nur `$TASK_SOURCE`). Für jede Quelle:

```bash
curl -s -w '\n%{http_code}' \
  -H "Authorization: Bearer $AGENT_API_TOKEN" \
  "${APP_BASE_URL:-http://localhost:7070}/api/agent-tasks/next?source=<QUELLE>"
```

Body und HTTP-Code separat aus der Ausgabe lesen (`body` = alles vor der letzten Zeile, `http_code` = letzte Zeile).

- HTTP `200` → JSON parsen. `id`, `title`, `body`, `metadata` behalten. Aufgabe ist jetzt `IN_PROGRESS`. Keine weiteren Quellen probieren. Weiter zu Schritt 2.
- HTTP `204` → keine offene Aufgabe für diese Quelle. Nächste Quelle probieren.
- Alle Quellen `204` → „Keine offenen Aufgaben." ausgeben und **beenden**.
- Jeder andere Code → Fehler ausgeben und **beenden**.

**Wenn eine Task-ID als Parameter übergeben wurde**, stattdessen:

```bash
curl -s -w '\n%{http_code}' \
  -H "Authorization: Bearer $AGENT_API_TOKEN" \
  "${APP_BASE_URL:-http://localhost:7070}/api/agent-tasks/<ID>"
```

- HTTP `200` → JSON parsen. `id`, `title`, `body`, `metadata`, `status` behalten.
  - `status` nicht `"OPEN"` → „Aufgabe <id>: status=<status> — Skill verarbeitet nur OPEN-Aufgaben. Durchlauf beendet." ausgeben und **beenden**.
  - `status == "OPEN"` → Aufgabe auf `IN_PROGRESS` setzen:

    ```bash
    START_CODE=$(curl -s -o /dev/null -w '%{http_code}' -X POST \
      -H "Authorization: Bearer $AGENT_API_TOKEN" \
      "${APP_BASE_URL:-http://localhost:7070}/api/agent-tasks/<ID>/start")
    ```

    - HTTP `200` → weiter zu Schritt 2.
    - Jeder andere Code → „Fehler: /start für Aufgabe <id> lieferte HTTP $START_CODE. Durchlauf beendet." ausgeben und **beenden**.
- HTTP `404` → „Aufgabe nicht gefunden." ausgeben und **beenden**.
- Jeder andere Code → Fehler ausgeben und **beenden**.

**Wenn eine Task-URL übergeben wurde**: die Ziffern nach `agent-tasks/` als `<ID>` herausziehen und exakt den ID-Zweig oben ausführen (laden, `status`-Prüfung, `/start`). Kein eigener Ablauf.

**Wenn freier Text übergeben wurde** (Prosa-Modus): keine Agent-Task laden. Stattdessen aus dem Argument die Feedback-Daten selbst bilden:

- `title` = eine kurze, prägnante Zusammenfassung des Textes (selbst formulieren).
- `body` = der vollständige übergebene Text.
- `metadata` = leer.

Es gibt hier **keine** `id` und **keine** Agent-Task. Direkt weiter zu Schritt 2.

Der Text kommt roh von der Kommandozeile und kann Anführungszeichen oder Zeilenumbrüche enthalten. Vor jedem `-d`-JSON-Payload (Schritt 3, Schritt 3a) `title` und `body` als JSON-String escapen, damit das JSON gültig bleibt.

## Schritt 2 — Beurteilen mit dem requirements-reviewer-Subagenten

*(VOR jeder Ticket-Erstellung entscheiden.)*

Den **`requirements-reviewer`-Subagenten** via Task-Tool beauftragen. `title`, `body` und `metadata` des Feedbacks übergeben (im Freitext-Modus die in Schritt 1 gebildeten Werte). Er beurteilt:

- Beschreibt das Feedback EINE klare, konkrete Änderung?
- Sind alle Fakten vorhanden, die zur Umsetzung nötig sind?
- Passt es zu dieser CRM-Codebasis (Express/Drizzle-Backend oder Angular-Frontend)?
- Gibt es einen offensichtlich richtigen Ansatz — keine Produktentscheidung, kein Raten?

Der Subagent liefert ein klares, binäres Urteil: entweder **„gut genug zum Bauen"** oder **„muss verfeinert werden"**, plus einen spezifischen, umsetzbaren Grund.

Zusätzlich bitten, einen Ticket-`type` vorzuschlagen: `FEATURE`, `BUG` oder `CHORE`. Ohne klaren Vorschlag `FEATURE` als Default nehmen.

Dem Urteil des Subagenten ohne Abweichung folgen. Das Urteil entscheidet **nicht**, ob ein Ticket entsteht — ein Ticket entsteht immer (Schritt 3). Es entscheidet nur, ob danach ein Kommentar mit offenen Fragen folgt (Schritt 3a) oder nicht (Schritt 3b).

## Schritt 3 — Ticket anlegen (IMMER)

Unabhängig vom Urteil aus Schritt 2: **immer** ein neues Ticket anlegen.

```bash
curl -s -w '\n%{http_code}' -X POST \
  -H "Authorization: Bearer $AGENT_API_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"type": "<Typ aus Schritt 2, Default FEATURE>", "title": "<Titel aus dem Feedback>", "body": "<Feedback-Body plus relevante Details aus Titel/Metadata>"}' \
  "${APP_BASE_URL:-http://localhost:7070}/api/tickets"
```

Body und HTTP-Code separat aus der Ausgabe lesen (`body` = alles vor der letzten Zeile, `http_code` = letzte Zeile).

- HTTP `201` → JSON parsen, neue Ticket-`id` behalten (im Folgenden `<newId>`). Weiter zu Schritt 3a oder 3b, je nach Urteil aus Schritt 2.
- Jeder andere Code → Fehler ausgeben und **beenden**.

Das neue Ticket landet automatisch mit `status=DEFINITION` und `owner=HUMAN` — das ist genau der Zielzustand. Owner **nicht** ändern. Ticket **nicht** nach `TODO` verschieben.

## Schritt 3a — Feedback zu dünn: muss verfeinert werden

Auf dem NEUEN Ticket einen Kommentar hinterlassen, der genau benennt, was fehlt:

```bash
COMMENT_CODE=$(curl -s -o /dev/null -w '%{http_code}' -X POST \
  -H "Authorization: Bearer $AGENT_API_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"body": "GENAU WAS FEHLT ODER UNKLAR IST, damit ein Mensch das Ticket vervollständigen kann"}' \
  "${APP_BASE_URL:-http://localhost:7070}/api/tickets/<newId>/comments")
```

- HTTP `200` → weiter zu Schritt 4 (im Freitext-Modus dort sofort beenden).
- Jeder andere Code → „Fehler: Kommentar für Ticket #<newId> lieferte HTTP $COMMENT_CODE. Durchlauf beendet." ausgeben und **beenden**. (Nicht zu Schritt 4 gehen — sonst meldet der Skill fälschlich eine hinterlegte Rückfrage.)

Den Text aus dem Grund des Subagenten aus Schritt 2 ableiten. Generische Kommentare wie „unklar" sind nicht akzeptabel — die Lücken konkret benennen.

Der Endpunkt speichert den Kommentar immer als `author=HUMAN` — unabhängig davon, wer ihn aufruft.

## Schritt 3b — Feedback gut genug

Nichts weiter am Ticket tun. Kein Kommentar, keine Status- oder Owner-Änderung. Das Ticket bleibt in `DEFINITION` bei `owner=HUMAN` und wartet dort auf einen Menschen zur weiteren Verfeinerung oder Übergabe an die KI.

Weiter zu Schritt 4 (im Freitext-Modus dort sofort beenden).

## Schritt 4 — Feedback-Task als erledigt markieren

*(Nur wenn eine Agent-Task existiert — also im Queue-, Task-ID- oder Task-URL-Modus. Im Freitext-Modus entfällt Schritt 4 komplett: Es gibt keine Agent-Task, die abzuschließen wäre. Dann direkt **beenden**.)*

In BEIDEN Zweigen (3a und 3b): die ursprüngliche Feedback-Aufgabe abschließen.

```bash
DONE_CODE=$(curl -s -o /dev/null -w '%{http_code}' -X POST \
  -H "Authorization: Bearer $AGENT_API_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"comment": "Triagiert in Ticket #<newId> (Definition, Mensch). <Zusatz je nach Zweig>"}' \
  "${APP_BASE_URL:-http://localhost:7070}/api/agent-tasks/<id>/done")
```

Für `<Zusatz je nach Zweig>`:

- Nach Schritt 3a: „Rückfrage im Ticket hinterlegt."
- Nach Schritt 3b: „bereit zur Verfeinerung."

HTTP-Code prüfen:

- HTTP `200` → erfolgreich abgeschlossen.
- Jeder andere Code → „Fehler: /done für Aufgabe <id> lieferte HTTP $DONE_CODE. Ticket #<newId> ist bereits angelegt, aber die Agent-Task bleibt offen." ausgeben. (Das Ticket steht schon — also klar sagen, dass nur das Abschließen der Quelle fehlgeschlagen ist, nicht der ganze Durchlauf.)

Dann **beenden**. Ein Feedback-Element pro Durchlauf.

**Kein `git push`, kein PR, kein `plan-and-do`.** Dieser Skill baut nichts — er triagiert nur.
