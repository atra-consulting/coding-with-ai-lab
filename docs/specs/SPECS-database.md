# CRM Database Specification

Column definitions, entity schemas, enums, foreign keys, migration approach, and ORM/driver versions for the CRM SQLite database.

Cross-references:
- Operational facts (DB engine, file path, startup): see [SPECS-infrastructure.md](SPECS-infrastructure.md)
- API routes, sort-field whitelists, DTO fields, code patterns: see [SPECS-backend.md](SPECS-backend.md)

## Runtime Versions

<!-- mirror: keep in sync with SPECS.md / SPECS-infrastructure.md stack table -->

| Library | Version |
|---------|---------|
| @libsql/client | (libSQL / Turso) |
| drizzle-orm | 0.41 |

The DB driver is `@libsql/client` (libSQL/Turso), not better-sqlite3. The API is **async**: `await client.execute(sql)`, `await client.executeMultiple(sql)` (non-transactional bulk DDL). Local development uses `file:backend/data/crmdb.sqlite`; production uses a `TURSO_DATABASE_URL` env var. Drizzle is initialized with `drizzle(client, { schema })` from `drizzle-orm/libsql`.

## Schema Files

| Purpose | Path |
|---------|------|
| Drizzle table definitions | `backend/src/db/schema/schema.ts` |
| TypeScript enum arrays and types | `backend/src/db/schema/enums.ts` |
| Migration statements (DDL) | `backend/src/config/migrate.ts` |

Migration approach: plain `CREATE TABLE IF NOT EXISTS` statements. Run on every startup before CRM seed data is loaded. After DDL, `seedAgentTasks()` (`backend/src/seed/agentTaskSeed.ts`) inserts the 18 `agent_task` rows idempotently (INSERT OR IGNORE, fixed ids 1–18) — so agent tasks exist in every deployment including Vercel cold-starts.

## Tables

The database contains six core domain tables — `firma`, `abteilung`, `person`, `adresse`, `aktivitaet`, `chance` — plus operational tables: `agent_task` (autonomous task sources), `ticket` + `ticket_comment` (Kanban ticket system), `cron_run` (cron run history), `sessions` (server-side session store), and `szenario` (Produktivität-Rechner saved scenarios).

### Ticket (`ticket`)

Kanban work items with an owner and status lifecycle. Created by admins or seeded by `backend/src/seed/ticketSeed.ts`. Agent picks up via `GET /api/tickets/next`; admin manages via `/api/tickets` routes.

| Column | SQLite Type | Constraints |
|--------|-------------|-------------|
| id | integer | PK, autoIncrement |
| owner | text | NOT NULL, default `HUMAN` — `TICKET_OWNER` enum |
| type | text | NOT NULL — `TICKET_TYPE` enum |
| title | text | NOT NULL |
| body | text | NOT NULL |
| status | text | NOT NULL, default `DEFINITION` — `TICKET_STATUS` enum, DB `CHECK` constraint |
| solution | text | nullable — `TICKET_SOLUTION` enum; set on `status=DONE` |
| pickedUpAt | text | nullable — ISO-8601, set when status → `IN_PROGRESS` |
| resolvedAt | text | nullable — ISO-8601, set when status → `DONE` |
| createdAt | text | NOT NULL, default `datetime('now')` |
| updatedAt | text | NOT NULL, default `datetime('now')` |

No FKs. Indexes: `idx_ticket_status_owner_createdAt (status, owner, createdAt)`, `idx_ticket_type_status (type, status)`.

### TicketComment (`ticket_comment`)

Comments on tickets. Author is either `AGENT` (question or closing note from the AI) or `HUMAN` (admin answer). Cascade-deleted when the parent ticket is deleted.

| Column | SQLite Type | Constraints |
|--------|-------------|-------------|
| id | integer | PK, autoIncrement |
| ticketId | integer | NOT NULL, FK → ticket(id) CASCADE DELETE |
| author | text | NOT NULL — `TICKET_COMMENT_AUTHOR` enum |
| authorName | text | nullable — display name (e.g. `"Claude Code"`) |
| body | text | NOT NULL |
| createdAt | text | NOT NULL, default `datetime('now')` |

Index: `idx_ticket_comment_ticketId (ticketId)`.

### CronRun (`cron_run`)

Audit log of cron heartbeats/dispatches. Written by `backend/src/services/cronService.ts`; one row per tick (CRON or MANUAL). Append-only history — the "jobs" list is config-derived (`backend/src/config/cronJobs.ts`), not a table.

| Column | SQLite Type | Constraints |
|--------|-------------|-------------|
| id | integer | PK, autoIncrement |
| job | text | NOT NULL (e.g. `solve-tasks`) |
| status | text | NOT NULL — `RUNNING` \| `SUCCESS` \| `FAILED` \| `SKIPPED` |
| trigger | text | NOT NULL — `CRON` \| `MANUAL` (quoted as `"trigger"` in DDL/SQL; it is a SQL keyword) |
| startedAt | text | NOT NULL, ISO-8601 — set explicitly by the service, **no** `datetime('now')` default (keeps the 30-min orphan-guard string compare ISO-consistent) |
| finishedAt | text | nullable |
| durationMs | integer | nullable |
| result | text | nullable JSON summary (`{openTasks,dispatched}` / `{tasksSolved,tasksRejected}` / `{skipReason}`) |
| githubRunUrl | text | nullable |
| error | text | nullable |

