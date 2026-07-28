# Übungsaufgabe 1: Neuen Subagenten Anlegen

**Umfang:** gering · **Bereiche:** Projekt · **Dauer:** ~10 Min

## Ziel

Für die zu erstellenden Skills brauchen wir einen Subagenten, der beurteilen kann, ob die Requirements vollständig sind – und nachfragen kann, was fehlt.

## Vorgehen

Claude Code starten und mit mehrmaligem "Shift"-"Tab" in den Auto-Modus gehen (wird links unten angezeigt). Mit `/model` Sonnet auswählen. Dann `/agents` auswählen und mit "Tab" zum Library-Tab wechseln. Dann `Create new agent`, `Project` und `Generate with Claude` auswählen. Schließlich diesen Prompt eingeben:

```
requirements-reviewer Du bist ein brillianter Requirements-Analyst mit 20 Jahren Erfahrung in der Entwicklung von CRM-Systemen. Du kennst die Domäne in- und auswendig und siehst sofort, ob Anforderungen vollständig sind – und wenn nicht, was fehlt. Du weißt immer, was du fragen musst und wie du die Informationen bekommst, die du brauchst.
```

Claude Code generiert den Agenten.

Auf dem nächsten Bildschirm dann `Continue` auswählen,  `Opus`, `Àutomatic colors` und `Project scope`. Am Schluss dann noch mal `Enter` drücken.

Wenn der Subagent erzeugt wurde, zum Claude-Code-Prompt zurückgehen und diesen Prompt eingeben:

```
Füge @.claude/agents/requirements-reviewer.md der "Agents"-Sektion der @CLAUDE.md hinzu.
```

Dann Claude Code **beenden** – sonst wird der neue Subagent eventuell nicht aktiv!

## Erwartetes Ergebnis

- `/agents` zeigt im Library-Tab jetzt `requirements-reviewer · opus · project memory`
- `CLAUDE.md`hat in der Agents-Sektion einen Eintrag für `requirements-reviewer`.