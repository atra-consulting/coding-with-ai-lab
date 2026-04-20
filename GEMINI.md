# GEMINI.md

## System Overview

Full-stack CRM application. Node.js / TypeScript backend, Angular 21 frontend. Detailed specifications for every layer (Backend, Frontend, Infrastructure) are in `docs/specs/`.

## Architectural Mandates

All development must follow the rules in the specification documents:

- **Backend Rules**: See `docs/specs/SPECS-backend.md` (Express routes → services pattern, Drizzle ORM, session auth, Zod validation).
- **Frontend Rules**: See `docs/specs/SPECS-frontend.md` (standalone components, `inject()`, modern control flow, reactive forms).
- **Infrastructure**: See `docs/specs/SPECS-infrastructure.md` for ports, database, and startup commands.

## Gemini-Specific Instructions

### Subagents

The following specialized subagents are available. Call the corresponding tool when a task falls within their expertise. Note: the `experimental.enableAgents` flag in `settings.json` must be set to `true`.

| Agent | Purpose | Type |
|-------|---------|------|
| `admin` | Local dev environment, SQLite database, process management | ops |
| `ba-reviewer` | Review PRDs, specs, plans for gaps and issues | review |
| `ba-writer` | Create business specs, requirements, plans | writing |
| `be-coder` | Node.js / TypeScript backend code | coding |
| `be-reviewer` | Review backend code, security, patterns | review |
| `db-coder` | Drizzle ORM queries, entity schemas, data access | coding |
| `db-reviewer` | Review queries, Drizzle mappings, performance | review |
| `fe-coder` | Angular 21 frontend code, components, services | coding |
| `fe-reviewer` | Review frontend code, patterns, accessibility | review |
| `md-reader` | Read, search, summarize Markdown documentation | utility |
| `ui-designer` | UI/UX design, layout, styling, accessibility | coding |
| `ui-reviewer` | Critical UI evaluation, usability, WCAG audit | review |
| `be-test-coder` | Write Playwright API tests for the backend | test-coding |
| `be-test-reviewer` | Review backend Playwright tests | test-review |
| `be-test-runner` | Execute backend Playwright suite, report pass/fail | test-runner |
| `fe-test-coder` | Write Jasmine/Karma unit tests for the frontend | test-coding |
| `fe-test-reviewer` | Review frontend Jasmine/Karma tests | test-review |
| `fe-test-runner` | Execute frontend Karma suite, report pass/fail | test-runner |

Agent files: `.gemini/agents/`

### Skills

Activate specialized skills with `activate_skill` for expert procedural guidance:

- `plan-and-do`: Use for complex, multi-step tasks that need a structured implementation plan.
- `review`: Use for comprehensive code or specification reviews.

### System Configuration

Ensure `settings.json` contains:

```json
{
  "experimental": {
    "enableAgents": true
  }
}
```

## Verification

- Confirm `GEMINI.md` exists in the project root.
- Ensure all architectural mandates from `CLAUDE.md` and the specification documents are preserved.
