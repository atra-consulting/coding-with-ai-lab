---
name: "project:do-factory-automatic"
description: "Autonomous task runner: claims the next agent task, judges build-or-reject via requirements-reviewer, runs plan-and-do unattended, marks the task done. One task per run. Headless — never waits for input."
argument-hint: "[task-id]"
version: 1.0.0
last-modified: 2026-06-30
allowed-tools:
  - Bash
  - Task
---

# Do Factory Automatic

Autonomous, headless agent skill. Claims one agent task, judges it, builds or rejects it, marks it done. One task per run. Never asks for input.

## Usage

```
/do-factory-automatic          # claim next open task (priority order: EMAIL, GITHUB_ISSUE, ERROR_REPORT, APP_LOG)
/do-factory-automatic 14       # load task 14 directly, skip claim step
```

Set env vars before running:
- `AGENT_API_TOKEN` — required. Auth token for the API.
- `APP_BASE_URL` — optional. Default: `http://localhost:7070`.
- `TASK_SOURCE` — optional. Limit to one source (e.g. `EMAIL`). Ignores priority order.

## Workflow

### Pre-flight

Verify `AGENT_API_TOKEN` is set:

```bash
if [ -z "$AGENT_API_TOKEN" ]; then
  echo "ERROR: AGENT_API_TOKEN ist nicht gesetzt. Bitte setzen und erneut starten."
  exit 1
fi
```

Set base URL:

```bash
BASE_URL="${APP_BASE_URL:-http://localhost:7070}"
```

---

### Step 1 — Claim or Load Task

**If $ARGUMENTS contains a number** (e.g. `14`): treat it as a task ID. Load that task directly.

```bash
curl -s -w '\n%{http_code}' \
  -H "Authorization: Bearer $AGENT_API_TOKEN" \
  "${BASE_URL}/api/agent-tasks/<ID>"
```

- HTTP 200 → parse JSON. Extract `id`, `title`, `body`, `metadata`. Go to Step 2.
- HTTP 404 → print `Aufgabe nicht gefunden.` and stop.
- Any other code → print `Fehler beim Laden der Aufgabe: HTTP <code>` and stop.

**If $ARGUMENTS is empty**: claim next open task. Try sources in this order: `EMAIL`, `GITHUB_ISSUE`, `ERROR_REPORT`, `APP_LOG`.

If `TASK_SOURCE` is set, use only that source (single iteration).

For each source:

```bash
curl -s -w '\n%{http_code}' \
  -H "Authorization: Bearer $AGENT_API_TOKEN" \
  "${BASE_URL}/api/agent-tasks/next?source=<SOURCE>"
```

- HTTP 200 → task claimed and set to IN_PROGRESS. Parse JSON. Extract `id`, `title`, `body`, `metadata`. Stop trying sources. Go to Step 2.
- HTTP 204 → no open task for this source. Try next source.
- Any other code → print `Fehler beim Abrufen von <SOURCE>: HTTP <code>` and stop.

If all sources return 204 → print `Keine offenen Aufgaben.` and stop.

Store: `task_id`, `task_title`, `task_body`, `task_metadata`.

---

### Step 2 — Judge: Build or Reject

Dispatch the `requirements-reviewer` subagent via the Task tool.

Pass `task_title`, `task_body`, `task_metadata` (as-is). Ask the subagent to judge the task against these four criteria:

1. Does the task describe ONE clear, concrete change?
2. Are all facts needed to implement it present — no guessing, no product decisions?
3. Does it fit this CRM codebase (Express/Drizzle backend or Angular 21 frontend)?
4. Is there one obviously correct approach?

Also instruct the subagent to **check the real codebase**: if the described problem does not exist in current code, return "reject".

The subagent must return one of:
- `VERDICT: BUILD` — with brief rationale.
- `VERDICT: REJECT` — with a specific, actionable reason (exactly what is missing or unclear so a human can correct the request).

Wait for the subagent to finish. Read its output.

If the verdict is `VERDICT: BUILD` → Go to Step 3b.
If the verdict is `VERDICT: REJECT` → Go to Step 3a.
If the subagent output is ambiguous or missing a verdict → treat as `VERDICT: REJECT`. Reason: "Anforderungsprüfung hat kein eindeutiges Ergebnis geliefert."

---

### Step 3a — Reject

Call the reject endpoint:

```bash
curl -s -X POST \
  -H "Authorization: Bearer $AGENT_API_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"comment": "<EXACT REASON FROM SUBAGENT — what is missing or unclear so a human can correct the request>"}' \
  "${BASE_URL}/api/agent-tasks/<task_id>/reject"
```

Use the subagent's specific reason verbatim. Generic reasons like "unklar" are not acceptable.

Print: `Aufgabe <task_id> abgelehnt: <reason>`

Stop. Do NOT continue to Step 3b or Step 4.

---

### Step 3b — Build: Run plan-and-do Unattended

Call `/project:plan-and-do` with the task description. Prepend these standing instructions to authorize every interactive checkpoint upfront:

```
Fully autonomous and unattended execution. Do NOT call AskUserQuestion or wait for input at any time. Apply these default answers to every checkpoint:
- PRD decision: skip PRD, go straight to plan.
- Plan approval: "Approve, implement, review, and create PR" (full workflow scope).
- Any review-findings checkpoint: approve all fixes.
- Any other checkpoint or choice: Continue / choose the recommended option.
- Keep planning files. Never stop to ask. Never ask for clarification.
- If tests or the build fail and cannot be fixed automatically after a reasonable attempt, abort and call Step 3a (reject the task with a comment explaining the failure) instead of hanging.
```

Invoke:

```
/project:plan-and-do "<task_body> — Title: <task_title>. Metadata: <task_metadata>"
```

Let plan-and-do run to completion: implement → test → review → PR.

If plan-and-do fails and cannot recover, go to Step 3a with a comment describing the failure (e.g. "Build fehlgeschlagen: Tests konnten nicht repariert werden. Details: <summary>").

---

### Step 4 — Mark Task Done

After plan-and-do completes and the PR exists:

```bash
curl -s -X POST \
  -H "Authorization: Bearer $AGENT_API_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"comment": "<SHORT SUMMARY OF WHAT WAS BUILT + PR LINK>"}' \
  "${BASE_URL}/api/agent-tasks/<task_id>/done"
```

Print: `Aufgabe <task_id> abgeschlossen. PR: <pr_url>`

Stop. One task per run.

---

## Notes

- Never call `AskUserQuestion`. This skill is headless.
- The `requirements-reviewer` subagent checks the real codebase. A task describing a bug that does not exist → reject.
- Rejection comments must be specific and actionable. A human must be able to read the comment and fix the request.
- If plan-and-do cannot finish (build broken, tests unrecoverable), reject the task with an explanation rather than hanging.
- PRs always target the branch that was active when plan-and-do started (per plan-and-do's own branch rules).
