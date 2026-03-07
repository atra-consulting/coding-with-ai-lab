# System Specifications

Full-stack CRM application with separate CIAM microservice for Identity & Access Management.

## Architecture Overview

```
┌─────────────┐     ┌─────────────────┐     ┌──────────────┐
│  Angular 20  │────▶│  Spring Boot    │     │  CIAM        │
│  Frontend    │     │  Backend (CRM)  │     │  (Kotlin)    │
│  Port 4200   │────▶│  Port 8080      │     │  Port 8081   │
└─────────────┘     └─────────────────┘     └──────────────┘
       │                    │                       │
       │              H2 File DB              H2 File DB
       │            backend/data/           ciam/data/
       │                                        │
       └──── /api/auth, /api/benutzer ─────────▶┘
       └──── /api/* ───────────────────▶ Backend
```

- **Monorepo**: Three services in one git repo (`backend/`, `ciam/`, `frontend/`)
- **Auth flow**: CIAM signs RS256 JWTs, Backend validates with public key
- **Proxy**: Angular dev server routes auth to CIAM:8081, rest to Backend:8080
- **Databases**: Separate H2 file-based DBs, Hibernate `ddl-auto=update`

## Tech Stack

| Layer | Technology | Version |
|-------|-----------|---------|
| Backend | Spring Boot (Java) | 3.5.3 (Java 21) |
| CIAM | Spring Boot (Kotlin) | 3.5.3 (Kotlin 2.1.10) |
| Frontend | Angular | 20.3.0 |
| UI Framework | Bootstrap + ng-bootstrap | 5.3.8 / 19.0.1 |
| Charts | Chart.js + ng2-charts | 4.5.1 / 9.0.0 |
| Drag & Drop | @angular/cdk | 20.2.14 |
| JWT | JJWT | 0.12.6 |
| Database | H2 | inherited from Spring Boot parent |
| TypeScript | | 5.9.2 |

## Domain Model (German)

| Entity | Translation | Key Relationships |
|--------|------------|-------------------|
| Firma | Company | has many: Person, Abteilung, Adresse, Aktivitaet, Vertrag, Chance |
| Person | Contact | belongs to Firma, optional Abteilung; has many: Adresse, Gehalt, Aktivitaet |
| Abteilung | Department | belongs to Firma; has many Person |
| Adresse | Address | belongs to Firma or Person |
| Gehalt | Salary | belongs to Person |
| Aktivitaet | Activity | optional Firma and/or Person |
| Vertrag | Contract | belongs to Firma, optional kontaktPerson |
| Chance | Opportunity | belongs to Firma, optional kontaktPerson; has Kanban phases |
| Benutzer | User (CIAM) | has roles (ADMIN, VERTRIEB, PERSONAL) |

## Specification Documents

| Document | Scope |
|----------|-------|
| [SPECS-ciam.md](SPECS-ciam.md) | CIAM microservice: auth, JWT, users, permissions |
| [SPECS-backend.md](SPECS-backend.md) | CRM backend: entities, API endpoints, services |
| [SPECS-frontend.md](SPECS-frontend.md) | Angular frontend: components, routing, services |
| [SPECS-infrastructure.md](SPECS-infrastructure.md) | Build, config, databases, project structure |

## Seed Data

- **CIAM**: 5 users (admin, vertrieb, personal, allrounder, demo)
- **Backend**: 100 Firmen, ~250 Abteilungen, ~600 Personen, 500 Adressen, ~600 Gehaelter, 1000 Aktivitaeten, 200 Vertraege, 300 Chancen
