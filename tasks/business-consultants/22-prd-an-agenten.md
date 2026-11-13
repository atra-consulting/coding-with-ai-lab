# 22 — Eigenes PRD an den Agenten geben

**Dauer:** 45 min
**Sozialform:** Paare
**Werkzeug:** Claude Code oder GitHub Copilot CLI
**Voraussetzung:** PRD aus Aufgabe 03 liegt seit Aufgabe 11 unter `docs/prds/PRD-FIRMA-FAVORIT.md`
**Ziel:** Der Agent setzt euer eigenes PRD durch alle Schichten um, von der Datenbank bis zur Oberfläche, und ihr nehmt jede PRD-Anforderung einzeln mit Ja oder Nein ab.

Der Bogen vom Vormittag schließt sich: Euer PRD „Firmen als Favorit markieren"
liegt seit Aufgabe 11 im Repo. Ihr prüft am Plan-Checkpoint, ob der Agent es
verstanden hat, und am Ende, ob das Ergebnis dem PRD entspricht. Wer kein
eigenes PRD hat, nimmt das Muster-PRD — der Agent sagt Bescheid, wenn die
Datei fehlt.

Die ersten Schritte — Prompt eingeben, Plan lesen und gegen das PRD
abgleichen — macht ihr gemeinsam mit den Trainern, danach arbeitet ihr zu
zweit allein weiter. In Aufgabe 20 wiederholt ihr denselben Ablauf ohne
Anleitung an einer kleinen Aufgabe.

Der Agent braucht für ein Feature durch alle Schichten Zeit. Die Wartezeit
gehört zur Aufgabe: Während er arbeitet, schreibt ihr aus eurem PRD die
Abnahme-Checkliste, mit der ihr am Ende prüft.

**Gegenlesen (Review):** Bevor der Agent fertig ist, lässt er seine Änderung
von zweiten, spezialisierten Agenten gegenlesen — wie ein Vier-Augen-Prinzip.
`fe` steht für die Oberfläche (Frontend), `be` für den Server im Hintergrund
(Backend), `db` für die Datenbank. Ihr müsst die Einwände nicht verstehen;
ihr seht nur nach, ob der Agent sie behoben hat.

Diese Prüf-Agenten legt der Agent nicht selbst an: Sie sind im Projekt
schon vordefiniert — für Claude Code im Ordner `.claude/agents/`, für
GitHub Copilot in `.github/agents/`. Jede Datei beschreibt eine Rolle mit
eigener Prüfliste, so wie ein Team seine Review-Regeln festschreibt. Der
Prompt ruft sie nur beim Namen auf.

<!-- include: warnung-rechte -->

## Schritte

1. **Gemeinsam: Prompt geben.** Startet den Agenten im zweiten
   Terminalfenster im Projektordner — `claude` für Claude Code, `copilot`
   für GitHub Copilot CLI — und gebt den Prompt ein. Der Prompt verbietet, das PRD
   zu ändern: Es ist euer Maßstab für die Abnahme. Ändert der Agent es,
   misst er sich an seinem eigenen Text.
2. **Gemeinsam: Plan gegen das PRD abgleichen.** Öffnet das PRD daneben —
   aus eurer Notizdatei, als Download `PRD-FIRMA-FAVORIT.md` im
   Trainingsportal oder im Nachprüf-Fenster aus Aufgabe 11 mit
   `open -a TextEdit docs/prds/PRD-FIRMA-FAVORIT.md` (Windows:
   `notepad docs/prds/PRD-FIRMA-FAVORIT.md`). Der Plan hat je Anforderung
   eine Zeile. Hakt ab, zum Beispiel in eurer Notizdatei:

   | Was ihr prüft | Ja / Nein |
   |---|---|
   | A1 steht im Plan | |
   | A2 … (je Anforderung eine Zeile) | |
   | Ein Nicht-Ziel taucht im Plan auf | |
   | Im Plan steht etwas, das ihr nicht bestellt habt | |

   Fehlt etwas oder ist zu viel drin, schreibt es dem Agenten mit der
   Nummer der Anforderung. Passt alles: „Okay, setz um."
