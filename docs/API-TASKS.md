# Agent Tasks API

Machine-facing and admin API for the autonomous task sources feature. Base path: **`/api/agent-tasks`**.

Source of truth: `backend/src/routes/agentTasks.ts` and `backend/src/services/agentTaskService.ts`. Full requirement-level spec: `docs/prds/PRD-AUTONOMOUS-TASK-SOURCES.md` (REQ-008 … REQ-012b).

---

## Concepts

A task (`agent_task` row) comes from one of four **sources** and moves through a **status** lifecycle:

```
source:  EMAIL | GITHUB_ISSUE | APP_LOG | ERROR_REPORT
status:  OPEN ──(GET /next OR POST /:id/start)──▶ IN_PROGRESS ──(POST /done)──▶ DONE
                                          └──(POST /reject)─▶ REJECTED
         (POST /reset re-arms every task back to OPEN)
```

### Task object

```json
{
  "id": 9,
  "source": "APP_LOG",
  "title": "GET /api/health response missing version field",
  "body": "…full text the agent reads…",
  "status": "IN_PROGRESS",
  "comment": null,
  "metadata": "{\"level\":\"ERROR\",\"timestamp\":\"…\",\"requestPath\":\"/api/health\"}",
  "pickedUpAt": "2026-06-16T05:20:00.000Z",
  "resolvedAt": null,
  "createdAt": "2026-06-07T03:15:00.000Z",
  "updatedAt": "2026-06-16T05:20:00.000Z"
}
```

- `metadata` is a JSON **string** (source-specific fields), or `null`.
- `comment`, `pickedUpAt`, `resolvedAt` are `null` until set.
- All timestamps are ISO-8601 strings.

---

## Authentication

Two main schemes. `GET /:id` accepts all three (see below).

### Agent token (machine endpoints: `/next`, `/:id/start`, `/:id/reject`, `/:id/done`)

Send the shared secret in **either** header:

```
Authorization: Bearer <AGENT_API_TOKEN>
# or
X-Agent-Token: <AGENT_API_TOKEN>
```

- The server compares it to the `AGENT_API_TOKEN` env var using SHA-256 + constant-time `timingSafeEqual`.
- If `AGENT_API_TOKEN` is **unset/empty**, every agent endpoint returns **401** (no default token).
- Missing or wrong token → **401**.
- **Localhost bypass:** Set `AGENT_AUTH_ALLOW_LOOPBACK=1` in `backend/.env`. Requests from `127.0.0.1`, `::1`, or `::ffff:127.0.0.1` with no `Authorization` or `X-Agent-Token` header then skip validation. Requests with proxy-forwarding headers (`X-Forwarded-For`, `X-Real-IP`, `Forwarded`) are never bypassed. Local development only — never set in production.
- Locally the backend auto-loads `backend/.env`; in CI set it as a GitHub Actions secret.

**Local setup** (run from repo root):

```bash
# 1. Create backend/.env from the template
cp backend/.env.example backend/.env

# 2. Set your token — open backend/.env and replace the placeholder:
#    AGENT_API_TOKEN=your-secret-token-here  →  AGENT_API_TOKEN=<your-actual-token>

# 3. Export vars in your shell so the curl examples below work
set -a && source backend/.env && set +a
```

### Admin session (admin endpoints: `/`, `/summary`, `/reset`)

Standard browser session cookie + role `ADMIN` (`requireAuth` + `requireRole('ADMIN')`).

- No session → **401**. Authenticated but not admin → **403**.

---

## Endpoints

### GET `/api/agent-tasks/next?source=SOURCE` — claim the next task
**Auth:** agent token. **`source` is required.**

Atomically returns the oldest `OPEN` task for that source and flips it to `IN_PROGRESS` (sets `pickedUpAt`). The status flip is the claim guard, so two callers can't grab the same task.

| Result | Meaning |
|--------|---------|
| `200` + task | claimed |
| `204` (no body) | no OPEN task for that source |
| `400` | `source` missing or not a valid enum value |
| `401` | bad/missing token |

```bash
curl -s -H "Authorization: Bearer $AGENT_API_TOKEN" \
  "$APP_BASE_URL/api/agent-tasks/next?source=EMAIL"
```

