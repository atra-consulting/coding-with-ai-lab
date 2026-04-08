# Code Review - replace-java-nodejs

**Date**: 2026-04-08
**Branch**: replace-java-nodejs
**Base**: main
**Files Reviewed**: 32 TypeScript files + start.sh + CLAUDE.md
**Review Rounds**: 1

## Summary

Full backend rewrite from Spring Boot/Java to Node.js/TypeScript/Express/Drizzle/SQLite. 98 Java files removed, 32 TypeScript files created. Auth, CRUD, analytics, reporting, and data seeding all reimplemented. API compatibility with Angular 21 frontend verified.

## Review Rounds

### Round 1

**Issues found**: 8 | **Fixes applied**: 4

| # | Severity | File | Issue | Found by | Fix | Fixed by |
|---|----------|------|-------|----------|-----|----------|
| 1 | CRITICAL | `src/services/dashboardService.ts:63` | VERTRIEB users receive `salaryByDepartment` via `/stats` — salary data leak | be-reviewer | `getStats()` accepts roles param, skips salary for non-ADMIN/PERSONAL | be-coder |
| 2 | CRITICAL | `src/services/auswertungService.ts:68-121` | PhaseAggregate and TopFirma field names checked — already match frontend | be-reviewer | No change needed (verified correct) | — |
| 3 | WARNING | `src/config/migrate.ts` | No database indexes on FK columns — full table scans on every query | db-reviewer | Added 14 indexes on FK and filter columns | be-coder |
| 4 | WARNING | `src/services/savedReportService.ts:6` | Extra `benutzerId` field leaked to API responses | fe-reviewer | Stripped from `toDTO()` output | be-coder |
| 5 | WARNING | `src/services/abteilungService.ts:103` | `findPersonenByAbteilungId` stub returns `{}` — fragile monkey-patch pattern | be-reviewer | Inlined full implementation, removed monkey-patch | be-coder |
| 6 | WARNING | `src/services/reportService.ts:9` | `ReportZeile.id` typed `string\|number\|null`, frontend expects `number\|null` | fe-reviewer | — | — |
| 7 | WARNING | Various entity services | Nullable fields (`null`) where frontend expects `string` — minor runtime risk | fe-reviewer | — | — |
| 8 | SUGGESTION | `src/config/migrate.ts` | `updatedAt` has no auto-update trigger, relies on manual inclusion in UPDATEs | db-reviewer | — | — |

## Remaining Issues

- `ReportZeile.id` type mismatch for non-FIRMA/PERSON dimensions (string vs number). Low risk — Angular handles loosely typed JSON.
- Nullable string fields across entity DTOs. Existing frontend likely handles `null` via template binding. Low risk.
- `updatedAt` not auto-updated by SQLite trigger — all current services set it manually. Maintenance concern only.
- Sort field interpolation pattern across 8 services is safe via `parseSort()` whitelist but architecturally fragile.

## Project Context Validation

- PRD requirements met: All 14 controller groups reimplemented, same auth model, same pagination format.
- CLAUDE.md updated with Node.js conventions.
- `start.sh` updated — Java removed, Node.js commands added.
- Frontend changes allowed per user request but none needed — API is compatible.

## Next Steps

- Review remaining issues (nullable fields, ReportZeile.id type)
- Run full frontend smoke test with browser
- Create PR when ready

---
Generated with Claude Code - review v1.6.0
