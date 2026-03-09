# Infrastructure Specification

## Project Structure

```
coding-with-ai-lab/
├── backend/                    # CRM Backend (Spring Boot, Java 21)
│   ├── pom.xml
│   ├── data/                   # H2 database files (gitignored)
│   └── src/main/java/com/crm/
│       ├── controller/         # REST endpoints
│       ├── service/            # Business logic
│       ├── repository/         # JPA repositories
│       ├── mapper/             # DTO ↔ Entity mappers
│       ├── entity/             # JPA entities + enums
│       ├── dto/                # Java records
│       ├── security/           # JWT validation
│       ├── config/             # Spring configuration
│       ├── exception/          # Error handling
│       └── seed/               # DataSeeder
├── ciam/                       # Identity & Access Management (Spring Boot, Kotlin)
│   ├── pom.xml
│   ├── data/                   # H2 database files (gitignored)
│   ├── keys/                   # RSA key pair (gitignored)
│   └── src/main/kotlin/com/crm/ciam/
│       ├── controller/
│       ├── service/
│       ├── repository/
│       ├── mapper/
│       ├── entity/
│       ├── dto/
│       ├── security/           # JWT signing, permissions, rate limiting
│       ├── config/             # RSA key pair, security
│       ├── exception/
│       └── seed/               # UserSeeder
├── frontend/                   # Angular 21 SPA
│   ├── package.json
│   ├── angular.json
│   ├── proxy.conf.json
│   └── src/app/
│       ├── core/               # Services, models, guards, interceptors
│       ├── features/           # Feature modules (one per entity)
│       └── layout/             # Navbar, sidebar
├── docs/
│   ├── architecture.md
│   ├── adr/                    # Architecture Decision Records (4)
│   ├── prds/                   # Product Requirement Documents (9)
│   ├── uxdr/                   # UX Design Records (1)
│   ├── reviews/                # Code reviews
│   └── specs/                  # This specification
├── .claude/
│   ├── agents/                 # 13 Claude agents
│   └── skills/                 # 2 Claude skills
├── start.sh                    # Full-stack launcher
├── CLAUDE.md                   # AI coding instructions
└── README.MD                   # Project overview
```

## Dependencies

### Backend (pom.xml)

Parent: `spring-boot-starter-parent:3.5.3`

| Dependency | Version | Scope |
|-----------|---------|-------|
| spring-boot-starter-web | 3.5.3 | compile |
| spring-boot-starter-data-jpa | 3.5.3 | compile |
| spring-boot-starter-validation | 3.5.3 | compile |
| spring-boot-starter-security | 3.5.3 | compile |
| h2 | inherited | runtime |
| jjwt-api | 0.12.6 | compile |
| jjwt-impl | 0.12.6 | runtime |
| jjwt-jackson | 0.12.6 | runtime |
| spring-boot-starter-test | 3.5.3 | test |

### CIAM (pom.xml)

Parent: `spring-boot-starter-parent:3.5.3`

Same as backend plus:

| Dependency | Version |
|-----------|---------|
| kotlin-stdlib | 2.1.10 |
| kotlin-reflect | 2.1.10 |
| jackson-module-kotlin | inherited |

Build: `kotlin-maven-plugin:2.1.10` with spring + jpa compiler plugins.

### Frontend (package.json)

| Dependency | Version |
|-----------|---------|
| @angular/* | ^21.2.1 |
| @angular/cdk | ^21.2.1 |
| @ng-bootstrap/ng-bootstrap | ^20.0.0 |
| bootstrap | ^5.3.8 |
| @fortawesome/angular-fontawesome | ^4.0.0 |
| @fortawesome/fontawesome-svg-core | ^7.2.0 |
| @fortawesome/free-solid-svg-icons | ^7.2.0 |
| ag-grid-angular | ^35.1.0 |
| chart.js | ^4.5.1 |
| ng2-charts | ^10.0.0 |
| rxjs | ~7.8.0 |
| zone.js | ~0.15.0 |
| typescript (dev) | ~5.9.2 |
| @angular/cli (dev) | ^21.2.1 |

## Databases

### CRM Database (backend/data/crmdb)

- Engine: H2 file-based
- URL: `jdbc:h2:file:./data/crmdb;DB_CLOSE_ON_EXIT=FALSE;AUTO_RECONNECT=TRUE`
- Credentials: sa / (empty)
- DDL: Hibernate auto-update
- Tables: firma, person, abteilung, adresse, gehalt, aktivitaet, vertrag, chance, dashboard_config, saved_report

### CIAM Database (ciam/data/ciamdb)

- Engine: H2 file-based
- URL: `jdbc:h2:file:./data/ciamdb;DB_CLOSE_ON_EXIT=FALSE;AUTO_RECONNECT=TRUE`
- Credentials: sa / (empty)
- DDL: Hibernate auto-update
- Tables: benutzer, benutzer_rollen, refresh_token

## Startup

### start.sh

Launches full stack in order:

1. **CIAM** (Port 8081) — must start first to generate RSA keys
2. **Backend** (Port 8080) — needs CIAM's public key at `../ciam/keys/public.pem`
3. **Frontend** (Port 4200) — Angular dev server with proxy

Flags:
- `--reset-db` — Delete H2 database files before starting
- `--no-demo` — Disable demo mode

### Manual Start

```bash
cd ciam && mvn spring-boot:run          # Start CIAM first
cd backend && mvn spring-boot:run       # Then backend
cd frontend && npx ng serve --proxy-config proxy.conf.json  # Then frontend
```

## Configuration

### Environment Variables

| Variable | Default | Service | Description |
|----------|---------|---------|-------------|
| JWT_PUBLIC_KEY_PATH | ../ciam/keys/public.pem | Backend | RSA public key path |
| JWT_KEY_DIR | ./keys | CIAM | RSA key pair directory |
| CORS_ORIGINS | http://localhost:4200 | Both | Allowed CORS origins |
| COOKIE_SECURE | true | CIAM | HTTPS-only refresh cookies |

### Ports

| Service | Port |
|---------|------|
| CIAM | 8081 |
| Backend | 8080 |
| Frontend | 4200 |

## Documentation

| Directory | Contents |
|-----------|---------|
| docs/architecture.md | System diagram, microservice boundaries |
| docs/adr/ | 4 Architecture Decision Records |
| docs/prds/ | 9 Product Requirement Documents |
| docs/uxdr/ | 1 UX Design Record |
| docs/reviews/ | Code review reports |
| docs/specs/ | System specifications (this) |

## No CI/CD

No Docker, GitHub Actions, GitLab CI, or other pipeline configurations. Local development only.
