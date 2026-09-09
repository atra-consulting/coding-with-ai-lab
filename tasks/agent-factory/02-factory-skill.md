# 02 — Skill für vollautomatische Software-Factory

**Dauer:** 20 min
**Sozialform:** einzeln
**Werkzeug:** Claude Code
**Voraussetzung:** keine — die benötigten Subagenten liegen im Lab
**Ziel:** Ein Skill holt das nächste Ticket, prüft mit `ba-reviewer`, ob es baubar ist, und setzt es per `/plan-and-do` bis zum Pull Request um.
**Ergebnis:** Ein Projekt-Skill `tickets-implementieren`, den `/skills` nach dem Neustart anzeigt.

Was der Skill genau tun soll, steht in
[`skill-spec-02-factory-skill.md`](skill-spec-02-factory-skill.md) — der
Prompt unten verweist darauf.

## Schritte

1. Claude Code starten, mit mehrmaligem „Shift"-„Tab" in den Auto-Modus
   gehen (steht links unten).
2. Den Prompt eingeben (Prompt 1).
3. Am Checkpoint den Plan lesen und korrigieren — nicht durchklicken.
4. Claude Code durch den Prozess laufen lassen — dabei kommen die
   Subagenten `skill-coder` und `skill-reviewer` zum Einsatz.
5. Claude Code beenden und neu starten.

## Folienschritte

1. Claude Code starten, Auto-Modus.
2. Prompt aus der Aufgabe eingeben.
3. Am Checkpoint den Plan lesen, nicht durchklicken.
4. `skill-coder` und `skill-reviewer` arbeiten lassen.
5. Neu starten und `/skills` prüfen.

## Prompt

**1 — Skill bauen lassen**

```
/plan-and-do Schreibe den /tickets-implementieren Projekt-Skill, so wie er in der Datei "@tasks/agent-factory/skill-spec-02-factory-skill.md" beschrieben ist.
```

## Abnahme

- `/skills` zeigt `tickets-implementieren` an.
