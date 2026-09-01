# Unattended Special Instructions for `/project:plan-and-do`

Reference file for the `do-factory-full` skill. Read this file in Schritt 3a.3, replace `<TICKET_ID>` and
`<TICKET_TITLE>` with the real values, then send the result as the `special-instructions` argument
(second argument) to `/project:plan-and-do`.

This file stays in English on purpose: it addresses `plan-and-do` directly and quotes its own checkpoint
option text verbatim (e.g. "Approve, implement, and review", "Fix findings", "Skip — keep commits local").
A translation would risk breaking that exact match.

Everything from the `---` line down is the literal instruction text.

---

You are running fully unattended, dispatched by `/project:do-factory-full` for ticket #<TICKET_ID>
("<TICKET_TITLE>"). Nobody is present to answer `AskUserQuestion` calls. **Never call `AskUserQuestion`.**
The moment you reach one of the checkpoints below, apply its auto-decision immediately — do not ask, do
not pause, do not wait for input.

## Auto-decisions — one per checkpoint you can reach

**Step 1 — Existing checkpoint scan.**
If a paused or in-progress `STATE-*.json` file already exists for a task_key that happens to match this
run (e.g. left over from an earlier, manually-recovered stuck run) and you would normally ask to Resume /
Start fresh / Quit: always choose **"Start fresh"**. A fresh run is more predictable than resuming unknown
prior state.

**Step 4.4 — Branch check when not starting on `main`/`master`.**
If you are not on `main`/`master` when this run starts and would normally ask "You are on branch
`[original_branch]`... Keep this branch / Create new branch / Quit": always choose **"Create new
branch"**. Never keep an existing branch — it may hold unrelated or stale work.

**Step 5.1 — Specifications (PRD) decision.**
If the task looks complex and you would normally offer the choice "1-Create specifications (PRD) first" /
"2-Skip to detailed plan": always pick **"Skip to detailed plan"**. Go straight to the detailed plan
(Step 7). The ticket owner explicitly asked to skip the PRD and go straight to the plan.

**Step 7.1 — Determine Test Command.**
If no test command is documented in CLAUDE.md or a README and you would normally ask "How do you run
tests? Type your test command:": never wait for input. Always answer with exactly this command:

```
cd backend && npm test && cd ../frontend && npm run test:ci
```

Backend `npm test` runs `playwright test`. Frontend `npm run test:ci` runs `ng test --configuration=ci` —
the non-interactive, headless Karma run. **Never substitute plain `npm test`/`ng test` for the frontend
half** — without `--configuration=ci` it opens a watch-mode browser session that never exits, which would
hang this headless run exactly like an unanswered `AskUserQuestion` would.

**Step 7.5 — Plan Approval checkpoint.**
This checkpoint always fires, no matter how small the task looks. Choose option 2:
**"Approve, implement, and review"** (Steps 8–10: implement, test, code review). Never choose option 1
(implement only, no review) and never choose the "…create PR" / "…update PR" option — no PR is ever
created or updated in this run.

**Step 8.2 / Step 9.2 — Interactive assistance / blocking questions during implementation and testing.**
If a question or ambiguity comes up during implementation (Step 8.2), or test fixes keep failing after
the escalation loop is exhausted and you would normally ask "What should I try next?" (Step 9.2): do NOT
stop to ask either way. Make the most reasonable, most conservative technical choice yourself, note the
choice briefly, and continue.

**Step 10.3 — Code review checkpoint.**
This fires whenever the local review finds issues — including in `implement-review` scope, which (unlike
`full` scope) does not get an automatic first-round fix. Always choose **"Fix findings"**. Delegate the
fixes, re-run the review, and repeat until it is clean, or until it is clear that further automatic
fixing will not help. Never choose "Skip to summary" by asking — just keep fixing.

**Step 13.3 — POST-COMPLETION WORKFLOW (`plan-and-do-modes.md`), checkpoint PC.2.**
This step always runs, for every `workflow_scope` — it is not gated by the Step 7.5 scope choice. PC.2
asks "Push and create pull request / Push only / Skip — keep commits local". Always choose
**"Skip — keep commits local"**. This is the actual mechanism that keeps this run PR-free: no push, no
PR, every commit stays local on the branch.

**PC.4 — Merge pull request.**
Never fires, because PC.2 chose Skip. No action needed here — noted only for completeness.

**PC.5 — Switch back to original branch.**
If `pr_merged` is false and the current branch differs from `original_branch`, this asks "Switch back to
`[original_branch]` / Stay on `[branch_name]`". Always choose **"Switch back to `[original_branch]`"**.

## Summary

No PRD. Implement, test, and review — never a PR. Never block on a question during implementation:
decide yourself and keep going. Never push, never create or update a PR. When done, switch back to the
original branch.
