# Implementation Plan: AGENT-TASK-UNAUTH-ENDPOINT

## Test Command
`cd backend && npx playwright test`

## Tasks

### 1. New combined middleware
- [ ] Add `requireAgentTokenOrAdminSession` to `backend/src/middleware/agentAuth.ts`
  - Loopback bypass (AGENT_AUTH_ALLOW_LOOPBACK=1 + from localhost + no auth/forwarding headers)
  - Fall back to agent token validation
  - Fall back to admin session + ADMIN role

### 2. Route changes
- [ ] `backend/src/routes/agentTasks.ts`: replace `requireAuth, requireRole('ADMIN')` on `GET /:id` with `requireAgentTokenOrAdminSession`
- [ ] `backend/src/routes/tickets.ts`: replace `requireAuth, requireRole('ADMIN')` on `GET /:id` with `requireAgentTokenOrAdminSession`

### 3. Documentation
- [ ] `docs/API-TASKS.md`: update `GET /:id` auth section
- [ ] `docs/API-TICKETS.md`: update `GET /:id` auth section

## Auth behavior after change

| Caller | Environment | Method | Result |
|--------|-------------|--------|--------|
| Skill | Local (LOOPBACK=1) | No headers | Pass (loopback bypass) |
| Skill | CI | Agent token | Pass |
| Admin UI | Local | Session cookie | Pass (loopback bypass, no auth header) |
| Admin UI | Production | Session cookie | Pass (session path) |
| Agent | Production | Agent token | Pass |
