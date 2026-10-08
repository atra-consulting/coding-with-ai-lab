# Plan and Do — Delegation & Model Selection

Reference file for the plan-and-do skill. Read and apply these rules whenever you dispatch a subagent — draft, implementation, review, or fix.

---

## 1. ROLE SPLIT

Two roles. Keep them apart.

**Orchestrator** — the model running this skill. It slices the work, writes the subagent prompts, integrates the results, and verifies them. That is all.

**Workers** — the dispatched subagents. They do the hands-on work: editing, coding, writing, testing.

**When agents are available, the orchestrator does NOT write production files itself.** It delegates. This is the whole point. The most expensive model in the session should not be writing boilerplate.

### Two exceptions only

1. **A slice that failed verification at `opus`.** See the escalation loop in section 8. The orchestrator does that slice itself. Flag it in the summary.
2. **`coding_agents` is empty.** Some projects define only planners and reviewers. Then implementation and fixes go direct. Display: "No coding agents found. Implementing directly." Reviews still delegate.

Nothing else. No "this is quick, I'll just do it."

---

## 2. MODEL LADDER

Three worker tiers. The Task tool takes a `model` parameter. Pass it on every dispatch.

**The rule: pick the lowest tier that can plausibly succeed.** When torn between two tiers, take the lower one. Escalation is cheap. And the failure context sharpens the retry.

| Tier | Use for |
|---|---|
| `haiku` | **Mechanical.** Renames. Boilerplate. Format conversions. Applying a spelled-out diff. Lookups and greps. Updating docs from content you already give it. Repetitive multi-file edits with a clear pattern. |
| `sonnet` | **Standard, well-specified coding.** One component. One endpoint. Tests for known behavior. A bug fix with a known cause. Review of a small diff. |
| `opus` | **Hard slices.** Cross-cutting changes. Debugging with an unknown cause. Architecture-sensitive code. Security-relevant review. |

**For implementation slices (Step 8.1), the default is `sonnet`.** Open a slice at `opus` only when you can name the specific trigger from the table above — cross-cutting, unknown-cause debugging, architecture-sensitive, or security-relevant. "This looks complex" is not a trigger. When you cannot name which one applies, start at `sonnet` and let the escalation loop (section 8) reach `opus` if the attempt actually needs it. `haiku` stays reserved for genuinely mechanical work only — never a fallback for "seems simple."

Two more rules:

- The **orchestrator tier** is whatever model runs this skill. It is never a delegation target. You do not dispatch "to the orchestrator" — the orchestrator just does the work itself in the two cases from section 1.
- **`fable` is never a worker.** Do not pass it as a `model` on any dispatch.

**`be-test-runner` and `fe-test-runner` always run at `haiku`.** The only permitted `sonnet` dispatch in the test-execution path is a re-dispatch when a test report is ambiguous or self-contradictory.

---

## 3. TIERS FOR NON-CODING WORK

Drafts and reviews get tiers too.

**Drafting a PRD or a plan:**
- Complex task → `opus`
- Small task → `sonnet`
- Never `haiku`. A plan written by a mechanical worker is a mechanical plan.

**Reviewing a draft or a diff:**
- One tier below the work being reviewed. A `sonnet` coder gets a `haiku` reviewer. An `opus` coder gets a `sonnet` reviewer.
- Floor of `sonnet` for anything security-relevant or architectural. Never drop those to `haiku`, no matter how small the diff.

---

## 4. AGENT AND MODEL ARE SEPARATE CHOICES

**Agent picks the domain. Model picks the difficulty.**

Pick them independently. A frontend rename is still frontend work — it goes to `fe-coder`. It is also trivial — so it runs on `haiku`.

| Work | Agent | Model |
|---|---|---|
| Mechanical frontend rename | `fe-coder` | `haiku` |
| New backend endpoint | `be-coder` | `sonnet` |
| Cross-cutting DB migration + schema redesign | `db-coder` | `opus` |
| Review a small diff | `be-reviewer` | `haiku` |
| Security-relevant review | `be-reviewer` | `opus` |
| Run a test suite | `be-test-runner` / `fe-test-runner` | `haiku` |
| New Playwright test for known endpoint | `be-test-coder` | `sonnet` |
| Review a straightforward test file | `be-test-reviewer` | `haiku` |
| Fix a shell script bug with known cause | `shell-coder` | `sonnet` |
| Review a security-relevant Python script | `python-reviewer` | `opus` |

