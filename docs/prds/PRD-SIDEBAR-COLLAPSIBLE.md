# PRD: Collapsible Sidebar

## Source
- User Request: "make the left sidebar collapsible"
- Reference: Visuals from previous failed attempts (sidebar toggle button)

## Problem Statement
The current sidebar is fixed at 250px width. On smaller screens or when users want to focus on data-heavy views (like ag-grid tables), the sidebar takes up significant horizontal space. There is no way to collapse it to an icon-only or hidden view.

## Requirements
- The sidebar must be collapsible/expandable by the user.
- A toggle button should be clearly visible (e.g., in the navbar or at the top/bottom of the sidebar).
- When collapsed:
  - The sidebar should reduce its width (e.g., to 60px).
  - Navigation item labels and section headers should be hidden.
  - Only icons should remain visible.
  - The main content area must expand to fill the available space.
- When expanded:
  - The sidebar should return to its full width (250px).
  - Labels and headers should be visible again.
- The state (collapsed/expanded) should ideally be persisted (local storage) so it remains consistent across page reloads.
- Smooth transition/animation during collapsing/expanding.

## Implementation Approach (High-Level)
1.  **State Management**: Add a `collapsed` signal or boolean in a service (e.g., `LayoutService`) or directly in `SidebarComponent` if it's the only consumer.
2.  **UI Components**:
    - Add a toggle button (hamburger or chevron icon).
    - Update `SidebarComponent` template to conditionally hide labels/headers based on `collapsed` state.
    - Update `SidebarComponent` styles to handle the two width states.
3.  **Layout Adjustment**:
    - Update the main content margin/padding to adapt to the sidebar's width.
    - Use CSS variables or classes to manage the widths consistently.
4.  **Animation**: Use CSS transitions for the `width` and `margin-left` properties.

## Test Strategy
- **Visual Verification**:
  - Click toggle button and verify sidebar width changes.
  - Verify labels/headers disappear when collapsed.
  - Verify icons remain centered/visible when collapsed.
  - Verify main content expands/contracts correctly.
- **Persistence**:
  - Collapse sidebar, refresh page, verify it's still collapsed.
- **Responsiveness**:
  - Ensure it works correctly across different viewport sizes.

## Success Criteria
- Sidebar successfully toggles between 250px and a narrow (icon-only) state.
- Main content area adjusts its width accordingly without overlapping or leaving empty gaps.
- User experience is smooth (animations).
- State is persisted across sessions.
