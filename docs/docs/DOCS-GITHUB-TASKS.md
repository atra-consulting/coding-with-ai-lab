# How to Use the GitHub Issue Agent Runner

The GitHub Issue Agent Runner is a second autonomous runner (sibling of
`agent-task-runner.yml`). Its task source is **real GitHub issues on org Project board
#7**, not the app's `agent_task` table. For each selected issue, Claude Code decides
solve-or-pause, runs `/plan-and-do` headless (implement → PR → **merge to main**), and
pauses unanswerable issues for a human.

- Workflow: `.github/workflows/agent-issue-runner.yml`
- Prompt: `.claude/prompts/agent-gh-board.md`
- Scripts: `scripts/gh-issues-select.sh`, `scripts/gh-issue-status.sh`, `scripts/solve-gh-board-issues.sh`
- Spec: [`PRD-GH-ISSUE-AGENT-RUNNER.md`](../prds/PRD-GH-ISSUE-AGENT-RUNNER.md)

## 1. One-time setup (before it does anything real)

Add the repository secret (Settings → Secrets and variables → Actions):

- **`GH_PROJECT_TOKEN`** — a PAT with `project` + `repo` scopes, owned by an
  `atra-consulting` org member with write access to project #7, and **SSO-authorized for
  the org**. The default `GITHUB_TOKEN` cannot write org Projects v2 — this is the one
  secret it won't run without.
- **`ANTHROPIC_API_KEY`** — already present if the other runner works.
- `AGENT_API_TOKEN` / `APP_BASE_URL` — only if you want the optional cron-callback; skip
  otherwise.

Make sure issues are on board #7 with the right label/status (see selection rules below).

## 2. Mark an issue for the agent

The runner picks up an **OPEN** issue in `coding-with-ai-lab` when **either**:

- it has label **`Refinement needed`** and Status is **not** `Done`, or
- it has **no** `Refinement needed` and Status is **`In progress`** or **`In review`**.

Any issue labelled **`Input needed`** is skipped until a human clears it. So: to hand the
agent a task, add **`Refinement needed`** to the issue and put it on the board.

## 3. Run it

**From GitHub** (Actions tab → *Agent Issue Runner*):

- Click **Run workflow** for an immediate run, or
- Leave the **daily schedule** (03:00 UTC), or
- Fire a `repository_dispatch` of type `solve-github-issues` from your cron.

**Locally** (good for testing first):

```bash
export GH_TOKEN=$(gh auth token)      # needs project + repo scope
export ANTHROPIC_API_KEY=...

scripts/gh-issues-select.sh           # DRY RUN: which issues match? (read-only, safe)
scripts/gh-issue-status.sh get 70     # read one issue's board Status
scripts/solve-gh-board-issues.sh      # run the full loop (capped 10/run)
```

Start with `gh-issues-select.sh` alone — it only reads, so you can confirm the selection
before letting Claude touch anything.

## 4. What happens to each issue

- **Solvable** → Status → `In progress` → `/plan-and-do` implements, opens a PR,
  **merges to main** → Status → `Done`, `Refinement needed` removed.
- **Needs a decision** (vague, missing info, ambiguous merge conflict, unfixable test) →
  agent adds **`Input needed`** + a comment naming exactly what it needs, then stops.

## 5. Answer a paused issue (the resume loop)

When you see `Input needed`:

1. Reply in a **comment** with the answer.
2. **Remove the `Input needed` label.** ← this is the part people forget; a reply alone
   won't un-stick it.

The next run re-reads the entire thread (your answer included) and continues from scratch.

## 6. Safety notes

- The prompt runs `claude -p --dangerously-skip-permissions` (required for headless
  autonomy, same as the reference runner). Use a least-scoped `GH_PROJECT_TOKEN`; ideally
  run in a sandbox.
- The runner processes at most `MAX_ISSUES_PER_RUN` issues per run (set to `1` in
  `agent-issue-runner.yml`); the rest are deferred to the next run and logged.
- An issue with an already-open PR is skipped, so a run never opens a duplicate PR.
