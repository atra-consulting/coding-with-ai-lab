# Skills und Subagents übernehmen

Diese Anleitung ist für Konferenz-Zuhörer. Du willst die Skills und Subagents aus diesem Repo in dein eigenes Projekt holen. So geht es.

## Warum das nicht nur Kopieren ist

Die Agents und Skills kennen dieses Projekt. Sie reden von Firma, Person, Chance. Sie kennen Node.js, Angular, Drizzle. Dein Projekt sieht anders aus. Also musst du sie anpassen.

Der Trick: Kopieren, dann die KI anpassen lassen, dann prüfen. Mehrmals.

## Voraussetzung

- Claude Code oder GitHub Copilot CLI läuft in deinem Projekt.
- Dein Projekt ist ein Git-Repo. So siehst du jede Änderung.

## Der Prozess

### Schritt 1 — Dateien kopieren

Kopiere die Subagents und Skills in den `.claude`-Ordner deines Projekts.

```bash
mkdir -p dein-projekt/.claude
cp -r coding-with-ai-lab/.claude/agents dein-projekt/.claude/
cp -r coding-with-ai-lab/.claude/skills dein-projekt/.claude/
```

**Für Copilot CLI** zusätzlich das Sync-Skript kopieren und die Agent-Kopien erzeugen. Beide Tools nutzen dieselben Skills aus `.claude/skills/`. Copilot CLI liest die Agents aus `.github/agents/` — das Skript erzeugt sie aus `.claude/agents/`:

```bash
mkdir -p dein-projekt/scripts
cp coding-with-ai-lab/scripts/sync-agents.mjs dein-projekt/scripts/
cd dein-projekt && node scripts/sync-agents.mjs
```

Optional die Hooks mitnehmen (`.claude/settings.json`, `.github/hooks/sync-agents.json`). Dann läuft das Skript nach jeder Agent-Änderung durch eine KI von selbst. Hast du schon eine `.claude/settings.json`? Dann nur den `hooks`-Block übernehmen, nicht die Datei überschreiben. Sonst nach jeder Änderung an `.claude/agents/` das Skript von Hand starten.

Tipp: Nimm nur, was du brauchst. Die Tooling-Agents (`python-*`, `shell-*`, `skill-*`) passen fast überall. Die CRM-Agents (`be-coder`, `fe-coder` …) musst du stark anpassen.

### Schritt 2 — Die KI anpassen lassen

Starte deinen KI-Assistenten (Claude Code oder Copilot CLI) in deinem Projekt. Gib diesen Prompt:

```
Ich habe Subagents und Skills aus einem anderen Projekt kopiert.
Sie liegen in .claude/agents und .claude/skills.
Passe sie an dieses Projekt an: Technologie, Regeln, Ordnerstruktur,
Domänenbegriffe. Entferne, was hier nicht passt. Think hard!
```

Die KI liest deinen Code. Sie ändert die Agent- und Skill-Dateien.

### Schritt 3 — KI-Assistent neu starten

Beende den KI-Assistenten. Starte ihn neu.

**Warum?** Das Tool lädt Agents, Skills und `AGENTS.md` (bzw. `CLAUDE.md`) beim Start. Neue oder geänderte Dateien greifen erst nach einem Neustart.

### Schritt 4 — Prüfen (mindestens 3×)

Lass die KI die angepassten Dateien prüfen. Nutze `/review`. Wiederhole den Prompt. Stopp erst, wenn keine nützlichen Findings mehr kommen. Meist reichen drei Runden.

```
/review Du hast gerade diese Subagents und Skills kopiert und angepasst: ...
Prüfe, ob sie wirklich zur Technologie, zu den Regeln und zu den
Best Practices dieses Projekts passen. Think hard!
```

Nach jeder Runde: Findings anschauen. Fixen lassen. Nochmal prüfen.

### Schritt 5 — KI-Assistent neu starten

Beende den KI-Assistenten. Starte ihn neu. Gleicher Grund wie in Schritt 3.

### Schritt 6 — Specs und Domänen-Doku neu erstellen

Jetzt braucht dein Projekt eigene Specs. Nutze `/update-agent-files`:

```
/update-agent-files Erstelle alle Specs und die Domänen-Doku komplett neu.
Sie müssen wirklich zur Technologie, zu den Regeln und zu den
Best Practices dieses Projekts passen.
```

Die KI schreibt die Specs in `docs/specs/` und passt `AGENTS.md` an.

### Schritt 7 — Prüfen (mindestens 3×)

Wie Schritt 4. Diesmal für die Specs und die Domänen-Doku. Wiederhole. Stopp, wenn keine nützlichen Findings mehr kommen.

```
/review Du hast gerade die Specs und die Domänen-Doku für dieses Projekt
erstellt. Prüfe, ob sie wirklich zur Technologie, zu den Regeln und zu den
Best Practices dieses Projekts passen. Think hard!
```

### Schritt 8 — KI-Assistent neu starten

Beende den KI-Assistenten. Starte ihn neu. Fertig.

## Kurzfassung

1. Dateien nach `.claude/` kopieren (Copilot CLI: plus `sync-agents.mjs`).
2. Die KI anpassen lassen.
3. Neu starten.
4. `/review` 3× (Agents + Skills).
5. Neu starten.
6. `/update-agent-files` (Specs + Domäne neu).
7. `/review` 3× (Specs + Domäne).
8. Neu starten.

## Danach

Teste die Skills an einer kleinen Änderung. Zum Beispiel `/review` auf einem Branch mit einem kleinen Feature. Läuft das sauber, passt die Übernahme.

Mehr zu den Bausteinen: [SUBAGENTS.md](SUBAGENTS.md) · [SKILLS.md](SKILLS.md)
