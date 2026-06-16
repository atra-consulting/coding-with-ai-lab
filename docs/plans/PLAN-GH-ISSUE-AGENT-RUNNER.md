# Implementation Plan: GH-ISSUE-AGENT-RUNNER

Source of truth: [`PRD-GH-ISSUE-AGENT-RUNNER.md`](../prds/PRD-GH-ISSUE-AGENT-RUNNER.md)

## Test Command

No app code changes — backend Playwright / frontend Karma do not apply. Verification:

```bash
bash -n scripts/gh-issues-select.sh scripts/gh-issue-status.sh scripts/solve-gh-board-issues.sh
actionlint .github/workflows/agent-issue-runner.yml   # or: shellcheck the scripts if installed
scripts/gh-issues-select.sh                            # read-only smoke test against board #7
```

## Known board facts (verified)

- Org: `atra-consulting`, project number `7`, project id `PVT_kwDODT6lVM4Ba3O3`.
- Status field id `PVTSSF_lADODT6lVM4Ba3O3zhVrw14`, options: `Backlog`, `Ready`, `In progress`,
  `In review`, `Done`.
- Repo `atra-consulting/coding-with-ai-lab`. Labels `Refinement needed` and `Input needed` exist.

## Tasks

### 1. `scripts/gh-issues-select.sh` (selection)

- [ ] `set -euo pipefail`. Require `gh`. Exit non-zero on any API error.
- [ ] **Manual cursor pagination** (do NOT rely on `gh api graphql --paginate` — it does not
  reliably page the deep `organization.projectV2.items` path). Shell `while` loop: each iteration
  runs `gh api graphql -f query=... -F number=7 -F cursor="$CURSOR"`, appends `.nodes`, reads
  `pageInfo.hasNextPage`/`endCursor`, repeats until `hasNextPage == false`. Page size 100.
  Per item fetch: `fieldValueByName(name:"Status"){... on
  ProjectV2ItemFieldSingleSelectValue{name}}`, and `content ... on Issue { number state
  repository{nameWithOwner} labels(first:50){nodes{name}} }`.
- [ ] Client-side filter (jq). **Precedence matters** — the union of branches MUST be parenthesized:
  keep issue when `state=="OPEN"` AND repo is `atra-consulting/coding-with-ai-lab` AND
  `(NOT label 'Input needed')` AND
  `( (has 'Refinement needed' and status != 'Done') or (has-not 'Refinement needed' and status as
  one of ['In progress','In review']) )`. Write the branch union in explicit `( ... or ... )`
  parentheses so the `Input needed` exclusion is not absorbed by `or`.
- [ ] Print matching issue numbers, one per line (sorted, unique). Empty output = no matches.
- [ ] **Pagination test:** verify with page size 1 that the loop fetches >1 page (small boards
  hide off-by-one-page bugs).

### 2. `scripts/gh-issue-status.sh` (status read + write)

Two sub-commands so the prompt can read the board Status (it is NOT in the issue JSON):

- [ ] `gh-issue-status.sh get <issue-number>` → resolve the project item for the issue and print
  its current Status option name (or empty if unset). Read-only.
- [ ] `gh-issue-status.sh set <issue-number> <status-name>` → set the board Status:
  - [ ] `set -euo pipefail`. Validate args; validate status-name against the five options.
  - [ ] Resolve the project **item id** for the issue (query board items, match `content.number`).
  - [ ] Resolve the **single-select option id** for `<status-name>` from the Status field options.
  - [ ] `updateProjectV2ItemFieldValue` mutation with projectId, itemId, fieldId,
    `value:{singleSelectOptionId}`. Exit non-zero on error; print confirmation on success.
    Idempotent: setting `In progress` when already `In progress` is a no-op success.

### 3. `.claude/prompts/agent-gh-board.md` (per-issue prompt)

- [ ] Header: autonomous, headless (`claude -p`), never pause for stdin.
- [ ] Config: repo, `ISSUE_NUMBER` from env, helper script paths, label names, status names.
- [ ] **Step 1 — Fetch context:** `gh issue view $ISSUE_NUMBER --repo ... --json
  number,title,body,labels,state,comments` (full body + ALL comments). Read every comment,
  including the agent's own prior `Input needed` comments (context, not new orders). **Also fetch
  the current board Status** via `scripts/gh-issue-status.sh get $ISSUE_NUMBER` (Status is a
  Projects v2 field, not in the issue JSON). Setting `In progress` later is idempotent, so a
  partially-processed re-run is safe.
- [ ] **Step 2 — Re-entry guard:** check for an open PR that **closes** this issue. Use
  `gh pr list --repo ... --state open --json number,closingIssuesReferences,url` and keep PRs
  whose `closingIssuesReferences` contains `$ISSUE_NUMBER` (exact match — avoids the false
  positives of a free-text body search). If one exists → print `SKIP: open PR exists for
  #$ISSUE_NUMBER` and exit 0.
- [ ] **Step 3 — Decide** doable vs. needs-input (acceptance criteria like `agent-github-issue.md`:
  one clear concrete change, all info present, fits the CRM stack, no human judgement needed).
- [ ] **Step 4 — Needs input:** add `Input needed` label (`gh issue edit --add-label`), post a
  specific comment (`gh issue comment`) naming exactly what is missing, print `PAUSED: #...`,
  exit 0. Do not change Status.
- [ ] **Step 5 — Doable:** set Status `In progress` via `gh-issue-status.sh`, then invoke
  `.claude/skills/plan-and-do/SKILL.md` with the issue body + comments as the description.
- [ ] **Pre-authorized checkpoints** block (verbatim pattern from existing prompts): scope =
  full (implement, test, review, PR, **merge to main**); skip PRD; keep planning files yes;
  every other checkpoint = Continue/recommended.