---

### POST `/api/agent-tasks/:id/reject` — reject with a mandatory comment
**Auth:** agent token. **Body:** `{ "comment": "<non-empty string>" }`.

Sets `status=REJECTED`, stores `comment`, sets `resolvedAt`. Allowed from `OPEN` or `IN_PROGRESS`.

| Result | Meaning |
|--------|---------|
| `200` + task | rejected |
| `400` | `comment` missing/empty (`fieldErrors.comment`) |
| `404` | no task with that id |
| `409` | task already `DONE` or `REJECTED` |
| `401` | bad/missing token |

```bash
curl -s -X POST -H "Authorization: Bearer $AGENT_API_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"comment":"Too vague — no concrete change described."}' \
  "$APP_BASE_URL/api/agent-tasks/3/reject"
```

---

### POST `/api/agent-tasks/:id/done` — mark complete
**Auth:** agent token. **Body:** `{ "comment": "<optional string>" }`.

Sets `status=DONE`, optional `comment`, sets `resolvedAt`. Allowed from `OPEN` or `IN_PROGRESS`.

| Result | Meaning |
|--------|---------|
| `200` + task | done |
| `404` | no task with that id |
| `409` | task already `DONE` or `REJECTED` |
| `401` | bad/missing token |

```bash
curl -s -X POST -H "Authorization: Bearer $AGENT_API_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"comment":"Implemented in PR #62"}' \
  "$APP_BASE_URL/api/agent-tasks/9/done"
```

---

### POST `/api/agent-tasks/reset` — re-arm all tasks (admin)
**Auth:** admin session. No body.

Sets every task back to `OPEN` and clears `comment`, `pickedUpAt`, `resolvedAt`. Used to re-run the workshop without `--reset-db`.

```json
{ "reset": 16 }
```

| Result | Meaning |
|--------|---------|
| `200` + `{reset}` | count of tasks reset |
| `401` / `403` | not logged in / not admin |

---

### GET `/api/agent-tasks/summary` — per-source counts (admin)
**Auth:** admin session. Always returns all four sources.

```json
[
  { "source": "APP_LOG",      "openCount": 3, "inProgressCount": 0, "doneCount": 1, "rejectedCount": 0 },
  { "source": "EMAIL",        "openCount": 4, "inProgressCount": 0, "doneCount": 0, "rejectedCount": 0 },
  { "source": "ERROR_REPORT", "openCount": 4, "inProgressCount": 0, "doneCount": 0, "rejectedCount": 0 },
  { "source": "GITHUB_ISSUE", "openCount": 4, "inProgressCount": 0, "doneCount": 0, "rejectedCount": 0 }
]
```

| Result | Meaning |
|--------|---------|
| `200` + array | counts |
| `401` / `403` | not logged in / not admin |

---

### GET `/api/agent-tasks/:id` — one task
**Auth:** loopback bypass · agent token · admin session (first match wins).

**Read-only.** Never changes status or any other field.

| Result | Meaning |
|--------|---------|
| `200` + task | found |
| `404` | no task with that id |
| `401` / `403` | not authenticated / not admin |

Skills and agents can call this endpoint on localhost without any token when `AGENT_AUTH_ALLOW_LOOPBACK=1`. In production, send the agent token or use an admin session.

---

### POST `/api/agent-tasks/:id/start` — set task to in progress (agent)
**Auth:** agent token.

Explicitly transitions an `OPEN` task to `IN_PROGRESS` (sets `pickedUpAt`). Use when you already know the task id and do not want to go through `/next`. The `/next` endpoint does the same transition automatically when it claims a task.

| Result | Meaning |
|--------|---------|
| `200` + task | now IN_PROGRESS |
| `404` | no task with that id |
| `409` | task is not OPEN (already IN_PROGRESS, DONE, or REJECTED) |
| `401` | bad/missing token |

```bash
curl -s -X POST -H "Authorization: Bearer $AGENT_API_TOKEN" \
  "$APP_BASE_URL/api/agent-tasks/3/start"
```

---

### GET `/api/agent-tasks` — paginated list (admin)
**Auth:** admin session.

