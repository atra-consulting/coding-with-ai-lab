# 10 — Repo klonen, Anwendung starten, mit dem Agenten darin lesen

**Dauer:** 45 min
**Sozialform:** einzeln
**Werkzeug:** Terminal, Browser, VS Code, Claude Code oder GitHub Copilot CLI
**Ziel:** Das CRM-Lab läuft unter `localhost:7200`, eine Chance ist angelegt, und euer Agent hat euch das Repository erklärt — ihr habt zwei seiner Antworten in VS Code nachgeprüft und könnt sagen, ob sie stimmen.

Die drei Handgriffe, die jeder Entwickler täglich macht — Terminal öffnen,
Repository klonen, Anwendung starten —, macht ihr selbst. Danach liest ihr
das Repository so, wie Business Consultants es tun: Ihr fragt den Agenten,
und er sucht die Antworten. Eure Arbeit ist das Nachprüfen — die Datei, die
er nennt, öffnet ihr in VS Code und seht nach, ob es dort wirklich steht.
Das ist zugleich das Setup für das Lab am Nachmittag. Der erste Start lädt
Abhängigkeiten und dauert einige Minuten.

## So sieht es aus, wenn es läuft

- **Im Terminal** steht nach einigen Minuten `Backend is ready!`, darunter
  `=== CRM Application Started ===` und `>>>  http://localhost:7200  <<<`;
  zuletzt meldet die Oberfläche (Angular), dass sie unter `localhost:7200` bereitsteht.
- **Das Terminal bleibt belegt:** Es erscheint keine neue Eingabezeile, weil
  die Anwendung darin läuft. Das ist richtig so — für den Agenten öffnet ihr
  später ein zweites Terminalfenster. `Ctrl+C` im ersten Fenster beendet die
  Anwendung.
- **Im Browser** zeigt <http://localhost:7200> die Anmeldeseite „CRM System"
  mit Benutzerkacheln; nach einem Klick auf die Kachel `admin` — ein Passwort
  braucht es nicht — seht ihr das CRM mit Firmen, Personen,
  Chancen, Aktivitäten und Dashboard.
- **Steht im Terminal eine Zeile mit `ERROR:`**, läuft die Anwendung nicht —
  die Lösung steht meist unter Troubleshooting.

## Kopieren und Einfügen mit der Tastatur

Befehle und den Prompt nicht abtippen: Ein einziger Tippfehler, und der
Befehl scheitert mit einer schwer verständlichen Meldung. Markiert den Text
hier mit der Maus und kopiert ihn mit der Tastatur:

| | macOS | Windows |
|---|---|---|
| Kopieren (Text markiert) | `Cmd+C` | `Ctrl+C` |
| Einfügen in Browser und VS Code | `Cmd+V` | `Ctrl+V` |
| Einfügen im Terminal | `Cmd+V` | Git Bash: `Shift+Einfg` oder Rechtsklick › Paste · PowerShell: `Ctrl+V` oder Rechtsklick |

Im Terminal heißt `Ctrl+C` nicht „Kopieren“, sondern „Abbrechen“ — auf dem
Mac wie unter Windows. Drückt ihr es im Fenster mit der laufenden
Anwendung, stoppt sie. Wer lieber die Maus nimmt: Rechtsklick ins Terminal
› Einfügen geht überall.

## Schritte

1. Öffnet ein Terminal — macOS: Programm „Terminal", Windows: „Git Bash"
   (nicht PowerShell, damit `./start.sh` funktioniert) — und werdet mit
   `pwd` (wo bin ich?), `ls` (was liegt hier?) und `cd ~` (zurück in den
   Benutzerordner) warm.
2. Prüft die Werkzeuge mit `node --version` (mindestens 20.19, mit
   GitHub Copilot CLI mindestens 22, empfohlen 24 LTS) und `git --version`;
   fehlt eine Versionsnummer, hilft `docs/SETUP.md` im Lab-Repo oder
   Handheben.
3. Klont und startet das Lab:
   `git clone https://github.com/atra-consulting/coding-with-ai-lab.git`,
   `cd coding-with-ai-lab`, `./start.sh`, dann <http://localhost:7200>
   im Browser öffnen und die Kachel `admin` anklicken. **Schon in der Vorbereitung
   geklont?** Dann `git clone` weglassen: nur `cd coding-with-ai-lab` und
   `./start.sh`.
