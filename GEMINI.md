# GEMINI.md

## Project Overview
Full-stack CRM application with a dedicated CIAM (Identity & Access Management) microservice. 
- **Backend**: Spring Boot 3.5.3 (Java 21)
- **CIAM**: Kotlin (Spring Boot 3.5.3)
- **Frontend**: Angular 21
- **Database**: H2 file-based (separate for CRM and CIAM)

## Architectural Rules

### Backend (`com.crm`)
- **Resource Server**: The CRM backend is a pure resource server. No auth endpoints; all auth is delegated to CIAM.
- **Entity Patterns**: Every entity must follow the pattern: `Entity` → `*DTO` + `*CreateDTO` (Java records) → `*Mapper` → `*Repository` → `*Service` → `*Controller`.
- **JWT Validation**: Uses RSA-2048 asymmetric signing. Validates tokens using the public key from CIAM.
- **Authorization**: Every controller MUST have `@PreAuthorize` using either permission-based (`hasAuthority('PERMISSION')`) or role-based (`hasAnyRole(...)`) checks.
- **Persistence**: `open-in-view=false`. Lazy collections must be handled within `@Transactional(readOnly = true)` service methods.

### CIAM (Kotlin)
- **Responsibilities**: Login, JWT issuance (RS256), user management, and JWKS endpoint.
- **Security**: Signs tokens with a private RSA key. Public key is exposed via JWKS and shared via the filesystem.
- **Domain**: Uses Kotlin for the implementation.

### Frontend (Angular)
- **Standalone Components**: Uses Angular 21 standalone components exclusively.
- **Dependency Injection**: Prefers `inject(Service)` over constructor injection.
- **Control Flow**: Uses modern `@if`, `@for`, and `@switch` syntax.
- **Forms**: Reactive forms with `FormBuilder`.
- **Permissions**: Routes must be protected with `canActivate: [permissionGuard('PERMISSION')]`.

## Coding Standards
- **Java**: Version 21.
- **Spring Boot**: Version 3.5.3.
- **Angular**: Version 21.
- **Build Tools**: Maven for backend/CIAM, npm/Angular CLI for frontend.

### Build & Run Commands
- `./start.sh` - Full stack start (CIAM:8081, Backend:7070, Frontend:7200)
- `cd ciam && mvn spring-boot:run` - Start CIAM service
- `cd backend && mvn spring-boot:run` - Start Backend service
- `cd frontend && npx ng serve --port 7200` - Start Frontend
- `cd backend && mvn clean compile` - Backend compile check
- `cd frontend && npx ng build` - Frontend build check

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
- Ensure all architectural mandates from `CLAUDE.md` are preserved.