**Query params:** `source`, `status` (validated against the enums → `400` if invalid), `page` (0-indexed), `size`, `sort` (`field,direction`; default `createdAt,DESC`; sortable fields: `createdAt`, `updatedAt`, `status`, `source`, `title`).

Response is the Spring-Data-style page shape:

```json
{
  "content": [ /* task objects */ ],
  "totalElements": 16,
  "totalPages": 2,
  "size": 10,
  "number": 0,
  "first": true,
  "last": false
}
```

| Result | Meaning |
|--------|---------|
| `200` + page | list |
| `400` | invalid `source` or `status` filter |
| `401` / `403` | not logged in / not admin |

---

## Error response shape

All errors use the app-wide handler:

```json
{
  "status": 400,
  "message": "source ist erforderlich",
  "timestamp": "2026-06-16T05:20:00.000Z",
  "fieldErrors": { "source": "source ist erforderlich" }
}
```

`fieldErrors` is present for validation failures (e.g. missing reject `comment`, invalid `source`/`status`).

---

## Cron Runner API

Turns the agent-task queue into a scheduled, self-driving loop. A Vercel cron hits the dispatcher every 10 min; it fires a GitHub `repository_dispatch` that runs `.github/workflows/agent-task-runner.yml`, which drains every source and calls back to close the audit row. Base path: **`/api/cron`**.

Source of truth: `backend/src/routes/cron.ts`, `backend/src/services/cronService.ts`, `backend/src/config/cronJobs.ts`.

### cron_run object

```json
{
  "id": 12,
  "job": "solve-tasks",
  "status": "SUCCESS",
  "trigger": "CRON",
  "startedAt": "2026-06-16T12:30:00.000Z",
  "finishedAt": "2026-06-16T12:38:21.000Z",
  "durationMs": 501000,
  "result": "{\"tasksSolved\":2,\"tasksRejected\":1}",
  "githubRunUrl": "https://github.com/atra-consulting/coding-with-ai-lab/actions/runs/123",
  "error": null
}
```

- `status`: `RUNNING | SUCCESS | FAILED | SKIPPED`. `trigger`: `CRON | MANUAL`.
- `result` is a JSON **string** (or `null`): `{openTasks,dispatched}`, `{tasksSolved,tasksRejected}`, or `{skipReason}`.

### Authentication

- `GET /api/cron/agent-tasks` accepts **either** `Authorization: Bearer <CRON_SECRET>` (Vercel cron → trigger `CRON`) **or** an admin session (the "Run now" button → trigger `MANUAL`).
- `POST /api/cron/runs/:id/complete` uses the agent token (`AGENT_API_TOKEN`), same scheme as `/api/agent-tasks/*`.
- `GET /api/cron/runs` and `GET /api/cron/jobs` use an admin session (`requireAuth` + `requireRole('ADMIN')`).

### GET `/api/cron/agent-tasks` — heartbeat + dispatcher
Single-flight + skip-when-idle, then dispatch:
- A run already `RUNNING` (orphans older than 30 min are auto-expired first) → records a `SKIPPED` run.
- No OPEN tasks across any source → records a `SKIPPED` run.
- Otherwise creates a `RUNNING` run and fires `repository_dispatch` (`solve-agent-tasks`, `client_payload.cronRunId`). Dispatch failure → the run is marked `FAILED`.
- **Always returns `200`** with the `cron_run` object — a 4xx/5xx would make Vercel cron auto-retry and create duplicate runs.

### GET `/api/cron/github-issues` — GitHub-issue agent dispatcher
Same auth as `/agent-tasks` (admin session via the per-job "Jetzt ausführen" button, or `CRON_SECRET`). Manual-only — there is no Vercel cron for it.
- A `solve-github-issues` run already `RUNNING` → records a `SKIPPED` run.
- Otherwise creates a `RUNNING` run and fires `repository_dispatch` (`solve-github-issues`, `client_payload.cronRunId`) → the [`github-issue-agent.yml`](../.github/workflows/github-issue-agent.yml) workflow. Dispatch failure → `FAILED`.
- No work-queue pre-check (the issues live on GitHub): it always dispatches; the agent reports the outcome via the same `/runs/:id/complete` callback (`tasksSolved=1` implemented, `tasksRejected=1` input-needed, both `0` if no issue was open).
- **Always returns `200`** with the `cron_run` object.

