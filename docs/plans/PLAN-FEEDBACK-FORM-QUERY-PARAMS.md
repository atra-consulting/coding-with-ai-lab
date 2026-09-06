# Implementation Plan: FEEDBACK-FORM-QUERY-PARAMS

## Summary

### Business Summary

The feedback form used at trainings currently serves exactly one training. This plan makes the same deployed page reusable for any training by carrying the training name and trainer name inside the QR code's web address. Trainers get a small page to type these two names once; the QR code and address update instantly. QR codes already handed out keep working exactly as before.

### Technical Summary

`FeedbackFormComponent` reads two optional query params (`schulung`, `trainer`) via `ActivatedRoute`, builds a non-mutated override of `FEEDBACK_CONFIG` for `subtitle`/`trainers`, and adds the resolved values to the outgoing payload. A genuine naming collision was found and must be worked around: the existing star-question at index 2 already uses the payload key `trainer` for a rating value, so the new trainer-name payload field must use a different key (`trainerName`) to avoid silently overwriting that question's answer. `FeedbackQrComponent` gains two `ngModel`-bound text inputs and a pure, unit-testable `buildFeedbackUrl()` method (trim → cap at 200 → encode → assemble) that drives both the displayed address and QR regeneration. No backend change, no new dependency.

## Test Command

```bash
cd frontend && npm run test:ci
```

## Tasks

### 1. FeedbackFormComponent — query-param override + payload
**Agent:** fe-coder
**Model:** sonnet — well-specified component change, `ActivatedRoute` snapshot-read pattern already used elsewhere in the codebase

- [ ] In `frontend/src/app/features/feedback/feedback-form.component.ts`, extract the hardcoded trainer names into a module-level constant `DEFAULT_TRAINER_NAMES = 'David Kreutzer, Daniel Wochnik, Benjamin Steimer'` and reference it inside `FEEDBACK_CONFIG.trainers` (`` `Trainer: ${DEFAULT_TRAINER_NAMES}` ``) so the rendered default string stays byte-identical to today's.
- [ ] Inject `ActivatedRoute` as a class field (`private readonly route = inject(ActivatedRoute)`), matching this codebase's `inject()` convention.
- [ ] In the constructor, read `this.route.snapshot.queryParamMap.get('schulung')` and `.get('trainer')`. Treat a value as absent when it is `null` or, after `.trim()`, empty.
- [ ] Compute `resolvedSchulung` (trimmed `schulung` param or `FEEDBACK_CONFIG.subtitle`) and `resolvedTrainerNames` (trimmed `trainer` param or `DEFAULT_TRAINER_NAMES`) as component fields (not template-bound directly).
- [ ] Replace `readonly config = FEEDBACK_CONFIG;` with a `readonly config` field assigned in the constructor to a new object spread from `FEEDBACK_CONFIG` with `subtitle: resolvedSchulung` and `` trainers: `Trainer: ${resolvedTrainerNames}` `` — do not mutate `FEEDBACK_CONFIG` itself. No template changes needed since the template already only reads `config.*`.
- [ ] In `submitFeedback()`, after the existing question loop, add `payload.schulung = this.resolvedSchulung;` and `payload.trainerName = this.resolvedTrainerNames;` — **use `trainerName`, not `trainer`**, because the payload object already carries a `trainer` key from the star question at `QUESTIONS[2]` (`key: 'trainer'`, "Aufbau und Struktur des Trainings"); reusing `trainer` would silently overwrite that question's star rating with the trainer's name string.
- [ ] Do not change `QUESTIONS`, the thank-you view, or any route/`app.config.ts` file.

**Acceptance criteria:**
- With `?schulung=Test-Training&trainer=Anna%20Muster` in the URL, the rendered subtitle is `Test-Training` and the trainer line is `Trainer: Anna Muster`.
- With no query params (or `?schulung=&trainer=%20`), the rendered subtitle and trainer line are byte-identical to today's hardcoded strings.
- Submitted payload always contains non-blank `schulung` and `trainerName` keys, whether or not params were present.
- Submitted payload's `trainer` key (star rating, question 3) is never overwritten by the trainer-name logic.

### 2. FeedbackQrComponent — live URL builder + two text inputs
**Agent:** fe-coder
**Model:** sonnet — standard `ngModel` wiring plus one small pure function, pattern already exists (`FormsModule` used the same way in `feedback-form.component.ts`)

