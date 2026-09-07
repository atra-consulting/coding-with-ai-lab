# Welcome to the AI Coding Lab

Glad to have you on board. This document gets you ready **before** the training starts.

You install a few tools, grab the project, and run it once on your machine.
Once the application opens in your browser, you are done — nothing else is needed up front.

⏱️ **Time needed:** about 30–45 minutes
💻 **Platforms:** macOS and Windows (for Linux see [SETUP.md](SETUP.md))

> **Important:** Please finish this **before day one of the training**. That way we spend no session time on installs.
> If something breaks: no stress. Reach out to us, we will help.

---

## What you install

| Tool | What for | Required |
|------|----------|----------|
| [Git](https://git-scm.com/) | Clone the repository, branches, commits | ✅ |
| [Node.js](https://nodejs.org/) (includes npm) | Run backend and frontend | ✅ |
| [Claude Code](https://docs.claude.com/en/docs/claude-code/overview) | The AI assistant we work with | ✅ |
| [Visual Studio Code](https://code.visualstudio.com/) | Editor / IDE | Recommended |
| [Homebrew](https://brew.sh/) (macOS only) | Package manager for the installs | ✅ (macOS) |
| Markdown viewer | Read tasks and specs | Optional |

> **You need a Claude plan.** Claude Code requires an active subscription (Pro or Max) at [claude.com](https://claude.com/pricing), or API credits.
> Check with us or your IT which access is set up for you.

---

# Part 1 — Installation

Pick your section: [macOS](#macos) or [Windows](#windows).

---

## macOS

We install everything with **Homebrew**. Open the **Terminal** app
(Spotlight: `Cmd + Space`, then type "Terminal").

### Step 1 — Install Homebrew

First check whether Homebrew is already there:

```bash
brew --version
```

Get a version number? Move on to step 2.
Get "command not found"? Then install Homebrew:

```bash
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
```

At the end the installer prints two commands you still need to run
(they add Homebrew to your `PATH`). Copy them and run them.
Then close the Terminal and open it again.

🔗 [brew.sh](https://brew.sh/)

### Step 2 — Install Git

macOS often ships with Git already. Check:

```bash
git --version
```

No output, or a very old version? Then run:

```bash
brew install git
```

🔗 [git-scm.com](https://git-scm.com/)

### Step 3 — Install Node.js

```bash
brew install node@24
```

Homebrew may tell you at the end that Node still needs linking.
Follow the `brew link` hint it prints, or run:

```bash
echo 'export PATH="/opt/homebrew/opt/node@24/bin:$PATH"' >> ~/.zshrc
source ~/.zshrc
```

Check:

```bash
node --version   # must be v20.19.0 or newer
npm --version
```

🔗 [nodejs.org](https://nodejs.org/)

### Step 4 — Install Claude Code

```bash
npm install -g @anthropic-ai/claude-code
```

Check:

```bash
claude --version
```

🔗 [Claude Code docs](https://docs.claude.com/en/docs/claude-code/overview)

### Step 5 — Install Visual Studio Code (recommended)

```bash
brew install --cask visual-studio-code
```

🔗 [code.visualstudio.com](https://code.visualstudio.com/)

### Step 6 — Markdown viewer (optional)

VS Code previews Markdown out of the box: `Cmd + Shift + V`.
If you prefer a dedicated app:

```bash
brew install --cask macdown
```

🔗 [macdown.app](https://macdown.app/)

➡️ **Continue with [Part 2 — Run the project](#part-2--run-the-project).**

---

## Windows

We install everything with **winget**, the Windows package manager
(pre-installed on Windows 10 / 11).

Open **PowerShell**: press the Windows key, type "PowerShell", hit Enter.
[Windows Terminal](https://aka.ms/terminal) is even nicer to work in.

Check that winget is there:

```powershell
winget --version
```

Get an error? Install the [App Installer from the Microsoft Store](https://aka.ms/getwinget).

### Step 1 — Install Git

```powershell
winget install --id Git.Git -e --source winget
```

> **Important:** On Windows, Claude Code needs the `bash` shell from **Git for Windows**.
> Without Git, Claude Code will not work properly. So do not skip this.

Then **close and reopen** PowerShell, and check:

```powershell
git --version
```

🔗 [git-scm.com/download/win](https://git-scm.com/download/win)

### Step 2 — Install Node.js

```powershell
winget install --id OpenJS.NodeJS.LTS -e
```

Or download the installer from [nodejs.org](https://nodejs.org/) and run it.

> **When using the official installer:** tick the checkbox
> **"Automatically install the necessary tools. […]"**.
> That pulls in Python and the Visual Studio Build Tools, which Node needs for native modules.

**Reopen** PowerShell, then check:

```powershell
node --version   # must be v20.19.0 or newer
npm --version
```

🔗 [nodejs.org](https://nodejs.org/)

### Step 3 — Set the execution policy

By default Windows blocks scripts such as `npm` or `ng`.
Run this once in PowerShell:

```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

Confirm with `Y`.

### Step 4 — Install Claude Code

```powershell
npm install -g @anthropic-ai/claude-code
```

Check:

```powershell
claude --version
```

🔗 [Claude Code docs](https://docs.claude.com/en/docs/claude-code/overview)

### Step 5 — Install Visual Studio Code (recommended)

```powershell
winget install --id Microsoft.VisualStudioCode -e
```

🔗 [code.visualstudio.com](https://code.visualstudio.com/)

### Step 6 — Markdown viewer (optional)

VS Code previews Markdown directly: `Ctrl + Shift + V`.
If you want a dedicated app:

```powershell
winget install --id marktext.marktext -e
```

🔗 [marktext.cc](https://www.marktext.cc/)

➡️ **Continue with Part 2.**

---

# Part 2 — Run the project

From here on, macOS and Windows are nearly identical.

## Step 7 — Clone the repository

Move into the folder where you keep your projects. Then:

```bash
git clone https://github.com/atra-consulting/coding-with-ai-lab.git
cd coding-with-ai-lab
```

🔗 [github.com/atra-consulting/coding-with-ai-lab](https://github.com/atra-consulting/coding-with-ai-lab)

## Step 8 — Start the application

**macOS:**

```bash
./start.sh
```

**Windows (PowerShell):**

```powershell
.\start.bat
```

The script handles everything:

1. Checks Node.js and the ports
2. Installs the dependencies (`npm install`) — the first run takes a few minutes
3. Starts the backend on port **7070**
4. Starts the frontend on port **7200**

Wait until the terminal shows:

```
=== CRM Application Started ===

  >>>  http://localhost:7200  <<<
```

☕ **First run:** 3–5 minutes is normal. After that it takes seconds.

## Step 9 — Log in and verify

Open <http://localhost:7200> in your browser and sign in:

| User | Password | Role |
|------|----------|------|
| `admin` | `admin123` | Admin |
| `user` | `test123` | User |
| `demo` | `demo1234` | Admin |

You now see the CRM with sample data: companies, people, activities, opportunities.

**To stop:** press `Ctrl + C` in the terminal. Or run `./end.sh` / `end.bat`.

## Step 10 — Sign in to Claude Code

Stay in the project folder and run:

```bash
claude
```

On first launch Claude Code opens your browser and walks you through sign-in
(Anthropic account or API key). After that the assistant runs in your terminal.

Try it with a simple question:

```
What does this project do?
```

---

## ✅ Your checklist

You are ready when every line checks out:

- [ ] `git --version` returns a version
- [ ] `node --version` returns **v20.19.0 or newer**
- [ ] `npm --version` returns a version
- [ ] `claude --version` returns a version
- [ ] Repository is cloned
- [ ] `./start.sh` or `start.bat` runs without errors
- [ ] <http://localhost:7200> shows the login page
- [ ] Logging in with `admin` / `admin123` works
- [ ] `claude` starts in the project folder and answers

**All green? Perfect. See you at the training.** 🎉

---

## Trouble? First aid

| Problem | Fix |
|---------|-----|
| `command not found: brew` | Reopen the Terminal. Otherwise add the `PATH` commands the Homebrew installer printed. |
| `command not found: node` / `npm` | Reopen the Terminal or PowerShell. The install updates `PATH` only for new sessions. |
| Node is too old (< 20.19) | Reinstall: `brew install node@24` or `winget install --id OpenJS.NodeJS.LTS -e`. |
| Windows: "… cannot be loaded because running scripts is disabled …" | Run `Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser` (see step 3). |
| `Port 7070 is already in use` | An old instance is still running. Run `./end.sh` or `end.bat`, then start again. |
| `npm install` fails | Delete `backend/node_modules` and `frontend/node_modules`, then start again. |
| Database is broken or full of test junk | `./start.sh --reset-db` or `start.bat --reset-db` — recreates the SQLite DB. |
| Agent endpoints return 401 | `backend/.env` is missing. Run the start script again — it creates the file from `.env.example`. |
| Claude Code will not start (Windows) | Is Git for Windows installed? Claude Code needs its `bash`. |

Full guide with Linux, `nvm`, and alternatives: **[SETUP.md](SETUP.md)**

---

# What to expect in the training

Just for orientation — none of this needs doing up front.

## The project

A full-stack CRM application: **Node.js/TypeScript** backend, **Angular** frontend.
It ships with prepared features and bugs. You build and fix them with AI support.
We guide you along the way.

## Your branch

You work on your own branch:

```
training-<MMYY>/<firstname-lastname>
```

Example for June 2026, John Doe:

```bash
git checkout -b training-0626/john-doe
```

## Tasks

Tasks live in the **`/tasks/`** folder. You start one with the `/plan-and-do` skill
in Claude Code — it handles planning, implementation, testing, and review.

## Useful commands

| Command | Purpose |
|---------|---------|
| `/plan-and-do <task>` | End-to-end: planning → coding → testing → review |
| `/review` | Review code changes with a multi-round feedback cycle |
| `/simplify` | Check code for quality, reuse, and efficiency |
| `/help` | Get help with Claude Code |
| `/clear` | Clear the conversation history |
| `/compact` | Compress the context window |

## Playwright MCP: browser automation

This lets the AI drive the running application right in the browser:

- **Take screenshots** and validate changes visually
- **Fill forms and click buttons** to test features
- **Navigate** the application and verify workflows
- **Test edge cases** automatically
- **Debug UI issues** by seeing what you see

## Further documentation

| Document | Content |
|----------|---------|
| [SETUP.md](SETUP.md) | Detailed installation, Linux, alternatives |
| [CHEATSHEET-CLAUDE-CODE.md](CHEATSHEET-CLAUDE-CODE.md) | Claude Code cheat sheet for beginners |
| [System specifications](specs/SPECS.md) | Architecture, API specs, coding conventions |

---

**Questions?** Check the specs or ask us. Happy coding — we are looking forward to it!
