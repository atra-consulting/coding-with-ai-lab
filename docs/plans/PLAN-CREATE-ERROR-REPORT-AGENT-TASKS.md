# Implementation Plan: CREATE-ERROR-REPORT-AGENT-TASKS

## Test Command
`cd backend && npm test`

## Tasks

### 1. Add two ERROR_REPORT seed tasks to agentTaskSeed.ts

- [ ] Add task id 17: "GET /api/aktivitaeten does not support text search by subject"
  - Source: ERROR_REPORT
  - Well-specified: exact file paths (aktivitaeten.ts line 24, aktivitaetService.ts line 67), field name (subject), LIKE clause pattern, reference to firmaService.findAll as the pattern to follow
- [ ] Add task id 18: "GET /api/adressen does not support text search by city"
  - Source: ERROR_REPORT
  - Well-specified: exact file paths (adressen.ts, adresseService.ts line 80), field names (city, street), LIKE clause pattern, reference to firmaService.findAll as the pattern to follow
- [ ] File: `backend/src/seed/agentTaskSeed.ts`

### 2. Verification

- [ ] Confirm both tasks use `source: 'ERROR_REPORT'`
- [ ] Confirm IDs 17 and 18 don't conflict with existing entries (current max is 16)
- [ ] Confirm seed data follows exact same TypeScript structure as existing entries
- [ ] Run backend tests to check no regressions
