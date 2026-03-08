# Implementation Plan: UPGRADE-ANGULAR-21

## Test Command
```bash
cd frontend && npx ng build
```

## Pre-Upgrade Status
- Angular: 20.3.0
- TypeScript: 5.9.2 (already meets v21 requirement)
- `provideZoneChangeDetection()`: already present in `app.config.ts`
- `typeCheckHostBindings: true`: already set in `tsconfig.json`

## Tasks

### 1. Run ng update
- [ ] Run `ng update @angular/core@21 @angular/cli@21` in the frontend directory
- [ ] Review and accept any automated migrations
- [ ] Check for peer dependency warnings

### 2. Update Third-Party Dependencies
- [ ] Update `@angular/cdk` to v21-compatible version
- [ ] Update `@ng-bootstrap/ng-bootstrap` if needed for Angular 21
- [ ] Update `@fortawesome/angular-fontawesome` if needed
- [ ] Update `ng2-charts` if needed
- [ ] Update `zone.js` if required by Angular 21

### 3. Build Verification
- [ ] Run `npx ng build` to check for compilation errors
- [ ] Fix any host binding type checking errors if surfaced
- [ ] Fix any other breaking changes

### 4. Update CLAUDE.md
- [ ] Update Angular version reference from 20 to 21

## Verification
- [ ] `npx ng build` completes without errors
- [ ] No TypeScript compilation errors
- [ ] Package versions are consistent in package.json
