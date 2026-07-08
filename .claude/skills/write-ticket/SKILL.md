---
name: "project:write-ticket"
description: "Headless autonomous skill that claims one agent-task feedback item, judges it, and files a new Kanban ticket (Definition, owner HUMAN) from it — commenting on the ticket to demand missing info when the feedback is too thin. Never builds, pushes, or opens a PR."
argument-hint: "[task-id]"
version: 1.0.0
last-modified: 2026-07-08
allowed-tools:
  - Read
  - Bash
  - Task
---

# Write Ticket

Du bist ein autonomer Software-Ingenieur. Du läufst **headless** (`claude -p`) — kein Mensch kann Fragen beantworten. Entscheide alles selbst. Halte nie an, um Eingaben abzuwarten. Rufe niemals `AskUserQuestion` auf.

Auftrag: Ein Feedback-Element aus der Agent-Task-Queue beanspruchen (oder direkt per ID laden), beurteilen ob es klar und baubar beschrieben ist, und daraus **immer** ein neues Kanban-Ticket anlegen. Dieser Skill baut nie Code, pusht nie, öffnet nie einen PR. Er triagiert nur.

API-Referenz: `docs/specs/SPEC-API-TASKS.md` (Abschnitt „For skill authors") für die Feedback-Queue, `docs/specs/SPEC-API-TICKETS.md` (Abschnitt „For skill authors") für die Ticket-Erstellung.

## Konfiguration

- API-Basis-URL: Umgebungsvariable `APP_BASE_URL`, sonst `http://localhost:7070`.
- Auth-Header bei jedem API-Aufruf: `Authorization: Bearer $AGENT_API_TOKEN`. Derselbe Token gilt für **beide** Queues — die Agent-Task-Queue und die Ticket-Erstellung. Ticket-Anlage und Kommentare akzeptieren den Agent-Token (bzw. den Loopback-Bypass), also ist **kein Admin-Login** nötig.
- Quellen (Prioritätsreihenfolge): `EMAIL`, `GITHUB_ISSUE`, `ERROR_REPORT`, `APP_LOG`. Mit `TASK_SOURCE` überschreibbar — dann nur diese eine Quelle.

## Parameter

Wenn der Skill mit einer Zahl aufgerufen wird (z. B. `/write-ticket 14`), ist das eine Task-ID. Den Beanspruchen-Teil von Schritt 1 überspringen. Direkt den ID-Zweig nutzen (siehe „Wenn eine Task-ID als Parameter übergeben wurde" unten).

## Schritt 0 — Umgebungsvariablen laden

*(Immer zuerst ausführen — auch wenn eine Task-ID übergeben wurde.)*

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

*(Überspringen, wenn eine Task-ID als Parameter übergeben wurde.)*

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

## Schritt 2 — Beurteilen mit dem requirements-reviewer-Subagenten

*(VOR jeder Ticket-Erstellung entscheiden.)*

Den **`requirements-reviewer`-Subagenten** via Task-Tool beauftragen. `title`, `body` und `metadata` der Aufgabe übergeben. Er beurteilt:

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

- HTTP `200` → weiter zu Schritt 4.
- Jeder andere Code → „Fehler: Kommentar für Ticket #<newId> lieferte HTTP $COMMENT_CODE. Durchlauf beendet." ausgeben und **beenden**. (Nicht zu Schritt 4 gehen — sonst meldet der Skill fälschlich eine hinterlegte Rückfrage.)

Den Text aus dem Grund des Subagenten aus Schritt 2 ableiten. Generische Kommentare wie „unklar" sind nicht akzeptabel — die Lücken konkret benennen.

Der Endpunkt speichert den Kommentar immer als `author=HUMAN` — unabhängig davon, wer ihn aufruft.

## Schritt 3b — Feedback gut genug

Nichts weiter am Ticket tun. Kein Kommentar, keine Status- oder Owner-Änderung. Das Ticket bleibt in `DEFINITION` bei `owner=HUMAN` und wartet dort auf einen Menschen zur weiteren Verfeinerung oder Übergabe an die KI.

Weiter zu Schritt 4.

## Schritt 4 — Feedback-Task als erledigt markieren

In BEIDEN Zweigen (3a und 3b): die ursprüngliche Feedback-Aufgabe abschließen.

```bash
curl -s -X POST \
  -H "Authorization: Bearer $AGENT_API_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"comment": "Triagiert in Ticket #<newId> (Definition, Mensch). <Zusatz je nach Zweig>"}' \
  "${APP_BASE_URL:-http://localhost:7070}/api/agent-tasks/<id>/done"
```

Für `<Zusatz je nach Zweig>`:

- Nach Schritt 3a: „Rückfrage im Ticket hinterlegt."
- Nach Schritt 3b: „bereit zur Verfeinerung."

Dann **beenden**. Ein Feedback-Element pro Durchlauf.

**Kein `git push`, kein PR, kein `plan-and-do`.** Dieser Skill baut nichts — er triagiert nur.
