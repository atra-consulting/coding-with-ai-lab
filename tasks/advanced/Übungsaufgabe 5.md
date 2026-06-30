# Übungsaufgabe 5: Halbautomatische Software-Factory

**Umfang:** mittel · **Bereiche:** Projekt · **Dauer:** ~20 Min

## Ziel

WIr nehmen den eben erzeugten Skill, um Aufgaben halb-automatisch abzuarbeiten – oder auch niht.

## Vorgehen

Die Anwendung mit `start.sh/start.bat` starten und als Admin einloggen. Dann unter "ADMINISTRATION" den Abschnitt "Tickets" anschauen. Dort gibt es Tickets auf einem Kanban-Board. Der Skill soll nur auf Tickets mit dem Label "KI" arbeiten. Der Skill kann Rückfragen als Kommentare hinterlassen und dann das Ticket mit dem Label "Mensch" an einen Mensch weiterreichen. Suche Dir ein Ticket heraus, das eine Rückfrage benötigt ("Mensch"), und eines, das automatisch gebaut werden kann ("KI"). Merke Dir die IDs von beiden Tickets.

Starte Claude Code und gehe mit mehrmaligem "Shift"-"Tab" in den Auto-Modus (wird links unten angezeigt). Mit `/model` Sonnet auswählen. Dann rufe den Skill auf, den Du in Übung 4 gebaut hast, und übergib ihm die ID des Tickets, das eine Rückfrage benötigt:

```
/project:do-factory-semi-automatic X
```

Claude Code sollte das Ticket nicht abarbeiten, weil er eine Frage haben wird oder schon hat.

Dann lösche den Context mit `/clear` und rufe den Skill erneut auf, dieses Mal mit der ID der machbaren Aufgabe.

```
/project:do-factory-automatic Y
```

Claude Code sollte dieses Ticket jetzt korrekt abarbeiten.

## Erwartetes Ergebnis

- Der Skill kann die erste Aufgabe nicht abarbeiten
- Der Skill kann die zweite Aufgabe abarbeiten