### POST `/api/cron/runs/:id/complete` — runner callback
**Auth:** agent token. **Body:** `{ "status": "SUCCESS"|"FAILED", "tasksSolved": <int>, "tasksRejected": <int>, "githubRunUrl": "https://…" }`. Sets `finishedAt`, `durationMs`, `status`, `githubRunUrl`, `result`. `404` if no run with that id; `400` on body validation failure.

### GET `/api/cron/runs` — paginated history (admin)
**Query:** `job`, `page` (0-indexed), `size`, `sort` (`field,direction`; default `startedAt,DESC`; sortable: `startedAt`, `finishedAt`, `status`, `job`, `trigger`). Returns the Spring-Data page shape.

### GET `/api/cron/jobs` — configured jobs + last run (admin)
Each configured job with its newest run attached:

```json
[
  { "name": "solve-tasks", "schedule": "0 2 * * *", "description": "…", "dispatchEventType": "solve-agent-tasks", "lastRun": { /* cron_run or null */ } },
  { "name": "solve-github-issues", "schedule": "manuell", "description": "…", "dispatchEventType": "solve-github-issues", "lastRun": { /* cron_run or null */ } }
]
```

Each job renders as its own card in `/admin/cron` with a dedicated "Jetzt ausführen" button. `solve-tasks` drains the in-app `agent_task` queue; `solve-github-issues` works ONE real GitHub issue labelled `Refinement needed` (see below).

---

## Environment Variables

| Var | Where | Used by |
|-----|-------|---------|
| `AGENT_API_TOKEN` | Vercel **and** GitHub repo secret (same value) | agent-task API + cron callback auth |
| `CRON_SECRET` | Vercel only | validates the Vercel cron `Authorization: Bearer` header |
| `GH_DISPATCH_TOKEN` | Vercel only | the dispatcher's `repository_dispatch` call (fine-grained PAT: Contents R/W + Actions R/W) |
| `GH_DISPATCH_REPO` | Vercel only (optional) | overrides the dispatch target; defaults to `atra-consulting/coding-with-ai-lab` |
| `APP_BASE_URL` | GitHub repo secret | runner → app base URL for the callback |
| `ANTHROPIC_API_KEY` | GitHub repo secret | Claude CLI in the agent-task runner |
| `CLAUDE_CODE_OAUTH_TOKEN` | GitHub repo secret | Claude CLI auth in the GitHub-issue agent (subscription token via `claude setup-token`; use **instead of** `ANTHROPIC_API_KEY`) |
| `GH_PROJECT_TOKEN` | GitHub repo secret | **GitHub-issue agent only.** Classic PAT with scopes `repo`, `project`, `read:org`. Used by `gh` + `git` for issue/label/PR/push **and** moving the issue on Project board #7. The default `GITHUB_TOKEN` cannot write Projects v2. |