No FKs. Indexes: `idx_cron_run_startedAt (startedAt DESC)`, `idx_cron_run_job_startedAt (job, startedAt DESC)`.

### Sessions (`sessions`)

Server-side session store. Written and read by `backend/src/middleware/libsqlSessionStore.ts` via raw `client.execute()` calls, not through Drizzle. The Drizzle definition in `schema.ts` is documentary only.

| Column | SQLite Type | Constraints |
|--------|-------------|-------------|
| sid | text | PK |
| sess | text | NOT NULL |
| expire | text | NOT NULL |

### AgentTask (`agent_task`)

Autonomous task queue. Tasks arrive from four external sources and move through a defined lifecycle: `OPEN → IN_PROGRESS → DONE | REJECTED`. Seeded idempotently on every startup via `INSERT OR IGNORE` with fixed ids 1–18 (`backend/src/seed/agentTaskSeed.ts`).

| Column | SQLite Type | Constraints |
|--------|-------------|-------------|
| id | integer | PK, autoIncrement |
| source | text | NOT NULL — `AGENT_TASK_SOURCE` enum |
| title | text | NOT NULL |
| body | text | NOT NULL |
| status | text | NOT NULL, default `OPEN` — `AGENT_TASK_STATUS` enum |
| comment | text | nullable — rejection reason or agent note |
| metadata | text | nullable — JSON string for extra context |
| pickedUpAt | text | nullable — ISO-8601, set when status → IN_PROGRESS |
| resolvedAt | text | nullable — ISO-8601, set when status → DONE or REJECTED |
| createdAt | text | NOT NULL, default `datetime('now')` |
| updatedAt | text | NOT NULL, default `datetime('now')` |

No FKs. Indexes: `idx_agent_task_status_createdAt (status, createdAt)`, `idx_agent_task_source_status (source, status)`.

### Szenario (`szenario`)

Saved scenarios for the Produktivität → Rechner cycle-time calculator. Each scenario stores per-step durations for three software-delivery processes (human, semi-automated, fully-automated). Global/shared across all logged-in users. Seeded idempotently on startup via `INSERT OR IGNORE` with fixed id 1 ("Standard-Szenario", `backend/src/seed/szenarioSeed.ts`).

| Column | SQLite Type | Constraints |
|--------|-------------|-------------|
| id | integer | PK, autoIncrement |
| name | text | NOT NULL, UNIQUE |
| humanSteps | text | NOT NULL, `CHECK (json_valid(...))` — JSON `{ works: number[23], waits: number[22] }` |
| semiAutomatedSteps | text | NOT NULL, `CHECK (json_valid(...))` — JSON `{ works: number[6], waits: number[5] }` |
| automatedSteps | text | NOT NULL, `CHECK (json_valid(...))` — JSON `{ works: number[2], waits: number[1] }` |
| createdAt | text | NOT NULL, default `datetime('now')` |
| updatedAt | text | NOT NULL, default `datetime('now')` |

`works` are per-step active times (minutes); `waits` are the between-step delays (one fewer than steps). No FKs. Index: `idx_szenario_createdAt (createdAt DESC)`.

## Storage Rules

- All tables use `integer` PKs with autoincrement (except `sessions` which uses a `text` PK `sid`).
- All timestamps are `text` columns storing ISO-8601 strings.
- The only monetary column is `wert` in `chance` — stored as `REAL`.
- Foreign keys enforce referential integrity.
- `PRAGMA foreign_keys = ON` is issued once at startup inside `runMigrations()` in `backend/src/config/migrate.ts` via `await client.execute('PRAGMA foreign_keys = ON')`. It is **not** set per-connection in `db.ts`.

## Entities

### Firma

| Column | SQLite Type | Constraints |
|--------|-------------|-------------|
| id | integer | PK, autoIncrement |
| name | text | NOT NULL |
| industry | text | nullable |
| website | text | nullable |
| phone | text | nullable |
| email | text | nullable |
| notes | text | nullable |
| createdAt | text | NOT NULL, default `datetime('now')` |
| updatedAt | text | NOT NULL, default `datetime('now')` |

Cascade deletes to: Person, Abteilung, Adresse, Aktivitaet, Chance.

### Person

| Column | SQLite Type | Constraints |
|--------|-------------|-------------|
| id | integer | PK, autoIncrement |
| firstName | text | NOT NULL |
| lastName | text | NOT NULL |
| email | text | nullable |
| phone | text | nullable |
| position | text | nullable |
| notes | text | nullable |
| firmaId | integer | NOT NULL, FK → firma(id) CASCADE DELETE |
| abteilungId | integer | nullable, FK → abteilung(id) SET NULL |
| createdAt | text | NOT NULL, default `datetime('now')` |
| updatedAt | text | NOT NULL, default `datetime('now')` |