3. **Fragen des Agenten beantworten.** Fachliche Fragen — wie etwas
   aussieht, wie es sich verhält — entscheidet ihr. Technische Rückfragen
   (zum Beispiel zu einem Datumsfeld) dürft ihr nach der Empfehlung des
   Agenten beantworten — aber bewusst, nicht durchwinken. Durchwinken heißt,
   dass er alles selbst entscheidet.
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
6. Öffnet das CRM im Browser unter <http://localhost:7200> (Kachel `admin`
   anklicken) und geht links im Menü auf **Firmen** — der Stern
   steht in der Firmenliste, nicht bei den Chancen. Ist die Seite schon offen, einmal neu
   laden (`Cmd+R` bzw. `F5`), damit ihr den neuen Stand seht. Prüft dann
   Zeile für Zeile eurer Checkliste: Stern klicken und
   Seite neu laden, Checkbox an, Firma bearbeiten und speichern — bleibt der
   Favorit jedes Mal? Neu laden zeigt, ob der Stern wirklich gespeichert ist
   und nicht nur auf dem Bildschirm leuchtet; Bearbeiten und Speichern zeigt,
   ob der Favorit dabei erhalten bleibt.
7. Seht euch die Liste der geänderten Dateien an — `git diff main --stat`
   zeigt Dateien in drei Bereichen: Datenbank (`backend/src/db`), Server
   (`backend/src/routes`) und Oberfläche (`frontend/`), dazu euer PRD aus
   Aufgabe 11. Drei Bereiche für ein Sternchen — das ist der Preis eines
   „kleinen" Features.

## Wo eure Änderung jetzt liegt

Euer PRD und das Feature, das der Agent daraus gebaut hat, liegen auf eurem
Branch — **nur auf eurem Laptop**. Auf GitHub, im gemeinsamen Projekt, sieht
sie niemand. Dorthin käme die Änderung erst mit zwei weiteren Schritten:

1. **Hochladen (Push):** Der Branch wird auf GitHub kopiert. Dafür braucht
   man Schreibrechte — deshalb sagt der Prompt dem Agenten „pushe nicht“.
2. **Pull Request:** Ihr schlagt vor, die Änderung in den freigegebenen
   Stand `main` zu übernehmen. Eine andere Person prüft sie und gibt frei.

Genau an dieser Stelle steht ihr im Projektalltag: Ihr bekommt einen Pull
Request, prüft ihn gegen euer PRD und gebt frei — oder schreibt, was fehlt.
Wie das auf GitHub aussieht, zeigen die Trainer im Rückblick.

## Folienschritte

1. Gemeinsam: Prompt geben — das PRD im Repo ist die Spezifikation.
2. Gemeinsam: PRD daneben, Plan abhaken — jede Anforderung drin, nichts extra?
3. Fragen beantworten: fachliche entscheidet ihr, technische bewusst.
4. Während der Agent arbeitet: Abnahme-Checkliste aus dem PRD schreiben.
5. Im CRM unter Firmen gegen die Checkliste prüfen: klicken, neu laden, filtern.
6. `git diff main --stat`: drei Schichten für ein Sternchen.

## Prompt

```
Firmen als Favorit markieren. So gehst du vor:

1. Lege den Branch feature/firma-favorit an, ausgehend von meinem Branch
   training-1126/<vorname-nachname> aus Aufgabe 11 — dort liegt das PRD.
2. Zeig mir einen kurzen Plan in Fachsprache: je Anforderung aus dem PRD
   (A1, A2 …) eine Zeile, was du dafür baust. Dateien nur am Rande.
   Nenne die Nicht-Ziele, die du bewusst weglässt. Wo das PRD eine Frage
   offen lässt, frag mich, statt selbst zu entscheiden. Warte dann auf
   mein Okay.
3. Setze nur um, was ich bestellt habe.
4. Lass die Änderung einmal von den passenden Reviewer-Subagents prüfen
   (fe-reviewer, be-reviewer, db-reviewer). Zeig mir ihre Befunde und behebe sie.
5. Committe die Änderung auf dem Branch.

Erstelle keinen PR und pushe nicht — du hast bei diesem Repo nicht die Rechte
dazu. Schreibe keine Tests. Ändere keine Specs
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
| Ihr seht die Änderung nicht | Richtige Seite? Links im Menü **Firmen** — nicht Chancen. Dann neu laden mit `Cmd+Shift+R` (Windows `Ctrl+F5`). |
| Der Agent will die laufende Anwendung beenden | Nein — laufen lassen. Ihr braucht sie zum Prüfen. |
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
