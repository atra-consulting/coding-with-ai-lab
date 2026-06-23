# Welcome to AI Coding Lab

## Training Setup

- You'll work with a full-stack CRM application (Node.js/TypeScript backend, Angular frontend)
- The application contains pre-planned features and bugs
- You'll implement these features and fixes with AI assistance
- We're here to guide you

## What You Need to Get Started

- **AI subscription**: Claude (Claude.com) or GitHub Copilot
- **Node.js & npm**: For running the project
  - **Windows:** During Node.js installation, check the **"Automatically install the necessary tools. [...]"** checkbox — this installs build tools (Python, Visual Studio Build Tools) required for native modules.
  - **Windows:** If you encounter permission issues (scripts cannot be executed), run in PowerShell:
    ```powershell
    Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
    ```
- **Git CLI**: For version control, branching, and creating PRs with Claude

Full installation guide: **[SETUP.md](../SETUP.md)**

## How to Start the Project

Clone the repository:

```bash
git clone https://github.com/atra-consulting/coding-with-ai-lab.git
cd coding-with-ai-lab
```

Start the stack:

```bash
./start.sh           # macOS / Linux
start.bat            # Windows
```

| URL | Description |
|-----|-------------|
| <http://localhost:7200> | Frontend |
| <http://localhost:7070> | Backend API |

## Branching Convention

Create your own branch using this format:

```
training-<MMYY>/<firstnamelastname>
```

Example: `training-0626/john-doe` (June 2026, John Doe)

```bash
git checkout -b training-0626/john-doe
```

## How to Work on Tasks

1. Find tasks in **`/tasks/`**
2. Use the **`/plan-and-do`** skill to get started on any task:
   - Type `/plan-and-do` with your task description
   - The skill handles planning, implementation, testing, and code review automatically

## Useful Commands

| Command | Purpose |
|---------|---------|
| `/plan-and-do <task>` | End-to-end implementation (planning → coding → testing → review) |
| `/review` | Review code changes with multi-round feedback cycle |
| `/simplify` | Analyze code for quality, reuse, and efficiency improvements |
| `/help` | Get help with Claude Code features |
| `/clear` | Clear the conversation history |
| `/compact` | Compress context window |

## Playwright-MCP: Browser Automation

Playwright-MCP allows AI to interact with your running application directly in the browser:

- **Take screenshots** of the UI to visually validate changes
- **Fill forms and click buttons** to test features
- **Navigate** through the application and verify workflows
- **Test edge cases** and user interactions automatically
- **Debug UI issues** by seeing what the application looks like

## Full Documentation

For detailed architecture, API specs, and coding conventions: **[system specifications](./specs/SPECS.md)**

---

**Questions?** Check the specs or ask for help. Happy coding!
