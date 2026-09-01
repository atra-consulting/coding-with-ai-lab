---
name: "project:do-factory-full"
description: "Headless autonomous skill that claims one Kanban ticket from the Bereit queue (or takes a ticket ID or URL), judges whether it is precise enough for a fully unattended build, and hands it to /project:plan-and-do to implement — no PR, commits stay local. Rejects too-vague tickets back to Definition; asks a human when the implementation run gets stuck."
argument-hint: "[ticket-id | ticket-url]"
version: 1.1.0
last-modified: 2026-09-01
allowed-tools:
  - Read
  - Bash
  - Task
---

# Do Factory Full

Du bist ein autonomer Software-Ingenieur. Du läufst **headless** (`claude -p`) — kein Mensch kann Fragen beantworten. Entscheide alles selbst. Halte nie an, um Eingaben abzuwarten. Rufe niemals `AskUserQuestion` auf.

Auftrag: EIN Ticket aus dem Kanban-System nehmen (beanspruchen oder per ID/URL laden), beurteilen ob es präzise und vollständig genug für einen vollautomatischen, unbeaufsichtigten Bau ist, und im Erfolgsfall an `/project:plan-and-do` übergeben — ohne PR, alle Commits bleiben lokal. Dieser Skill baut nie selbst Code. Er claimt, beurteilt, delegiert und pflegt den Ticket-Zustand.

