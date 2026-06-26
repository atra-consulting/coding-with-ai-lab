# PRD: Document the Business Domain

**Status:** Ready for implementation
**Date:** 2026-06-26

---

## Problem Statement

No single document explains the CRM business domain. Agents that write or review code must infer business meaning from technical schema files. That causes gaps: agents miss business rules, use wrong terms, or misunderstand entity relationships. Every domain-bound agent currently reads 0 dedicated domain docs.

---

## Source

Product owner request. 18 domain-bound agents lack a shared business reference.

---

## Solution

Create one file: `docs/specs/DOMAIN.md`. Register it in `SPECS.md` and `CLAUDE.md`. Wire every domain-bound agent to read it.

### Why one file?

The business domain is small and cohesive: 6 CRM entities. Every domain-bound agent needs the full model — entities, relationships, rules, lifecycles. Splitting into multiple files would force those agents to read 2+ files. One file means each domain agent reads exactly 1 domain file. That is the theoretical minimum (you cannot go below 1 for an agent that needs the domain). Tooling agents (`python-*`, `shell-*`, `skill-*`) are not domain-bound. They read 0 domain files and stay untouched.

Result: domain agents read 1 domain file; tooling agents read 0. Optimal.

---

## Users

**Primary:** All AI agents in `.claude/agents/` that write or review CRM code and docs.

**Secondary:** Human developers new to the project.

---

## Requirements

### DOMAIN.md content

**[REQ-001] App purpose**
State what the CRM does, what problem it solves, and who uses it.
Priority: High. Acceptance: One short paragraph. No technical stack detail.

**[REQ-002] Ubiquitous language table**
List all German domain terms with their English meaning.
Priority: High. Acceptance: Table covers all 6 entities and their key sub-terms (phases, types).

**[REQ-003] Entity descriptions (business meaning)**
Describe each of the 6 entities in business terms. No schema or SQL.
- Firma — company/account. Owns people, departments, addresses, activities, opportunities.
- Person — contact person. Belongs to a Firma; optional Abteilung.
- Abteilung — department. Groups Person within a Firma.
- Adresse — postal address. Linked to a Firma and/or a Person (both links optional; not mutually exclusive). Geocoded (lat/lon) so addresses show on a map.
- Aktivitaet — interaction log entry. Linked to a Firma and/or a Person; both optional, so it can be a standalone note. Types: ANRUF, EMAIL, MEETING, NOTIZ, AUFGABE.
- Chance — sales opportunity. Belongs to Firma, optional contact person. Has monetary value in a stored currency (`currency` column, default EUR), probability (0–100%), expected close date.

Priority: High. Acceptance: Each entity has a plain-language paragraph. Enums match SPECS-database.md exactly. Ownership wording does not imply schema-enforced mutual exclusivity for Adresse/Aktivitaet.

**[REQ-004] Entity relationships and delete behavior**
Describe who owns whom. State delete behavior in business terms, precisely:
- Delete a Firma → removes its people, departments, addresses, activities, and opportunities (cascade).
- Delete a Person → removes that person's addresses and activities (cascade).
- Delete an Abteilung → its people survive; their department link is cleared (set to none).
- Delete a Person who is a Chance contact → the Chance survives; its contact link is cleared (set to none).
Priority: High. Acceptance: Relationship diagram or table. All four delete behaviors stated. Cascade vs clear-link distinction is correct per SPECS-database.md.

**[REQ-005] Chance pipeline / lifecycle**
List the sales pipeline phases in their board order: NEU → QUALIFIZIERT → ANGEBOT → VERHANDLUNG → GEWONNEN / VERLOREN.
State that Chance uses a Kanban board view. State clearly: the phases are board labels, NOT an enforced state machine. Any Chance can be set to any phase in any order. The backend enforces no transition rules.
Priority: High. Acceptance: Phase order matches SPECS-database.md enum. Doc explicitly says phases are free-set labels, not enforced transitions.

**[REQ-006] Aktivitaet types**
List AktivitaetTyp values with plain English meaning.
Priority: Medium. Acceptance: All 5 types listed. Names match SPECS-database.md enum.

**[REQ-007] Users and roles**
Describe ADMIN vs USER in business terms — accurately. Both roles have the SAME access to all 6 CRM entities: any logged-in user can read, create, edit, and delete Firma, Person, Abteilung, Adresse, Aktivitaet, and Chance. ADMIN unlocks only the admin areas (agent-task dashboard, cron). USER cannot reach those admin areas. Name the 3 hardcoded users (admin, user, demo). State that a `permissions` array exists on the user model but is NOT enforced — access control is role-based only.
Priority: High. Acceptance: Doc states CRM access is identical for both roles; ADMIN-only scope limited to admin areas; permissions array noted as unenforced. Each role lists its concrete business-level access.

