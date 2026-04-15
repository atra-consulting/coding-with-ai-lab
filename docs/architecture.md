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
| 1 | Sicherheit | Session-basierte Authentifizierung und permission-basierte Autorisierung |
| 2 | Wartbarkeit | Klare Schichtentrennung, einheitliche Patterns (Schema → Service → Route) |
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
| Node.js 20.19+ | Mindestversion, wird von `start.sh` geprueft |
| TypeScript | Sprache fuer Backend und Typdefinitionen |
| Express 4.21 | HTTP-Framework fuer das Backend |
| Angular 21 | Frontend-Framework (Standalone Components) |
| SQLite (better-sqlite3) | Eingebettete Datenbank, kein externer DB-Server noetig |
| Drizzle ORM | Type-safe ORM fuer Datenbankzugriff und Schema-Definition |

### Organisatorische Randbedingungen

| Randbedingung | Hintergrund |
|---|---|
| Lokale Entwicklung | Kein Docker/Kubernetes — beide Prozesse laufen lokal via `start.sh` |
| Deutsches Domaenenmodell | Fachliche Begriffe (Firma, Person, Gehalt, Chance) auf Deutsch |
| Kein Migrationstool | Schema wird per Custom-Skript in `config/migrate.ts` erstellt |

## System-Uebersicht

Das System besteht aus zwei Prozessen: einem Backend und einem Frontend.

```mermaid
graph TB
    subgraph Browser
        FE["Frontend<br/><i>Angular 21</i><br/>:7200"]
    end

    subgraph "Backend"
        BE["CRM Backend<br/><i>Node.js / Express</i><br/>:7070"]
    end

    subgraph "Dateisystem"
        DB[("SQLite<br/><i>backend/data/crmdb.sqlite</i><br/>Firmen, Personen, Benutzer, ...")]
        USERS["config/users.ts<br/><i>In-Memory Benutzer</i>"]
    end

    FE -- "/api/* (alle Routen)" --> BE
    BE --> DB
    BE --> USERS
```

## Session-Authentifizierungsflow

```mermaid
sequenceDiagram
    participant B as Browser
    participant P as Angular Proxy
    participant BE as Backend :7070

    Note over B,BE: 1. Login

    B->>P: POST /api/auth/login<br/>{benutzername, passwort}
    P->>BE: Weiterleitung an Backend
    BE->>BE: Benutzername in users.ts suchen<br/>Passwort mit bcrypt pruefen<br/>Session anlegen
    BE-->>P: 200 {benutzername, rollen, permissions}<br/>+ Set-Cookie: connect.sid
    P-->>B: Response durchreichen

    Note over B,BE: 2. API-Zugriff

    B->>P: GET /api/firmen<br/>Cookie: connect.sid=...
    P->>BE: Weiterleitung an Backend
    BE->>BE: Session laden<br/>requirePermission('FIRMEN') pruefen
    BE-->>P: 200 [Firmen-Daten]
    P-->>B: Response durchreichen

    Note over B,BE: 3. Aktuellen Benutzer abfragen

    B->>P: GET /api/auth/me<br/>Cookie: connect.sid=...
    P->>BE: Weiterleitung an Backend
    BE-->>P: 200 {benutzername, rollen, permissions}
    P-->>B: Response durchreichen

    Note over B,BE: 4. Logout

    B->>P: POST /api/auth/logout<br/>Cookie: connect.sid=...
    P->>BE: Weiterleitung an Backend
    BE->>BE: Session zerstoeren
    BE-->>P: 200 + Cookie loeschen
    P-->>B: Response durchreichen
```

## Permission-Modell

```mermaid
graph LR
    subgraph "config/users.ts (In-Memory)"
        U1["admin<br/>Rolle: ADMIN"]
        U2["user<br/>Rolle: USER"]
        U3["demo<br/>Rolle: ADMIN"]
        AP["ALL_PERMISSIONS"]
    end

    subgraph "Session"
        SC["permissions:<br/>[FIRMEN, PERSONEN,<br/>GEHAELTER, CHANCEN, ...]"]
    end

    subgraph "Backend Middleware"
        RA["requireAuth"]
        RP["requirePermission('GEHAELTER')"]
        RR["requireRole('ADMIN')"]
    end

    subgraph "Frontend"
        PG["permissionGuard('GEHAELTER')"]
        SI["Sidebar-Eintrag<br/>permission: 'GEHAELTER'"]
    end

    U1 & U2 & U3 --> AP
    AP --> SC
    SC --> RA
    RA --> RP & RR
    SC --> PG
    PG --> SI
```

### Benutzer & Berechtigungen

| Benutzername | Passwort | Rolle | Permissions |
|---|---|---|---|
| admin | admin123 | ADMIN | Alle |
| user | test123 | USER | Alle |
| demo | demo1234 | ADMIN | Alle |

Alle drei Benutzer haben derzeit `ALL_PERMISSIONS`. Die Passwort-Hashes sind per bcrypt (Cost 10) vorab generiert und in `config/users.ts` hartcodiert.

### Berechtigungsmatrix

