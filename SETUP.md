# Setup — AI Coding Lab

Diese Anleitung beschreibt, wie du deine Arbeitsumgebung für das **AI Coding Lab** einrichtest: Laufzeitumgebung, AI-Assistent, IDE und Markdown-Viewer. Nach Abschluss kannst du das Projekt starten und mit Claude Code produktiv arbeiten.

## Inhalt

- [Node.js](#nodejs)
- [Claude Code](#claude-code)
- [IDE](#ide)
- [Markdown-Viewer](#markdown-viewer)

## Node.js

**Node.js 20.19 oder neuer** (Voraussetzung für Angular 21). npm wird mit Node.js mitgeliefert.

### Node.js installieren

#### macOS

```bash
# Option 1: Homebrew (empfohlen)
brew install node@22

# Option 2: nvm (Node Version Manager)
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.3/install.sh | bash
nvm install 22
```

#### Windows

> **Voraussetzung für Claude Code:** Unter Windows benötigt Claude Code zusätzlich **Git for Windows** (liefert die `bash`-Shell, auf die Claude Code angewiesen ist). Installation:
> ```powershell
> winget install --id Git.Git -e --source winget
> ```
> Alternativ manuell über den Installer: https://git-scm.com/download/win

```powershell
# Option 1: Offizielle Installer von https://nodejs.org/ herunterladen und ausführen

# Option 2: winget
winget install OpenJS.NodeJS.LTS

# Option 3: nvm-windows (https://github.com/coreybutler/nvm-windows)
nvm install 22
nvm use 22
```

> **Wichtig bei der Installation über den offiziellen Installer:**
> Im Installationsdialog die Checkbox **"Automatically install the necessary tools. [...]"** aktivieren. Damit werden Build-Tools (Python, Visual Studio Build Tools) mitinstalliert, die für native Module wie `better-sqlite3` benötigt werden.
>
> <!-- TODO: Screenshot des Installer-Dialogs einfügen (z.B. docs/images/node-installer-tools-checkbox.png) -->
>
> **Bei Berechtigungsproblemen** (z.B. wenn Skripte nicht ausgeführt werden dürfen) in PowerShell folgenden Befehl ausführen:
> ```powershell
> Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
> ```

#### Linux (Ubuntu/Debian)

```bash
# Option 1: NodeSource-Repository (empfohlen)
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt-get install -y nodejs

# Option 2: nvm (Node Version Manager)
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.3/install.sh | bash
nvm install 22
```

#### Linux (Fedora/RHEL)

```bash
# Option 1: NodeSource-Repository
curl -fsSL https://rpm.nodesource.com/setup_22.x | sudo bash -
sudo dnf install -y nodejs

# Option 2: nvm
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.3/install.sh | bash
nvm install 22
```

### Version prüfen

```bash
node --version   # Muss v20.19.0 oder neuer sein
npm --version    # Wird mit Node.js mitgeliefert
```

## Claude Code

[Claude Code](https://www.claude.com/product/claude-code) ist Anthropics offizielles CLI für AI-gestütztes Programmieren. Im AI Coding Lab nutzen wir Claude Code, um Features zu planen, zu implementieren und zu reviewen.

### Installation

Claude Code wird plattformübergreifend via npm installiert (Node.js muss bereits eingerichtet sein):

```bash
npm install -g @anthropic-ai/claude-code
```

Unter Windows ist zusätzlich **Git for Windows** erforderlich (siehe [Windows-Abschnitt](#windows) oben).

### Erste Schritte

Im Projektverzeichnis starten:

```bash
claude
```

Beim ersten Start führt Claude Code durch die Anmeldung (Browser-basiertes OAuth mit einem Anthropic-Konto oder API-Key). Danach steht der AI-Assistent im Terminal zur Verfügung.

## IDE

Für das AI Coding Lab empfehlen wir Teilnehmenden **Visual Studio Code**, wenn sie noch keine bevorzugte IDE haben. Wer bereits mit IntelliJ IDEA, WebStorm, Cursor o.ä. arbeitet, kann diese weiter verwenden.

### Visual Studio Code

Kostenlos, plattformübergreifend, mit guter TypeScript- und Angular-Unterstützung und einer offiziellen Claude-Code-Integration.

**Installation:**

```bash
# macOS
brew install --cask visual-studio-code

# Windows
winget install Microsoft.VisualStudioCode

# Linux
# Paketmanager (snap, apt, dnf) oder Download von https://code.visualstudio.com/
```

Alternativ: Installer von https://code.visualstudio.com/ herunterladen.

**Empfohlene Extensions:**

- **Angular Language Service** — Autovervollständigung und Diagnostik für Angular-Templates
- **ESLint** — Linting für TypeScript und JavaScript
- **Prettier** — automatische Code-Formatierung

## Markdown-Viewer

Viele Projektdokumente (README, SETUP, PRDs, Pläne) sind in Markdown geschrieben. Ein Viewer mit Live-Vorschau macht das Lesen und Schreiben angenehmer.

### Option A — Visual Studio Code (alle Plattformen)

VS Code bringt eine eingebaute Markdown-Vorschau mit. Tastenkombination: `Cmd+Shift+V` (macOS) bzw. `Ctrl+Shift+V` (Windows/Linux). Empfohlen, wenn VS Code ohnehin installiert wird.

### Option B — macOS: MacDown

[MacDown](https://macdown.app/) ist ein kostenloser Open-Source-Markdown-Editor mit Echtzeit-Vorschau — ideal für Terminal-Nutzer, die keinen Editor mit GUI nutzen.

```bash
brew install --cask macdown
```

Alternativ: Download von https://macdown.app/.

### Option C — Windows: MarkText

[MarkText](https://www.marktext.cc/) ist ein kostenloser, quelloffener Markdown-Editor mit WYSIWYG-Vorschau.

```powershell
winget install marktext.marktext
```

Alternativ: Installer von https://www.marktext.cc/.
