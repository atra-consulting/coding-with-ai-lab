# Implementation Plan: REMOVE-TIMER-LOGIC

## Test Command
`cd frontend && npx ng build`

## Summary
Remove the countdown timer that gates access to the login button on the welcome page. After this change, the welcome page always shows the login button without any date check.

## Tasks

### 1. Simplify welcome.component.ts
- [ ] Remove `OnInit`, `OnDestroy` imports and interface implementations
- [ ] Remove `signal` import
- [ ] Remove `targetDate`, `intervalId` fields
- [ ] Remove `days`, `hours`, `minutes`, `seconds`, `countdownFinished` signals
- [ ] Remove `ngOnInit()`, `ngOnDestroy()`, `updateCountdown()` methods
- [ ] Result: a simple component with no logic

### 2. Simplify welcome.component.html
- [ ] Remove the entire countdown `@if (!countdownFinished())` block (lines 13-35)
- [ ] Remove the "Die Schulung hat begonnen!" text (lines 36-38)
- [ ] Remove the `@if (countdownFinished())` guard around the login button (lines 39, 41)
- [ ] Keep the login button `<a>` always visible
- [ ] Update subtitle text — remove the specific date/time reference ("07.04.2026, 13:00 Uhr")

### 3. Clean up welcome.component.scss
- [ ] Remove `.countdown-label` styles (lines 97-103)
- [ ] Remove `.countdown` styles (lines 105-110)
- [ ] Remove `.countdown-item` styles (lines 112-117)
- [ ] Remove `.countdown-value` styles (lines 119-125)
- [ ] Remove `.countdown-unit` styles (lines 127-133)
- [ ] Remove `.countdown-separator` styles (lines 135-141)
- [ ] Remove `.ready-text` styles (lines 143-148)

### 4. Verification
- [ ] Run `cd frontend && npx ng build` — must succeed
- [ ] Verify no references to countdown/timer remain in welcome component files
