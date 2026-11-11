# 20 — Bugfix: Fehlerbericht → Fix → Prüfung

**Dauer:** 30 min
**Sozialform:** Paare
**Werkzeug:** Claude Code oder GitHub Copilot CLI
**Voraussetzung:** Lab läuft unter `localhost:7200`
**Ziel:** Aus der Support-Meldung in den Rohnotizen von Aufgabe 01 wird ein Fehlerbericht, der dem Agenten als Spezifikation genügt, und ein Fix, der sich Zeile für Zeile gegen diesen Fehlerbericht abhaken lässt.

Die Meldung lautet: „Ich kann keine Chance mehr speichern, der Knopf ist
grau." Ihr stellt den Fehler nach, schreibt einen Fehlerbericht, den ein
Entwickler versteht — und gebt ihn statt an einen Entwickler an den Agenten.
Der Fehlerbericht ist die Spezifikation.

Zum Vergleich: Beim Feld „Wahrscheinlichkeit" erscheint bei `150` eine
Meldung unter dem Feld. So soll es auch beim Feld „Wert" sein.

**Gegenlesen (Review):** Bevor der Agent fertig ist, lässt er seine Änderung
von zweiten, spezialisierten Agenten gegenlesen — wie ein Vier-Augen-Prinzip.
`fe` steht für die Oberfläche (Frontend), `be` für den Server im Hintergrund
(Backend), `db` für die Datenbank. Ihr müsst die Einwände nicht verstehen;
ihr seht nur nach, ob der Agent sie behoben hat.

<!-- include: warnung-rechte -->

## Schritte

1. Stellt den Fehler nach: im CRM Chancen → „Neue Chance", Titel und Firma
   ausfüllen, ins Feld **Wert** `-100` eintragen.
2. Schreibt drei Zeilen auf — **Schritte · Beobachtet · Erwartet**. Das ist
   euer Fehlerbericht, und er kommt gleich in den Prompt.
3. Startet den Agenten im zweiten Terminalfenster im Projektordner —
   `claude` für Claude Code, `copilot` für GitHub Copilot CLI — und gebt
   den Prompt ein, mit eurem Fehlerbericht an der markierten Stelle.
4. Prüft am Plan-Checkpoint: Der Plan sollte zwei Stellen nennen — das
   Chancen-Formular (im Dateinamen steht `chance-form`) und die Prüfung der
   Eingaben auf dem Server (`validation.ts`). Steht noch etwas anderes drin,
   fragt: „Wozu brauchst du das?" Passt er, schreibt „Okay, setz um." —
   sonst: „Nur den Hinweis und die Prüfung, sonst nichts."
5. Lest nach dem Gegenlesen (Review), was bemängelt wurde — ihr müsst es
   nicht verstehen, ihr müsst sehen, ob der Agent es behoben hat.
6. Prüft das Ergebnis im Browser und danach den Diff:
   `git diff main --stat`.

## Folienschritte

1. Fehler nachstellen: Wert `-100`, Speichern bleibt grau.
2. Fehlerbericht schreiben — Schritte · Beobachtet · Erwartet.
3. Agent starten (`claude` oder `copilot`), Prompt vom Blatt geben.
4. Plan lesen: nur Formular und Prüfung?
5. Im Browser prüfen, dann `git diff main --stat`.

## Prompt

```
Bugfix im Chancen-Formular. So gehst du vor:

1. Lege von main aus den Branch bugfix/chance-wert an.
2. Zeig mir einen kurzen Plan: welche Dateien du änderst und warum.
   Warte dann auf mein Okay.
3. Setze nur um, was ich bestellt habe.
4. Lass die Änderung einmal von den passenden Reviewer-Subagents prüfen
   (fe-reviewer, be-reviewer, db-reviewer). Zeig mir ihre Befunde und behebe sie.
5. Committe die Änderung auf dem Branch.

Erstelle keinen PR und pushe nicht — du hast bei diesem Repo nicht die Rechte
dazu. Schreibe keine Tests, die den Browser automatisieren. Ändere keine Specs
und keine Subagents.

Fehlerbericht:
<hier euer Fehlerbericht: Schritte · Beobachtet · Erwartet>

Falls der Server negative Werte annimmt, soll er sie ebenfalls ablehnen.
Keine weiteren Änderungen.
```

Muster, falls euer Fehlerbericht nicht fertig ist:

```
Schritte: Beim Anlegen einer Chance wird ins Feld „Wert" −100 eingetragen.
Beobachtet: Der Knopf „Speichern" wird grau, ohne dass ein Hinweis erscheint, warum.
Erwartet: Unter dem Feld steht ein Hinweis „Wert darf nicht negativ sein" — so wie
bei „Wahrscheinlichkeit" —, und der Knopf bleibt grau, bis der Wert gültig ist.
```

## Abnahme

- [ ] Chancen-Formular: `-100` im Feld Wert → roter Hinweis unter dem Feld,
      Speichern grau; `100` → Hinweis weg, Speichern möglich.
- [ ] `git diff main --stat`: zwei bis vier geänderte Dateien, alle unter
      `frontend/src/app/features/chance/` und `backend/src/utils/`.
- [ ] Euer Fehlerbericht ließe sich jetzt Zeile für Zeile abhaken.

## Troubleshooting

| Problem | Lösung |
|---|---|
| Der Agent will das Formular „modernisieren" | Am Plan-Checkpoint antworten: „Nur die im Fehlerbericht genannte Änderung." |
| Änderung nicht im Browser sichtbar | Seite neu laden (`Cmd/Strg+Shift+R`); die Anwendung lädt Änderungen selbst nach, der Browser zeigt manchmal noch den alten Stand. |
| Hinweis erscheint auch bei leerem Feld | Zurück an den Agenten: „Ein leeres Feld ist erlaubt — der Hinweis nur bei negativen Zahlen." |
| Die Chance wird mit −100 sogar gespeichert | Auch ein Fehler — schreibt das unter „Beobachtet". „Erwartet" bleibt gleich. |
| Agent fragt, ob er Tests schreiben soll | Ja, kleine automatische Tests gern; keine Tests, die den Browser fernsteuern (dauert zu lange). |
| Der Agent findet die Reviewer nicht | Sagt: „Prüfe die Änderung selbst wie ein Reviewer und zeig mir die Befunde.“ |

## Diskussion

- Was hat der Fehlerbericht enthalten, das der Agent brauchte — und was
  hätte er ohne „Erwartet" getan?
- Die Oberfläche prüft, der Server prüft: warum beides?
