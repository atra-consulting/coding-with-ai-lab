# Code Review - reduce-app-complexity

**Date**: 2026-04-08
**Branch**: reduce-app-complexity
**Base**: main
**Files Reviewed**: 69
**Review Rounds**: 1

## Summary

Simplification refactor removing report builder, dashboard widgets, Kanban board, and role-based permissions. Total ~4,300 lines deleted across 4 phases. Clean removal with 3 residual issues fixed.

## Review Rounds

### Round 1

**Issues found**: 7 | **Fixes applied**: 3

| # | Severity | File | Issue | Found by | Fix | Fixed by |
|---|----------|------|-------|----------|-----|----------|
| 1 | WARNING | `backend/src/utils/validation.ts` | Orphaned `SavedReportCreateSchema`, `DashboardConfigSchema`, `ReportQuerySchema` — dead code after route deletion | be-reviewer | Removed all three schemas and their type exports | direct fix |
| 2 | WARNING | `backend/src/config/users.ts:20` | Stale `DASHBOARD` permission in `ALL_PERMISSIONS` — no backend dashboard route exists | be-reviewer | Removed `DASHBOARD` from `ALL_PERMISSIONS` | direct fix |
| 3 | WARNING | `backend/src/config/users.ts:60` | `demo` user has `roles: ['ADMIN']` — intentional for workshop full access | be-reviewer | — | — |
| 4 | WARNING | `frontend/src/app/core/services/chance.service.ts` | Dead `getAll()` method, unused `HttpParams`/`Page` imports | fe-reviewer | Removed `getAll()`, `HttpParams`, and `Page` import | direct fix |
| 5 | WARNING | `frontend/src/app/layout/sidebar/sidebar.component.ts` | Reported unused `faChartPie` import — false positive, already removed | fe-reviewer | — | — |
| 6 | SUGGESTION | `backend/src/middleware/errorHandler.ts` | `ForbiddenError` handling unreachable after removing `requireRole`/`requirePermission` | be-reviewer | — | — |
| 7 | SUGGESTION | `frontend/src/app/features/dashboard/dashboard.component.ts` | Inline template vs `templateUrl` convention inconsistency | fe-reviewer | — | — |

## Remaining Issues

- `demo` user has `roles: ['ADMIN']` — intentional, no action needed
- `ForbiddenError` handler in `errorHandler.ts` — harmless dead code, left for potential future use
- Dashboard component uses inline template — intentional simplification

## Project Context Validation

- Changes align with CLAUDE.md conventions (Express + Drizzle backend, Angular 21 standalone components)
- All 8 CRUD entities preserved with list/form/detail views
- Session-based auth still works with simplified 2-role model
- Build succeeds, API smoke tests pass

## Next Steps

- Run full manual test if available
- Create PR when ready

---
Generated with Claude Code - review v1.6.0
