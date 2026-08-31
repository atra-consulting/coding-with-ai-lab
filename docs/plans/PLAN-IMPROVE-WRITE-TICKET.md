# Implementation Plan: IMPROVE-WRITE-TICKET

## Test Command
`(none — Markdown skill file; verified by skill-reviewer)`

## Goal

Fix four gaps in `.claude/skills/write-ticket/SKILL.md`. Evidence: ticket #86 had no plan, no business/technical split, a comment that stated facts before asking, and the run gave no final ticket URL.

Four requirements:
1. The run ALWAYS prints the new ticket ID and URL prominently at the very end.
2. The ticket `body` contains requirements AND a plan, split into a **business** section and a **technical** section.
3. The ticket `body` preserves the original input verbatim.
4. The refinement comment (Schritt 3a) contains ONLY questions — no statements.

All four live in one file: `.claude/skills/write-ticket/SKILL.md`. No code, no API change. The ticket API already accepts `{ type, title, body }` (create) and `{ body }` (comment) — everything is Markdown inside those fields.

## Tasks

### 1. Config — frontend URL for the printed ticket link (Konfiguration section)
- [ ] Add a config line: ticket URL base = env `APP_FRONTEND_URL`, default `http://localhost:7200`. The printed link is `<APP_FRONTEND_URL>/admin/tickets/<newId>`.
- [ ] Note the split: `APP_BASE_URL` (default `:7070`) is the backend API; `APP_FRONTEND_URL` (default `:7200`) is the board the human opens.
- [ ] The same `APP_FRONTEND_URL` builds the `## Feedback` source link `<APP_FRONTEND_URL>/admin/agent-tasks/<id>` (Task 3) and the final printed ticket link `<APP_FRONTEND_URL>/admin/tickets/<newId>` (Task 6).

### 2. Schritt 2 — extend the requirements-reviewer request
- [ ] The subagent already judges "gut genug" vs "muss verfeinert werden" and proposes a `type`. Extend its output contract to ALSO return the structured content the ticket body needs:
  - **Business section** — requirements + plan in plain, non-technical German. What changes for the user, why, and the high-level steps. No file paths, no code.
  - **Technical section** — requirements + plan for developers. Concrete steps, affected files/areas, approach. May name files/tables/endpoints.
  - **Open questions** — ONLY when the verdict is "muss verfeinert werden": a list of concrete questions phrased as questions (each ends with "?"). No statements, no findings, no "das existiert bereits" prose.
- [ ] State that both sections are always produced (even for a "gut genug" ticket) — the split is required on every ticket, per requirement 2.

### 3. Schritt 3 — restructure the created ticket body (requirement 2 + 3)
- [ ] Replace the current single-line `body` with a Markdown template that has these sections, in order:
  - `## Feedback` — **at the very beginning of the ticket body.** Quotes the original input verbatim as a Markdown blockquote (requirement 3), then links to the source task when one exists:
    - Queue/ID/URL mode: quote the agent-task `title` + `body` (+ metadata) verbatim, then add a link line `Quelle: <APP_FRONTEND_URL>/admin/agent-tasks/<id>` (an agent-task exists, so a link is available).
    - Freitext mode: quote the exact text the user passed verbatim. No source link (there is no agent-task) — omit the `Quelle:` line entirely, do not print a broken/empty link.
    - Preserve the quoted text unchanged — do not summarize or reword it.
  - `## Fachlich (für Business)` — the business section from Schritt 2.
  - `## Technisch (für Entwickler)` — the technical section from Schritt 2.
- [ ] Keep `type` and `title` as today. Keep the JSON-escaping note — the whole multi-section body must be escaped into the JSON string payload.
- [ ] Keep: new ticket lands `DEFINITION` + `owner=HUMAN`; do not change owner or status.

### 4. Schritt 3a — comment is questions only (requirement 4)
- [ ] Rewrite the comment rule: the comment body is a list of ONLY questions. Each line is a question ending in "?". No statements, no facts, no "das deckt die Anfrage bereits ab" prose. Derive the questions from the subagent's "Open questions" output (Schritt 2).
- [ ] Add an explicit negative example: do NOT restate what exists in the code; ask what the human must decide. (Ticket #86's comment stated three findings, then asked — that is now forbidden.)
- [ ] Keep the existing HTTP-code handling and the `author=HUMAN` note.

### 5. Schritt 3b — unchanged behavior, note the body still has both sections
- [ ] Clarify that even in the "gut genug" branch the ticket body already carries both business and technical sections (built in Schritt 3). No comment is posted. No status/owner change.

### 6. New final step — ALWAYS print ticket ID + URL prominently (requirement 1)
- [ ] Add a final step (after Schritt 4, applies to ALL four input modes) that ALWAYS prints, as the last output, a prominent block with the new ticket ID and full URL. Example:
  ```
  ============================================
  TICKET #<newId> ANGELEGT
  <APP_FRONTEND_URL>/admin/tickets/<newId>
  ============================================
  ```
- [ ] Requirement: this print happens on EVERY successful ticket creation — both the "zu dünn" (3a) and "gut genug" (3b) branches, and in every input mode (queue, ID, URL, freitext). It is the very last thing the run outputs.
- [ ] The Freitext-mode early-exit notes (in Schritt 3a/3b "im Freitext-Modus dort sofort beenden") must be updated so the final print still runs before exit — the print is AFTER those exits in flow terms, so reword to "beenden nach dem Abschluss-Print".
- [ ] Only skip the print when no ticket was created (e.g. create returned non-201 and the run already exited with an error).

### 7. Front-matter bookkeeping
- [ ] Bump `version` (1.1.0 → 1.2.0). Update `last-modified` to 2026-07-08.
- [ ] `allowed-tools` unchanged (Read, Bash, Task still suffice).

## Verification
- [ ] `skill-reviewer` reviews the updated SKILL.md: branching still complete, all four requirements covered, no contradictions between the new final-print step and the Freitext early-exits, JSON-escaping still noted for the multi-section body.
- [ ] Manual read-through: every input mode ends with the ticket ID + URL print; the comment section contains only questions; the body template has original input + both sections.

## Out of Scope
- No backend/API change. The ticket API already stores arbitrary Markdown in `body`.
- No change to who owns/where the ticket lands (`DEFINITION` + `HUMAN`).
- No change to the agent-task `/done` flow.