**[REQ-008] Out-of-scope system tables**
Mark agent_task, cron_run, and sessions as app infrastructure — not CRM business data. One plain sentence each explaining its purpose (agent_task = autonomous-AI task queue; cron_run = audit log of cron runs; sessions = persisted login sessions). Point to `docs/API-TASKS.md`.
Priority: Medium. Acceptance: Section clearly separates these from the 6 CRM entities. Each table gets a one-line business-purpose explanation.

### Wiring requirements

**[REQ-009] Register in SPECS.md**
Add DOMAIN.md to the specs index table in `docs/specs/SPECS.md`.
Priority: High. Acceptance: Row appears in the table. Link resolves.

**[REQ-010] Register in CLAUDE.md**
Add DOMAIN.md to the `## Specifications` table in `CLAUDE.md`.
Priority: High. Acceptance: Row appears in the table. Link resolves.

**[REQ-011] Update domain-bound agent specs lists**
Add a DOMAIN.md reference to the `## Specifications` section of every domain-bound agent file in `.claude/agents/`. All 18 listed agents already have a `## Specifications` section, so the line slots in cleanly. Use a distinct, consistent label across all files — a new bullet: `**Business domain** (read first for domain context): docs/specs/DOMAIN.md`. Place it directly under the section intro, above the `Primary`/`Secondary` technical-spec bullets. Same wording in every file.
Domain-bound agents: admin, ba-writer, ba-reviewer, md-reader, be-coder, be-reviewer, db-coder, db-reviewer, fe-coder, fe-reviewer, ui-designer, ui-reviewer, be-test-coder, be-test-reviewer, be-test-runner, fe-test-coder, fe-test-reviewer, fe-test-runner.
Priority: High. Acceptance: Each of the 18 agent files lists DOMAIN.md with the identical `Business domain` bullet. No tooling agent file is changed.

**[REQ-012] Leave tooling agents untouched**
Do NOT modify: python-coder, python-reviewer, shell-coder, shell-reviewer, skill-coder, skill-reviewer.
Priority: High. Acceptance: Those 6 files are unchanged after implementation.

---

## Out of Scope

- Technical schema details — those stay in `SPECS-database.md`.
- API routes or service code — those stay in `SPECS-backend.md`.
- UI component design — that stays in `SPECS-ui.md`.
- Any new application features.
- Changing what tooling agents read.

---

## Implementation Approach

1. Write `docs/specs/DOMAIN.md` with sections: Purpose, Ubiquitous Language, Entities, Relationships, Lifecycles, Users & Roles, Out-of-Scope System Tables.
2. Add DOMAIN.md row to the specs table in `docs/specs/SPECS.md`.
3. Add DOMAIN.md row to the specs table in `CLAUDE.md`.
4. For each of the 18 domain-bound agents: open the file, locate `## Specifications`, add one line referencing `docs/specs/DOMAIN.md` as the business-domain reference.

No code changes. No schema changes. Documentation only.

---

## Test Strategy

Documentation verification — no automated tests needed. Manual checks:

- [ ] `docs/specs/DOMAIN.md` exists and all internal links resolve.
- [ ] All 6 entity names and their enum values match `SPECS-database.md` exactly (ChancePhase order, AktivitaetTyp values).
- [ ] Delete behavior is correct: Firma/Person cascades vs Abteilung/contact-link clearing.
- [ ] Roles: doc states ADMIN and USER have identical CRM access; ADMIN-only = admin areas; permissions array noted as unenforced.
- [ ] Chance phases described as free-set board labels, not an enforced state machine.
- [ ] Every domain-bound agent file (18 total) lists `DOMAIN.md` with the identical `Business domain` bullet.
- [ ] No tooling agent file (6 total) references `DOMAIN.md`.
- [ ] SPECS.md index table contains a DOMAIN.md row with a working link.
- [ ] CLAUDE.md specs table contains a DOMAIN.md row with a working link.
- [ ] Out-of-scope section in DOMAIN.md names all 3 system tables, explains each, and links to `docs/API-TASKS.md`.

---

## Non-Functional Requirements

- Language: English (consistent with existing SPECS files).
- Style: Follow CLAUDE.md writing style — short sentences, simple words, no passive voice.
- Length: As brief as possible while covering all REQs.
- No code samples in DOMAIN.md. Business meaning only.

---

## Success Criteria

- Any domain-bound agent can answer "what is a Chance?" correctly using only DOMAIN.md plus its existing spec file.
- The Chance pipeline phases are listed in board order and flagged as free-set labels.
- DOMAIN.md fits on roughly one to two printed pages — short enough to read quickly.
- Role access is described accurately (no false ADMIN/USER CRM split).
- Zero tooling-agent files changed.

---

## Open Questions

None. Structure decided. Implementation can start.

---

## Implementation

_Links to implementing commits and PRs will be added here after implementation._
