# PRD: Migrate to Spring Boot 4.0 (SPRING-BOOT-4-MIGRATION)

## Source
User request: Use the OpenRewrite "Migrate to Spring Boot 4.0 (Community Edition)" recipe to upgrade both the backend (Java) and CIAM (Kotlin) modules from Spring Boot 3.5.3 to 4.0.

## Problem Statement
The project uses Spring Boot 3.5.3 across two modules (backend and CIAM). Spring Boot 4.0 GA shipped November 2025 with Spring Framework 7, Jakarta EE 11, Hibernate 7.1, and Jackson 3. Upgrading ensures the project stays on a supported, modern stack.

## Requirements

1. Run OpenRewrite recipe `org.openrewrite.java.spring.boot4.UpgradeSpringBoot_4_0` (Community Edition) on both `backend/` and `ciam/` modules
2. Fix any issues the recipe cannot handle automatically
3. Both modules must compile successfully after migration
4. Application must start and function correctly

## Special Instructions
- Use the agents in this repo (be-coder for backend, be-reviewer for review) to design, implement, and review the changes
- Run OpenRewrite via Maven command line (no permanent plugin addition needed)

## Implementation Approach

### Phase 1: Run OpenRewrite on both modules
- Add rewrite-maven-plugin temporarily to each pom.xml
- Run `mvn rewrite:run` in each module
- Review and commit the automated changes
- Remove rewrite-maven-plugin from pom.xml after run

### Phase 2: Fix remaining issues
- Remove explicit `spring.jpa.database-platform=org.hibernate.dialect.H2Dialect` (Hibernate 7 auto-detects)
- Upgrade Kotlin version from 2.1.10 to 2.2.x in CIAM module (Spring Boot 4 requires Kotlin 2.2+)
- Fix any compilation errors from removed deprecated APIs
- Update any changed property names
- Handle starter renames (see reference below)

### Phase 3: Verification
- Compile both modules: `cd backend && mvn clean compile` and `cd ciam && mvn clean compile`
- Run the full stack with `./start.sh` to verify runtime behavior

## Scope

### In scope
- `backend/pom.xml` — Spring Boot parent version, dependency changes, starter renames
- `ciam/pom.xml` — Spring Boot parent version, Kotlin version, dependency changes, starter renames
- `backend/src/main/resources/application.properties` — property migrations
- `ciam/src/main/resources/application.properties` — property migrations
- Any Java/Kotlin source files with deprecated API usage

### Out of scope
- Frontend (Angular) — not affected by Spring Boot upgrade
- Feature changes — this is a pure infrastructure upgrade

## Test Strategy
- Compile check: `mvn clean compile` in both modules
- Verify application startup with `./start.sh`
- Manual smoke test of login and basic CRUD operations

## Non-Functional Requirements
- Java 21 remains the target JVM (already meets Spring Boot 4 minimum of Java 17)
- No runtime behavior changes expected

## Success Criteria
1. Both modules use Spring Boot 4.0.x parent
2. `mvn clean compile` succeeds in both modules
3. Application starts without errors
4. Login and basic operations work correctly

---

## Reference: Migration Guide, Release Notes, and Framework Changes

Sources:
- https://github.com/spring-projects/spring-boot/wiki/Spring-Boot-4.0-Migration-Guide
- https://github.com/spring-projects/spring-boot/wiki/Spring-Boot-4.0-Release-Notes
- https://github.com/spring-projects/spring-framework/wiki/Spring-Framework-7.0-Release-Notes

This section serves as implementation reference during the migration.

### System Requirements
- Java 17+ (we use 21 — OK)
- Kotlin 2.2+ (we have 2.1.10 — **must upgrade**)
- Jakarta EE 11, Servlet 6.1 baseline
- Spring Framework 7.x

### OpenRewrite Recipe
- Recipe: `org.openrewrite.java.spring.boot4.UpgradeSpringBoot_4_0` (Community Edition)
- Plugin: `org.openrewrite.maven:rewrite-maven-plugin:6.32.0`
- Dependency: `org.openrewrite.recipe:rewrite-spring:6.26.0`
- Run: `mvn rewrite:run`
- 29 sub-recipes covering: parent version, Spring Framework 7, Spring Security 7, Hibernate 7.1, property migrations, starter renames, MockBean replacement, modular starters, etc.

### Starter Renames (handled by OpenRewrite)
| Old | New |
|-----|-----|
| `spring-boot-starter-web` | `spring-boot-starter-webmvc` |
| `spring-boot-starter-web-services` | `spring-boot-starter-webservices` |
| `spring-boot-starter-oauth2-*` | `spring-boot-starter-security-oauth2-*` |
| `spring-boot-starter-aop` | `spring-boot-starter-aspectj` |

