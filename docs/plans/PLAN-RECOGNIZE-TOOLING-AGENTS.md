# Implementation Plan: RECOGNIZE-TOOLING-AGENTS

## Test Command
`(none — pure skill/markdown edit, test-inappropriate)`

## Goal

Make the AGENT DISCOVERY in `.claude/skills/plan-and-do/SKILL.md` recognize the tooling agents in `.claude/agents/`: `python-coder`, `python-reviewer`, `shell-coder`, `shell-reviewer`, `skill-coder`, `skill-reviewer`.

Today rule 0 hard-skips them. They land in no list. No later step can dispatch them. Result: a `.py`, `.sh`, or `.claude/` change gets no domain coder or reviewer.

## Problem (current behavior)

- AGENT DISCOVERY rule 0: tooling agents → "skip ... Do NOT add to any coding or review list."
- State file `discovery` block has no tooling lists.
- Step 8.1 file→agent map: no `.py` / `.sh` / `.claude/` rows.
- REVIEWER SCOPE FILTER: no tooling-file rule.

So tooling agents are named but never usable.

## Approach

Classify tooling agents into two new buckets. Wire those buckets into dispatch and review. Gate them on tooling files only (`.py`, `.sh`/`.bash`, files under `.claude/`), so CRM work is unaffected.

## Tasks

### 1. AGENT DISCOVERY — rule 0 rewrite
- [ ] Replace rule 0 "skip" wording. New rule 0 classifies, order-sensitive, still first:
  - Name starts with `python-`, `shell-`, or `skill-`:
    - ends with `-reviewer` → `tooling_review_agents`
    - else (ends with `-coder`) → `tooling_coding_agents`
  - Keep the gate note: dispatch these ONLY when changed files are tooling files (`.py`, `.sh`/`.bash`, or files under `.claude/`). Never for CRM domain files.
- [ ] Update the summary line: list the two new tooling lists alongside the existing six. Set `agents_available = true` if any list is non-empty.

### 2. State file `discovery` block
- [ ] In the Step 3.3 JSON template, add `"tooling_coding_agents": []` and `"tooling_review_agents": []` to the `discovery` object.

### 3. Step 8.1 — file → agent mapping
- [ ] Add rows to the dispatch table:
  - `**/*.py` → `python-coder`
  - `**/*.sh`, `**/*.bash` → `shell-coder`
  - `.claude/**` (skills, agents, prompts, settings) → `skill-coder`
- [ ] Note: these run only when the changed files match; pair each with its reviewer in the phase-review step.

### 4. REVIEWER SCOPE FILTER
- [ ] Add filter rules:
  - `**/*.py` changed → include `python-reviewer`
  - `**/*.sh` / `**/*.bash` changed → include `shell-reviewer`
  - files under `.claude/**` changed → include `skill-reviewer`

### 5. Consistency pass
- [ ] Re-read edited sections. Confirm rule order still correct (rule 0 before test-coder rules; tooling check first). Confirm no contradiction remains ("skip" vs "dispatch"). Confirm examples still match.

## Tests

### Self-consistency checks (manual — no suite)
- [ ] Rule 0 no longer says "Do NOT add to any list" for tooling agents.
- [ ] `python-coder` classifies to `tooling_coding_agents`; `shell-reviewer` to `tooling_review_agents`.
- [ ] Standard rules 1–7 unchanged for CRM agents (e.g., `be-test-coder` still hits the test-coder rule, not the tooling rule — they share no prefix, so no collision).
- [ ] State JSON template parses (valid JSON) with the two new keys.
- [ ] Step 8.1 table and REVIEWER SCOPE FILTER reference the same file globs (`.py`, `.sh`/`.bash`, `.claude/**`).

## Out of scope
- No change to CRM agent classification or to other skills.
- No change to `.claude/agents/*` agent definitions themselves.
