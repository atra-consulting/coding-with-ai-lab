# GEMINI.md

## System Overview
Full-stack CRM application with a dedicated CIAM (Identity & Access Management) microservice. 
Detailed specifications for all layers (Backend, CIAM, Frontend, Infrastructure) are located in `docs/specs/`.

## Architectural Mandates
All development must strictly adhere to the rules defined in the specification documents:
- **Backend Rules**: See `docs/specs/SPECS-backend.md` (Entity patterns, JWT, `@PreAuthorize`, `open-in-view=false`).
- **CIAM Rules**: See `docs/specs/SPECS-ciam.md` (Kotlin, RS256, User management).
- **Frontend Rules**: See `docs/specs/SPECS-frontend.md` (Standalone components, `inject()`, modern control flow, Reactive forms).
- **Infrastructure**: See `docs/specs/SPECS-infrastructure.md` for ports, databases, and startup commands.

## Gemini-Specific Instructions

### Subagents
The following specialized subagents are available. Use them by calling the corresponding tool when a task falls within their expertise. Note: The `experimental.enableAgents` flag in `settings.json` must be set to `true` to use these.

| Agent | Expertise | Use Case |
|-------|-----------|----------|
| `admin` | Ops & Env | Local dev environment, H2 DB management, process control. |
| `be-coder` | Backend | Implementation of Java/Kotlin backend logic and CIAM features. |
| `fe-coder` | Frontend | Angular component development, services, and state management. |
| `db-coder` | Database | JPA queries, entity schemas, and data access optimization. |
| `ba-writer` | Business | Creating specifications, PRDs, and implementation plans. |
| `ui-designer` | Design | CSS/SCSS styling, layout adjustments, and UI consistency. |
| `web-tester` | Testing | End-to-end testing, bug reproduction, and edge case validation. |
| `be-reviewer` | Review | Backend code quality, security audits, and pattern compliance. |
| `fe-reviewer` | Review | Frontend code quality, accessibility, and Angular best practices. |
| `ba-reviewer` | Review | Validation of business requirements and gap analysis in specs. |
| `db-reviewer` | Review | JPA mapping reviews and query performance analysis. |
| `ui-reviewer` | Review | Usability audits and WCAG accessibility compliance. |
| `md-reader` | Documentation| Searching and summarizing markdown-based documentation. |

### Skills
Activate specialized skills using `activate_skill` to receive expert procedural guidance:

- `plan-and-do`: Use for complex, multi-step tasks requiring a structured implementation plan.
- `review`: Use when performing comprehensive code or specification reviews to ensure adherence to standards.

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
