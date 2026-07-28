# Business Domain Reference

This is the business-domain reference for the CRM app. It covers business meaning only. Technical schema (columns, types, indexes, FK definitions) lives in [SPECS-database.md](SPECS-database.md).

---

## Purpose

A CRM (customer relationship management) app. Tracks companies, their people and departments, postal addresses, logged interactions, and sales opportunities. Sales and account staff use it to manage accounts and move deals through a pipeline.

---

## Ubiquitous Language

| German term | English | Role in the domain |
|-------------|---------|-------------------|
| Firma | Company / account | Top-level customer record |
| Person | Contact | A person at a company |
| Abteilung | Department | Groups contacts inside a company |
| Adresse | Address | Postal address for a company or contact |
| Aktivitaet | Activity / interaction | A logged call, email, meeting, note, or task |
| Chance | Sales opportunity | A deal being tracked in the pipeline |
| ChancePhase: NEU | New | Opportunity just created |
| ChancePhase: QUALIFIZIERT | Qualified | Opportunity confirmed as worth pursuing |
| ChancePhase: ANGEBOT | Proposal | Offer sent to the customer |
| ChancePhase: VERHANDLUNG | Negotiation | Active negotiation underway |
| ChancePhase: GEWONNEN | Won | Deal closed successfully |
| ChancePhase: VERLOREN | Lost | Deal closed without a sale |
| AktivitaetTyp: ANRUF | Call | Phone call logged |
| AktivitaetTyp: EMAIL | Email | Email logged |
| AktivitaetTyp: MEETING | Meeting | In-person or virtual meeting logged |
| AktivitaetTyp: NOTIZ | Note | Freeform note logged |
| AktivitaetTyp: AUFGABE | Task | A to-do item logged |

---

## Entities

**Firma** — the top-level account record. Represents a company or customer. Owns all related data: people, departments, addresses, activities, and sales opportunities.

**Person** — a contact at a Firma. Belongs to exactly one Firma. May sit in one Abteilung (optional). Carries contact details like email, phone, and job position.

**Abteilung** — a department inside a Firma. Groups Person records. Belongs to exactly one Firma.

**Adresse** — a postal address. Linked to a Firma and/or a Person. Both links are optional and not mutually exclusive — an address can belong to a company, a person, both, or neither. Stores latitude and longitude so the address can appear on a map.

**Aktivitaet** — a logged interaction. Records a call, email, meeting, note, or task. Linked to a Firma and/or a Person. Both links are optional, so an Aktivitaet can be a standalone entry with no company or contact attached. Types: ANRUF, EMAIL, MEETING, NOTIZ, AUFGABE.

**Chance** — a sales opportunity. Belongs to one Firma. Has an optional contact person (Person). Carries a monetary value in a stored currency (default EUR), a win probability from 0 to 100 percent, and an expected close date.

---

## Relationships & Delete Behavior

| Action | Result |
|--------|--------|
| Delete a Firma | Also deletes its people, departments, addresses, activities, and opportunities (cascade). |
| Delete a Person | Also deletes that person's addresses and activities (cascade). |
| Delete an Abteilung | Its people stay. Their department link is cleared (set to none). |
| Delete a Person who is a Chance contact | The Chance stays. Its contact link is cleared (set to none). |

---

## Sales Pipeline

Chance phases in board order:

**NEU → QUALIFIZIERT → ANGEBOT → VERHANDLUNG → GEWONNEN / VERLOREN**

These are Kanban board labels. They are NOT an enforced state machine. Any opportunity can move to any phase in any order. The backend enforces no transition rules.

---

## Users & Roles

Two roles: ADMIN and USER.

Both roles have the same access to all six CRM entities. Any logged-in user can read, create, edit, and delete Firma, Person, Abteilung, Adresse, Aktivitaet, and Chance.

ADMIN additionally unlocks admin-only areas: the agent-task dashboard and cron management. USER cannot reach those areas.

Three hardcoded users: `admin` (ADMIN), `user` (USER), `demo` (ADMIN).

Note: the user model carries a `permissions` array, but no middleware enforces it. Access control is role-based only.

---

## Out of Scope: System Tables

These three tables are app infrastructure. They are not CRM business data. For details see [docs/specs/SPEC-API-TASKS.md](SPEC-API-TASKS.md).

- **agent_task** — queue for autonomous-AI tasks.
- **cron_run** — audit log of scheduled cron runs.
- **sessions** — persisted login sessions.