| Permission | admin | user | demo | Route-Middleware |
|---|:---:|:---:|:---:|---|
| FIRMEN | x | x | x | `requirePermission('FIRMEN')` |
| PERSONEN | x | x | x | `requirePermission('PERSONEN')` |
| ABTEILUNGEN | x | x | x | `requirePermission('ABTEILUNGEN')` |
| ADRESSEN | x | x | x | `requirePermission('ADRESSEN')` |
| AKTIVITAETEN | x | x | x | `requirePermission('AKTIVITAETEN')` |
| GEHAELTER | x | x | x | `requirePermission('GEHAELTER')` |
| VERTRAEGE | x | x | x | `requirePermission('VERTRAEGE')` |
| CHANCEN | x | x | x | `requirePermission('CHANCEN')` |
| BENUTZERVERWALTUNG | x | x | x | `requirePermission('BENUTZERVERWALTUNG')` |

### Durchsetzung

Die Berechtigungsmatrix wird an **zwei Stellen** durchgesetzt:

1. **Backend** (`requirePermission()`): API-Endpoints pruefen die Permission in `middleware/auth.ts`.
2. **Frontend** (Sidebar, Route Guards): UI-Elemente werden basierend auf Permissions ein-/ausgeblendet.

Die Permissions sind direkt am Benutzer-Objekt in `config/users.ts` gespeichert. Das Backend liest sie aus der Session. Das Frontend empfaengt sie per `GET /api/auth/me`.

## Proxy-Routing

```mermaid
graph LR
    subgraph "Frontend Proxy (proxy.conf.json)"
        R1["/api/*<br/>(alle API-Pfade)"]
    end

    BE["Backend :7070"]

    R1 --> BE
```

Eine einzige Proxy-Regel leitet alle `/api`-Pfade an das Backend weiter. Kein Split-Routing noetig, da es nur einen Backend-Prozess gibt.

## Backend-Architektur

```mermaid
graph TB
    subgraph "Express App (src/index.ts)"
        MW["Middleware<br/>express-session, cors, json"]
    end

    subgraph "Routes (src/routes/)"
        RA["auth.ts"]
        RF["firmen.ts"]
        RP["personen.ts"]
        RAB["abteilungen.ts"]
        RAD["adressen.ts"]
        RAK["aktivitaeten.ts"]
        RG["gehaelter.ts"]
        RV["vertraege.ts"]
        RC["chancen.ts"]
    end

    subgraph "Services (src/services/)"
        SF["FirmenService"]
        SP["PersonenService"]
        SO["...weitere Services"]
    end

    subgraph "Datenbank"
        DS["db/schema/schema.ts<br/>(Drizzle Schema)"]
        DM["config/migrate.ts<br/>(CREATE TABLE)"]
        DB[("backend/data/crmdb.sqlite")]
    end

    subgraph "Auth Middleware"
        AM["middleware/auth.ts<br/>requireAuth<br/>requireRole()<br/>requirePermission()"]
    end

    MW --> RA & RF & RP & RAB & RAD & RAK & RG & RV & RC
    RF & RP & RAB & RAD & RAK & RG & RV & RC --> AM
    RF --> SF
    RP --> SP
    SF & SP & SO --> DS
    DS --> DB
    DM --> DB
```

Jede Route-Datei erzwingt Authentifizierung und Autorisierung via Middleware. Danach delegiert sie an einen Service, der Drizzle-Queries ausfuehrt.

## Paginierung

Das Backend gibt Listenendpunkte im Spring Data Page Format zurueck. Das Frontend erwartet dieses Format.

```
{
  content: [...],
  totalElements: 150,
  totalPages: 15,
  size: 10,
  number: 0,      // 0-indiziert
  first: true,
  last: false
}
```

Wichtig: NgbPagination im Frontend ist 1-indiziert. Service-Aufrufe rechnen mit `this.currentPage - 1` um.

## Verteilungssicht

### Entwicklung (aktuell)

```mermaid
graph TB
    subgraph "Entwickler-Rechner"
        subgraph "Prozesse"
            BE["CRM Backend<br/>Node.js / Express<br/>tsx --watch<br/>:7070"]
            NG["Angular Dev Server<br/>+ Proxy<br/>ng serve<br/>:7200"]
        end

        subgraph "Dateisystem"
            DB[("backend/data/crmdb.sqlite<br/>SQLite")]
            USERS["backend/src/config/users.ts<br/>In-Memory Benutzer"]
        end

        BE --> DB
        BE --> USERS
        NG -- ":7070 (alle /api/*)" --> BE
    end

    Browser["Browser"] -- ":7200" --> NG
```

Beide Prozesse laufen auf demselben Rechner. `start.sh` startet Backend und Frontend in der richtigen Reihenfolge. Die SQLite-Datei liegt im Dateisystem — kein externer Service noetig.

### Produktion (geplant)

| Aspekt | Dev (aktuell) | Produktion (geplant) |
|---|---|---|
| Datenbank | SQLite file-based | PostgreSQL |
| Benutzer | Hartcodiert in `config/users.ts` | Datenbank-gestuetzte Benutzerverwaltung |
| Frontend | Angular Dev Server mit Proxy | Nginx mit statischen Assets |
| Prozessstart | Manuell via `start.sh` | Docker Compose oder Systemd |

