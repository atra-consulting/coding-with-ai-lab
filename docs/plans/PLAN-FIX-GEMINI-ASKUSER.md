# Implementation Plan: FIX-GEMINI-ASKUSER

## Context

The user's message named `.gemini/skills/plan-and-do/SKILL.md`, but the actual target is the **Claude** skill at `.claude/skills/plan-and-do/`. Claude (me) sometimes falls back to plain conversational text input instead of calling the `AskUserQuestion` tool, even though the skill already says to use it. The user previously asked for a home-made terminal input mechanism because of a bug with long skills. That guidance is **revoked**. From now on, always call `AskUserQuestion`.

**Goal:** Tighten `.claude/skills/plan-and-do/SKILL.md` and `plan-and-do-modes.md` so the tool call is mandatory and unambiguous at every prompt.

## Scope

- `/Users/karsten/workspaces/fh/repos/coding-with-ai-lab/.claude/skills/plan-and-do/SKILL.md`
- `/Users/karsten/workspaces/fh/repos/coding-with-ai-lab/.claude/skills/plan-and-do/plan-and-do-modes.md`

**Out of scope:** `.gemini/skills/plan-and-do/` (user explicitly excluded it). `.claude/skills/bpf-plan-and-do/` (separate skill in user-level dir, not this repo).

## Baseline

Current `AskUserQuestion` count: SKILL.md = 22, plan-and-do-modes.md = 3.

## Test Command

`bash -lc 'set -e; cd /Users/karsten/workspaces/fh/repos/coding-with-ai-lab; c=$(grep -c AskUserQuestion .claude/skills/plan-and-do/SKILL.md); [ "$c" -ge 26 ] || { echo "SKILL.md AskUserQuestion count=$c < 26"; exit 1; }; c=$(grep -c AskUserQuestion .claude/skills/plan-and-do/plan-and-do-modes.md); [ "$c" -ge 4 ] || { echo "modes AskUserQuestion count=$c < 4"; exit 1; }; grep -q "CRITICAL" .claude/skills/plan-and-do/SKILL.md || { echo "CRITICAL banner missing"; exit 1; }; grep -q "Forbidden Input Patterns" .claude/skills/plan-and-do/SKILL.md || { echo "Forbidden Input Patterns section missing"; exit 1; }; grep -q "revoked" .claude/skills/plan-and-do/SKILL.md || { echo "revocation language missing"; exit 1; }; echo OK'`

Rationale for no "forbidden pattern" regex: the new CRITICAL block *describes* the forbidden patterns ("home-made terminal", "just print the question") as part of the revocation text. A naive grep would falsely flag the instructional content. The presence of `CRITICAL`, `Forbidden Input Patterns`, and `revoked` is what proves the rule is installed.

## Tasks

### 1. Strengthen the top-level rule (SKILL.md)

- [ ] Rewrite `## HOW TO ASK THE USER FOR DECISIONS` section. Current text is three short lines. Replace with:
  - A **CRITICAL** banner at the top: "ALWAYS call the `AskUserQuestion` tool for every user prompt. NEVER print a question and wait for conversational input."
  - "This overrides any past guidance. Previous advice to use a home-made terminal input mechanism because of a long-skill bug is revoked. The bug is no longer a concern."
  - An explicit "Tool call required" paragraph: every prompt in this skill is a `AskUserQuestion` tool invocation, not prose.
  - Keep the two sub-bullets (Numbered choices / Freeform input) but reword to "Always pass the question text as the `question` parameter of `AskUserQuestion`."

### 2. Add a "Forbidden Input Patterns" subsection (SKILL.md)

- [ ] Add new `### Forbidden Input Patterns` block below the CRITICAL banner. List:
  - Printing a question as text and waiting for the user's next message.
  - `Bash` with `read -p`, piped `echo`, or any interactive stdin pattern.
  - "Soft" phrasing like "let me know" or "what do you think?" without a tool call.
  - Treating a user's mid-turn correction as an implicit answer to an unasked question.
- [ ] Each bullet ends with the rule: "→ Call `AskUserQuestion` instead."

### 3. Make every prompt call explicit (SKILL.md)

- [ ] Replace "Use AskUserQuestion" with "Call the `AskUserQuestion` tool" where the wording is currently soft. Target at least 4 locations so the count rises to ≥ 26.
- [ ] Step 7.1 line 453: change "**README.md / README.adoc** — if found, confirm with user" to "**README.md / README.adoc** — if found, call `AskUserQuestion` to confirm". (This line is currently the weakest — "confirm with user" implies prose.)
- [ ] `### Standard Checkpoint` (line 127): reword "At each checkpoint, use AskUserQuestion with three choices:" to "At each checkpoint, **call the `AskUserQuestion` tool** with three choices:".
- [ ] Step 1 Path A line 204: "Display understanding and key. Do NOT ask for approval — just show it and continue." — leave unchanged (intentional no-prompt).
- [ ] Every other "use AskUserQuestion" → "call the `AskUserQuestion` tool".

### 4. Make every prompt call explicit (plan-and-do-modes.md)

- [ ] PC.2 (line 308): `Call AskUserQuestion:` → `Call the **AskUserQuestion** tool with:`
- [ ] PC.4 (line 345): `Call AskUserQuestion: 1-Merge PR, 2-Skip merge (done).` → `Call the **AskUserQuestion** tool with: 1-Merge PR, 2-Skip merge (done).`
- [ ] PC.5 (line 370): same treatment.
- [ ] Add one more explicit mention in the intro — e.g., a one-line reminder at the top of the file: "All user prompts in this file must use the `AskUserQuestion` tool."

### 5. Bump version (SKILL.md)

- [ ] Frontmatter: `version: 1.8.0` → `version: 1.9.0`, `last-modified: 2026-04-18` → `last-modified: 2026-04-20`.
- [ ] SKILL HEADER block (line 59): `Plan and Do (v1.8.0, 2026-04-18)` → `Plan and Do (v1.9.0, 2026-04-20)`.

### 6. Verification

- [ ] Run the test command. Must print `OK`.
- [ ] Re-read both files end-to-end and confirm every prompt location uses `AskUserQuestion`.

## Tests

### Content checks
- [ ] `grep -c AskUserQuestion .claude/skills/plan-and-do/SKILL.md` ≥ 26.
- [ ] `grep -c AskUserQuestion .claude/skills/plan-and-do/plan-and-do-modes.md` ≥ 4.
- [ ] String `CRITICAL` appears in the `## HOW TO ASK THE USER FOR DECISIONS` section.
- [ ] `grep -iE "home.?made terminal|stdin prompt|just print the question"` returns zero lines.
- [ ] No "confirm with user" without a `AskUserQuestion` call in the same bullet.

### File integrity
- [ ] Both files still parse as markdown. No broken fenced code blocks.
- [ ] YAML frontmatter in SKILL.md still has `name`, `description`, `version`, `allowed-tools` keys.
- [ ] Version string is consistent between frontmatter and SKILL HEADER block.

### Out-of-scope (confirm unchanged)
- [ ] `.gemini/skills/plan-and-do/` — no changes.
- [ ] `.claude/skills/bpf-plan-and-do/` — not touched (it is not in this repo).
- [ ] No backend/frontend code touched.
