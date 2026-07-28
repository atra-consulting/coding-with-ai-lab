# Tickets API

Machine-facing and admin API for the Kanban ticket system. Base path: **`/api/tickets`**.

Source of truth: `backend/src/routes/tickets.ts` and `backend/src/services/ticketService.ts`. Full requirement-level spec: `docs/prds/PRD-KANBAN-TICKET-SYSTEM.md`.

---

## Concepts

A ticket represents a unit of work. It has an **owner** (who acts on it next) and moves through a **status** lifecycle. `status` is a DB-level enum: `DEFINITION`, `TODO`, `IN_PROGRESS`, `ON_HOLD`, `DONE` (a `CHECK` constraint rejects any other value).

```
status:  DEFINITION ─(PATCH /:id/owner {AI})──▶ DEFINITION (owner→AI, "An KI übergeben")
              │      └(POST /:id/hand-to-ai)───▶ TODO (owner→AI, "Nach Bereit")
              ▼
         TODO ──(GET /next OR POST /:id/start)──▶ IN_PROGRESS ──(POST /done)──▶ DONE (solution=DONE)
                                                               └──(POST /ask)───▶ ON_HOLD (owner→HUMAN)
                                                                                  └──(POST /comments + handBackToAi)──▶ TODO (owner→AI)
         (POST /wont-do)  DONE with solution=WONT_DO — owner must be HUMAN, status must not be DONE
         (POST /reset)    deletes all data and re-seeds 12 workshop tickets
```

New tickets start in **`DEFINITION`** — the intake/refinement column (leftmost on the board, shown as "Definition"). A human refines the ticket via the comment thread, then routes it with one of two actions:
- **"An KI übergeben"** — assign the ticket to the AI, but keep it in `DEFINITION` (`PATCH /:id/owner` with `owner=AI`). The AI now owns the refinement; the ticket is not yet ready to build.
- **"Nach Bereit"** — assign to the AI **and** move it to `TODO` (`POST /:id/hand-to-ai` → `owner=AI`, `status=TODO`). The ticket is now ready and claimable.

Agents only ever claim `TODO`+`AI` tickets, so a `DEFINITION` ticket is never auto-claimed. The `TODO` column is labelled **"Zu bereit"** in the UI.

### Owner model and ask→answer→re-claim flow

- **AI** — the agent picks it up via `GET /next`, works it, and calls `POST /done`.
- **HUMAN** — the agent asked a question via `POST /ask`; the ticket moves `ON_HOLD` with `owner=HUMAN`. An admin answers via `POST /comments` with `handBackToAi: true`, which sets `status=TODO` and `owner=AI` so the agent can claim it again.
- Won't-Do is human-only and only allowed when `owner=HUMAN` (any status except `DONE`).

### Ticket object

```json
{
  "id": 7,
  "owner": "HUMAN",
  "type": "FEATURE",
  "title": "CSV-Export für die Firmenliste",
  "body": "…full text…",
  "status": "ON_HOLD",
  "solution": null,
  "pickedUpAt": null,
  "resolvedAt": null,
  "createdAt": "2026-06-21T10:00:00.000Z",
  "updatedAt": "2026-06-21T10:00:00.000Z",
  "comments": [
    {
      "id": 1,
      "ticketId": 7,
      "author": "AGENT",
      "authorName": "Claude Code",
      "body": "Welches Trennzeichen soll die CSV-Datei verwenden?",
      "createdAt": "2026-06-21T10:05:00.000Z"
    }
  ]
}
```

- `solution` is `null` until resolved. Set to `DONE` or `WONT_DO` when `status=DONE`.
- `pickedUpAt` is set when status → `IN_PROGRESS`. `resolvedAt` is set when status → `DONE`.
- `comments` array is included on single-ticket responses. List and board responses include `commentCount` (integer) instead.
- All timestamps are ISO-8601 strings.

### Ticket list item (paginated list and board)

Same fields as ticket, but `comments` is replaced by `commentCount: number`.

---

## Authentication

Two main schemes. `GET /:id` accepts all three (see below).

