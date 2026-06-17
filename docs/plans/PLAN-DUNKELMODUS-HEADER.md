# Implementation Plan: DUNKELMODUS-HEADER

## Test Command
`cd frontend && npx ng build 2>&1 | tail -10`

## Tasks

### 1. Create ThemeService
- [ ] New file: `frontend/src/app/core/services/theme.service.ts`
- [ ] Signal `isDark = signal<boolean>(false)` — initial value from `localStorage`
- [ ] `effect()` that writes to `localStorage` and sets `document.documentElement.setAttribute('data-bs-theme', isDark() ? 'dark' : 'light')`
- [ ] `toggleTheme()` method
- [ ] Apply theme on init (set attribute in constructor from stored value)

### 2. Update NavbarComponent
- [ ] Inject `ThemeService`
- [ ] Import `faMoon`, `faSun` from `@fortawesome/free-solid-svg-icons`
- [ ] Computed `themeIcon` returns `faMoon` when light, `faSun` when dark
- [ ] Add small icon-button to template (right of username, left of logout)
- [ ] Button shows `faMoon` (Mond) in light mode, `faSun` (Sonne) in dark mode
- [ ] Click calls `themeService.toggleTheme()`

### 3. Verification
- [ ] `cd frontend && npx ng build` — no errors
- [ ] Button renders in header
- [ ] Clicking toggles `data-bs-theme` on `<html>`
- [ ] `localStorage` key persists across reloads

## Tests
- Angular build passes (type-safe, no compile errors)
- Manual: toggle persists after page reload
