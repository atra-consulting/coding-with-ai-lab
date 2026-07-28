# Implementation Plan: UPDATE-API-TOKEN-AUTH

## Test Command
`cd backend && npx playwright test`

## Tasks

### 1. Create backend/.env.example (committed template)
- [ ] Create `backend/.env.example` with `AGENT_API_TOKEN=` (empty, fill in yourself) and `APP_BASE_URL=http://localhost:7070`
- [ ] Add comments explaining each var and how to copy to `backend/.env`

### 2. Update docs/API-TASKS.md
- [ ] Add "Local setup" block in the agent-token auth section
- [ ] Show how to copy `.env.example` → `backend/.env`, set `AGENT_API_TOKEN`, export vars for curl
- [ ] Keep and integrate the existing `backend/.env` mention

### 3. Update docs/API-TICKETS.md
- [ ] Add `backend/.env` mention to agent-token auth section (currently missing)
- [ ] Add the same "Local setup" block as in API-TASKS.md
- [ ] Both docs must be consistent

### 4. Verify read-only agent endpoints work with the token
- [ ] Run `cd backend && npx playwright test` to confirm `GET /api/tickets/next` and `GET /api/agent-tasks/next` pass with `TEST_AGENT_TOKEN`
- [ ] Check auth matrix tests in `tickets.spec.ts` and `agentTasks.spec.ts` pass
- [ ] Fix any failures found

### 5. Verification
- [ ] `backend/.env.example` exists with correct vars
- [ ] Both docs have identical "Local setup" blocks
- [ ] All curl examples in both docs use `$AGENT_API_TOKEN` and `$APP_BASE_URL`
- [ ] Tests pass (agent GET endpoints return 200 with valid token, 401 without)
