# Skills

Dieses Projekt hat vier eigene Skills. Sie liegen in `.claude/skills/`. Jeder Skill ist ein Ordner mit einer `SKILL.md`.

## Was ist ein Skill?

Ein Skill ist ein fester Arbeitsablauf. Du rufst ihn mit einem Schrägstrich auf: `/name`. Claude folgt dann den Schritten in der `SKILL.md`.

Ein Subagent ist ein Spezialist für eine Aufgabe. Ein Skill ist ein ganzer Prozess. Skills rufen oft mehrere Subagents nacheinander. Mehr zu Agents: [SUBAGENTS.md](SUBAGENTS.md).

## Wie rufst du einen Skill auf?

Tippe den Namen mit Schrägstrich in Claude Code:

```
/plan-and-do <Aufgabenbeschreibung>
```

Manche Skills nehmen Argumente. Manche laufen ohne. Details stehen unten.

## Die Skills

### `/plan-and-do` — von der Idee zum Review

End-to-End-Ablauf. Planung → Implementierung → Tests → Code Review.

- **Wann nutzen:** Neues Feature bauen. Aufgabe umsetzen. Schweren Bug fixen.
- **Was passiert:** Der Skill legt einen Branch an. Er schreibt bei Bedarf eine PRD. Er schreibt einen Plan. Du gibst den Plan frei. Dann baut er den Code, testet ihn und prüft ihn. Am Ende gibt es optional einen PR.
- **Argumente:** `["Beschreibung"] [Sonderanweisungen | resume:<schritt>]`
- **Beispiel:**
  ```
  /plan-and-do "Redis-Cache für Sessions" "Nutze node-cache mit 5 Minuten TTL"
  ```
- **Ohne Argument:** Der Skill sucht angefangene Aufgaben und fragt, ob du weitermachst.
- **`help` / `doctor`:** Zeigt Hilfe oder läuft einen Selbsttest.
- **Checkpoints:** Der Skill hält an festen Punkten an. Du behältst die Kontrolle.
- Datei: `.claude/skills/plan-and-do/SKILL.md`

Workshop-Teilnehmer starten ihre Aufgaben mit diesem Skill.

### `/review` — lokaler Code Review

Prüft deinen Branch gegen `main`. Mit mehreren Runden aus Prüfen und Fixen.

- **Wann nutzen:** Vor einem PR. Nach einer Änderung. Wenn du Feedback willst.
- **Was passiert:** Der Skill sammelt die Änderungen. Reviewer-Agents prüfen sie. Der Skill schreibt die Findings nach `docs/reviews/`. Du entscheidest, welche Findings du fixt.
- **Argumente (optional):**
  - leer → normaler Review
  - `dryrun` → zeigt das Ergebnis nur am Bildschirm, schreibt keine Datei
  - `base:<ref>` → prüft gegen einen anderen Branch oder Commit statt `main`
  - `help` / `doctor` → Hilfe anzeigen oder Selbsttest laufen lassen
  - freier Text → Sonderanweisungen für den Review
- **Beispiel:**
  ```
  /review Prüfe besonders die Fehlerbehandlung
  ```
- Datei: `.claude/skills/review/SKILL.md`

### `/update-claude-files` — Doku mit dem Code synchron halten

Aktualisiert `.claude/agents/`, `docs/specs/` und `CLAUDE.md`. Passend zu den Code-Änderungen.

- **Wann nutzen:** Ein Feature ist fertig. Das Schema ändert sich. Die Infrastruktur wandert.
- **Was passiert:** Reviewer-Agents vergleichen Code und Doku. Sie melden, was veraltet ist. Writer-Agents fixen genau diese Stellen. Der Skill legt keine neue Agent- oder Spec-Datei an. Er passt nur bestehende an.
- **Argumente (optional):** freier Text als Fokus, oder `embedded` (Aufruf aus `plan-and-do`).
- **Beispiel:**
  ```
  /update-claude-files Fokus auf die neue Ticket-API
  ```
- Datei: `.claude/skills/update-claude-files/SKILL.md`

### `/do-factory-automatic` — autonom, ohne Mensch

Läuft headless (`claude -p`). Kein Mensch antwortet. Der Skill entscheidet alles selbst.

- **Wann nutzen:** In CI. In einer „Software-Factory". Für unbeaufsichtigte Läufe.
- **Was passiert:** Der Skill beansprucht die nächste Agent-Task (oder eine per ID). Er beurteilt: baubar oder ablehnen? Dann lehnt er ab oder setzt sie voll um — über `plan-and-do`.
- **Argumente (optional):** `[task-id]`. Mit ID überspringt der Skill die Suche.
- **Wichtig:** Der Skill ruft nie `AskUserQuestion`. Er hält nie an. Er braucht `AGENT_API_TOKEN` in der Umgebung.
- **Beispiel:**
  ```
  /do-factory-automatic 14
  ```
- Datei: `.claude/skills/do-factory-automatic/SKILL.md`
- Hintergrund: [docs/specs/SPEC-API-TASKS.md](specs/SPEC-API-TASKS.md)

## Übernahme in dein Projekt

Willst du diese Skills in dein eigenes Projekt holen? Siehe [TRANSFER.md](TRANSFER.md).
