# 10 — Repo klonen, Anwendung starten, darin lesen

**Dauer:** 35 min
**Sozialform:** einzeln
**Werkzeug:** Terminal
**Ziel:** Das CRM-Lab läuft auf dem eigenen Rechner, und das Repository ist gelesen wie eine Akte.
**Ergebnis:** Die Anwendung läuft unter `localhost:7200`, eine Chance ist angelegt, und ihr könnt zu drei Fragen sagen, in welcher Datei die Antwort steht.

Die drei Handgriffe, die jeder Entwickler täglich macht — Terminal öffnen,
Repository klonen, Anwendung starten —, dazu das Lesen des Repositorys:
README, Fachdomäne, Struktur, Tests, Issues. Das ist zugleich das Setup für
Tag 2. Der erste Start lädt Abhängigkeiten und dauert einige Minuten; das
Terminal bleibt danach belegt, weil die Anwendung darin läuft. Sobald
`Backend is ready!` und die Angular-Zeile mit `localhost:7200` erscheinen,
ist sie oben. Fünf Fragen beantwortet das Repository selbst — hier steht, wo:

| Frage | Wo die Antwort steht |
|---|---|
| Was ist das, wie starte ich es? | `README.MD`, auf Deutsch `docs/welcome_DE.MD` |
| Was bedeuten Firma, Chance, Phase fachlich? | `docs/specs/DOMAIN.md` |
| Wo liegt Oberfläche, wo Logik, wo Daten? | `ls frontend/src/app/features` · `ls backend/src/routes` · `backend/src/db/schema/schema.ts` |
| Gibt es Tests? | `ls backend/src/test` · `find frontend/src -name "*.spec.ts" \| head` |
| Woran wird gerade gearbeitet? | <https://github.com/atra-consulting/coding-with-ai-lab/issues> und `/pulls` im Browser |

## Schritte

1. Öffnet ein Terminal — macOS: Programm „Terminal", Windows: „Git Bash"
   (nicht PowerShell, damit `./start.sh` funktioniert) — und werdet mit
   `pwd`, `ls` und `cd ~` warm.
2. Prüft die Werkzeuge mit `node --version` (20.19 oder neuer) und
   `git --version`; fehlt eine Versionsnummer, hilft `docs/SETUP.md` im
   Lab-Repo oder Handheben — die Installation ist Teil dieses Blocks.
3. Klont und startet das Lab:
   `git clone https://github.com/atra-consulting/coding-with-ai-lab.git`,
   `cd coding-with-ai-lab`, `./start.sh`, dann <http://localhost:7200>
   im Browser mit Login `admin / admin123`.
4. Klickt fünf Minuten durch Firmen, Personen, Chancen, Aktivitäten und
   Dashboard und legt eine Chance an — ihr braucht das Bild der Anwendung
   an Tag 2, wenn der Agent behauptet, etwas sei fertig.
5. Öffnet ein zweites Terminalfenster (das erste zeigt die Anwendung),
   geht wieder mit `cd coding-with-ai-lab` ins Projekt und beantwortet die
   fünf Fragen der Tabelle im Editor (`code .`) oder mit
   `cat docs/specs/DOMAIN.md`.
6. Notiert drei Antworten: Wie viele Feature-Ordner hat das Frontend,
   welche Route liefert die Firmenliste (`backend/src/routes/firmen.ts`,
   Zeile mit `router.get`), und was passiert fachlich, wenn eine Firma
   gelöscht wird (`DOMAIN.md`)?

## Folienschritte

1. Terminal öffnen, `node --version` und `git --version` prüfen.
2. Lab-Repo klonen, dann `cd coding-with-ai-lab`.
3. `./start.sh`, im Browser anmelden mit `admin / admin123`.
4. Fünf Minuten durchklicken und eine Chance anlegen.
5. Zweites Terminal: Repository lesen, drei Antworten notieren.

## Abnahme

- Die Anwendung läuft, und im Browser steht die von euch angelegte Chance.
- Zu den drei Fragen aus Schritt 6 könnt ihr die Datei nennen, in der die
  Antwort steht.

## Troubleshooting

| Problem | Lösung |
|---|---|
| `port 7070 is already in use` | `./end.sh` ausführen, dann `./start.sh` erneut. |
| `Node.js 20.19 or later is required` | Node.js nach `docs/SETUP.md` aktualisieren, Terminal neu öffnen. |
| Klonen bricht ab (Proxy, Zertifikat) | Firmennetz filtert — Hotspot vom Handy für den Klon, danach mit der IT klären. |
| `./start.sh: Permission denied` | `bash start.sh` |
| Windows: `start.sh` nicht gefunden | Ihr seid in PowerShell — Git Bash öffnen, oder `start.bat` verwenden. |
