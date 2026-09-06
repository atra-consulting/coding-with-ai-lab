# Specifications: FEEDBACK-FORM-QUERY-PARAMS

## Summary

### Business Summary

The feedback form used at trainings currently serves exactly one training at a time. The training name, dates, and trainer names are baked into the page itself, so every new training needs a code change and a full re-deployment just to update two lines of text. This change lets one deployed feedback page serve any number of trainings, by carrying the training name and trainer name in the web address that participants reach through the QR code. Trainers get a small page where they type the training name and trainer name once; the QR code and address update instantly, ready to project or print. Existing QR codes already handed out keep working exactly as before.

### Technical Summary

`FeedbackFormComponent` reads two optional query parameters (`schulung`, `trainer`) via `ActivatedRoute` and uses them to override the hardcoded subtitle and trainer line, falling back to today's hardcoded defaults when absent or blank — no route or `app.config.ts` changes needed, since the existing auth-skip check matches on path, not query string. The same two values are added to the JSON payload posted to the Google Apps Script endpoint. `FeedbackQrComponent` gains two plain text inputs; on every keystroke it rebuilds the target `/feedback` URL with URL-encoded, trimmed, length-capped values and regenerates the QR canvas. No backend change, no new dependency — everything lives under `frontend/src/app/features/feedback/`.

---

## Source

Freeform request. A colleague already decided the mechanism: pass training name and trainer name as URL query parameters, since participants only ever reach the form through a scanned QR code and never see the raw address. Paraphrased from the colleague (originally in German): "To keep it simple, we'd solve this with query parameters, passing the training name and trainer name. They scan a QR code anyway, so nobody notices the address." This decision is settled — the query-parameter mechanism is not open for re-litigation in this PRD. What follows specifies how it is applied.

---

## Problem Statement

One feedback page serves one training today. The training name, the dates, and the trainer names are hardcoded. Running a new training means changing that text in code and redeploying the whole page — for a two-line update.

The business wants one deployed page address that works for any number of trainings, with no redeploy between them.

---

## Requirements

### 1. Two new address parameters

The feedback page accepts two optional pieces of information in its web address: the training name and the trainer name. Proposed names: `schulung` (training) and `trainer`. Trainers never type this address by hand — they scan a QR code that already carries it.

### 2. Feedback page uses them when present, falls back when absent

When a participant opens the feedback page through a link that carries a training name and/or trainer name, the page shows those instead of the hardcoded text. When either is missing — including any QR code already handed out for the current September 2026 bootcamp — the page shows exactly what it shows today. No existing QR code needs to change. Blank or whitespace-only values count as missing and fall back to the default, same as a value that is not there at all.

### 3. Every response is tagged with a training and trainer

Each submitted feedback response includes `schulung` (training name) and `trainer` (trainer name) fields, tagged with the values shown on the page — override or default, never blank. This lets responses landing in the shared spreadsheet later be grouped or filtered by training.

**Assumption to confirm:** this project only sends the response; it does not own the spreadsheet or the script that writes rows into it. Whoever owns that script may need to add a matching column to receive the new training/trainer tags. This PRD cannot verify or change that script or sheet.

### 4. A simple way to build a per-training link

The QR page gets two plain text boxes: training name and trainer name. As a trainer types into either box, the QR code shown on screen and the address printed below it update immediately to point at the feedback page with that training name and trainer name attached. Leaving both boxes empty reproduces today's page exactly — same address, same QR code.

No saving, no accounts, no validation beyond trimming stray spaces and a generous length limit per box (200 characters maximum) to avoid producing an unreadable QR code. Going over the limit quietly cuts off the extra text — no error message, no red banner. This is a lightweight tool for a trainer to use once per training, not a form to get validation feedback on.

---

## Special Instructions

- The query-parameter approach is a settled decision. Do not propose an alternative (config file, admin screen, database-backed training list).
- Do not change the question set, the spreadsheet integration mechanism, or the currently-unused "thank you" page/route.
- This feature stays entirely inside the feedback pages. No backend change.
- The feedback pages must keep working with no login and no backend reachable — this must not regress.

---

## Implementation Approach (high-level, no code)

**Feedback form page.** On load, the page checks its own web address for a training name and a trainer name. If found (and not blank after trimming), it shows them in place of the hardcoded subtitle and trainer line. If not found, it shows the same hardcoded text as today. When the participant submits the form, the same training name and trainer name (whichever the page ended up showing — override or default) are included in what gets sent to the spreadsheet, alongside the existing answers.

**QR page.** Two labeled text boxes are added above or beside the existing QR code: one for training name, one for trainer name. Typing into either box immediately rebuilds the target address (adding the training/trainer information only when a box is non-empty) and redraws the QR code and the address text shown underneath. Both empty reproduces the current bare feedback-page address and QR code, unchanged.

**No other page changes.** Routing, the login-skip behavior for these public pages, the question list, and the spreadsheet script itself are untouched.

---

## Test Strategy

