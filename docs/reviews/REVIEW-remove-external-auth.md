# Code Review - remove-external-auth

**Date**: 2026-03-30
**Branch**: remove-external-auth
**Base**: main
**Files Reviewed**: 20 (modified/created), 47 (deleted)
**Review Rounds**: 3

## Summary

Removed the CIAM microservice (JWT/OAuth2 auth) and replaced it with session-based authentication using 5 hardcoded in-memory users. Login page redesigned with clickable user cards. Benutzer management feature removed. Scripts and docs updated. All changes align with the PRD.

## Review Rounds

### Round 1

**Issues found**: 6 | **Fixes applied**: 6

| # | Severity | File | Issue | Found by | Fix | Fixed by |
|---|----------|------|-------|----------|-----|----------|
| 1 | WARNING | `AuthController.java:57` | `buildPrincipal` uses raw request username instead of `authentication.getName()` | be-reviewer | Changed to `authentication.getName()` | be-coder |
| 2 | WARNING | `AuthController.java:94-97` | Dead code: null/isAuthenticated guard unreachable with `@PreAuthorize` | be-reviewer | Removed dead guard block | be-coder |
| 3 | CRITICAL | `auth.interceptor.ts:19` | 401 redirect to `/login` missing `returnUrl` param for session expiry | fe-reviewer | Added `returnUrl` query param from `router.url` with loop prevention | fe-coder |
| 4 | WARNING | `login.component.ts:41` | `loadingUser` signal not reset on success, only on error | fe-reviewer | Added `loadingUser.set(null)` in success handler | fe-coder |
| 5 | SUGGESTION | `SecurityConfig.java:153-161` | Inline FQCNs instead of proper imports | be-reviewer | Added imports for `GrantedAuthority`/`SimpleGrantedAuthority` | be-coder |
| 6 | SUGGESTION | `login.component.html:33` | Spinner missing visually-hidden screen reader text | fe-reviewer | Added `<span class="visually-hidden">Laden...</span>` | fe-coder |

### Round 2

**Issues found**: 1 | **Fixes applied**: 1

| # | Severity | File | Issue | Found by | Fix | Fixed by |
|---|----------|------|-------|----------|-----|----------|
| 1 | WARNING | `auth.interceptor.ts:18-25` | 401 error re-thrown after redirect causes double error handling | fe-reviewer | Return `EMPTY` instead of `throwError` after redirect | direct fix |

### Round 3

Clean pass. No issues found.

## Remaining Issues

No remaining issues.

## Project Context Validation

- PRD requirements met: CIAM removed, login cards implemented, session auth working, benutzer feature removed
- CLAUDE.md conventions followed: all controllers have `@PreAuthorize`, standalone Angular components, `inject()` DI, `@if`/`@for` control flow
- All compile/build checks pass

## Next Steps

- Create PR when ready

---
Generated with Claude Code - bpf-review v1.4.0
