---
name: "project:do-factory-automatic"
description: "Headless autonomous skill that claims the next agent task, judges build-or-reject, then rejects or builds it fully unattended via plan-and-do. Use in CI or headless claude -p runs."
argument-hint: [task-id]
version: 1.0.0
last-modified: 2026-06-30
allowed-tools:
  - Read
  - Bash(curl:*)
  - Bash(git:*)
  - Bash(source:*)
  - Bash(set:*)
  - Bash(echo:*)
  - Task
  - Skill
---

# Do Factory Automatic

Du bist ein autonomer Software-Ingenieur. Du läufst **headless** (`claude -p`) — kein Mensch kann Fragen beantworten. Entscheide alles selbst. Halte nie an, um Eingaben abzuwarten. Rufe niemals `AskUserQuestion` auf.

Auftrag: Eine Aufgabe beanspruchen (oder direkt per ID laden), beurteilen ob sie baubar ist, und sie dann ablehnen oder vollständig umsetzen — unbeaufsichtigt.

API-Referenz: `docs/API-TASKS.md` (Abschnitt „For skill authors").

## Konfiguration

- API-Basis-URL: Umgebungsvariable `APP_BASE_URL`, sonst `http://localhost:7070`.
- Auth-Header bei jedem API-Aufruf: `Authorization: Bearer $AGENT_API_TOKEN`.
- Quellen (Prioritätsreihenfolge): `EMAIL`, `GITHUB_ISSUE`, `ERROR_REPORT`, `APP_LOG`. Mit `TASK_SOURCE` überschreibbar — dann nur diese eine Quelle.

## Parameter

Wenn der Skill mit einer Zahl aufgerufen wird (z. B. `/do-factory-automatic 14`), ist das eine Task-ID. Schritt 1 überspringen. Direkt mit dieser ID in Schritt 2 einsteigen.

## Schritt 0 — Umgebungsvariablen laden

*(Immer zuerst ausführen — auch wenn eine Task-ID übergeben wurde.)*

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

## Schritt 1 — Nächste Aufgabe beanspruchen

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

## Schritt 2 — Beurteilen: bauen oder ablehnen

*(VOR dem Schreiben von Code entscheiden.)*

Den **`requirements-reviewer`-Subagenten** via Task-Tool beauftragen. `title`, `body` und `metadata` der Aufgabe übergeben. Er beurteilt:

- Beschreibt die Aufgabe EINE klare, konkrete Änderung?
- Sind alle Fakten vorhanden, die zur Umsetzung nötig sind?
- Passt sie zu dieser CRM-Codebasis (Express/Drizzle-Backend oder Angular-Frontend)?
- Gibt es einen offensichtlich richtigen Ansatz — keine Produktentscheidung, kein Raten?

Der Subagent prüft die Aufgabe zusätzlich gegen den echten Code. Wenn das beschriebene Problem im aktuellen Code nicht existiert, ist die Aufgabe abzulehnen.

Der Subagent liefert ein klares Urteil: entweder **„gut genug zum Bauen"** oder **„ablehnen"** mit einem spezifischen, umsetzbaren Grund.

Dem Urteil des Subagenten ohne Abweichung folgen.

## Schritt 3a — Ablehnen

Aufgaben haben keinen Fragerückkanal. Wenn die Aufgabe nicht baubar ist: mit einem spezifischen, umsetzbaren Grund ablehnen, dann **beenden**. `plan-and-do` NICHT aufrufen.

```bash
curl -s -X POST \
  -H "Authorization: Bearer $AGENT_API_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"comment": "GENAU WAS FEHLT ODER UNKLAR IST, damit ein Mensch die Anfrage korrigieren kann"}' \
  "${APP_BASE_URL:-http://localhost:7070}/api/agent-tasks/<id>/reject"
```

Generische Kommentare wie „unklar" sind nicht akzeptabel. Den Grund konkret benennen.

## Schritt 3b — Bauen via plan-and-do (unbeaufsichtigt)

Den Skill aufrufen:

```
/project:plan-and-do "<der Aufgaben-Body, plus konkrete Details aus Titel/Metadata>"
```

Diese Daueranweisungen dem Aufruf voranstellen und auf JEDEN Checkpoint anwenden, ohne je anzuhalten:

> Vollständig autonom und unbeaufsichtigt ausführen. Zu keinem Zeitpunkt `AskUserQuestion` aufrufen oder auf Eingaben warten. Diese Standardantworten auf jeden Checkpoint anwenden:
> - Entscheidung zu Spezifikationen (PRD): **PRD überspringen**, direkt zum Plan.
> - Plan-Freigabe: **„Approve, implement, and review"** (kein PR).
> - Jeder Review-Befund-Checkpoint: **alle Korrekturen genehmigen**.
> - Jeder andere Checkpoint oder Auswahl: **Continue** / die empfohlene Option wählen.
> - Planungsdateien behalten. Niemals anhalten, um zu fragen. Niemals um Klärung bitten.
> - Wenn Tests oder der Build scheitern und nicht automatisch nach einem vertretbaren Versuch behoben werden können, den Build abbrechen und zu Schritt 3a übergehen (Aufgabe mit einem Kommentar ablehnen, der den Fehler erklärt), anstatt zu hängen.

`plan-and-do` bis zur Fertigstellung laufen lassen (umsetzen → testen → reviewen). **Keinen PR erstellen. Nichts pushen.**

## Schritt 4 — Aufgabe als erledigt markieren

**Anpassung:** Der Skill erstellt keinen PR (Benutzeranforderung: kein Push, kein PR). Der Done-Kommentar enthält daher eine kurze Zusammenfassung des Gebauten plus den Branch-Namen — keinen PR-Link.

```bash
curl -s -X POST \
  -H "Authorization: Bearer $AGENT_API_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"comment": "KURZE ZUSAMMENFASSUNG WAS GEBAUT WURDE + branch: <branch-name>"}' \
  "${APP_BASE_URL:-http://localhost:7070}/api/agent-tasks/<id>/done"
```

Dann **beenden**. Eine Aufgabe pro Durchlauf.