### Agent token (machine endpoints: `/next`, `/:id/start`, `/:id/done`, `/:id/ask`)

Send the shared secret in **either** header:

```
Authorization: Bearer <AGENT_API_TOKEN>
# or
X-Agent-Token: <AGENT_API_TOKEN>
```

- Compared against `AGENT_API_TOKEN` env var via SHA-256 + constant-time `timingSafeEqual`.
- If `AGENT_API_TOKEN` is **unset/empty**, every agent endpoint returns **401**.
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

### Admin session (all other endpoints)

Standard browser session cookie + role `ADMIN` (`requireAuth` + `requireRole('ADMIN')`).

- No session → **401**. Authenticated but not admin → **403**.

The admin board UI is at **`/admin/tickets`**.

---

## Endpoints

### GET `/api/tickets/next?type=TYPE` — claim the next ticket (agent)
**Auth:** agent token. `type` is optional.

Atomically flips the oldest `TODO` + `owner=AI` ticket to `IN_PROGRESS` (sets `pickedUpAt`). The status flip is the claim guard. Optional `type` filter (`FEATURE`, `BUG`, `CHORE`).

| Result | Meaning |
|--------|---------|
| `200` + ticket | claimed (includes `comments` array) |
| `204` (no body) | no matching TODO+AI ticket |
| `400` | `type` provided but not a valid enum value |
| `401` | bad/missing token |

```bash
curl -s -H "Authorization: Bearer $AGENT_API_TOKEN" \
  "$APP_BASE_URL/api/tickets/next?type=FEATURE"
```

---

### POST `/api/tickets/:id/done` — mark complete (agent)
**Auth:** agent token. **Body:** `{ "comment": "<optional string>" }`.

Sets `status=DONE`, `solution=DONE`, `resolvedAt`. Guard: ticket must be `IN_PROGRESS`.

| Result | Meaning |
|--------|---------|
| `200` + ticket | done |
| `400` | body validation failure |
| `401` | bad/missing token |
| `404` | no ticket with that id |
| `409` | ticket not `IN_PROGRESS` |

```bash
curl -s -X POST -H "Authorization: Bearer $AGENT_API_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"comment":"Implemented dark mode toggle in header."}' \
  "$APP_BASE_URL/api/tickets/6/done"
```

---

### POST `/api/tickets/:id/ask` — hand back with a question (agent)
**Auth:** agent token. **Body:** `{ "question": "<non-empty string>" }`.

Sets `status=ON_HOLD`, `owner=HUMAN`. Inserts an `AGENT` comment with the question text. Guard: ticket must be `IN_PROGRESS`.

| Result | Meaning |
|--------|---------|
| `200` + ticket | on hold, question posted |
| `400` | `question` missing/empty |
| `401` | bad/missing token |
| `404` | no ticket with that id |
| `409` | ticket not `IN_PROGRESS` |

```bash
curl -s -X POST -H "Authorization: Bearer $AGENT_API_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"question":"Comma or semicolon as CSV separator?"}' \
  "$APP_BASE_URL/api/tickets/5/ask"
```

---

### GET `/api/tickets` — paginated list (admin)
**Auth:** admin session.

**Query params:** `type`, `status`, `owner` (all validated against enums → `400` if invalid), `page` (0-indexed), `size`, `sort` (`field,direction`; default `createdAt,DESC`; sortable fields: `createdAt`, `updatedAt`, `status`, `type`, `owner`, `title`).

Response is the Spring-Data-style page shape:

```json
{
  "content": [ /* ticket list items with commentCount */ ],
  "totalElements": 12,
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
| `400` | invalid filter value |
| `401` / `403` | not logged in / not admin |

---

### GET `/api/tickets/board` — Kanban board (admin)
**Auth:** admin session.

All tickets grouped by status. Each column sorted by `createdAt ASC`. Tickets include `commentCount`.

```json
{
  "DEFINITION":  [ /* ticket list items */ ],
  "TODO":        [ /* ticket list items */ ],
  "IN_PROGRESS": [ /* ticket list items */ ],
  "ON_HOLD":     [ /* ticket list items */ ],
  "DONE":        [ /* ticket list items */ ]
}
```

| Result | Meaning |
|--------|---------|
| `200` + board | grouped tickets |
| `401` / `403` | not logged in / not admin |

---

### GET `/api/tickets/summary` — counts by dimension (admin)
**Auth:** admin session. All known enum values are always present (zero if no tickets).

```json
{
  "byStatus":   { "DEFINITION": 5, "TODO": 5, "IN_PROGRESS": 0, "ON_HOLD": 2, "DONE": 0 },
  "byType":     { "FEATURE": 10, "BUG": 0, "CHORE": 2 },
  "byOwner":    { "AI": 5, "HUMAN": 7 },
  "bySolution": { "DONE": 0, "WONT_DO": 0 }
}
```

`bySolution` counts only among tickets where `solution IS NOT NULL`.

| Result | Meaning |
|--------|---------|
| `200` + summary | counts |
| `401` / `403` | not logged in / not admin |

---

### GET `/api/tickets/:id` — one ticket
**Auth:** loopback bypass · agent token · admin session (first match wins). Returns the full ticket including the `comments` array.

**Read-only.** Never changes status, owner, or any other field.

| Result | Meaning |
|--------|---------|
| `200` + ticket | found |
| `404` | no ticket with that id |
| `401` / `403` | not authenticated / not admin |

Skills and agents can call this endpoint on localhost without any token when `AGENT_AUTH_ALLOW_LOOPBACK=1`. In production, send the agent token or use an admin session.

---

### POST `/api/tickets/:id/start` — set ticket to in progress (agent)
**Auth:** agent token.

Explicitly transitions a `TODO` ticket with `owner=AI` to `IN_PROGRESS` (sets `pickedUpAt`). Use when you already know the ticket id and do not want to go through `/next`. The `/next` endpoint does the same transition automatically when it claims a ticket.

| Result | Meaning |
|--------|---------|
| `200` + ticket | now IN_PROGRESS (includes `comments` array) |
| `404` | no ticket with that id |
| `409` | ticket is not TODO+AI (wrong status, wrong owner, or already IN_PROGRESS/DONE) |
| `401` | bad/missing token |

```bash
curl -s -X POST -H "Authorization: Bearer $AGENT_API_TOKEN" \
  "$APP_BASE_URL/api/tickets/3/start"
```

---

### POST `/api/tickets` — create (admin)
**Auth:** admin session. **Body:** `{ "type": "FEATURE"|"BUG"|"CHORE", "title": "<string>", "body": "<string>" }`.

Creates a ticket with `owner=HUMAN`, `status=DEFINITION` (lands in the intake column), no comments.

| Result | Meaning |
|--------|---------|
| `201` + ticket | created |
| `400` | validation failure |
| `401` / `403` | not logged in / not admin |

```bash
curl -s -X POST -H "Content-Type: application/json" \
  -b "JSESSIONID=$SESSION" \
  -d '{"type":"BUG","title":"Login button missing on mobile","body":"Reproducible on iOS 17 Safari."}' \
  "$APP_BASE_URL/api/tickets"