- [ ] In `frontend/src/app/features/feedback/feedback-qr.component.ts`, add `imports: [FormsModule]` to the `@Component` decorator (the decorator has no `imports` array today — add the array itself, not just an entry into a nonexistent one).
- [ ] Add two public string fields, `schulungInput = ''` and `trainerInput = ''`.
- [ ] Add a pure, public method `buildFeedbackUrl(baseUrl: string, schulung: string, trainer: string): string` that: trims both inputs, caps each at 200 chars (`.slice(0, 200)` after trim), `encodeURIComponent`s each non-empty value, appends `?schulung=...&trainer=...` (only the non-empty ones, `&`-joined), and returns `` `${baseUrl}/feedback${query}` `` with `query` = `''` when both are empty. No DOM/signal access inside this method — plain input/output only, so it is directly unit-testable.
- [ ] Rename the existing `private generateQR()` to `public generateQR()` (or add a thin public wrapper) so it can be called outside `ngAfterViewInit()`.
- [ ] Add a method `onInputChange()` that recomputes `feedbackUrl` via `buildFeedbackUrl(window.location.origin, this.schulungInput, this.trainerInput)` and then calls `generateQR()`.
- [ ] Update `ngOnInit()` to call the same recompute logic instead of the hardcoded `` `${baseUrl}/feedback` `` (must still produce the identical bare URL when both inputs are empty, which they are on load).
- [ ] In `frontend/src/app/features/feedback/feedback-qr.component.html`, add two labeled text inputs above or below the QR/address block: one for training name, one for trainer name. Use `<label for="...">`/`id` pairing (screen-reader accessible), German labels (e.g. "Schulungsname", "Trainer"), `maxlength="200"` on each `<input>` as a belt-and-suspenders DOM-level cap, `[(ngModel)]` two-way binding, and `(ngModelChange)="onInputChange()"`.
- [ ] Style the two inputs to match the existing card's visual language (reuse `.form-control`-style rules or add a small scoped equivalent in `feedback-qr.component.scss`) — no new design system, no `ui-designer` needed for two plain text boxes.

**Acceptance criteria:**
- Typing in either box (leaving the other empty) updates the shown address to include only that one param, correctly `encodeURIComponent`-encoded.
- Both boxes empty (including initial load) reproduces exactly today's `${origin}/feedback` with no `?`.
- A value over 200 characters is truncated to 200 chars in the resulting URL — never rejected, no error shown.
- Special characters (spaces, `&`, `#`, umlauts) are correctly percent-encoded in the resulting address.
- Every keystroke regenerates the QR canvas (`generateQR()` called from `onInputChange()`).
- Both inputs have an associated `<label>` and are reachable/operable via keyboard alone.

### 3. Tests — FeedbackFormComponent
**Agent:** fe-test-coder
**Model:** sonnet — new spec file, needs several designed scenarios (route mocking, fetch mocking), not a mechanical task

Waits for Task 1.

- [ ] Create `frontend/src/app/features/feedback/feedback-form.component.spec.ts` matching this codebase's house style (see `agent-task-detail.component.spec.ts` for the `ActivatedRoute` mock pattern: `{ provide: ActivatedRoute, useValue: { snapshot: { queryParamMap: convertToParamMap({...}) } } }`, and `rechner.component.spec.ts` for the overall `describe`/`beforeEach`/`afterEach` layout).
- [ ] Mock `window.fetch` with `spyOn(window, 'fetch').and.resolveTo(new Response())` — no `HttpTestingController` involved since the component calls raw `fetch`, not `HttpClient`.
- [ ] Write the following scenarios:
  - override subtitle/trainer line shown when both params present and non-blank
  - fallback to hardcoded subtitle/trainer line when both params absent
  - fallback also applies when params are present but blank/whitespace-only (e.g. `?schulung=%20&trainer=`)
  - one-param-only case (schulung present, trainer absent) overrides only the subtitle, trainer line stays default
  - submitted payload includes `schulung` and `trainerName`, both non-blank, in the override case
  - submitted payload includes `schulung` and `trainerName`, both non-blank (equal to the hardcoded defaults), in the fallback case
  - submitted payload's `trainer` key (question 3's star rating) is unaffected by the new `trainerName` field — set a rating on question 3, submit, assert `payload.trainer` is the numeric rating, not the trainer name string

**Acceptance criteria:**
- All new `it(...)` blocks pass under `npm run test:ci`.
- No test hits a real `fetch`/network call (verify via the `fetch` spy call count/args, not a real request).
- Every test asserts one behavior (per `SPECS-testing.md` code standards).

### 4. Tests — FeedbackQrComponent
**Agent:** fe-test-coder
**Model:** sonnet — new spec file, several designed scenarios around the pure URL builder and DOM interaction

Waits for Task 2. Can run in parallel with Task 3 (different file, no shared dependency).

