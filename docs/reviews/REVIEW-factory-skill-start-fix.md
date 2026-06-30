# Code Review — Factory Skill /start Fix

**Date**: 2026-06-30
**Branch**: main (uncommitted changes)
**Files Reviewed**: 2
**Review Rounds**: 1 (max 1)

## Summary

Two skill spec files were updated to call the `/start` endpoint after fetching a task/ticket by ID. The intent is correct — `GET /:id` is read-only and the `/next` endpoint is the only other way to transition to `IN_PROGRESS`. Adding an explicit `/start` call closes the gap. However, both new `/start` curl calls omit the HTTP status check that every other API call in these specs performs, turning the state guard into a no-op on failure.

## Review Rounds

### Round 1

**Issues found**: 3 | **Fixes applied**: 0

| # | Severity | File | Issue | Found by |
|---|----------|------|-------|----------|
| 1 | CRITICAL | `tasks/advanced/Skill für Übungsaufgabe 2.md` ~L71 | `/start` curl uses only `-s`; no HTTP status check. A 409 (task not OPEN) silently falls through to Step 2 — the skill processes a DONE/REJECTED/IN_PROGRESS task. | ba-reviewer |
| 2 | CRITICAL | `tasks/advanced/Skill für Übungsaufgabe 4.md` ~L72 | Same gap. `/start` curl uses only `-s`; a 409 silently falls through. `POST /ask` and `POST /done` both require `IN_PROGRESS` — if `/start` failed, they will 409 too. | ba-reviewer |
| 3 | WARNING | `tasks/advanced/Skill für Übungsaufgabe 4.md` ~L69 | Spec checks `owner=="AI"` but `/start` also requires `status==TODO`. A ticket with `owner=AI` + `status=IN_PROGRESS` (abandoned mid-run) passes the owner check, calls `/start`, gets 409 silently. | ba-reviewer |
| 4 | WARNING | `tasks/advanced/Skill für Übungsaufgabe 2.md` ~L69 | `GET /:id` returns any task regardless of status. Passing a DONE/REJECTED ID succeeds the GET, then `/start` returns 409 silently. Reading the `status` field from the GET response and exiting if not `OPEN` prevents this. | ba-reviewer |

## Remaining Issues

All 4 issues unresolved.

**Fix for issues #1 and #2** — replace the bare `/start` curl with a status-capturing variant:

```bash
START_CODE=$(curl -s -o /dev/null -w '%{http_code}' -X POST \
  -H "Authorization: Bearer $AGENT_API_TOKEN" \
  "${APP_BASE_URL:-http://localhost:7070}/api/agent-tasks/<ID>/start")
if [ "$START_CODE" != "200" ]; then
  echo "Fehler: /start für Aufgabe <ID> lieferte HTTP $START_CODE. Durchlauf beendet."
  exit 1
fi
```

Same pattern for the ticket `/start` call (replace `agent-tasks` with `tickets`).

**Fix for issues #3 and #4** — read `status` from the GET response and exit if not processable:

- Übungsaufgabe 2: exit if `status != "OPEN"` (before calling `/start`)
- Übungsaufgabe 4: exit if `status != "TODO"` (in addition to the `owner` check, before calling `/start`)

## Project Context Validation

Changes are in skill spec files (`tasks/advanced/`), not application code. No CLAUDE.md conventions apply directly. Changes align with the documented API patterns in `docs/API-TASKS.md` and `docs/API-TICKETS.md`.

## Next Steps

- Add HTTP status check to both `/start` curl calls (issues #1, #2)
- Add `status` field check before calling `/start` in both files (issues #3, #4)
- Commit the fixed specs

---
Generated with Claude Code - review v1.8.2
