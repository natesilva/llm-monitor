# Feature Specification: Clean Up Web UI Stats Display

**Feature Branch**: `014-cleanup-web-stats`  
**Created**: 2026-05-11  
**Status**: Draft  
**Input**: User description: "Clean up the stats displayed in the web UI. There are too many stats in the per-configuration stat cards. Show only AVG TPS, AVG TT100T and TPS STDDEV. Make the comparison graph show TT100T instead of TPS and add a small note to it that 'lower is better'."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Focused Stat Cards (Priority: P1)

A user viewing the per-configuration dashboard tiles wants to quickly assess the key performance characteristics of each model configuration without being overwhelmed by too many numbers. They should see only the three most essential summary statistics: average throughput (Avg TPS), average time-to-100-tokens latency (Avg TT100T), and throughput consistency (TPS StdDev).

**Why this priority**: This is the primary information a user needs at a glance — throughput, early-token latency, and consistency. Removing extraneous stats reduces cognitive load and makes the dashboard scannable.

**Independent Test**: Can be fully tested by loading the dashboard and verifying that each tile card shows exactly three stat values (Avg TPS, Avg TT100T, TPS StdDev) and no others.

**Acceptance Scenarios**:

1. **Given** a dashboard with one or more configuration tiles with data, **When** the page loads, **Then** each tile card displays exactly three stats: Avg TPS, Avg TT100T, and TPS StdDev
2. **Given** a configuration with TT100T data unavailable (null), **When** the tile renders, **Then** the Avg TT100T stat shows "N/A" while Avg TPS and TPS StdDev display normally
3. **Given** a tile that refreshes on the auto-refresh interval, **When** new data arrives, **Then** the three stat values update without adding or removing any stat items

---

### User Story 2 - TT100T Comparison Graph (Priority: P1)

A user comparing multiple configurations side-by-side wants to see how they differ in early-token generation latency (TT100T) rather than throughput, since TT100T better reflects interactive responsiveness. The graph should clearly indicate that lower values are better, so the user does not misinterpret the directionality.

**Why this priority**: TT100T is the most actionable metric for comparing user-perceived responsiveness across configurations. The "lower is better" note prevents misinterpretation.

**Independent Test**: Can be fully tested by selecting multiple configurations for comparison and verifying the graph plots TT100T values with an appropriate note.

**Acceptance Scenarios**:

1. **Given** two or more configurations selected for comparison, **When** the comparison chart renders, **Then** the Y-axis displays TT100T values in milliseconds
2. **Given** the comparison chart is visible, **When** the user views the chart area, **Then** a note reading "lower is better" is displayed near the chart
3. **Given** a configuration with no TT100T data points, **When** the comparison chart renders, **Then** that configuration's data is excluded from the chart without causing errors

---

### Edge Cases

- What happens when all selected configurations have null TT100T values? The comparison chart should show an empty state or a message indicating no TT100T data is available.
- What happens when a tile has no data points at all? The existing "No data yet" empty state should remain unchanged, with no stat values shown.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Each per-configuration stat card MUST display exactly three summary statistics: Avg TPS, Avg TT100T, and TPS StdDev
- **FR-002**: The comparison graph MUST plot TT100T (in milliseconds) on the Y-axis instead of TPS
- **FR-003**: The comparison graph section MUST display a visible note indicating "lower is better"
- **FR-004**: When TT100T data is null for a configuration, the Avg TT100T stat MUST display "N/A"
- **FR-005**: Data points with null TT100T values MUST be excluded from the comparison graph datasets

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Each configuration tile card shows exactly 3 stat values — no more, no fewer — and they are Avg TPS, Avg TT100T, and TPS StdDev
- **SC-002**: The comparison graph Y-axis label reads "TT100T (ms)" and plots time-to-100-tokens values
- **SC-003**: A "lower is better" annotation is visible within or adjacent to the comparison chart
- **SC-004**: Users can compare configurations by early-token latency at a glance without misinterpreting the metric direction

## Assumptions

- The TT100T metric data is already being collected and stored (added in a previous feature)
- The existing tile card HTML/CSS grid layout already supports 3-column stat display
- The comparison chart already uses Chart.js with time-scale X-axis — only the Y-axis metric needs to change
- "lower is better" note styling should be consistent with existing UI patterns (e.g., the `comparison-note` class if it exists)
