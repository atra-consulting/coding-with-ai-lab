# 01 — Neuen Subagenten anlegen

**Dauer:** 10 min
**Sozialform:** einzeln
**Werkzeug:** KI-Assistent (Claude Code oder Copilot CLI)
**Ziel:** Ein Subagent `requirements-reviewer` beurteilt, ob Anforderungen vollständig sind, und fragt nach, was fehlt; er liegt im Projekt und steht in der Agents-Sektion der `AGENTS.md`.

Den braucht ihr für die Skills, die ihr danach baut: Er ist die Instanz, die
in der Factory prüft, ob eine Aufgabe überhaupt baubar ist.

## Schritte

1. Deinen KI-Assistenten starten, mit mehrmaligem „Shift"-„Tab" in den
   Auto-Modus gehen (Copilot CLI: Autopilot-Modus; steht links unten) und
   mit `/model` Sonnet auswählen.
2. Subagent anlegen:
   - **Claude Code:** `/agents` aufrufen, mit „Tab" zum Library-Tab wechseln
     und dort `Create new agent`, `Project` und `Generate with Claude` wählen.
   - **Copilot CLI:** Die KI die Datei im Klartext schreiben lassen
     (Prompt 1b).
3. Claude Code: Den Prompt für den Agenten eingeben (Prompt 1a) und
   generieren lassen.
4. Claude Code: Auf dem nächsten Bildschirm `Continue`, `Opus`,
   `Automatic colors` und `Project scope` wählen und am Schluss noch einmal
   `Enter` drücken.
5. Zum Prompt zurückgehen und den Subagenten in der `AGENTS.md`
   registrieren (Prompt 2).
6. Den KI-Assistenten **beenden** und neu starten — sonst wird der neue
   Subagent eventuell nicht aktiv.

Copilot CLI liest Agents aus `.github/agents/`. Die Kopie dort entsteht
automatisch aus `.claude/agents/` (Hook). Du musst nichts kopieren.

## Folienschritte

1. KI-Assistent starten, Auto-Modus, `/model` auf Sonnet.
2. Claude Code: `/agents` → `Create new agent` → `Project` → `Generate with Claude`.
   Copilot CLI: Agent per Prompt anlegen lassen.
3. Rollenbeschreibung eingeben und generieren lassen.
4. Subagent in der `AGENTS.md` registrieren.
5. KI-Assistent beenden und neu starten.

## Prompt

**1a — Agent generieren lassen (Claude Code, im `/agents`-Dialog)**

```
requirements-reviewer Du bist ein brillanter Requirements-Analyst mit 20 Jahren Erfahrung in der Entwicklung von CRM-Systemen. Du kennst die Domäne in- und auswendig und siehst sofort, ob Anforderungen vollständig sind – und wenn nicht, was fehlt. Du weißt immer, was du fragen musst und wie du die Informationen bekommst, die du brauchst.
```

**1b — Agent anlegen lassen (Copilot CLI, normaler Prompt)**

```
Lege unter .claude/agents/requirements-reviewer.md einen Subagenten an. Modell: opus. Beschreibung: Du bist ein brillanter Requirements-Analyst mit 20 Jahren Erfahrung in der Entwicklung von CRM-Systemen. Du kennst die Domäne in- und auswendig und siehst sofort, ob Anforderungen vollständig sind – und wenn nicht, was fehlt. Du weißt immer, was du fragen musst und wie du die Informationen bekommst, die du brauchst.
```

**2 — Subagent in der `AGENTS.md` registrieren**

```
Füge @.claude/agents/requirements-reviewer.md der „Agents“-Sektion der @AGENTS.md hinzu.
```

## Abnahme

- Claude Code: `/agents` zeigt im Library-Tab jetzt
  `requirements-reviewer · opus · project memory`
- Copilot CLI: `/agent` listet `requirements-reviewer`.
- `AGENTS.md` hat in der Agents-Sektion einen Eintrag für
  `requirements-reviewer`.