```

---

### PATCH `/api/tickets/:id/status` — change status (admin)
**Auth:** admin session. **Body:** `{ "status": "DEFINITION"|"TODO"|"IN_PROGRESS"|"ON_HOLD"|"DONE" }`.

Used for drag-drop on the Kanban board (all five columns are valid drop targets, including `DEFINITION`). Moving into `DONE` sets `solution=DONE` and `resolvedAt`. Moving out of `DONE` clears `solution` and `resolvedAt`. Never changes `owner`. Note: the "Nach Bereit" button on the detail page is **not** this endpoint — it uses `POST /:id/hand-to-ai` (which also sets `owner=AI`).

| Result | Meaning |
|--------|---------|
| `200` + ticket | updated |
| `400` | invalid status value |
| `404` | no ticket with that id |
| `401` / `403` | not logged in / not admin |

---

### PATCH `/api/tickets/:id/owner` — change owner (admin)
**Auth:** admin session. **Body:** `{ "owner": "AI"|"HUMAN" }`.

Changes owner only; status is not touched.

| Result | Meaning |
|--------|---------|
| `200` + ticket | updated |
| `400` | invalid owner value |
| `404` | no ticket with that id |
| `401` / `403` | not logged in / not admin |

---

### POST `/api/tickets/:id/wont-do` — resolve as Won't Do (admin)
**Auth:** admin session. **Body:** `{ "comment": "<optional string>" }`.

Sets `status=DONE`, `solution=WONT_DO`, `resolvedAt`. Guard: `owner` must be `HUMAN` and `status` must not already be `DONE`.

| Result | Meaning |
|--------|---------|
| `200` + ticket | resolved |
| `400` | body validation failure |
| `404` | no ticket with that id |
| `409` | ticket already done or not human-owned |
| `401` / `403` | not logged in / not admin |

---

### POST `/api/tickets/:id/hand-to-ai` — move a Definition ticket to the ready queue (admin)
**Auth:** admin session. No body.

Sets `owner=AI`, `status=TODO`. Guard: ticket must be in `DEFINITION`. This is the **"Nach Bereit"** action on a Definition ticket — it assigns the ticket to the AI **and** moves it to `TODO` ("Zu bereit"), making it claimable by the agent. To instead assign the ticket to the AI while keeping it in `DEFINITION` ("An KI übergeben"), use `PATCH /:id/owner` with `owner=AI`.

| Result | Meaning |
|--------|---------|
| `200` + ticket | routed to AI (`owner=AI`, `status=TODO`) |
| `404` | no ticket with that id |
| `409` | ticket not in `DEFINITION` |
| `401` / `403` | not logged in / not admin |

```bash
curl -s -X POST -b "JSESSIONID=$SESSION" \
  "$APP_BASE_URL/api/tickets/3/hand-to-ai"
```

---

### POST `/api/tickets/:id/comments` — add human comment (admin)
**Auth:** admin session. **Body:** `{ "body": "<non-empty string>", "handBackToAi": <optional boolean> }`.

Inserts a `HUMAN` comment. If `handBackToAi: true`, also sets `status=TODO`, `owner=AI`, clears `solution` and `resolvedAt` — returning the ticket to the AI queue. Guard: `handBackToAi` is only allowed when `status=ON_HOLD` and `owner=HUMAN`.

| Result | Meaning |
|--------|---------|
| `200` + ticket | comment added (ticket re-claimed if handBackToAi) |
| `400` | `body` missing/empty |
| `404` | no ticket with that id |
| `409` | `handBackToAi=true` but ticket is not `ON_HOLD+HUMAN` |
| `401` / `403` | not logged in / not admin |

```bash
curl -s -X POST -H "Content-Type: application/json" \
  -b "JSESSIONID=$SESSION" \
  -d '{"body":"Use a semicolon for German Excel compatibility.","handBackToAi":true}' \
  "$APP_BASE_URL/api/tickets/7/comments"
```

---

### POST `/api/tickets/reset` — re-seed all tickets (admin)
**Auth:** admin session. No body.

Deletes all rows in `ticket_comment` and `ticket`, then re-seeds the 12 workshop tickets. Returns the count of seeded tickets.

```json
{ "seeded": 12 }
```

| Result | Meaning |
|--------|---------|
| `200` + `{seeded}` | count of seeded tickets |
| `401` / `403` | not logged in / not admin |

---

## State machine

```
                   ┌─────────────────────────────────────────────────────────────────┐
                   │                          DONE                                    │
                   │           solution = DONE | WONT_DO                              │
                   └─────────────────────────────────────────────────────────────────┘
                         ▲ POST /done (agent)            ▲ POST /wont-do (admin)
                         │ solution=DONE                 │ solution=WONT_DO
                         │                               │ owner must be HUMAN
                    IN_PROGRESS                       ON_HOLD  (owner=HUMAN)
                         ▲                               ▲          │
            GET /next    │                 POST /ask     │          │ POST /comments
           OR /start     │                 (agent)       │          │ handBackToAi=true
           (owner=AI)    │                               │          │ owner→AI
                         │                               │          │
                        TODO  ◀──────────────────────────────────────┘
                     (owner=AI)
                         ▲
                         │ POST /:id/hand-to-ai  ("Nach Bereit", owner→AI)
                         │
                     DEFINITION  ◀── new tickets start here (intake / "Definition")
                     (PATCH /:id/owner {AI} = "An KI übergeben": owner→AI, stays here)
                        PATCH /status sets solution + resolvedAt on → DONE;
                        clears them on exit from DONE.
