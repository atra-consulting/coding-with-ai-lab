# ADR-004: Technologiewahl fuer den CIAM-Microservice

**Status**: Implementiert
**Datum**: 2026-03-02
**Bezug**: [ADR-003: CIAM-Microservice-Architektur](003-ciam-microservice.md)

## Kontext

Der CIAM-Microservice ist derzeit in Spring Boot 3.5.3 (Java 21) implementiert — dieselbe Technologie wie das CRM-Backend. Da es sich um ein Schulungsprojekt handelt, stellt sich die Frage, ob ein Technologiewechsel fuer den CIAM didaktischen Mehrwert bietet: Polyglotte Microservice-Architekturen sind in der Praxis ueblich, und der CIAM ist mit ~1.500 LOC und klar abgegrenzter Verantwortlichkeit (Login, JWT-Signierung, Benutzerverwaltung) ein idealer Kandidat fuer eine Portierung.

**Bewertungskriterien:**

1. **Didaktischer Wert** — Was lernen die Teilnehmer durch die Technologie?
2. **Praxisrelevanz** — Wird die Technologie in der Industrie fuer Identity-Services eingesetzt?
3. **Umsetzungsaufwand** — Wie komplex ist die Portierung (~1.500 LOC, 11 Endpoints, RS256 JWT)?
4. **Betriebskomplexitaet** — Welche zusaetzlichen Laufzeitabhaengigkeiten entstehen?
5. **Interoperabilitaet** — Wie gut funktioniert die Kommunikation mit dem CRM-Backend (Key-Sharing, JWKS)?
6. **Setup-Voraussetzungen** — Welche Toolchains muessen die Teilnehmer installiert haben?

**Offener Punkt — Entwicklungsumgebung der Teilnehmer:**

Wir wissen derzeit nicht, welche Tools und Runtimes auf den Rechnern der Teilnehmer installiert sind oder ob sie flexibel neue Software installieren koennen (z.B. eingeschraenkte Firmen-Laptops, fehlende Admin-Rechte). Aktuell ist nur Java 21 + Maven + Node.js (fuer Angular) gesichert. Jede Option, die eine zusaetzliche Runtime oder Toolchain erfordert, birgt das Risiko, dass Teilnehmer Zeit mit Setup-Problemen statt mit der eigentlichen Aufgabe verbringen. Dieses Kriterium fliesst in die Bewertung als "Setup-Voraussetzungen" ein.

**Funktionaler Scope des CIAM (unveraendert bei allen Optionen):**

- Login mit Username/Passwort → RS256 JWT-Ausstellung
- Refresh-Token-Flow (HttpOnly Cookie)
- JWKS-Endpoint (`/.well-known/jwks.json`)
- Benutzerverwaltung (CRUD, Admin-only)
- Rate Limiting fuer Login-Versuche
- BCrypt Passwort-Hashing
- H2 oder vergleichbare Embedded-DB fuer Entwicklung

---

## Option A: Status quo — Spring Boot (Java 21)

Der CIAM bleibt in Spring Boot. Beide Services teilen Sprache, Build-Tool und Dependency-Management.

**Vorteile:**

- Kein Migrationsaufwand, sofort einsatzbereit.
- Einheitlicher Tech-Stack: Ein Build-System (Maven), eine Sprache, ein Debugging-Workflow.
- Alle Teilnehmer brauchen nur Java/Spring-Kenntnisse.
- Spring Security bietet erstklassigen Support fuer JWT, CORS, Rate Limiting, Password Encoding.
- Die bestehenden ADRs (001, 003) bleiben vollstaendig gueltig.

**Nachteile:**

- Kein Lerneffekt bezueglich polyglotter Architekturen.
- Zwei JVM-Prozesse fuer ~1.500 LOC Auth-Logik: Hoher Ressourcenverbrauch (~200-400 MB RAM pro Prozess).
- Teilnehmer sehen nicht, wie Microservices ueber Technologiegrenzen hinweg kommunizieren.
- Riskiert den Eindruck, dass "Microservice = gleiche Sprache in separatem Prozess" sei.