**The `model` parameter beats the agent's frontmatter `model:`.** Most agent files pin `model: sonnet`. That pin never blocks you. Pass `model: haiku` for cheap work and `model: opus` for hard work — the parameter wins.

---

## 5. SLICE PROMPT CONTRACT

Subagents share no context. Not with each other. Not with the main conversation. A worker sees only the prompt you write.

So every slice prompt stands alone. State all seven of these:

1. **Exact file paths to touch.** Full paths. No "the auth module".
2. **What to change.** Specific. Not "improve error handling".
3. **Acceptance criteria.** How the worker knows it is done.
4. **Expected output format.** What the worker reports back.
5. **What NOT to touch.** Name the files and areas that stay untouched.
6. **The Commit Scoping Rule and Push Discipline.** `git add [exact paths]`. NEVER `git add -A`, `git add .`, or `git commit -a` — and never `git push`, not even after a successful commit. Put this in every prompt, word for word.
7. **Do not run the project test suite.** Report what you changed; the orchestrator runs the tests.

**Item 7 binds coding slices only.** A `be-test-runner`/`fe-test-runner` dispatch is exempt — running the suite is its entire purpose. Never put item 7 in a test-runner prompt.

A vague prompt burns a whole attempt. Write it once, write it right.

---

## 6. PARALLELISM

**Launch independent slices in a SINGLE message with multiple Task calls.** That is what makes them run at the same time. One Task call per message runs them one after another.

Serialize only when one slice's output feeds another.

**Prefer many small verifiable slices over one big vague slice.** Small slices verify fast, fail cheap, and retry cheap.

---

## 7. VERIFICATION

Never accept a worker's "done" at face value. Workers report success they did not achieve.

**Every coding slice gets at least one verification step.** Cheapest first:

1. **Read the diff.** Free. Always available. Do this at minimum.
2. **Delegate a review slice** to the matching reviewer agent, one tier below the coder.
3. **Run tests or the build.** Only after a parallel group finishes, never per slice.

### Tests do NOT run per slice

`test_command` is usually one command for the whole project. Parallel slices share one working tree. Running the suite per slice would be slow and racy — shared build artifacts, port conflicts, half-written files.

So:

- **Per-slice verification uses option 1 or 2 only.** Never option 3.
- **The suite runs ONCE after a parallel group finishes**, and again at Step 9 as normal.
- **Never two test runs at the same time.**
- A slice with its own scoped test command — a single test file the plan names — may run that instead. Still never in parallel with another test run.

---

## 8. ESCALATION LOOP

**Each tier gets AT MOST TWO attempts.** The first try, then one retry with the concrete failure in the prompt.

1. **Attempt on the chosen tier.** Fails verification → retry once on the SAME tier. Put the concrete failure in the prompt: the error, the wrong output, the review finding.
2. **Retry fails → escalate one tier.** `haiku` → `sonnet`. `sonnet` → `opus`. Re-delegate with the full failure history. The new tier gets its own two attempts.
3. **Both `opus` attempts fail → the orchestrator does the slice itself.** Flag it in the summary.

The arithmetic: a slice starting at `haiku` gets at most 6 worker attempts before the orchestrator steps in. A slice starting at `opus` gets 2.

**Record every escalation in the state file** under `delegation.escalations`: the slice, the from-tier, the to-tier, and the reason.

**A delegated fix is a slice like any other.** A test failure, a review finding, a failed scenario — each one becomes a slice, and each one runs this same loop. No shortcuts for fixes.

---

## 9. CREATE A PLANNER AGENT

A planner agent is optional. This section shows how to build one. Follow it end to end — you need no other file.

### 9a. Why

This repo already has an adapted planner at `.claude/agents/planner.md` — it differs from the generic copy-paste template in § 9c below, since it's adapted to this project's real modules and agent roster. The sections below are the general how-to, kept for reference.

A planner agent writes the planning documents:

- **Step 6.2 (PRD draft):** the planner drafts the PRD.
- **Step 7.3 (plan draft):** the planner drafts the WHOLE plan in one dispatch.

Without a planner, the skill falls back to its normal path: writer agents draft the PRD, coding agents draft the plan in parallel, and the orchestrator merges their output into one document.

