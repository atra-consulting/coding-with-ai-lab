# Systemarchitektur

## Service-Uebersicht

Das System besteht aus drei Services:

```mermaid
graph TB
    subgraph Browser
        FE["Frontend<br/><i>Angular 20</i><br/>:4200"]
    end

    subgraph "Microservices"
        CIAM["CIAM Service<br/><i>Spring Boot</i><br/>:8081"]
        CRM["CRM Backend<br/><i>Spring Boot</i><br/>:8080"]
    end

    subgraph "Datenbanken"
        CIAMDB[("CIAM DB<br/><i>H2</i><br/>Benutzer, Tokens")]
        CRMDB[("CRM DB<br/><i>H2</i><br/>Firmen, Personen, ...")]
    end

    subgraph "Filesystem"
        KEYS["ciam/keys/<br/>private.pem<br/>public.pem"]
    end

    FE -- "/api/auth, /api/benutzer" --> CIAM
    FE -- "/api/* (Rest)" --> CRM

    CIAM --> CIAMDB
    CRM --> CRMDB

    CIAM -. "signiert mit<br/>Private Key" .-> KEYS
    CRM -. "validiert mit<br/>Public Key" .-> KEYS
```

## JWT-Authentifizierungsflow

```mermaid
sequenceDiagram
    participant B as Browser
    participant P as Angular Proxy
    participant C as CIAM :8081
    participant R as CRM :8080

    Note over B,R: 1. Login

    B->>P: POST /api/auth/login<br/>{benutzername, passwort}
    P->>C: weiterleitung an CIAM
    C->>C: Credentials pruefen<br/>JWT mit RSA Private Key signieren
    C-->>P: 200 {accessToken}<br/>+ Set-Cookie: refreshToken
    P-->>B: Response durchreichen

    Note over B,R: 2. API-Zugriff

    B->>P: GET /api/firmen<br/>Authorization: Bearer JWT
    P->>R: weiterleitung an CRM
    R->>R: JWT mit RSA Public Key validieren<br/>Rollen + Permissions aus Claims lesen
    R-->>P: 200 [Firmen-Daten]
    P-->>B: Response durchreichen

    Note over B,R: 3. Token-Refresh (nach 15 Min.)

    B->>P: POST /api/auth/refresh<br/>Cookie: refreshToken=...
    P->>C: weiterleitung an CIAM
    C->>C: Refresh-Token validieren<br/>Neuen Access-Token signieren
    C-->>P: 200 {accessToken}
    P-->>B: Response durchreichen

    Note over B,R: 4. Logout

    B->>P: POST /api/auth/logout<br/>Cookie: refreshToken=...
    P->>C: weiterleitung an CIAM
    C->>C: Refresh-Tokens loeschen
    C-->>P: 200 + Cookie loeschen
    P-->>B: Response durchreichen
```

## Permission-Modell

```mermaid
graph LR
    subgraph "CIAM (Single Source of Truth)"
        R1["ADMIN"]
        R2["VERTRIEB"]
        R3["PERSONAL"]
        RPM["RolePermissionMapping"]
    end

    subgraph "JWT-Claims"
        RC["rollen:<br/>[ADMIN]"]
        PC["permissions:<br/>[DASHBOARD, FIRMEN,<br/>GEHAELTER, CHANCEN, ...]"]
    end

    subgraph "CRM Backend"
        AF["JwtAuthenticationFilter"]
        AU1["ROLE_ADMIN"]
        AU2["GEHAELTER"]
        AU3["CHANCEN"]
        PA["@PreAuthorize"]
    end

    R1 & R2 & R3 --> RPM
    RPM --> RC & PC
    RC & PC --> AF
    AF --> AU1 & AU2 & AU3
    AU1 & AU2 & AU3 --> PA
```

### Berechtigungsmatrix