**Aufwand:** Kein Aufwand (Status quo).

---

## Option B: Node.js mit TypeScript (Express/Fastify)

Der CIAM wird in TypeScript mit einem Node.js-Framework (Express oder Fastify) reimplementiert.

**Vorteile:**

- **Sprachbruecke zum Frontend**: Das Angular-Frontend ist bereits in TypeScript — Teilnehmer sehen, dass TypeScript sowohl fuer Frontend als auch Backend-Services geeignet ist.
- **Polyglotter Lerneffekt**: Demonstriert, wie ein Java-Backend und ein Node.js-Service ueber standardisierte Schnittstellen (JWT, JWKS, REST) zusammenarbeiten.
- **Leichtgewichtig**: Node.js-Prozess braucht ~30-80 MB RAM vs. ~200-400 MB fuer eine JVM.
- **Praxisrelevant**: Node.js ist eine der meistgenutzten Backend-Technologien und in Identity-Services verbreitet (Auth0, Supabase Auth sind in Node.js/TypeScript).
- **Reifes Oekosystem**: `jsonwebtoken` (JWT), `bcryptjs` (Hashing), `better-sqlite3` (Embedded-DB) sind battle-tested Libraries.
- **Schnelle Entwicklungszyklen**: Kein Compile-Schritt, Hot-Reload mit `tsx --watch`.

**Nachteile:**

- **Zweites Build-System**: npm/pnpm neben Maven — CI/CD und `start.sh` muessen angepasst werden.
- **Kein Spring Security**: Rate Limiting, CORS, Security-Header muessen manuell oder mit Middleware (helmet, express-rate-limit) konfiguriert werden.
- **Andere Testkultur**: Jest/Vitest statt JUnit — andere Konventionen, andere Mocking-Ansaetze.
- **Typ-Sicherheit schwaecher**: TypeScript ist strukturell typisiert, nicht nominal wie Java. Enums und DTOs funktionieren anders.
- **Abhaengigkeit von node_modules**: `node_modules`-Verzeichnis mit vielen transitiven Abhaengigkeiten.

**Aufwand:** Mittel. ~1.500 LOC in TypeScript, JWT/BCrypt-Libraries sind direkte 1:1-Abbildungen. Hauptaufwand: Ersatz fuer Spring Security (Filter Chain, CORS, Rate Limiting) und JPA (ORM oder raw SQL).

**Beispiel-Stack:**

| Spring Boot                   | Node.js/TypeScript Aequivalent      |
|-------------------------------|--------------------------------------|
| Spring Security Filter Chain  | express-rate-limit + helmet          |
| JPA + H2                      | Drizzle/Prisma + better-sqlite3      |
| `@PreAuthorize`               | Custom Middleware                    |
| BCryptPasswordEncoder         | bcryptjs                             |
| jjwt (RS256)                  | jose (RS256)                         |
| `@Valid` + Bean Validation    | zod                                  |

---

## Option C: Go (net/http oder Gin/Echo)

Der CIAM wird in Go reimplementiert — eine Sprache, die speziell fuer Microservices und Cloud-native Anwendungen entwickelt wurde.

**Vorteile:**

- **Ideale Microservice-Sprache**: Go wurde bei Google fuer genau diesen Anwendungsfall entworfen. Docker, Kubernetes, Terraform — alle in Go.
- **Hoher didaktischer Wert**: Teilnehmer lernen eine fundamental andere Sprache (kompiliert, statisch typisiert, keine Klassen, kein OOP im klassischen Sinn).
- **Extrem leichtgewichtig**: Compiled Binary (~10-15 MB), ~5-20 MB RAM zur Laufzeit. Kein JVM, kein Node.js noetig.
- **Schneller Start**: ~50ms Cold Start vs. ~2-5s fuer Spring Boot.
- **Stdlib genuegt**: Go's Standardbibliothek deckt HTTP-Server, JSON, Crypto (RSA, HMAC) ab — minimale externe Abhaengigkeiten.
- **Praxisrelevant fuer Identity**: Ory (Hydra, Kratos), Dex, Vault — fuehrende Identity-Loesungen sind in Go geschrieben.

