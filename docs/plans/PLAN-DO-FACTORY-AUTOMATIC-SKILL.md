# Implementation Plan: DO-FACTORY-AUTOMATIC-SKILL

## Test Command
`n/a` — skill file only (Markdown), no automated tests.

## Tasks

### 1. Create skill directory and SKILL.md

- [ ] Create `.claude/skills/do-factory-automatic/` directory
- [ ] Write `.claude/skills/do-factory-automatic/SKILL.md` with:
  - YAML front matter: `name: project:do-factory-automatic`, description, allowed-tools
  - Parameter handling: optional task-ID argument (skip step 1 if given)
  - **Step 1**: Claim next task — iterate sources `EMAIL`, `GITHUB_ISSUE`, `ERROR_REPORT`, `APP_LOG` (or `$TASK_SOURCE`); use `GET /api/agent-tasks/next?source=<X>` or `GET /api/agent-tasks/<id>`
  - **Step 2**: Dispatch `requirements-reviewer` subagent — pass `title`, `body`, `metadata`; it returns "good enough" or "reject + reason"
  - **Step 3a**: Reject — `POST /api/agent-tasks/<id>/reject` with specific comment; stop
  - **Step 3b**: Build — invoke `/project:plan-and-do` with autonomous pre-authorisation block; no `AskUserQuestion`; if build/tests fail abort → step 3a
  - **Step 4**: Done — `POST /api/agent-tasks/<id>/done` with summary + PR link; stop

### 2. Verification

- [ ] Skill file is valid YAML front matter
- [ ] All API endpoints match `docs/API-TASKS.md`
- [ ] Autonomous directives prevent any `AskUserQuestion` calls
- [ ] Skill-reviewer review passes
