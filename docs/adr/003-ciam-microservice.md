# ADR-003: CIAM-Microservice-Architektur

**Status**: Entschieden
**Datum**: 2026-03-02
**Bezug**: [PRD-009: CIAM-Microservice-Extraktion](../prds/009-ciam-microservice.md)

## Kontext

Die Authentifizierungs- und Autorisierungslogik war bisher direkt im CRM-Backend eingebettet. Bei wachsender Komplexitaet (weitere Microservices, mobile Clients) wird die enge Kopplung zum Problem. Dieses ADR dokumentiert die Entscheidungen zur Extraktion in einen eigenen Identity-Service.

---

## Entscheidung 1: Separater Service vs. eingebettet

### Option A: Auth bleibt im CRM-Backend

**Vorteile:**
- Keine zusaetzliche Infrastruktur, einfacheres Deployment.
- Kein Inter-Service-Kommunikation noetig.

**Nachteile:**
- Benutzer-Entity und Auth-Logik sind eng mit CRM-Domain gekoppelt.
- Weitere Microservices muessten das CRM-Backend fuer Auth-Validierung kontaktieren.
- Single Responsibility Principle verletzt.

### Option B: Separater CIAM-Microservice

**Vorteile:**
- Klare Trennung: Identity-Management vs. CRM-Domain.
- Weitere Resource Server koennen denselben CIAM nutzen.
- Unabhaengig deploybar und skalierbar.

**Nachteile:**
- Hoehere Ops-Komplexitaet (zwei JVM-Prozesse statt einem).
- Key-Verteilung zwischen Services noetig.

### Entscheidung: Option B — Separater CIAM-Microservice

Separation of Concerns ueberwiegt. Das CRM-Backend wird zum reinen Resource Server, der CIAM uebernimmt Login, Token-Ausstellung und Benutzerverwaltung. Die Ops-Komplexitaet ist im Dev-Kontext (start.sh) beherrschbar.

---

## Entscheidung 2: JWT-Signing — Symmetrisch vs. Asymmetrisch

### Option A: HMAC-SHA (Shared Secret)

**Vorteile:**
- Einfach: Ein einzelner Secret-String genuegt.
- Schneller als asymmetrische Kryptographie.

**Nachteile:**
- Shared Secret: Jeder Service, der validieren will, braucht das Secret und koennte damit auch Tokens signieren.
- Secret-Rotation erfordert gleichzeitige Aenderung auf allen Services.

### Option B: RS256 (Asymmetrisch, RSA)

**Vorteile:**
- Nur der CIAM besitzt den Private Key — er allein kann Tokens signieren.
- Resource Server brauchen nur den Public Key fuer Validierung.
- Public Key kann ueber JWKS-Endpoint veroeffentlicht werden.
- Zukunftssicher fuer zusaetzliche Resource Server.

**Nachteile:**
- Etwas komplexer: Key-Pair-Generierung und PEM-Handling.
- Minimal langsamer als HMAC (irrelevant bei 15-Min-Token-Laufzeit).

### Entscheidung: Option B — RS256

Der Sicherheitsvorteil (kein Shared Secret auf Resource Servern) und die Zukunftssicherheit (JWKS-Endpoint) ueberwiegen die minimale Mehrarbeit. Der CIAM generiert ein RSA-2048 Key Pair beim ersten Start und stellt den Public Key als PEM-Datei und ueber `/.well-known/jwks.json` bereit.

---

## Entscheidung 3: Permissions im JWT vs. separater Lookup

### Option A: Nur Rollen im JWT, Permissions per Lookup

**Vorteile:**
- Kleinerer Token.
- Permissions koennen sich aendern, ohne Token zu invalidieren.

**Nachteile:**
- Resource Server muss RolePermissionMapping kennen oder eine API aufrufen.
- Bei separatem Service: Netzwerk-Roundtrip pro Request.

### Option B: Rollen UND Permissions als JWT-Claims

**Vorteile:**
- Resource Server ist komplett stateless — kein DB-Lookup oder API-Call noetig.
- Frontend kann Permissions direkt aus dem Token lesen (nach Decode).
- CIAM ist Single Source of Truth fuer die Berechtigungsmatrix.

**Nachteile:**
- Groesserer Token (in Praxis: ~20 Bytes mehr fuer 10 Permission-Strings).
- Permission-Aenderungen greifen erst nach Token-Refresh (max. 15 Min.).

### Entscheidung: Option B — Rollen UND Permissions im JWT

Der Wegfall des DB-Lookups auf dem Resource Server ist der Hauptgrund fuer die Extraktion. 15 Minuten Verzoegerung bei Permission-Aenderungen ist im CRM-Kontext akzeptabel. Das Frontend liest Permissions weiterhin ueber `/api/auth/me` vom CIAM.

---

## Entscheidung 4: Key-Verteilung

### Option A: File-basiert (Dev/Staging)

CIAM schreibt PEM-Dateien nach `ciam/keys/`, CRM-Backend liest `../ciam/keys/public.pem`. Konfigurierbar via `jwt.public-key-path`.

### Option B: JWKS-Endpoint (Produktion)

`GET /.well-known/jwks.json` liefert den Public Key im JWK-Format. Resource Server fetcht den Key beim Start.

### Entscheidung: Option A fuer Dev, JWKS als Zukunftssicherung

Fuer die aktuelle Single-Machine-Entwicklung ist File-Sharing am einfachsten. Der JWKS-Endpoint wird bereits implementiert, um den Wechsel auf Netzwerk-basierte Key-Verteilung in Produktion vorzubereiten.

---

## Zusammenfassung

| Entscheidung | Gewaehlte Option |
|---|---|
| Service-Topologie | Separater CIAM-Microservice |
| JWT-Signing | RS256 (asymmetrisch) |
| Authorization-Daten | Rollen + Permissions als JWT-Claims |
| Key-Verteilung | File-basiert (Dev), JWKS-Endpoint (Prod-ready) |

**Leitprinzip:** Der CIAM ist die einzige Stelle, die Benutzer und Credentials verwaltet und Tokens signiert. Resource Server validieren Tokens stateless mit dem Public Key und lesen Berechtigungen aus den Claims — ohne eigene Auth-Logik oder DB-Zugriff.
