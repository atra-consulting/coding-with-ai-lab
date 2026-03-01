# ADR-001: Architekturentscheidungen Authentifizierung & Benutzerverwaltung

**Status**: Entschieden
**Datum**: 2026-02-28
**Bezug**: [PRD-002: Authentifizierung & Benutzerverwaltung](../prds/002-authentication-user-management.md)

## Kontext

Das CRM-System soll um Authentifizierung und ein Benutzerkonzept erweitert werden (siehe PRD). Dabei sind mehrere architekturelle Entscheidungen zu treffen, die in diesem ADR mit Alternativen, Vor- und Nachteilen dokumentiert und entschieden werden.

**Rahmenbedingungen des Projekts:**

- Spring Boot 3.5.3 mit Java 21
- Angular 20 Frontend
- H2 file-basierte Datenbank
- Single-Instance-Deployment (kein Cluster)
- Entwicklungs-/Kleinteam-Kontext, kein High-Scale-Szenario
- Frontend und Backend laufen auf unterschiedlichen Ports (Proxy-Config vorhanden)

---

## Entscheidung 1: Authentifizierungs-Mechanismus

### Option A: JWT (Stateless)

Der Client erhält nach dem Login ein signiertes JSON Web Token, das bei jedem Request im `Authorization`-Header mitgesendet wird. Der Server validiert das Token ohne eigenen State.

**Vorteile:**

- Kein serverseitiger Session-State nötig — Server bleibt stateless.
- Horizontal skalierbar ohne Session-Replikation.
- Token kann Benutzerinfos (Rollen, Name) direkt enthalten — spart DB-Lookups pro Request.
- Gut geeignet für Microservice-Architekturen oder mobile Clients.

**Nachteile:**

- Token-Invalidierung ist schwierig: Ein ausgegebenes Token ist bis zum Ablauf gültig. Für Logout/Deaktivierung braucht man eine Blacklist oder kurze Token-Laufzeiten mit Refresh-Tokens — was wieder serverseitigen State einführt.
- Token-Größe: JWT ist größer als ein Session-Cookie (besonders mit Rollen-Claims).
- Secret-Management: Der Signing-Key muss sicher verwaltet werden.
- Refresh-Token-Logik erhöht die Komplexität erheblich.

### Option B: Server-Side Session (Stateful)

Nach dem Login erstellt der Server eine Session und sendet eine Session-ID als Cookie. Der Server speichert den Session-State (z.B. in-memory oder in der Datenbank).

**Vorteile:**

- Einfaches Invalidieren: Logout = Session löschen. Sofort wirksam.
- Benutzer-Deaktivierung greift sofort (Session kann serverseitig entfernt werden).
- Kleine Cookie-Größe (nur Session-ID).
- Spring Security hat erstklassigen Session-Support out of the box.
- Weniger Komplexität: Kein Refresh-Token-Flow, kein Token-Parsing im Frontend.

**Nachteile:**

- Serverseitiger State: Sessions müssen gespeichert werden (In-Memory, DB oder Redis).
- Bei In-Memory-Sessions: Verlust nach Server-Restart.
- Horizontale Skalierung erfordert Sticky Sessions oder zentralen Session Store.
- CSRF-Schutz erforderlich, da Browser Cookies automatisch mitsendet.

### Option C: JWT mit Refresh-Token (Hybrid)

Kurzlebiger Access-Token (z.B. 15 Min.) + langlebiger Refresh-Token (z.B. 7 Tage). Der Refresh-Token wird serverseitig gespeichert und kann widerrufen werden.

**Vorteile:**

- Kombiniert Stateless-Vorteile (keine DB-Lookups für die meisten Requests) mit Widerrufbarkeit.
- Kurze Access-Token-Laufzeit begrenzt das Schadensfenster.

**Nachteile:**

- Höchste Komplexität: Zwei Token-Typen, automatische Token-Erneuerung im Frontend, Race Conditions bei parallelen Requests.
- Der Refresh-Token erfordert serverseitigen State — der Hauptvorteil von JWT wird teilweise aufgehoben.
- Overkill für eine Single-Instance-Anwendung.

### Entscheidung: Option C — JWT mit Refresh-Token

Obwohl die Anwendung aktuell als Single-Instance läuft, wird JWT mit Refresh-Token gewählt, um die Architektur von Anfang an skalierbar zu halten. Der kurzlebige Access-Token (z.B. 15 Min.) hält die meisten Requests stateless und frei von DB-Lookups. Der serverseitig gespeicherte Refresh-Token (z.B. 7 Tage) ermöglicht Widerrufbarkeit bei Logout und Benutzer-Deaktivierung. Die höhere Frontend-Komplexität (automatische Token-Erneuerung, Request-Queueing) ist ein bewusster Trade-off zugunsten späterer Skalierbarkeit und der Möglichkeit, mobile Clients oder Microservices ohne Architekturwechsel anbinden zu können.

