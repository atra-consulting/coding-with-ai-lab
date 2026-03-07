# CIAM Microservice Specification

Separate Identity & Access Management service at Port 8081. Spring Boot 3.5.3, Kotlin 2.1.10, Java 21.

## Entities

### Benutzer

| Field | Type | Constraints |
|-------|------|------------|
| id | Long | PK, auto-generated |
| benutzername | String | unique, max 50, not null |
| passwort | String | BCrypt hash, not null |
| vorname | String | max 100, not null |
| nachname | String | max 100, not null |
| email | String | unique, max 255, not null |
| aktiv | Boolean | default true, not null |
| rollen | Set\<BenutzerRolle\> | @ElementCollection, eager fetch |
| createdAt | LocalDateTime | auto-set |
| updatedAt | LocalDateTime | auto-set |

### RefreshToken

| Field | Type | Constraints |
|-------|------|------------|
| id | Long | PK, auto-generated |
| token | String | unique, not null (UUID) |
| benutzer | Benutzer | ManyToOne, FK benutzer_id, not null |
| expiryDate | Instant | not null |
| createdAt | Instant | not null |

### Enums

**BenutzerRolle**: `ADMIN`, `VERTRIEB`, `PERSONAL`

**Permission** (11 values): `DASHBOARD`, `FIRMEN`, `PERSONEN`, `ABTEILUNGEN`, `ADRESSEN`, `AKTIVITAETEN`, `GEHAELTER`, `VERTRAEGE`, `CHANCEN`, `AUSWERTUNGEN`, `BENUTZERVERWALTUNG`

## Role-Permission Mapping

| Permission | ADMIN | VERTRIEB | PERSONAL |
|-----------|-------|----------|----------|
| DASHBOARD | x | x | x |
| FIRMEN | x | x | x |
| PERSONEN | x | x | x |
| ABTEILUNGEN | x | x | x |
| ADRESSEN | x | x | x |
| AKTIVITAETEN | x | x | x |
| GEHAELTER | x | | x |
| VERTRAEGE | x | x | |
| CHANCEN | x | x | |
| AUSWERTUNGEN | x | x | x |
| BENUTZERVERWALTUNG | x | | |

ADMIN gets all permissions automatically via `EnumSet.allOf()`.

## API Endpoints

### AuthController (`/api/auth`)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/auth/demo-mode` | public | Returns `{"enabled": boolean}` |
| POST | `/api/auth/login` | public | Login, returns access token + refresh cookie |
| POST | `/api/auth/refresh` | public | Refresh access token via cookie |
| POST | `/api/auth/logout` | public | Invalidate refresh token, clear cookie |
| GET | `/api/auth/me` | JWT | Current user info + permissions |

**Login request**: `{ benutzername: string, passwort: string }`
**Login response**: `{ accessToken, benutzername, vorname, nachname, rollen[] }`
**Refresh response**: `{ accessToken }`
**Me response**: `{ id, benutzername, vorname, nachname, email, rollen[], permissions[] }`

### BenutzerController (`/api/benutzer`)

All endpoints require `ROLE_ADMIN`.

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/benutzer` | List users (search, page, size, sort) |
| GET | `/api/benutzer/{id}` | Get user by ID |
| POST | `/api/benutzer` | Create user |
| PUT | `/api/benutzer/{id}` | Update user |
| PATCH | `/api/benutzer/{id}/toggle-active` | Toggle active (cannot toggle self) |

**BenutzerCreate**: `{ benutzername, passwort? (min 8), vorname, nachname, email, rollen: Set<String>, aktiv }`

### JwksController

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/.well-known/jwks.json` | public | RSA public key in JWK format |

## JWT Specification

- **Algorithm**: RS256 (RSA-2048 asymmetric)
- **Key pair**: Auto-generated on first start at `ciam/keys/` (PEM format)
- **Access token expiration**: 15 minutes (900000ms)
- **Refresh token expiration**: 7 days (604800000ms)

**Access token claims**:

| Claim | Source |
|-------|--------|
| sub | benutzername |
| benutzerId | benutzer.id |
| rollen | list of role names |
| permissions | list of permission names (resolved from roles) |
| vorname | benutzer.vorname |
| nachname | benutzer.nachname |
| iat | issued at |
| exp | expiration |

**Refresh token cookie**:
- Name: `refreshToken`
- HttpOnly: true, Secure: configurable, SameSite: Strict
- Path: `/api/auth`, MaxAge: 7 days

## Security

- **Rate limiting**: POST `/api/auth/login` — max 10 attempts per 5 minutes per IP
- **Password encoding**: BCrypt
- **Session**: Stateless (no server-side sessions)
- **CORS**: Configurable origins (default `http://localhost:4200`)
- **Headers**: Frame-Options Deny, HSTS 1 year, Content-Type no-sniff

## Seed Users

| Username | Password | Roles |
|----------|----------|-------|
| admin | admin123 | ADMIN |
| vertrieb | test123 | VERTRIEB |
| personal | test123 | PERSONAL |
| allrounder | test123 | VERTRIEB + PERSONAL |
| demo | demo1234 | ADMIN |

## Database

- **H2 file-based**: `ciam/data/ciamdb`
- **Tables**: `benutzer`, `benutzer_rollen` (join table), `refresh_token`
- **DDL**: Hibernate auto-update
