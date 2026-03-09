# Implementation Plan: SIDEBAR-COLLAPSIBLE

## Test Command
`npm test --prefix frontend -- --watch=false --browsers=ChromeHeadless`

## Tasks

### 1. State Management (LayoutService)
- [ ] Create `frontend/src/app/core/services/layout.service.ts`.
- [ ] Implement a `collapsed` signal (boolean).
- [ ] Add persistence to `localStorage` (key: `sidebar_collapsed`).
- [ ] Add a `toggleSidebar()` method.

### 2. Layout Integration (AppComponent)
- [ ] Update `frontend/src/app/app.ts` to inject `LayoutService` and expose it.
- [ ] Update `frontend/src/app/app.html` to apply a `.sidebar-collapsed` class to the layout container (the `.d-flex` div) when the sidebar is collapsed.

### 3. Sidebar Component (SidebarComponent)
- [ ] Update `frontend/src/app/layout/sidebar/sidebar.component.ts`:
  - [ ] Inject `LayoutService`.
  - [ ] Import `faBars` and `faChevronLeft` / `faChevronRight` (or similar) from FontAwesome.
- [ ] Update `frontend/src/app/layout/sidebar/sidebar.component.html`:
  - [ ] Add a toggle button at the top of the sidebar.
  - [ ] Use `@if (!layoutService.collapsed())` to hide section headers and navigation item labels.
  - [ ] Ensure FontAwesome icons remain visible and centered.

### 4. Styling (Styles.scss)
- [ ] Update `frontend/src/styles.scss`:
  - [ ] Introduce CSS variables for sidebar width (e.g., `--sidebar-width: 250px`).
  - [ ] Define `.sidebar-collapsed` scope (at the `.d-flex` level) to override `--sidebar-width` to `60px`.
  - [ ] Update `.sidebar` and `.main-content` to use `var(--sidebar-width)`.
  - [ ] Add `transition: width 0.3s ease, margin-left 0.3s ease` for smooth animation.
  - [ ] Ensure `.sidebar-footer` is handled gracefully when collapsed (e.g., hide text).

### 5. Verification
- [ ] Run automated tests: `npm test --prefix frontend -- --watch=false --browsers=ChromeHeadless`.
- [ ] Manual check: verify persistence by refreshing the page.
- [ ] Manual check: verify transition is smooth.

## Tests
### Unit Tests
- [ ] Create/Update `LayoutService` test to verify state toggling and localStorage persistence.
- [ ] (Optional) Add test to `SidebarComponent` to verify icons are still present when labels are hidden (if test file created).
```