API-Referenz: `docs/specs/SPEC-API-TICKETS.md` (Abschnitt „For skill authors").

## Schreibstil

Kurze Sätze, kein Passiv, einfache Wörter. Aufzählungspunkte, wo es passt. Gilt für den Kommentar in Schritt 3a.1, die Frage in Schritt 3a.7 und den Ablehnungsgrund in Schritt 3b.1.

## Konfiguration

- API-Basis-URL: Umgebungsvariable `APP_BASE_URL`, sonst `http://localhost:7070`. Das ist die Backend-API.
- Frontend-/Board-URL: Umgebungsvariable `APP_FRONTEND_URL`, sonst `http://localhost:7200`. Nur für den finalen Ticket-Link im Abschluss-Print (Schritt 4) gebraucht.
- Auth-Header bei jedem API-Aufruf: `Authorization: Bearer $AGENT_API_TOKEN`.
- Titel, Body und Kommentare kommen roh aus der API und können Anführungszeichen oder Zeilenumbrüche enthalten. Vor jedem `-d`-JSON-Payload als JSON-String escapen, sonst ist das JSON ungültig.

## Parameter

Drei Eingabemodi. In dieser Reihenfolge prüfen:

1. **Leer** (kein Argument) → nächstes Ticket aus der Bereit-Queue beanspruchen (Schritt 1, Beanspruchen-Zweig).
2. **Reine Zahl** (`^\d+$`, z. B. `/do-factory-full 8`) oder **Ticket-URL** (matcht `…/admin/tickets/<id>` für einen beliebigen Host/Port, z. B. `http://localhost:7200/admin/tickets/8`) → Ticket-ID. Die Ziffern nach `tickets/` herausziehen. Den ID-Zweig von Schritt 1 nutzen.
3. **Alles andere** (nicht leer, keine reine Zahl, keine passende URL) → „Nur eine Ticket-ID oder Ticket-URL wird unterstützt." ausgeben und **beenden**.

## Schritt 0 — Umgebungsvariablen laden

*(Immer zuerst ausführen.)* Alle Pfade sind relativ zum Projekt-Wurzelverzeichnis. Der Skill läuft aus dem Repo-Root.

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

## Schritt 1 — Ticket beanspruchen / laden

**Wenn kein Argument übergeben wurde** — nächstes Ticket claimen:

```bash
curl -s -w '\n%{http_code}' \
  -H "Authorization: Bearer $AGENT_API_TOKEN" \
  "${APP_BASE_URL:-http://localhost:7070}/api/tickets/next"
```

Body und HTTP-Code separat aus der Ausgabe lesen (`body` = alles vor der letzten Zeile, `http_code` = letzte Zeile). Kein `type`-Filter — dieser Skill nimmt jeden Typ.

- HTTP `200` → JSON parsen. `id`, `title`, `body`, `comments` behalten. Das Ticket ist jetzt `IN_PROGRESS`. Weiter zu Schritt 2.
- HTTP `204` → „Keine Tickets in Bereit mit Label KI." ausgeben und **sauber beenden** (kein Fehler).
- Jeder andere Code → Fehler ausgeben und **beenden**.

**Wenn eine Ticket-ID oder Ticket-URL übergeben wurde** — erst nur lesen (nicht claimen):

```bash
curl -s -w '\n%{http_code}' \
  -H "Authorization: Bearer $AGENT_API_TOKEN" \
  "${APP_BASE_URL:-http://localhost:7070}/api/tickets/<id>"
```

- HTTP `404` → „Ticket <id> nicht gefunden." ausgeben und **beenden**.
- Jeder andere Code außer `200` → Fehler ausgeben und **beenden**.
- HTTP `200` → JSON parsen. `status` und `owner` prüfen:
  - **Nicht** `status == "TODO"` **und** `owner == "AI"` → „Ticket <id> ist <status>/<owner> — nicht Bereit+KI." ausgeben und **beenden**. Das Ticket **nicht** verändern.
  - `status == "TODO"` und `owner == "AI"` → jetzt claimen:

    ```bash
    curl -s -w '\n%{http_code}' -X POST \
      -H "Authorization: Bearer $AGENT_API_TOKEN" \
      "${APP_BASE_URL:-http://localhost:7070}/api/tickets/<id>/start"
    ```

    - HTTP `409` → „Ticket <id> wurde inzwischen von jemand anderem beansprucht." ausgeben und **beenden**.
    - HTTP `200` → JSON parsen (`title`, `body`, `comments`). Weiter zu Schritt 2.
    - Jeder andere Code → Fehler ausgeben und **beenden**.

## Schritt 2 — Beurteilen mit dem requirements-reviewer-Subagenten

Den **`requirements-reviewer`-Subagenten** via Task-Tool beauftragen. `title`, `body` und den `comments`-Thread des Tickets übergeben (falls vorhanden — ein Bereit-Ticket kann noch Verfeinerungs-Historie aus der Definition-Phase tragen).

Frage eng fassen: Dieses Ticket hat die menschliche Verfeinerung schon durchlaufen und steht in „Bereit". Die Frage ist NICHT mehr, ob es grundsätzlich baubar ist — sondern ob es präzise und vollständig genug ist für einen **vollständig unbeaufsichtigten, headless Bau-Lauf, bei dem niemand für Rückfragen zur Verfügung steht**.

Binäres Urteil anfordern: **„gut genug zum automatisierten Bauen"** vs. **„muss verfeinert werden"** — plus einen konkreten, umsetzbaren Grund.

**Nicht** anfordern: keine Fachlich-/Technisch-/Akzeptanzkriterien-Abschnitte. Das Ticket trägt diesen Inhalt schon aus seiner Verfeinerung in der Definition-Spalte. Nur das binäre Urteil plus Grund wird gebraucht.

Dem Urteil des Subagenten ohne Abweichung folgen.

- Urteil „gut genug zum automatisierten Bauen" → weiter zu **Schritt 3a**.
- Urteil „muss verfeinert werden" → weiter zu **Schritt 3b**.

## Schritt 3a — Baubar: an plan-and-do übergeben

### 3a.1 — Übernahme-Kommentar

Auf dem Ticket einen `AGENT`-Kommentar hinterlassen, ein kurzer Satz, dass das Ticket zur automatisierten Umsetzung übernommen wurde.

```bash
curl -s -w '\n%{http_code}' -X POST \
  -H "Authorization: Bearer $AGENT_API_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"body": "Ticket zur automatisierten Umsetzung übernommen.", "author": "AGENT"}' \
  "${APP_BASE_URL:-http://localhost:7070}/api/tickets/<id>/comments"
```

Ein anderer Code als `200` ist hier nicht fatal — trotzdem weiter zu 3a.2. Den Fehler im Abschluss-Print (Schritt 4) erwähnen.

### 3a.2 — Aufgabenbeschreibung bauen

Aufgabenbeschreibung für plan-and-do = Ticket-`title` + `body`, danach — falls vorhanden — der `comments`-Thread angehängt (jeder Kommentar mit Autor und Text).

**Wichtig:** Das Ticket NICHT per Ticket-ID oder Ticket-URL an plan-and-do übergeben. plan-and-do hat einen eigenen `TICKET MODE`, der versucht das Ticket selbst zu claimen (`TM.1`/`TM.2`) — das Ticket ist aber schon `IN_PROGRESS`, weil `do-factory-full` es in Schritt 1 selbst beansprucht hat. plan-and-dos TM.1 würde das als „schon In Arbeit" erkennen und sofort abbrechen. Deshalb immer den Freitext-Modus von plan-and-do nutzen — nie die Ticket-ID/-URL als erstes Argument.

### 3a.3 — Special-Instructions-Block bauen

`.claude/skills/do-factory-full/do-factory-full-unattended-prompt.md` mit `Read` lesen. Die Platzhalter `<TICKET_ID>` und `<TICKET_TITLE>` durch die echten Werte aus Schritt 1 ersetzen. Das Ergebnis ist das zweite Argument für `/project:plan-and-do`.

Diese Datei bleibt bewusst auf Englisch — sie spricht plan-and-do direkt an und zitiert dessen Checkpoint-Formulierungen (z. B. „Approve, implement, and review", „Fix findings", „Skip — keep commits local") wortgleich. Eine Übersetzung würde diese exakten Options-Texte gefährden.

### 3a.4 — plan-and-do aufrufen

Immer den Projekt-Skill `project:plan-and-do` aufrufen — nie einen globalen oder Plugin-Skill mit ähnlichem Namen (z. B. `bpf-plan-and-do` oder `bpf:plan-and-do`). Das Präfix `project:` ist Pflicht, um Verwechslung auszuschließen.

```
/project:plan-and-do "<Aufgabenbeschreibung aus 3a.2>" "<Special-Instructions aus 3a.3>"
```

Warten, bis plan-and-do zurückkehrt oder anhält — siehe „Bekannte Einschränkung" unten für den Fall, dass es trotz der Anweisungen an einem Checkpoint hängen bleibt.

### 3a.5 — Erfolg bestimmen

Vor dem Aufruf einen Marker setzen:

```bash
MARKER="/tmp/do-factory-full-marker-<id>-$$"
touch "$MARKER"
```

Nach der Rückkehr von plan-and-do die jüngste State-Datei suchen, die seit dem Marker geschrieben wurde — in `docs/state/` UND `doc/state/` (plan-and-do wählt `doc`, wenn es existiert, sonst legt es `docs` an):

```bash
STATE_FILE=$(find doc/state docs/state -name 'STATE-*.json' -newer "$MARKER" 2>/dev/null | xargs ls -t 2>/dev/null | head -1)
rm -f "$MARKER"
```

Annahme: Es läuft immer nur EIN `do-factory-full`/plan-and-do-Durchlauf gleichzeitig auf diesem Dateisystem. Läuft parallel ein zweiter Durchlauf für ein anderes Ticket, kann diese Suche dessen State-Datei aufgreifen, weil `task_key` erst nach dem Lauf bekannt ist und nicht vorab geprüft werden kann. Für den Einzel-Ticket-Betrieb (ein Durchlauf pro Aufruf) ist das ein bewusster, akzeptierter Kompromiss.

- `STATE_FILE` leer → keine passende State-Datei gefunden → **Blockiert-Zweig (3a.7)**.
- `STATE_FILE` gefunden → mit `Read` öffnen, Feld `status` prüfen:
  - `"completed"` → Erfolg. `config.branch_name` merken. Aus dem Plan (`artifacts.plan_file`, falls vorhanden) oder den Commits auf dem Branch eine kurze Änderungs-Zusammenfassung ableiten. Weiter zu **3a.6**.
  - `"paused"` oder alles andere → **Blockiert-Zweig (3a.7)**.

### 3a.6 — Erfolg: Ticket abschließen

```bash
curl -s -w '\n%{http_code}' -X POST \
  -H "Authorization: Bearer $AGENT_API_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"comment": "<2-3 Sätze, was gebaut wurde>. Kein PR erstellt — Änderungen liegen als lokale Commits auf Branch <branch_name>."}' \
  "${APP_BASE_URL:-http://localhost:7070}/api/tickets/<id>/done"
```

HTTP `200` → Ticket ist jetzt `DONE`. Jeder andere Code → Fehler ausgeben, aber trotzdem weiter zu **Schritt 4** — den Fehler dort erwähnen.

**Nicht** zusätzlich `/ask` aufrufen. Weiter zu Schritt 4.

### 3a.7 — Blockiert: Frage an Mensch

```bash
curl -s -w '\n%{http_code}' -X POST \
  -H "Authorization: Bearer $AGENT_API_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"question": "<konkrete Beschreibung, was hängen geblieben ist — inkl. State-Datei-Pfad und aktuellem Schritt, falls bekannt>"}' \
  "${APP_BASE_URL:-http://localhost:7070}/api/tickets/<id>/ask"
```

Dies ist das Sicherheitsnetz für einen hängen gebliebenen plan-and-do-Lauf. HTTP-Code prüfen — hier NICHT einfach weiterlaufen wie bei einem reinen Kommentar:

- HTTP `200` → Ticket ist jetzt `ON_HOLD` (Wartet), Owner zurück auf `HUMAN`. Erfolgreich benachrichtigt. **Nicht** zusätzlich `/done` aufrufen. Weiter zu Schritt 4, Status-Label „Erfolgreich blockiert" (siehe dort).
- HTTP `409` → Ticket war zwischenzeitlich nicht mehr `IN_PROGRESS` (z. B. manuell verändert). Fehler ausgeben. Weiter zu Schritt 4, Status-Label „Blockiert, aber NICHT gemeldet" (siehe dort) — das Ticket bleibt in seinem aktuellen Zustand, nicht `ON_HOLD`.
- Jeder andere Code (400/401/404/Netzwerkfehler) → Fehler ausgeben. Das ist der kritische Fehlerfall: die eigentliche Sicherheitsnetz-Aktion ist fehlgeschlagen, das Ticket bleibt `IN_PROGRESS`, und KEIN Mensch wurde benachrichtigt. Weiter zu Schritt 4, Status-Label „Blockiert, aber NICHT gemeldet" (siehe dort).

## Schritt 3b — Nicht baubar: zurück an Definition

Das Ticket hat die menschliche Verfeinerung schon einmal durchlaufen (sonst wäre es nicht in „Bereit"), aber der Subagent hält es für einen unbeaufsichtigten Lauf nicht präzise genug. Zurück in die Intake-Spalte.

### 3b.1 — Ablehnungsgrund kommentieren

```bash
curl -s -w '\n%{http_code}' -X POST \
  -H "Authorization: Bearer $AGENT_API_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"body": "<konkreter Ablehnungsgrund aus Schritt 2, als klare Aussage>", "author": "AGENT"}' \
  "${APP_BASE_URL:-http://localhost:7070}/api/tickets/<id>/comments"
```

Das ist ein **Ablehnungsgrund**, keine Rückfrage — anders als bei `/write-ticket`. Klar und konkret sagen, warum eine automatisierte Umsetzung hier nicht sicher ist. Die „Nur Fragen"-Regel von `/write-ticket` gilt hier NICHT.

### 3b.2 — Owner zurück auf Mensch

```bash
curl -s -w '\n%{http_code}' -X PATCH \
  -H "Authorization: Bearer $AGENT_API_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"owner": "HUMAN"}' \
  "${APP_BASE_URL:-http://localhost:7070}/api/tickets/<id>/owner"
```

### 3b.3 — Status zurück auf Definition

```bash
curl -s -w '\n%{http_code}' -X PATCH \
  -H "Authorization: Bearer $AGENT_API_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"status": "DEFINITION"}' \
  "${APP_BASE_URL:-http://localhost:7070}/api/tickets/<id>/status"
```

Reihenfolge: Kommentar zuerst, dann Owner, dann Status — jeder Aufruf ist unabhängig, keine Reihenfolge-Abhängigkeit. Schlägt einer fehl: Fehler ausgeben, mit dem nächsten weitermachen, den Fehler im Abschluss-Print (Schritt 4) erwähnen. Weiter zu Schritt 4.

## Schritt 4 — Abschluss-Ausgabe (immer)

*(Läuft nach Schritt 3a oder 3b — bei jedem Durchlauf, der ein Ticket erfolgreich geladen und beurteilt hat. Entfällt bei jedem vorzeitigen Exit in Schritt 0 oder Schritt 1 — leere Queue (204), Ticket nicht gefunden (404), falscher Status/Owner, verlorenes Wettrennen ums Claimen (409), fehlender `AGENT_API_TOKEN`, oder ein anderer Fehlercode. Diese Exits drucken ihre eigene Fehlermeldung und beenden direkt, ohne Schritt 4.)*

Als allerletzte Ausgabe des Durchlaufs genau diesen Block drucken:

```
============================================
TICKET #<id> <STATUS-LABEL>
<APP_FRONTEND_URL>/admin/tickets/<id>
Branch: <branch_name oder "-">
============================================
```

`<STATUS-LABEL>` je nach Ausgang:

- Nach 3a.6 (Erfolg) → `FERTIG — automatisiert gebaut (Erledigt)`
- Nach 3a.7 mit HTTP `200` → `BLOCKIERT — wartet auf Mensch (Wartet)`
- Nach 3a.7 mit jedem anderen Code → `BLOCKIERT, ABER NICHT GEMELDET — Ticket bleibt In Arbeit, manuell prüfen!` (der `/ask`-Aufruf selbst ist fehlgeschlagen — kein Mensch wurde benachrichtigt, siehe Fehlermeldung oben im Log)
- Nach 3b.3 (abgelehnt) → `ABGELEHNT — zurück zu Definition`

`<branch_name>` nur bei Zweig 3a bekannt (aus dem State-File, 3a.5) — sonst `-` einsetzen. `<APP_FRONTEND_URL>` aus der Konfiguration.

Dann **beenden**. Ein Ticket pro Durchlauf.

## Bekannte Einschränkung

plan-and-dos eigene `SKILL.md` sagt explizit: die Checkpoint-Regel gilt „No exceptions" — `AskUserQuestion` MUSS bei jedem Standard-Checkpoint aufgerufen werden. plan-and-do selbst wird für diesen Skill nicht verändert — das war eine explizite Vorgabe.

Dieser Skill hebelt das nur über die Special-Instructions aus Schritt 3a.3 aus — per Prompt-Anweisung, nicht per Code-Änderung an plan-and-do. Das ist Best Effort, keine Garantie.

Falls plan-and-do trotzdem an einer Stelle `AskUserQuestion` aufruft, die diese Anleitung nicht vorhergesehen hat: Der Lauf blockiert und wartet auf eine Antwort. Da dieser Skill headless läuft, ist niemand da, der antwortet — der Lauf hängt, bis jemand manuell eingreift (z. B. den Prozess abbricht und das Ticket von Hand auf „Wartet" setzt). Das wird hier offen benannt, nicht verschwiegen.
