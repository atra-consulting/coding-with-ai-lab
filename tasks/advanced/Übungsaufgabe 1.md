# Übungsaufgabe 1: Neuen Subagenten Anlegen

**Umfang:** gering · **Bereiche:** Projekt · **Dauer:** ~10 Min

## Ziel

Für die zu erstellenden Skills brauchen wir einen Subagenten, der beurteilen kann, ob die Requirements vollständig sind – und nachfragen kann, was fehlt.

## Vorgehen

Claude Code starten und mit mehrmaligem "Shift"-"Tab" in den Auto-Modus gehen (wird links unten angezeigt). Mit `/model` Sonnet auswählen. Dann Claude Code die Datei schreiben lassen — beschreibe den Subagenten und sage, wohin er soll:

```
Lege unter .claude/agents/requirements-reviewer.md einen Subagenten an. Beschreibung: Du bist ein brillanter Requirements-Analyst mit 20 Jahren Erfahrung in der Entwicklung von CRM-Systemen. Du kennst die Domäne in- und auswendig und siehst sofort, ob Anforderungen vollständig sind – und wenn nicht, was fehlt. Du weißt immer, was du fragen musst und wie du die Informationen bekommst, die du brauchst.
```

Claude Code schreibt die Datei. Danach den Eintrag in der Übersicht ergänzen:

```
Füge @.claude/agents/requirements-reviewer.md der "Agents"-Sektion der @CLAUDE.md hinzu.
```

Die Agents-Tabelle in der `CLAUDE.md` ist ein Inhaltsverzeichnis für Menschen, keine Anmeldung — gefunden wird der Subagent über den Ordner. Zum Schluss einmal zur Probe laufen lassen:

```
Lass den requirements-reviewer diese Anforderung prüfen: "Der Nutzer soll Firmen als Favorit markieren können."
```

**Kein Neustart nötig.** Claude Code beobachtet `.claude/agents/` im Lauf. Nur wer das Verzeichnis überhaupt erst anlegt, muss einmal neu starten — hier gibt es den Ordner bereits.

## Erwartetes Ergebnis

- `.claude/agents/requirements-reviewer.md` liegt im Projekt und hat einen Frontmatter mit `name`, `description` und `tools`.
- Der Probelauf zeigt im Terminal, dass `requirements-reviewer` übernimmt — und er nennt mindestens eine Lücke in der Anforderung.
- `CLAUDE.md` hat in der Agents-Sektion einen Eintrag für `requirements-reviewer`.