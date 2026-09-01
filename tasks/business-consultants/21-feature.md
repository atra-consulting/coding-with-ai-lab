# 21 — Kleines Feature: gewichteter Pipeline-Wert

**Dauer:** 35 min
**Sozialform:** Paare
**Werkzeug:** Claude Code
**Voraussetzung:** Lab läuft unter `localhost:7200`
**Ziel:** Neben dem Gesamtwert der Chancen-Liste steht der gewichtete Wert — Wert mal Wahrscheinlichkeit.
**Ergebnis:** Eine Zahl, die eurer Handrechnung standhält, und drei Entscheidungen, die ihr vor dem Prompt getroffen habt.

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
3. Startet Claude Code im Projekt-Root
   (`claude --dangerously-skip-permissions`) und gebt den Prompt ein.
4. Prüft am Plan-Checkpoint, ob drinsteht, wie mit leerer
   Wahrscheinlichkeit umgegangen wird — gibt der Plan eure Entscheidung
   anders wieder, dann `Edit`.
5. Achtet am Review-Checkpoint auf einen Test für „Chance ohne
   Wahrscheinlichkeit" — das ist der Fall, der später kaputtgeht.
6. Macht die Rechenprobe im Browser und seht euch den Diff an:
   `git diff main --stat`.

## Folienschritte

1. Die drei Fragen entscheiden und notieren.
2. Prompt anpassen und in `/plan-and-do` geben.
3. Plan und Review lesen: eure Entscheidungen drin?
4. Rechenprobe im Browser, dann `git diff main --stat`.

## Prompt

```
/plan-and-do Gewichteter Pipeline-Wert in der Chancen-Liste. Erstelle keinen PR und pushe
nicht — du hast bei diesem Repo nicht die Rechte dazu. Schreibe keine Tests, die den Browser
automatisieren, und mache nur eine statt drei Review-Runden. Aktualisiere am Schluss auch
nicht die Specs und Subagents. Überspring die PRD und schreibe direkt einen Plan.

Über der Chancen-Liste steht heute „Gesamtwert: …". Rechts daneben soll „Gewichtet: …"
stehen: die Summe aus Wert × Wahrscheinlichkeit ÷ 100 über alle geladenen Chancen.
Chancen ohne Wahrscheinlichkeit oder ohne Wert zählen mit 0. Chancen in den Phasen
GEWONNEN und VERLOREN werden bei der gewichteten Summe nicht mitgezählt, beim Gesamtwert
bleibt alles wie bisher. Formatierung wie der Gesamtwert (Euro, deutsches Zahlenformat).
Nur Frontend, keine Backend-Änderung.
```

## Abnahme

- Chancen-Liste zeigt „Gesamtwert: …" und „Gewichtet: …" nebeneinander.
- Rechenprobe mit den Seed-Daten: Nehmt drei Chancen aus der Liste, rechnet
  Wert × Wahrscheinlichkeit ÷ 100 von Hand — passt die Summe zur Anzeige?
  Legt eine Chance mit Wert 10.000 und Wahrscheinlichkeit 50 an: die
  gewichtete Summe steigt um 5.000.
- `git diff main --stat`: Änderungen nur unter
  `frontend/src/app/features/chance/chance-list/`.

## Troubleshooting

| Problem | Lösung |
|---|---|
| Summe passt nicht zur Handrechnung | Filter aktiv? Die Summe geht über die geladenen Chancen. Sonst zurück an den Agenten mit eurer Rechnung als Beispiel. |
| Agent will einen Backend-Endpoint bauen | Am Plan-Checkpoint `Edit`: „Nur Frontend, die Daten sind schon da." |
| „Gewichtet" bricht in die nächste Zeile | Kosmetik — an den Agenten: „Beide Werte in einer Zeile, Abstand wie im Bootstrap-Standard." |

## Diskussion

- Welche eurer drei Entscheidungen hätte der Agent anders getroffen, wenn
  ihr sie ihm überlassen hättet? (Probiert es: Prompt ohne die Sätze zu
  Wahrscheinlichkeit und Phasen, Plan lesen, dann `Quit`.)
- Gehört die gewichtete Summe eigentlich ins Frontend oder ins Backend?
