# Implementation Plan: SIDEBAR-COLLAPSIBLE

## Test Command
`npm test --prefix frontend -- --watch=false --browsers=ChromeHeadless`

## Tasks

### 1. State Management (LayoutService)
- [x] Create `frontend/src/app/core/services/layout.service.ts`.
- [x] Implement a `collapsed` signal (boolean).
- [x] Add persistence to `localStorage` (key: `sidebar_collapsed`).
- [x] Add a `toggleSidebar()` method.

### 2. Layout Integration (AppComponent)
- [x] Update `frontend/src/app/app.ts` to inject `LayoutService` and expose it.
- [x] Update `frontend/src/app/app.html` to apply a `.sidebar-collapsed` class to the layout container (the `.d-flex` div) when the sidebar is collapsed.

### 3. Sidebar Component (SidebarComponent)
- [x] Update `frontend/src/app/layout/sidebar/sidebar.component.ts`:
  - [x] Inject `LayoutService`.
  - [x] Import `faBars` and `faChevronLeft` / `faChevronRight` (or similar) from FontAwesome.
- [x] Update `frontend/src/app/layout/sidebar/sidebar.component.html`:
  - [x] Add a toggle button at the top of the sidebar.
  - [x] Use `@if (!layoutService.collapsed())` to hide section headers and navigation item labels.
  - [x] Ensure FontAwesome icons remain visible and centered.

### 4. Styling (Styles.scss)
- [x] Update `frontend/src/styles.scss`:
  - [x] Introduce CSS variables for sidebar width (e.g., `--sidebar-width: 250px`).
  - [x] Define `.sidebar-collapsed` scope (at the `.d-flex` level) to override `--sidebar-width` to `60px`.
  - [x] Update `.sidebar` and `.main-content` to use `var(--sidebar-width)`.
  - [x] Add `transition: width 0.3s ease, margin-left 0.3s ease` for smooth animation.
  - [x] Ensure `.sidebar-footer` is handled gracefully when collapsed (e.g., hide text).

### 5. Verification
- [x] Run automated tests: `npm test --prefix frontend -- --watch=false --browsers=ChromeHeadless`.
- [x] Manual check: verify persistence by refreshing the page.
- [x] Manual check: verify transition is smooth.

## Tests
### Unit Tests
- [x] Create/Update `LayoutService` test to verify state toggling and localStorage persistence.
- [ ] (Optional) Add test to `SidebarComponent` to verify icons are still present when labels are hidden (if test file created).
```
