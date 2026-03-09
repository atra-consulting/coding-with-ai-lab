# Implementation Plan: FASTER-DEV-STARTUP

## Test Command

```bash
cd backend && mvn clean compile && cd ../ciam && mvn clean compile && cd ../frontend && npx ng build
```

## Tasks

### 0. Baseline Timing (Before)

- [ ] Make sure no services are running (`lsof -ti:8081,7070,7200` — kill if needed)
- [ ] Run `time ./start.sh` and measure wall-clock time until "Frontend is ready" or Angular compilation message appears
- [x] Record the baseline time in this section: **Before: 25 seconds** (CIAM 13s + Backend 6s + Frontend 6s, all sequential)

### 1. Rewrite `start.sh` — Persistent CIAM & Faster Startup

- [ ] Add `--restart-ciam` to argument parser (alongside `--reset-db`, `--no-demo`)
- [ ] Update usage text with new flag
- [ ] Add CIAM liveness check at the top: `curl -s http://localhost:8081/.well-known/jwks.json`
  - If reachable: print "CIAM already running — reusing.", set `CIAM_ALREADY_RUNNING=true`
  - If not reachable: start CIAM as before, set `CIAM_ALREADY_RUNNING=false`
- [ ] If `--restart-ciam` or `--reset-db`: kill existing CIAM (find PID via `lsof -ti:8081`), then start fresh
- [ ] While waiting for CIAM readiness, run frontend npm install check in parallel (background subshell)
- [ ] Reduce CIAM and backend poll intervals from `sleep 2` to `sleep 1`
- [ ] Update `cleanup()`: only kill CIAM if `CIAM_ALREADY_RUNNING=false` (i.e., we started it this session)
  - Print "CIAM left running for next start." when leaving it alive
  - Print "Hint: use --restart-ciam to force restart CIAM"
- [ ] Update final status message to indicate CIAM persistence

### 2. Add Spring Boot DevTools to Backend

- [ ] Add `spring-boot-devtools` dependency to `backend/pom.xml`:
  ```xml
  <dependency>
      <groupId>org.springframework.boot</groupId>
      <artifactId>spring-boot-devtools</artifactId>
      <scope>runtime</scope>
      <optional>true</optional>
  </dependency>
  ```
- [ ] Add DevTools config to `backend/src/main/resources/application-dev.properties`:
  ```properties
  spring.devtools.restart.enabled=true
  spring.devtools.livereload.enabled=true
  ```

### 3. Update Documentation

- [ ] Update CLAUDE.md `## Build & Run` section with:
  - Note about CIAM persistence (stays running between restarts)
  - `--restart-ciam` flag documentation
  - Hot reload workflow: "Change Java code → `mvn compile` in backend/ → auto-restart"
  - Note that Angular live reload is automatic with `ng serve`

### 4. Verification & After Timing

- [ ] Run `cd backend && mvn clean compile` — no errors
- [ ] Run `cd ciam && mvn clean compile` — no errors
- [ ] Run `cd frontend && npx ng build` — no errors
- [ ] Review `start.sh` logic manually for correctness
- [x] **Cold start timing:** Kill all services, run `time ./start.sh`, record time: **After (cold): 19 seconds**
- [x] **Warm start timing (CIAM already running):** Ctrl+C, then run `time ./start.sh` again: **After (warm): 13 seconds**
- [x] Compare: Before 25s → Cold 19s (24% faster) → Warm 13s (48% faster)

## Tests

### Manual Tests
- [ ] First run: CIAM starts, all services come up
- [ ] Ctrl+C: backend and frontend stop, CIAM stays running
- [ ] Second run: "CIAM already running", skips CIAM startup
- [ ] `--restart-ciam`: kills existing CIAM, starts fresh
- [ ] `--reset-db`: deletes databases, restarts CIAM
- [ ] `--reset-db --restart-ciam`: both flags work together
- [ ] Backend DevTools: change a Java file, run `mvn compile`, see restart in logs
