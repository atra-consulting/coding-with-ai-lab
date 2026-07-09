# Implementation Plan: UPDATE-README-TOOLS-SPECS

Docs-only change. Four Markdown files. No code. No new tests.

## Test Command

`(none — docs-only)`. Verification = internal Markdown links resolve + files render. No backend/frontend suite applies.

## Ground truth (from code audit)

- **agent_task seed:** 23 tasks, fixed ids 1–23, **all `OPEN`** on fresh seed. Sources: EMAIL (7), GITHUB_ISSUE (4), APP_LOG (6), ERROR_REPORT (6). Lifecycle `OPEN → IN_PROGRESS → DONE | REJECTED`. Dashboard list sort default `createdAt DESC` (newest first).
- **ticket seed:** 12 tickets, 5 columns (`DEFINITION`, `TODO`, `IN_PROGRESS`, `ON_HOLD`, `DONE`). Seed runs on **every** startup (`INSERT OR IGNORE`, unconditional).
- **`/write-ticket` demo behavior:** claims the *oldest* OPEN task per source (`GET /next`), marks it `DONE` on success. Over repeated automated runs the oldest get consumed; the newest (top of the DESC list) stay open longest → "top two or three still to do."

## Tasks

### 1. README.MD — conference-audience path more prominent + better structured
- [ ] Make the "Für Konferenz-Zuhörer" path stand out (elevate/callout near the top intro, tighten wording).
- [ ] Shorten the section. Short sentences. Sentence fragments.
- [ ] Keep/ensure links to `docs/SKILLS.md`, `docs/SUBAGENTS.md`, `docs/TOOLS.md`, and **especially `docs/TRANSFER.md`** (emphasize TRANSFER as the main how-to).
- [ ] Do not break existing anchors used elsewhere in the file (`#für-konferenz-zuhörer-…`, TOC entries).

### 2. docs/TOOLS.md — demo note + recent ticketing/tasks changes
- [ ] Agent-Task-Dashboard section: add demo guidance — when filtering by source (e.g. `?source=EMAIL`), typically only the **top two or three** are genuinely still to do; the older rows still show "Open" but earlier automated GitHub-Action runs of the skills already turned them into tickets. For a demo, pick one of the top entries.
- [ ] Note the seed size (23 agent-tasks) and that `/write-ticket` is the skill that triages a task into a ticket. Link `/write-ticket`.
- [ ] Verify sources + lifecycle wording match code (they do); tighten if needed.
- [ ] Ticket-Board section: confirm 5 columns + owner model current; add `/do-semi-automatic` as the skill that works AI tickets; link it.

### 3. docs/specs/SPEC-API-TASKS.md — fix drift
- [ ] `POST /reset` example `{ "reset": 16 }` → `{ "reset": 23 }`.
- [ ] `/summary` example counts (stale, sum to 16) → fresh-seed reality: EMAIL open 7, GITHUB_ISSUE 4, APP_LOG 6, ERROR_REPORT 6, all others 0 (no DONE in seed).
- [ ] `GET /` page example `totalElements: 16, totalPages: 2` → `23` / `3` (size 10).
- [ ] Cron intro "every 10 min" → match `cronJobs.ts` (`0 2 * * *`, daily) — the spec already says daily later; remove the contradiction.

### 4. docs/specs/SPEC-API-TICKETS.md — fix drift
- [ ] Correct the wrong claim (~L497) that ticket seed does **not** run on every startup — it does (`seedTickets()` unconditional, `INSERT OR IGNORE`), same as agent_task.
- [ ] `/done`: note the optional `comment` is stored as an **AGENT** comment.
- [ ] `/wont-do`: note the optional `comment` is stored as a **HUMAN** comment.
- [ ] `/owner`: clarify it changes owner on **any** status (not only the DEFINITION "An KI übergeben" case).

## Verification
- [ ] All internal Markdown links in the four files resolve to real anchors/files.
- [ ] Numbers in SPEC examples are internally consistent (summary counts, page totals).
- [ ] `ba-reviewer` reviews the four files for accuracy + gaps.

## Writing style
Short. Brief. Simple words. No passive voice. Sentence fragments. German (match each file).
