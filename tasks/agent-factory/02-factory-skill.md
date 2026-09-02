# 02 — Skill für vollautomatische Software-Factory

**Dauer:** 20 min
**Sozialform:** einzeln
**Werkzeug:** Claude Code
**Voraussetzung:** Subagent `requirements-reviewer` aus Aufgabe 01
**Ziel:** Ein Skill holt das nächste Ticket, prüft mit `requirements-reviewer`, ob es baubar ist, und setzt es per `/plan-and-do` bis zum Pull Request um.
**Ergebnis:** Ein Projekt-Skill `do-factory-full`, den `/skills` nach dem Neustart anzeigt.

Was der Skill genau tun soll, steht in
[`skill-spec-02-factory-skill.md`](skill-spec-02-factory-skill.md) — der
Prompt unten verweist darauf.

## Schritte

1. Claude Code starten, mit mehrmaligem „Shift"-„Tab" in den Auto-Modus
   gehen (steht links unten) und mit `/model` Sonnet auswählen.
2. Den Prompt eingeben (Prompt 1).
3. Am Checkpoint den Plan lesen und korrigieren — nicht durchklicken.
4. Claude Code durch den Prozess laufen lassen — dabei kommen die
   Subagenten `skill-coder` und `skill-reviewer` zum Einsatz.
5. Claude Code beenden und neu starten.

## Folienschritte

1. Claude Code starten, Auto-Modus, `/model` auf Sonnet.
2. Prompt aus der Aufgabe eingeben.
3. Am Checkpoint den Plan lesen, nicht durchklicken.
4. `skill-coder` und `skill-reviewer` arbeiten lassen.
5. Neu starten und `/skills` prüfen.

## Prompt

**1 — Skill bauen lassen**

```
/plan-and-do Schreibe den /do-factory-full Projekt-Skill, so wie er in der Datei "@tasks/agent-factory/skill-spec-02-factory-skill.md" beschrieben ist.
```

## Abnahme

- `/skills` zeigt `do-factory-full` an.
