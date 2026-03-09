# Code Review — Full Codebase (specs branch)

Reviewed by: be-reviewer, fe-reviewer, db-reviewer agents. Date: 2026-03-07.

## Summary

| Area | Critical | High/Warning | Medium | Low/Suggestion |
|------|----------|-------------|--------|----------------|
| Backend | 3 | 7 | — | 7 |
| Frontend | 2 | 6 | — | 6 |
| Database | 3 | 5 | 6 | 4 |
| **Total** | **8** | **18** | **6** | **17** |

---

## Critical Findings

### Backend

1. **Missing `@PreAuthorize`** — `DashboardConfigController` and `SavedReportController` have no authorization annotation. Any authenticated user can access all configs/reports.

2. **Unvalidated report input** — `ReportController.executeReport` missing `@Valid`. Null `dimension`/`metriken` cause NPE → 500 instead of 400.

3. **Null-unsafe aggregate cast** — `AuswertungService.getPipelineKpis` casts aggregate results without null guard.

### Frontend

4. **Auth interceptor hang** — Module-level `isRefreshing` + `refreshTokenSubject` with no timeout. If refresh fails, all subsequent requests hang permanently.

5. **Missing permission guards** — Routes for `firmen`, `personen`, `abteilungen`, `adressen`, `aktivitaeten` have no `permissionGuard`. Direct URL access bypasses authorization.

### Database

6. **N+1 in FirmaMapper** — `personen.size()` + `abteilungen.size()` triggers 40 extra queries per page of 20.

7. **N+1 in AbteilungMapper** — `personen.size()` triggers extra query per row.

8. **Dead DELETE in readOnly transaction** — `RefreshTokenService.validateRefreshToken` annotated `readOnly=true` but calls `delete()`. Expired tokens never removed from DB.

---

## High / Warning Findings

### Backend

9. `ChanceController.updatePhase` uses `@PutMapping` instead of `@PatchMapping` (mismatches docs + frontend).
10. N+1 in `DashboardService` — `countByFirmaId` per firm in loop.
11. Manual JSON parser in `DashboardConfigService` — fragile, should use Jackson.
12. Unsafe `authentication.getPrincipal()` cast — should use `@AuthenticationPrincipal`.
13. JWT parsed twice per request in `JwtAuthenticationFilter`.
14. `AdresseController`/`AktivitaetController` use role guards instead of permission guards.
15. `SavedReportService` ownership violation returns 404 instead of 403.

### Frontend

16. Unmanaged `valueChanges` subscription in `PersonFormComponent` — memory leak.
17. `window.prompt()` used in `ReportBuilderComponent` — inaccessible, blocks UI.
18. `Number(paramMap.get('id'))` not validated — `null` → 0, invalid → NaN.
19. 1000-item `<select>` dropdowns in forms — scalability risk.
20. No `delete` method on `BenutzerService` — asymmetric from all other entities.
21. Widget config from server validated but no error handling on save.

### Database

22. `ChanceService.findAll/findByPhase` — N+1 on lazy `firma` + `kontaktPerson`.
23. `VertragRepository`/`GehaltRepository` — `BigDecimal` return type on H2 aggregates → ClassCastException.
24. `Firma.aktivitaeten` — `orphanRemoval=true` on nullable parent → unintended deletes.
25. `RefreshToken.benutzer` — default EAGER fetch loads full user on every token lookup.
26. `DashboardService.getStats` — N+1 `countByFirmaId` per firm (same as #10).

---

## Medium Findings (Database)

27. No `@Index` annotations on FK columns.
28. `QUARTER()` JPQL function not supported by H2 — runtime exception.
29. `Abteilung` entity missing `createdAt`/`updatedAt` timestamps.
30. `GehaltRepository.findAverageSalaryByDepartment` — in-memory `.limit(5)` instead of DB limit.
31. Null `wahrscheinlichkeit` causes NPE in weighted value calculation.
32. `DataSeeder` fragile enum index arithmetic.

---

## Suggestions

### Backend
- Extract duplicated `parseSort` helper from 7+ controllers.
- Unbounded `limit` param in `AuswertungController.getTopFirmen`.
- `ReportZeileDTO.werte` mutable map mutated after construction.
- `DashboardConfig.config` — 1024 char limit likely insufficient.
- `GehaltRepository.findAverageGrundgehalt` return type vs H2 quirk.
- `JwtService.extractAllClaims` unnecessarily public.

### Frontend
- Dashboard widget `@Input()` → `input()` signal API.
- `getPhaseBadgeClass` duplicated across 5 components.
- `NotificationComponent` `setTimeout` not cleared on destroy.
- Silent failure on dashboard config save.
- `ChanceService.updatePhase` uses PUT where spec says PATCH.
- `@for` tracking by `$index` on sorted report rows.

### Database
- Leading wildcard in `BenutzerRepository.search`.
- `Adresse` no constraint enforcing at least one parent.
- `ChanceRepository.getTopFirmenRaw` — Pageable + hardcoded ORDER BY conflict.
- `DashboardConfig.config` 1024-char limit.

---

## Priority Recommendations

**Immediate fixes** (security + correctness):
1. Add `@PreAuthorize` to `DashboardConfigController` and `SavedReportController`
2. Add `@Valid` to `ReportController.executeReport`
3. Add `permissionGuard` to 5 frontend routes
4. Add timeout to auth interceptor refresh flow
5. Remove `readOnly=true` from `RefreshTokenService.validateRefreshToken`

**Next sprint** (performance + reliability):
6. Fix N+1 queries (FirmaMapper, AbteilungMapper, ChanceService)
7. Fix H2 aggregate return types
8. Change `updatePhase` from PUT to PATCH (backend + frontend)
9. Replace manual JSON parser with Jackson
