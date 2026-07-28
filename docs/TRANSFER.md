# Skills und Subagents übernehmen

Diese Anleitung ist für Konferenz-Zuhörer. Du willst die Skills und Subagents aus diesem Repo in dein eigenes Projekt holen. So geht es.

## Warum das nicht nur Kopieren ist

Die Agents und Skills kennen dieses Projekt. Sie reden von Firma, Person, Chance. Sie kennen Node.js, Angular, Drizzle. Dein Projekt sieht anders aus. Also musst du sie anpassen.

Der Trick: Kopieren, dann Claude anpassen lassen, dann prüfen. Mehrmals.

## Voraussetzung

- Claude Code läuft in deinem Projekt.
- Dein Projekt ist ein Git-Repo. So siehst du jede Änderung.

## Der Prozess

### Schritt 1 — Dateien kopieren

Kopiere die Subagents und Skills in den `.claude`-Ordner deines Projekts.

```bash
mkdir -p dein-projekt/.claude
cp -r coding-with-ai-lab/.claude/agents dein-projekt/.claude/
cp -r coding-with-ai-lab/.claude/skills dein-projekt/.claude/
```

Tipp: Nimm nur, was du brauchst. Die Tooling-Agents (`python-*`, `shell-*`, `skill-*`) passen fast überall. Die CRM-Agents (`be-coder`, `fe-coder` …) musst du stark anpassen.

### Schritt 2 — Claude anpassen lassen

Starte Claude Code in deinem Projekt. Gib diesen Prompt:

```
Ich habe Subagents und Skills aus einem anderen Projekt kopiert.
Sie liegen in .claude/agents und .claude/skills.
Passe sie an dieses Projekt an: Technologie, Regeln, Ordnerstruktur,
Domänenbegriffe. Entferne, was hier nicht passt. Think hard!
```

Claude liest deinen Code. Claude ändert die Agent- und Skill-Dateien.

### Schritt 3 — Claude neu starten

Beende Claude Code. Starte es neu.

**Warum?** Claude lädt Agents, Skills und `CLAUDE.md` beim Start. Neue oder geänderte Dateien greifen erst nach einem Neustart.

### Schritt 4 — Prüfen (mindestens 3×)

Lass Claude die angepassten Dateien prüfen. Nutze `/review`. Wiederhole den Prompt. Stopp erst, wenn keine nützlichen Findings mehr kommen. Meist reichen drei Runden.

```
/review Du hast gerade diese Subagents und Skills kopiert und angepasst: ...
Prüfe, ob sie wirklich zur Technologie, zu den Regeln und zu den
Best Practices dieses Projekts passen. Think hard!
```

Nach jeder Runde: Findings anschauen. Fixen lassen. Nochmal prüfen.

### Schritt 5 — Claude neu starten

Beende Claude Code. Starte es neu. Gleicher Grund wie in Schritt 3.

### Schritt 6 — Specs und Domänen-Doku neu erstellen

Jetzt braucht dein Projekt eigene Specs. Nutze `/update-claude-files`:

```
/update-claude-files Erstelle alle Specs und die Domänen-Doku komplett neu.
Sie müssen wirklich zur Technologie, zu den Regeln und zu den
Best Practices dieses Projekts passen.
```

Claude schreibt die Specs in `docs/specs/` und passt `CLAUDE.md` an.

### Schritt 7 — Prüfen (mindestens 3×)

Wie Schritt 4. Diesmal für die Specs und die Domänen-Doku. Wiederhole. Stopp, wenn keine nützlichen Findings mehr kommen.

```
/review Du hast gerade die Specs und die Domänen-Doku für dieses Projekt
erstellt. Prüfe, ob sie wirklich zur Technologie, zu den Regeln und zu den
Best Practices dieses Projekts passen. Think hard!
```

### Schritt 8 — Claude neu starten

Beende Claude Code. Starte es neu. Fertig.

## Kurzfassung

1. Dateien nach `.claude/` kopieren.
2. Claude anpassen lassen.
3. Neu starten.
4. `/review` 3× (Agents + Skills).
5. Neu starten.
6. `/update-claude-files` (Specs + Domäne neu).
7. `/review` 3× (Specs + Domäne).
8. Neu starten.

## Danach

Teste die Skills an einer kleinen Aufgabe. Zum Beispiel `/plan-and-do "kleines Feature"`. Läuft das sauber, passt die Übernahme.

Mehr zu den Bausteinen: [SUBAGENTS.md](SUBAGENTS.md) · [SKILLS.md](SKILLS.md)
