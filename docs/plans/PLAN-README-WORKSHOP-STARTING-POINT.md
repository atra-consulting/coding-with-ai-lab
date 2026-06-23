# Implementation Plan: README-WORKSHOP-STARTING-POINT

## Test Command
None (documentation only).

## Analysis: Content Gaps & Issues

### welcome_DE.MD and welcome_EN.MD problems
- Both reference Java/Spring Boot backend — WRONG (project is Node.js/TypeScript)
- Both reference CIAM service at localhost:8081 — does NOT exist in this project
- Both reference Gemini API Key as requirement — not mentioned in CLAUDE.md
- Branch convention differs: DE uses `training-<DDMMJJ>/<vornamenachname>`, EN uses `training-<MMYY>/<firstnamelastname>`

### README.MD problems
- Ideal for product overview, not a workshop starting point
- Missing: branch convention, how to work on tasks, useful Claude Code commands, Playwright-MCP section
- Has detailed architecture section that could just be a link
- Tech stack table incorrectly says `better-sqlite3` (it uses `@libsql/client`)

## Tasks

### 1. Restructure README.MD as workshop landing page

- [ ] Keep logo/badges header
- [ ] Short project description (2 sentences max)
- [ ] Prerequisites section: Node.js 20.19+, Git CLI, Claude Code — with link to SETUP.md for details
- [ ] Quick start section: clone + `./start.sh` / `start.bat` + URL table + `--reset-db` flag
- [ ] Demo login table (keep as-is, already correct)
- [ ] Add Workshop section: branch convention (one unified format)
- [ ] Add Workshop section: how to work on tasks (find in `/docs/tasks/`, use `/plan-and-do`)
- [ ] Add useful Claude Code commands table (from welcome files)
- [ ] Add Playwright-MCP section (from welcome files)
- [ ] Shorten architecture section to just a link to architecture.md (remove inline Mermaid)
- [ ] Fix tech stack table: replace `better-sqlite3` with `@libsql/client`
- [ ] Keep further documentation table, project structure, and license
- [ ] Update "Erstmal hier starten" callout to point to SETUP.md (already there, verify)

### 2. Update welcome_DE.MD

- [ ] Remove Java/Spring Boot backend reference → replace with Node.js/TypeScript
- [ ] Remove CIAM service (localhost:8081) reference
- [ ] Remove Gemini API Key requirement
- [ ] Align branch convention to match README
- [ ] Remove content now in README (avoid full duplication), or keep as German-only deep-dive
- [ ] Keep German-specific phrasing/context

### 3. Update welcome_EN.MD

- [ ] Same fixes as welcome_DE.MD but in English
- [ ] Remove Java/Spring Boot and CIAM references
- [ ] Remove Gemini API Key requirement
- [ ] Align branch convention to match README

## Unified Branch Convention

Use: `training-<MMJJ>/<vornamenachname>` (German) / `training-<MMYY>/<firstnamelastname>` (English)
Example DE: `training-0626/max-mustermann`
Example EN: `training-0626/john-doe`

## Tests

No code changes — no automated tests needed. Manual verification:
- [ ] README renders correctly in a Markdown viewer
- [ ] All links in README point to existing files
- [ ] No references to Java/Spring Boot or CIAM in welcome files
