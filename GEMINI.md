# GEMINI.md

Project knowledge (build, conventions, entity recipe, commit rules) lives in
[`AGENTS.md`](AGENTS.md) and is imported here. Only Gemini-CLI-specific
configuration belongs in this file.

@AGENTS.md

## Subagents

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

## Skills

Activate specialized skills with `activate_skill` for expert procedural guidance:

- `plan-and-do`: Use for complex, multi-step tasks that need a structured implementation plan.
- `review`: Use for comprehensive code or specification reviews.

Skill files: `.gemini/skills/`

## System Configuration

Ensure `settings.json` contains:

```json
{
  "experimental": {
    "enableAgents": true
  }
}
```