| Permission | ADMIN | VERTRIEB | PERSONAL | Controller |
|---|:---:|:---:|:---:|---|
| DASHBOARD | x | x | x | DashboardController |
| FIRMEN | x | x | x | FirmaController |
| PERSONEN | x | x | x | PersonController |
| ABTEILUNGEN | x | x | x | AbteilungController |
| ADRESSEN | x | x | x | AdresseController |
| AKTIVITAETEN | x | x | x | AktivitaetController |
| GEHAELTER | x | | x | GehaltController |
| VERTRAEGE | x | x | | VertragController |
| CHANCEN | x | x | | ChanceController |
| BENUTZERVERWALTUNG | x | | | BenutzerController (CIAM) |

### Durchsetzung

Die Berechtigungsmatrix wird an **zwei Stellen** durchgesetzt:

1. **Backend** (`@PreAuthorize`): API-Endpoints pruefen `hasAuthority('GEHAELTER')` etc.
2. **Frontend** (Sidebar, Route Guards): UI-Elemente werden basierend auf Permissions ein-/ausgeblendet.

Die Permissions werden **nur im CIAM** definiert (`RolePermissionMapping`). Das CRM-Backend und das Frontend empfangen sie als JWT-Claims und setzen sie durch, ohne die Rolle-zu-Permission-Zuordnung selbst zu kennen.

## RSA Key Management

```mermaid
graph TD
    subgraph "Erster Start"
        KG["KeyPairConfig<br/>generiert RSA-2048"]
        KG --> PRI["ciam/keys/private.pem"]
        KG --> PUB["ciam/keys/public.pem"]
    end

    subgraph "Laufzeit"
        CIAM_JWT["CIAM JwtService"]
        CRM_JWT["CRM JwtService"]
        JWKS["/.well-known/jwks.json"]
    end

    PRI --> CIAM_JWT
    PUB --> CRM_JWT
    PUB --> JWKS

    CIAM_JWT -- "signiert JWT" --> TOKEN["Access-Token"]
    TOKEN -- "validiert JWT" --> CRM_JWT
```

| Aspekt | Dev (aktuell) | Produktion (geplant) |
|---|---|---|
| Key-Verteilung | Filesystem (`../ciam/keys/public.pem`) | JWKS-Endpoint (`/.well-known/jwks.json`) |
| Key-Rotation | Manuell (Keys loeschen, CIAM neustarten) | Automatisch mit Key-ID im JWT-Header |
| Key-Speicherung | PEM-Dateien | Secret Manager / Vault |

## Proxy-Routing

```mermaid
graph LR
    subgraph "Frontend Proxy (proxy.conf.json)"
        direction TB
        R1["/api/auth/*"]
        R2["/api/benutzer/*"]
        R3["/.well-known/*"]
        R4["/api/* (catch-all)"]
    end

    CIAM[CIAM :8081]
    CRM[CRM :8080]

    R1 --> CIAM
    R2 --> CIAM
    R3 --> CIAM
    R4 --> CRM
```

Die Reihenfolge in `proxy.conf.json` ist entscheidend: Spezifische Pfade muessen **vor** dem Catch-All `/api` stehen, da der Angular Dev Server den ersten Match verwendet.

## Startup-Reihenfolge

```mermaid
sequenceDiagram
    participant S as start.sh
    participant C as CIAM :8081
    participant R as CRM :8080
    participant F as Frontend :4200

    S->>C: mvn spring-boot:run
    C->>C: RSA Key Pair generieren/laden
    C->>C: Benutzer seeden

    loop Warte auf Readiness
        S->>C: GET /.well-known/jwks.json
    end
    Note over S,C: CIAM bereit (Keys existieren)

    S->>R: mvn spring-boot:run
    R->>R: Public Key laden (../ciam/keys/public.pem)
    R->>R: CRM-Daten seeden

    loop Warte auf Readiness
        S->>R: GET /api/firmen (erwartet 401 oder 200)
    end
    Note over S,R: Backend bereit

    S->>F: ng serve --proxy-config proxy.conf.json
    Note over S,F: Alle Services laufen
```