- [ ] Create `frontend/src/app/features/feedback/feedback-qr.component.spec.ts`, standalone-component `TestBed` setup (`imports: [FeedbackQrComponent]`, no HTTP involved — `QRCode.toCanvas` runs against a real `<canvas>` under Karma's `ChromeHeadlessNoSandbox`, no need to mock it).
- [ ] Write scenarios primarily against the pure `buildFeedbackUrl()` method (fast, no DOM needed) plus a handful of DOM-level tests for the two-way binding:
  - both empty → returns exactly `${baseUrl}/feedback`
  - only `schulung` filled → returns `${baseUrl}/feedback?schulung=<encoded>`, no `trainer` param
  - only `trainer` filled → returns `${baseUrl}/feedback?trainer=<encoded>`, no `schulung` param
  - both filled → both params present, `&`-joined, in `schulung` then `trainer` order
  - value with spaces/`&`/umlauts is correctly `encodeURIComponent`-encoded
  - value over 200 chars is truncated to exactly 200 chars pre-encoding, not rejected
  - leading/trailing whitespace is trimmed before capping and encoding
  - typing into the `schulungInput`/`trainerInput` fields updates `feedbackUrl()` to match `buildFeedbackUrl()`'s output
  - both label elements exist and are correctly associated (`for`/`id`) with their inputs

**Acceptance criteria:**
- All new `it(...)` blocks pass under `npm run test:ci`.
- The 200-char cap and encoding tests exercise `buildFeedbackUrl()` directly (not just DOM interaction), so failures point at the exact broken step (trim/cap/encode/assemble).

### 5. Review — component code
**Agent:** fe-reviewer
**Model:** sonnet — reviewing a small, well-scoped change across two files

Waits for Tasks 1 and 2.

- [ ] Review `feedback-form.component.ts` for: no mutation of `FEEDBACK_CONFIG`, correct null/blank handling of query params, the `trainerName` vs `trainer` payload-key fix is present and correct, template stays `{{ }}` interpolation only (no `[innerHTML]`).
- [ ] Review `feedback-qr.component.ts`/`.html` for: `buildFeedbackUrl()` is pure (no signal/DOM reads inside it), `generateQR()` visibility change is minimal, inputs have proper `<label>` associations, `maxlength="200"` present, no new dependency added, no unrelated file touched (`app.config.ts`, `app.routes.ts`, question set, thank-you page must be untouched).
- [ ] Confirm no backend file was changed.

**Acceptance criteria:**
- Review comments (if any) are addressed by fe-coder before Task 7 runs.
- Sign-off confirms both success criteria checklists above are met in the actual diff, not just described.

### 6. Review — test code
**Agent:** fe-test-reviewer
**Model:** sonnet — reviewing two new spec files against house-style conventions

Waits for Tasks 3 and 4. Can run in parallel with Task 5.

- [ ] Confirm both spec files follow the conventions in `SPECS-testing.md` and match sibling specs' structure (`describe`/`beforeEach`/`afterEach`, one behavior per `it`, no real HTTP/fetch escapes).
- [ ] Confirm the `trainer`-key-collision regression test (Task 3) is present and actually asserts against the star-rating value, not just presence of the key.
- [ ] Confirm the 200-char-cap and special-character-encoding tests in Task 4 assert exact expected strings, not just "does not throw".

**Acceptance criteria:**
- Review comments (if any) are addressed by fe-test-coder before Task 7 runs.

### 7. Verification — full frontend suite
**Agent:** fe-test-runner
**Model:** haiku — mechanical: run the fixed command, report pass/fail

Waits for Tasks 5 and 6 (all review feedback incorporated).

- [ ] Run `cd frontend && npm run test:ci`.
- [ ] Report the full pass/fail summary, including any pre-existing failures unrelated to this change (do not silently attribute unrelated failures to this work).

**Acceptance criteria:**
- All specs pass, including the two new files from Tasks 3 and 4, and every pre-existing spec file listed in `SPECS-testing.md`'s "Existing spec files" table.

## Parallelism

- Tasks 1 and 2 run in parallel — different files, no shared state.
- Task 3 waits for Task 1. Task 4 waits for Task 2. Tasks 3 and 4 then run in parallel with each other.
- Task 5 waits for Tasks 1 and 2. Task 6 waits for Tasks 3 and 4. Tasks 5 and 6 run in parallel with each other.
- Task 7 waits for Tasks 5 and 6.

## Tests

Concrete scenarios to implement (single source of truth for exact expected values):

**FeedbackFormComponent**
- `?schulung=Test-Training&trainer=Anna%20Muster` → subtitle `"Test-Training"`, trainer line `"Trainer: Anna Muster"`.
- No params → subtitle `"Agentic Engineering Bootcamp — 03.–04.09.2026"`, trainer line `"Trainer: David Kreutzer, Daniel Wochnik, Benjamin Steimer"` (today's exact strings).
- `?schulung=%20&trainer=` (blank after trim) → same fallback as no params.
- `?schulung=Only-This` (trainer absent) → subtitle overridden, trainer line stays default.
- Submitted payload has non-blank `schulung` and `trainerName` in both the override and fallback cases.
- Submitted payload's `trainer` key equals the question-3 star rating (1–5), never the trainer-name string.

**FeedbackQrComponent**
- Both inputs empty → address is exactly `${origin}/feedback`.
- Only `schulungInput` filled → `${origin}/feedback?schulung=<encoded>`.
- Only `trainerInput` filled → `${origin}/feedback?trainer=<encoded>`.
- Both filled → `${origin}/feedback?schulung=<encoded>&trainer=<encoded>`.
- Input `"A&B üö"` → correctly `encodeURIComponent`-encoded in the resulting URL.
- Input of 250 `'x'` characters → resulting URL carries exactly 200 `'x'` characters, no error/rejection.
- Input `"  Padded  "` → resulting URL carries `"Padded"` (trimmed) before encoding.
- Typing (triggering `(ngModelChange)`) updates `feedbackUrl()` live to match `buildFeedbackUrl()`'s output for the current input values.

## Open Questions

1. **Naming collision, resolved in this plan:** the PRD's Requirement 3 names the new payload field `trainer`, but `QUESTIONS[2]` (star rating, "Aufbau und Struktur des Trainings") already uses payload key `trainer`. This plan uses `trainerName` for the new field to avoid silently overwriting that question's answer. Confirm with whoever owns the Google Apps Script/spreadsheet that a column named `trainerName` (not `trainer`) is acceptable.
2. Whether the Google Apps Script/spreadsheet already has columns for `schulung`/`trainerName` is outside this repo's visibility — worth a pre-implementation check with the script owner, not a blocker for writing the code.
3. The trainer line's `"Trainer: "` prefix is preserved for the override case (override text becomes `"Trainer: <trainer param>"`, not the raw param alone) to keep the on-page visual style consistent with today's default.
4. **Reviewed and decided — template-driven forms stay.** `docs/specs/SPECS-frontend.md` recommends Reactive Forms (`FormBuilder`) for CRM entity forms. `FeedbackFormComponent`/`FeedbackQrComponent` already predate this task on template-driven forms (`FormsModule`/`ngModel`) and sit entirely outside the CRM domain (standalone, no backend, no login — see `AGENTS.md`'s domain-bound-agent note). Converting either component to Reactive Forms is out of scope here: it's not required by the PRD, it would rewrite working code the PRD didn't ask to touch, and it adds real risk to a public page in active use for a live bootcamp. Task 2 keeps the existing `FormsModule`/`ngModel` pattern for the two new inputs, consistent with the file's current style.

## Relevant Files

- `/Users/karsten/workspaces/fh/repos/coding-with-ai-lab-2/frontend/src/app/features/feedback/feedback-form.component.ts`
- `/Users/karsten/workspaces/fh/repos/coding-with-ai-lab-2/frontend/src/app/features/feedback/feedback-form.component.html`
- `/Users/karsten/workspaces/fh/repos/coding-with-ai-lab-2/frontend/src/app/features/feedback/feedback-qr.component.ts`
- `/Users/karsten/workspaces/fh/repos/coding-with-ai-lab-2/frontend/src/app/features/feedback/feedback-qr.component.html`
- `/Users/karsten/workspaces/fh/repos/coding-with-ai-lab-2/frontend/src/app/features/feedback/feedback-qr.component.scss`
- New: `/Users/karsten/workspaces/fh/repos/coding-with-ai-lab-2/frontend/src/app/features/feedback/feedback-form.component.spec.ts`
- New: `/Users/karsten/workspaces/fh/repos/coding-with-ai-lab-2/frontend/src/app/features/feedback/feedback-qr.component.spec.ts`
- Reference (house style): `/Users/karsten/workspaces/fh/repos/coding-with-ai-lab-2/frontend/src/app/features/admin/agent-tasks/agent-task-detail.component.spec.ts`, `/Users/karsten/workspaces/fh/repos/coding-with-ai-lab-2/frontend/src/app/features/produktivitaet/rechner.component.spec.ts`
- Spec doc: `/Users/karsten/workspaces/fh/repos/coding-with-ai-lab-2/docs/specs/SPECS-testing.md`
- Not touched (confirmed unaffected): `/Users/karsten/workspaces/fh/repos/coding-with-ai-lab-2/frontend/src/app/app.config.ts`, `/Users/karsten/workspaces/fh/repos/coding-with-ai-lab-2/frontend/src/app/app.routes.ts`
