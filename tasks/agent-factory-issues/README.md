# Agent Factory — Aufgaben als GitHub-Issues

> Dieser Track demonstriert die **autonome** Abarbeitung (GitHub Claude Code,
> headless `claude -p`, PR-Automation). Er gehört zur Schulung „Agent Factory
> bauen & betreiben" ([`schulungsformate/agent-factory/konzept.md`](../../../schulungsformate/agent-factory/konzept.md)).

Diese Aufgaben werden **nicht** interaktiv mit `/plan-and-do` gelöst, sondern
als **GitHub-Issues** im Lab-Repo
[`atra-consulting/coding-with-ai-lab`](https://github.com/atra-consulting/coding-with-ai-lab/issues).
Die autonome „GitHub Claude Code" pickt sich Issues mit dem Label
**`Refinement needed`** und arbeitet sie ab — mit dem `plan-and-do`-Skill und
den Sub-Agenten aus dem Lab-Repo.

## Zwei Sorten Aufgaben

Jede Aufgabe ist absichtlich entweder **klar** oder **vage** geschnitten:

- **Klar** (`06`–`12`): eng umrissen, mit Akzeptanzkriterien und Hinweisen.
  GitHub Claude Code schafft sie in **10–15 Minuten**. Label: `Refinement needed`.
- **Likely to fail** (`01`–`05`): absichtlich zu vage oder zu groß. Hier zeigt
  sich, wo eine schlecht formulierte Aufgabe scheitert. Labels:
  `Refinement needed` **und** `Likely to fail`.

Drei der klaren Aufgaben (`07`, `09`, `11`) haben zusätzlich einen Abschnitt
**„Rückfrage erforderlich"** mit einer Entscheidung, die GitHub Claude Code nicht
allein treffen darf. Die Aufgabe weist den Agenten an, **nicht zu raten**, sondern
einen Kommentar ans Issue zu schreiben und das Label `Input needed` zu setzen.
So sieht man im Workshop, wie der Agent gezielt nachfragt. Diese Specs tragen das
Marker-Label `Will ask`.

| Datei | Titel | Sorte |
|-------|-------|-------|
| 01-firmenkarte.md | Firmen auf einer Karte anzeigen | Likely to fail |
| 02-crm-chat.md | KI-Chat fürs CRM | Likely to fail |
| 03-firmendossier.md | Firmendossier aus dem Internet | Likely to fail |
| 04-beziehungsanalyse.md | KI-Beziehungsanalyse | Likely to fail |
| 05-csv-import.md | Firmen aus Datei importieren | Likely to fail |
| 06-dark-mode.md | Dunkelmodus-Umschalter im Header | klar |
| 07-csv-export.md | CSV-Export für die Firmenliste | klar · fragt nach |
| 08-aktivitaet-icons.md | Icons für Aktivitätstypen | klar |
| 09-sidebar-counters.md | Zähler-Badges im Seitenmenü | klar · fragt nach |
| 10-phasen-badges.md | Chancen-Phase als farbiger Badge | klar |
| 11-chance-notiz.md | Notiz-Feld für Chancen | klar · fragt nach |
| 12-firma-favorit.md | Firmen als Favorit markieren | klar |

## Aufbau einer Spec-Datei

```
---
title: <Issue-Titel>
labels: Refinement needed, Likely to fail
---
<Issue-Text in Markdown>
```

`title` und `labels` stehen im Frontmatter; alles nach dem zweiten `---` wird
zum Issue-Body. Der Titel ist der Schlüssel: das Sync-Skript erkennt darüber, ob
ein Issue schon existiert.

## Issues anlegen / abgleichen

Vor jedem Workshop alle Issues gegen diese Specs prüfen und fehlende anlegen:

```bash
# Erst ansehen, was passieren würde (legt nichts an):
bash aufgaben/agent-factory/issues/sync-issues.sh --dry-run

# Dann tatsächlich anlegen:
bash aufgaben/agent-factory/issues/sync-issues.sh
```

Das Skript:

1. legt die Labels `Refinement needed`, `Likely to fail`, `Will ask` und
   `Input needed` an, falls sie fehlen,
2. holt alle **offenen** Issues des Lab-Repos,
3. legt für jede Spec ohne offenes Issue gleichen Titels ein neues an.

„Open/Ready" heißt hier: ein Issue mit gleichem Titel ist im Status `open`. Fehlt
es oder ist geschlossen, wird es neu angelegt. Das Skript ist idempotent — mehrfach
laufen lassen ist gefahrlos.

**Voraussetzung:** `gh` CLI, eingeloggt mit Zugriff auf das Lab-Repo.
