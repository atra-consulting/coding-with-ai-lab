# Implementation Plan: ADD-FEEDBACK-BUTTON

## Source

Freeform user request: *"There is a user-rating endpoint at '/feedback'. Add it as a button to bottom of the sidebar."*

## Context (verified)

- `/feedback` is an existing **Angular route**, not a backend endpoint. Lazy-loads `FeedbackFormComponent` at `frontend/src/app/features/feedback/feedback-form.component.ts` (see `frontend/src/app/app.routes.ts:15-19`).
- Route is **public** — whitelisted in `frontend/src/app/core/interceptors/auth.interceptor.ts:19`. No auth guard. Any signed-in CRM user can navigate there.
- Sidebar component lives at `frontend/src/app/layout/sidebar/sidebar.component.{ts,html}`.
- Sidebar sections are declared in a `sections: NavSection[]` array; template loops over them. Each item has `label`, `route`, `icon`, optional `requiredRole`.
- Current bottom of the sidebar (template order):
  1. Nav sections (stacked `<ul>` blocks)
  2. `<div class="mt-auto sidebar-toggle-container">` — collapse toggle button (pushed to bottom via `mt-auto`)
  3. `<div class="sidebar-footer">` — "Made by atra.consulting"

## Placement decision

Insert the Feedback button **above the collapse toggle, still anchored to the bottom**. Render order (top → bottom):

1. Existing nav sections
2. **NEW** Feedback nav item (bottom-anchored via `mt-auto` on its wrapper `<ul>`)
3. Collapse toggle (loses its `mt-auto` — the Feedback wrapper owns the spacer now)
4. Footer

The Feedback item uses the same `<ul class="nav flex-column">` / `<li class="nav-item">` / `<a class="nav-link">` markup as regular sections so it inherits styling, collapsed-mode tooltip, and `routerLinkActive`.

Icon: `faCommentDots` from `@fortawesome/free-solid-svg-icons` (speech bubble with dots — reads as "send us feedback"; `faStar` would imply rating only). No new npm dependency; FA Solid is already imported in this file.

No `requiredRole`: all authenticated users see it.

## Test Command

`cd frontend && npx ng test --watch=false --browsers=ChromeHeadless`

## Tasks

### 1. Sidebar component (TypeScript)

- [ ] `frontend/src/app/layout/sidebar/sidebar.component.ts`:
  - [ ] Import `faCommentDots` from `@fortawesome/free-solid-svg-icons`.
  - [ ] Add a `bottomItems: NavItem[]` field with one entry: `{ label: 'Feedback', route: '/feedback', icon: faCommentDots }`. Use a separate field (not a new section in `sections`) so the template can anchor it to the bottom with dedicated markup.

### 2. Sidebar template (HTML)

- [ ] `frontend/src/app/layout/sidebar/sidebar.component.html`:
  - [ ] Add a bottom-anchored `<ul class="nav flex-column mt-auto">` block **after** the existing `@for (section of sections)` loop and **before** the `sidebar-toggle-container` div. Render each entry from `bottomItems` with the same `nav-item` / `nav-link` / `routerLinkActive` / collapsed-mode `[title]` markup used in the section loop. Track by `item.route`.
  - [ ] Remove `mt-auto` from the existing `sidebar-toggle-container` div. The new bottom `<ul>` now owns the flex spacer; leaving both on `mt-auto` would put a gap between them.
  - [ ] The new `<ul>` must not include a `nav-section-header` — no section title for bottom-anchored utility items.

### 3. Sidebar spec (Jasmine/Karma)

- [ ] `frontend/src/app/layout/sidebar/sidebar.component.spec.ts`:
  - [ ] Add a test: renders a "Feedback" link pointing to `/feedback` for any authenticated user (use `regularUser`). Query the rendered DOM for an anchor with `href="/feedback"` (or whose text contains "Feedback") and assert it exists.
  - [ ] Add a test: the Feedback link stays rendered when the sidebar is collapsed (`mockLayoutService.collapsed.set(true)`), because the icon-only mode must still be clickable.

### 4. Verification

- [ ] Run the test command above. All existing sidebar tests still pass; the two new tests pass.
- [ ] Start the app with `./start.sh`, sign in, visually confirm the Feedback button sits above the collapse toggle, both expanded and collapsed. Clicking it loads `/feedback`. `routerLinkActive` highlights it when on `/feedback`.
- [ ] No new ESLint errors; no new Angular build warnings (`cd frontend && npx ng build`).

## Out of scope

- Backend changes — none needed; `/feedback` is a frontend-only public route.
- Authentication/authorization of `/feedback` — already public and unchanged.
- Restyling the feedback form or QR route.
- Adding the button to the navbar or other layouts.

## Risks

- If the existing `mt-auto` on the toggle container is load-bearing in unexpected ways (e.g., a CI-screenshot test), the layout may shift. Mitigation: manual visual verification in both expanded and collapsed states.
- Karma spec queries that look for an `<a>` with `href="/feedback"` can be brittle if Angular changes how `routerLink` renders; fall back to text-content matching if `By.css('a[href="/feedback"]')` returns null.
