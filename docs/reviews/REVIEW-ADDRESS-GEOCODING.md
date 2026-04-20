# Code Review: ADDRESS-GEOCODING

## Summary

Solid implementation across all three phases. REQ-001 through REQ-010 are covered, including the subtle update-preservation semantics, the production rate-limit floor, `AbortSignal.timeout`, the single-flight guard, the role-based guard, and the sidebar section-level hiding. Tests cover the PRD success criteria with one documented exception (rate-limit specs skipped). Code style matches the surrounding codebase. No security-relevant deviations. Ready to merge once the warnings below are addressed; the "Critical" bucket is empty.

## Critical issues

- None.

## Warnings

- `backend/src/test/geocoding-rate-limit.spec.ts` contains two `test.skip` calls with a long TODO justifying why module-level env reads cannot be reset per test. The rationale is correct, but this leaves the PRD's "≥1s in production" acceptance (REQ-004) unverified by an automated test. Either refactor `geocodingService.ts` to read `GEOCODING_SLEEP_MS` / `NODE_ENV` inside a function (lazy, per-call) or spawn a child process in one extra scenario (plan T1 called this out). This was on the plan, got dropped, and deserves a follow-up ticket at minimum.
- `backend/src/services/geocodingService.ts:16` uses `Number.parseInt('')` which returns `NaN`, and then `Number.isFinite(NaN)` is `false`, so the fallback to 3000 works. But `parseInt('500abc')` returns `500`, silently. Prefer `Number(process.env.GEOCODING_SLEEP_MS)` or guard against non-digit strings. Same issue: negative values pass through untouched outside production.
- `backend/src/services/geocodingService.ts:81` returns `null` for an empty Nominatim array. In `runGeocodingBatch` that null branch increments `failed` and logs "not found by Nominatim" — correct per REQ-006, but the function's JSDoc says "Returns ... null on success, null when not found." That's misleading; the null is actually "not found / counted as failed," not a success path. Tighten the comment.
- `backend/src/test/admin-geocoding.spec.ts` has an ordering hazard: `test.describe('Concurrency', ...)` creates a second admin login context while the first request is in flight. The second login writes a cookie to `adminCtx2` before POST fires, but `test.beforeAll` ran `resetDatabase()` once — subsequent tests mutate global state. Since `fullyParallel: false` and `workers: 1`, this works in practice, but comment it. If anyone raises `workers`, this suite will flake badly.
- `frontend/src/app/features/admin/admin-geocoding.component.ts:63` restores focus via `queueMicrotask`. When `running` flips to `false`, Angular needs a change-detection pass before the button is `[disabled]=false` again. A microtask likely fires before CD re-runs, so the focus call hits a still-disabled element and silently fails. Use `setTimeout(..., 0)` or an `afterNextRender` hook instead.
- The admin geocoding page POSTs with no client-side timeout override. The PRD REQ-009 explicitly said: "The HTTP client timeout for this call must be raised or disabled." The repo has no global timeout interceptor today (plan noted this), so the default "no timeout" applies and the requirement is effectively met — but there is no defensive comment or test guarding against a future interceptor being added. A one-line comment near the `http.post` call would pay for itself.
- `POST /api/adressen` returns 201 in the test and in the route handler — good — but I did not see a route-level spec confirming this specific status previously. The new tests assert `status 201`, which is correct; flagging only so it's not missed if the status was previously 200 elsewhere.

## Suggestions

- `backend/src/services/geocodingService.ts:85-86` casts `first['lat']` through `as string` before `parseFloat`. Nominatim does return strings, but a cleaner approach is `const latRaw = first['lat']; if (typeof latRaw !== 'string') throw …;`.
- `runGeocodingBatch` logs each failure with `console.error`, including the "skipped — no city and no postalCode" case. Skips are benign data-quality signals, not errors; `console.warn` or `console.info` would read better in ops logs.
- `admin-geocoding.component.html` has `<span class="ms-2" aria-hidden="true">Läuft…</span>` in the plan but the template has no `ms-2` class on that span. Trivial spacing polish.
- `AdresseDTO` now exposes lat/long on every read path including `/api/adressen/all`. No existing consumer breaks (verified frontend model adds the fields), but keep an eye on bandwidth for large list responses in the future.
- `admin-geocoding.component.ts` imports: `[]` — fine because only built-in `@if` blocks are used. If someone later adds `[formControl]` or a pipe, it will fail silently until the template compiles. Not a defect, just a fragility note.
- The frontend `AdminService` sends `{}` as the body for a POST that doesn't need one. Express accepts it, but an empty body (`undefined` / `null`) is more conventional. Cosmetic.

## Verdict

Approve (with warnings) — no blocking defects; address the skipped rate-limit test, focus-restore timing, and JSDoc nit in a small follow-up.
