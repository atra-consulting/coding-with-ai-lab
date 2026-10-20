# Skills

Dieses Projekt hat drei eigene Skills. Sie liegen in `.claude/skills/`. Jeder Skill ist ein Ordner mit einer `SKILL.md`.

**Beide Tools, dieselben Skills.** Claude Code und GitHub Copilot CLI laden die Skills aus `.claude/skills/`. Gleicher Ordner, gleiche Namen, gleicher Aufruf. Der Ordnername kommt von Claude Code — Copilot CLI liest ihn auch.

## Was ist ein Skill?

Ein Skill ist ein fester Arbeitsablauf. Du rufst ihn mit einem Schrägstrich auf: `/name`. Die KI folgt dann den Schritten in der `SKILL.md`.

Ein Subagent ist ein Spezialist für eine Aufgabe. Ein Skill ist ein ganzer Prozess. Skills rufen oft mehrere Subagents nacheinander. Mehr zu Agents: [SUBAGENTS.md](SUBAGENTS.md).

## Wie rufst du einen Skill auf?

Tippe den Namen mit Schrägstrich in Claude Code oder Copilot CLI:

```
/review Prüfe besonders die Fehlerbehandlung
```

Manche Skills nehmen Argumente. Manche laufen ohne. Details stehen unten. `/skills` zeigt alle verfügbaren Skills.

## Die Skills

### `/review` — lokaler Code Review

Prüft deinen Branch gegen `main`. Mit mehreren Runden aus Prüfen und Fixen.

- **Wann nutzen:** Vor einem PR. Nach einer Änderung. Wenn du Feedback willst.
- **Was passiert:** Der Skill sammelt die Änderungen. Reviewer-Agents prüfen sie. Der Skill schreibt die Findings nach `docs/reviews/`. Du entscheidest, welche Findings du fixt.
- **Argumente (optional):**
  - leer → normaler Review
  - `dryrun` → zeigt das Ergebnis nur am Bildschirm, schreibt keine Datei
  - `base:<ref>` → prüft gegen einen anderen Branch oder Commit statt `main`
  - `embedded` → interner Modus für Agenten-Prompts und andere Skills — überspringt die Kopfzeile und die anfängliche Bestätigungsfrage.
  - `help` / `doctor` → Hilfe anzeigen oder Selbsttest laufen lassen
  - freier Text → Sonderanweisungen für den Review
- **Beispiel:**
  ```
  /review Prüfe besonders die Fehlerbehandlung
  ```
- Datei: `.claude/skills/review/SKILL.md`

### `/update-agent-files` — Doku mit dem Code synchron halten

Aktualisiert `.claude/agents/`, `docs/specs/` und `CLAUDE.md`. Passend zu den Code-Änderungen. Früherer Name: `/update-claude-files`.

- **Wann nutzen:** Ein Feature ist fertig. Das Schema ändert sich. Die Infrastruktur wandert.
- **Was passiert:** Reviewer-Agents vergleichen Code und Doku. Sie melden, was veraltet ist. Writer-Agents fixen genau diese Stellen. Standard: Der Skill passt bestehende Dateien an. Fehlt eine Spec für einen Code-Bereich, legt er sie an. Veraltete Dateien löscht er nur nach Rückfrage. Einen neuen Agent legt er nur an, wenn du es ausdrücklich verlangst.
- **Argumente (optional):** freier Text als Fokus, oder `embedded` — interner Modus für Agenten-Prompts und andere Skills, etwa vor einem PR. Mit `embedded base:<sha>` grenzt der Lauf sich auf die Änderungen seit diesem Commit ein.
- **Beispiel:**
  ```
  /update-agent-files Fokus auf die neue Ticket-API
  ```
- Datei: `.claude/skills/update-agent-files/SKILL.md`

### `/write-ticket` — Feedback in ein neues Ticket triagieren

Läuft headless (`claude -p` bzw. `copilot -p`). Kein Mensch antwortet. Baut nie Code.

- **Wann nutzen:** In CI. Um Feedback aus der Agent-Task-Queue in ein Kanban-Ticket zu verwandeln. Oder um freien Text direkt in ein Ticket zu triagieren.
- **Was passiert:** Der Skill nimmt ein Feedback-Element (Agent-Task aus der Queue, per ID, per Task-URL, oder freier Text). Er beurteilt es selbst. Er legt immer ein neues Ticket an — Status „Definition", Owner Mensch. Ist das Feedback zu dünn, kommentiert er genau, was fehlt. Er pusht nie und öffnet nie einen PR.
- **Argumente (optional):** `[task-id | task-url | feedback-text]`. Ohne Argument beansprucht der Skill das nächste Feedback aus der Queue. Reine Zahl → Task-ID. Task-URL (z. B. `http://localhost:7200/admin/agent-tasks/23`) → Task-ID aus der URL. Sonstiger freier Text → direktes Prosa-Feedback (überspringt die Queue).
- **Wichtig:** Der Skill ruft nie `AskUserQuestion`. Er hält nie an. Er braucht `AGENT_API_TOKEN` in der Umgebung.
- **Beispiel:**
  ```
  /write-ticket 14
  /write-ticket http://localhost:7200/admin/agent-tasks/23
  /write-ticket Dark-Mode-Umschalter im Header ergänzen
  ```
- Datei: `.claude/skills/write-ticket/SKILL.md`
- Hintergrund: [docs/specs/SPEC-API-TASKS.md](specs/SPEC-API-TASKS.md) · [docs/specs/SPEC-API-TICKETS.md](specs/SPEC-API-TICKETS.md)

## Übernahme in dein Projekt

Willst du diese Skills in dein eigenes Projekt holen? Siehe [TRANSFER.md](TRANSFER.md).

## Nicht aktiv: `plan-and-do`

Der frühere End-to-End-Skill `/plan-and-do` liegt unter `resources/skills/plan-and-do/`. Dort ist er kein aktiver Skill — kein Tool lädt ihn oder ruft ihn auf. Er bleibt zum Nachlesen, etwa als Beispiel für einen großen Workflow-Skill.