---

## Entscheidung 2: Token-/Session-Speicherung im Frontend

### Option A: HttpOnly Cookie

Die Session-ID oder das Token wird als `HttpOnly`-Cookie gesetzt. Der Browser sendet es automatisch mit jedem Request.

**Vorteile:**

- Nicht per JavaScript auslesbar → kein XSS-Risiko für das Token.
- Wird automatisch mitgesendet — kein manuelles Token-Handling im Frontend nötig.
- `Secure`- und `SameSite`-Flags bieten zusätzlichen Schutz.

**Nachteile:**

- CSRF-Schutz erforderlich (z.B. CSRF-Token oder `SameSite=Strict`).
- Bei Cross-Origin-Requests (unterschiedliche Domains) ist die Cookie-Konfiguration aufwändiger.
- Cookie-Größe ist auf ~4 KB begrenzt (relevant nur bei großen JWTs).

### Option B: localStorage

Das Token wird per JavaScript im `localStorage` des Browsers gespeichert und manuell als `Authorization`-Header an Requests angehängt.

**Vorteile:**

- Einfach zu implementieren im Frontend (Interceptor setzt Header).
- Kein CSRF-Problem, da der Browser den Header nicht automatisch sendet.
- Persistiert über Browser-Sessions hinweg (Benutzer bleibt eingeloggt).

**Nachteile:**

- **XSS-anfällig**: Jedes eingeschleuste Script kann das Token auslesen und exfiltrieren.
- Token muss manuell in jeden Request eingefügt werden.
- Kein automatischer Schutz durch Browser-Mechanismen.

### Option C: sessionStorage

Wie localStorage, aber die Daten werden beim Schließen des Tabs gelöscht.

**Vorteile:**

- Geringeres Risiko als localStorage: Token lebt nur so lange wie der Tab.
- Kein CSRF-Problem.

**Nachteile:**

- Gleiche XSS-Anfälligkeit wie localStorage.
- Benutzer muss sich nach jedem Tab-Schließen neu anmelden.
- Mehrere Tabs erfordern jeweils eigene Anmeldung.

### Entscheidung: Split-Ansatz — Refresh-Token als HttpOnly Cookie, Access-Token im Speicher

Passend zur JWT-Entscheidung (Entscheidung 1) wird ein Split-Ansatz gewählt: Der langlebige Refresh-Token wird als `HttpOnly`-Cookie gespeichert und ist damit vor XSS-Angriffen geschützt. Der kurzlebige Access-Token wird ausschließlich im Arbeitsspeicher (JavaScript-Variable) gehalten und als `Authorization: Bearer`-Header an API-Requests angehängt. Da der Access-Token nicht automatisch vom Browser gesendet wird, entfällt die Notwendigkeit eines CSRF-Schutzes. Bei einem Page-Refresh geht der Access-Token verloren — das Frontend fordert dann über den Refresh-Token-Cookie transparent einen neuen an. localStorage/sessionStorage werden bewusst vermieden, da sie per JavaScript auslesbar und damit XSS-anfällig sind.

---

## Entscheidung 3: Passwort-Hashing

### Option A: BCrypt

Industriestandard seit über 20 Jahren. Konfigurierbarer Cost-Factor (Anzahl Runden).

**Vorteile:**

- Spring Security Default — `BCryptPasswordEncoder` ist out of the box verfügbar.
- Battle-tested, breit eingesetzt, gut dokumentiert.
- Einfache Integration, keine zusätzlichen Dependencies.
- Konfigurierbarer Work-Factor (Strength 4–31).

**Nachteile:**

- Nur CPU-intensiv, nicht memory-hard → theoretisch anfälliger für GPU/ASIC-Angriffe.
- Maximale Passwortlänge von 72 Bytes (selten ein Problem in der Praxis).

### Option B: Argon2

Gewinner der Password Hashing Competition (2015). Modernster Algorithmus, memory-hard.

**Vorteile:**

- Memory-hard: Schützt besser gegen GPU/ASIC-basierte Brute-Force-Angriffe.
- Drei Varianten: Argon2d (GPU-resistent), Argon2i (Side-Channel-resistent), Argon2id (Hybrid, empfohlen).
- Empfohlen von OWASP als primäre Wahl.

**Nachteile:**

