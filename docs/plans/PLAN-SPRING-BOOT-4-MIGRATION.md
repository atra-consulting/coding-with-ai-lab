# Implementation Plan: SPRING-BOOT-4-MIGRATION

## Test Commands
- `cd /Users/karsten/workspaces/fh/repos/coding-with-ai-lab/backend && mvn clean compile`
- `cd /Users/karsten/workspaces/fh/repos/coding-with-ai-lab/ciam && mvn clean compile`

## Tasks

### 1. Run OpenRewrite on Backend Module
- [ ] Add rewrite-maven-plugin (6.32.0) + rewrite-spring (6.26.0) to `backend/pom.xml`
- [ ] Run `mvn rewrite:run` in backend/
- [ ] Remove rewrite-maven-plugin from `backend/pom.xml`
- [ ] Review changes: parent version bump, starter renames, property migrations
- [ ] Commit OpenRewrite changes

### 2. Run OpenRewrite on CIAM Module
- [ ] Add rewrite-maven-plugin (6.32.0) + rewrite-spring (6.26.0) to `ciam/pom.xml`
- [ ] Run `mvn rewrite:run` in ciam/
- [ ] Remove rewrite-maven-plugin from `ciam/pom.xml`
- [ ] Review changes: parent version bump, starter renames, property migrations, jackson-module-kotlin group ID
- [ ] Commit OpenRewrite changes

### 3. Manual Fixes — CIAM Module
- [ ] Upgrade Kotlin version: `<kotlin.version>2.1.10</kotlin.version>` → `<kotlin.version>2.2.20</kotlin.version>` in `ciam/pom.xml`
- [ ] Remove `spring.jpa.database-platform=org.hibernate.dialect.H2Dialect` from `ciam/src/main/resources/application.properties` (if OpenRewrite didn't already)
- [ ] Commit manual CIAM fixes

### 4. Manual Fixes — Backend Module
- [ ] Remove `spring.jpa.database-platform=org.hibernate.dialect.H2Dialect` from `backend/src/main/resources/application.properties` (if OpenRewrite didn't already)
- [ ] Commit manual backend fixes

### 5. JJWT Jackson 3 Compatibility
- [ ] Check if JJWT 0.12.6 is compatible with Jackson 3 (both modules use jjwt-jackson)
- [ ] If incompatible: upgrade JJWT to latest version with Jackson 3 support, or switch jjwt-jackson scope/dependency strategy
- [ ] Commit JJWT changes if needed

### 6. Compile Verification
- [ ] Run `cd backend && mvn clean compile` — fix any errors
- [ ] Run `cd ciam && mvn clean compile` — fix any errors
- [ ] Iterate until both compile cleanly

### 7. Post-Compile Review
- [ ] Verify `spring.jackson.serialization.write-dates-as-timestamps` was properly migrated in both modules
- [ ] Verify `spring-boot-starter-web` was renamed to `spring-boot-starter-webmvc` in both modules
- [ ] Verify Spring Boot parent version is 4.0.x in both pom.xml files
- [ ] Check SecurityConfig.java (backend) compiles with Spring Security 7
- [ ] Check SecurityConfig.kt (CIAM) compiles with Spring Security 7

## Codebase Impact Summary

### Files Modified by OpenRewrite (expected)
- `backend/pom.xml` — parent version, starter renames
- `ciam/pom.xml` — parent version, starter renames, jackson group ID
- `backend/src/main/resources/application.properties` — property renames
- `ciam/src/main/resources/application.properties` — property renames

### Files Modified Manually
- `ciam/pom.xml` — Kotlin version 2.1.10 → 2.2.20
- `backend/src/main/resources/application.properties` — remove H2Dialect line
- `ciam/src/main/resources/application.properties` — remove H2Dialect line
- Both `pom.xml` — possible JJWT version bump

### Files NOT Affected (confirmed clean)
- No HttpHeaders-as-MultiValueMap usage
- No ListenableFuture usage
- No RestTemplate usage
- No @EntityScan usage
- No @JsonComponent/@JsonMixin usage
- No @Nullable usage
- No test files exist
- All imports already use jakarta.* namespace
- Security configs use modern lambda DSL (compatible with Spring Security 7)

## Risk: JJWT + Jackson 3
`io.jsonwebtoken:jjwt-jackson:0.12.6` was built against Jackson 2 (`com.fasterxml.jackson`). Spring Boot 4 ships Jackson 3 (`tools.jackson`). If JJWT 0.12.6 cannot find Jackson 2 classes at runtime, JWT signing/validation will fail. Options:
1. Upgrade JJWT to a version that supports Jackson 3
2. Add explicit Jackson 2 dependency alongside Jackson 3 (not recommended — classpath conflicts)
3. Use `jjwt-gson` or `jjwt-orgjson` instead of `jjwt-jackson`