**Nothing breaks without a planner.** It is a quality and speed upgrade, not a requirement. One agent writing the whole plan gives a more coherent document and skips the merge step.

The review-and-fix loop after each draft runs either way. A planner does not skip review.

### 9b. Naming rule

The file goes in `.claude/agents/`.

**The `name:` field must end in `-planner`, or be exactly `planner`.** That suffix is what the skill's AGENT DISCOVERY matches.

Good: `planner`, `feature-planner`, `arch-planner`.
Bad: `plan-agent`, `planning`, `planner-agent`. None of them end in `-planner`.

Any other name is invisible to the skill. The file loads, the agent works, and the skill never calls it.

### 9c. Complete copy-paste agent file

Save this as `.claude/agents/planner.md`. It works with zero edits.

````markdown
---
name: planner
description: Drafts specifications (PRDs) and implementation plans. Use when a task needs a written spec or a step-by-step implementation plan before any code gets written. Reads the codebase first, then produces a document. Never writes code.
tools: Read, Grep, Glob, WebSearch, WebFetch
model: sonnet
---

You are a planning agent. You produce documents. You never produce code.

## Your one output

A Markdown document. A specification, or an implementation plan. Nothing else.

You have no Write and no Edit tool. That is on purpose. You cannot touch source files, and you should not want to. Your job ends when the document is good. Someone else builds it.

Every document opens with `## Summary`, containing `### Business Summary` first (2–4 sentences, business audience — no jargon, no file paths, no code), then `### Technical Summary` second (technical audience only — 2-4 sentences for a PRD, 2-5 sentences for a plan). PRD — everything else stays business-readable, except Technical Summary and an optional trailing `## Technical Notes` section, both for technical readers only. Plan — everything else is technical-only; only the Business Summary needs to make sense to a business person.

## Step 1 — Read the codebase first

Never plan against an imagined codebase. Before you write a single line:

- Find the modules the task touches. Use Glob and Grep.
- Read the closest existing example of what the task asks for. If the task adds an endpoint, read an existing endpoint. If it adds a screen, read an existing screen.
- Note the conventions: naming, file layout, test style, error handling, logging.
- Note the frameworks and versions actually in use — not the ones you would pick.

A plan that ignores existing patterns creates work. The implementer has to undo your suggestions before doing the real job.

## Step 2 — Slice the work

Break the task into small task groups. A good group is:

- **Small.** One person, one sitting.
- **Independent.** It does not need another group to finish first — unless you say so.
- **Verifiable.** Someone can check it is done without reading your mind.

Prefer many small groups over few large ones. A vague large group hides the hard part until someone hits it.

## Step 3 — Assign an agent and a model tier

Every task group names the agent that owns it and the model tier it runs on, with a one-line reason.

The model ladder:

- **haiku** — mechanical. Renames, boilerplate, format conversions, applying a spelled-out diff, lookups, repetitive edits with a clear pattern.
- **sonnet** — standard, well-specified coding. One component, one endpoint, tests for known behavior, a bug fix with a known cause.
- **opus** — hard. Cross-cutting changes, debugging with an unknown cause, architecture-sensitive code, security-relevant work.

Pick the lowest tier that can plausibly succeed. When torn between two, take the lower one. Escalation is cheap. Default every task group to `sonnet`. Assign `opus` only when you can name the specific trigger — cross-cutting, unknown-cause debugging, architecture-sensitive, or security-relevant work — never because a task merely sounds hard.

Agent and model are separate choices. The agent picks the domain. The model picks the difficulty. A trivial frontend rename is still `fe-coder` — just on `haiku`.

## Step 4 — Mark parallelism

Say which task groups can run at the same time, and which must wait. Be explicit:

- "Groups 1, 2, and 3 run in parallel."
- "Group 4 waits for group 2 — it needs the new schema."

Guessing costs real time. Say it.

## Step 5 — State acceptance criteria

Every group gets acceptance criteria. Concrete ones. "Error handling improved" is not a criterion. "Returns 404 with a JSON body when the ID does not exist" is.

## Step 6 — Flag unknowns

Never invent an answer. If you do not know which library the project uses for X, or whether an endpoint already exists, or what the expected behavior is on a conflict — say so.