## Startup-Reihenfolge

```mermaid
sequenceDiagram
    participant S as start.sh
    participant BE as Backend :7070
    participant FE as Frontend :7200

    S->>BE: npx tsx --watch src/index.ts
    BE->>BE: SQLite-Datei oeffnen
    BE->>BE: config/migrate.ts ausfuehren (CREATE TABLE IF NOT EXISTS)
    BE->>BE: Seed-Daten laden (falls leer)

    loop Warte auf Readiness
        S->>BE: HTTP-Check auf :7070
    end
    Note over S,BE: Backend bereit

    S->>FE: ng serve --port 7200 --proxy-config proxy.conf.json
    Note over S,FE: Beide Prozesse laufen
```

## Qualitaetsanforderungen

```mermaid
mindmap
  root((Qualitaet))
    Sicherheit
      Session-basierte Authentifizierung
      Permission-basierte Autorisierung
      BCrypt-Passwort-Hashing
      requireAuth Middleware auf allen Routen
    Wartbarkeit
      Einheitliche Schichtarchitektur
      Konsistente Namenskonventionen
      ADRs fuer Architekturentscheidungen
    Erweiterbarkeit
      Neue Entitaeten ohne Security-Aenderungen
      Permission-System via Strings erweiterbar
      Modularer Frontend-Aufbau
    Benutzbarkeit
      Responsive UI (Bootstrap 5)
      Kanban Board fuer Pipeline
      Toast-Benachrichtigungen bei Fehlern
```

### Qualitaetsszenarien

| ID | Qualitaetsziel | Szenario | Massnahme |
|---|---|---|---|
| Q1 | Sicherheit | Ein Benutzer ohne `GEHAELTER`-Permission ruft `/api/gehaelter` auf | `requirePermission('GEHAELTER')` lehnt mit 403 ab |
| Q2 | Sicherheit | Ein nicht eingeloggter Benutzer ruft eine API auf | `requireAuth` lehnt mit 401 ab |
| Q3 | Wartbarkeit | Neue Entitaet "Projekt" soll hinzugefuegt werden | 3 Backend-Dateien + 8 Frontend-Dateien nach dokumentiertem Pattern |
| Q4 | Erweiterbarkeit | Neue Permission "PROJEKTE" wird benoetigt | String in `ALL_PERMISSIONS` + `requirePermission()` auf Route + `permissionGuard()` im Frontend |
| Q5 | Benutzbarkeit | Vertrieb will Chancen zwischen Phasen verschieben | Drag & Drop im Kanban Board mit optimistischem Update |

## Risiken & Technische Schulden

| # | Risiko / Schuld | Auswirkung | Gegenmassnahme |
|---|---|---|---|
| R1 | SQLite als Datenbank | Begrenzte Concurrency, nicht fuer hohe Last geeignet | Migration auf PostgreSQL vor Produktivbetrieb |
| R2 | Benutzer hartcodiert in `config/users.ts` | Kein Self-Service, Passwortaenderung erfordert Code-Aenderung | Datenbank-gestuetzte Benutzerverwaltung einfuehren |
| R3 | Kein DB-Migrationstool | Schema-Aenderungen koennen Daten verlieren | Drizzle-Migrations oder Flyway einfuehren |
| R4 | Kein Health-Check / Monitoring | Ausfaelle werden nicht erkannt | Health-Endpoint und Logging ergaenzen |
| R5 | Keine Container-Orchestrierung | Manueller Start via `start.sh` | Docker Compose als naechster Schritt |
| R6 | Session-Speicher im Prozess-Memory | Sessions gehen bei Neustart verloren | Redis-Session-Store fuer Produktion |

## Glossar

### Domaenenbegriffe

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
| **Auswertung** | Report | Konfigurierbarer Report ueber CRM-Daten |
| **Dashboard** | Dashboard | Benutzerspezifische Startseite mit konfigurierbaren Widgets |

### Technologiebegriffe

| Begriff | Beschreibung |
|---|---|
| **Drizzle ORM** | Type-safe ORM fuer Node.js. Schema in TypeScript, Queries als Builder. |
| **better-sqlite3** | Synchrones SQLite-Treiber-Paket fuer Node.js |
| **express-session** | Session-Middleware fuer Express. Speichert Session-ID als Cookie `connect.sid`. |
| **bcryptjs** | Passwort-Hashing-Bibliothek. Cost-Faktor 10 fuer vorab generierte Hashes. |
| **tsx --watch** | TypeScript-Ausfuehrung mit Hot Reload fuer den Backend-Entwicklungsmodus |
| **Zod** | Schema-Validierungsbibliothek fuer Request-Daten im Backend |
| **Permission** | Feingranulare Berechtigung als String (z. B. `FIRMEN`, `GEHAELTER`) |
| **Rolle** | Berechtigungsgruppe eines Benutzers (`ADMIN`, `USER`) |
| **Session** | Server-seitiger Zustand nach Login, referenziert per Cookie im Browser |
