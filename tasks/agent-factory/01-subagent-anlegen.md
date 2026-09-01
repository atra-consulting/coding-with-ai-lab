# 01 — Neuen Subagenten anlegen

**Dauer:** 10 min
**Sozialform:** einzeln
**Werkzeug:** Claude Code
**Ziel:** Ein Subagent `requirements-reviewer` beurteilt, ob Anforderungen vollständig sind, und fragt nach, was fehlt.
**Ergebnis:** Der Subagent liegt im Projekt und steht in der Agents-Sektion der `CLAUDE.md`.

Den braucht ihr für die Skills, die ihr danach baut: Er ist die Instanz, die
in der Factory prüft, ob eine Aufgabe überhaupt baubar ist.

## Schritte

1. Claude Code starten, mit mehrmaligem „Shift"-„Tab" in den Auto-Modus
   gehen (steht links unten) und mit `/model` Sonnet auswählen.
2. `/agents` aufrufen, mit „Tab" zum Library-Tab wechseln und dort
   `Create new agent`, `Project` und `Generate with Claude` wählen.
3. Den Prompt für den Agenten eingeben (Prompt 1) und generieren lassen.
4. Auf dem nächsten Bildschirm `Continue`, `Opus`, `Automatic colors` und
   `Project scope` wählen und am Schluss noch einmal `Enter` drücken.
5. Zum Claude-Code-Prompt zurückgehen und den Subagenten in der
   `CLAUDE.md` registrieren (Prompt 2).
6. Claude Code **beenden** und neu starten — sonst wird der neue Subagent
   eventuell nicht aktiv.

## Folienschritte

1. Claude Code starten, Auto-Modus, `/model` auf Sonnet.
2. `/agents` → `Create new agent` → `Project` → `Generate with Claude`.
3. Rollenbeschreibung eingeben und generieren lassen.
4. Subagent in der `CLAUDE.md` registrieren.
5. Claude Code beenden und neu starten.

## Prompt

**1 — Agent generieren lassen**

```
requirements-reviewer Du bist ein brillanter Requirements-Analyst mit 20 Jahren Erfahrung in der Entwicklung von CRM-Systemen. Du kennst die Domäne in- und auswendig und siehst sofort, ob Anforderungen vollständig sind – und wenn nicht, was fehlt. Du weißt immer, was du fragen musst und wie du die Informationen bekommst, die du brauchst.
```

**2 — Subagent in der `CLAUDE.md` registrieren**

```
Füge @.claude/agents/requirements-reviewer.md der „Agents“-Sektion der @CLAUDE.md hinzu.
```

## Abnahme

- `/agents` zeigt im Library-Tab jetzt
  `requirements-reviewer · opus · project memory`
- `CLAUDE.md` hat in der Agents-Sektion einen Eintrag für
  `requirements-reviewer`.
