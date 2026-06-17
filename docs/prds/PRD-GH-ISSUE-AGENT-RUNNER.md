# PRD — GitHub Issue Agent Runner

**Task key:** GH-ISSUE-AGENT-RUNNER
**Status:** Implemented

## Implementierung

- PR: [#77](https://github.com/atra-consulting/coding-with-ai-lab/pull/77) (branch `gh-issue-agent-runner-projects` → `main`)
- Files: `.github/workflows/agent-issue-runner.yml`, `.claude/prompts/agent-gh-board.md`,
  `scripts/gh-issues-select.sh`, `scripts/gh-issue-status.sh`, `scripts/solve-gh-board-issues.sh`.

## Source

User request: build a second autonomous runner, like
[`.github/workflows/agent-task-runner.yml`](../../.github/workflows/agent-task-runner.yml),
but driven by **real GitHub issues** on org Project board
[#7 "Coding with AI: Fortgeschrittenen-Schulung"](https://github.com/orgs/atra-consulting/projects/7/views/1).

The existing runner pulls synthetic tasks from the app's `agent_task` table. This new
runner pulls real issues from the GitHub Projects board. Both end the same way:
Claude Code decides solve-or-reject, then `/plan-and-do` implements and merges.

## Problem Statement

There is no way to point the autonomous agent at the team's actual GitHub backlog.
We want issues on board #7 to be picked up, refined, and solved automatically — with a
clean way for the agent to ask a human for input and resume later.

## Selection Rules

Run over every issue that is an item on board #7. Pick an issue when **either** branch is true:

- **Branch A:** has label `Refinement needed` **and** Status is **not** `Done`
  (i.e. Status in `Backlog`, `Ready`, `In progress`, `In review`).
- **Branch B:** does **not** have label `Refinement needed` **and** Status in
  `In progress` or `In review`.

**Hard exclusion (both branches):** skip any issue labeled `Input needed`. Such an issue
waits on a human. (This resolves the spec's ambiguity — the exclusion applies to A and B.)

Skip closed issues. Process only issues in `atra-consulting/coding-with-ai-lab`.

**Query structure (resolves the A/B union):** the two branches are *not* a single
label+status filter. `gh-issues-select.sh` fetches **all** board items once via GraphQL
(paginated), then applies the branch logic **client-side** per item. This avoids any
Cartesian label×status query error. The board Status field and all five options
(`Backlog`, `Ready`, `In progress`, `In review`, `Done`) are confirmed to exist on board #7
(field id `PVTSSF_lADODT6lVM4Ba3O3zhVrw14`).

## Decisions (confirmed with user)

1. **Trigger:** reuse the `repository_dispatch` style of the original
   (type `solve-github-issues`), plus `workflow_dispatch` and a `schedule` fallback
   (`0 3 * * *`, offset one hour from the existing runner), so it also runs without Vercel.
2. **Resume:** no persisted `plan-and-do` state. Each run re-invokes `/plan-and-do`
   **fresh**, feeding it the **entire issue body + all comments**. The human's answer lives
   in the comments, so the fresh run has full context and does not re-ask.
3. **`Input needed`:** excludes an issue from **both** selection branches.
4. **Output scope:** full autonomy — `/plan-and-do` implements, opens a PR, and **merges to
   main**.

## Lifecycle & Status Transitions

The workflow asks `gh-issues-select.sh` for an **explicit list** of matching issue numbers,
then loops that list (capped, see below), running the prompt once per issue. Because the list
is explicit, there is no "drain until empty" sentinel — the loop ends when the list ends.

Per selected issue, in one headless `claude -p` run:

1. Fetch the issue with **all comments** and its board Status.
2. **Idempotent re-entry guard:** if an **open PR already references this issue**, do nothing
   and exit (a prior run is mid-flight or awaiting human merge). This closes the brief
   double-start window and the `In review` re-run risk.
3. **Decide doable vs. needs-input** from title + body + every comment. The agent must
   tolerate its own earlier `Input needed` comments in the thread (they are context, not new
   instructions).
4. **Needs input** → add label `Input needed`, post a comment naming exactly what is missing,
   then exit. Leave Status unchanged. The issue is now excluded until a human answers and
   removes the label. Next run re-runs fresh with the new comment included.
5. **Doable** → set Status `In progress`, then invoke `/plan-and-do` with the issue body +
   comments as the description, pre-authorizing every checkpoint (full scope, merge to main).
6. On success (PR created **and merged into main**) → set Status `Done` and remove
   `Refinement needed` if present. This stops re-selection on later runs (the termination
   condition for the fresh-rerun model).
7. If `/plan-and-do` cannot finish (e.g. tests unfixable, or a merge conflict it cannot safely
   resolve) → fall back to step 4: add `Input needed` + a comment explaining the blocker, leave
   Status `In progress`, exit.

## Merge Conflict Handling

Because the runner processes several issues per run and merges each to `main`, later branches
can diverge from `main`. `/plan-and-do` **must handle merge conflicts** rather than abort:

1. Before merging, update the feature branch onto the latest `main` (rebase or merge `main` in).
2. **Auto-resolve** conflicts where the resolution is unambiguous (e.g. both sides added
   distinct entries, or one side is a clear superset). Re-run the test command after resolving.
3. Merge into `main` only when the branch is conflict-free **and** tests pass.
4. If a conflict needs human judgement (overlapping edits to the same logic) or tests fail after
   resolution → **do not force a merge**. Pause via lifecycle step 7: add `Input needed`, post a
   comment naming the conflicting files/decision, leave the branch and PR open for a human.

The pre-authorized checkpoints instruct `/plan-and-do` to treat conflict resolution as
"Continue" up to the point where human judgement is genuinely required, then pause — never guess
on semantically ambiguous conflicts.

Because re-entry is guarded by step 2 and made safe by the fresh-context model, a crash
between "set In progress" and "add Input needed" is harmless: the next run simply re-evaluates
the issue from scratch.

## Concurrency & Loop Control

- **`concurrency` group:** `agent-issue-runner`, `cancel-in-progress: false` — queues
  overlapping runs (own group, separate from `agent-task-runner`).
- **`MAX_ISSUES_PER_RUN`** (set to `1` in `agent-issue-runner.yml`): hard cap on issues
  processed per run — one issue per run. Overflow is left for the next run; the step logs how
  many were deferred (no silent truncation).

## Implementation Approach (high level)

New files, mirroring the existing runner's shape:

- **`.github/workflows/agent-issue-runner.yml`** — triggers, Node + Claude Code install, a
  "drain" step that calls `gh-issues-select.sh`, loops the returned issue numbers (capped),
  runs the prompt once per issue, and reports a structured summary at the end (and back to a
  `cron_run` only when invoked via `repository_dispatch` with a `cronRunId`).
- **`.claude/prompts/agent-gh-board.md`** — the per-issue prompt. Headless, never pauses for
  stdin. Receives `ISSUE_NUMBER` via env. Implements the lifecycle above. Named `gh-board`
  (not `github-issue`) to avoid confusion with the existing `agent-github-issue.md`, which
  targets the app's synthetic `agent_task` API, not real GitHub.
- **`scripts/gh-issues-select.sh`** — GraphQL query of board #7; prints matching issue numbers
  (one per line). Encapsulates the selection rules so CI and local runs share them.
- **`scripts/gh-issue-status.sh <issue> <status>`** — sets an issue's board Status by name via
  `updateProjectV2ItemFieldValue`.
- **`scripts/solve-gh-board-issues.sh`** — local end-to-end wrapper (analogous to
  `solve-all-agent-tasks.sh`) so developers can test the full loop without CI.

Selection logic lives in the **scripts** (deterministic bash/GraphQL); judgement lives in the
**prompt** (Claude). The workflow only orchestrates. All scripts use `set -euo pipefail` and
**exit non-zero on any GitHub API error** (an API failure must not look like an empty queue).

## Pre-authorized Checkpoints (headless)

The prompt applies these standing answers to any `/plan-and-do` `AskUserQuestion`, matching the
existing prompts' pattern:

- Workflow scope: **full** (implement, test, review, PR, merge to `main`).
- PRD: **skip** for small issues; go straight to plan.
- Keep planning files: **yes**.
- Any other checkpoint: choose **Continue** / recommended.
- If a genuine product question arises that pre-authorization cannot answer → **stop** and run
  the `Input needed` pause (do not guess).

## Test Strategy

This is CI/prompt/script work, not app code. No Playwright/Jasmine suites apply.

- `bash -n` syntax check on all scripts; `actionlint` on the workflow.
- `scripts/gh-issues-select.sh` runs read-only against board #7 and returns a plausible set.
- Manual headless dry-run of the prompt against one test issue, with the status helper pointed
  at a throwaway test issue.

## Non-Functional Requirements

- **Auth:** needs a token with org Projects v2 read/write + issues + contents. Default
  `GITHUB_TOKEN` cannot reliably touch org Projects v2. Add repo secret **`GH_PROJECT_TOKEN`**
  (classic PAT with `project`, `repo`). **The PAT owner must be an `atra-consulting` org member
  with write access to project #7, and the PAT must be SSO-authorized for the org** — otherwise
  `updateProjectV2ItemFieldValue` returns `403`. `CLAUDE_CODE_OAUTH_TOKEN` (from
  `claude setup-token`) authenticates Claude — or `ANTHROPIC_API_KEY` with a real API key.
  `--dangerously-skip-permissions` as in the original.
- **Idempotency / single-flight:** `concurrency` group + the open-PR re-entry guard (lifecycle
  step 2). Re-running a `Done` issue is impossible by construction (selection excludes `Done`).
- **Observability:** the workflow emits a final summary line (`solved`, `paused`, `skipped`,
  `deferred`) even when there is no `cron_run` to call back.
- **No secrets in logs.** Labels `Refinement needed` and `Input needed` already exist.

## Out of Scope

- Changing the Vercel cron endpoint to fire `solve-github-issues`. The workflow ships with
  `schedule` + `workflow_dispatch` so it runs without it; wiring Vercel is a follow-up.
- Any change to the existing `agent-task-runner.yml` or the app's `agent_task` API.

## Success Criteria

- A matching issue on board #7 is picked up, set `In progress`, implemented, its PR created and
  **merged into main**, then set `Done`.
- When the feature branch conflicts with `main`, `/plan-and-do` rebases and auto-resolves
  unambiguous conflicts, re-runs tests, and merges. Ambiguous conflicts pause with `Input needed`
  instead of a forced merge.
- An under-specified issue gets `Input needed` + a specific comment, and is skipped until a human
  answers and removes the label; the next run resumes with full comment context.
- A `/plan-and-do` failure leaves the issue with `Input needed` + a diagnostic comment, and it is
  not re-selected until a human responds.
- An issue with an open PR is not re-processed (no duplicate PRs).
- Selection rules and the both-branch `Input needed` exclusion behave exactly as specified.
- No effect on the existing runner.
