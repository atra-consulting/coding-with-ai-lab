# CLAUDE.md

Project knowledge (build, conventions, entity recipe, commit rules, specs) lives in
[`AGENTS.md`](AGENTS.md) and is imported here. Only Claude-Code-specific
configuration belongs in this file.

@AGENTS.md

## Agents

| Agent | Purpose | Type |
|-------|---------|------|
| admin | Local dev environment, SQLite database, process management | ops |
| ba-reviewer | Review PRDs, specs, plans for gaps and issues | review |
| ba-writer | Create business specs, requirements, plans | writing |
| requirements-reviewer | Review requirements, user stories, PRDs for gaps and missing edge cases | review |
| be-coder | Node.js / TypeScript backend code | coding |
| be-reviewer | Review backend code, security, patterns | review |
| db-coder | Drizzle ORM queries, entity schemas, data access | coding |
| db-reviewer | Review queries, Drizzle mappings, performance | review |
| fe-coder | Angular 21 frontend code, components, services | coding |
| fe-reviewer | Review frontend code, patterns, accessibility | review |
| ui-designer | UI/UX design, layout, styling, accessibility | coding |
| ui-reviewer | Critical UI evaluation, usability, WCAG audit | review |
| be-test-coder | Write Playwright API tests for the backend | test-coding |
| be-test-reviewer | Review backend Playwright tests | test-review |
| be-test-runner | Execute backend Playwright suite, report pass/fail | test-runner |
| fe-test-coder | Write Jasmine/Karma unit tests for the frontend | test-coding |
| fe-test-reviewer | Review frontend Jasmine/Karma tests | test-review |
| fe-test-runner | Execute frontend Karma suite, report pass/fail | test-runner |
| python-coder | Cross-platform Python scripts and data analysis (tooling, not app code) | coding |
| python-reviewer | Review Python for correctness, portability, and external-data handling | review |
| shell-coder | Cross-platform shell scripts (macOS / Linux / WSL) | coding |
| shell-reviewer | Review shell scripts for portability, hangs, and safety | review |
| skill-coder | Create and update Claude Code skills and subagents | coding |
| skill-reviewer | Review Claude Code skills and subagents | review |

Agent files: `.claude/agents/`

The `python-*`, `shell-*`, and `skill-*` agents are general tooling agents — they are not bound to the CRM domain specs and instead read the root `CLAUDE.md` plus, for shell, `docs/specs/SPECS-infrastructure.md`.

## Spec Reading Lists

Each subagent in `.claude/agents/` has a `## Specifications` reading list naming its primary spec plus secondary specs. The two API-reference docs ([`SPEC-API-TASKS.md`](docs/specs/SPEC-API-TASKS.md), [`SPEC-API-TICKETS.md`](docs/specs/SPEC-API-TICKETS.md)) sit outside this convention. Spec overview: see [`AGENTS.md`](AGENTS.md).

| Spec | Scope | Primary for |
|------|-------|-------------|
| [`DOMAIN.md`](docs/specs/DOMAIN.md) | Business domain: entity meaning, relationships, delete behavior, sales pipeline, roles (no schema) | All 18 domain-bound agents (every agent except the `python-*`, `shell-*`, `skill-*` tooling agents) |
| [`SPECS.md`](docs/specs/SPECS.md) | Root index, architecture, tech stack, domain model, seed data | ba-writer, ba-reviewer |
| [`SPECS-backend.md`](docs/specs/SPECS-backend.md) | Backend API: routes, services, auth, errors, pagination, code patterns | be-coder, be-reviewer |
| [`SPECS-database.md`](docs/specs/SPECS-database.md) | Entities, schema, columns, enums, foreign keys, migrations | db-coder, db-reviewer |
| [`SPECS-frontend.md`](docs/specs/SPECS-frontend.md) | Angular architecture, routing, auth, guards, models, services, components | fe-coder, fe-reviewer |
| [`SPECS-ui.md`](docs/specs/SPECS-ui.md) | Styling, design system, AG Grid, layout & shared components | ui-designer, ui-reviewer |
| [`SPECS-testing.md`](docs/specs/SPECS-testing.md) | Playwright backend API tests, Jasmine/Karma frontend unit tests | be-test-*, fe-test-* |
| [`SPECS-infrastructure.md`](docs/specs/SPECS-infrastructure.md) | Build, config, DB engine, startup, project structure | admin |
