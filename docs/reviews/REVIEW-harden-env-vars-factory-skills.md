# Code Review - harden-env-vars-factory-skills

**Date**: 2026-06-30
**Branch**: harden-env-vars-factory-skills
**Base**: 45553b989061f7ed72bf760ab609fbfbecbb3084
**Files Reviewed**: 4
**Review Rounds**: 1 (max 1)

## Summary

Added "Schritt 0 — Umgebungsvariablen laden" to both factory skill spec files so generated skills load `AGENT_API_TOKEN` from `backend/.env` before making API calls. The ba-reviewer identified one critical issue (`exit 1` alone can't stop a Claude Code skill), two warnings (fast-path coverage, APP_BASE_URL clarity), and three suggestions. All critical and warning findings were fixed; one suggestion (pre-existing PR-link inconsistency in Schritt 4) was not introduced by this change and left for a separate fix.

## Review Rounds

### Round 1

**Issues found**: 6 | **Fixes applied**: 5

| # | Severity | File | Issue | Found by | Proposed Fix | Applied | Applied by |
|---|----------|------|-------|----------|--------------|---------|------------|
| 1 | CRITICAL | `tasks/advanced/Skill für Übungsaufgabe 2.md:32` | `exit 1` exits only the bash subshell; Claude Code continues running | ba-reviewer | Add LLM-level "sofort beenden" instruction after the check block | Added **Wichtig:** stop instruction; changed prose to be explicit | direct fix |
| 2 | CRITICAL | `tasks/advanced/Skill für Übungsaufgabe 4.md:32` | Same as above | ba-reviewer | Same fix | Fixed | direct fix |
| 3 | WARNING | Both files, Parameter section | Schritt 0 not explicitly marked as always-running when ID param given | ba-reviewer | Add *(Immer als erstes ausführen…)* note at top of Schritt 0 | Added note | direct fix |
| 4 | WARNING | Both files, Schritt 0 | `APP_BASE_URL` silently loaded from .env but spec never mentions it | ba-reviewer | Note that .env can contain both vars | Added to intro sentence | direct fix |
| 5 | SUGGESTION | Both files, line 25 | `set -a && source && set +a` on one line — set +a skipped on source error | ba-reviewer | Split onto separate lines | Split to 3 lines | direct fix |
| 6 | SUGGESTION | `tasks/advanced/Skill für Übungsaufgabe 4.md:17` | "beides am Ende von Schritt 1" confusing after Schritt 0 insertion | ba-reviewer | Reword to "wie am Ende von Schritt 1 beschrieben" | Fixed | direct fix |
| 7 | SUGGESTION | Both files, Schritt 4 | Schritt 4 mentions "PR-Link" but Schritt 3b says "keinen PR erstellen" | ba-reviewer | — (pre-existing, not in scope) | skipped | — |

## Remaining Issues

- Schritt 4 in both files references "DER PR-LINK" but Schritt 3b says no PR is created. Pre-existing inconsistency; not introduced by this change. Address in a separate fix.

## Project Context Validation

Changes are consistent with the workshop training goals: make factory skills self-sufficient for env var loading so users don't get mysterious 401 errors when running skills after a fresh Claude Code start.

## Next Steps

- Review remaining Schritt 4 / PR-link inconsistency in a follow-up
- Test by running the created skill after a fresh Claude Code start (no manual `export`)

---
Generated with Claude Code - review v1.8.2
