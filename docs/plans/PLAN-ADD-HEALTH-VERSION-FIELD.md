# Implementation Plan: ADD-HEALTH-VERSION-FIELD

## Test Command
`cd backend && npx playwright test`

## Tasks

### 1. Backend — Add version to health response
- [ ] In `backend/src/app.ts`, read the `version` field from `backend/package.json` using `createRequire`
- [ ] Add `version` to the `res.json(...)` call in the `GET /api/health` handler

### 2. Test Implementation
- [ ] Add a Playwright API test in `backend/src/test/` for the health endpoint
- [ ] Verify the response shape includes `status`, `timestamp`, and `version`
- [ ] Verify `version` matches `"1.0.0"` (current package.json value)

### 3. Verification
- [ ] Run `cd backend && npx playwright test` to confirm all tests pass

## Tests

### Integration Tests
- [ ] `GET /api/health` returns 200
- [ ] Response body has `status: "ok"`
- [ ] Response body has a `timestamp` string
- [ ] Response body has `version: "1.0.0"`
