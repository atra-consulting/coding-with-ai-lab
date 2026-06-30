# Implementation Plan: ADD-CLAIM-ENDPOINT

## Test Command
`cd /Users/karsten/workspaces/fh/repos/coding-with-ai-lab-2/backend && npm test`

## Tasks

### 1. Backend — agentTaskService
- [ ] Add `start(id: number): Promise<AgentTaskDTO>` method
  - UPDATE `status='IN_PROGRESS'`, `pickedUpAt=now`, `updatedAt=now` WHERE `id=? AND status='OPEN'`
  - On 0 rows affected: call `findById(id)` (throws 404 if missing), then throw ConflictError 409
  - 409 message must distinguish: "already IN_PROGRESS" vs "terminal status (DONE/REJECTED)"
  - Idempotency: re-calling on already-IN_PROGRESS task returns 409 (not idempotent)

### 2. Backend — ticketService
- [ ] Add `start(id: number): Promise<TicketDTO>` method
  - UPDATE `status='IN_PROGRESS'`, `pickedUpAt=now`, `updatedAt=now` WHERE `id=? AND status='TODO' AND owner='AI'`
  - On 0 rows affected: call `findById(id)` (throws 404 if missing), then throw ConflictError 409
  - Owner is NOT changed (stays AI — it was already AI by guard)
  - Return via `findById(id)` which includes the comments array
  - 409 covers: wrong status, wrong owner, or terminal state

### 3. Backend — agentTasks route
- [ ] Add `POST /:id/start` in parameterized section (after `/reset`, before `GET /:id`)
  - Auth: `requireAgentToken`
  - Parse id, call `agentTaskService.start(id)`, return 200 + task

### 4. Backend — tickets route
- [ ] Add `POST /:id/start` in parameterized section (after `/reset` literal route, alongside `/:id/done` and `/:id/ask`)
  - Auth: `requireAgentToken`
  - Parse id, call `ticketService.start(id)`, return 200 + ticket

### 5. Docs — API-TASKS.md
- [ ] Under `GET /api/agent-tasks/:id`: add explicit read-only note (does not change status)
- [ ] Add new `POST /api/agent-tasks/:id/start` section (agent auth, 200/404/409/401 table, curl example)
- [ ] Update auth header section: add `/:id/start` to agent token endpoint list
- [ ] Update "For skill authors" table: add `Start` row
- [ ] Update lifecycle diagram comment to show `/start` as alternate path to IN_PROGRESS

### 6. Docs — API-TICKETS.md
- [ ] Under `GET /api/tickets/:id`: add explicit read-only note (does not change status)
- [ ] Add new `POST /api/tickets/:id/start` section (agent auth, 200/404/409/401 table, curl example)
- [ ] Update auth header section: add `/:id/start` to agent token endpoint list
- [ ] Update "For skill authors" table: add `Start` row
- [ ] Update state machine diagram: add `POST /start` as `TODO (owner=AI) → IN_PROGRESS` transition

### 7. Verification
- [ ] Run `cd backend && npx tsc --noEmit` — zero type errors
- [ ] Run `cd backend && npm test` — all tests green

## Tests

### New suite in `agentTasks.spec.ts` — `POST /api/agent-tasks/:id/start`
- [ ] OPEN task → 200, status=IN_PROGRESS, pickedUpAt set
- [ ] Already IN_PROGRESS task → 409
- [ ] DONE task → 409
- [ ] REJECTED task → 409
- [ ] Unknown id → 404
- [ ] No token (with localhost bypass) → 200
- [ ] Wrong token → 401

### New suite in `tickets.spec.ts` — `POST /api/tickets/:id/start`
- [ ] TODO + owner=AI ticket → 200, status=IN_PROGRESS, pickedUpAt set, comments array present
- [ ] TODO + owner=HUMAN ticket → 409
- [ ] Already IN_PROGRESS ticket → 409
- [ ] ON_HOLD ticket → 409
- [ ] DONE ticket → 409
- [ ] Unknown id → 404
- [ ] No token (with localhost bypass) → 200
- [ ] Wrong token → 401

Existing tests: no changes needed (additive-only change).
