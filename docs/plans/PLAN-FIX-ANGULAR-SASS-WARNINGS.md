# Implementation Plan: FIX-ANGULAR-SASS-WARNINGS

## Test Command
`cd frontend && npm run build`

## Tasks
### 1. Fix Angular Localize Warning
- [ ] Remove `import '@angular/localize/init';` from `frontend/src/main.ts` (already in polyfills in `angular.json`)

### 2. Fix Sass Deprecations in Project Files
- [ ] Update `frontend/src/app/features/login/login.component.scss` to use `@use "sass:color";` and `color.adjust` instead of `darken()`

### 3. Silence Third-Party Sass Warnings
- [ ] Update `frontend/angular.json` to add `stylePreprocessorOptions` with `quietDeps: true` for Sass to silence `node_modules/bootstrap` warnings

### 4. Verification
- [ ] Run `npm run build` in `frontend` directory and verify warnings are gone

## Tests
### Build Verification
- [ ] Verify build output for absence of the reported warnings
