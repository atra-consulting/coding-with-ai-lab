# Übungsaufgabe 3: Vollautomatische Software-Factory

**Umfang:** mittel · **Bereiche:** Projekt · **Dauer:** ~20 Min

## Ziel

WIr nehmen den eben erzeugten Skill, um Aufgaben vollautomatisch abzuarbeiten – oder auch niht.

## Vorgehen

Die Anwendung mit `start.sh/start.bat` starten und als Admin einloggen. Dann unter "ADMINISTRATION" den Abschnitt "Agent-Aufgaben" anschauen. Dort gibt es drei Kategorien: Customer Emails, Application Logs und Error Reports. Jede Kategorie hat vier Aufgaben, die man mit "Aufgaben anzeigen" sehen kann. Die ersten zwei Aufgaben sind jeweils zu ungenau oder unvollständig, um implementiert zu werden. Suche Dir eine Aufgabe heraus, die implementiert werden kann, und eine, die nicht automatisch gebaut werden kann. Merke Dir die IDs von beiden

Starte Claude Code und gehe mit mehrmaligem "Shift"-"Tab" in den Auto-Modus (wird links unten angezeigt). Mit `/model` Sonnet auswählen. Dann rufe den Skill auf, den Du in Übung 2 gebaut hast, und übergib ihm die ID der nicht automatisch lösbaren Aufgabe:

```
/project:do-factory-automatic X
```

Claude Code sollte die Aufgabe nicht abarbeiten, weil sie unvollständig ist.

Dann lösche den Context mit /clear und rufe den Skill erneut auf, dieses Mal mit der ID der machbaren Aufgabe.

```
/project:do-factory-automatic Y
```

Claude Code sollte diese Aufgabe jetzt korrekt abarbeiten.

## Erwartetes Ergebnis

- Der Skill kann die erste Aufgabe nicht abarbeiten
- Der Skill kann die zweite Aufgabe abarbeiten