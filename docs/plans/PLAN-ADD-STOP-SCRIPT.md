# Implementation Plan: ADD-STOP-SCRIPT

## Test Command
`bash -n stop.sh` (syntax check) + manual verification

## Tasks

### 1. Create `stop.sh`
- [ ] Create `stop.sh` in project root
- [ ] Find CIAM process on port 8081 using `lsof -ti:8081` (same pattern as `start.sh` lines 63-76)
- [ ] Send SIGTERM, wait up to 10s for port to free
- [ ] Report status (stopped / not running / failed to stop)
- [ ] Make executable (`chmod +x`)

### 2. Update `CLAUDE.md`
- [ ] Add `./stop.sh` to Build & Run section

## Design Notes
- Reuse the same `lsof -ti:8081` pattern from `start.sh` for consistency
- Keep it simple — no flags needed, just stop CIAM