Frontend unit tests only (Jasmine/Karma), matching this project's existing test approach for feedback-related components:

- Pre-implementation: confirm with the Google Apps Script / spreadsheet owner that `schulung` and `trainer` columns exist or will be added before this ships.
- Feedback form page: with a training/trainer value present, the page shows the override text; with either value absent or blank/whitespace-only, it falls back to the hardcoded default; the submitted data includes the training/trainer values in both cases.
- QR page: typing a training name and/or trainer name updates the shown address correctly (including when only one of the two is filled in); leaving both empty reproduces today's bare address; a value longer than 200 characters is cut off rather than rejected outright; special characters in the typed text end up correctly encoded in the shown address.

No backend involved, so no API test changes. No end-to-end browser testing beyond the unit-test level — this is a small internal tool, not a public product.

Manual check: open the feedback page with and without training/trainer information in the address and confirm the right text shows; open the QR page, type both fields, scan the resulting QR code on a phone and confirm it lands on the feedback page with both values pre-filled correctly.

---

## Non-Functional Requirements

- No new libraries. Everything needed already exists in this project.
- Existing QR codes for the September 2026 bootcamp keep working with zero changes needed on the trainers' side.
- The feedback pages keep working with no backend reachable and no login — this must not regress.
- The two new text boxes on the QR page follow the same language (German) and visual style as the rest of that page, and remain usable with a keyboard and a screen reader (proper labels).
- Internal tool for a training bootcamp — no need for admin UI, persistence, or a training registry.

---

## Success Criteria

- [ ] A feedback-page address carrying a training name and/or trainer name shows that text instead of the hardcoded default.
- [ ] A feedback-page address without either value shows exactly today's hardcoded text — no visual change for existing QR codes.
- [ ] Every submitted response includes a training name and a trainer name — override or default, never blank.
- [ ] The QR page has two text boxes; typing updates the QR code and the shown address live.
- [ ] Leaving both QR-page boxes empty reproduces today's exact QR code and address.
- [ ] A value longer than 200 characters is silently cut off, not rejected with an error.
- [ ] No backend files changed. No new dependency added.
- [ ] All existing and new frontend unit tests pass.

---

## Technical Notes

- `FeedbackFormComponent` (`frontend/src/app/features/feedback/feedback-form.component.ts`) currently exposes `readonly config = FEEDBACK_CONFIG` directly to the template. Create a config object, computed once at component initialization, that starts from `FEEDBACK_CONFIG` and applies query-param overrides for `subtitle` and `trainers` — do not mutate the `FEEDBACK_CONFIG` constant itself. Read params via `ActivatedRoute`'s `snapshot.queryParamMap` (inject `ActivatedRoute`; no new import needed for the router itself, but the component's `imports` array needs no change since template binding stays as `{{ }}` interpolation — no `[innerHTML]`, so no injection risk from untrusted query values).
- Treat a param as absent when `queryParamMap.get(...)` is `null` or, after `.trim()`, an empty string.
- `submitFeedback()` currently builds `payload` from `timestamp`, `schulungsDatum`, and one entry per question. Add `schulung` and `trainer` keys sourced from the same resolved values used for display (override-or-default), so the payload and the on-screen text can never disagree.
- `FeedbackQrComponent` (`frontend/src/app/features/feedback/feedback-qr.component.ts`) has no `imports` array today (template uses no directives). Add `FormsModule` to bind the two new text boxes (`ngModel`), and wire `(ngModelChange)` (or an `input` event) to rebuild `feedbackUrl` and call `generateQR()` again — `ngAfterViewInit()` currently calls `generateQR()` once; that call path needs to be reusable on every keystroke, not just on load. Note: `generateQR()` is currently declared `private`; it must become `public` (or gain a public wrapper) so the new input fields' change handler can invoke it on every keystroke, not just from `ngAfterViewInit()`.
- Building the target address: append `?schulung=...&trainer=...` only for fields that are non-empty after trimming and truncating to the cap; use `encodeURIComponent` for each value; omit the `?` entirely when both are empty, to keep the bare `/feedback` address exactly as today.
- Consider extracting the URL-building logic (trim, cap, encode, assemble) into a small pure, separately testable method on `FeedbackQrComponent` — keeps the unit tests in the Test Strategy section fast and independent of canvas rendering.
- `app.config.ts`'s public-route check (`window.location.pathname.startsWith(...)`) is unaffected by query strings — confirmed no change needed there or in `app.routes.ts`.

---

## Open Questions

1. Does the Google Apps Script / target spreadsheet already have columns for training name and trainer name, or does its owner need to add them before this ships? This repo has no visibility into that script or sheet.
2. Should the QR page pre-fill its two text boxes from its own current address (e.g., for a trainer re-visiting a bookmarked link)? Not requested; assumed out of scope — boxes start empty on every page load.
3. Is a single shared length cap (200 characters) acceptable for both the training-name and trainer-name boxes, or should they differ?

## Implementierung

_(wird nach Merge ergänzt)_