**Nachteile:**

- **Steile Lernkurve**: Go's Idiome (Error Handling via `if err != nil`, keine Exceptions, keine Generics fuer Collections, Interfaces implizit) sind fuer Java-Entwickler ungewohnt.
- **Kein ORM-Standard**: Kein JPA-Aequivalent. `sqlx` oder `GORM` erfordern ein Umdenken.
- **Weniger Abstraktion**: Kein Dependency Injection Framework, kein Annotation-basiertes Routing — alles ist explizit.
- **Debugging**: Andere Toolchain (Delve statt IntelliJ Debugger, `go test` statt JUnit).
- **Groesserer Sprung**: Die Teilnehmer muessen eine komplett neue Sprache lernen, nicht nur ein neues Framework.

**Aufwand:** Hoch. Go erfordert fundamentales Umdenken bei Error Handling, Projektstruktur und Datenbankzugriff. JWT/RSA-Support ist in der Stdlib vorhanden, aber Low-Level.

**Beispiel-Stack:**

| Spring Boot                   | Go Aequivalent                       |
|-------------------------------|--------------------------------------|
| Spring Security Filter Chain  | Custom Middleware (net/http)          |
| JPA + H2                      | sqlx + SQLite (mattn/go-sqlite3)     |
| `@PreAuthorize`               | Custom Middleware                    |
| BCryptPasswordEncoder         | golang.org/x/crypto/bcrypt           |
| jjwt (RS256)                  | golang-jwt/jwt                       |
| `@Valid` + Bean Validation    | go-playground/validator              |
| Spring DI                     | Wire oder manuell                    |

---

## Option D: Python (FastAPI)

Der CIAM wird in Python mit FastAPI reimplementiert — ein modernes, async-faehiges Web-Framework mit automatischer OpenAPI-Dokumentation.

**Vorteile:**

- **Niedrigste Einstiegshuerde**: Python ist die meistgelernte Programmiersprache — viele Teilnehmer haben Vorkenntnisse.
- **FastAPI ist didaktisch exzellent**: Type Hints, automatische Swagger-UI, deklarative Dependency Injection, Pydantic-Validierung — jedes Feature ist sofort sichtbar und verstaendlich.
- **Automatische API-Docs**: Swagger-UI unter `/docs` out of the box — zeigt den CIAM-API-Vertrag ohne Zusatzarbeit.
- **Praxisrelevant**: Python ist im Backend (Django, FastAPI), in ML/AI und bei Startups weit verbreitet.
- **Leichtgewichtig**: ~50-100 MB RAM, kein Compile-Schritt.

**Nachteile:**

- **Performance**: Python (CPython) ist langsamer als Java und Go. Fuer einen Auth-Service mit wenigen Requests irrelevant, aber fuer den Lerneffekt erwaehnenswert.
- **GIL**: Global Interpreter Lock limitiert echte Parallelitaet (async hilft bei I/O, nicht bei CPU).
- **Dependency-Management**: pip/poetry/uv — ein weiteres Paketmanagement-System neben Maven und npm.
- **Typ-Sicherheit**: Type Hints sind optional und werden zur Laufzeit nicht erzwungen (anders als Java/TypeScript).
- **Weniger verbreitet fuer Identity**: Die grossen Identity-Loesungen (Keycloak, Auth0, Ory) sind nicht in Python geschrieben.

**Aufwand:** Mittel. FastAPI's deklarativer Stil macht die Portierung intuitiv. Hauptaufwand: SQLAlchemy/SQLModel als ORM, PyJWT fuer RS256, passlib fuer BCrypt.

**Beispiel-Stack:**

