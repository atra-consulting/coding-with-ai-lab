# Implementation Plan: DO-FACTORY-SEMI-AUTOMATIC

## Source

Spec: `tasks/advanced/Skill für Übungsaufgabe 4.md`
Reference skill: `.claude/skills/do-factory-automatic/SKILL.md`
API: `docs/API-TICKETS.md` (section "For skill authors")

## Test Command

None. Single Markdown skill file. Test-inappropriate (no runnable code). Validated by `skill-reviewer`.

## Goal

New project skill `/do-factory-semi-automatic`. Headless. Claims next ticket (or loads by id), reads the comment thread, judges build-or-ask via `requirements-reviewer`, then asks a clarifying question (→ `ON_HOLD`) or builds it fully via `plan-and-do`. No push, no PR.

## Key differences from do-factory-automatic

- Works the **ticket** queue (`/api/tickets/*`), not agent-tasks.
- **Asks** instead of rejecting — `POST /:id/ask` hands ticket to a human.
- Reads the **comment thread** on every claim — prior human answers are authoritative; never re-ask.
- `/next` takes optional `?type=FEATURE|BUG|CHORE` (no required `source`).
- Re-claimed-ticket handling: a parameter id may already have human answers in its thread.

## Tasks

### 1. Create skill file

- [ ] Create `.claude/skills/do-factory-semi-automatic/SKILL.md`.
- [ ] Frontmatter: `name: "project:do-factory-semi-automatic"`, description, `argument-hint: "[ticket-id]"`, `version: 1.0.0`, `last-modified: 2026-06-30`, `allowed-tools: [Read, Bash, Task, Skill]`.

### 2. Skill body (German, mirroring spec + reference style)

- [ ] Intro: autonomous headless engineer; never call `AskUserQuestion`; tickets have a question back-channel.
- [ ] Konfiguration: `APP_BASE_URL` (default `http://localhost:7070`), `Authorization: Bearer $AGENT_API_TOKEN`, one ticket per run.
- [ ] Parameter: numeric arg = ticket id → skip Step 1, load by GET, check `owner`/`status`, then Step 2.
- [ ] **Schritt 0 — Env laden** from `backend/.env` (`set -a; source backend/.env; set +a`), guard `AGENT_API_TOKEN`, exit if empty. Always run first, even with id param. (Satisfies user requirement: load env before any API call.)
- [ ] **Schritt 1 — Claim:** `GET /api/tickets/next` (optional `?type=`). 200 → parse `id,title,body,comments`. 204 → "Keine Tickets bereit für AI." + exit. Other → error + exit. Id-param branch: `GET /api/tickets/<id>`; if `owner!=AI` or `status!=TODO` → message + exit; else `POST /:id/start`, 200 → Step 2, else error + exit; 404 → not found + exit.
- [ ] **Schritt 2 — Thread lesen:** `comments` oldest-first; newest `HUMAN` comments authoritative; don't re-ask answered questions.
- [ ] **Schritt 3 — Beurteilen via `requirements-reviewer`** (Task tool): pass `title`, `body`, `comments` thread. Judge single clear change / all facts present incl. thread answers / fits CRM codebase / obvious approach. Also check against real code — if described problem doesn't exist, ask. Verdict: "gut genug zum Bauen" or "fragen" with the open decision point. Follow verdict without deviation.
- [ ] **Schritt 3a — Fragen:** `POST /:id/ask` with one specific decision-ready question (name options). Do NOT reject. Then exit. Do NOT call plan-and-do.
- [ ] **Schritt 3b — Bauen via plan-and-do (unattended):** `/project:plan-and-do "<title+body + resolved HUMAN decisions>"` with the standing pre-authorization block: never call `AskUserQuestion`; PRD skip; plan approval = "Approve, implement, and review" (no PR); approve all review fixes; keep planning files; if a real product decision surfaces mid-build → stop and go to 3a (ask); if tests/build fail unrecoverably → stop and ask (3a) with error details. **No PR, no push.**
- [ ] **Schritt 4 — Done:** Adapt — no PR exists (user requirement). Get `BRANCH=$(git branch --show-current)`. `POST /:id/done` with `{comment}` = short summary + `branch: $BRANCH` (no PR link). Then exit. One ticket per run. Note: agent never resolves "Won't Do" (human-only).

### 3. Verification

- [ ] Frontmatter valid YAML; `allowed-tools` covers Bash, Task, Skill, Read.
- [ ] All endpoints match `docs/API-TICKETS.md` (`/next`, `/:id`, `/:id/start`, `/:id/ask`, `/:id/done`).
- [ ] Every API curl carries `Authorization: Bearer $AGENT_API_TOKEN` and uses `${APP_BASE_URL:-http://localhost:7070}`.
- [ ] Step 0 loads `backend/.env` before any API call; exits when token empty.
- [ ] No-PR / no-push adaptation present in 3b and Step 4.
- [ ] `skill-reviewer` subagent review; auto-fix findings.

## Tests

Test-inappropriate (docs-only skill file). No unit/integration tests. `skill-reviewer` covers correctness: branching coverage, decision points, endpoint accuracy, frontmatter validity, autonomous-checkpoint handling.