Cascade deletes to: Adresse, Aktivitaet.

### Abteilung

| Column | SQLite Type | Constraints |
|--------|-------------|-------------|
| id | integer | PK, autoIncrement |
| name | text | NOT NULL |
| description | text | nullable |
| firmaId | integer | NOT NULL, FK → firma(id) CASCADE DELETE |
| createdAt | text | NOT NULL, default `datetime('now')` |
| updatedAt | text | NOT NULL, default `datetime('now')` |

### Adresse

| Column | SQLite Type | Constraints |
|--------|-------------|-------------|
| id | integer | PK, autoIncrement |
| street | text | nullable |
| houseNumber | text | nullable |
| postalCode | text | nullable |
| city | text | nullable |
| country | text | nullable |
| latitude | real | nullable |
| longitude | real | nullable |
| typ | text | nullable |
| firmaId | integer | nullable, FK → firma(id) CASCADE DELETE |
| personId | integer | nullable, FK → person(id) CASCADE DELETE |
| createdAt | text | NOT NULL, default `datetime('now')` |
| updatedAt | text | NOT NULL, default `datetime('now')` |

### Aktivitaet

| Column | SQLite Type | Constraints |
|--------|-------------|-------------|
| id | integer | PK, autoIncrement |
| typ | text | NOT NULL |
| subject | text | NOT NULL |
| description | text | nullable |
| datum | text | NOT NULL |
| firmaId | integer | nullable, FK → firma(id) CASCADE DELETE |
| personId | integer | nullable, FK → person(id) CASCADE DELETE |
| createdAt | text | NOT NULL, default `datetime('now')` |
| updatedAt | text | NOT NULL, default `datetime('now')` |

### Chance

| Column | SQLite Type | Constraints |
|--------|-------------|-------------|
| id | integer | PK, autoIncrement |
| titel | text | NOT NULL |
| beschreibung | text | nullable |
| wert | real | nullable |
| currency | text | NOT NULL, default `EUR` |
| phase | text | NOT NULL, default `NEU` |
| wahrscheinlichkeit | integer | nullable, 0–100 |
| erwartetesDatum | text | nullable |
| firmaId | integer | NOT NULL, FK → firma(id) CASCADE DELETE |
| kontaktPersonId | integer | nullable, FK → person(id) SET NULL |
| createdAt | text | NOT NULL, default `datetime('now')` |
| updatedAt | text | NOT NULL, default `datetime('now')` |

## Enums

<!-- canonical source — mirrored in SPECS-backend.md Validation section -->

Stored as plain `text` in SQLite. Validated by Zod on write. Defined in `backend/src/db/schema/enums.ts`.

| Enum | Values |
|------|--------|
| ChancePhase | NEU, QUALIFIZIERT, ANGEBOT, VERHANDLUNG, GEWONNEN, VERLOREN |
| AktivitaetTyp | ANRUF, EMAIL, MEETING, NOTIZ, AUFGABE |
| AgentTaskSource | EMAIL, GITHUB_ISSUE, APP_LOG, ERROR_REPORT |
| AgentTaskStatus | OPEN, IN_PROGRESS, DONE, REJECTED |
| TicketOwner | AI, HUMAN |
| TicketType | FEATURE, BUG, CHORE |
| TicketStatus | DEFINITION, TODO, IN_PROGRESS, ON_HOLD, DONE |
| TicketSolution | DONE, WONT_DO |
| TicketCommentAuthor | HUMAN, AGENT |

## Indexes

All indexes are created in `backend/src/config/migrate.ts` via `CREATE INDEX IF NOT EXISTS`. They cover every FK column and the most common filter/sort columns. Inline table notes above reference these same index names.

| Index name | Table | Columns |
|------------|-------|---------|
| idx_person_firmaId | person | firmaId |
| idx_person_abteilungId | person | abteilungId |
| idx_abteilung_firmaId | abteilung | firmaId |
| idx_aktivitaet_firmaId | aktivitaet | firmaId |
| idx_aktivitaet_personId | aktivitaet | personId |
| idx_aktivitaet_datum | aktivitaet | datum DESC |
| idx_aktivitaet_createdAt | aktivitaet | createdAt DESC |
| idx_chance_firmaId | chance | firmaId |
| idx_chance_phase | chance | phase |
| idx_chance_createdAt | chance | createdAt DESC |
| idx_adresse_firmaId | adresse | firmaId |
| idx_adresse_personId | adresse | personId |
| idx_sessions_expire | sessions | expire |
| idx_agent_task_status_createdAt | agent_task | status, createdAt |
| idx_agent_task_source_status | agent_task | source, status |
| idx_cron_run_startedAt | cron_run | startedAt DESC |
| idx_cron_run_job_startedAt | cron_run | job, startedAt DESC |
| idx_ticket_status_owner_createdAt | ticket | status, owner, createdAt |
| idx_ticket_type_status | ticket | type, status |
| idx_ticket_comment_ticketId | ticket_comment | ticketId |
| idx_szenario_createdAt | szenario | createdAt DESC |
