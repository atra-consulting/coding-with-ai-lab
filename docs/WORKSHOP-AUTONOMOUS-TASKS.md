# Workshop Guide — Autonomous Task Sources

How to run, reset, and clean up the "Claude Code for Advanced Users" autonomous-tasks demo on your Mac, without GitHub Actions.

The four data sources (customer emails, GitHub issues, application logs, error reports) are stored as `agent_task` rows. Each source has **2 doable** tasks (Claude solves them) and **2 reject** tasks (Claude rejects them with a comment). The lifecycle is `OPEN → IN_PROGRESS → DONE | REJECTED`.

---

## 1. One-time setup

1. Pick a shared secret and put it in `backend/.env`:

   ```
   AGENT_API_TOKEN=test-secret-123
   ```

   `.env` is gitignored. The backend auto-loads `backend/.env` on startup (a real exported env var, e.g. in CI, always wins over the file). The agent API returns `401` for every call when this var is unset.

2. Make sure Claude Code can reach the Anthropic API (for the `claude -p` runs):

   ```bash
   export ANTHROPIC_API_KEY=sk-ant-...
   ```

3. Start the app with fresh seed data:

   ```bash
   ./start.sh --reset-db
   ```

   Backend on `http://localhost:7070`, frontend on `http://localhost:7200`. This loads all 16 agent tasks.

---

## 2. See the tasks (admin dashboard)

1. Open `http://localhost:7200` and log in as `admin` / `admin123` (or `demo` / `demo1234`).
2. Click **Agent-Aufgaben** in the sidebar (Administration section — admins only).
3. You see four cards (one per source) with OPEN / IN_PROGRESS / DONE / REJECTED counts. Click a card to drill into the task list, click a row to see the full task detail (body, metadata, comment, timestamps).

---

## 3. Test the API by hand (curl)

```bash
TOKEN=test-secret-123
BASE=http://localhost:7070

# Fetch + claim the next EMAIL task (status flips to IN_PROGRESS):
curl -s -H "Authorization: Bearer $TOKEN" "$BASE/api/agent-tasks/next?source=EMAIL" | jq .

# Reject a task (comment is mandatory; missing comment => 400):
curl -s -X POST -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d '{"comment":"Too vague to implement"}' "$BASE/api/agent-tasks/<id>/reject" | jq .

# Mark a task done:
curl -s -X POST -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d '{"comment":"Implemented in PR #123"}' "$BASE/api/agent-tasks/<id>/done" | jq .
```

Refresh the dashboard to watch the counts change.

---

## 4. Let Claude solve / reject ONE task

Run a single source's prompt headless. Claude fetches the next task, decides accept or reject, and acts:

```bash
export AGENT_API_TOKEN=test-secret-123
export APP_BASE_URL=http://localhost:7070
claude -p "$(cat .claude/prompts/agent-email.md)" --dangerously-skip-permissions
```

- A **doable** task → Claude runs the `plan-and-do` skill, creates a branch + PR, merges, then calls the done API.
- A **reject** task → Claude calls the reject API with a comment and stops.

Swap in `agent-github-issue.md`, `agent-app-log.md`, or `agent-error-report.md` for the other sources.

> `--dangerously-skip-permissions` lets the headless run execute curl + git + the plan-and-do steps without interactive permission prompts. Only use it on this demo repo.

---

## 5. Solve ALL tasks in one go

Use the helper script. It walks every source and keeps running that source's prompt until `/next` returns `204` (queue empty):

```bash
export AGENT_API_TOKEN=test-secret-123
export APP_BASE_URL=http://localhost:7070
export ANTHROPIC_API_KEY=sk-ant-...
./scripts/solve-all-agent-tasks.sh
```

Expected outcome across all four sources: **8 tasks solved (DONE) and 8 rejected (REJECTED)** — 2 + 2 per source. Each solved task produces its own branch/PR/merge. Watch the dashboard counts move to all DONE/REJECTED.

The script is sequential on purpose (each solved task touches git). Re-run a single source instead if you only want part of the demo.

---

## 6. Reset between runs

You will run this demo repeatedly. Two ways to re-arm the tasks:

- **Admin button (fastest):** On the dashboard summary, click **Alle Aufgaben zurücksetzen**. This sets every task back to `OPEN` and clears comments, `pickedUpAt`, and `resolvedAt`. No restart needed.

- **API equivalent:**

  ```bash
  curl -s -X POST -H "Authorization: Bearer $TOKEN" "$BASE/api/agent-tasks/reset" | jq .
  # => { "reset": 16 }
  ```

