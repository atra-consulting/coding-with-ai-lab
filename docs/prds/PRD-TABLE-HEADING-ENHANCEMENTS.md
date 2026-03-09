# PRD - Table Heading Enhancements

## Problem Statement
The current table headings in the CRM application are plain and don't provide information about the number of items or filtered items. Enhancing these headings with colors and dynamic row counts will improve the user experience and provide quick insights.

## Requirements
1.  **Colored Headings**: All headings (h2) within a `.page-header` should be colored using the `$primary` color (`#264892`).
2.  **Dynamic Row Counts**: All list views with ag-grid tables should display row counts next to the heading.
    *   Format: `Heading (Total)` (e.g., `Firmen (56)`) when no filters are active.
    *   Format: `Heading (Filtered/Total)` (e.g., `Firmen (25/56)`) when filters are active.
3.  **Real-time Updates**: The counts should update automatically when data is loaded, filtered, or otherwise changed in the grid.
4.  **Consistency**: This should be applied to all 9 list components using ag-grid.

## Implementation Approach
1.  **Styling**: Add a rule in `frontend/src/styles.scss` to style `.page-header h2`.
2.  **Logic**:
    *   Inject `GridApi` in list components via `onGridReady`.
    *   Listen to `modelUpdated` event to recalculate counts.
    *   Expose `totalRows` and `displayedRows` (filtered) to the template.
3.  **Template**: Update the `<h2>` tag in list templates to include the row count display logic.

## Test Strategy
1.  Verify that all table headings have the primary color.
2.  Verify that row counts appear correctly upon initial load.
3.  Verify that row counts update when applying/removing filters.
4.  Verify that row counts update when data changes (if applicable).
5.  Check across all 9 identified list components.

## Success Criteria
- All 9 list views show accurate row counts.
- Headings are visually consistent and colored.
- No regressions in table functionality.