| Spring Boot                   | Python/FastAPI Aequivalent           |
|-------------------------------|--------------------------------------|
| Spring Security Filter Chain  | FastAPI Middleware + Dependencies     |
| JPA + H2                      | SQLModel + SQLite (aiosqlite)        |
| `@PreAuthorize`               | FastAPI Dependencies                 |
| BCryptPasswordEncoder         | passlib[bcrypt]                      |
| jjwt (RS256)                  | PyJWT + cryptography                 |
| `@Valid` + Bean Validation    | Pydantic v2                          |

---

## Option E: Kotlin mit Ktor

Der CIAM wird in Kotlin mit dem Ktor-Framework reimplementiert — bleibt auf der JVM, aber mit moderner Sprache und leichtgewichtigem Framework.

**Vorteile:**

- **Sanfter Umstieg**: Kotlin ist zu 100% Java-interoperabel. Bestehende Libraries (jjwt, BCrypt, H2) koennen direkt weiterverwendet werden.
- **Moderne Sprachfeatures**: Data Classes, Null Safety, Extension Functions, Coroutines — zeigt, wie sich die JVM-Welt weiterentwickelt.
- **Ktor ist leichtgewichtig**: Kein Spring-Magic, kein Annotation-Processing. Routing, Middleware ("Plugins") und DI sind explizit und nachvollziehbar.
- **Praxisrelevant**: Kotlin ist offizielle Android-Sprache und auf dem Server zunehmend verbreitet (JetBrains, Google, Spring unterstuetzt Kotlin erstklassig).
- **Nahezu gleiche Toolchain**: Maven mit `kotlin-maven-plugin` laedt den Kotlin-Compiler automatisch herunter — keine manuelle Installation noetig. IntelliJ-Debugging und JUnit-Tests funktionieren wie gewohnt.
- **Coroutines**: Ktor ist von Grund auf async mit Kotlin Coroutines — zeigt modernes Concurrency-Modell ohne Callback-Hell.

**Nachteile:**

- **Geringer Polyglot-Effekt**: Kotlin laeuft auf derselben JVM, nutzt dieselben Libraries. Es ist eher ein Sprachwechsel als ein Technologiewechsel.
- **Zwei JVM-Prozesse bleiben**: Der RAM-Vorteil gegenueber Spring Boot ist marginal (~150-300 MB statt ~200-400 MB).
- **Kein Spring Security**: Ktor hat ein eigenes Auth-Plugin, aber Rate Limiting, CORS und Security-Header muessen einzeln konfiguriert werden.
- **Kleinere Community**: Ktor hat deutlich weniger Tutorials und StackOverflow-Antworten als Spring Boot oder Express.

**Aufwand:** Niedrig bis mittel. Die Java-Libraries (jjwt, BCrypt, H2/JDBC) funktionieren direkt in Kotlin. Der Hauptaufwand liegt im Erlernen von Ktor's Plugin-System und der Umstellung von Spring-Annotationen auf Ktor's DSL-basiertes Routing.

**Beispiel-Stack:**

| Spring Boot                   | Kotlin/Ktor Aequivalent             |
|-------------------------------|--------------------------------------|
| Spring Security Filter Chain  | Ktor Auth Plugin + Custom Plugins    |
| JPA + H2                      | Exposed (JetBrains ORM) + H2        |
| `@PreAuthorize`               | Custom Ktor Plugin                   |
| BCryptPasswordEncoder         | jBCrypt (gleiche Library)            |
| jjwt (RS256)                  | jjwt (gleiche Library)               |
| `@Valid` + Bean Validation    | Ktor Request Validation Plugin       |
| Spring DI                     | Koin oder manuell                    |

---

## Option F: Rust (Actix Web / Axum)

Der CIAM wird in Rust reimplementiert — eine Systemsprache mit Fokus auf Memory Safety ohne Garbage Collector.

**Vorteile:**

