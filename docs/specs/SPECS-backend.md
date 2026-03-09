# CRM Backend Specification

Spring Boot 3.5.3 resource server at Port 8080. Java 21. Pure JWT validation — no auth endpoints.

## Entities

### Firma

| Field | Type | Constraints |
|-------|------|------------|
| id | Long | PK, auto-generated |
| name | String | not null, max 255 |
| industry | String | max 255 |
| website | String | max 255 |
| phone | String | max 50 |
| email | String | max 255 |
| notes | String | CLOB |
| createdAt | LocalDateTime | not null, @PrePersist |
| updatedAt | LocalDateTime | not null, @PreUpdate |

**Relationships**: OneToMany to Person, Abteilung, Adresse, Aktivitaet, Vertrag, Chance (cascade ALL, orphanRemoval).

### Person

| Field | Type | Constraints |
|-------|------|------------|
| id | Long | PK |
| firstName | String | not null, max 255 |
| lastName | String | not null, max 255 |
| email | String | max 255 |
| phone | String | max 50 |
| position | String | max 255 |
| notes | String | CLOB |
| createdAt / updatedAt | LocalDateTime | auto-set |

**Relationships**: ManyToOne Firma (not null), ManyToOne Abteilung (nullable). OneToMany to Adresse, Gehalt, Aktivitaet.

### Abteilung

| Field | Type | Constraints |
|-------|------|------------|
| id | Long | PK |
| name | String | not null, max 255 |
| description | String | CLOB |

**Relationships**: ManyToOne Firma (not null). OneToMany Person.

### Adresse

| Field | Type | Constraints |
|-------|------|------------|
| id | Long | PK |
| street | String | not null, max 255 |
| houseNumber | String | max 20 |
| postalCode | String | not null, max 20 |
| city | String | not null, max 255 |
| country | String | max 255, default "Deutschland" |

**Relationships**: ManyToOne Firma (nullable), ManyToOne Person (nullable).

### Gehalt

| Field | Type | Constraints |
|-------|------|------------|
| id | Long | PK |
| amount | BigDecimal | not null, precision 12, scale 2 |
| currency | String | max 3, default "EUR" |
| effectiveDate | LocalDate | not null |
| typ | GehaltTyp | @Enumerated(STRING), not null |

**Relationships**: ManyToOne Person (not null).

### Aktivitaet

| Field | Type | Constraints |
|-------|------|------------|
| id | Long | PK |
| typ | AktivitaetTyp | @Enumerated(STRING), not null |
| subject | String | not null, max 255 |
| description | String | CLOB |
| datum | LocalDateTime | not null |
| createdAt | LocalDateTime | @PrePersist |

**Relationships**: ManyToOne Firma (nullable), ManyToOne Person (nullable).

### Vertrag

| Field | Type | Constraints |
|-------|------|------------|
| id | Long | PK |
| titel | String | not null, max 255 |
| wert | BigDecimal | precision 15, scale 2 |
| currency | String | max 3, default "EUR" |
| status | VertragStatus | @Enumerated(STRING), not null |
| startDate / endDate | LocalDate | nullable |
| notes | String | CLOB |
| createdAt / updatedAt | LocalDateTime | auto-set |

**Relationships**: ManyToOne Firma (not null), ManyToOne kontaktPerson (nullable).

### Chance

| Field | Type | Constraints |
|-------|------|------------|
| id | Long | PK |
| titel | String | not null, max 255 |
| beschreibung | String | CLOB |
| wert | BigDecimal | precision 15, scale 2 |
| currency | String | max 3, default "EUR" |
| phase | ChancePhase | @Enumerated(STRING), not null |
| wahrscheinlichkeit | Integer | 0-100 |
| erwartetesDatum | LocalDate | nullable |
| createdAt / updatedAt | LocalDateTime | auto-set |

**Relationships**: ManyToOne Firma (not null), ManyToOne kontaktPerson (nullable).

### DashboardConfig

| Field | Type | Constraints |
|-------|------|------------|
| id | Long | PK |
| benutzerId | Long | not null, unique, no JPA FK |
| config | String | max 1024 |

### SavedReport

| Field | Type | Constraints |
|-------|------|------------|
| id | Long | PK |
| benutzerId | Long | not null, no JPA FK |
| name | String | not null, max 255 |
| config | String | not null, max 2048 |
| createdAt / updatedAt | LocalDateTime | auto-set |

### Enums

- **ChancePhase**: NEU, QUALIFIZIERT, ANGEBOT, VERHANDLUNG, GEWONNEN, VERLOREN
- **GehaltTyp**: GRUNDGEHALT, BONUS, PROVISION, SONDERZAHLUNG
- **AktivitaetTyp**: ANRUF, EMAIL, MEETING, NOTIZ, AUFGABE
- **VertragStatus**: ENTWURF, AKTIV, ABGELAUFEN, GEKUENDIGT
- **ReportDimension**: PHASE, FIRMA, PERSON, MONAT, QUARTAL, JAHR
- **ReportMetrik**: ANZAHL, SUMME_WERT, DURCHSCHNITT_WERT, GEWICHTETER_WERT, GEWINNRATE

## API Endpoints

