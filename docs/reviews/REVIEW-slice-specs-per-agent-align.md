# Code Review - slice-specs-per-agent-align

**Date**: 2026-06-09
**Branch**: slice-specs-per-agent-align
**Base**: main
**Files Reviewed**: 29 (7 specs, 18 agents, CLAUDE.md, plan/state)
**Review Rounds**: 1 (5 domain reviewers in parallel)

## Summary

The spec slice is structurally sound: no content lost in the splits, all cross-reference links resolve, all 18 agents have correct `## Specifications` reading lists, and the 5 scoped corrections (E1–E5) are verified accurate. Frontend `ng build` passes.

The review surfaced a **larger, pre-existing spec-vs-reality drift** not covered by the original task scope: the **Gehalt and Vertrag domain was removed** from the app, and a **geocoding feature was added** — but the specs (original and sliced) still document Gehalt/Vertrag and omit geocoding. This needs a scope decision (see Round 1, MAJOR).

## Review Rounds

### Round 1

**Issues found**: 12 | **Fixes applied**: pending scope decision

| # | Severity | File | Issue | Found by | Fix | Fixed by |
|---|----------|------|-------|----------|-----|----------|
| 1 | CRITICAL (scope) | `SPECS-database.md`, `SPECS-backend.md`, `SPECS-frontend.md`, `SPECS.md` | Gehalt + Vertrag documented everywhere but removed from code (migrate.ts has 6 tables only; no routes/schema/features). Verified. | db/fe-reviewer | Remove Gehalt/Vertrag from all specs | pending decision |
| 2 | CRITICAL (scope) | `SPECS-database.md:89` | Adresse table missing real `latitude`/`longitude` columns (geocoding); `/admin/geocoding` route + `geocodingService.ts` undocumented | db-reviewer | Add lat/long; document geocoding | pending decision |
| 3 | CRITICAL | `CLAUDE.md:86` | Prose says "six per-area specs"; table lists seven | ba-reviewer | Reword to "root index plus six per-area specs (7 total)" | direct fix |
| 4 | WARNING | `SPECS-testing.md:91` | demo user role shown USER; `users.ts` assigns ADMIN | ba-reviewer | Correct to ADMIN | direct fix |
| 5 | WARNING | `SPECS-testing.md:89` | admin roles shown "ADMIN, USER"; `users.ts` is `['ADMIN']` | ba-reviewer | Correct to ADMIN | direct fix |
| 6 | WARNING | `SPECS-database.md:165` | Enum mirror comment points back to backend as if backend is canonical; database is canonical | be-reviewer | Reword to "canonical — mirrored in SPECS-backend.md" | direct fix |
| 7 | WARNING | `SPECS-ui.md` (AG Grid table) | Header overrides require `!important` to penetrate AG Grid cascade; not noted | ui-reviewer | Add `!important` note | direct fix |
| 8 | WARNING | `SPECS-ui.md:204` | "Public-page card template" overgeneralizes; FeedbackForm deviates (width/radius/animation/gradient) | ui-reviewer | Scope template to Login/Welcome/FeedbackQr; note FeedbackForm deviates | direct fix |
| 9 | WARNING | `SPECS-ui.md:88` | `.page-header h2` missing `margin-bottom: 0` from SCSS | ui-reviewer | Add the property | direct fix |
| 10 | SUGGESTION | `SPECS-backend.md:37` & `:204` | Auth note duplicated verbatim in two sections | be-reviewer | De-dupe; keep one, cross-ref | direct fix |
| 11 | SUGGESTION | `SPECS-frontend.md:153` | Sidebar table + "permission-filter" wording stale (role-based; geocoding item) | fe-reviewer | Align with Gehalt/Vertrag/geocoding decision | pending decision |
| 12 | SUGGESTION | `SPECS-ui.md:217` | Cross-ref uses bare filename, not repo-relative path | ui-reviewer | Use `docs/specs/...` path | direct fix |

## Round 2 — Fixes applied (user chose "fix everything now")

All 12 issues resolved:
- **Gehalt + Vertrag removed** from every spec (entities, enums, endpoints, routes, models, sidebar, domain model). Verified gone in `migrate.ts` (6 tables), `schema.ts`, `app.ts`, frontend features/models.
- **Geocoding documented end-to-end**: Adresse `latitude`/`longitude`/`typ` columns (database); `POST /api/admin/geocode-addresses` + `geocodingService` + Nominatim env vars (backend); `/admin/geocoding` ROLE_ADMIN feature + sidebar item (frontend); `NOMINATIM_BASE_URL`/`GEOCODING_SLEEP_MS` + geocoding section (infrastructure); stub already in testing spec.
- **Dashboard drift** (discovered during fixes): `DashboardData`/`RecentChance`/`RecentAktivitaet` corrected; stale `DashboardStats`/`DepartmentSalary`/salary+contract stats removed.
- Small cleanups: CLAUDE.md "six"→"7 total"; SPECS-testing user roles (admin=ADMIN, demo=ADMIN); enum mirror canonical-direction comment; AG Grid `!important` note; public-page card template scoped (FeedbackForm deviations); `.page-header h2` margin-bottom; de-duped auth note; cross-ref path.
- Sidebar corrected to role-based filtering with the real sections + "Adressen geokodieren" admin item.

### Round 2 verification
- No Gehalt/Vertrag residue except intentional "no seed rows" notes. Geocoding in all 6 child specs. All cross-links resolve. 6-table list consistent. No stale dashboard identifiers.

## Remaining Issues

No remaining issues.

## Project Context Validation

- E1–E5 corrections verified accurate against code (admin.ts requireRole, 7 permissions, fixture counts, AG Grid, Auswertungen removed).
- No content lost in backend↔database or frontend↔ui splits.
- All 18 agent reading lists correct; all links resolve.

## Next Steps

- Decide how to handle the Gehalt/Vertrag + geocoding drift (items 1, 2, 11).
- Apply small cleanups (items 3–10, 12).
- Re-verify links + `grep` audits.

---
Generated with Claude Code - bpf-review v1.4.0
