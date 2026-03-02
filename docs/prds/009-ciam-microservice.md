# PRD-009: CIAM-Microservice-Extraktion

## 1. Uebersicht

Die Authentifizierungs- und Autorisierungslogik wird aus dem CRM-Backend in einen eigenen CIAM-Microservice (Customer Identity & Access Management) extrahiert. Das CRM-Backend wird zum reinen Resource Server, der JWTs validiert.

## 2. Problemstellung

- **Enge Kopplung**: Benutzer-Entity, Login, Token-Generierung und CRM-Domain sind im selben Deployment.
- **Shared Secret**: HMAC-SHA-basierte JWTs erfordern, dass jeder Service das gleiche Secret kennt.
- **Keine Skalierung**: Weitere Microservices koennten die Auth-Logik nicht wiederverwenden.
- **FK-Abhaengigkeiten**: `DashboardConfig` und `SavedReport` haben JPA-FKs zur Benutzer-Entity.

## 3. Ziele

- Authentifizierung und Benutzerverwaltung laufen in einem eigenen Service (Port 8081).
- JWT-Signing wechselt auf RS256 (asymmetrisch) — CIAM signiert, CRM validiert.
- CRM-Backend braucht keinen DB-Zugriff fuer Autorisierung (Rollen/Permissions aus JWT-Claims).
- Frontend-Code bleibt unveraendert — Proxy-Config routet transparent.
- `start.sh` startet alle drei Services.

## 4. Nicht-Ziele

- OAuth2/OIDC-Compliance (spaetere Iteration).
- Zentralisierte Session-Verwaltung ueber mehrere Resource Server.
- Produktions-Deployment (Docker, Kubernetes).

## 5. Architektur

```
┌──────────────┐     /api/auth, /api/benutzer     ┌──────────────┐
│              │ ──────────────────────────────────►│              │
│   Frontend   │                                    │  CIAM :8081  │
│   :4200      │     /api/* (rest)                  │  (H2 DB)     │
│              │ ──────────────┐                    └──────────────┘
└──────────────┘               │                           │
                               ▼                    RSA Public Key
                        ┌──────────────┐                   │
                        │  CRM :8080   │◄──────────────────┘
                        │  (H2 DB)     │   validates JWT
                        └──────────────┘
```

### JWT-Flow

1. Frontend sendet Login-Request an CIAM (`POST /api/auth/login`).
2. CIAM authentifiziert, signiert JWT mit RSA Private Key (Claims: `sub`, `benutzerId`, `rollen`, `permissions`).
3. Frontend sendet API-Requests an CRM mit `Authorization: Bearer <JWT>`.
4. CRM validiert JWT mit RSA Public Key, liest Rollen/Permissions aus Claims.

## 6. Anforderungen

### 6.1 CIAM-Service (Port 8081)

| Endpoint | Methode | Beschreibung |
|---|---|---|
| `/api/auth/login` | POST | Login, JWT + Refresh-Cookie |
| `/api/auth/refresh` | POST | Neuer Access-Token |
| `/api/auth/logout` | POST | Refresh-Token invalidieren |
| `/api/auth/me` | GET | Benutzerinfo mit Permissions |
| `/api/auth/demo-mode` | GET | Demo-Modus-Flag |
| `/api/benutzer` | CRUD | Benutzerverwaltung (ADMIN) |
| `/.well-known/jwks.json` | GET | RSA Public Key (JWK-Format) |

### 6.2 CRM-Backend (Port 8080)

- Reiner Resource Server — keine Auth-Endpoints.
- JWT-Validierung mit RSA Public Key (konfigurierbar via `jwt.public-key-path`).
- `JwtPrincipal`-Record ersetzt `BenutzerDetails` als Authentication-Principal.
- Rollen aus JWT-Claims fuer `@PreAuthorize`.

### 6.3 RSA Key Management

- CIAM generiert RSA-2048 Key Pair beim ersten Start (`ciam/keys/`).
- Private Key: Nur CIAM, zum Signieren.
- Public Key: CRM-Backend liest `../ciam/keys/public.pem`.
- JWKS-Endpoint fuer zukuenftige Netzwerk-basierte Verteilung.

### 6.4 Frontend

- Keine Code-Aenderungen noetig.
- Proxy-Config routet `/api/auth` und `/api/benutzer` an CIAM (8081), Rest an CRM (8080).

## 7. Akzeptanzkriterien

1. `./start.sh --reset-db` startet CIAM, CRM und Frontend.
2. Login ueber Frontend funktioniert (Request geht an CIAM).
3. API-Calls nach Login gehen an CRM mit gueltigem JWT.
4. Benutzerverwaltung (`/benutzer`) funktioniert ueber CIAM.
5. Token-Refresh nach Ablauf funktioniert transparent.
6. `cd ciam && mvn clean compile` erfolgreich.
7. `cd backend && mvn clean compile` erfolgreich.
8. `cd frontend && npx ng build` erfolgreich.

## 8. Architekturentscheidungen

Dokumentiert in [ADR-003: CIAM-Microservice-Architektur](../adr/003-ciam-microservice.md).

| Thema | Entscheidung |
|---|---|
| Service-Topologie | Separater CIAM-Microservice |
| JWT-Signing | RS256 (asymmetrisch) |
| Authorization-Daten | Rollen + Permissions als JWT-Claims |
| Key-Verteilung | File-basiert (Dev), JWKS-Endpoint (Prod-ready) |

## 9. Implementierung

*Wird nach Merge ergaenzt.*
