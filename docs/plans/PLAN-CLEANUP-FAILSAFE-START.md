# Implementation Plan: CLEANUP-FAILSAFE-START

## Test Command
`cd backend && ./mvnw clean compile && cd ../frontend && npx ng build`

## Tasks

### 1. Remove Workshop Task Descriptions
- [ ] Delete all files in `docs/tasks/` (02 through 06)
- [ ] Remove `docs/tasks/` directory

### 2. Add Maven Wrapper to Backend
- [ ] Generate Maven Wrapper files in `backend/` (`mvnw`, `mvnw.cmd`, `.mvn/wrapper/`)
- [ ] Verify `cd backend && ./mvnw clean compile` works
- [ ] Remove global `mvn` dependency from start.sh

### 3. Make start.sh Failsafe
- [ ] Add Java version check: parse `java -version`, require 21+, error with helpful message if missing or too old
- [ ] Add Node.js version check: require Node 20.19+, error with helpful message if missing or too old
  - Angular 21 requires `^20.19.0 || ^22.12.0 || ^24.0.0`
- [ ] Replace `mvn` with `./mvnw` in backend commands
- [ ] Remove the `mvn` prerequisite check (wrapper handles it)
- [ ] Keep `--reset-db`, cleanup trap, health-check wait loop
- [ ] Add `.nvmrc` in project root with `20.19.0` for version pinning

### 4. Update CLAUDE.md
- [ ] Update Build & Run section: replace `mvn` with `./mvnw`
- [ ] Note Maven Wrapper usage

### 5. Verification
- [ ] `cd backend && ./mvnw clean compile` succeeds
- [ ] `cd frontend && npx ng build` succeeds
- [ ] `./start.sh` starts both services
- [ ] Java version check rejects Java < 21