```

**Summary of transitions:**

| Trigger | From | To | Side effects |
|---------|------|----|-------------|
| `PATCH /:id/owner {AI}` (admin) | `DEFINITION` | `DEFINITION` | `owner→AI` ("An KI übergeben") |
| `POST /:id/hand-to-ai` (admin) | `DEFINITION` | `TODO` | `owner→AI` ("Nach Bereit") |
| `GET /next` | `TODO` + `owner=AI` | `IN_PROGRESS` | sets `pickedUpAt` |
| `POST /start` (agent) | `TODO` + `owner=AI` | `IN_PROGRESS` | sets `pickedUpAt` |
| `POST /done` (agent) | `IN_PROGRESS` | `DONE` | `solution=DONE`, `resolvedAt` |
| `POST /ask` (agent) | `IN_PROGRESS` | `ON_HOLD` | `owner→HUMAN`, AGENT comment |
| `POST /comments` + `handBackToAi` (admin) | `ON_HOLD` + `owner=HUMAN` | `TODO` | `owner→AI`, `solution`/`resolvedAt` cleared, HUMAN comment |
| `POST /wont-do` (admin) | any (not `DONE`), `owner=HUMAN` | `DONE` | `solution=WONT_DO`, `resolvedAt` |
| `PATCH /status → DONE` (admin) | any | `DONE` | `solution=DONE`, `resolvedAt` |
| `PATCH /status → non-DONE` (admin) | any | target status | `solution`/`resolvedAt` cleared |

---

## Error response shape

All errors use the app-wide handler:

```json
{
  "status": 409,
  "message": "Ticket 7 ist nicht in Bearbeitung und kann nicht abgeschlossen werden",
  "timestamp": "2026-06-21T10:05:00.000Z",
  "fieldErrors": {}
}
```

`fieldErrors` is present for validation failures (e.g. missing `question`, invalid `type`/`status`/`owner`).

---

## Seed data

12 workshop tickets seeded via `backend/src/seed/ticketSeed.ts`. Seed runs inside `POST /reset` (full wipe + re-seed). Unlike `agent_task`, ticket seed does **not** run on every startup — only when the DB is empty at first boot or after a manual reset.

| # | Title | Type | Status | Owner |
|---|-------|------|--------|-------|
| 1 | Firmen auf einer Karte anzeigen | FEATURE | DEFINITION | HUMAN |
| 2 | KI-Chat fürs CRM | FEATURE | DEFINITION | HUMAN |
| 3 | Firmendossier aus dem Internet | FEATURE | DEFINITION | HUMAN |
| 4 | KI-Beziehungsanalyse | FEATURE | DEFINITION | HUMAN |
| 5 | Firmen aus Datei importieren | FEATURE | DEFINITION | HUMAN |
| 6 | Dunkelmodus-Umschalter im Header | FEATURE | TODO | AI |
| 7 | CSV-Export für die Firmenliste | FEATURE | ON_HOLD | HUMAN |
| 8 | Icons für Aktivitätstypen | CHORE | TODO | AI |
| 9 | Zähler-Badges im Seitenmenü | FEATURE | ON_HOLD | HUMAN |
| 10 | Chancen-Phase als farbiger Badge | CHORE | TODO | AI |
| 11 | Notiz-Feld für Chancen | FEATURE | TODO | AI |
| 12 | Firmen als Favorit markieren | FEATURE | TODO | AI |

Starting board, by intent:
- **`DEFINITION`** (5, all `HUMAN`): tickets 1–5 — too vague to build. Each carries a seeded `AGENT` comment (`authorName: "Claude Code"`) asking the human to add detail.
- **`TODO`** / "Zu bereit" (5, all `AI`): tickets 6, 8, 10, 11, 12 — well-specified and ready. No comments. (Ticket 11 had an open question about the note character limit; the answer — 1000 characters — is baked into its body.)
- **`ON_HOLD`** / "Wartet" (2, `HUMAN`): tickets 7 and 9 — the AI asked a specific question and is waiting for an answer. Each carries the `AGENT` question as a comment.

Seven tickets carry a seeded `AGENT` comment: the five `DEFINITION` tickets (1–5) and the two `ON_HOLD` tickets (7, 9). `POST /reset` deletes all comments and tickets then re-inserts all 12 tickets plus these 7 comments.

---

## For skill authors

A workshop skill drives this API as an agent. Use the **agent endpoints only** — the admin endpoints (`board`, `summary`, `create`, `status`, `owner`, `wont-do`, `comments`, `reset`) are for the human dashboard.

**Auth.** Send the shared agent token on every call. Same token as the Agent Tasks API (`AGENT_API_TOKEN`):

```
Authorization: Bearer $AGENT_API_TOKEN
# or:
X-Agent-Token: $AGENT_API_TOKEN
```

**The calls a skill needs:**

| Step | Call | Notes |
|------|------|-------|
| Claim | `GET /api/tickets/next` | Optional `?type=FEATURE\|BUG\|CHORE`. Claims the oldest `TODO` ticket owned by `AI`, flips it to `IN_PROGRESS`. **`204` = queue empty, stop.** The response includes the full `comments` thread. |
| Start | `POST /api/tickets/:id/start` | No body. From `TODO`+`owner=AI` → `IN_PROGRESS`. Use when you have the id but did not go through `/next`. Response includes full `comments` thread. |
| Read | `GET /api/tickets/:id` | Re-read a ticket by id (full ticket + comments). Accepts agent token or loopback bypass. |
| Finish | `POST /api/tickets/:id/done` | Body `{ "comment"?: string }`. Only from `IN_PROGRESS`. Sets `solution=DONE`. |
| Ask | `POST /api/tickets/:id/ask` | Body `{ "question": string }` (required). Hands the ticket to a human (`ON_HOLD`, owner→`HUMAN`). Posts the question as an `AGENT` comment. |

**Loop shape:**

```
while GET /next returns 200:
    read ticket + comments               # the thread carries any prior human answers
    decide: can I finish, or must I ask?
    if finish:  POST /:id/done {comment}
    else:       POST /:id/ask  {question}   # then move on; a human answers later
# 204 → nothing left to claim
```

**What's different from tasks** (see `docs/specs/SPEC-API-TASKS.md`):

- **No `reject`.** A ticket is never thrown away. When you lack a decision, you `ask` — the ticket goes to a human and comes back to the `AI` queue once answered (with your question and their reply in the `comments` thread). Re-claim it later via `GET /next` and continue.
- **`/next` takes no required parameter.** Tasks require `?source=`; tickets only have an optional `?type=`.
- **Read the thread on every claim.** A re-claimed ticket carries the human's answer as the latest `HUMAN` comment. Don't re-ask what's already answered.
- **You cannot resolve a ticket as "Won't Do".** That is a human-only action.

**One token, two queues.** This API and the Agent Tasks API share `AGENT_API_TOKEN` and the same header scheme. A single skill can work both — pick the base path (`/api/tickets` vs `/api/agent-tasks`) and the matching verbs.

---

## See also

- `docs/prds/PRD-KANBAN-TICKET-SYSTEM.md` — full requirements and acceptance criteria.
- `docs/specs/SPEC-API-TASKS.md` — agent-task queue (separate system, different lifecycle).
- `backend/src/seed/ticketSeed.ts` — seed data definitions.