- **Full DB reset:** `./start.sh --reset-db` recreates the database and reloads the seed fixture from scratch.

The reset only re-arms the **tasks**. The code changes Claude made (branches, commits, merges to `main`) are NOT undone by a reset — see the next section.

---

## 7. Remove the task-solution Git commits after a run

When Claude solves doable tasks it creates branches, PRs, and merges into `main`. To return the repo to a clean state before the next workshop, undo that work.

> ⚠️ These commands rewrite history. Do them only on a **demo repo / demo fork** you control — never on a shared production repository.

### 7a. Tag a baseline BEFORE the workshop (do this first)

```bash
git checkout main
git pull
git tag workshop-baseline       # marks the clean starting point
git push origin workshop-baseline
```

### 7b. After the workshop — list what Claude created

```bash
# Branches the autonomous runs created (plan-and-do uses lowercase task-key prefixes):
git branch --all | grep -vE 'main|autonomous-task-sources-workshop'

# Commits added to main since the baseline:
git log --oneline workshop-baseline..main
```

### 7c. Reset main back to the baseline (clean slate)

```bash
git checkout main
git reset --hard workshop-baseline
git push --force-with-lease origin main      # demo remote ONLY
```

Delete the leftover agent branches (local + remote):

```bash
# Local:
git branch | grep -vE 'main|\*' | xargs -r git branch -D
# Remote (review the list first!):
git branch -r | grep 'origin/' | grep -vE 'origin/main|origin/HEAD' \
  | sed 's#origin/##' | xargs -r -I{} git push origin --delete {}
```

Close any open PRs the runs created:

```bash
gh pr list --state open --json number -q '.[].number' | xargs -r -I{} gh pr close {}
```

### 7d. Safer alternative — revert instead of reset

If you cannot force-push, revert each merge commit instead (keeps history, adds undo commits):

```bash
# For each merge SHA from `git log --oneline workshop-baseline..main`:
git revert -m 1 <merge-sha>
git push origin main
```

---

## 8. Wiring it to GitHub Actions (later)

`.github/workflows/agent-task-runner.yml` is a reference workflow. It runs the same per-source prompt in CI. It needs three repository secrets — `AGENT_API_TOKEN`, `APP_BASE_URL` (your deployed app), `ANTHROPIC_API_KEY` — and will fail fast without them. Trigger it manually via **Run workflow** and pick a source, or leave the daily schedule.

## 9. Variant — solving REAL GitHub issues from the project board

A second runner works **real GitHub issues** on org Project board #7 instead of the `agent_task` table. Same idea (decide, run plan-and-do, merge to main), but the queue is your actual backlog and unanswerable issues pause for a human.

**Selection** (`scripts/gh-issues-select.sh`) — an OPEN issue in this repo is picked when **either**:
- it has label **`Refinement needed`** and board Status is **not** `Done`, or
- it has **no** `Refinement needed` and board Status is `In progress` or `In review`.

Any issue labelled **`Input needed`** is skipped (it waits on a human) — in both cases.

**Lifecycle per issue** (`.claude/prompts/agent-gh-board.md`):
1. Solvable → Status `In progress` → plan-and-do (implement, PR, **merge to main**) → Status `Done`, `Refinement needed` removed.
2. Needs a human decision, or a blocker (unfixable test, ambiguous merge conflict) → adds **`Input needed`** + a comment naming exactly what is missing, then stops.
3. **Resume:** a human answers in a comment and **removes the `Input needed` label**. The next run re-reads the whole issue thread (answer included) and continues. Note: the human must remove the label, not just reply.

**Local test:**
```bash
export GH_TOKEN=...           # PAT with project + repo (or: gh auth token)
export ANTHROPIC_API_KEY=...
scripts/gh-issues-select.sh                 # dry-run: see which issues match (read-only)
scripts/gh-issue-status.sh get 70           # read one issue's board Status
scripts/solve-gh-board-issues.sh            # run the whole loop locally (capped at 10/run)
```

**CI** (`.github/workflows/agent-issue-runner.yml`) needs secret **`GH_PROJECT_TOKEN`** — a PAT with `project` + `repo`, owned by an `atra-consulting` org member with write access to project #7 and **SSO-authorized for the org** (the default `GITHUB_TOKEN` cannot write org Projects v2) — plus `ANTHROPIC_API_KEY`. `AGENT_API_TOKEN`/`APP_BASE_URL` are only needed for the optional cron-callback. Trigger via **Run workflow** or leave the daily schedule (03:00 UTC).
