# Implementation Plan: PORT-SKILLS-SUBAGENTS-DOCS

## Summary

### Business Summary
This project publishes docs that explain its AI-helper roster ("Subagents") and its automation shortcuts ("Skills") to two audiences: conference attendees who want to reuse them, and workshop participants using this app. Those docs currently understate how many helpers and shortcuts exist, and one navigation link points visitors to an old branch instead of the same content already on the main page. This plan fixes the counts and the link so newcomers get accurate, trustworthy information.

### Technical Summary
Revises the prior draft after two reviews and one direct file read confirmed `data-reader` and `data-writer` self-declare as non-domain-bound tooling agents (same bucket as `planner`, `python-*`, `shell-*`, `skill-*`), not new "Planning"/"Research" categories — so Task 1 now folds all three into the existing `docs/SUBAGENTS.md` Tooling table, correcting the domain-bound/tooling split to 17/9 (26 total), which matches `CLAUDE.md`'s already-correct "17". The old idea of changing 17→19 in `CLAUDE.md` is dropped as it would have introduced an error; a new optional task instead adds `data-reader`/`data-writer` to `CLAUDE.md`'s exclusion-clause wording without touching the number 17. Task 2 (`docs/SKILLS.md`) gets a checkable acceptance criterion naming all 8 user-facing argument keywords across the 4 skills. Task 3 (`README.MD`) gets an acceptance criterion that the proposed anchor link must be verified against the file's own existing, working anchor rather than assumed.

## Test Command

None. This is a documentation-only change — nothing under `backend/` or `frontend/` is touched, so no `npm test`, Playwright, or Karma run applies. Verification is the manual/agent-based cross-check defined in the Verification task below.

## Tasks

### 1. Fix docs/SUBAGENTS.md — fold the three missing agents into the existing Tooling table
**Agent:** skill-coder
**Model:** sonnet — multi-section prose edit with a count recomputation, not pure mechanical substitution

- [ ] Line 3: change "Dieses Projekt hat 23 Subagents." to "26 Subagents" — 26 files exist under `.claude/agents/`.
- [ ] In the `### Tooling — allgemein, nicht an die CRM-Domäne gebunden` table, add three rows:
  - `planner` — Zweck: drafts PRDs and implementation plans, assigns agent + model tier per task group, never writes code. Modell: sonnet.
  - `data-reader` — Zweck: gathers facts from files or the web, read-only. Modell: haiku.
  - `data-writer` — Zweck: writes already-finished content to a file at a known path, write-only. Modell: haiku.
- [ ] Do **not** add new `### Planning` or `### Research` headings. Do **not** touch the `### Writing` table (`ba-writer` stays alone there).
- [ ] Update the section's intro sentence (line 75): "Diese sechs Agents kennen die CRM-Specs nicht..." → "Diese neun Agents kennen die CRM-Specs nicht...", keeping the rest of the sentence (root `CLAUDE.md`, `shell-*` reads `SPECS-infrastructure.md` too) accurate for all 9.
- [ ] Update `## Domänengebunden oder allgemein?` (lines 88-89): "18 Agents sind an die CRM-Domäne gebunden" → "17 Agents sind an die CRM-Domäne gebunden"; "6 Tooling-Agents sind allgemein (`python-*`, `shell-*`, `skill-*`)" → "9 Tooling-Agents sind allgemein (`python-*`, `shell-*`, `skill-*`, `planner`, `data-reader`, `data-writer`)".

**Acceptance criteria:**
- 17 + 9 = 26 is what the file states.
- All 26 filenames under `.claude/agents/` appear exactly once, total, across the file's tables.
- No new `###` heading exists in the file beyond what was already there.
- The Tooling table has exactly 9 rows.

### 2. Fix docs/SKILLS.md — document ticket mode and every argument keyword
**Agent:** skill-coder
**Model:** sonnet — needs each of the 4 `SKILL.md` files read to state keyword behavior accurately, not a mechanical find-replace

- [ ] `/plan-and-do` section: update the argument line (line 29) from `["Beschreibung"] [Sonderanweisungen | resume:<schritt>]` to match the skill's real `argument-hint` frontmatter: `"Beschreibung" [Sonderanweisungen | resume:<schritt>] | ticket-url | ticket-number`.
- [ ] Add a short explanation of ticket mode: passing a ticket URL (e.g. `http://localhost:7200/admin/tickets/8`) or a bare ticket number (e.g. `8`) runs the skill against a Kanban ticket instead of a freeform description.
- [ ] Add a dedicated bullet for `resume:<schritt>` — today it only appears inside the argument-format line with no explanation. State plainly: it resumes a paused run at the given step number, and does not apply to ticket-mode input.
- [ ] Split the existing combined "`help` / `doctor`" bullet into two, each with its own one-line explanation: `help` shows usage and exits; `doctor` runs a self-test and exits.
- [ ] `/review` section: add a bullet for `embedded` — brief explanation that it is the mode `plan-and-do` uses when it calls `/review` internally mid-workflow, skipping the header and the initial confirmation prompt.
- [ ] `/update-claude-files` section: extend the existing `embedded` mention to also name and explain `embedded base:<sha>` — scopes the doc-sync run to changes made since that commit.
- [ ] Leave `/write-ticket`'s argument documentation untouched — confirmed already accurate.