4. Klickt fünf Minuten durch Firmen, Personen, Chancen, Aktivitäten und
   Dashboard und legt eine Chance an — ihr braucht das Bild der Anwendung
   im Lab, wenn der Agent behauptet, etwas sei fertig.
5. **Agent starten.** Öffnet ein zweites Terminalfenster — das erste zeigt
   die Anwendung und bleibt offen:
   - macOS: im Terminal `Cmd+N` (neues Fenster) oder Menü Shell › Neues Fenster
   - Windows: Git Bash ein zweites Mal aus dem Startmenü öffnen

   Das neue Fenster beginnt im Benutzerordner. Geht mit `cd coding-with-ai-lab`
   ins Projekt und startet euren Agenten: `claude` für Claude Code, `copilot`
   für GitHub Copilot CLI.

   **Beim ersten Start fragen beide Agenten, ob ihr dem Ordner vertraut.**
   Schaut zuerst auf den Pfad in der Frage: Er muss auf `coding-with-ai-lab`
   enden. Steht dort nur euer Benutzerordner (etwa `/Users/<name>`), habt ihr
   `cd coding-with-ai-lab` vergessen — dann „No, exit“ wählen, erst `cd`,
   dann den Agenten neu starten. Stimmt der Pfad: bei Claude Code „Yes, I
   trust this folder“, bei Copilot „Yes, and remember this folder for future
   sessions“.

   **Mit GitHub Copilot CLI:** Will Copilot einen Befehl ausführen, fragt es nach. Befehle, die
   nur lesen (zum Beispiel `ls`, `cat`, `grep`), dürft ihr mit „Yes, and
   approve … for the rest of the running session“ für die ganze Sitzung
   erlauben. Alles, was etwas ändert, lest ihr und erlaubt es einzeln. Unter Windows startet ihr `copilot` in PowerShell
   (ab Version 6, Befehl `pwsh`), nicht in Git Bash — so verlangt es GitHub.

6. **Den Agenten fragen.** Gebt den Prompt unten ein. Der Agent liest die
   Dateien selbst und nennt zu jeder Antwort die Datei, in der sie steht.
7. **Nachprüfen in VS Code.** Der Agent kann sich irren — deshalb seht ihr
   bei zwei Antworten selbst nach, ob sie in der genannten Datei stehen.
   VS Code ist ein Programm zum Ansehen und Bearbeiten von Projektdateien —
   so etwas wie der Datei-Explorer, nur mit Suche, farbiger Darstellung und
   Git eingebaut. Ihr habt es in der Vorbereitung installiert.
   1. **Projekt öffnen:** VS Code starten — macOS: `Cmd+Leertaste`,
      `Visual Studio Code` tippen, Enter; Windows: Startmenü, `Visual Studio
      Code`. Dann Menü Datei › Ordner öffnen …,
      im Benutzerordner `coding-with-ai-lab` markieren und „Öffnen“ klicken.
      Fragt VS Code, ob ihr den Autoren vertraut, „Ja“ wählen. Links steht
      jetzt die Liste der Ordner und Dateien (Explorer).
   2. **Antwort aussuchen:** Nehmt eine Antwort des Agenten, zum Beispiel zu
      Frage 5 (Phasen einer Chance), und merkt euch die Datei, die er nennt,
      etwa `docs/specs/DOMAIN.md`.
   3. **Datei öffnen:** `Cmd+P` (Windows `Ctrl+P`) drücken, den Dateinamen
      tippen, zum Beispiel `DOMAIN`, und Enter. Oder links im Explorer durch
      die Ordner klicken: `docs` › `specs` › `DOMAIN.md`.
   4. **Stelle finden:** `Cmd+F` (Windows `Ctrl+F`) und ein Stichwort aus
      der Antwort suchen, zum Beispiel `Phase`.
   5. **Vergleichen und notieren:** Steht es dort so, wie der Agent sagt?
      Notiert: stimmt · stimmt halb · stimmt nicht.

   Dasselbe für eine zweite Antwort. Lasst VS Code offen — ihr braucht es in
   Aufgabe 11 wieder.
8. Beendet den Agenten — Claude Code mit `/exit`, Copilot mit zweimal
   `Ctrl+C`. Die Anwendung im ersten Fenster läuft weiter.

## Folienschritte

1. Terminal öffnen, `node --version` und `git --version` prüfen.
2. Klonen, `cd coding-with-ai-lab`, `./start.sh`.
3. Anmelden, durchklicken, eine Chance anlegen.
4. Zweites Fenster: `claude` oder `copilot`.
5. Prompt aus der Aufgabe: sechs Fragen an den Agenten.
6. Zwei Antworten in VS Code nachprüfen.

