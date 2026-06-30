# Implementation Plan: HARDEN-ENV-VARS-FACTORY-SKILLS

## Test Command
No automated tests (only Markdown files change). Manual check: inspect the generated SKILL.md for env var loading.

## Problem

`AGENT_API_TOKEN` is in `backend/.env` but skills run in a separate Claude Code process — shell exports don't carry over. The created skill must source `backend/.env` itself.

The Übungsaufgabe 2 & 4 prompts already tell `plan-and-do` to load env vars. But the **skill spec files** ("Skill für Übungsaufgabe 2.md", "Skill für Übungsaufgabe 4.md") don't mention it. The `skill-coder` subagent uses the spec as primary input, so it may miss the requirement.

## Tasks

### 1. Update "Skill für Übungsaufgabe 2.md"

- [ ] Add "Schritt 0 — Umgebungsvariablen laden" before Schritt 1
- [ ] Load `backend/.env` with `set -a && source backend/.env && set +a` (guarded by `[ -f backend/.env ]`)
- [ ] After loading, check that `AGENT_API_TOKEN` is set; exit with error if not

### 2. Update "Skill für Übungsaufgabe 4.md"

- [ ] Same "Schritt 0" as above

### 3. Verification

- [ ] Read both updated files and confirm Schritt 0 is present and correct
- [ ] Confirm existing Schritt 1, 2, 3, 4 are unchanged
- [ ] Confirm Übungsaufgabe 2.md and 4.md prompts still reference the spec files and the env var instruction
