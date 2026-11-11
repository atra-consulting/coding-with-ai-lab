# 21 — Kleines Feature: gewichteter Pipeline-Wert

**Dauer:** 35 min
**Sozialform:** Paare
**Werkzeug:** Claude Code oder GitHub Copilot CLI
**Voraussetzung:** Lab läuft unter `localhost:7200`
**Ziel:** Neben dem Gesamtwert der Chancen-Liste steht der gewichtete Wert — Wert mal Wahrscheinlichkeit —, und die Zahl hält eurer Handrechnung stand. Davor stehen drei Entscheidungen, die ihr vor dem Prompt trefft.

Ein Feature, das aus der Fachlichkeit kommt: Über der Chancen-Liste steht
heute „Gesamtwert". Der Vertrieb will daneben den **gewichteten** Wert.
Klein im Code, aber voller Entscheidungen, die nur ihr treffen könnt — und
die trefft ihr **vor** dem Prompt.

Drei Fragen, jede mit einer Antwort in eurem Prompt: Zählt eine Chance ohne
Wahrscheinlichkeit mit 0 oder wird sie ausgelassen? Sind die Phasen GEWONNEN
und VERLOREN in der gewichteten Summe drin? Wo steht die Zahl, und mit
welchem Label? Der Prompt unten enthält eine Antwort je Frage — ändert sie,
wenn ihr anders entscheidet, aber lasst keine Frage offen.

<!-- include: warnung-rechte -->

## Schritte

1. Entscheidet die drei Fragen aus dem Vorspann und schreibt eure
   Antworten auf.
2. Passt den Prompt an eure Entscheidungen an, wenn sie von den
   vorgegebenen abweichen.
3. Startet den Agenten im zweiten Terminalfenster im Projektordner —
   `claude` für Claude Code, `copilot` für GitHub Copilot CLI — und gebt
   den Prompt ein.
4. Prüft am Plan-Checkpoint, ob drinsteht, wie mit leerer
   Wahrscheinlichkeit umgegangen wird — gibt der Plan eure Entscheidung
   anders wieder, schreibt dem Agenten, was gilt.
5. Fragt nach dem Gegenlesen (Review): „Gibt es einen automatischen Test
   für eine Chance ohne Wahrscheinlichkeit?" — das ist der Fall, der später
   kaputtgeht.
6. Macht die Rechenprobe im Browser und seht euch den Diff an:
   `git diff main --stat`.

## Folienschritte

1. Die drei Fragen entscheiden und notieren.
2. Prompt anpassen und dem Agenten geben.
3. Plan und Review lesen: eure Entscheidungen drin?
4. Rechenprobe im Browser, dann `git diff main --stat`.

## Prompt

```
Gewichteter Pipeline-Wert in der Chancen-Liste. So gehst du vor:

1. Lege von main aus den Branch feature/gewichteter-wert an.
2. Zeig mir einen kurzen Plan: welche Dateien du änderst und warum.
   Nenne darin auch, wie du mit leerer Wahrscheinlichkeit umgehst.
   Warte dann auf mein Okay.
3. Setze nur um, was ich bestellt habe.
4. Lass die Änderung einmal von den passenden Reviewer-Subagents prüfen
   (fe-reviewer, be-reviewer, db-reviewer). Zeig mir ihre Befunde und behebe sie.
5. Committe die Änderung auf dem Branch.

Erstelle keinen PR und pushe nicht — du hast bei diesem Repo nicht die Rechte
dazu. Schreibe keine Tests, die den Browser automatisieren. Ändere keine Specs
und keine Subagents.

Über der Chancen-Liste steht heute „Gesamtwert: …". Rechts daneben soll „Gewichtet: …"
stehen: die Summe aus Wert × Wahrscheinlichkeit ÷ 100 über alle geladenen Chancen.
Chancen ohne Wahrscheinlichkeit oder ohne Wert zählen mit 0. Chancen in den Phasen
GEWONNEN und VERLOREN werden bei der gewichteten Summe nicht mitgezählt, beim Gesamtwert
bleibt alles wie bisher. Formatierung wie der Gesamtwert (Euro, deutsches Zahlenformat).
Nur Frontend, keine Backend-Änderung. Schreibe einen kleinen automatischen Test
für eine Chance ohne Wahrscheinlichkeit.
```

## Abnahme

- [ ] Die Chancen-Liste zeigt „Gesamtwert: …" und „Gewichtet: …" nebeneinander.
- [ ] Rechenprobe: Notiert die Zahl bei „Gewichtet". Legt eine Chance mit Wert
      10.000 und Wahrscheinlichkeit 50 in Phase NEU an — steigt die Zahl um
      genau 5.000? Setzt die Chance dann auf GEWONNEN — fällt die Zahl wieder
      um 5.000?
- [ ] `git diff main --stat`: Änderungen nur unter
      `frontend/src/app/features/chance/chance-list/`.

## Troubleshooting

| Problem | Lösung |
|---|---|
| Summe passt nicht zur Handrechnung | Filter aktiv? Die Summe geht über die geladenen Chancen. Sonst zurück an den Agenten mit eurer Rechnung als Beispiel. |
| Agent will den Server (Backend) ändern | Am Plan-Checkpoint antworten: „Nur Frontend, die Daten sind schon da." |
| „Gewichtet" bricht in die nächste Zeile | Kosmetik — an den Agenten: „Beide Werte in einer Zeile." |
| Der Agent findet die Reviewer nicht | Sagt: „Prüfe die Änderung selbst wie ein Reviewer und zeig mir die Befunde.“ |

## Diskussion

- Welche eurer drei Entscheidungen hätte der Agent anders getroffen, wenn
  ihr sie ihm überlassen hättet? (Probiert es: Prompt ohne die Sätze zu
  Wahrscheinlichkeit und Phasen, Plan lesen, dann mit `Esc` abbrechen.)
- Gehört die gewichtete Summe eigentlich ins Frontend oder ins Backend?
