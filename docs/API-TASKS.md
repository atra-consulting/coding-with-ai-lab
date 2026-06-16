# Agent Tasks API

Machine-facing and admin API for the autonomous task sources feature. Base path: **`/api/agent-tasks`**.

Source of truth: `backend/src/routes/agentTasks.ts` and `backend/src/services/agentTaskService.ts`. Full requirement-level spec: `docs/prds/PRD-AUTONOMOUS-TASK-SOURCES.md` (REQ-008 … REQ-012b).

---

## Concepts

A task (`agent_task` row) comes from one of four **sources** and moves through a **status** lifecycle:

```
source:  EMAIL | GITHUB_ISSUE | APP_LOG | ERROR_REPORT
status:  OPEN ──(GET /next)──▶ IN_PROGRESS ──(POST /done)──▶ DONE
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

Two distinct schemes — they never overlap.

### Agent token (machine endpoints: `/next`, `/:id/reject`, `/:id/done`)

Send the shared secret in **either** header:

```
Authorization: Bearer <AGENT_API_TOKEN>
# or
X-Agent-Token: <AGENT_API_TOKEN>
```

- The server compares it to the `AGENT_API_TOKEN` env var using SHA-256 + constant-time `timingSafeEqual`.
- If `AGENT_API_TOKEN` is **unset/empty**, every agent endpoint returns **401** (no default token).
- Missing or wrong token → **401**.
- Locally the backend auto-loads `backend/.env`; in CI set it as a GitHub Actions secret.

### Admin session (admin endpoints: `/`, `/:id`, `/summary`, `/reset`)

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

### GET `/api/agent-tasks/:id` — one task (admin)
**Auth:** admin session.

| Result | Meaning |
|--------|---------|
| `200` + task | found |
| `404` | no task with that id |
| `401` / `403` | not logged in / not admin |

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

## See also

- `docs/WORKSHOP-AUTONOMOUS-TASKS.md` — local testing, reset between runs, removing task-solution commits, solve-all script.
- `docs/prds/PRD-AUTONOMOUS-TASK-SOURCES.md` — full requirements and acceptance criteria.
- `.claude/prompts/agent-*.md` — the per-source prompts that call this API.