**Acceptance criteria:**
- Each of these 8 keywords appears as literal text (in backticks) **and** has its own explanatory sentence, in the section of the skill that actually supports it: `help`, `doctor`, `dryrun`, `base:<ref>`, `resume:<step>`, `embedded`, `embedded base:<sha>`, ticket-url/ticket-number input.
- No keyword appears as a bare word with no explanation next to it.
- The `/plan-and-do` argument-hint line in `docs/SKILLS.md` matches `.claude/skills/plan-and-do/SKILL.md`'s actual `argument-hint` frontmatter value, character for character.

### 3. Fix README.MD — subagent/skill counts and the stale cross-branch pointer
**Agent:** skill-coder
**Model:** sonnet — cross-checks counts against two other docs plus an anchor slug, not pure mechanical substitution

- [ ] Change every "24 Subagents" to "26 Subagents" (lines 149, 154, 248).
- [ ] Change every "6 Skills" / "6 Custom-Skills" to "4 Skills" / "4 Custom-Skills" (lines 149, 155, 249) — 4 skill folders exist under `.claude/skills/`: `plan-and-do`, `review`, `update-claude-files`, `write-ticket`.
- [ ] Replace the line-32 link — "Auf die `solution-jfs-2026`-Branch wechseln" pointing at `https://github.com/atra-consulting/coding-with-ai-lab/blob/solution-jfs-2026/README.MD` — with an in-page anchor link to this same README's own "Für Konferenz-Zuhörer: Skills & Subagents übernehmen" section (that content already lives on `main`, so sending readers to a different branch's copy is stale). Match the sibling bullet's style at line 33 ("Start: [Aufgaben bearbeiten](#für-workshop-teilnehmer-aufgaben-bearbeiten).").
- [ ] Before landing the anchor, verify it matches the real heading's generated slug: the README's own Table of Contents (line 52) already links `[Skills & Subagents übernehmen](#für-konferenz-zuhörer-skills--subagents-übernehmen)` to that exact heading — reuse that proven anchor string verbatim, do not hand-compute a new one.

**Acceptance criteria:**
- No occurrence of "24 Subagents" or "6 Skills"/"6 Custom-Skills" remains anywhere in `README.MD`.
- Line 32's link target starts with `#` (in-page anchor), not `github.com/.../blob/solution-jfs-2026/...`.
- The anchor string used at line 32 is identical, character for character, to the one already used at line 52 for the same heading.

### 4. (Optional, easily dropped) Fix CLAUDE.md's non-domain-bound agent enumeration
**Agent:** skill-coder
**Model:** haiku — spelled-out text addition to an already-identified clause, no new arithmetic

- [ ] `## Agents` section's introductory note (line 42): extend "The `planner`, `python-*`, `shell-*`, and `skill-*` agents are general tooling agents..." to also name `data-reader` and `data-writer`.
- [ ] `DOMAIN.md` row of the "Spec Reading Lists" table (line 50): extend "every agent except `planner` and the `python-*`, `shell-*`, `skill-*` tooling agents" to also name `data-reader` and `data-writer`.
- [ ] Do **not** change the number "17" anywhere in either sentence — it is already correct. Only the list of excluded agent names grows.
- [ ] This task is optional and independently droppable — dropping it does not affect Tasks 1-3.

**Acceptance criteria:**
- Both edited sentences name all 9 non-domain-bound agents, by name or pattern: `planner`, `data-reader`, `data-writer`, `python-*`, `shell-*`, `skill-*`.
- The literal string "17" is unchanged in both places.

**Parallelism:** Tasks 1, 2, 3, and 4 touch different files (`docs/SUBAGENTS.md`, `docs/SKILLS.md`, `README.MD`, `CLAUDE.md` respectively) and run in parallel. None depends on another.

### 5. Verification — cross-check all edited docs against the real agent/skill files
**Agent:** skill-reviewer
**Model:** haiku — mechanical cross-check of counts, filenames, and keyword coverage against source files; no design judgment needed

- [ ] Confirm `docs/SUBAGENTS.md` reads "26 Subagents" (line 3) and that every filename under `.claude/agents/` appears exactly once across its tables.
- [ ] Confirm no `### Planning` or `### Research` heading exists in `docs/SUBAGENTS.md` — `planner`, `data-reader`, `data-writer` must be rows inside the existing `### Tooling` table only.
- [ ] Confirm `docs/SUBAGENTS.md`'s domain-bound/tooling summary reads "17" domain-bound and "9" tooling-agents — not "18"/"6" and not "19"/"6".
- [ ] Confirm `docs/SKILLS.md` names and explains all 8 keywords from Task 2's acceptance criteria, each in the section of the skill that actually supports it, and that the `/plan-and-do` argument-hint line matches the SKILL.md frontmatter exactly.
- [ ] Confirm `README.MD` has zero remaining "24 Subagents" or "6 Skills"/"6 Custom-Skills" occurrences, and that the Konferenz-Zuhörer link at line 32 is an in-page anchor identical to the one already used in the Table of Contents (line 52).
- [ ] If Task 4 ran: confirm both edited `CLAUDE.md` sentences name `data-reader` and `data-writer` alongside the existing names, and that "17" is unchanged in both.
- [ ] Report every mismatch found back to `skill-coder` for a fix. Do not edit files directly.

**Parallelism:** Task 5 waits for Tasks 1, 2, 3 (and 4, if run) to finish — it verifies their combined output.

## Tests

No automated tests apply — this is a documentation-only change. See `## Test Command` above. Verification is performed by Task 5 (a `skill-reviewer` cross-check against the real `.claude/agents/` and `.claude/skills/` files), not by running a test suite.

## Open Questions

- `docs/TRANSFER.md` was checked for stale subagent/skill counts and none were found — worth a quick re-confirmation after Tasks 1-3 land, since it cross-links both docs.