- Erfordert zusätzliche Dependency (`org.bouncycastle` oder `de.mkammerer:argon2-jvm`).
- Spring Security unterstützt Argon2 über `Argon2PasswordEncoder`, aber es ist nicht der Default.
- Weniger verbreitet in Java-Ökosystem als BCrypt.
- Memory-Konfiguration muss bedacht werden (kann auf ressourcenlimitierten Umgebungen problematisch sein).

### Option C: SCrypt

Ebenfalls memory-hard, entwickelt von Colin Percival (2009).

**Vorteile:**

- Memory-hard wie Argon2.
- Spring Security bietet `SCryptPasswordEncoder`.
- Älter als Argon2, daher mehr Praxis-Erfahrung.

**Nachteile:**

- Weniger Flexibilität als Argon2 (keine getrennten Paramter für Memory, CPU, Parallelität).
- In der Java-Community weniger verbreitet als BCrypt.
- Von OWASP als "akzeptabel" eingestuft, aber nicht als erste Wahl empfohlen.

### Entscheidung: Option A — BCrypt

BCrypt ist der Spring Security Default und damit zero-config. Für ein internes CRM mit Admin-verwalteten Passwörtern ist BCrypt mehr als ausreichend sicher. Die theoretische GPU-Anfälligkeit gegenüber Argon2 ist in diesem Kontext irrelevant — wir schützen keine Millionen-User-Datenbank, die exfiltriert werden könnte. BCrypt spart eine zusätzliche Dependency und ist im Java-Ökosystem am besten dokumentiert. Sollte das Bedrohungsmodell sich ändern, unterstützt Spring Security den Wechsel zu Argon2 über `DelegatingPasswordEncoder` ohne Migration der bestehenden Hashes.

---

## Entscheidung 4: Security-Framework

### Option A: Spring Security

Das Standard-Security-Framework für Spring Boot. Bietet Authentifizierung, Autorisierung, CSRF-Schutz, Session-Management und vieles mehr.

**Vorteile:**

- De-facto-Standard für Spring Boot — große Community, umfangreiche Dokumentation.
- Alles inklusive: Authentication Providers, Filter Chain, Method Security, CORS/CSRF, Password Encoding.
- `@PreAuthorize`/`@Secured` für deklarative Methodensicherheit.
- Automatisches Session-Management mit konfigurierbarem Timeout.
- Sicherheits-Best-Practices sind als Defaults eingebaut (z.B. CSRF-Schutz).
- Nahtlose Integration mit Spring Data (z.B. `SecurityContextHolder`).

**Nachteile:**

- Steile Lernkurve: Die Filter-Chain-Architektur ist komplex und nicht immer intuitiv.
- "Magisches" Verhalten: Vieles passiert implizit, Debugging kann schwierig sein.
- Boilerplate für Custom-Konfiguration (z.B. stateless JWT-Setup erfordert mehrere Custom-Beans).
- Große Dependency mit vielen transitiven Abhängigkeiten.

### Option B: Custom Security Filter

Eigene Implementierung mit `jakarta.servlet.Filter` oder Spring `OncePerRequestFilter`. Manuelle Token-Validierung und Autorisierung.

**Vorteile:**

- Volle Kontrolle über den gesamten Authentifizierungs-Flow.
- Leichtgewichtig: Keine große Framework-Dependency.
- Einfacher zu verstehen, weil alles explizit ist.

**Nachteile:**

- **Reinventing the wheel**: Viele Sicherheitsaspekte müssen selbst implementiert werden (Timing-Attacken, Session-Fixation, CSRF, etc.).
- Höheres Risiko für Sicherheitslücken durch eigene Implementierung.
- Keine deklarative Methodensicherheit (`@PreAuthorize`).
- Kein Ökosystem: Jede Erweiterung (OAuth2, LDAP, etc.) müsste selbst gebaut werden.
- Mehr Code zu warten und zu testen.

### Entscheidung: Option A — Spring Security

Security selbst zu implementieren ist in fast jedem Kontext die falsche Entscheidung. Spring Security deckt Timing-Attacken und viele weitere Angriffsvektoren ab, an die man bei einer Custom-Lösung erst denken müsste. Die Lernkurve ist real, aber einmalig — und das Projekt nutzt bereits Spring Boot, sodass die Integration nahtlos ist. Deklarative Methodensicherheit mit `@PreAuthorize` passt hervorragend zur bestehenden Controller-Architektur. Für den gewählten JWT-Ansatz bietet Spring Security die stateless Session-Konfiguration und die Möglichkeit, einen Custom JWT-Filter in die Filter-Chain einzuhängen.

---

## Entscheidung 5: Rollen-Architektur

### Option A: Rollen als Enum

