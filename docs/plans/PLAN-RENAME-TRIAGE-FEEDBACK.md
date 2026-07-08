# Implementation Plan: RENAME-TRIAGE-FEEDBACK

Rename the `triage-feedback` skill to `write-ticket`. Update live references. Full-reconcile the skill docs.

## Test Command
`grep -rIn "triage.feedback" --exclude-dir=node_modules --exclude-dir=.git .` plus a "4 Skill" count sweep. See Tests section for exact checks.

## Scope Decision
- **Rename:** skill dir + SKILL.md internals.
- **Live text refs:** update `/triage-feedback`, `project:triage-feedback`, and skill-path mentions inside historical docs (PLAN + REVIEW). **Do NOT** rename doc filenames. **Do NOT** rewrite the verbatim user quote in `STATE-WRITE-TRIAGE-FEEDBACK-SKILL.json`.
- **Docs full reconcile:** SKILLS.md + README undercount skills (say 4, there are 6) and omit `do-semi-automatic` and `write-ticket`. Fix counts to 6; document all 6 skills.

## Tasks

### 1. Rename the skill directory
- [ ] `git mv .claude/skills/triage-feedback .claude/skills/write-ticket`

### 2. Update SKILL.md internals (`.claude/skills/write-ticket/SKILL.md`)
- [ ] `name: "project:triage-feedback"` → `name: "project:write-ticket"`
- [ ] Heading `# Triage Feedback` → `# Write Ticket`
- [ ] Usage example `/triage-feedback 14` → `/write-ticket 14`
- [ ] Scan for any other `triage-feedback` / "Triage Feedback" occurrence; update if found.

### 3. Update live text refs in historical docs
- [ ] `docs/plans/PLAN-WRITE-TRIAGE-FEEDBACK-SKILL.md`: `/triage-feedback` → `/write-ticket`, `.claude/skills/triage-feedback/SKILL.md` → `.claude/skills/write-ticket/SKILL.md`, `project:triage-feedback` → `project:write-ticket`. (Leave filename + historical task-key text.)
- [ ] `docs/reviews/REVIEW-solution-jfs-2026.md` line 53: sibling name `triage-feedback` → `write-ticket`.

### 4. Full-reconcile `docs/SKILLS.md`
- [ ] Line 3: "vier eigene Skills" → "sechs eigene Skills".
- [ ] Add a `/do-semi-automatic` section (headless, one Kanban ticket/run; judge → send back or build via plan-and-do; comments each status change; no push/PR; needs `AGENT_API_TOKEN`; background SPEC-API-TICKETS.md).
- [ ] Add a `/write-ticket` section (headless; triages one agent-task feedback into a new Definition/HUMAN ticket; comments missing info when thin; never builds/pushes/PRs; needs `AGENT_API_TOKEN`; background SPEC-API-TASKS.md + SPEC-API-TICKETS.md).
- [ ] Keep the doc's existing German style + bullet format (Wann nutzen / Was passiert / Argumente / Wichtig / Beispiel / Datei / Hintergrund).

### 5. Fix counts in `README.MD`
- [ ] Line 145: `(4 Skills)` → `(6 Skills)`.
- [ ] Line 151: `Alle 4 Skills.` → `Alle 6 Skills.`
- [ ] Line 243: `Alle 4 Custom-Skills erklärt` → `Alle 6 Custom-Skills erklärt`.

### 6. `docs/TRANSFER.md` + other related files
- [ ] TRANSFER.md: no skill count/name to change — verify, leave as-is.
- [ ] Final sweep: no `4 Skill` / `vier ... Skill` count remains in any doc (welcome_DE/EN, CHEATSHEET, SETUP, etc.).

### 7. Explicitly leave untouched
- [ ] `docs/state/STATE-WRITE-TRIAGE-FEEDBACK-SKILL.json` — verbatim user quote. No change.
- [ ] Historical doc filenames. No rename.

### 8. Verification
- [ ] Run the grep sweeps below.
- [ ] Confirm `.claude/skills/write-ticket/SKILL.md` exists, old dir gone, frontmatter name = `project:write-ticket`.
- [ ] Confirm SKILLS.md lists all 6 skills.

## Tests
### Verification checks
- [ ] `grep -rIn "project:triage-feedback"` → 0 hits.
- [ ] `grep -rIn "/triage-feedback"` → 0 hits.
- [ ] `grep -rIn "skills/triage-feedback"` → 0 hits.
- [ ] `grep -rIn "4 Skill\|vier.*Skill\|4 Custom-Skill"` → 0 hits.
- [ ] `ls .claude/skills/` shows `write-ticket`, not `triage-feedback`.
- [ ] Remaining `triage.feedback` hits = only STATE JSON quote + doc filenames (WRITE-TRIAGE-FEEDBACK-SKILL).
