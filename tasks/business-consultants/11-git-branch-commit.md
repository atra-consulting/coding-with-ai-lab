# 11 — Branch und Commit mit dem Agenten, nachsehen in VS Code

**Dauer:** 25 min
**Sozialform:** Paare
**Werkzeug:** Claude Code oder GitHub Copilot CLI, VS Code, Browser
**Voraussetzung:** Aufgabe 10 erledigt: Lab läuft, VS Code ist mit dem Projektordner offen, euer Agent (`claude` oder `copilot`) hat dort geantwortet
**Ziel:** Der Agent legt euren Branch an, schreibt euer PRD als Commit fest und meldet, was er getan hat — ihr prüft seine Meldung in VS Code nach: zwei eigene Commits auf eurem Branch, das PRD unter `docs/prds/`, die geänderte Zeile in der Vergleichsansicht.

So arbeiten Business Consultants mit Git: Die Befehle tippt der Agent, ihr
gebt den Auftrag und prüft das Ergebnis — wie in Aufgabe 10: Der Agent sagt,
was er getan hat, ihr seht in VS Code nach, ob es stimmt. Dafür müsst ihr
wissen, wo ihr nachseht — welcher Branch, welcher Commit, welche Datei,
welche Zeile.

Die Änderung ist echt: Euer PRD aus Aufgabe 03 kommt als Datei ins Repo,
dort, wo das Lab seine PRDs ablegt. Der Agent liest sie im Lab.

Arbeitet zu zweit, aber jede Person an ihrem eigenen Rechner — Branch und PRD
braucht ihr beide für Aufgabe 22. Erst macht Person A die Schritte 2 bis 4,
Person B liest die Befehle mit und sagt, was sie in VS Code erwartet. Dann
macht B dieselben Schritte an ihrem Rechner, und A liest mit.

## Schritte

1. **VS Code ansehen.** VS Code ist aus Aufgabe 10 mit dem Ordner
   `coding-with-ai-lab` offen (sonst: Datei › Ordner öffnen). Klickt links auf
   **Quellcodeverwaltung** (das
   Symbol mit den verzweigten Linien, `Ctrl+Shift+G`). Unten seht ihr den
   **Graph** mit den bisherigen Commits; unten links in der Statusleiste steht
   der aktuelle Branch: `main`.
2. **Dem Agenten den Auftrag geben.** Startet im zweiten Terminal im
   Projektordner `claude` oder `copilot` und gebt den Prompt unten ein — mit eurem Namen und eurem PRD aus
   Aufgabe 03. Wer kein PRD hat, nimmt den zweiten Prompt mit dem Muster-PRD.
   Lest mit, welche Befehle der Agent ausführt: Ihr kennt sie von der Folie.
   Copilot fragt vor jedem neuen Befehl nach — lest ihn, bevor ihr
   zustimmt.
3. **Nachprüfen in VS Code.** Der Agent hat am Ende drei Angaben gemacht:
   Branch, Ablageort, Commit-Nachricht. Stimmen sie? Notiert für jede: stimmt
   · stimmt nicht.
   - Statusleiste: Auf welchem Branch seid ihr jetzt?
   - Explorer: Wo liegt `PRD-FIRMA-FAVORIT.md`?
   - Graph: Welcher Commit ist neu — mit welcher Nachricht, von wem, wann?
   - Klickt auf den Commit und dann auf die Datei: Die Vergleichsansicht zeigt
     grün, was neu ist.
4. **Eine Änderung vor dem Commit ansehen.** Sagt dem Agenten: „Ändere im PRD einen
   Satz, damit er genauer wird. Committe noch nicht.“ In VS Code erscheint die
   Datei unter **Änderungen** mit einem `M`. Ein Klick zeigt links den alten,
   rechts den neuen Stand. Passt die Änderung, sagt dem Agenten: „Committe das mit
   der Nachricht ‚docs: PRD präzisiert‘.“ Im Graph steht jetzt ein zweiter
   eigener Commit.
