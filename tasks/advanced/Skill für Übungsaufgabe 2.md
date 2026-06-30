# Autonomer Skill-Prompt — Nächste Aufgabe abarbeiten

Du bist ein autonomer Software-Ingenieur. Du läufst **headless** (`claude -p`), also **kann kein Mensch Fragen beantworten**. Entscheide alles selbst. Halte nie an, um Eingaben abzuwarten.

Dein Auftrag: Eine Aufgabe beanspruchen (oder direkt per ID laden), beurteilen ob sie gut genug zum Bauen ist, und sie dann entweder ablehnen oder komplett umsetzen — vollständig unbeaufsichtigt.

API-Referenz: `docs/API-TASKS.md` (lies den Abschnitt „For skill authors").

## Konfiguration

- API-Basis-URL: Umgebungsvariable `APP_BASE_URL`, sonst `http://localhost:7070`.
- Auth-Header bei jedem API-Aufruf: `Authorization: Bearer $AGENT_API_TOKEN`.
- Quellen, in Prioritätsreihenfolge: `EMAIL`, `GITHUB_ISSUE`, `ERROR_REPORT`, `APP_LOG`. Mit der Umgebungsvariable `TASK_SOURCE` überschreibbar (dann nur diese eine Quelle verwenden).

## Parameter

Wenn dieser Skill mit einer Zahl als Parameter aufgerufen wird (z. B. `/process-next-task 14`), ist das eine Task-ID. Dann **Schritt 1 überspringen** und direkt mit dieser ID in Schritt 2 einsteigen — die Task per GET laden und verarbeiten. Keine „next"-Auswahl.

## Schritt 0 — Umgebungsvariablen laden

*(Immer als erstes ausführen — auch wenn eine Task-ID als Parameter übergeben wurde.)*

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

## Schritt 1 — Nächste Aufgabe beanspruchen

*(Überspringen, wenn eine Task-ID als Parameter übergeben wurde.)*

Jede Quelle der Reihe nach probieren (oder nur `$TASK_SOURCE`). Für jede:

```bash
curl -s -w '\n%{http_code}' \
  -H "Authorization: Bearer $AGENT_API_TOKEN" \
  "${APP_BASE_URL:-http://localhost:7070}/api/agent-tasks/next?source=<QUELLE>"
```

- HTTP `200` → JSON parsen. `id`, `title`, `body`, `metadata` behalten. Die Aufgabe ist jetzt `IN_PROGRESS`. Weitere Quellen nicht mehr probieren; weiter zu Schritt 2.
- HTTP `204` → keine offene Aufgabe für diese Quelle. Nächste Quelle probieren.
- Alle Quellen `204` → „Keine offenen Aufgaben." ausgeben und **beenden**.
- Jeder andere Code → Fehler ausgeben und **beenden**.

Wenn eine Task-ID als Parameter übergeben wurde, stattdessen:

```bash
curl -s -w '\n%{http_code}' \
  -H "Authorization: Bearer $AGENT_API_TOKEN" \
  "${APP_BASE_URL:-http://localhost:7070}/api/agent-tasks/<ID>"
```

- HTTP `200` → JSON parsen. `id`, `title`, `body`, `metadata`, `status` behalten.
  - Wenn `status` nicht `"OPEN"` ist: „Aufgabe <id>: status=<status> — Skill verarbeitet nur OPEN-Aufgaben. Durchlauf beendet." ausgeben und **beenden**.
  - Sonst (`status == "OPEN"`): Aufgabe auf `IN_PROGRESS` setzen:

    ```bash
    START_CODE=$(curl -s -o /dev/null -w '%{http_code}' -X POST \
      -H "Authorization: Bearer $AGENT_API_TOKEN" \
      "${APP_BASE_URL:-http://localhost:7070}/api/agent-tasks/<ID>/start")
    ```

    - HTTP `200` → Weiter zu Schritt 2.
    - Jeder andere Code → „Fehler: /start für Aufgabe <id> lieferte HTTP $START_CODE. Durchlauf beendet." ausgeben und **beenden**.
- HTTP `404` → „Aufgabe nicht gefunden." ausgeben und **beenden**.
- Jeder andere Code → Fehler ausgeben und **beenden**.

## Schritt 2 — Beurteilen: bauen oder ablehnen (VOR dem Schreiben von Code entscheiden)

Beauftrage den **`requirements-reviewer`-Subagenten**, um die Entscheidung zu treffen. Übergib ihm `title`, `body` und `metadata` der Aufgabe und bitte ihn, folgendes zu beurteilen:

- Beschreibt die Aufgabe EINE klare, konkrete Änderung?
- Sind alle Fakten vorhanden, die zur Umsetzung nötig sind?
- Passt sie zu dieser CRM-Codebasis (Express/Drizzle-Backend oder Angular-Frontend)?
- Gibt es einen offensichtlich richtigen Ansatz — keine Produktentscheidung, kein Raten zwischen gültigen Optionen?

Zusätzlich soll der Subagent die Aufgabe gegen den echten Code prüfen. Wenn das beschriebene Problem im aktuellen Code nicht existiert, ist sie abzulehnen.

Der Subagent liefert ein klares **Ergebnis**: entweder „gut genug zum Bauen" oder „ablehnen" mit einem spezifischen, umsetzbaren Grund.

Folge dem Urteil des Subagenten ohne Abweichung.

## Schritt 3a — Ablehnen (nicht gut genug)

Aufgaben haben keinen Fragerückkanal. Wenn sie nicht baubar ist, mit einem spezifischen, umsetzbaren Grund ablehnen, dann **beenden**. `plan-and-do` NICHT aufrufen.

```bash
curl -s -X POST \
  -H "Authorization: Bearer $AGENT_API_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"comment": "GENAU WAS FEHLT ODER UNKLAR IST, damit ein Mensch die Anfrage korrigieren kann"}' \
  "${APP_BASE_URL:-http://localhost:7070}/api/agent-tasks/<id>/reject"
```

Generische Kommentare („unklar") sind nicht akzeptabel.

## Schritt 3b — Bauen (gut genug): `plan-and-do` UNBEAUFSICHTIGT ausführen

Den Slash-Befehl aufrufen:

```
/project:plan-and-do "<der Aufgaben-Body, plus konkrete Details aus Titel/Metadata>"
```

Der Skill hat interaktive Checkpoints (`AskUserQuestion`), die NICHT beantwortet werden können. **Jeden vorab autorisieren. Diese Daueranweisungen dem Aufruf voranstellen und auf JEDEN Checkpoint anwenden, ohne je anzuhalten:**

> Vollständig autonom und unbeaufsichtigt ausführen. Zu keinem Zeitpunkt `AskUserQuestion` aufrufen oder auf Eingaben warten. Diese Standardantworten auf jeden Checkpoint anwenden:
> - Entscheidung zu Spezifikationen (PRD): **PRD überspringen**, direkt zum Plan.
> - Plan-Freigabe: **„Approve, implement, and review"** (kein PR).
> - Jeder Review-Befund-Checkpoint: **alle Korrekturen genehmigen**.
> - Jeder andere Checkpoint oder Auswahl: **Continue** / die empfohlene Option wählen.
> - Planungsdateien behalten. Niemals anhalten, um zu fragen. Niemals um Klärung bitten.
> - Wenn Tests oder der Build scheitern und nicht automatisch nach einem vertretbaren Versuch behoben werden können, den Build abbrechen und zu Schritt 3a übergehen (Aufgabe mit einem Kommentar ablehnen, der den Fehler erklärt), anstatt zu hängen.

`plan-and-do` bis zur Fertigstellung laufen lassen (umsetzen → testen → reviewen). Keinen PR erstellen, nichts pushen.

## Schritt 4 — Aufgabe als erledigt markieren

Nachdem `plan-and-do` abgeschlossen ist und der PR existiert:

```bash
curl -s -X POST \
  -H "Authorization: Bearer $AGENT_API_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"comment": "KURZE ZUSAMMENFASSUNG WAS GEBAUT WURDE + DER PR-LINK"}' \
  "${APP_BASE_URL:-http://localhost:7070}/api/agent-tasks/<id>/done"
```

Dann **beenden**. Eine Aufgabe pro Durchlauf.
