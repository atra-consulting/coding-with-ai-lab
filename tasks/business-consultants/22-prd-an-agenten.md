# 22 — Eigenes PRD an den Agenten geben

**Dauer:** 45 min
**Sozialform:** Paare
**Werkzeug:** Claude Code
**Voraussetzung:** PRD aus Aufgabe 02 liegt seit Aufgabe 11 unter `docs/prds/PRD-FIRMA-FAVORIT.md`
**Ziel:** Der Agent setzt euer eigenes PRD durch alle Schichten um, von der Datenbank bis zur Oberfläche.
**Ergebnis:** Ein Feature, dessen PRD-Anforderungen ihr einzeln mit Ja oder Nein abgenommen habt.

Der Bogen von Tag 1 schließt sich: Euer PRD „Firmen als Favorit markieren"
liegt im Repo. Ihr prüft am Plan-Checkpoint, ob der Agent es verstanden hat,
und am Ende, ob das Ergebnis dem PRD entspricht. Wer kein PRD im Repo hat,
nimmt das Feature aus dem Prompt unten — es ist dasselbe.

<!-- include: warnung-rechte -->

## Schritte

1. Startet Claude Code im Projekt-Root
   (`claude --dangerously-skip-permissions`) und gebt den Prompt ein.
2. Legt am Plan-Checkpoint PRD und Plan nebeneinander und prüft, ob jede
   nummerierte Anforderung eine Aufgabe findet — quer durch Datenbank,
   Backend und Oberfläche —, ob etwas aus den „Nicht-Zielen" auftaucht und
   ob der Agent eine offene Frage still entschieden hat — dann `Edit`, mit
   der Nummer der Anforderung.
3. Beantwortet die Fragen, die der Agent am Plan-Checkpoint stellt;
   durchwinken heißt, dass er sie selbst entscheidet.
4. Lest am Review-Checkpoint nur, ob unter den Befunden etwas Fachliches
   ist („Filter vergisst Zustand beim Neuladen").
5. Prüft im Browser: Stern klicken und Seite neu laden, Checkbox an, Firma
   bearbeiten und speichern — bleibt der Favorit jedes Mal?
6. Seht euch den Diff an — `git diff main --stat` zeigt Datenbank
   (`schema.ts`, Migration), Backend (`firmen.ts`, Service, Validierung)
   und Frontend (Liste, Service, Model): drei Schichten für ein Sternchen,
   das ist der Preis eines „kleinen" Features durch den ganzen Stack.

## Folienschritte

1. Prompt geben — das PRD im Repo ist die Spezifikation.
2. PRD und Plan nebeneinander: jede Anforderung drin?
3. Offene Fragen des Agenten beantworten, nicht durchwinken.
4. Stern im Browser testen: klicken, neu laden, filtern.
5. `git diff main --stat`: drei Schichten für ein Sternchen.

## Prompt

```
/plan-and-do Firmen als Favorit markieren. Erstelle keinen PR und pushe nicht — du hast bei
diesem Repo nicht die Rechte dazu. Schreibe keine Tests, die den Browser automatisieren,
und mache nur eine statt drei Review-Runden. Aktualisiere am Schluss auch nicht die Specs
und Subagents.

Die Spezifikation steht in docs/prds/PRD-FIRMA-FAVORIT.md — lies sie und behandle sie als
PRD; erzeuge keine eigene PRD, sondern gehe direkt zum Plan. Wo das PRD eine Frage offen
lässt, frag mich am Plan-Checkpoint, statt selbst zu entscheiden.

Kurzfassung für den Fall, dass die Datei fehlt: In der Firmenliste steht vor jedem Namen
ein Stern-Icon. Klick markiert die Firma als Favorit (voller Stern) oder hebt es auf
(leerer Stern). Der Status wird pro Firma gespeichert, nicht pro Benutzer. Über der Liste
steht eine Checkbox „Nur Favoriten anzeigen"; aktiv zeigt die Liste nur Favoriten.
```

## Abnahme

- Firmenliste mit Stern je Zeile, Klick schaltet um und bleibt nach Neuladen.
- Checkbox „Nur Favoriten anzeigen" filtert die Liste.
- Jede Anforderung eures PRD lässt sich mit Ja oder Nein abnehmen — und
  ihr habt es getan.

## Troubleshooting

| Problem | Lösung |
|---|---|
| Stern verschwindet nach Neuladen | Speichern schlägt fehl — Network-Tab (`F12`): welcher Status kommt auf den PATCH-Aufruf? Meldung an den Agenten weitergeben. |
| „no such column: istFavorit" | Datenbankschema alt: `./end.sh`, dann `./start.sh --reset-db` — die Datenbank wird neu aufgebaut. |
| Agent schreibt trotzdem eine eigene PRD | Am PRD-Checkpoint `Quit`, Prompt wiederholen mit „Überspring die PRD, die Datei ist die PRD". |
| Zeit läuft davon | Nach der Umsetzung `Continue` bis zum Ende; Browser-Test reicht, der Diff kann warten. |

## Diskussion

- Was hat der Agent aus dem PRD richtig gelesen, was hat er dazugedichtet,
  was hat er zurückgefragt? Wo hättet ihr im PRD einen Satz mehr gebraucht?
- Wie viel eurer Zeit ging in Prüfen, wie viel in Warten? Und was davon
  hätte ein Entwickler im Team übernommen — und was nicht?
