---
name: agent-task-reject-patterns
description: Recurring reasons to reject vague agent-tasks (the agent_task table drained by the autonomous runner)
metadata:
  type: project
---

Agent-tasks (sources EMAIL, GITHUB_ISSUE, APP_LOG, ERROR_REPORT) must be REJECTED when they lack enough facts to build one concrete change. A clean ABLEHNEN gives the human a specific, actionable correction list.

**Why:** The autonomous runner (`do-factory-automatic` skill / `/admin/agent-tasks`) decides solve-or-reject without human input. A vague task forces guessing, which the workflow forbids. Rejection with a checklist is the correct, safe outcome.

**How to apply:** Reject when the task does not name ALL of:
- Affected entity or area (Firma, Person, Abteilung, Adresse, Aktivitaet, Chance, login, ...)
- Concrete action / reproduction steps (click path or API call)
- Expected vs. actual behavior
- Error message / HTTP status / screenshot if any
- User role (USER vs ADMIN) and layer (frontend / backend / DB)

Classic reject example: title "Fix the broken feature", body "Something is broken. Please fix it ASAP", sender anon@example.com. No entity, no repro, no expected/actual — unverifiable that the bug even exists. Reject, list missing facts.

Decision output format for these tasks: `BAUEN: <reason>` or `ABLEHNEN: <specific actionable reason>`.