### Jackson 3 Changes (handled by OpenRewrite)
- Group ID: `com.fasterxml.jackson` → `tools.jackson`
- `@JsonComponent` → `@JacksonComponent`
- `@JsonMixin` → `@JacksonMixin`
- Properties: `spring.jackson.read.*` → `spring.jackson.json.read.*`
- Properties: `spring.jackson.write.*` → `spring.jackson.json.write.*`

### Hibernate 7.1 Changes
- `hibernate-jpamodelgen` → `hibernate-processor`
- Dialect auto-detection: explicit `spring.jpa.database-platform` no longer needed
- **Action for us**: Remove `spring.jpa.database-platform=org.hibernate.dialect.H2Dialect` from both application.properties

### Module Reorganization
- New persistence module: `spring-boot-persistence`
- `@EntityScan` import from `org.springframework.boot.persistence.autoconfigure`
- Property: `spring.dao.exceptiontranslation.enabled` → `spring.persistence.exceptiontranslation.enabled`

### Security Changes
- Spring Authorization Server now part of Spring Security 7.0
- `@MockBean`/`@SpyBean` → `@MockitoBean`/`@MockitoSpyBean` (not used in our codebase)

### Nullability
- JSpecify annotations added throughout Spring Boot
- `org.springframework.lang.Nullable` → `org.jspecify.annotations.Nullable` (not used in our codebase)

### Testing Changes
- `@SpringBootTest` no longer auto-configures MockMVC — add `@AutoConfigureMockMvc` if needed
- `@SpringBootTest` no longer provides `TestRestTemplate` — add `@AutoConfigureTestRestTemplate`
- `MockitoTestExecutionListener` removed

### Property Changes
- `spring.session.redis.*` → `spring.session.data.redis.*`
- `spring.session.mongodb.*` → `spring.session.data.mongodb.*`
- MongoDB properties reorganized (not applicable to us)

### Removed Features (not applicable to us)
- Undertow support dropped
- Pulsar Reactive auto-config removed
- Embedded executable launch scripts removed
- Spock integration removed
- Spring Session Hazelcast & MongoDB direct support ended

### Kotlin-Specific
- Kotlin 2.2+ required
- New `spring-boot-starter-kotlin-serialization` available
- GraalVM native-image requires v25+

### DevTools
- Live reload disabled by default — enable with `spring.devtools.livereload.enabled=true`

### Actuator
- Liveness/readiness probes now enabled by default
- `org.springframework.lang.Nullable` no longer supported for endpoint parameters

### Spring Framework 7.0 Breaking Changes (relevant to us)

Source: https://github.com/spring-projects/spring-framework/wiki/Spring-Framework-7.0-Release-Notes

- **HttpHeaders no longer extends MultiValueMap** — code using map-like operations on HttpHeaders must use `asMultiValueMap()` or alternatives
- **`ListenableFuture` removed** — use `CompletableFuture` instead
- **JSR 305 annotations deprecated** — migrate to JSpecify annotations
- **`RestTemplate` marked feature-complete** — will be `@Deprecated` in 7.1 (plan migration to `RestClient`)
- **JPA 3.2**: `MutablePersistenceUnitInfo` no longer implements `PersistenceUnitInfo`
- **Jackson 3.x default** — Jackson 2 support deprecated, removal planned for 7.2
- **Bean Validation 3.1** (Hibernate Validator 9.0)
- **JUnit 4 support deprecated** — migrate to JUnit 5/Jupiter
- **Spring JCL removed** — uses Apache Commons Logging 1.3.0 directly (transparent)
- **Kotlin extensions**: `JdbcOperations.queryForObject/queryForList` array variants removed → use vararg parameters

### Spring Boot 4.0 Release Notes (key dependency versions)

Source: https://github.com/spring-projects/spring-boot/wiki/Spring-Boot-4.0-Release-Notes

| Dependency | Version |
|------------|---------|
| Spring Framework | 7.0 |
| Spring Security | 7.0 |
| Spring Data | 2025.1 |
| Hibernate | 7.1 |
| Jackson | 3.0 |
| Kotlin | 2.2.20 |
| H2 | 2.4 |
| Jakarta Persistence | 3.2 |
| Hibernate Validator | 9.0 |
| Tomcat | 11.0 |
| Micrometer | 1.16 |

Notable new features (informational, not required for migration):
- HTTP Service Clients auto-configuration
- API Versioning auto-configuration (`spring.mvc.apiversion.*`)
- `logging.console.enabled` property
- `management.tracing.enabled` → `management.tracing.export.enabled`

### Items Requiring Manual Review After OpenRewrite
1. Kotlin version upgrade (2.1.10 → 2.2.20)
2. H2Dialect removal from application.properties
3. Any import changes OpenRewrite missed (especially `HttpHeaders` usage if treating as `MultiValueMap`)
4. Compilation errors from removed deprecated APIs
5. Runtime behavior changes (Jackson 3, Hibernate 7.1, H2 2.4)
