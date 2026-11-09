# 10 — Repo klonen, Anwendung starten, darin lesen

**Dauer:** 35 min
**Sozialform:** einzeln
**Werkzeug:** Terminal, Browser, VS Code, Claude Code
**Ziel:** Ihr lest das Repository wie eine Akte: Das CRM-Lab läuft unter `localhost:7200`, eine Chance ist angelegt, ihr könnt zu drei Fragen sagen, in welcher Datei die Antwort steht — und Claude Code startet im Projektordner.

Die drei Handgriffe, die jeder Entwickler täglich macht — Terminal öffnen,
Repository klonen, Anwendung starten —, dazu das Lesen des Repositorys:
README, Fachdomäne, Struktur, Tests, Issues. Gelesen wird in VS Code, nicht
im Terminal. Das ist zugleich das Setup für das Lab am Nachmittag. Der erste
Start lädt Abhängigkeiten und dauert einige Minuten.
Fünf Fragen beantwortet das Repository selbst — hier steht, wo:

| Frage | Wo die Antwort steht |
|---|---|
| Was ist das, wie starte ich es? | `README.MD`, auf Deutsch `docs/welcome_DE.MD` |
| Was bedeuten Firma, Chance, Phase fachlich? | `docs/specs/DOMAIN.md` |
| Wo liegt Oberfläche, wo Logik, wo Daten? | Ordner `frontend/src/app/features` · Ordner `backend/src/routes` · Datei `backend/src/db/schema/schema.ts` |
| Gibt es Tests? | Ordner `backend/src/test`; im Frontend die Dateien auf `.spec.ts` — in VS Code mit `Ctrl+P` (macOS `Cmd+P`) und „spec.ts“ suchen |
| Woran wird gerade gearbeitet? | <https://github.com/atra-consulting/coding-with-ai-lab/issues> und `/pulls` im Browser |

## So sieht es aus, wenn es läuft

- **Im Terminal** steht nach einigen Minuten `Backend is ready!`, darunter
  `=== CRM Application Started ===` und `>>>  http://localhost:7200  <<<`;
  zuletzt meldet Angular, dass die Oberfläche unter `localhost:7200` bereitsteht.
- **Das Terminal bleibt belegt:** Es erscheint keine neue Eingabezeile, weil
  die Anwendung darin läuft. Das ist richtig so — für Claude Code öffnet ihr
  später ein zweites Terminalfenster. `Ctrl+C` im ersten Fenster beendet die
  Anwendung.
- **Im Browser** zeigt <http://localhost:7200> die Anmeldeseite „CRM System";
  nach dem Login mit `admin / admin123` seht ihr das CRM mit Firmen, Personen,
  Chancen, Aktivitäten und Dashboard.
- **Steht im Terminal eine Zeile mit `ERROR:`**, läuft die Anwendung nicht —
  die Lösung steht meist unter Troubleshooting.

## Schritte

1. Öffnet ein Terminal — macOS: Programm „Terminal", Windows: „Git Bash"
   (nicht PowerShell, damit `./start.sh` funktioniert) — und werdet mit
   `pwd`, `ls` und `cd ~` warm.
2. Prüft die Werkzeuge mit `node --version` (mindestens 20.19, empfohlen
   24 LTS) und `git --version`; fehlt eine Versionsnummer, hilft
   `docs/SETUP.md` im Lab-Repo oder Handheben.
3. Klont und startet das Lab:
   `git clone https://github.com/atra-consulting/coding-with-ai-lab.git`,
   `cd coding-with-ai-lab`, `./start.sh`, dann <http://localhost:7200>
   im Browser mit Login `admin / admin123`. **Schon in der Vorbereitung
   geklont?** Dann `git clone` weglassen: nur `cd coding-with-ai-lab` und
   `./start.sh`.
4. Klickt fünf Minuten durch Firmen, Personen, Chancen, Aktivitäten und
   Dashboard und legt eine Chance an — ihr braucht das Bild der Anwendung
   im Lab, wenn der Agent behauptet, etwas sei fertig.
5. Öffnet in VS Code den Ordner `coding-with-ai-lab` (Datei › Ordner öffnen)
   und beantwortet die fünf Fragen der Tabelle im Explorer links. Lasst
   VS Code offen — ihr braucht es in Aufgabe 11 wieder.
6. Notiert drei Antworten: Wie viele Feature-Ordner hat das Frontend,
   welche Route liefert die Firmenliste (`backend/src/routes/firmen.ts`,
   mit `Ctrl+F` nach `router.get` suchen), und was passiert fachlich, wenn
   eine Firma gelöscht wird (`DOMAIN.md`)?
7. **Starttest für Claude Code.** Öffnet ein zweites Terminalfenster (das
   erste zeigt die Anwendung), geht mit `cd coding-with-ai-lab` ins Projekt
   und startet `claude`. Fragt „Was macht dieses Projekt?“ und beendet mit
   `/exit`. Mehr nicht — mit Claude gearbeitet wird ab Aufgabe 11.

## Folienschritte

1. Terminal öffnen, `node --version` und `git --version` prüfen.
2. Lab-Repo klonen, dann `cd coding-with-ai-lab`.
3. `./start.sh`, im Browser anmelden mit `admin / admin123`.
4. Fünf Minuten durchklicken und eine Chance anlegen.
5. VS Code: Repository lesen, drei Antworten notieren.
6. Starttest: `claude`, „Was macht dieses Projekt?“, `/exit`.

## Abnahme

- Die Anwendung läuft, und im Browser steht die von euch angelegte Chance.
- Zu den drei Fragen aus Schritt 6 könnt ihr die Datei nennen, in der die
  Antwort steht.
- VS Code ist mit dem Ordner `coding-with-ai-lab` offen.
- `claude` startet im Projektordner ohne erneute Anmeldung und beantwortet
  eure Frage.

## Troubleshooting

| Problem | Lösung |
|---|---|
| `destination path 'coding-with-ai-lab' already exists` | Ihr habt schon in der Vorbereitung geklont — kein Fehler. `cd coding-with-ai-lab`, dann `./start.sh`. |
| `port 7070 is already in use` | `./end.sh` ausführen, dann `./start.sh` erneut. |
| `Node.js 20.19 or later is required` | Node.js nach `docs/SETUP.md` aktualisieren — empfohlen ist 24 LTS —, Terminal neu öffnen. |
| Klonen bricht ab (Proxy, Zertifikat) | Firmennetz filtert — Hotspot vom Handy für den Klon, danach mit der IT klären. |
| `./start.sh: Permission denied` | `bash start.sh` |
| Windows: `start.sh` nicht gefunden | Ihr seid in PowerShell — Git Bash öffnen. |
| VS Code zeigt den Ordner nicht | Genau `coding-with-ai-lab` öffnen, nicht den Ordner darüber. |
| `claude` startet nicht oder will sich anmelden und es klappt nicht | Sofort Handheben — bis zum Lab ist Zeit für eine Lösung oder ein Paar. |
