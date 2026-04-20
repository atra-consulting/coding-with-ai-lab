# Implementation Plan: FIX-REVIEW-PROMPT

## Test Command

No automated tests for markdown skill files. Verification is by inspection — read the edited SKILL.md and confirm the conflict is resolved.

## Root Cause

Step 9.3 of `.claude/skills/plan-and-do/SKILL.md` is titled **"Checkpoint 9 — Implementation Complete"**. The word "Checkpoint" triggers the global rule at line 72:

> **CHECKPOINT RULE: NEVER auto-continue past a Standard Checkpoint.** You MUST use AskUserQuestion and WAIT for the user's response at every checkpoint.

The step body then says "Do NOT prompt" for `implement-review` or `full` scopes. The executing LLM sees the conflict between the title ("Checkpoint") and the body ("Do NOT prompt") and defaults to the safer "prompt the user" path — which is the bug the user reported.

Steps 11.2 and 12.3 have the same mislabel. They are pure state-update transitions with no user interaction, yet are titled "Checkpoint 11" and "Checkpoint 12". Fixing these too prevents the same bug from appearing there.

## Tasks

### 1. SKILL.md edits

- [ ] Rename Step 9.3 heading from `### Step 9.3: Checkpoint 9 — Implementation Complete` to `### Step 9.3: Implementation Complete — Auto-Advance`
- [ ] Add a bold first line to Step 9.3 body: **"This is NOT a user checkpoint. Never call AskUserQuestion here. Auto-advance per workflow_scope."**
- [ ] Rename Step 11.2 heading from `### Step 11.2: Checkpoint 11` to `### Step 11.2: Advance to Documentation`
- [ ] Rename Step 12.3 heading from `### Step 12.3: Checkpoint 12` to `### Step 12.3: Advance to Summary`
- [ ] Update line 72 ("CHECKPOINT RULE") to clarify that only headings explicitly calling AskUserQuestion are Standard Checkpoints. Keep rule strict; just remove ambiguity.

### 2. Verification

- [ ] Re-read SKILL.md Step 9.3 and confirm:
  - Title no longer contains "Checkpoint"
  - Body starts with explicit "NOT a user checkpoint" marker
  - Logic for `implement` / `implement-review` / `full` is unchanged
- [ ] Grep the file for any remaining `Checkpoint N` labels on steps that do not call AskUserQuestion

## Tests

No unit/integration tests — this is a documentation/prompt engineering fix. Verification is by reading the result.

### Manual verification

- [ ] The text at Step 9.3 must be impossible to misread as a Standard Checkpoint.
- [ ] Heading structure stays consistent (`### Step N.M: Title`).
- [ ] No other behavioral logic changes.
