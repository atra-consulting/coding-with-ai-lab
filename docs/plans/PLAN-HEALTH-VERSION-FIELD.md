# Implementation Plan: HEALTH-VERSION-FIELD

Source: APP_LOG agent task #9 (WARN, /api/health).

## Problem

`GET /api/health` returns only `{ status, timestamp }`. Monitoring tooling needs a
`version` field to confirm which build is running. `backend/package.json` already
declares `"version": "1.0.0"`.

## Test Command
`cd backend && npx playwright test`

## Tasks

### 1. Backend
- [ ] Import the `version` from `backend/package.json` in `backend/src/app.ts`
      using a JSON import attribute (ESM + `resolveJsonModule` already enabled).
- [ ] Add `version` to the `/api/health` response so it returns
      `{ status, timestamp, version }`.

### 2. Test Implementation
- [ ] Add a Playwright API test asserting `GET /api/health` returns HTTP 200 with
      `status === 'ok'`, an ISO `timestamp`, and `version` matching package.json.

### 3. Verification
- [ ] Run the backend Playwright suite. All green.

## Tests
### Integration Tests
- [ ] `GET /api/health` → 200, body has `status`, `timestamp`, `version === '1.0.0'`.
