# 22 — Eigenes PRD an den Agenten geben

**Dauer:** 45 min
**Sozialform:** Paare
**Werkzeug:** Claude Code oder GitHub Copilot CLI
**Voraussetzung:** PRD aus Aufgabe 03 liegt seit Aufgabe 11 unter `docs/prds/PRD-FIRMA-FAVORIT.md`
**Ziel:** Der Agent setzt euer eigenes PRD durch alle Schichten um, von der Datenbank bis zur Oberfläche, und ihr nehmt jede PRD-Anforderung einzeln mit Ja oder Nein ab.

Der Bogen vom Vormittag schließt sich: Euer PRD „Firmen als Favorit markieren"
liegt im Repo. Ihr prüft am Plan-Checkpoint, ob der Agent es verstanden hat,
und am Ende, ob das Ergebnis dem PRD entspricht. Wer kein eigenes PRD hat,
nimmt das Muster-PRD — der Agent sagt Bescheid, wenn die Datei fehlt.

Der Agent braucht für ein Feature durch alle Schichten Zeit. Die Wartezeit
gehört zur Aufgabe: Während er arbeitet, schreibt ihr aus eurem PRD die
Abnahme-Checkliste, mit der ihr am Ende prüft.

**Gegenlesen (Review):** Bevor der Agent fertig ist, lässt er seine Änderung
von zweiten, spezialisierten Agenten gegenlesen — wie ein Vier-Augen-Prinzip.
`fe` steht für die Oberfläche (Frontend), `be` für den Server im Hintergrund
(Backend), `db` für die Datenbank. Ihr müsst die Einwände nicht verstehen;
ihr seht nur nach, ob der Agent sie behoben hat.

<!-- include: warnung-rechte -->

## Schritte

1. Startet den Agenten im zweiten Terminalfenster im Projektordner —
   `claude` für Claude Code, `copilot` für GitHub Copilot CLI — und gebt
   den Prompt ein.
2. Legt am Plan-Checkpoint PRD und Plan nebeneinander und prüft, ob jede
   nummerierte Anforderung eine Aufgabe findet — quer durch Datenbank,
   Server (Backend) und Oberfläche —, ob etwas aus den „Nicht-Zielen" auftaucht und
   ob der Agent eine offene Frage still entschieden hat — dann schreibt ihm,
   was fehlt, mit der Nummer der Anforderung. Passt alles: „Okay, setz um."
3. Beantwortet die Fragen, die der Agent am Plan-Checkpoint stellt;
   durchwinken heißt, dass er sie selbst entscheidet.
4. **Während der Agent umsetzt: die Abnahme-Checkliste schreiben.**
   - **Wo:** in eurer Notizdatei vom Vormittag (oder auf Papier).
   - **Woher:** aus dem Abschnitt „Anforderungen“ eures PRD — je
     Anforderung A1, A2 … eine Zeile.
   - **Wie:** Das PRD sagt, *was* gelten soll; die Checkliste sagt, *wie* ihr
     es im Browser prüft. Jede Zeile beginnt mit einer Handlung (klicken, neu
     laden, anmelden) und endet mit einer Frage, die sich mit Ja oder Nein
     beantworten lässt.
   - **Warum jetzt:** Die Liste ist fertig, bevor ihr das Ergebnis seht. So
     prüft ihr gegen euer PRD — nicht gegen das, was der Agent gebaut hat.
     Aus Anforderungen Abnahmekriterien machen ist BA-Alltag.

   | Nr. | Was ich im Browser tue | Ja / Nein |
   |---|---|---|
   | A4 | Stern füllen, Seite neu laden (`Cmd+R` bzw. `F5`): Ist er noch gefüllt? | |
   | A… | … | |
5. Lest beim Gegenlesen (Review) nur, ob unter den Befunden etwas Fachliches
   ist („Filter vergisst Zustand beim Neuladen").
6. Prüft im Browser Zeile für Zeile eurer Checkliste: Stern klicken und
   Seite neu laden, Checkbox an, Firma bearbeiten und speichern — bleibt der
   Favorit jedes Mal?
7. Seht euch die Liste der geänderten Dateien an — `git diff main --stat`
   zeigt Dateien in drei Bereichen: Datenbank (`backend/src/db`), Server
   (`backend/src/routes`) und Oberfläche (`frontend/`), dazu euer PRD aus
   Aufgabe 11. Drei Bereiche für ein Sternchen — das ist der Preis eines
   „kleinen" Features.

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

1. Lege den Branch feature/firma-favorit an, ausgehend von meinem Branch
   training-1126/<vorname-nachname> aus Aufgabe 11 — dort liegt das PRD.
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
PRD. Ändere das PRD nicht und schreibe keine eigene. Fehlt die Datei auf dem
Branch, sag es mir und hör auf.
```

## Abnahme

- [ ] Firmenliste mit Stern je Zeile, Klick schaltet um und bleibt nach Neuladen.
- [ ] Checkbox „Nur Favoriten anzeigen" filtert die Liste.
- [ ] Jede Anforderung eures PRD steht als Zeile auf eurer Abnahme-Checkliste
      und ist mit Ja oder Nein abgehakt.

## Troubleshooting

| Problem | Lösung |
|---|---|
| Agent meldet, dass das PRD fehlt | Ihr habt kein PRD aus Aufgabe 11. Sagt: „Nimm stattdessen tasks/business-consultants/material/PRD-FIRMA-FAVORIT.md." |
| Stern verschwindet nach Neuladen | Dem Agenten sagen: „Der Stern ist nach dem Neuladen wieder leer. Finde heraus, warum das Speichern nicht klappt." |
| „no such column: istFavorit" | Die Datenbank kennt den Favoriten noch nicht. Im ersten Fenster `Ctrl+C`, dann `./start.sh --reset-db` — die Datenbank wird neu aufgebaut. Achtung: Eure eigenen Einträge im CRM sind danach weg. Im Zweifel Handheben. |
| Der Agent findet die Reviewer nicht | Sagt: „Prüfe die Änderung selbst wie ein Reviewer und zeig mir die Befunde.“ |
| Agent will das PRD umschreiben oder eine eigene PRD anlegen | Stoppen mit `Esc` und sagen: „Das PRD bleibt, wie es ist — nur umsetzen." |
| Zeit läuft davon | Dem Agenten sagen: „Lass das Review weg und committe." Browser-Test reicht, der Diff kann warten. |

## Diskussion

- Was hat der Agent aus dem PRD richtig gelesen, was hat er dazugedichtet,
  was hat er zurückgefragt? Wo hättet ihr im PRD einen Satz mehr gebraucht?
- Wie viel eurer Zeit ging in Prüfen, wie viel in Warten? Und was davon
  hätte ein Entwickler im Team übernommen — und was nicht?
