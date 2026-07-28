---
name: semi-auto-ticket-build-patterns
description: What makes a semi-automatic AI ticket buildable (BAUEN) vs needing a clarifying question (FRAGEN)
metadata:
  type: project
---

Semi-automatic AI tickets (drained by `do-factory-semi-automatic` skill, owner=AI) are judged BAUEN or FRAGEN. The thread is part of the spec: a `[HUMAN]` reply that resolves a `[AGENT]` question closes that open decision — read the whole thread before deciding.

**Why:** The skill works headless. Any unresolved product decision forces guessing, which the workflow forbids. But once the thread answers the open question, the ticket is buildable even if the body alone looked thin.

**How to apply — BAUEN when ALL hold:**
- One concrete change, not a bundle.
- Every product decision is settled — either in the body or resolved in the thread. (Example: "alle vs. nur offene Chancen" → human answered "nur die offenen" → maps to existing `offeneChancenCount`.)
- Required backend capability exists or the gap is named + trivial. Verify by reading code, do not trust the ticket's claim. (Example ticket claimed `GET /api/dashboard` returns firmen/personen/offeneChancen counts — confirmed in `backend/src/services/dashboardService.ts`. Aktivitaeten count missing, ticket flagged it, add is a one-line `SELECT COUNT(*)`.)
- The UI insertion point is data-driven / obvious. (Example: sidebar is `NavItem[]` in `frontend/src/app/layout/sidebar/sidebar.component.ts` — add optional `count` field, render `<span class="badge bg-secondary ms-auto">`.)
- Error / empty behavior stated (e.g. request fails → no badge, no error).

**FRAGEN when** a product decision is open and the thread has NOT resolved it — name the options.

Always verify the described problem really exists in current code before BAUEN. Sidebar had no badges, dashboard DTO had no `aktivitaetenCount` — both real.

Related: [[agent-task-reject-patterns]] (the REJECT side, for the autonomous agent_task runner).
