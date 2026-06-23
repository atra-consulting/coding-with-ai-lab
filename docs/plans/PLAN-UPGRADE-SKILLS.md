# Implementation Plan: UPGRADE-SKILLS

Port applicable advanced features from `~/Downloads/Archiv-Skills` (FONL/Allianz lineage,
plan-and-do v4.14 / review v5.9) into the local project skills (plan-and-do v1.9 / review v1.7).
Environment-specific features (Jira, Figma, GitHub Enterprise, Jenkins, Teams, `fonl-patterns/`)
are deliberately excluded. All ports are adapted to this project's conventions: Node/Angular,
`gh` CLI for GitHub, PRD-footer commit rule, existing agent roster.

## Test Command

`cd backend && npx playwright test` (backend) / `cd frontend && npx ng test` (frontend).

**N/A for this task** — it edits only Markdown skill files. No app code changes, so app tests
do not exercise the change. Verification = `skill-reviewer` agent review of both edited skills
plus a structural self-check (version bump, internal cross-references intact, no broken step
references).

## Tasks

### 1. plan-and-do/SKILL.md — git & PR handling

- [ ] **Pull latest before branching.** Add a sub-step in STEP 2 (git detection): after confirming
      `is_git_repo`, `git fetch origin`, check `git rev-list HEAD..@{u} --count`; if > 0 run
      `git pull` (warn-and-continue on failure); else "Already up-to-date." Guard the whole block
      on `is_git_repo` and on an upstream existing.
- [ ] **Keep-vs-create branch (Step 4.4).** When NOT on main/master (existing feature branch),
      call `AskUserQuestion`: 1-Keep this branch (recommended), 2-Create new branch, 3-Quit.
      Keep → `branch_name = original_branch`, skip creation. On main/master → keep current
      auto-create behavior (never ask). Update Branch Protection note to reflect the new option.
- [ ] **Early existing-PR detection (new Step 4.4b).** After branch setup, detect an open PR for
      the branch via `gh pr list --head [branch_name] --state open --json number,title,url`.
      Set `pr_exists` / `pr_url`, display when found. Add `pr_exists` to the state `config` block
      (Step 3.3 JSON) and persist in Step 4.5.
- [ ] **Auto-derive PR prefix (Step 7.5, Option 3 path + Step 13).** Derive `pr_prefix`
      (`feat:`/`fix:`/`chore:`) from commit history on the branch
      (`git log [original_branch]..HEAD --oneline`, majority of feat/fix/chore/docs, docs→chore,
      default feat). Store as `config.pr_prefix`. Use it for the PR title in the post-completion
      workflow. Never ask the user.

### 2. plan-and-do/SKILL.md — plan-approval flexibility & wording

- [ ] **"Create PRD first" option at plan approval (Step 7.5).** When `prd_skipped = true`, add a
      checkpoint option that discards the draft plan, sets `prd_skipped = false`, runs STEP 6
      (PRD), then re-runs STEP 7 with the PRD as input. Omit this option when `prd_skipped = false`.
- [ ] **Stronger execution-discipline wording.** In the "CRITICAL — MANDATORY WORKFLOW" block, add
      that questions are tasks, not investigations — never start reading source / searching /
      analyzing before Step 8, even when the input is phrased as a question.
- [ ] **No CHANGELOG.** (Explicitly excluded by user.)
- [ ] **Version bump** `1.9.0 → 1.10.0`, `last-modified` → `2026-06-22`, in both the frontmatter
      and the SKILL HEADER block.

### 3. plan-and-do/plan-and-do-modes.md — post-completion PR title + PR detection

- [ ] **Use `pr_prefix` in the PR title** (PC.2 "Push and create pull request"): title becomes
      `[pr_prefix] [brief title]. [task_key]` when `pr_prefix` is set; keep current behavior as
      fallback. Add an existing-PR check before `gh pr create` (update vs create), mirroring the
      early detection.
- [ ] **Restore `pr_exists` / `pr_prefix`** in the STEP RESUME ROUTER variable-restore note.
- [ ] Update help text in modes.md if any new flags/behaviors need documenting (keep concise).

### 4. review/SKILL.md — multi-round loop

- [ ] **Variable `max_rounds`.** In Step 5.0, set `max_rounds = 3` when `fix_agents_available`,
      else `1` (rationale comment: the loop only helps when fixes happen between rounds). Today it
      is hardcoded `1`.
- [ ] **Loop wiring.** Confirm Step 5.1 → 5.4 already increments `current_round` and loops back to
      Step 5.1 while `current_round <= max_rounds`; for rounds 2+ instruct reviewers to "Focus on
      fix correctness, regressions, and remaining issues." Clean round ends the loop early.

### 5. review/SKILL.md — findings-approval checkpoint + richer table

- [ ] **Findings-approval checkpoint (new Step 5.2.5).** After fix planning (5.2) and before plan
      review/execute, display the findings table incl. proposed fixes and call `AskUserQuestion`:
      1-Approve all, 2-Approve some (specify which to skip), 3-Skip all this round. Skip the
      checkpoint when no fix agents or zero findings. Honor "User Autonomy" by scoping the prompt
      to this single genuine decision. Mark skipped findings so they are recorded but not fixed.
- [ ] **Richer findings table.** Add `proposed_fix` / `proposed_fix_by` to the per-finding record
      (Step 5.0 / 5.1.3) and to the review-file table (Phase 6.2): columns
      `# | Severity | File | Issue | Found by | Proposed Fix | Fix by | Applied | Applied by`.
      Use "—" for unfixed, "skipped" when the user declined.
- [ ] **Version bump** `1.7.0 → 1.8.0`, `last-modified` → `2026-06-22`, in frontmatter, PHASE 0
      header, and the Phase 6 "Generated with" footer line.

### 6. Verification

- [ ] Launch `skill-reviewer` on both edited skills (and the modes file) — branching logic,
      checkpoint correctness, internal cross-references, version consistency.
- [ ] Auto-fix review findings, commit.
- [ ] Self-check: every referenced step number exists; state JSON shape consistent between
      SKILL.md and modes.md; no dangling references to excluded features.

## Tests

### Structural / review checks (no app tests apply)
- [ ] `skill-reviewer` reports no critical issues on plan-and-do/SKILL.md.
- [ ] `skill-reviewer` reports no critical issues on review/SKILL.md.
- [ ] `skill-reviewer` reports no critical issues on plan-and-do-modes.md.
- [ ] Version numbers consistent across frontmatter + header + footer in each skill.
- [ ] New checkpoints all use `AskUserQuestion` (no prose prompts / stdin reads).
- [ ] `max_rounds` logic: 3 with fix agents, 1 without; loop terminates on clean round.
- [ ] No new reference to Jira / Figma / GHE / Jenkins / Teams / fonl-patterns introduced.

## Commits (each with no PRD footer — PRD skipped)
1. `feat: Add git pull, keep-vs-create branch, early PR detection, PR-prefix to plan-and-do. UPGRADE-SKILLS`
2. `feat: Add create-PRD-first option and stronger execution discipline to plan-and-do. UPGRADE-SKILLS`
3. `feat: Use PR prefix and detect existing PR in plan-and-do post-completion. UPGRADE-SKILLS`
4. `feat: Add 3-round review loop, findings-approval checkpoint, richer table to review. UPGRADE-SKILLS`
5. `fix: Address skill-review findings. UPGRADE-SKILLS` (if any)