All are read from `process.env`; never commit values. The Vercel cron is set to **once daily** (`0 2 * * *`) because Hobby plans reject sub-daily schedules at deploy time — bump it to `*/10 * * * *` only after upgrading to **Pro**. The admin "Run now" button (`/admin/cron`) triggers the same dispatch on demand on **any** plan, and is also the local-dev test path (Vercel crons don't fire locally).

---

## GitHub-Issue Agent (real issues, not the `agent_task` queue)

A **second** autonomous agent, separate from the agent-task runner. It works against **real GitHub issues** labelled **`Refinement needed`**, one issue per run, triggered **manually** from the `solve-github-issues` card in `/admin/cron`.

**Pieces**
- **Trigger:** `GET /api/cron/github-issues` (above) → `repository_dispatch` `solve-github-issues`.
- **Workflow:** [`.github/workflows/github-issue-agent.yml`](../.github/workflows/github-issue-agent.yml) — runs `claude -p` once with the prompt below, then calls `/runs/:id/complete`.
- **Prompt:** [`.claude/prompts/agent-github-refinement.md`](../.claude/prompts/agent-github-refinement.md).
- **Token:** `GH_PROJECT_TOKEN` (see env table) — needs Projects-v2 write, which the default `GITHUB_TOKEN` lacks.

**Per-run flow**
1. Pick ONE open `Refinement needed` issue (skip ones already `Input needed`; prefer non-`Likely to fail`; tie-break lowest number).
2. **Decide** implement vs ask.
   - **Ask** (info/decision missing, or the issue text says so): comment a precise question + `@dave0688`, add the **`Input needed`** label. Board stays **Backlog**. → `AGENT_RESULT: INPUT_NEEDED`.
   - **Implement** (all info present): move the issue to **In progress** on board #7 → run `plan-and-do` (build check only; **no test authoring**) → open a PR against `main` (**never merged**, left for human review) → move to **In review** + comment the PR link. → `AGENT_RESULT: IMPLEMENTED`.
3. If implementation stalls, it falls back to the ask path (Backlog + `Input needed` + comment).

**Status is tracked on the Project board** (#7 "Coding with AI: Fortgeschrittenen-Schulung"), not via labels — except the explicit `Input needed` label that flags issues awaiting a maintainer reply. Project IDs and status-option ids are pinned in the prompt.

---

## For skill authors

A workshop skill drives this API as an agent. Use the **agent endpoints only** — the admin endpoints (`summary`, `reset`, list, detail) are for the human dashboard.

**Auth.** Send the agent token on every call (`AGENT_API_TOKEN`). Same token and header scheme as the Tickets API:

```
Authorization: Bearer $AGENT_API_TOKEN
# or:
X-Agent-Token: $AGENT_API_TOKEN
```

**The calls a skill needs:**

| Step | Call | Notes |
|------|------|-------|
| Claim | `GET /api/agent-tasks/next?source=…` | **`source` is required** — one of `EMAIL`, `GITHUB_ISSUE`, `APP_LOG`, `ERROR_REPORT`. Claims the oldest `OPEN` task of that source, flips it to `IN_PROGRESS`. **`204` = none for that source.** |
| Start | `POST /api/agent-tasks/:id/start` | No body. From `OPEN` → `IN_PROGRESS`. Use when you have the id but did not go through `/next`. |
| Read | `GET /api/agent-tasks/:id` | Re-read a task by id. Accepts agent token or loopback bypass. |
| Finish | `POST /api/agent-tasks/:id/done` | Body `{ "comment"?: string }`. From `IN_PROGRESS` → `DONE`. |
| Reject | `POST /api/agent-tasks/:id/reject` | Body `{ "comment": string }` (required). From `IN_PROGRESS` → `REJECTED`. Use when the task is out of scope or not worth doing. |

**Loop shape:**

```
for each source in [EMAIL, GITHUB_ISSUE, APP_LOG, ERROR_REPORT]:
    while GET /next?source=<source> returns 200:
        decide: solve or reject?
        if solve:   POST /:id/done   {comment}
        else:       POST /:id/reject {comment}
    # 204 → this source is drained
```

**What's different from tickets** (see `docs/API-TICKETS.md`):

- **Tasks are one-shot.** Claim, then either `done` or `reject` — no conversation. There is no "ask a question" path and no comment thread. If a task lacks information, you `reject` it (with a reason) rather than hand it back.
- **`/next` requires `?source=`.** Tickets have no required parameter (only an optional `?type=`).
- **Lifecycle is `OPEN → IN_PROGRESS → DONE | REJECTED`** — there is no `ON_HOLD` and no owner concept.

**One token, two queues.** This API and the Tickets API share `AGENT_API_TOKEN` and the same header scheme. A single skill can work both — pick the base path (`/api/agent-tasks` vs `/api/tickets`) and the matching verbs.

---

## See also

- `docs/WORKSHOP-AUTONOMOUS-TASKS.md` — local testing, reset between runs, removing task-solution commits, solve-all script.
- `docs/prds/PRD-AUTONOMOUS-TASK-SOURCES.md` — full requirements and acceptance criteria.
- `docs/API-TICKETS.md` — Kanban ticket queue (separate system, adds the ask/answer conversation).
- `.claude/prompts/agent-*.md` — the per-source prompts that call this API.
