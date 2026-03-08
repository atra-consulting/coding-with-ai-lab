# Systemarchitektur

## Ziele & Stakeholder

### Fachliche Ziele

| Ziel | Beschreibung |
|---|---|
| Kundenbeziehungen verwalten | Firmen, Personen, Abteilungen und Adressen zentral pflegen |
| Vertriebspipeline steuern | Chancen (Opportunities) durch Phasen tracken, Umsatzprognosen ableiten |
| Vertraege & Gehaelter verwalten | Vertragshistorie und Gehaltsstrukturen pro Person fuehren |
| Aktivitaeten protokollieren | Anrufe, E-Mails, Meetings und Aufgaben als Timeline erfassen |
| Auswertungen erstellen | Konfigurierbare Reports ueber alle Entitaeten |

### Qualitaetsziele

| Prioritaet | Qualitaetsziel | Beschreibung |
|:---:|---|---|
| 1 | Sicherheit | Strikte Authentifizierung (RS256 JWT) und feingranulare Autorisierung (Permission-basiert) |
| 2 | Wartbarkeit | Klare Schichtentrennung, einheitliche Patterns (Entity → DTO → Mapper → Service → Controller) |
| 3 | Erweiterbarkeit | Neue Entitaeten und Permissions ohne Aenderungen an der Sicherheitsarchitektur hinzufuegbar |

### Stakeholder

| Rolle | Erwartung |
|---|---|
| Vertrieb | Firmen, Personen und Chancen effizient verwalten, Pipeline-Uebersicht (Kanban Board) |
| Personal | Gehaelter und Vertraege einsehen und verwalten |
| Admin | Benutzerverwaltung, vollstaendiger Systemzugriff |

## Randbedingungen

### Technische Randbedingungen

| Randbedingung | Hintergrund |
|---|---|
| Java 21 / Kotlin | Spring Boot 3.5.x erfordert mindestens Java 17, Projekt nutzt Java 21 |
| Spring Boot 3.5.3 | Backend-Framework fuer CRM und CIAM |
| Angular 20 | Frontend-Framework (Standalone Components, Signal-basiert) |
| H2 (file-based) | Eingebettete Datenbank, kein externer DB-Server noetig |
| Maven | Build-Tool fuer beide Spring Boot Services |

### Organisatorische Randbedingungen

| Randbedingung | Hintergrund |
|---|---|
| Lokale Entwicklung | Kein Docker/Kubernetes — alle Services laufen lokal via `start.sh` |
| Deutsches Domaenenmodell | Fachliche Begriffe (Firma, Person, Gehalt, Chance) auf Deutsch |
| Kein Flyway/Liquibase | Schema wird von Hibernate auto-generiert (`ddl-auto`) |

## Service-Uebersicht

Das System besteht aus drei Services:

```mermaid
graph TB
    subgraph Browser
        FE["Frontend<br/><i>Angular 20</i><br/>:4200"]
    end

    subgraph "Microservices"
        CIAM["CIAM Service<br/><i>Spring Boot (Kotlin)</i><br/>:8081"]
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

## Verteilungssicht

### Entwicklung (aktuell)

```mermaid
graph TB
    subgraph "Entwickler-Rechner"
        subgraph "Prozesse"
            CIAM["CIAM<br/>Spring Boot (Kotlin)<br/>:8081"]
            CRM["CRM Backend<br/>Spring Boot (Java)<br/>:8080"]
            NG["Angular Dev Server<br/>+ Proxy<br/>:4200"]
        end

        subgraph "Dateisystem"
            KEYS["ciam/keys/<br/>private.pem + public.pem"]
            CIAMDB[("ciam/data/ciamdb<br/>H2 File")]
            CRMDB[("backend/data/crmdb<br/>H2 File")]
        end

        CIAM --> CIAMDB
        CIAM --> KEYS
        CRM --> CRMDB
        CRM -. "liest public.pem" .-> KEYS
        NG -- ":8081" --> CIAM
        NG -- ":8080" --> CRM
    end

    Browser["Browser"] -- ":4200" --> NG
