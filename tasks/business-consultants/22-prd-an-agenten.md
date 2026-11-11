# 22 — Eigenes PRD an den Agenten geben

**Dauer:** 45 min
**Sozialform:** Paare
**Werkzeug:** Claude Code oder GitHub Copilot CLI
**Voraussetzung:** PRD aus Aufgabe 03 liegt seit Aufgabe 11 unter `docs/prds/PRD-FIRMA-FAVORIT.md`
**Ziel:** Der Agent setzt euer eigenes PRD durch alle Schichten um, von der Datenbank bis zur Oberfläche, und ihr nehmt jede PRD-Anforderung einzeln mit Ja oder Nein ab.

Der Bogen von Tag 1 schließt sich: Euer PRD „Firmen als Favorit markieren"
liegt im Repo. Ihr prüft am Plan-Checkpoint, ob der Agent es verstanden hat,
und am Ende, ob das Ergebnis dem PRD entspricht. Wer kein PRD im Repo hat,
nimmt das Muster-PRD aus Aufgabe 03 oder das Feature aus dem Prompt unten —
es ist dasselbe.

Der Agent braucht für ein Feature durch alle Schichten Zeit. Die Wartezeit
gehört zur Aufgabe: Während er arbeitet, schreibt ihr aus eurem PRD die
Abnahme-Checkliste, mit der ihr am Ende prüft.

<!-- include: warnung-rechte -->

## Schritte

1. Startet den Agenten im zweiten Terminalfenster im Projektordner —
   `claude` für Claude Code, `copilot` für GitHub Copilot CLI — und gebt
   den Prompt ein.
2. Legt am Plan-Checkpoint PRD und Plan nebeneinander und prüft, ob jede
   nummerierte Anforderung eine Aufgabe findet — quer durch Datenbank,
   Backend und Oberfläche —, ob etwas aus den „Nicht-Zielen" auftaucht und
   ob der Agent eine offene Frage still entschieden hat — dann schreibt ihm,
   was fehlt, mit der Nummer der Anforderung. Passt alles: „Okay, setz um."
3. Beantwortet die Fragen, die der Agent am Plan-Checkpoint stellt;
   durchwinken heißt, dass er sie selbst entscheidet.
4. Während der Agent umsetzt: Schreibt die Abnahme-Checkliste — je
   nummerierter Anforderung aus dem PRD eine Zeile, die sich im Browser mit
   Ja oder Nein prüfen lässt („Klick auf den leeren Stern füllt ihn").
5. Lest beim Review nur, ob unter den Befunden etwas Fachliches
   ist („Filter vergisst Zustand beim Neuladen").
6. Prüft im Browser Zeile für Zeile eurer Checkliste: Stern klicken und
   Seite neu laden, Checkbox an, Firma bearbeiten und speichern — bleibt der
   Favorit jedes Mal?
7. Seht euch den Diff an — `git diff main --stat` zeigt Datenbank
   (`schema.ts`, Migration), Backend (`firmen.ts`, Service, Validierung)
   und Frontend (Liste, Service, Model): drei Schichten für ein Sternchen,
   das ist der Preis eines „kleinen" Features durch den ganzen Stack.

## Folienschritte

1. Prompt geben — das PRD im Repo ist die Spezifikation.
2. PRD und Plan nebeneinander: jede Anforderung drin?
3. Offene Fragen des Agenten beantworten, nicht durchwinken.
4. Während der Agent arbeitet: Abnahme-Checkliste aus dem PRD schreiben.
5. Stern im Browser gegen die Checkliste testen: klicken, neu laden, filtern.
6. `git diff main --stat`: drei Schichten für ein Sternchen.

## Prompt

```
Firmen als Favorit markieren. So gehst du vor:

1. Lege den Branch feature/firma-favorit an, ausgehend von dem Branch, auf dem
   ich gerade bin — dort liegt das PRD.
2. Zeig mir einen kurzen Plan: welche Dateien du änderst und warum.
   Wo das PRD eine Frage offen lässt, frag mich, statt selbst zu
   entscheiden. Warte dann auf mein Okay.
3. Setze nur um, was ich bestellt habe.
4. Lass die Änderung einmal von den passenden Reviewer-Subagents prüfen
   (fe-reviewer, be-reviewer, db-reviewer). Zeig mir ihre Befunde und behebe sie.
5. Committe die Änderung auf dem Branch.

Erstelle keinen PR und pushe nicht — du hast bei diesem Repo nicht die Rechte
dazu. Schreibe keine Tests, die den Browser automatisieren. Ändere keine Specs
und keine Subagents.

Die Spezifikation steht in docs/prds/PRD-FIRMA-FAVORIT.md — lies sie und behandle sie als
PRD. Ändere das PRD nicht und schreibe keine eigene.

Kurzfassung für den Fall, dass die Datei fehlt: In der Firmenliste steht vor jedem Namen
ein Stern-Icon. Klick markiert die Firma als Favorit (voller Stern) oder hebt es auf
(leerer Stern). Der Status wird pro Firma gespeichert, nicht pro Benutzer. Über der Liste
steht eine Checkbox „Nur Favoriten anzeigen"; aktiv zeigt die Liste nur Favoriten.
```

## Abnahme

- Firmenliste mit Stern je Zeile, Klick schaltet um und bleibt nach Neuladen.
- Checkbox „Nur Favoriten anzeigen" filtert die Liste.
- Jede Anforderung eures PRD steht als Zeile auf eurer Abnahme-Checkliste
  und ist mit Ja oder Nein abgehakt.

## Troubleshooting

| Problem | Lösung |
|---|---|
| Stern verschwindet nach Neuladen | Speichern schlägt fehl — Network-Tab (`F12`): welcher Status kommt auf den PATCH-Aufruf? Meldung an den Agenten weitergeben. |
| „no such column: istFavorit" | Datenbankschema alt: `./end.sh`, dann `./start.sh --reset-db` — die Datenbank wird neu aufgebaut. |
| Agent will das PRD umschreiben oder eine eigene PRD anlegen | Stoppen mit `Esc` und sagen: „Das PRD bleibt, wie es ist — nur umsetzen." |
| Zeit läuft davon | Dem Agenten sagen: „Lass das Review weg und committe." Browser-Test reicht, der Diff kann warten. |

## Diskussion

- Was hat der Agent aus dem PRD richtig gelesen, was hat er dazugedichtet,
  was hat er zurückgefragt? Wo hättet ihr im PRD einen Satz mehr gebraucht?
- Wie viel eurer Zeit ging in Prüfen, wie viel in Warten? Und was davon
  hätte ein Entwickler im Team übernommen — und was nicht?
