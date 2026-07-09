# Implementation Plan: ADD-OPTIONAL-COMMENT

## Goal

`do-semi-automatic` SKILL.md: when the caller passes a ticket **ID** or **URL**, allow an **optional comment** after it. Pass that comment as-is to `/plan-and-do` when the ticket gets built.

## Test Command

`cd backend && npm test`

> Note: This change touches only `.claude/skills/do-semi-automatic/SKILL.md` (Markdown). No application code changes. The backend Playwright suite does not exercise skill files. Real verification: `skill-reviewer` subagent + a manual parse walk-through of the new argument rules. Step 9 records this — no meaningful automated test run.

## Current Behavior

The `## Parameter` section defines three input modes:
1. Empty → find next Ready+AI ticket (board branch).
2. Pure number → ticket ID. The **whole** argument must be a number.
3. Ticket URL → the **whole** argument must be a URL, no whitespace.

Any non-empty argument that is neither a pure number nor a pure URL → error and exit ("kein Freitext-Modus"). Step 3b passes only the ticket title + body + resolved HUMAN decisions to `/plan-and-do`.

## Target Behavior

- ID and URL modes accept an **optional trailing comment**: the argument is `<first-token> [rest…]`. First token = ID or URL. Everything after the first whitespace = the optional comment (freeform, may contain spaces).
- Empty (board) mode stays as-is — no comment (no ticket named).
- Invalid only when the **first token** is neither a pure number nor a URL.
- When the ticket is built (Step 3b), the comment is appended **verbatim** to the description handed to `/plan-and-do`, clearly labelled as an operator note.
- If the ticket is judged under-specified (Step 3a → back to Definition), `/plan-and-do` is never called, so the comment is simply unused. The requirements-reviewer in Step 3 may also read the comment as extra operator context.

## Design Decision — where the comment goes

**Recommendation:** append the comment to the `/plan-and-do` **description** string, labelled so it is unmistakably the operator's words, e.g.:

> `<Ticket-Titel + Body + gelöste HUMAN-Entscheidungen>` + newline + `Zusätzlicher Hinweis vom Aufruf (unverändert übernommen): <comment>`

Rationale: guarantees the comment reaches `/plan-and-do` verbatim in one place, needs no change to how the skill invokes the sub-skill, and matches "passed on as is". (Alternative — a separate special-instructions arg — is not used because the skill invokes `/plan-and-do` with a single quoted description today.)

## Tasks

### 1. Frontmatter
- [ ] `argument-hint` → `"[ticket-id | ticket-url] [comment]"`
- [ ] `version` → `1.2.0`
- [ ] `last-modified` → `2026-07-09`

### 2. `## Parameter` section
- [ ] Reword modes 2 and 3: first token is the ID / URL; an optional comment may follow (freeform, may contain spaces). Everything after the first whitespace is the comment.
- [ ] Update the "kein Freitext-Modus" rule: only the **first token** must be a pure number or a URL. Trailing text after it is the optional comment, not an error. Prose whose first token is neither a number nor a URL is still invalid → error and exit.
- [ ] Store the parsed comment as a named value (e.g. "Kommentar") for later use. Empty when absent.

### 3. Step 1 — ID / URL branches
- [ ] Note that the optional comment is captured alongside the ID (no effect on loading / owner / status checks). Keep the ID/URL branch logic otherwise unchanged.

### 4. Step 3b — build → pass comment to `/plan-and-do`
- [ ] In the description passed to `/plan-and-do`, append the operator comment verbatim (labelled), only when a comment was supplied. When absent, behavior is unchanged.

### 5. Step 3 — judgment (light touch)
- [ ] Add one sentence: the requirements-reviewer may also consider the optional comment as extra operator context when judging build-or-return.

### 6. `docs/SKILLS.md` — user-facing doc
- [ ] `### /do-semi-automatic` section (line ~101): update the **Argumente** line to mention the optional comment after ID/URL, and that it is forwarded as-is to `plan-and-do` when the ticket is built.
- [ ] Add an example line showing `/do-semi-automatic 7 "nur das Backend anfassen"`.
- [ ] Keep the German writing style (short, simple, no passive).

## Tests / Verification

### Parse walk-through (manual, in review)
- [ ] `8` → ID 8, no comment.
- [ ] `8 bitte nur das Backend anfassen` → ID 8, comment = "bitte nur das Backend anfassen".
- [ ] `http://localhost:7200/admin/tickets/11` → ID 11, no comment.
- [ ] `http://localhost:7200/admin/tickets/11 fokus auf Validierung` → ID 11, comment = "fokus auf Validierung".
- [ ] `` (empty) → board mode, no comment.
- [ ] `Die Seite hängt` (first token not number/URL) → invalid, error + exit.
- [ ] `.../tickets/board` → still invalid (no `tickets/<digits>`), error + exit.

### skill-reviewer
- [ ] Run `skill-reviewer` on the edited SKILL.md. Confirm: branching complete, no contradictions with the "kein Freitext-Modus" rule, comment forwarded only in Step 3b, headless constraints intact (no AskUserQuestion), German writing style preserved.
