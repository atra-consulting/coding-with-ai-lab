# Welcome to Coding with AI

## Purpose of This Training

Get hands-on experience in coding with AI. This training teaches you to effectively use AI tools (Claude, Copilot) to implement features, fix bugs, and accelerate your development workflow in a real full-stack application.

## Target Group

Developers with basic AI knowledge. No prior experience with the CRM application required.

## Training Setup

You'll work with a default CRM application (full-stack: Java/Spring Boot backend, Angular frontend, Kotlin CIAM service) that contains a set of pre-planned features and bugs. Throughout the training, you'll implement these features and fixes with AI assistance. We're here to guide you.

## What You Need to Get Started

- **AI subscription**: Claude (Claude.com) or GitHub Copilot
- **Node.js & npm**: For frontend development
- **Java**: JDK 21+ for backend
- **Git CLI**: For version control, branching, and creating PRs with Claude

## How to Start the Project

First, clone the repository:

```bash
git clone https://github.com/atra-consulting/coding-with-ai-lab.git
cd coding-with-ai-lab
```

Then from the root folder:

```bash
./start.sh
```

This starts the entire stack:
- Backend: http://localhost:7070
- Frontend: http://localhost:7200
- CIAM service: http://localhost:8081

## Branching Convention

Create your own branch using this format:

```
training-<MMYY>/<firstnamelastname>
```

Example: `training-0304/john-doe` (March 2024, John Doe)

## How to Work on Tasks

1. Find tasks in `/docs/tasks`
2. Use the **`plan-and-do`** skill to get started on any task:
   - Type `/plan-and-do` with your task description
   - The skill handles planning, implementation, testing, and code review automatically

## Useful Commands

These commands help you work more effectively in Claude Code:

| Command | Purpose |
|---------|---------|
| `/plan-and-do <task>` | Start end-to-end implementation (planning → coding → testing → review) |
| `/review` | Review code changes with multi-round feedback cycle |
| `/simplify` | Analyze code for quality, reuse, and efficiency improvements |
| `/help` | Get help with Claude Code features |
| `/clear` | Clear the conversation history |

## Playwright-MCP: Browser Automation

Playwright-MCP is a powerful tool that allows AI to interact with your application directly in the browser. Use it to:

- **Take screenshots** of the UI to visually validate changes
- **Fill forms and click buttons** to test features
- **Navigate** through the application and verify workflows
- **Test edge cases** and user interactions automatically
- **Debug UI issues** by seeing what the application looks like

With Playwright-MCP, you can ask the AI to navigate your application, perform actions, and verify that everything works as expected. This is especially useful when testing frontend features or validating that your code changes work correctly in the UI.

## Full Documentation

For detailed architecture, API specs, and coding conventions, see the [system specifications](./specs/SPECS.md).

---

**Questions?** Check the specs or ask for help. Happy coding! 🚀
