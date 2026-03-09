# PRD: Faster Dev Startup & Hot Reload

## Source

User request to speed up `start.sh` and enable automatic reloading during development.

## Problem Statement

**Slow startup:** `start.sh` starts all three services sequentially — CIAM, then backend, then frontend. CIAM alone takes 10-20 seconds and blocks everything else. On most dev sessions, CIAM code never changes — yet it restarts every time.

**No hot reload for backend:** When a Java source file changes, developers must restart the entire stack. Angular already has live reload built-in via `ng serve`.

## Requirements

### R1: Persistent CIAM — Start Once, Reuse on Future Runs

- On `start.sh`, check if CIAM is already running by hitting `http://localhost:8081/.well-known/jwks.json`
- **If reachable:** Skip CIAM startup entirely. Print "CIAM already running — reusing."
- **If not reachable:** Start CIAM as before, but in the background
- On Ctrl+C, do NOT kill CIAM. Only stop backend and frontend. Print "CIAM left running for next start."
- Add a `--restart-ciam` flag to force-restart CIAM (kill existing, start fresh)
- `--reset-db` should also restart CIAM (since it deletes the CIAM database)

### R2: Faster Startup for Backend and Frontend

- While waiting for CIAM (if it needs starting), run frontend `npm install` check in parallel
- Reduce polling interval from 2s to 1s for readiness checks
- Start backend immediately after CIAM is ready (no change here — already sequential for good reason)

### R3: Spring Boot DevTools for Backend

- Add `spring-boot-devtools` dependency to backend `pom.xml` (runtime scope, optional)
- Automatic restart on classpath changes (recompile triggers restart)
- LiveReload server for browser notification (port 35729)
- Developer runs `mvn compile` or uses IDE auto-build to trigger reload

### R4: Angular Live Reload (Already Working)

- Angular `ng serve` already provides HMR and live reload — no changes needed
- Document this for developer awareness

## Implementation Approach

1. **`start.sh` restructure:** Check CIAM liveness first. Skip if running. On shutdown, leave CIAM alive. Add `--restart-ciam` flag. Run frontend npm check in parallel with CIAM wait.
2. **DevTools dependency:** Add `spring-boot-devtools` to backend `pom.xml` with `<optional>true</optional>` and `<scope>runtime</scope>`.
3. **DevTools properties:** Configure restart excludes and LiveReload in dev profile properties.
4. **Documentation:** Update CLAUDE.md build section with hot reload workflow.

## Test Strategy

- Run `start.sh` first time — CIAM starts, all services come up
- Ctrl+C — backend and frontend stop, CIAM stays running
- Run `start.sh` again — "CIAM already running", backend and frontend start immediately (much faster)
- Run `start.sh --restart-ciam` — CIAM killed and restarted
- Run `start.sh --reset-db` — all databases deleted, CIAM restarted
- Verify backend DevTools: change a Java file, run `mvn compile`, confirm restart in logs
- Verify Angular live reload still works (already built-in)

## Non-Functional Requirements

- DevTools must NOT activate in production (default behavior — auto-disables in packaged JAR)
- No change to existing API behavior or database handling
- `start.sh` must still handle `--reset-db` and `--no-demo` flags
- CIAM left running should not cause issues if developer reboots (stale process dies naturally)

## Success Criteria

- Second `start.sh` run skips CIAM startup entirely — noticeably faster
- Backend auto-restarts on recompile without manual restart
- Ctrl+C only stops backend + frontend, leaves CIAM running
- `--restart-ciam` and `--reset-db` correctly force CIAM restart
- No regressions in existing functionality
