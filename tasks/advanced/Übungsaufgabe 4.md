# Übungsaufgabe 4: Skill für halbautomatische Software-Factory

**Umfang:** mittel · **Bereiche:** Projekt · **Dauer:** ~20 Min

## Ziel

WIr brauchen einen Skill, der Tickets abarbeiten kann. Wenn Anforderungen unklar sind, dann ruft 

## Vorgehen

Claude Code starten und mit mehrmaligem "Shift"-"Tab" in den Auto-Modus gehen (wird links unten angezeigt). Mit `/model` Sonnet auswählen. Dann diesen Prompt eingeben:

```
/plan-and-do Schreibe den /do-factory-semi-automatic Projekt-Skill, so wie er in der Datei "@tasks/advanced/Skill für Übungsaufgabe 4.md" beschrieben ist. Pushe nicht auf remote and lege keinen PR an. Lies die Umgebungsvariablen aus "backend/.env" und setzte sie, bevor der Skill die Anwendungs-APIs nutzt.
```

Claude Code läuft durch den Prozess und erstellt den Skill. Dabei kommen die  `skill-coder` und `skill-reviewer` Subagenten zum Einsatz.

Ein Neustart ist nicht nötig: `.claude/skills/` gibt es im Projekt, und der Ordner wird im Lauf beobachtet.

## Erwartetes Ergebnis

- `/skills` zeigt  `do-factory-semi-automatic` an