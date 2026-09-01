# 20 — Bugfix: Fehlerbericht → Fix → Prüfung

**Dauer:** 30 min
**Sozialform:** Paare
**Werkzeug:** Claude Code
**Voraussetzung:** Lab läuft unter `localhost:7200`
**Ziel:** Aus der Support-Meldung aus Aufgabe 04 wird ein Fehlerbericht, der dem Agenten als Spezifikation genügt.
**Ergebnis:** Ein Fix, der sich Zeile für Zeile gegen den eigenen Fehlerbericht abhaken lässt.

Die Meldung lautet: „Ich kann keine Chance mehr speichern, der Knopf ist
grau." Ihr stellt den Fehler nach, schreibt einen Fehlerbericht, den ein
Entwickler versteht — und gebt ihn statt an einen Entwickler an den Agenten.
Der Fehlerbericht ist die Spezifikation.

Zu beobachten ist: Der Knopf „Speichern" wird grau, ohne Hinweis, warum; bei
„Wahrscheinlichkeit" erscheint bei `150` dagegen eine Meldung unter dem Feld.
Sollte bei euch die Chance mit `-100` gespeichert werden, ist das ebenfalls
ein Fehler — dann lautet „Beobachtet" anders und „Erwartet" gleich: Hinweis
unter dem Feld, kein Speichern negativer Werte.

<!-- include: warnung-rechte -->

## Schritte

1. Stellt den Fehler nach: im CRM Chancen → „Neue Chance", Titel und Firma
   ausfüllen, ins Feld **Wert** `-100` eintragen.
2. Schreibt drei Zeilen auf — **Schritte · Beobachtet · Erwartet** —, das
   ist euer Fehlerbericht.
3. Startet Claude Code im Projekt-Root
   (`claude --dangerously-skip-permissions`) und gebt den Prompt ein.
4. Prüft am Plan-Checkpoint, ob der Plan die Formular-Datei der Chance und
   das Backend-Schema (`validation.ts`) nennt und nichts enthält, das ihr
   nicht bestellt habt — sonst `Edit`: „Nur den Hinweis und die
   Validierung, sonst nichts."
5. Lest am Review-Checkpoint, was der Reviewer bemängelt — ihr müsst es
   nicht verstehen, ihr müsst sehen, ob der Agent es behoben hat.
6. Prüft das Ergebnis im Browser und danach den Diff:
   `git diff main --stat`.

## Folienschritte

1. Fehler nachstellen: Wert `-100`, Speichern bleibt grau.
2. Fehlerbericht schreiben — Schritte · Beobachtet · Erwartet.
3. Claude Code starten, Prompt vom Blatt geben.
4. Plan lesen: nur Formular und Validierung?
5. Im Browser prüfen, dann `git diff main --stat`.

## Prompt

```
/plan-and-do Bugfix im Chancen-Formular. Erstelle keinen PR und pushe nicht — du hast bei
diesem Repo nicht die Rechte dazu. Schreibe keine Tests, die den Browser automatisieren,
und mache nur eine statt drei Review-Runden. Aktualisiere am Schluss auch nicht die Specs
und Subagents. Überspring die PRD und schreibe direkt einen Plan.

Fehlerbericht: Beim Anlegen einer Chance wird ins Feld „Wert" −100 eingetragen.
Beobachtet: Der Knopf „Speichern" wird grau, ohne dass ein Hinweis erscheint, warum.
Erwartet: Unter dem Feld steht ein Hinweis „Wert darf nicht negativ sein" — so wie es bei
„Wahrscheinlichkeit" bereits einen Hinweis gibt —, und der Knopf bleibt deaktiviert, bis
der Wert gültig ist. Falls das Backend negative Werte annimmt, soll es sie ebenfalls mit
einem Validierungsfehler ablehnen. Keine weiteren Änderungen.
```

## Abnahme

- Chancen-Formular: `-100` im Feld Wert → roter Hinweis unter dem Feld,
  Speichern deaktiviert; `100` → Hinweis weg, Speichern möglich.
- `git diff main --stat`: zwei bis vier geänderte Dateien, alle unter
  `frontend/src/app/features/chance/` und `backend/src/utils/`.
- Der Fehlerbericht von oben ließe sich jetzt Zeile für Zeile abhaken.

## Troubleshooting

| Problem | Lösung |
|---|---|
| Der Agent will das Formular „modernisieren" | Am Plan-Checkpoint `Edit`: nur die im Fehlerbericht genannte Änderung. |
| Änderung nicht im Browser sichtbar | Seite neu laden (`Cmd/Strg+Shift+R`); der Dev-Server lädt automatisch, der Browser cacht manchmal. |
| Hinweis erscheint auch bei leerem Feld | Zurück an den Agenten: „Ein leeres Feld ist erlaubt — der Hinweis nur bei negativen Zahlen." |
| Agent fragt, ob er Tests schreiben soll | Ja, Unit-Tests gern; nur keine Browser-Automation (dauert zu lang). |

## Diskussion

- Was hat der Fehlerbericht enthalten, das der Agent brauchte — und was
  hätte er ohne „Erwartet" getan?
- Frontend prüft, Backend prüft: warum beides?
