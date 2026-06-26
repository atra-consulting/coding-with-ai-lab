# Implementation Plan: DOCUMENT-BUSINESS-DOMAIN

Source PRD: `docs/prds/PRD-DOCUMENT-BUSINESS-DOMAIN.md`

## Test Command

Docs-only change. No code tests. Verify with this check (run from repo root):

```bash
bash docs/tests/verify-domain-docs.sh
```

The script checks: DOMAIN.md exists; all 18 domain-bound agents reference it; the 6 tooling agents do not; SPECS.md and CLAUDE.md register it; enum values match SPECS-database.md.

(If the script is not created, run the equivalent grep checks inline — see Verification tasks.)

## Tasks

### 1. Write `docs/specs/DOMAIN.md` (ba-writer)

- [ ] Header + one-paragraph **Purpose**: a CRM. Tracks companies, contacts, interactions, sales opportunities. Used by sales/account staff.
- [ ] **Ubiquitous Language** table: German term → English meaning → one-line role. Cover Firma, Person, Abteilung, Adresse, Aktivitaet, Chance, plus ChancePhase and AktivitaetTyp values.
- [ ] **Entities** — one plain-language paragraph each (business meaning, no SQL):
  - [ ] Firma (company/account) — top-level. Owns people, departments, addresses, activities, opportunities.
  - [ ] Person (contact) — belongs to a Firma; optional Abteilung.
  - [ ] Abteilung (department) — groups people inside a Firma.
  - [ ] Adresse (address) — linked to a Firma and/or a Person (both optional). Geocoded (lat/lon) → shows on a map.
  - [ ] Aktivitaet (interaction log) — linked to a Firma and/or a Person; both optional → can be standalone. Types: ANRUF, EMAIL, MEETING, NOTIZ, AUFGABE.
  - [ ] Chance (sales opportunity) — belongs to Firma, optional contact person. Value in stored currency (default EUR), probability 0–100%, expected close date.
- [ ] **Relationships & delete behavior** (table or short diagram + precise rules):
  - [ ] Delete Firma → cascade removes people, departments, addresses, activities, opportunities.
  - [ ] Delete Person → cascade removes that person's addresses and activities.
  - [ ] Delete Abteilung → people survive; department link cleared.
  - [ ] Delete a Person who is a Chance contact → Chance survives; contact link cleared.
- [ ] **Chance pipeline**: list phases in board order NEU → QUALIFIZIERT → ANGEBOT → VERHANDLUNG → GEWONNEN / VERLOREN. State plainly: Kanban board labels, NOT an enforced state machine — any phase, any order, no backend transition guards.
- [ ] **Users & roles**: ADMIN and USER have identical access to all 6 CRM entities (any logged-in user can read/create/edit/delete). ADMIN unlocks only admin areas (agent-task dashboard, cron). 3 hardcoded users: admin, user, demo. Note: `permissions` array exists on the user model but is NOT enforced — access control is role-based only.
- [ ] **Out-of-scope system tables**: agent_task (autonomous-AI task queue), cron_run (audit log of cron runs), sessions (persisted login sessions). One line each. Not CRM business data. Link to `docs/API-TASKS.md`.
- [ ] Style: English. Short sentences. Simple words. No passive voice. ~1–2 printed pages. No code samples.
- [ ] Facts must match `docs/specs/SPECS-database.md` exactly (enum values, FK/cascade behavior).

### 2. Register DOMAIN.md in the spec indexes

- [ ] `docs/specs/SPECS.md` — add a DOMAIN.md row to the "Spezifikationsdokumente" table. Place it first (it is the business reference). German label to match that file.
- [ ] `CLAUDE.md` — add a DOMAIN.md row to the `## Specifications` table, with a "Primary for" entry naming the domain-bound agent groups.

### 3. Wire DOMAIN.md into the 18 domain-bound agent files

Add the identical bullet directly under the `## Specifications` intro line, above the Primary/Secondary bullets:

```
- **Business domain** (read first for domain context): `docs/specs/DOMAIN.md`
```

- [ ] admin
- [ ] ba-writer
- [ ] ba-reviewer
- [ ] md-reader
- [ ] be-coder
- [ ] be-reviewer
- [ ] db-coder
- [ ] db-reviewer
- [ ] fe-coder
- [ ] fe-reviewer
- [ ] ui-designer
- [ ] ui-reviewer
- [ ] be-test-coder
- [ ] be-test-reviewer
- [ ] be-test-runner
- [ ] fe-test-coder
- [ ] fe-test-reviewer
- [ ] fe-test-runner
- [ ] Do NOT touch: python-coder, python-reviewer, shell-coder, shell-reviewer, skill-coder, skill-reviewer.

### 4. Verification

- [ ] `docs/specs/DOMAIN.md` exists; internal links resolve (`SPECS-database.md`, `docs/API-TASKS.md`).
- [ ] `grep -L 'DOMAIN.md' <18 agent files>` returns empty (all reference it).
- [ ] The 6 tooling agent files contain no `DOMAIN.md` reference.
- [ ] ChancePhase order and AktivitaetTyp values in DOMAIN.md match `SPECS-database.md`.
- [ ] Delete behavior, role facts, and phase-non-enforcement match the PRD corrections.
- [ ] SPECS.md and CLAUDE.md each show a DOMAIN.md row.

## Tests

### Doc-integrity checks (no unit tests)

- [ ] Link check: every relative link in DOMAIN.md points to an existing file.
- [ ] Wiring check: exactly 18 agent files reference DOMAIN.md; exactly 6 (tooling) do not.
- [ ] Fact check: enum values, FK/cascade rules, and role behavior cross-checked against SPECS-database.md and SPECS-backend.md.

### Edge cases

- [ ] No agent file ends up with a duplicate DOMAIN.md line.
- [ ] No tooling agent accidentally gains a `## Specifications` section.
- [ ] DOMAIN.md does not duplicate technical schema (stays business-level).
