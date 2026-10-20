# Übungsaufgabe 2: Skill für vollautomatische Software-Factory

**Umfang:** mittel · **Bereiche:** Projekt · **Dauer:** ~20 Min

## Ziel

WIr brauchen einen Skill, der eingehende Daten darauf prüfen kann, ob Claude Code sie abarbeiten kann. Wenn ja, dann nutzt er /plan-and-do, um die Aufgabe zu implementieren.

## Vorgehen

Claude Code starten und mit mehrmaligem "Shift"-"Tab" in den Auto-Modus gehen (wird links unten angezeigt). Mit `/model` Sonnet auswählen. Dann diesen Prompt eingeben:

```
/plan-and-do Schreibe den /do-factory-automatic Projekt-Skill, so wie er in der
Datei ""@tasks/advanced/Skill für Übungsaufgabe 2.md" beschrieben ist. Pushe nicht auf remote and lege keinen PR an. Lies dieUmgebungsvariablen aus "backend/.env" und setzte sie, bevor der Skill die Anwendungs-APIs nutzt.
```

Claude Code läuft durch den Prozess und erstellt den Skill. Dabei kommen die  `skill-coder` und `skill-reviewer` Subagenten zum Einsatz.

Am Schluss Claude Code beendend und neu starten.

## Erwartetes Ergebnis

- `/skills` zeigt  `do-factory-automatic` an