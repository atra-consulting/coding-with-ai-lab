# Willkommen zum AI Coding Lab — Copilot-Schulung

Schön, dass du dabei bist. Dieses Dokument bringt dich **vor** der Schulung startklar.

Du installierst ein paar Tools, holst dir das Projekt und startest es einmal lokal.
Läuft die Anwendung im Browser, bist du fertig — mehr ist vorab nicht nötig.

⏱️ **Dauer:** ca. 30–45 Minuten
💻 **Plattformen:** macOS und Windows (Linux siehe [SETUP.md](SETUP.md))

> **Wichtig:** Bitte erledige das **vor dem ersten Schulungstag**. So verlieren wir keine Zeit mit Installationen.
> Wenn etwas klemmt: kein Stress. Melde dich bei uns, wir helfen.

---

## Was du installierst

| Tool | Wofür | Pflicht |
|------|-------|---------|
| [Git](https://git-scm.com/) | Repository klonen, Branches, Commits | ✅ |
| [Node.js](https://nodejs.org/) (inkl. npm) | Backend und Frontend starten | ✅ |
| [GitHub Copilot CLI](https://github.com/github/copilot-cli) | Der KI-Assistent, mit dem wir arbeiten | ✅ |
| [Visual Studio Code](https://code.visualstudio.com/) | Editor / IDE | Empfohlen |
| [Homebrew](https://brew.sh/) (nur macOS) | Paketmanager für die Installation | ✅ (macOS) |
| Markdown-Viewer | Aufgaben und Specs lesen | Optional |

> **Copilot-Zugang nötig.** Copilot CLI braucht ein GitHub-Konto mit aktivem [Copilot-Abo](https://github.com/features/copilot/plans).
> Bei Copilot Business oder Enterprise muss deine Organisation Copilot CLI freigeben.
> Kläre vorab mit uns oder deiner IT, welcher Zugang für dich vorgesehen ist.

---

# Teil 1 — Installation

Wähle deinen Abschnitt: [macOS](#macos) oder [Windows](#windows).

---

## macOS

Wir installieren alles über **Homebrew**. Öffne dazu die App **Terminal**
(Spotlight: `Cmd + Leertaste`, dann „Terminal“ tippen).

### Schritt 1 — Homebrew installieren

Prüfe zuerst, ob Homebrew schon da ist:

```bash
brew --version
```

Kommt eine Versionsnummer? Weiter mit Schritt 2.
Kommt „command not found“? Dann installiere Homebrew:

```bash
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
```

Am Ende zeigt der Installer zwei Befehle an, die du noch ausführen musst
(sie hängen Homebrew an deinen `PATH`). Kopiere sie und führe sie aus.
Danach Terminal schließen und neu öffnen.

🔗 [brew.sh](https://brew.sh/)

### Schritt 2 — Git installieren

macOS bringt oft schon ein Git mit. Prüfen:

```bash
git --version
```

Keine Ausgabe oder eine sehr alte Version? Dann:

```bash
brew install git
```

🔗 [git-scm.com](https://git-scm.com/)

### Schritt 3 — Node.js installieren

```bash
brew install node@24
```

Homebrew sagt dir am Ende eventuell, dass du Node noch verlinken musst.
Folge dann dem angezeigten `brew link`-Hinweis oder führe aus:

```bash
echo 'export PATH="/opt/homebrew/opt/node@24/bin:$PATH"' >> ~/.zshrc
source ~/.zshrc
```

Prüfen:

```bash
node --version   # muss v22 oder neuer sein (für Copilot CLI)
npm --version
```

🔗 [nodejs.org](https://nodejs.org/)

### Schritt 4 — Copilot CLI installieren

```bash
npm install -g @github/copilot
```

Prüfen:

```bash
copilot --version
```

> Copilot CLI braucht **Node.js 22 oder neuer**. Mit `node@24` aus Schritt 3 passt das.

🔗 [Copilot CLI Doku](https://github.com/github/copilot-cli)

### Schritt 5 — Visual Studio Code installieren (empfohlen)

```bash
brew install --cask visual-studio-code
```

🔗 [code.visualstudio.com](https://code.visualstudio.com/)

### Schritt 6 — Markdown-Viewer (optional)

VS Code kann Markdown von Haus aus anzeigen: `Cmd + Shift + V`.
Wer lieber eine eigene App nutzt:

```bash
brew install --cask macdown
```

🔗 [macdown.app](https://macdown.app/)

➡️ **Weiter mit [Teil 2 — Projekt starten](#teil-2--projekt-starten).**

---

## Windows

Wir installieren alles über **winget**, den Paketmanager von Windows
(ab Windows 10 / 11 vorinstalliert).

Öffne **PowerShell**: Windows-Taste drücken, „PowerShell“ tippen, Enter.
Noch angenehmer ist das [Windows Terminal](https://aka.ms/terminal).

Prüfe, ob winget da ist:

```powershell
winget --version
```

Kommt ein Fehler? Installiere den [App Installer aus dem Microsoft Store](https://aka.ms/getwinget).

### Schritt 1 — Git installieren

```powershell
winget install --id Git.Git -e --source winget
```

> **Wichtig:** Ohne Git kannst du das Projekt nicht klonen. Also: nicht überspringen.

Danach PowerShell **schließen und neu öffnen**, dann prüfen:

```powershell
git --version
```

🔗 [git-scm.com/download/win](https://git-scm.com/download/win)

### Schritt 2 — Node.js installieren

```powershell
winget install --id OpenJS.NodeJS.LTS -e
```

Alternativ den Installer von [nodejs.org](https://nodejs.org/) herunterladen und ausführen.

> **Beim offiziellen Installer:** Setze den Haken bei
> **„Automatically install the necessary tools. […]“**.
> Damit kommen Python und die Visual Studio Build Tools mit — die braucht Node für native Module.

PowerShell **neu öffnen**, dann prüfen:

```powershell
node --version   # muss v22 oder neuer sein (für Copilot CLI)
npm --version
```

🔗 [nodejs.org](https://nodejs.org/)

### Schritt 3 — Ausführungsrichtlinie setzen

Windows blockiert standardmäßig Skripte wie `npm` oder `ng`.
Führe das einmal in PowerShell aus:

```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

Bestätige mit `J` bzw. `Y`.

### Schritt 4 — Copilot CLI installieren

Copilot CLI braucht unter Windows **PowerShell 6 oder neuer**.
Die vorinstallierte „Windows PowerShell 5.1“ reicht nicht. Installiere die aktuelle PowerShell:

```powershell
winget install --id Microsoft.PowerShell -e
```

Danach **PowerShell 7** öffnen (Startmenü: „PowerShell 7“, Befehl `pwsh`) und Copilot CLI installieren:

```powershell
npm install -g @github/copilot
```

Prüfen:

```powershell
copilot --version
```

🔗 [Copilot CLI Doku](https://github.com/github/copilot-cli)

### Schritt 5 — Visual Studio Code installieren (empfohlen)

```powershell
winget install --id Microsoft.VisualStudioCode -e
```

🔗 [code.visualstudio.com](https://code.visualstudio.com/)

### Schritt 6 — Markdown-Viewer (optional)

VS Code zeigt Markdown direkt an: `Ctrl + Shift + V`.
Wer eine eigene App möchte:

```powershell
winget install --id marktext.marktext -e
```

🔗 [marktext.cc](https://www.marktext.cc/)

➡️ **Weiter mit Teil 2.**

---

# Teil 2 — Projekt starten

Ab hier sind die Schritte auf macOS und Windows fast identisch.

## Schritt 7 — Repository klonen

Wechsle in den Ordner, in dem deine Projekte liegen sollen. Dann:

```bash
git clone https://github.com/atra-consulting/coding-with-ai-lab.git
cd coding-with-ai-lab
```

🔗 [github.com/atra-consulting/coding-with-ai-lab](https://github.com/atra-consulting/coding-with-ai-lab)

## Schritt 8 — Anwendung starten

**macOS:**

```bash
./start.sh
```

**Windows (PowerShell):**

```powershell
.\start.bat
```

Das Skript macht alles selbst:

1. Prüft Node.js und die Ports
2. Installiert die Abhängigkeiten (`npm install`) — beim ersten Mal dauert das ein paar Minuten
3. Startet das Backend auf Port **7070**
4. Startet das Frontend auf Port **7200**

Warte, bis im Terminal steht:

```
=== CRM Application Started ===

  >>>  http://localhost:7200  <<<
```

☕ **Beim ersten Start:** 3–5 Minuten sind normal. Danach geht es in Sekunden.

## Schritt 9 — Einloggen und prüfen

Öffne <http://localhost:7200> im Browser und melde dich an:

| Benutzer | Passwort | Rolle |
|----------|----------|-------|
| `admin` | `admin123` | Admin |
| `user` | `test123` | User |
| `demo` | `demo1234` | Admin |

Du siehst jetzt das CRM mit Testdaten: Firmen, Personen, Aktivitäten, Chancen.

**Beenden:** `Ctrl + C` im Terminal. Oder `./end.sh` bzw. `end.bat`.

## Schritt 10 — Copilot CLI anmelden

Bleib im Projektordner und starte:

```bash
copilot
```

Beim ersten Start fragt Copilot CLI, ob du dem Ordner vertraust. Bestätige.
Dann tippe:

```
/login
```

Copilot CLI zeigt einen Code und öffnet GitHub im Browser. Code eingeben, Zugriff bestätigen.
Danach läuft der Assistent im Terminal.

Teste ihn mit einer einfachen Frage:

```
Was macht dieses Projekt?
```

---

## ✅ Deine Checkliste

Du bist startklar, wenn alle Punkte stimmen:

- [ ] `git --version` liefert eine Version
- [ ] `node --version` liefert **v22 oder neuer**
- [ ] `npm --version` liefert eine Version
- [ ] `copilot --version` liefert eine Version
- [ ] Repository ist geklont
- [ ] `./start.sh` bzw. `start.bat` läuft ohne Fehler
- [ ] <http://localhost:7200> zeigt die Login-Seite
- [ ] Login mit `admin` / `admin123` klappt
- [ ] `copilot` startet im Projektordner, `/login` klappt, er antwortet

**Alles grün? Perfekt. Wir sehen uns in der Schulung.** 🎉

---

## Probleme? Erste Hilfe

| Problem | Lösung |
|---------|--------|
| `command not found: brew` | Terminal neu öffnen. Sonst die `PATH`-Befehle aus dem Homebrew-Installer nachtragen. |
| `command not found: node` / `npm` | Terminal bzw. PowerShell neu öffnen. Die Installation setzt den `PATH` erst danach. |
| Node ist zu alt (< 22) | Neu installieren: `brew install node@24` bzw. `winget install --id OpenJS.NodeJS.LTS -e`. |
| Windows: „… kann nicht geladen werden, da die Ausführung von Skripts … deaktiviert ist“ | `Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser` (siehe Schritt 3). |
| `Port 7070 is already in use` | Alte Instanz läuft noch. `./end.sh` bzw. `end.bat` ausführen, dann neu starten. |
| `npm install` bricht ab | Ordner `backend/node_modules` und `frontend/node_modules` löschen, dann neu starten. |
| Datenbank ist kaputt oder voller Testmüll | `./start.sh --reset-db` bzw. `start.bat --reset-db` — legt die SQLite-DB neu an. |
| Agent-Endpunkte antworten mit 401 | `backend/.env` fehlt. Start-Skript erneut ausführen — es legt die Datei aus `.env.example` an. |
| Copilot CLI startet nicht (Windows) | PowerShell 7 installiert und geöffnet? Copilot CLI braucht PowerShell 6 oder neuer. |
| Copilot CLI: kein Zugriff nach `/login` | Copilot-Abo aktiv? Bei Business/Enterprise: Organisation muss Copilot CLI freigeben. |

Ausführliche Anleitung mit Linux, `nvm` und Alternativen: **[SETUP.md](SETUP.md)**

---

# Was dich in der Schulung erwartet

Nur zur Orientierung — nichts davon musst du vorab tun.

## Das Projekt

Eine Full-Stack-CRM-Anwendung: **Node.js/TypeScript** im Backend, **Angular** im Frontend.
Sie enthält vorbereitete Features und Bugs. Die baust und behebst du mit KI-Unterstützung.
Wir begleiten dich dabei.

## Dein Branch

Du arbeitest auf einem eigenen Branch:

```
training-<MMJJ>/<vorname-nachname>
```

Beispiel für Juni 2026, Max Mustermann:

```bash
git checkout -b training-0626/max-mustermann
```

## Aufgaben

Die Aufgaben liegen im Ordner **`/tasks/`**. Du beauftragst Copilot CLI im Klartext,
lässt dir den Plan zeigen und prüfst das Ergebnis — am Ende mit `/review`.
Plan-Modus: `Shift + Tab` wechselt den Modus.

## Wo Skills und Agents liegen

| Was | Ordner | Aufruf |
|-----|--------|--------|
| Skills | `.claude/skills/` | `/review`, `/write-ticket`, `/update-agent-files` — `/skills` zeigt alle |
| Subagents | `.github/agents/` | `/agent` zeigt und wählt sie. Oder im Klartext: „Nutze den `be-reviewer` …" |
| Projektregeln | `CLAUDE.md` | Copilot CLI liest die Datei automatisch |

Die Skills liegen im Ordner `.claude/skills/`, weil beide unterstützten KI-Tools sie gemeinsam nutzen — den Ordnernamen kannst du ignorieren.
Die Dateien in `.github/agents/` sind generiert. Bitte nicht von Hand ändern.

## Nützliche Befehle

| Befehl | Zweck |
|--------|-------|
| `/review` | Code-Änderungen prüfen, mit iterativem Feedback (Projekt-Skill) |
| `/model` | KI-Modell wählen |
| `/agent` | Subagents anzeigen und auswählen |
| `/skills` | Skills anzeigen |
| `/context` | Kontext-Auslastung anzeigen |
| `/compact` | Kontext komprimieren |
| `/help` | Hilfe zu Copilot CLI |

## Weiterführende Dokumentation

| Dokument | Inhalt |
|----------|--------|
| [SETUP.md](SETUP.md) | Ausführliche Installation, Linux, Alternativen |
| [CHEATSHEET-COPILOT-CLI.md](CHEATSHEET-COPILOT-CLI.md) | Copilot CLI Spickzettel für Einsteiger |
| [Systemspezifikationen](specs/SPECS.md) | Architektur, API-Specs, Coding-Konventionen |

---

**Fragen?** Schau in die Specs oder frag uns. Viel Erfolg — wir freuen uns auf dich!
