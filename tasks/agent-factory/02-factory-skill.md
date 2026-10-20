# 02 — Skill für vollautomatische Software-Factory

**Dauer:** 20 min
**Sozialform:** einzeln
**Werkzeug:** KI-Assistent (Claude Code oder Copilot CLI)
**Voraussetzung:** keine — die benötigten Subagenten liegen im Lab
**Ziel:** Ein Projekt-Skill `tickets-implementieren` holt das nächste Ticket, prüft mit `ba-reviewer`, ob es baubar ist, und setzt es selbst bis zum Pull Request um; `/skills` zeigt ihn nach dem Neustart an.

Was der Skill genau tun soll, steht in
[`skill-spec-02-factory-skill.md`](skill-spec-02-factory-skill.md) — der
Prompt unten verweist darauf.

## Schritte

1. Deinen KI-Assistenten (Claude Code oder Copilot CLI) starten, mit
   mehrmaligem „Shift"-„Tab" in den Auto-Modus gehen (Copilot CLI:
   Autopilot-Modus; steht links unten).
2. Den Prompt eingeben (Prompt 1).
3. Am Checkpoint den Plan lesen und korrigieren — nicht durchklicken.
4. Den KI-Assistenten durch den Prozess laufen lassen — dabei kommen die
   Subagenten `skill-coder` und `skill-reviewer` zum Einsatz.
5. Den KI-Assistenten beenden und neu starten.

## Folienschritte

1. KI-Assistent starten, Auto-Modus.
2. Prompt aus der Aufgabe eingeben.
3. Am Checkpoint den Plan lesen, nicht durchklicken.
4. `skill-coder` und `skill-reviewer` arbeiten lassen.
5. Neu starten und `/skills` prüfen.

## Prompt

**1 — Skill bauen lassen**

```
Schreibe den /tickets-implementieren Projekt-Skill, so wie er in der Datei "@tasks/agent-factory/skill-spec-02-factory-skill.md" beschrieben ist.
```

## Abnahme

- `/skills` zeigt `tickets-implementieren` an.
