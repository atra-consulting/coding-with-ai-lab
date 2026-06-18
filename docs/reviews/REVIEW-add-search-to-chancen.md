# Code Review - add-search-to-chancen

**Date**: 2026-06-18
**Branch**: add-search-to-chancen
**Base**: main
**Files Reviewed**: 3
**Review Rounds**: 1

## Summary

Adds optional `search` query parameter to `GET /api/chancen` that filters by deal title using a case-insensitive LIKE query. Implementation follows the `firmaService.findAll` pattern. One fix applied: array query param handling.

## Review Rounds

### Round 1

**Issues found**: 1 | **Fixes applied**: 1

| # | Severity | File | Issue | Found by | Fix | Fixed by |
|---|----------|------|-------|----------|-----|----------|
| 1 | WARNING | `backend/src/routes/chancen.ts:32` | `?search=a&search=b` silently passed array to service — Express parses duplicate params as `string[]` | be-reviewer | Extract first element when array: `Array.isArray(searchRaw) ? searchRaw[0] : searchRaw` | be-coder |

Pre-existing issues noted but not fixed (out of scope):
- Phase validation 400 bypasses global error handler (pre-existing in chancen.ts)
- Leading-wildcard LIKE causes full table scan (same as firmaService, acceptable at this scale)

## Remaining Issues

No remaining issues.

## Project Context Validation

- Follows `firmaService.findAll` LIKE pattern exactly
- `trimmedSearch` guard is actually more correct than firmaService (trims whitespace before applying filter)
- Parameterized queries — no SQL injection risk
- Tests cover: search match, case-insensitive, no results, combined search+phase, baseline, 401

## Next Steps

- Run tests to confirm fix
- Create PR targeting `add-adresse-typ-field`

---
Generated with Claude Code - review v1.7.0