5. **Auf GitHub vergleichen.** Öffnet
   <https://github.com/atra-consulting/coding-with-ai-lab> im Browser: oben die
   Liste der Commits, darunter der Ordner `docs/prds`. Wo ist euer Commit?
   Wer mag, öffnet einen geschlossenen Pull Request
   (<https://github.com/atra-consulting/coding-with-ai-lab/pulls?q=is%3Aclosed>)
   und sieht sich den Reiter „Files changed“ an.

## Folienschritte

1. VS Code: Quellcodeverwaltung ansehen.
2. Agent: Branch anlegen, PRD ablegen, committen — mitlesen.
3. In VS Code nachprüfen: Stimmt, was der Agent meldet?
4. Satz ändern lassen, in VS Code ansehen, committen lassen.
5. Auf GitHub: Warum fehlt euer Commit?

## Prompt

```
Ich möchte mein PRD in diesem Repository ablegen.

1. Lege den Branch training-1126/<vorname-nachname> an.
2. Speichere den Text unten als docs/prds/PRD-FIRMA-FAVORIT.md.
3. Committe die Datei mit der Nachricht "docs: PRD Firmen als Favorit markieren".

Sag mir vor jedem Schritt, welchen Git-Befehl du ausführst und warum.
Pushe nicht. Melde mir am Ende in drei Zeilen: auf welchem Branch ich bin,
wo die Datei liegt und wie der Commit heißt.

<hier euer PRD aus Aufgabe 03 einfügen>
```

Ohne eigenes PRD:

```
Lege den Branch training-1126/<vorname-nachname> an, kopiere
tasks/business-consultants/material/PRD-FIRMA-FAVORIT.md nach docs/prds/
und committe die Datei mit der Nachricht "docs: PRD Firmen als Favorit markieren".
Sag mir vor jedem Schritt, welchen Git-Befehl du ausführst und warum.
Pushe nicht. Melde mir am Ende in drei Zeilen: auf welchem Branch ich bin,
wo die Datei liegt und wie der Commit heißt.
```

## Abnahme

- [ ] In VS Code steht euer Branch in der Statusleiste, und der Graph zeigt
      zwei eigene Commits darauf.
- [ ] Ihr könnt zeigen, wo das PRD liegt und welche Zeile ihr im zweiten
      Commit geändert habt.
- [ ] Ihr habt die drei Angaben des Agenten in VS Code nachgeprüft und könnt
      sagen, ob sie stimmen.
- [ ] Ihr könnt sagen, warum euer Commit auf GitHub fehlt.
- [ ] Ihr erkennt die Befehle wieder, die der Agent benutzt hat:
      `git switch -c`, `git add`, `git commit`, `git status`, `git log`.

## Troubleshooting

| Problem | Lösung |
|---|---|
| Der Agent meldet `Please tell me who you are` | Git kennt euch auf diesem Rechner noch nicht. Sagt dem Agenten: „Trag für Git meinen Namen ‹Name› und meine E-Mail ‹Adresse› ein und wiederhole den Commit.“ Das Lab bleibt lokal; jede Adresse genügt. |
| VS Code zeigt keine Quellcodeverwaltung oder keinen Graph | Falscher Ordner: genau `coding-with-ai-lab` öffnen, nicht den Ordner darüber. Fehlt nur der Graph: VS Code aktualisieren und im Bereich Quellcodeverwaltung über `…` den Graph einblenden. |
| Der neue Commit erscheint nicht | Im Bereich Quellcodeverwaltung auf das Aktualisieren-Symbol klicken. |
| Der Agent will pushen oder einen Pull Request anlegen | Ablehnen. Im Lab-Repo fehlen euch die Rechte, und euer Branch bleibt lokal. |
| Der Agent macht mehr als bestellt | Stoppen mit `Esc` und sagen: „Nur die drei Schritte, sonst nichts.“ |

## Diskussion

- Welchen Befehl des Agenten hättet ihr ohne die Folie nicht verstanden?
- Woran hättet ihr gemerkt, wenn der Agent die Datei an die falsche Stelle
  gelegt oder auf `main` committet hätte?
- Was müsste passieren, damit euer Commit auf GitHub erscheint — und wer gibt
  ihn dort frei?