Rollen werden als Java-Enum definiert (`ADMIN`, `VERTRIEB`, `PERSONAL`). Die Benutzer-Entity speichert die Rollen als `@ElementCollection` oder `@Enumerated`.

**Vorteile:**

- Einfach und typsicher: Compile-Time-Checks, kein ungültiger Wert möglich.
- Konsistent mit dem bestehenden Pattern (z.B. `ChancePhase`, `VertragStatus`).
- Keine zusätzliche Tabelle/Entity nötig.
- Rollen sind im Code direkt referenzierbar (z.B. `@PreAuthorize("hasRole('ADMIN')")`).
- Weniger Komplexität: Kein CRUD für Rollen, keine Rollen-Verwaltungs-UI.

**Nachteile:**

- Neue Rollen erfordern Code-Änderung und Re-Deployment.
- Keine dynamische Konfiguration von Berechtigungen pro Rolle.
- Nicht geeignet, wenn Kunden eigene Rollen definieren sollen.

### Option B: Rollen als eigene Entity

Rollen werden als eigene Datenbank-Entity modelliert, mit Many-to-Many-Beziehung zum Benutzer. Optional: zusätzliche Permission-Entity für feingranulare Berechtigungen.

**Vorteile:**

- Dynamisch: Rollen können zur Laufzeit angelegt und konfiguriert werden.
- Erweiterbar: Berechtigungen können pro Rolle granular vergeben werden.
- Mandantenfähig: Verschiedene Kunden könnten eigene Rollen haben.

**Nachteile:**

- Höhere Komplexität: Eigene Entity, Repository, Service, ggf. Verwaltungs-UI.
- Overengineering für drei feste Rollen.
- Berechtigungsprüfungen werden komplexer (DB-Lookup statt einfachem Enum-Vergleich).
- YAGNI: Das PRD definiert explizit drei Rollen ohne Anforderung an Dynamik.

### Option C: Enum + Permission-Mapping

Rollen als Enum, aber mit einer Code-basierten Zuordnung von Rollen zu Permissions. Die Permissions definieren den Zugriff auf Bereiche.

**Vorteile:**

- Typsicher wie Option A.
- Entkopplung von Rolle und Berechtigung: Neue Berechtigungen können hinzugefügt werden, ohne die Rolle selbst zu ändern.
- Das Permission-Mapping kann zentral an einer Stelle gepflegt werden.

**Nachteile:**

- Änderungen am Mapping erfordern weiterhin Code-Änderung und Re-Deployment.
- Etwas mehr Abstraktion als nötig, wenn die drei Rollen stabil sind.

### Entscheidung: Option C — Enum + Permission-Mapping

Option A (reiner Enum) wäre ausreichend, aber Option C bietet mit minimalem Mehraufwand einen entscheidenden Vorteil: Die Berechtigungslogik wird an einer zentralen Stelle gepflegt, statt über Controller und Guards verstreut zu sein. Ein einfaches `EnumMap<BenutzerRolle, Set<Permission>>` macht die Berechtigungsmatrix aus dem PRD direkt im Code abbildbar und lesbar. Neue Bereiche oder Rollenanpassungen erfordern nur eine Änderung an dieser Stelle. Die eigene Entity (Option B) wäre Overengineering — das PRD definiert drei feste Rollen, Mandantenfähigkeit ist explizit Out of Scope.

---

## Zusammenfassung der Entscheidungen

| Entscheidung              | Option A                   | Option B                     | Option C                        | Entscheidung |
|---------------------------|----------------------------|------------------------------|---------------------------------|--------------|
| 1. Auth-Mechanismus       | JWT (Stateless)            | Server-Side Session          | JWT + Refresh-Token (Hybrid)    | **C — JWT + Refresh** |
| 2. Token-Speicherung      | HttpOnly Cookie            | localStorage                 | sessionStorage                  | **Split — Cookie + Memory** |
| 3. Passwort-Hashing       | BCrypt                     | Argon2                       | SCrypt                          | **A — BCrypt** |
| 4. Security-Framework     | Spring Security            | Custom Filter                | —                               | **A — Spring Security** |
| 5. Rollen-Architektur     | Enum                       | Eigene Entity                | Enum + Permission-Mapping       | **C — Enum + Permissions** |

**Leitprinzip:** Skalierbarkeit dort, wo sie architekturell relevant ist (Auth-Mechanismus), Einfachheit dort, wo sie ausreicht (Hashing, Rollen). Der JWT-Ansatz mit Refresh-Token ist die komplexeste Option für den Auth-Mechanismus, bietet aber Zukunftssicherheit für horizontale Skalierung und zusätzliche Clients. Die übrigen Entscheidungen folgen bewährten Standards mit minimalem Custom-Code.