- **Hoechster Lerneffekt**: Ownership, Borrowing, Lifetimes — Rust erzwingt ein fundamentales Umdenken ueber Speicherverwaltung, das in keiner anderen hier genannten Sprache vorkommt.
- **Extrem performant**: Vergleichbar mit C/C++, kein GC, kein Runtime-Overhead. Compiled Binary (~5-10 MB), ~2-10 MB RAM.
- **Memory Safety ohne GC**: Keine Null Pointer Exceptions, keine Data Races — der Compiler verhindert ganze Fehlerklassen zur Compile-Zeit.
- **Praxisrelevant**: Cloudflare (Workers), AWS (Firecracker), Discord, 1Password — zunehmend fuer sicherheitskritische Services eingesetzt.
- **Security by Design**: Fuer einen Auth-Service besonders passend — die Sprache selbst verhindert Buffer Overflows und Use-after-Free.

**Nachteile:**

- **Steilste Lernkurve aller Optionen**: Der Borrow Checker ist fuer Einsteiger frustrierend. Einfache Aufgaben (z.B. einen String an zwei Stellen verwenden) erfordern explizites Ownership-Management.
- **Langsame Compile-Zeiten**: Inkrementelle Builds dauern mehrere Sekunden, Full Builds deutlich laenger als Java oder Go.
- **Oekosystem weniger ausgereift**: Crates wie `jsonwebtoken` und `bcrypt` existieren, aber die Dokumentation und Beispiele sind duenner als bei Java/Node.js.
- **Async-Komplexitaet**: Actix Web und Axum basieren auf Tokio (async Runtime). Async Rust mit Lifetimes ist eines der komplexesten Themen der Sprache.
- **Kein ORM-Standard**: Diesel oder SeaORM sind verfuegbar, aber weniger ausgereift als JPA oder SQLAlchemy.
- **Unverhältnismaessig**: Die Vorteile von Rust (Systemnaehe, Zero-Cost Abstractions) kommen bei einem CRUD-Auth-Service mit 11 Endpoints kaum zum Tragen.

**Aufwand:** Sehr hoch. Neben der neuen Sprache muessen Teilnehmer Ownership, Lifetimes und async Rust verstehen. Die Portierung von ~1.500 LOC Java duerfte ~2.000+ LOC Rust ergeben (expliziteres Error Handling, kein Reflection/Annotations).

**Beispiel-Stack:**

| Spring Boot                   | Rust Aequivalent                     |
|-------------------------------|--------------------------------------|
| Spring Security Filter Chain  | Actix/Axum Middleware (Tower)        |
| JPA + H2                      | SeaORM/Diesel + SQLite (rusqlite)    |
| `@PreAuthorize`               | Custom Extractor/Middleware          |
| BCryptPasswordEncoder         | bcrypt (Crate)                       |
| jjwt (RS256)                  | jsonwebtoken (Crate)                 |
| `@Valid` + Bean Validation    | validator (Crate)                    |
| Spring DI                     | Manuell (App State)                  |

---

## Option G: Keycloak (Identity Provider as a Product)

Statt eines selbstgeschriebenen CIAM wird Keycloak als fertiger Identity Provider eingesetzt. Der eigene CIAM-Code wird durch Konfiguration ersetzt.

**Vorteile:**

- **Buy vs. Build**: Demonstriert eine der wichtigsten Architekturentscheidungen — wann nutzt man ein fertiges Produkt statt Eigenentwicklung?
- **Feature-reich**: MFA, Social Login, LDAP, SAML, OpenID Connect, Account Self-Service — alles out of the box.
- **Industriestandard**: Keycloak ist der meistgenutzte Open-Source Identity Provider (Red Hat, CNCF).
- **Kein eigener Auth-Code**: Eliminiert die gesamte Sicherheitslogik — keine Chance fuer eigene Security-Bugs.
- **OIDC-konform**: Lehrt einen echten Standard statt einer Custom-Implementierung.

**Nachteile:**

