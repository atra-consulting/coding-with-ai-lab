# Code Review - fix-startsh-cleanup

**Date**: 2026-04-20
**Branch**: fix-startsh-cleanup
**Base**: main
**Files Reviewed**: 3 (start.sh, start.bat, end.bat) — plan/state files skipped as tooling noise
**Review Rounds**: 1

## Summary

The fix replaces PID-only kill with a recursive `kill_tree` walk plus a port-based safety net, adds a pre-flight port check, and covers the `EXIT` trap. Round 1 caught one contradiction: the `EXIT` trap's port sweep ran even on the pre-flight rejection path, killing the leftover process the user was just told to stop themselves via `./end.sh`. Two minor `.bat` pattern-specificity warnings were also flagged. All issues fixed and re-verified.

## Review Rounds

### Round 1

**Issues found**: 3 | **Fixes applied**: 3

| # | Severity | File | Issue | Found by | Fix | Fixed by |
|---|----------|------|-------|----------|-----|----------|
| 1 | CRITICAL | `start.sh:124-139` | `cleanup()` ran port-sweep unconditionally via `EXIT` trap, so the pre-flight rejection path killed the leftover process despite telling the user to run `./end.sh` | built-in review | Guarded `cleanup()` to no-op when `BACKEND_PID` and `FRONTEND_PID` are both unset; each side's port sweep only runs if that side was started | direct fix |
| 2 | WARNING | `start.bat:204` | PowerShell `-like` pattern `*ng serve*7200*` is loose — could match unrelated command lines containing both substrings | built-in review | Tightened to `*ng serve --port 7200*` | direct fix |
| 3 | WARNING | `end.bat:13` | Same loose pattern as #2 | built-in review | Same tightening | direct fix |

## Remaining Issues

No remaining issues.

## Project Context Validation

- `CLAUDE.md` has no shell-script conventions. Reviewed against general correctness and POSIX/bash best practices.
- No PRD (small task, skipped per plan-and-do Step 5.1 rule).
- Plan file `docs/plans/PLAN-FIX-STARTSH-CLEANUP.md` accurately describes the two-stage fix (kill watcher then sweep ports) and the Windows equivalents.

## Next Steps

- Run `./start.sh` interactively and press real Ctrl+C once (terminal delivers SIGINT to whole process group — covered by the same trap as the tested SIGTERM path).
- Let Windows users verify `start.bat` / `end.bat` manually (cannot run from macOS).
- Create PR.

---
Generated with Claude Code - review v1.6.0