Write unknowns in an `## Open Questions` section at the end. One line each. A flagged unknown is cheap. An invented answer costs a full implementation cycle.

## Output format

Use this exact structure for each task group:

```markdown
### 1. Backend endpoint
**Agent:** be-coder
**Model:** sonnet — new endpoint, pattern already exists in the codebase

- [ ] Add `POST /api/orders` to `OrderController`
- [ ] Validate the request body against `OrderRequest`
- [ ] Return 201 with the created order
```

The `**Agent:**` and `**Model:**` lines sit directly under the heading, above the checkboxes. The `**Model:**` line gives the tier, then an em dash, then the one-line reason.

Every task group gets both lines. That includes the standard "Test Implementation" and "Verification" groups.

## Writing style

Short and brief. Short sentences. Simple words non-native speakers understand. No passive voice. Sentence fragments are fine.

No code samples in the plan beyond a signature or a file path. The plan says what to build, not how to type it.
````

### 9d. What the prompt must cover

Writing your own instead of copying? Cover all eight of these. Miss one and the planner drifts.

- [ ] **Output is a document, never code.** The planner never edits source files.
- [ ] **It reads the codebase first** — conventions, patterns, existing modules.
- [ ] **Plan tasks are small, independent, and verifiable.**
- [ ] **Every task group names an owning agent and a model tier**, with a one-line reason, chosen off the ladder in section 2.
- [ ] **It marks which task groups run in parallel** and which must serialize.
- [ ] **It states acceptance criteria per group.**
- [ ] **It flags unknowns** instead of inventing answers.
- [ ] **Every document opens with `## Summary`: `### Business Summary` first, `### Technical Summary` second.** PRD stays business-readable except Technical Summary and an optional Technical Notes section. Plan is technical-only except its Business Summary.

The task-group format the planner must produce:

```markdown
### 1. Backend endpoint
**Agent:** be-coder
**Model:** sonnet — new endpoint, pattern already exists in the codebase

- [ ] Task items...
```

### 9e. Frontmatter guidance

**`tools:` should be read-only.** `Read`, `Grep`, `Glob`, plus `WebSearch` and `WebFetch` if the planner needs to look things up.

A planner that can Write is a planner that will code instead of plan. Take the tool away and the temptation goes with it.

**`model:` in frontmatter is only a default.** The skill passes an explicit `model` on every dispatch, and that parameter wins. So do not agonize over the frontmatter value. `sonnet` is a fine default.

### 9f. Registration

Add the agent to the project's `CLAUDE.md` `## Agents` table:

```markdown
## Agents

| Agent | Purpose | Type |
|-------|---------|------|
| planner | Draft PRDs and implementation plans, assign agent + model tier per task group | planning |
| be-coder | Node.js / TypeScript backend code | coding |
```

The skill reads that table. An agent file with no table entry stays undiscovered.

### 9g. Verify it works

Run:

```
/plan-and-do doctor
```

Check the discovered-agents list. Your planner appears there.

**If it does not:** check the two things that break it. The `name:` must end in `-planner` or be exactly `planner`. And the agent must have a row in the `## Agents` table in `CLAUDE.md`.

---

## 10. STEP 7.3: PLAN DRAFT/REVIEW/FIX CYCLE

Reference for SKILL.md Step 7.3 (Generate Detailed Plan). SKILL.md reads this section from that step.

**If agents_available:**

1. **Draft — with a planner:** Launch the first `planner_agent` via Task tool. It writes the WHOLE plan in one dispatch. Model: `opus` for a complex task, `sonnet` for a small one. No merge step needed. Skip to 3.
2. **Draft — no planner:** Launch ALL `coding_agents` in parallel via Task tool. Each coder contributes plan tasks for their domain (backend, frontend, database, etc.). Model per coder: match the difficulty of that domain's slice. Then **merge** all outputs into one coherent plan. Resolve overlaps and ensure consistent task ordering. If `coding_agents` is also empty, fall back to the first `writer_agent` (e.g. `ba-writer`); if none qualifies, write the plan directly.
3. **Review:** Apply the **REVIEWER SCOPE FILTER** (`## 14. REVIEWER SCOPE FILTER`) and launch the applicable `review_agents` in parallel via Task tool. Each reviewer checks the plan for completeness, feasibility, missing edge cases, and correct task ordering from their domain perspective. Model: one tier below the draft, floor of `sonnet` for security or architecture.
4. **Fix:** Collect all reviewer findings. Delegate the fixes to the drafting agent — no user prompt needed. Model: same tier as the draft. If reviewers flag missing tasks or wrong ordering, update the plan. Fix directly only when `coding_agents` is empty or `agents_available == false`. Failed fixes run the escalation loop.
5. **Result:** The reviewed and fixed plan becomes the final draft for user approval.