- **Black Box**: Teilnehmer verstehen nicht, wie JWT-Signierung, Refresh-Token-Flow oder Rate Limiting intern funktionieren — sie konfigurieren nur.
- **Hohe Betriebskomplexitaet**: Keycloak braucht eine eigene Datenbank, ~512 MB-1 GB RAM, und hat eine steile Lernkurve fuer die Admin-Konsole.
- **Verlust des Lerneffekts**: Der didaktische Hauptzweck des CIAM — zu verstehen, wie Authentifizierung funktioniert — geht verloren.
- **Vendor Lock-in**: Keycloak's spezifische Konfiguration (Realms, Clients, Flows) ist nicht auf andere Produkte uebertragbar.
- **Uebermaechtig**: Keycloak fuer 5 Benutzer mit 3 Rollen einzusetzen, ist wie ein Formel-1-Wagen fuer den Weg zum Baecker.

**Aufwand:** Mittel. Kein Code zu schreiben, aber Keycloak-Konfiguration (Realm, Client, Rollen, Mapper) erfordert tiefes Verstaendnis der Admin-Konsole. Frontend-Anpassung: `angular-auth-oidc-client` statt eigener Auth-Logik.

---

## Bewertungsmatrix

| Kriterium                | A: Spring Boot | B: Node/TS    | C: Go          | D: Python      | E: Kotlin/Ktor | F: Rust        | G: Keycloak    |
|--------------------------|:--------------:|:--------------:|:--------------:|:--------------:|:--------------:|:--------------:|:--------------:|
| Didaktischer Wert        | Niedrig        | **Hoch**       | **Sehr hoch**  | Mittel         | Mittel         | **Sehr hoch**  | Mittel         |
| Praxisrelevanz           | Hoch           | **Sehr hoch**  | **Sehr hoch**  | Hoch           | Hoch           | Hoch           | **Sehr hoch**  |
| Umsetzungsaufwand        | **Keiner**     | Mittel         | Hoch           | Mittel         | **Niedrig**    | Sehr hoch      | Mittel         |
| Betriebskomplexitaet     | Mittel (JVM)   | **Niedrig**    | **Sehr niedrig** | Niedrig      | Mittel (JVM)   | **Sehr niedrig** | Hoch         |
| Interoperabilitaet       | **Trivial**    | **Trivial**    | **Trivial**    | **Trivial**    | **Trivial**    | **Trivial**    | Gut (OIDC)     |
| Polyglot-Lerneffekt      | **Keiner**     | **Hoch**       | **Sehr hoch**  | Hoch           | Niedrig        | **Sehr hoch**  | N/A            |
| Einstiegshuerde          | **Keine**      | Niedrig        | Hoch           | **Sehr niedrig** | **Sehr niedrig** | **Sehr hoch** | Mittel       |
| Setup-Voraussetzungen    | **Keine** (bereits vorhanden) | **Keine** (Node.js fuer Angular vorhanden) | Go-Toolchain installieren | Python 3 installieren | Gering (Kotlin-Compiler via Maven-Plugin, JVM vorhanden) | Rust-Toolchain installieren | JVM + Keycloak-Distribution |

**Legende:** Interoperabilitaet ist bei A-F trivial, weil der Vertrag derselbe bleibt: REST-Endpoints, RS256-JWT, JWKS, PEM-Dateien. Der CRM-Backend-Code aendert sich nicht. Setup-Voraussetzungen beziehen sich auf die zusaetzlich benoetigte Software ueber Java 21 + Maven + Node.js hinaus, die fuer das Projekt bereits installiert sein muessen.

---

## Entscheidung: Kotlin mit Spring Boot (Variante von Option E)

Der CIAM wird in **Kotlin** portiert, aber mit **Spring Boot** statt Ktor als Framework. Das kombiniert die Vorteile von Option A (bewährtes Framework, Spring Security) mit dem Sprachwechsel aus Option E (moderne Kotlin-Features).

**Begruendung:**

