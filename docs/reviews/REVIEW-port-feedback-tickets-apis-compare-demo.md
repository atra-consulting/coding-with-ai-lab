# Code Review - port-feedback-tickets-apis-compare-demo

**Date**: 2026-08-31
**Branch**: port-feedback-tickets-apis-compare-demo
**Base**: 05313857ae54736c1b8e5041e0bb2707b777ae00
**Files Reviewed**: 34
**Review Rounds**: 3 (max 3)

## Summary

This branch ports a feature from the sibling repo `coding-with-ai-demo`: linking Kanban tickets to the "app feedback" (`agent_task`) item that spawned them, in both directions, plus a `fullyReady` automation-only marker, a ticket-number badge on the board, a coupled fix isolating the backend test database from the shared dev database, and a narrow Rechner wait-time color update.

Seven reviewers (ba, be, be-test, db, fe, fe-test, ui) independently reviewed the whole branch in Round 1, scoped to their domain. Four actionable findings survived: a tautological test assertion, a PRD/plan documentation-boundary violation, a missing required PRD section, and a minor Zod validation gap. All four were fixed and re-reviewed in Round 2, which surfaced three small documentation-consistency issues in the fixes themselves (a wording direction error, a stale commit list, an overstated claim). Those were fixed directly and re-reviewed in Round 3, which came back clean.

All 367 backend tests and 529 frontend tests pass. The frontend build succeeds. The shared development database is confirmed untouched by test runs.

## Review Rounds

### Round 1

**Issues found**: 4 | **Fixes applied**: 4

| # | Severity | File | Issue | Found by | Proposed Fix | Fix by | Applied | Applied by |
|---|----------|------|-------|----------|--------------|--------|---------|------------|
| 1 | CRITICAL | `backend/src/test/agentTasks.spec.ts:1059` | The "ticketId appears on every item of the paginated list" test only checked key presence (`'ticketId' in item'`), never the actual value — zero regression protection for the list endpoint's distinct pagination-first SQL | be-test-reviewer | Assert real `ticketId` values against known-linked/known-unlinked agent_task rows established earlier in the same describe block | be-test-coder | Rewrote the test to assert exact expected values for 4 known-state rows (linked, newest-wins, deleted-link, freshly-unlinked) | be-test-coder |
| 2 | WARNING | `docs/prds/PRD-PORT-FEEDBACK-TICKETS-APIS.md` | `## Technical Notes` section (file paths, SQL, Zod snippets, migration control-flow) duplicated plan-level implementation detail, violating this repo's PRD/plan boundary convention | ba-reviewer | Trim PRD to WHAT/WHY; move/confirm detail lives in the plan | ba-writer | Removed Technical Notes section; trimmed Technical Summary and Performance NFR to requirement-level language | ba-writer |
| 3 | SUGGESTION | `docs/prds/PRD-PORT-FEEDBACK-TICKETS-APIS.md` | Missing required `## Implementierung` section (AGENTS.md "Commits & PRDs" rule) | ba-reviewer | Add section linking branch/commits/PR | ba-writer | Added `## Implementierung` section (orchestrator filled in the commit list — agent had no Bash tool) | ba-writer |
| 4 | SUGGESTION | `backend/src/routes/tickets.ts:42` | `agentTaskId` Zod schema allowed `0` and negative integers, inconsistent with every other FK-id field in the codebase (all use `.positive()`) | be-reviewer | Add `.positive()` to the schema | be-coder | Changed to `z.number().int().positive().nullable().optional()`; verified live via curl | be-coder |

### Round 2

**Issues found**: 3 | **Fixes applied**: 3

| # | Severity | File | Issue | Found by | Proposed Fix | Fix by | Applied | Applied by |
|---|----------|------|-------|----------|--------------|--------|---------|------------|
| 1 | WARNING | `docs/prds/PRD-PORT-FEEDBACK-TICKETS-APIS.md:11` | Technical Summary said "described under REQ-012 above" — REQ-012 is actually below in document order | ba-reviewer | Fix "above" → "below" | direct fix | Corrected the word | direct fix |
| 2 | WARNING | `docs/prds/PRD-PORT-FEEDBACK-TICKETS-APIS.md` (Implementierung) | Commit list was stale — missing 3 commits, including the fix commit that landed after the list was written | ba-reviewer | Update list to match `git log` | direct fix | Added the 3 missing commits, removed an accidental duplicate line | direct fix |
| 3 | SUGGESTION | `docs/plans/PLAN-PORT-FEEDBACK-TICKETS-APIS.md` (Group 3) | Claimed "exact SQL given below" but only a partial shape fragment was present, not the full literal query | ba-reviewer | Add the full literal SQL or soften the claim | direct fix | Added the complete `findAll()` SQL block, matching shipped code | direct fix |

### Round 3

Clean pass. No issues found.

## Remaining Issues

No remaining issues.

## Project Context Validation

- **PRD** (`docs/prds/PRD-PORT-FEEDBACK-TICKETS-APIS.md`): all 12 requirements (REQ-001–REQ-012) map to shipped code, verified by domain reviewers reading the actual diffs, not just the PRD text. Out-of-scope items (skills/agents, feedback seed-title fix, broader Rechner overhaul, AG Grid colors) confirmed absent from the change.
- **CLAUDE.md / AGENTS.md**: async `@libsql/client` usage, ISO-8601 dates, route-layer-DB-free convention, `{status, message, timestamp, fieldErrors}` error shape, Angular 21 `@if`/`@for`-only control flow, and the PRD↔commit linking rule were all checked and confirmed followed.

## Next Steps

- All tests pass. No remaining issues.
- Create PR when ready.

---
Generated with Claude Code - review v1.8.2 (embedded mode, invoked from plan-and-do)
