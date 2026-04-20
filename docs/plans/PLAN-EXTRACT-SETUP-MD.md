# Implementation Plan: EXTRACT-SETUP-MD

## Task

Extract software installation instructions from `README.MD` into a new top-level `SETUP.md`. Expand `SETUP.md` with Claude Code installation instructions. Add "Git for Windows" as a prerequisite for Claude Code in the Windows section. Also add IDE recommendations (Visual Studio Code for participants without an IDE) and a Markdown viewer section.

## Test Command

`N/A (docs-only change)` — manual verification via markdown preview and link checking.

## Tasks

### 1. Create `SETUP.md`

- [ ] Create new file `/SETUP.md` at repo root.
- [ ] Top-level heading: `# Setup — AI Coding Lab`.
- [ ] Short intro: explains purpose (all software installation needed to run the project and use Claude Code).
- [ ] Table of contents (anchor links): Node.js, Claude Code, IDE, Markdown-Viewer.

### 2. Move Node.js section from `README.MD`

- [ ] Move these blocks from `README.MD` lines 37–106 (section "Voraussetzungen" and its subsections) into `SETUP.md`:
  - Intro line: "Node.js 20.19 oder neuer …"
  - "Node.js installieren" with subsections: macOS, Windows, Linux (Ubuntu/Debian), Linux (Fedora/RHEL)
  - Important-notes callouts (installer tools checkbox, Set-ExecutionPolicy).
  - "Version prüfen" subsection.
- [ ] Preserve all original German wording and formatting (headings, blockquotes, code fences).

### 3. Add Claude Code section to `SETUP.md`

- [ ] New H2 section: `## Claude Code`.
- [ ] Short intro: what Claude Code is (Anthropic's CLI for AI-assisted coding) and why we install it for this lab.
- [ ] Add a link to https://www.claude.com/product/claude-code for the product overview.
- [ ] Subsection `### Installation` with a single npm install command that works cross-platform:
  ```bash
  npm install -g @anthropic-ai/claude-code
  ```
- [ ] Subsection `### Erste Schritte` briefly describing how to launch Claude Code (`claude` in the project folder) and sign in interactively.

### 4. Add "Git for Windows" prerequisite in Windows section

- [ ] In the Windows subsection under Node.js, add a note — before or after the existing installer options — that states: Claude Code on Windows requires **Git for Windows** (provides the `bash` shell Claude Code relies on).
- [ ] Include a one-line install option:
  ```powershell
  winget install --id Git.Git -e --source winget
  ```
- [ ] Link to https://git-scm.com/download/win for the manual installer.
- [ ] Phrase the requirement in German, matching the document's tone.

### 5. Add IDE section to `SETUP.md`

- [ ] New H2 section: `## IDE`.
- [ ] Short intro: empfohlene IDE für Teilnehmer ohne eigene Präferenz. Wer bereits eine IDE einsetzt (IntelliJ IDEA, WebStorm, Cursor usw.), kann diese weiter verwenden.
- [ ] Subsection `### Visual Studio Code` with:
  - Description: kostenlos, plattformübergreifend, gute TypeScript- und Angular-Unterstützung, integriert sich mit Claude Code.
  - Installationshinweise pro Plattform:
    - macOS: `brew install --cask visual-studio-code` oder Download von https://code.visualstudio.com/
    - Windows: `winget install Microsoft.VisualStudioCode` oder Installer von https://code.visualstudio.com/
    - Linux: Paketmanager oder Download von https://code.visualstudio.com/
  - Empfohlene Extensions (kurze Liste): Angular Language Service, ESLint, Prettier.

### 6. Add Markdown viewer section to `SETUP.md`

- [ ] New H2 section: `## Markdown-Viewer`.
- [ ] Short intro: Viele Dokumente im Projekt (README, SETUP, PRDs, Plans) sind Markdown. Ein Viewer hilft, sie angenehm zu lesen.
- [ ] Option A — Visual Studio Code: eingebaute Markdown-Vorschau (`Cmd/Ctrl+Shift+V`). Für Nutzer, die VS Code ohnehin installieren.
- [ ] Option B — macOS (Terminal-Nutzer): **MacDown** (https://macdown.app/), kostenloser Open-Source-Markdown-Editor mit Live-Vorschau. Installation: `brew install --cask macdown` oder Download von der Website.
- [ ] Option C — Windows: **MarkText** (https://www.marktext.cc/), kostenlos, Open Source, Echtzeit-Vorschau. Installation: `winget install marktext.marktext` oder Installer von der Website.

### 7. Update `README.MD`

- [ ] **Prominent SETUP link at the top.** Insert a blockquote callout directly below the project tagline (after line 4, before the `## Tech-Stack` heading):
  ```markdown
  > **Erstmal hier starten:** Vor dem ersten Start bitte [SETUP.md](SETUP.md) lesen — dort steht die komplette Installationsanleitung (Node.js, Claude Code, IDE, Markdown-Viewer).
  ```
  This makes the SETUP reference the first thing a new reader sees.
- [ ] Replace the entire "Voraussetzungen" block (README.MD lines 37–106) with a concise one-paragraph pointer:
  ```markdown
  ## Voraussetzungen

  Dieses Projekt benötigt **Node.js 20.19 oder neuer**, optional **Claude Code** für AI-gestützte Entwicklung sowie eine IDE und einen Markdown-Viewer. Eine vollständige Installationsanleitung für alle unterstützten Betriebssysteme findet sich in **[SETUP.md](SETUP.md)**.
  ```
- [ ] Keep everything else in `README.MD` unchanged.

### 8. Verification

- [ ] Verify `SETUP.md` renders cleanly (headings, code fences, tables, blockquotes).
- [ ] Verify `README.MD` still parses and renders: "Schnellstart" and later sections are unaffected.
- [ ] Verify all anchor links in the SETUP.md TOC resolve to the correct sections.
- [ ] Verify external URLs return 200 (claude.com product page, git-scm.com download page).
- [ ] Verify no references to the old "Voraussetzungen"/Node.js content remain orphaned in README.MD.

## Files Changed

- `/SETUP.md` (new)
- `/README.MD` (shortened)

## Tests

### Manual Verification

- [ ] Preview `SETUP.md` in a markdown renderer (e.g., GitHub, IDE preview).
- [ ] Preview `README.MD` and click the `SETUP.md` link.
- [ ] Table of contents in `SETUP.md` navigates to correct sections.
- [ ] Copy each code block into a terminal scratch and confirm syntax (no execution needed).

### Linting

- [ ] Optional: run `markdownlint` on both files if available; not a blocker for this task.

## Out of Scope

- Translating existing German text to English.
- Redesigning the README structure beyond removing the Voraussetzungen block.
- Adding screenshots (there is an existing TODO for the Windows installer screenshot; we carry it over untouched).