1. **Typisches Kundensetup**: Kotlin + Spring Boot ist eine in der Praxis haeufig anzutreffende Kombination — die Schulung bildet damit ein realistisches Szenario ab, das Teilnehmer bei Kunden wiederfinden werden.
2. **Modernere Sprache auf bewaehrtem Framework**: Kotlin bietet gegenueber Java spuerbare Verbesserungen (Null Safety, Data Classes, Extension Functions, weniger Boilerplate), ohne dass das Framework-Wissen neu erlernt werden muss. Spring Boot hat erstklassigen Kotlin-Support — `@RestController`, `@PreAuthorize`, JPA, Spring Security funktionieren identisch.
3. **Minimaler Setup-Aufwand**: Maven mit `kotlin-maven-plugin` genuegt — der Kotlin-Compiler wird automatisch heruntergeladen. Keine neue Runtime, keine neue Toolchain, kein Risiko durch fehlende Installationen auf Teilnehmer-Rechnern.
4. **Niedrigster Migrationsaufwand**: Da Spring Boot als Framework bleibt, ist die Portierung im Wesentlichen eine Syntax-Uebersetzung (Java → Kotlin). Spring Security, JPA, Bean Validation, jjwt — alles bleibt. Der Fokus liegt auf der Sprache, nicht auf dem Framework.
5. **Kein Framework-Risiko**: Ktor hat eine kleinere Community und weniger Dokumentation. Spring Boot ist den Teilnehmern bereits vom CRM-Backend vertraut — sie koennen sich voll auf die Kotlin-Sprachfeatures konzentrieren.

**Was sich gegenueber der reinen Option E (Ktor) aendert:**

| Aspekt               | Option E (Kotlin/Ktor) | Entscheidung (Kotlin/Spring Boot) |
|-----------------------|------------------------|-----------------------------------|
| Framework             | Ktor (neu zu lernen)   | Spring Boot (bereits bekannt)     |
| Security              | Ktor Auth Plugin       | Spring Security (bereits bekannt) |
| ORM                   | Exposed                | JPA/Hibernate (bereits bekannt)   |
| DI                    | Koin oder manuell      | Spring DI (bereits bekannt)       |
| Lernfokus             | Sprache + Framework    | **Nur Sprache**                   |
| Migrationsaufwand     | Niedrig bis mittel     | **Niedrig**                       |

**Was nicht gewaehlt wurde und warum:**

- **Option B (Node.js/TypeScript)**: Hoechster Polyglot-Lerneffekt, aber Risiko bei unbekannten Entwicklungsumgebungen der Teilnehmer. Node.js ist zwar fuer Angular vorhanden, aber ein Backend-Service in Node.js erfordert ein komplett anderes Tooling (npm, andere Test-Frameworks, kein Spring Security).
- **Option C (Go)**: Hoechster Lerneffekt, aber zu hoher Aufwand und zu steile Lernkurve fuer den Schulungskontext.
- **Option F (Rust)**: Unverhaeltnismaessig fuer einen CRUD-Auth-Service.
- **Option G (Keycloak)**: Verlust des didaktischen Kernziels (verstehen, wie Auth funktioniert).

---

## Auswirkungen auf bestehende Architektur

Unabhaengig von der gewaehlten Option (B, C, D oder E) aendert sich am CRM-Backend **nichts**:

- JWT-Validierung mit Public Key bleibt identisch.
- `JwtAuthenticationFilter` im CRM liest weiterhin `../ciam/keys/public.pem`.
- JWKS-Endpoint bleibt unter `/.well-known/jwks.json`.
- Frontend-Proxy (`proxy.conf.json`) leitet `/api/auth/**` weiterhin an Port 8081.
- Alle REST-Endpoints behalten Request/Response-Format bei.

Das ist der zentrale Beweis fuer die Qualitaet der Architekturentscheidung in ADR-003: **Die Service-Grenze ist sauber genug, dass die Implementierungssprache austauschbar ist.**
