# 11 — Branch und Commit mit Claude, nachsehen in VS Code

**Dauer:** 25 min
**Sozialform:** Paare
**Werkzeug:** Claude Code, VS Code, Browser
**Voraussetzung:** Aufgabe 10 erledigt: Lab läuft, VS Code ist mit dem Projektordner offen, der Starttest mit `claude` hat geklappt
**Ziel:** Claude legt euren Branch an und schreibt euer PRD als Commit fest — ihr seht in VS Code nach, was passiert ist: zwei eigene Commits auf eurem Branch, das PRD unter `docs/prds/`, die geänderte Zeile in der Vergleichsansicht.

So arbeiten Business Consultants mit Git: Die Befehle tippt der Agent, ihr
gebt den Auftrag und prüft das Ergebnis. Dafür müsst ihr wissen, wo ihr
nachseht — welcher Branch, welcher Commit, welche Datei, welche Zeile.

Die Änderung ist echt: Euer PRD aus Aufgabe 03 kommt als Datei ins Repo,
dort, wo das Lab seine PRDs ablegt. Der Agent liest sie im Lab.

Arbeitet zu zweit: Eine Person gibt Claude den Auftrag, die andere liest die
Befehle mit, die Claude ausführt, und sagt, was sie in VS Code erwartet. Nach
Schritt 3 tauscht ihr. Jede Person arbeitet in ihrem eigenen Lab — Branch und
PRD liegen auf dem Rechner, auf dem Claude gearbeitet hat.

## Schritte

1. **VS Code ansehen.** VS Code ist aus Aufgabe 10 mit dem Ordner
   `coding-with-ai-lab` offen (sonst: Datei › Ordner öffnen). Klickt links auf
   **Quellcodeverwaltung** (das
   Symbol mit den verzweigten Linien, `Ctrl+Shift+G`). Unten seht ihr den
   **Graph** mit den bisherigen Commits; unten links in der Statusleiste steht
   der aktuelle Branch: `main`.
2. **Claude den Auftrag geben.** Startet im zweiten Terminal im Projektordner
   `claude` und gebt den Prompt unten ein — mit eurem Namen und eurem PRD aus
   Aufgabe 03. Wer kein PRD hat, nimmt den zweiten Prompt mit dem Muster-PRD.
   Lest mit, welche Befehle Claude ausführt: Ihr kennt sie von der Folie.
3. **In VS Code nachsehen.**
   - Statusleiste: Auf welchem Branch seid ihr jetzt?
   - Explorer: Wo liegt `PRD-FIRMA-FAVORIT.md`?
   - Graph: Welcher Commit ist neu — mit welcher Nachricht, von wem, wann?
   - Klickt auf den Commit und dann auf die Datei: Die Vergleichsansicht zeigt
     grün, was neu ist.
4. **Eine Änderung vor dem Commit ansehen.** Sagt Claude: „Ändere im PRD einen
   Satz, damit er genauer wird. Committe noch nicht.“ In VS Code erscheint die
   Datei unter **Änderungen** mit einem `M`. Ein Klick zeigt links den alten,
   rechts den neuen Stand. Passt die Änderung, sagt Claude: „Committe das mit
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
2. Claude: Branch anlegen, PRD ablegen, committen — mitlesen.
3. In VS Code nachsehen: Branch, Datei, Commit.
4. Satz ändern lassen, in VS Code ansehen, committen lassen.
5. Auf GitHub: Warum fehlt euer Commit?

## Prompt

```
Ich möchte mein PRD in diesem Repository ablegen.

1. Lege den Branch training-1126/<vorname-nachname> an.
2. Speichere den Text unten als docs/prds/PRD-FIRMA-FAVORIT.md.
3. Committe die Datei mit der Nachricht "docs: PRD Firmen als Favorit markieren".

Sag mir vor jedem Schritt, welchen Git-Befehl du ausführst und warum.
Pushe nicht.

<hier euer PRD aus Aufgabe 03 einfügen>
```

Ohne eigenes PRD:

```
Lege den Branch training-1126/<vorname-nachname> an, kopiere
tasks/business-consultants/material/PRD-FIRMA-FAVORIT.md nach docs/prds/
und committe die Datei mit der Nachricht "docs: PRD Firmen als Favorit markieren".
Sag mir vor jedem Schritt, welchen Git-Befehl du ausführst und warum.
Pushe nicht.
```

## Abnahme

- [ ] In VS Code steht euer Branch in der Statusleiste, und der Graph zeigt
      zwei eigene Commits darauf.
- [ ] Ihr könnt zeigen, wo das PRD liegt und welche Zeile ihr im zweiten
      Commit geändert habt.
- [ ] Ihr könnt sagen, warum euer Commit auf GitHub fehlt.
- [ ] Ihr erkennt die Befehle wieder, die Claude benutzt hat:
      `git switch -c`, `git add`, `git commit`, `git status`, `git log`.

## Troubleshooting

| Problem | Lösung |
|---|---|
| Claude meldet `Please tell me who you are` | Git kennt euch auf diesem Rechner noch nicht. Sagt Claude: „Trag für Git meinen Namen ‹Name› und meine E-Mail ‹Adresse› ein und wiederhole den Commit.“ Das Lab bleibt lokal; jede Adresse genügt. |
| VS Code zeigt keine Quellcodeverwaltung oder keinen Graph | Falscher Ordner: genau `coding-with-ai-lab` öffnen, nicht den Ordner darüber. Fehlt nur der Graph: VS Code aktualisieren und im Bereich Quellcodeverwaltung über `…` den Graph einblenden. |
| Der neue Commit erscheint nicht | Im Bereich Quellcodeverwaltung auf das Aktualisieren-Symbol klicken. |
| Claude will pushen oder einen Pull Request anlegen | Ablehnen. Im Lab-Repo fehlen euch die Rechte, und euer Branch bleibt lokal. |
| Claude macht mehr als bestellt | Stoppen mit `Esc` und sagen: „Nur die drei Schritte, sonst nichts.“ |

## Diskussion

- Welchen Befehl von Claude hättet ihr ohne die Folie nicht verstanden?
- Woran hättet ihr gemerkt, wenn Claude die Datei an die falsche Stelle
  gelegt oder auf `main` committet hätte?
- Was müsste passieren, damit euer Commit auf GitHub erscheint — und wer gibt
  ihn dort frei?
