# Implementation Plan: LOCALHOST-NO-TOKEN-AUTH

## Test Command
`cd backend && npx playwright test`

## Tasks

### 1. Middleware: `backend/src/middleware/agentAuth.ts`

- [ ] Keep the existing `configuredToken` guard first (so missing env var still returns 401 even from localhost)
- [ ] Add `isLocalhostRequest` helper: checks `req.socket?.remoteAddress ?? ''` against `'127.0.0.1'`, `'::1'`, `'::ffff:127.0.0.1'`
  - Use `req.socket.remoteAddress`, NOT `req.ip` — `app.ts` sets `trust proxy: 1`, so `req.ip` can be spoofed via `X-Forwarded-For`
- [ ] After the `configuredToken` guard, add: if localhost AND no `Authorization`/`X-Agent-Token` header → `next()` and return
- [ ] All other paths fall through to existing SHA-256 `timingSafeEqual` check (unchanged)

### 2. Test updates: `backend/src/test/agentTasks.spec.ts`

These three tests use `anon` (no headers). Each is in its own `describe` with `beforeEach: resetDatabase()`, so task 1 is OPEN at the start of each test.

- [ ] Line 208: rename "no auth header → 401" → "no auth header from localhost → 200, task claimed"; change 401 → 200
- [ ] Line 352: rename "no auth header → 401" → "no auth header from localhost → 200, task rejected"; change 401 → 200
- [ ] Line 454: rename "no auth header → 401" → "no auth header from localhost → 200, task done"; change 401 → 200
- [ ] Leave all "wrong Bearer token → 401" tests unchanged (token provided → still validated)

### 3. Test updates: `backend/src/test/tickets.spec.ts`

These three tests share state (describe with `beforeAll: resetTickets`; tests run sequentially):

- [ ] Line 155: rename "GET /next without token → 401" → "GET /next without token from localhost → 200"; change 401 → 200 (ticket 1 gets claimed → IN_PROGRESS)
- [ ] Line 166: rename "POST /1/done without token → 401" → "POST /1/done without token from localhost → 200"; change 401 → 200 (ticket 1 is IN_PROGRESS → DONE)
- [ ] Line 177: rename "POST /1/ask without token → 401" → "POST /1/ask without token from localhost → 409"; change 401 → 409 (ticket 1 is DONE → wrong state, but auth bypassed)
- [ ] Leave all "wrong token → 401" tests unchanged

### 4. Test updates: `backend/src/test/cron.spec.ts`

- [ ] Line 134: rename "no agent token → 401" → "no agent token from localhost → 404 (run not found)"; change 401 → 404 (auth bypassed, run id 1 does not exist)

### 5. Docs: `docs/API-TASKS.md`

- [ ] In the "Agent token" section, after the bullet "Missing or wrong token → **401**", add localhost bypass note

### 6. Docs: `docs/API-TICKETS.md`

- [ ] In the "Agent token" section, after the bullet "Missing or wrong token → **401**", add localhost bypass note

### 7. Verification
- [ ] Run `cd backend && npx tsc --noEmit` — no type errors
- [ ] Run `cd backend && npx playwright test` — all modified tests pass with new assertions; "wrong token" tests still 401