- [ ] **Merge-conflict instructions:** before merging, rebase/merge latest `main` into the
  branch; auto-resolve unambiguous conflicts and re-run tests; merge only when conflict-free and
  green. Ambiguous conflicts or failing tests after resolution → fall to Step 4 (pause with
  `Input needed` + comment naming the conflicting files), leave branch/PR open.
- [ ] **Step 6 — Success:** after merge, set Status `Done` via `gh-issue-status.sh`, remove
  `Refinement needed` if present, post a short done comment with the PR link, print `SOLVED: #...`.
- [ ] **Step 7 — Cannot finish:** same as Step 4 (pause), leave Status `In progress`.
- [ ] Print exactly one machine-readable result line (`SOLVED:` / `PAUSED:` / `SKIP:`) for the
  workflow to tally.

### 4. `.github/workflows/agent-issue-runner.yml` (orchestration)

- [ ] Header comment block (reference/demo, required secrets) mirroring `agent-task-runner.yml`.
- [ ] Triggers: `repository_dispatch: types: [solve-github-issues]`, `workflow_dispatch`,
  `schedule: '0 3 * * *'`.
- [ ] `concurrency: { group: agent-issue-runner, cancel-in-progress: false }`.
- [ ] **Job-level env** so every step and the `gh` calls inside the `claude` subprocess inherit it:
  `CRON_RUN_ID: ${{ github.event.client_payload.cronRunId }}` and
  `GH_TOKEN: ${{ secrets.GH_PROJECT_TOKEN }}` (the prompt's `gh issue edit/comment/pr list` and the
  status script all need it — the default Actions token cannot write org Projects v2).
- [ ] Steps: checkout → setup-node (`.nvmrc`, npm cache) → `npm ci` (backend, for parity/tools) →
  install `@anthropic-ai/claude-code` (global).
- [ ] **Drain step** (`id: drain`), env adds `ANTHROPIC_API_KEY: ${{ secrets.ANTHROPIC_API_KEY }}`
  and `MAX_ISSUES_PER_RUN: '10'`. Use `set -uo pipefail` (NOT `-e` — one bad issue must not abort
  the run):
  - `ISSUES=$(scripts/gh-issues-select.sh)`; count them; `RUN_STATUS=SUCCESS`.
  - Loop first `MAX_ISSUES_PER_RUN` numbers. For each, wrap so a failure continues to the next:
    `OUTPUT=$(ISSUE_NUMBER=$n claude -p "$(cat .claude/prompts/agent-gh-board.md)"
    --dangerously-skip-permissions 2>&1) || { echo "$OUTPUT"; RUN_STATUS=FAILED; continue; }`.
    Tally by grepping the one result line: `SOLVED:`→solved++, `PAUSED:`→paused++, `SKIP:`→skipped++.
  - Log deferred count if total > cap (no silent truncation). Write
    `solved`/`paused`/`skipped`/`deferred`/`run_status` to `$GITHUB_OUTPUT` and echo a summary line.
- [ ] **Callback step** `if: ${{ always() && env.CRON_RUN_ID != '' }}` — POST to
  `/api/cron/runs/<id>/complete` (best-effort, only when dispatched). Reuse the original contract:
  map `tasksSolved=solved`, `tasksRejected=paused` (skipped/deferred are log-only). Needs
  `AGENT_API_TOKEN` + `APP_BASE_URL` secrets, same as the original callback.

### 5. `scripts/solve-gh-board-issues.sh` (local test wrapper)

- [ ] `set -uo pipefail` (NOT `-e` — same reason as the drain loop: per-issue failures must not
  abort). Replicate the drain loop locally: select → loop → run prompt per issue with the same
  `|| { ...; continue; }` wrapper. Honour `MAX_ISSUES_PER_RUN`. Print the same summary. Requires
  `GH_TOKEN` + `ANTHROPIC_API_KEY` in the local env. For dev testing without CI.

### 6. Documentation

- [ ] CLAUDE.md "Autonomous Task Sources" area: add a short note on the GitHub-issue runner
  (new workflow, prompt, scripts, `GH_PROJECT_TOKEN` secret).
- [ ] `docs/WORKSHOP-AUTONOMOUS-TASKS.md`: add a section — board #7 selection rules, the
  `Input needed` pause/resume protocol (human must reply **and remove the label**), and the
  `GH_PROJECT_TOKEN` SSO requirement. (Handled in Step 12 of the workflow.)

## Verification steps

- [ ] `bash -n` clean on all three scripts.
- [ ] `actionlint` clean on the workflow (shellcheck the embedded run-block if available).
- [ ] `scripts/gh-issues-select.sh` returns a plausible, correctly-filtered set against board #7
  (read-only; spot-check one Refinement-needed and one In-progress issue).
- [ ] Dry-run `gh-issue-status.sh` against a throwaway test issue, then revert it.

## Tests (what each verification proves)

- **Selection correctness:** an issue labeled `Input needed` never appears; a `Done` issue never
  appears; Branch A and Branch B issues both appear; a `Refinement needed`+`Done` issue is excluded.
- **Status write:** `gh-issue-status.sh <n> "In progress"` flips the board cell and is idempotent.
- **Prompt result protocol:** each invocation prints exactly one `SOLVED:`/`PAUSED:`/`SKIP:` line.
- **Workflow parse:** `actionlint` confirms triggers, concurrency, and step wiring are valid.

## Out of scope (per PRD)

- Vercel cron endpoint change to fire `solve-github-issues`.
- Any change to `agent-task-runner.yml` or the app `agent_task` API.