**Record:** log the draft, each reviewer, and the fix in `delegation.assignments` — step "Plan draft" / "Plan review: [agent]" / "Plan fix", agent, model, verification method.

In both paths, provide the PRD (if it exists), user_description, codebase analysis, and the plan structure in `## 11. PLAN STRUCTURE (Step 7.3)` below. Every task group in the output MUST carry `**Agent:**` and `**Model:**` lines.

**Otherwise:** Write directly.

Structure: read `## 11. PLAN STRUCTURE (Step 7.3)` below, and write the plan in exactly that shape.

**Every task group carries `Agent:` and `Model:`** — including Test Implementation and Verification. Pick the agent by domain and the tier by difficulty, per sections 2 and 4 above. The user sees every assignment at the Step 7.5 checkpoint and changes any of them via the Edit choice.

In direct mode, write `**Agent:** direct` and `**Model:** n/a` so the format stays consistent.

---

## 11. PLAN STRUCTURE (Step 7.3)

```markdown
# Implementation Plan: [task_key]

## Summary
### Business Summary
[2-4 sentences, business audience: what this plan accomplishes and why it matters. No jargon, no file paths, no code.]

### Technical Summary
[2-5 sentences, technical audience: what gets built or changed, the shape of the approach, the main risk or constraint.]

## Test Command
`[test_command]`

## Tasks
### 1. [Category]
**Agent:** [agent name]
**Model:** [tier] — [one-line reason]

- [ ] Task items with specific details

### 2. Test Implementation
**Agent:** [agent name]
**Model:** [tier] — [one-line reason]

- [ ] Test cases

### 3. Verification
**Agent:** [agent name]
**Model:** [tier] — [one-line reason]

- [ ] Run tests, check formatting

## Tests
### Unit Tests / Integration Tests / Edge Cases
- [ ] Specific test cases with what they verify
```

The `**Agent:**` and `**Model:**` lines are the whole point. Step 8.1 reads them and dispatches accordingly. Without them Step 8.1 falls back to choosing per task group — it still works, just without user review of the tier choices.

In direct mode, write `**Agent:** direct` and `**Model:** n/a` so the format stays consistent.

Audience rule: apart from the Business Summary, nothing else in the plan needs to make sense to a business person.

---

## 12. AGENT DISCOVERY

Read project's CLAUDE.md for `## Agents` section.

**If found:** Parse each row's `name` and classify. Rules are **order-sensitive** — stop at the first match:

0. Name starts with `python-`, `shell-`, or `skill-` → tooling agent (general, not CRM domain). Classify by suffix:
   - ends with `-reviewer` → `tooling_review_agents` (e.g., `python-reviewer`, `shell-reviewer`, `skill-reviewer`)
   - else (ends with `-coder`) → `tooling_coding_agents` (e.g., `python-coder`, `shell-coder`, `skill-coder`)
   Dispatch tooling agents ONLY when the changed files are tooling files (`.py`, `.sh`/`.bash`, or files under `.claude/`). Never dispatch them for CRM domain files.
   Model: tooling coders (`python-coder`/`shell-coder`/`skill-coder`) default `sonnet`, `haiku` for mechanical edits, `opus` needs a named trigger. Tooling reviewers (`python-reviewer`/`shell-reviewer`/`skill-reviewer`) run one tier below the coder they're reviewing, floor `sonnet` for security- or portability-critical work.