## Prompt

```
Ich bin Business Consultant und lese dieses Projekt zum ersten Mal.
Beantworte kurz und auf Deutsch, und nenne zu jeder Antwort die Datei
oder den Ordner, in dem du sie gefunden hast:

1. Was ist das für eine Anwendung, und wie startet man sie?
2. Was bedeuten Firma, Chance und Phase fachlich?
3. Wo liegt die Oberfläche, wo die Logik, wo die Daten?
4. Mit welchen Benutzern kann man sich anmelden, und was dürfen sie?
5. Welche Phasen kann eine Chance durchlaufen?
6. Was passiert fachlich, wenn eine Firma gelöscht wird?

Ändere nichts, lies nur.
```

## Abnahme

- [ ] Die Anwendung läuft, und im Browser steht die von euch angelegte Chance.
- [ ] Euer Agent startet im Projektordner ohne erneute Anmeldung und hat die
      sechs Fragen beantwortet, jede mit einer Datei oder einem Ordner.
- [ ] Zwei Antworten habt ihr in VS Code nachgeprüft und könnt sagen, ob sie
      stimmen.
- [ ] VS Code ist mit dem Ordner `coding-with-ai-lab` offen.

## Zum Nachprüfen: wo die Antworten stehen

| Frage | Wo die Antwort steht |
|---|---|
| Was ist das, wie starte ich es? | `README.MD`, auf Deutsch `docs/welcome_DE.MD` |
| Was bedeuten Firma, Chance, Phase fachlich? | `docs/specs/DOMAIN.md` |
| Wo liegt Oberfläche, wo Logik, wo Daten? | Ordner `frontend/src/app/features` · Ordner `backend/src/routes` · Datei `backend/src/db/schema/schema.ts` |
| Mit welchen Benutzern kann man sich anmelden? | `README.MD`, Abschnitt mit der Tabelle der Benutzer (admin, user, demo) |
| Welche Phasen hat eine Chance? | `docs/specs/DOMAIN.md`, Tabelle „ChancePhase“ (NEU bis GEWONNEN/VERLOREN) |
| Was passiert beim Löschen einer Firma? | `docs/specs/DOMAIN.md` |

## Troubleshooting

| Problem | Lösung |
|---|---|
| `destination path 'coding-with-ai-lab' already exists` | Ihr habt schon in der Vorbereitung geklont — kein Fehler. `cd coding-with-ai-lab`, dann `./start.sh`. |
| `port 7070 is already in use` (7070 ist der Server im Hintergrund) | `./end.sh` ausführen, dann `./start.sh` erneut. |
| `Node.js 20.19 or later is required` | Node.js nach `docs/SETUP.md` aktualisieren — empfohlen ist 24 LTS —, Terminal neu öffnen. |
| Klonen bricht ab (Proxy, Zertifikat) | Firmennetz filtert — Hotspot vom Handy für den Klon, danach mit der IT klären. |
| `./start.sh: Permission denied` | `bash start.sh` |
| Windows: `start.sh` nicht gefunden | Ihr seid in PowerShell — Git Bash öffnen. |
| VS Code zeigt den Ordner nicht | Genau `coding-with-ai-lab` öffnen, nicht den Ordner darüber. |
| `claude` oder `copilot` startet nicht oder will sich anmelden und es klappt nicht | Sofort Handheben — bis zum Lab ist Zeit für eine Lösung oder ein Paar. |
| Windows: `copilot` startet in Git Bash nicht oder verhält sich seltsam | PowerShell 6 oder neuer öffnen (`pwsh`), dort `cd coding-with-ai-lab` und `copilot`. Die Anwendung läuft weiter in Git Bash. |
| Der Agent nennt eine Datei, die es nicht gibt | Gut bemerkt — genau dafür prüft ihr nach. Sagt ihm: „Die Datei gibt es nicht. Such noch einmal und nenne den genauen Pfad.“ |
| Der Agent will etwas ändern oder installieren | Ablehnen bzw. mit `Esc` stoppen: „Ändere nichts, lies nur.“ |
| Copilot meldet, dass ihr keinen Zugang habt | Euer GitHub-Konto braucht ein Copilot-Abo, und eure Firma darf die Copilot CLI nicht gesperrt haben — Handheben. |