```

Alle drei Prozesse laufen auf demselben Rechner. `start.sh` orchestriert den Start in der richtigen Reihenfolge. Die H2-Datenbanken und RSA-Keys liegen im Dateisystem — kein externer Service noetig.

### Produktion (geplant)

| Aspekt | Dev (aktuell) | Produktion (geplant) |
|---|---|---|
| Datenbank | H2 file-based | PostgreSQL |
| Key-Verteilung | Dateisystem (`../ciam/keys/`) | Secret Manager / Vault |
| Key-Rotation | Manuell (Keys loeschen, neustarten) | Automatisch via JWKS + Key-ID |
| Frontend | Angular Dev Server mit Proxy | Nginx mit statischen Assets |
| Service Discovery | Feste Ports (8080, 8081) | Service Registry oder Reverse Proxy |

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

## Qualitaetsanforderungen

```mermaid
mindmap
  root((Qualitaet))
    Sicherheit
      RS256 JWT-Signierung
      Permission-basierte Autorisierung
      Kein Klartext-Passwort (BCrypt)
      Refresh-Token Rotation
    Wartbarkeit
      Einheitliche Schichtarchitektur
      Konsistente Namenskonventionen
      ADRs fuer Architekturentscheidungen
    Erweiterbarkeit
      Neue Entitaeten ohne Security-Aenderungen
      Permission-System via Enums erweiterbar
      Modularer Frontend-Aufbau (Lazy Loading)
    Benutzbarkeit
      Responsive UI (Bootstrap 5)
      Kanban Board fuer Pipeline
      Toast-Benachrichtigungen bei Fehlern
```

### Qualitaetsszenarien

| ID | Qualitaetsziel | Szenario | Massnahme |
|---|---|---|---|
| Q1 | Sicherheit | Ein Benutzer ohne `GEHAELTER`-Permission ruft `/api/gehaelter` auf | `@PreAuthorize` lehnt mit 403 ab |
| Q2 | Sicherheit | Ein JWT wird manipuliert | RSA-Signaturpruefung schlaegt fehl → 401 |
| Q3 | Wartbarkeit | Neue Entitaet "Projekt" soll hinzugefuegt werden | 7 Backend-Dateien + 8 Frontend-Dateien nach dokumentiertem Pattern |
| Q4 | Erweiterbarkeit | Neue Permission "PROJEKTE" wird benoetigt | Enum-Eintrag in CIAM + Rollen-Mapping, kein Code-Change in CRM |
| Q5 | Benutzbarkeit | Vertrieb will Chancen zwischen Phasen verschieben | Drag & Drop im Kanban Board mit optimistischem Update |

## Risiken & Technische Schulden

| # | Risiko / Schuld | Auswirkung | Gegenmassnahme |
|---|---|---|---|
| R1 | H2 als Datenbank | Nicht produktionsgeeignet, keine Concurrency | Migration auf PostgreSQL vor Produktivbetrieb |
| R2 | Key-Verteilung ueber Dateisystem | Funktioniert nur auf einem Rechner | JWKS-Endpoint ist vorbereitet (`/.well-known/jwks.json`) |
| R3 | Kein DB-Migrationstools | Schema-Aenderungen koennen Daten verlieren (`ddl-auto`) | Flyway/Liquibase einfuehren vor Produktivbetrieb |
| R4 | Kein Health-Check / Monitoring | Ausfaelle werden nicht erkannt | Spring Actuator aktivieren |
| R5 | Keine Container-Orchestrierung | Manueller Start via `start.sh` | Docker Compose als naechster Schritt |
| R6 | Hibernate `open-in-view=false` | Lazy-Loading-Fehler bei vergessener `@Transactional` | Code-Convention in CLAUDE.md dokumentiert |

## Glossar

| Begriff (DE) | Uebersetzung (EN) | Beschreibung |
|---|---|---|
| **Firma** | Company | Kundenfirma mit Kontaktdaten, zentrales Objekt im CRM |
| **Person** | Contact/Person | Ansprechpartner innerhalb einer Firma |
| **Abteilung** | Department | Organisationseinheit einer Firma |
| **Adresse** | Address | Standort einer Firma oder Person |
| **Gehalt** | Salary | Gehaltseintrag einer Person (Grundgehalt, Bonus, Provision, Sonderzahlung) |
| **Aktivitaet** | Activity | Protokollierte Interaktion (Anruf, E-Mail, Meeting, Notiz, Aufgabe) |
| **Vertrag** | Contract | Vereinbarung mit einer Firma (Entwurf → Aktiv → Abgelaufen/Gekuendigt) |
| **Chance** | Opportunity | Verkaufschance im Pipeline-Prozess (Neu → Qualifiziert → Angebot → Verhandlung → Gewonnen/Verloren) |
| **Benutzer** | User | Systembenutzer, verwaltet im CIAM-Service |
| **Rolle** | Role | Berechtigungsgruppe (Admin, Vertrieb, Personal) |
| **Permission** | Permission | Feingranulare Berechtigung, abgeleitet aus Rolle |
| **CIAM** | Customer IAM | Identity & Access Management Microservice |
| **Auswertung** | Report | Konfigurierbarer Report ueber CRM-Daten |
| **Dashboard** | Dashboard | Benutzerspezifische Startseite mit konfigurierbaren Widgets |