1. Contains `-test-coder` → `test_coding_agents` (e.g., `be-test-coder`, `fe-test-coder`)
2. Contains `-test-reviewer` → `test_review_agents` (e.g., `be-test-reviewer`, `fe-test-reviewer`)
3. Contains `-test-runner` or ends with `-tester` → `test_runner_agents` (e.g., `be-test-runner`, `fe-test-runner`)
4. Ends with `-writer` or `-analyst` → `writer_agents` (e.g., `ba-writer`)
5. Ends with `-coder` or `-designer` → `coding_agents` (e.g., `be-coder`, `fe-coder`, `ui-designer`)
6. Ends with `-reviewer` → `review_agents` (e.g., `be-reviewer`, `fe-reviewer`)
7. Names ending `-planner`, or exactly `planner` → `planner_agents` (e.g., `planner`, `feature-planner`)
8. Anything else (e.g., `admin`) → skip as utility. Still directly dispatchable by name for ad hoc tasks — "skip as utility" only means it is excluded from the categorized dispatch lists below.

Note: rule 0 (tooling-agent prefix match — `python-*` / `shell-*` / `skill-*`) still runs first and would catch a hypothetical `skill-planner`-style name before this rule reaches it — this precedence is intentional, not a bug.

The order matters: `be-test-coder` must hit rule 1, NOT rule 5. Always check for `-test-` first. Rule 0 runs before all others.

Display all nine lists in one block (six standard, the planner list, plus the two tooling lists), then set `agents_available = true` if any list is non-empty.

**If not found:** Display: "No agents found. Running in direct mode." Set `agents_available = false`.

**Frontmatter `model:` is a default, not a lock.** An agent file's `model:` line only says what it runs on when nobody passes a tier. The Task tool's `model` parameter beats it. A `sonnet`-pinned agent still runs on `haiku` for mechanical work. Never let pinned frontmatter drive the tier — pick the tier from the work, per section 4.

**`planner_agents` is optional.** When a planner exists, it drafts the PRD (Step 6.2) and the whole plan (Step 7.3). When none exists, writer and coding agents do that work as before. Nothing else in the workflow changes.

**Empty `coding_agents`.** Display: "No coding agents found. Implementing directly." Implementation and all fixes then run in direct mode. Reviews still delegate.

---

## 13. DISPATCH NARRATION RULE

**Before EVERY `Task` tool call**, output ONE line:
```
→ Launching <agent_name>: <one-sentence purpose>
```

**When dispatching multiple agents in parallel**, output one line per agent BEFORE the parallel batch:
```
→ Launching be-reviewer, fe-reviewer, db-reviewer in parallel: review phase 1 output.
```

This keeps the user informed about which agents do what work, without breaking the parallel execution.

---

## 14. REVIEWER SCOPE FILTER

When launching `review_agents` (Steps 6.2, 7.3, 8.1), do NOT launch every reviewer every time. Filter by domain match against the work being reviewed:

- Files under `backend/` or backend keywords (route, service, middleware, schema) → include `be-reviewer`
- Files under `frontend/` or frontend keywords (component, template, route, form) → include `fe-reviewer`
- Schema/SQL/Drizzle/migration changes → include `db-reviewer`
- Visual/CSS/SCSS/template changes → include `ui-reviewer`
- PRDs, plans, or pure spec text → include `ba-reviewer`
- `**/*.py` changed → include `python-reviewer`
- `**/*.sh` or `**/*.bash` changed → include `shell-reviewer`
- Files under `.claude/**` (skills, agents, prompts) → include `skill-reviewer`

Always include at least one reviewer. If unsure, default to `be-reviewer` and `fe-reviewer`.

---

## 15. FILE PATH → AGENT MAP (Step 8.1)

Reference for SKILL.md Step 8.1 (Execute Plan). Map changed file paths to the coding agent that owns them. Override only when CLAUDE.md says otherwise.

| File pattern | Agent |
|--------------|-------|
| `backend/src/routes/**`, `backend/src/services/**`, `backend/src/middleware/**`, `backend/src/app.ts`, `backend/src/utils/**` | `be-coder` |
| `backend/src/db/**`, `backend/src/config/migrate.ts`, `backend/src/config/db.ts`, `backend/src/seed/**` | `db-coder` |
| `frontend/src/app/features/**`, `frontend/src/app/core/**`, `frontend/src/app/app.*` | `fe-coder` |
| `frontend/src/styles.scss`, `*.scss`, visual/template-only changes | `ui-designer` |
| `**/*.py` | `python-coder` |
| `**/*.sh`, `**/*.bash` | `shell-coder` |
| `.claude/**` (skills, agents, prompts, settings) | `skill-coder` |
| Anything else (config, scripts, docs) | nearest match by domain, else direct mode |
