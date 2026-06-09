# Implementation Plan: REVIEW-ALWAYS-DISPLAY

## Test Command
`N/A (docs-only change — editing .claude/skills/review/SKILL.md)`

## Goal
Make explicit, as a binding requirement in the review skill, that the skill **MUST ALWAYS** surface its review results — either on screen or in a Markdown file — whether it runs **embedded** (called from plan-and-do) or **stand-alone**. The behavior is already mostly present (Phase 6 writes the file; Phase 7 prints a summary), but it is implicit. This change states it as an invariant and reinforces it at the output points.

## Tasks

### 1. Add a "Results Display Guarantee" invariant
- [ ] Add a short, prominent section near the top of `SKILL.md` (after the intro paragraph, before/around the FILE PATH DISPLAY RULE).
- [ ] State the MUST: in every mode (embedded or stand-alone; dry-run or normal), the skill never finishes silently. It always either (a) writes the Markdown review file, or (b) displays the full review content on screen.
- [ ] Make clear embedded mode still produces the review file (so plan-and-do can read it) AND that the on-screen Phase 7 summary still runs.

### 2. Reinforce at the output points
- [ ] Phase 6.3 (Write Review File): add a one-line cross-reference to the guarantee — normal mode writes the file; dry-run displays content; one path always happens.
- [ ] Phase 7 (Summary): note the summary is always printed regardless of mode (including embedded).

### 3. Version bump + changelog
- [ ] Bump `version` in front matter (1.6.0 -> 1.7.0) and `last-modified` to 2026-06-09.
- [ ] Update the two in-body version strings that read `v1.6.0` (header block line ~76 and the generated-by footer line ~679) to `v1.7.0`.

### 4. Verification
- [ ] Re-read edited sections to confirm wording is consistent and no version string is missed (`grep -n "1.6.0\|1.7.0"`).
- [ ] Confirm no behavioral contradiction introduced (dry-run still skips file write; embedded still writes file).

## Tests
### Docs change — no automated tests
- [ ] Manual check: invariant section present and unambiguous.
- [ ] Manual check: Phase 6.3 and Phase 7 reference the guarantee.
- [ ] Manual check: all version strings updated consistently.
