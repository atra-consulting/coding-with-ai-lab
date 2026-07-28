# Implementation Plan: BA-AGENTS-PRD-SCOPE

## Goal

Make `ba-writer` and `ba-reviewer` treat PRDs as high-level documents. Keep technical details out of PRDs. Technical details belong in the plan.

## Test Command

`N/A (docs-only)` — no automated tests. Verify with `skill-reviewer` + `ba-reviewer`.

## Problem

Both agents blur the PRD/plan line.

- `ba-writer` tells the spec author to "reference these technologies when relevant" (Context Awareness). This pulls tech detail into PRDs.
- `ba-reviewer` says "consider how requirements translate to this specific tech stack" and "think like a developer who needs to implement this." This can push the reviewer to demand implementation detail in a PRD.

A PRD answers **what** and **why**. The plan answers **how**. The skill itself already skips the PRD for small tasks and puts code-level steps in the plan.

## What "high-level" means

PRD keeps: problem, solution, users, requirements, acceptance criteria, scope, open questions.

PRD avoids: file paths, route/API signatures, schema or SQL, library/version choices, code samples, step-by-step implementation. Those go in the plan.

## Tasks

### 1. Update `ba-writer.md`

- [ ] Add a short rule near "Document Structure": PRDs are high-level. They state what and why, not how.
- [ ] List what stays out of a PRD: file paths, API signatures, schema/SQL, library/version picks, code, step-by-step build steps. Say these belong in the plan.
- [ ] Reword "Context Awareness": reference tech only at a high level, and only when it affects scope or feasibility. Keep deep technical design in the plan, not the spec.
- [ ] Keep the writing-style rules and requirement format intact.

### 2. Update `ba-reviewer.md`

- [ ] Add a check: a PRD must NOT carry low-level technical detail. Flag tech detail that belongs in the plan.
- [ ] Add the inverse: do NOT fault a PRD for missing implementation detail. That detail belongs in the plan, not the PRD.
- [ ] Reword "Project Context" / "Your Mindset" so "translate to the tech stack" means feasibility checks, not demanding implementation detail in the PRD.
- [ ] Note that plans (not PRDs) are the right home for file paths, APIs, schema, and code.
- [ ] Keep the confidence scoring and false-positive rules intact.

### 3. Consistency

- [ ] Use the same wording for the PRD/plan split in both files.
- [ ] Match the project writing style: short sentences, simple words, no passive voice, fragments OK.

## Tests

Test-inappropriate change (docs only). No unit or API tests.

### Verification
- [ ] `skill-reviewer` reviews both agent files for correctness and structure.
- [ ] `ba-reviewer` confirms the PRD/plan guidance is clear and consistent.
- [ ] Manual read: both files still parse (valid frontmatter, no broken sections).