### FirmaController (`/api/firmen`) — `hasAnyRole('ADMIN', 'VERTRIEB', 'PERSONAL')`

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/firmen` | List (search, page, size, sort; default: name,asc) |
| GET | `/api/firmen/{id}` | Get by ID |
| POST | `/api/firmen` | Create → 201 |
| PUT | `/api/firmen/{id}` | Update |
| DELETE | `/api/firmen/{id}` | Delete → 204 |
| GET | `/api/firmen/{id}/personen` | Paginated persons for company |
| GET | `/api/firmen/{id}/abteilungen` | Paginated departments for company |

### PersonController (`/api/personen`) — `hasAnyRole('ADMIN', 'VERTRIEB', 'PERSONAL')`

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/personen` | List (search, page, size, sort; default: lastName,asc) |
| GET | `/api/personen/{id}` | Get by ID |
| POST | `/api/personen` | Create → 201 |
| PUT | `/api/personen/{id}` | Update |
| DELETE | `/api/personen/{id}` | Delete → 204 |

### AbteilungController (`/api/abteilungen`) — `hasAnyRole('ADMIN', 'VERTRIEB', 'PERSONAL')`

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/abteilungen` | List (page, size, sort; default: name,asc) |
| GET | `/api/abteilungen/{id}` | Get by ID |
| POST | `/api/abteilungen` | Create → 201 |
| PUT | `/api/abteilungen/{id}` | Update |
| DELETE | `/api/abteilungen/{id}` | Delete → 204 |
| GET | `/api/abteilungen/firma/{firmaId}` | All departments for company |

### AdresseController (`/api/adressen`) — `hasAnyRole('ADMIN', 'VERTRIEB', 'PERSONAL')`

Standard CRUD (page, size, sort; default: city,asc).

### GehaltController (`/api/gehaelter`) — `hasAuthority('GEHAELTER')`

Standard CRUD (page, size; default: effectiveDate,desc).

### AktivitaetController (`/api/aktivitaeten`) — `hasAnyRole('ADMIN', 'VERTRIEB', 'PERSONAL')`

Standard CRUD (page, size; default: datum,desc).

### VertragController (`/api/vertraege`) — `hasAuthority('VERTRAEGE')`

Standard CRUD (page, size; default: titel,asc).

### ChanceController (`/api/chancen`) — `hasAuthority('CHANCEN')`

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/chancen` | List (page, size; default: titel,asc) |
| GET | `/api/chancen/board/summary` | Aggregates per phase (count, totalWert) |
| GET | `/api/chancen/phase/{phase}` | By phase, paginated (default: wert,desc) |
| PUT | `/api/chancen/{id}/phase` | Update phase only (PhaseUpdateDTO) |
| GET | `/api/chancen/{id}` | Get by ID |
| POST | `/api/chancen` | Create → 201 |
| PUT | `/api/chancen/{id}` | Update |
| DELETE | `/api/chancen/{id}` | Delete → 204 |

### DashboardController (`/api/dashboard`) — `hasAnyRole('ADMIN', 'VERTRIEB', 'PERSONAL')`

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/dashboard/stats` | Aggregated dashboard statistics |
| GET | `/api/dashboard/recent-activities` | Top 10 recent activities |
| GET | `/api/dashboard/top-companies` | Top 5 companies by contract value |
| GET | `/api/dashboard/salary-statistics` | Avg salary by department (ADMIN, PERSONAL only) |

### DashboardConfigController (`/api/dashboard-config`)

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/dashboard-config` | Get config for current user |
| PUT | `/api/dashboard-config` | Save config for current user |

### SavedReportController (`/api/saved-reports`)

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/saved-reports` | List for current user |
| POST | `/api/saved-reports` | Create → 201 |
| PUT | `/api/saved-reports/{id}` | Update |
| DELETE | `/api/saved-reports/{id}` | Delete → 204 |

### AuswertungController (`/api/auswertungen`) — `hasAuthority('AUSWERTUNGEN')`

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/auswertungen/pipeline/kpis` | Pipeline KPIs |
| GET | `/api/auswertungen/pipeline/by-phase` | Aggregates per phase |
| GET | `/api/auswertungen/pipeline/top-firmen` | Top firms by chance value (limit param) |

### ReportController (`/api/auswertungen`) — `hasAuthority('AUSWERTUNGEN')`

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/auswertungen/report` | Execute dynamic report (ReportQueryDTO) |

## Security

- **JWT validation only**: Loads RSA public key from `../ciam/keys/public.pem`
- **JwtPrincipal**: `record(benutzerId, benutzername, vorname, nachname)`
- **Authority mapping**: `rollen` → `ROLE_*`, `permissions` → plain authorities
- **@EnableMethodSecurity**: Every controller has `@PreAuthorize`
- **CORS**: Configurable (default `http://localhost:4200`)
- **Session**: Stateless

## Architecture & Configuration

- **open-in-view=false**: Enforced in `application.properties`.
- **Resource Server**: The CRM backend is a pure resource server. No auth endpoints; all auth is delegated to CIAM.
- **Persistence**: All JPA collections use `FetchType.LAZY`. Lazy collections MUST be handled within `@Transactional(readOnly = true)` service methods.

## Exception Handling

| Exception | HTTP Status |
|-----------|------------|
| ResourceNotFoundException | 404 |
| MethodArgumentNotValidException | 400 (with field errors) |
| AccessDeniedException | 403 |
| IllegalArgumentException | 400 |
| DataIntegrityViolationException | 409 |
| Generic Exception | 500 |

Response format: `{ status, message, timestamp, fieldErrors? }`

## Code Pattern

Each entity follows: Entity → DTO + CreateDTO (Java records) → Mapper (static) → Repository → Service (@Transactional) → Controller (@PreAuthorize).

- All FetchType.LAZY. Services use `@Transactional(readOnly = true)` for reads.
- Mappers: `toDTO(entity)`, `toEntity(createDTO, ...fks)`, `applyToEntity(createDTO, entity)`.
- Pagination: `page`/`size`/`sort` query params. Sort parsed as `String[]`.
