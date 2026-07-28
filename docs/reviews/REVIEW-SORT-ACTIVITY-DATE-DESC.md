# Code Review: SORT-ACTIVITY-DATE-DESC

## Summary
No blocking issues. One test incompleteness fixed (spinner test now asserts post-emission state).

## Findings

### Fixed
- **spec.ts:99** — Spinner test (`should show loading spinner while service is pending`) only asserted the before-emit state; did not call `fixture.detectChanges()` after `subject.complete()`. Fixed by adding `tick() + detectChanges() + expect(spinner).toBeNull()`.

### Noted (not actionable for this PR)
- `component.ts:76` — Pre-existing: error callback in `ngOnInit` swallows service errors silently. Out of scope for this change.
- `spec.ts` — `httpMock` + `provideHttpClient/Testing` are unused (service is fully mocked). Pattern is consistent with the project's `firma-list.component.spec.ts` — kept for consistency.
- `spec.ts` — `fakeAsync/tick` wraps synchronous `of()` observables in some tests. Harmless; keeps tests safe if observables become async.

## Verdict
**APPROVED** — `initialSort: 'desc'` correctly sets the AG Grid default sort. Tests pass (138/138).
