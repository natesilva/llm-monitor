# Feature Specification: Web UI Quality-of-Life Improvements

**Feature Branch**: `009-web-ui-qol`
**Created**: 2026-05-09
**Status**: Draft
**Input**: User description: "Add some quality-of-life improvements to the web interface: 1. The UI is always in dark mode. It should support light mode, and automatic mode (where it follows the system dark/light setting). 2. Each per-configuration tile should have a button or link that the user can click which, when clicked, brings up an overlay window that shows a table of the times and values from the most recent data points for that configuration."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Switch display mode (Priority: P1)

A user prefers light mode or wants the dashboard to match their operating system appearance setting. They open the dashboard and select a display mode (light, dark, or auto). The dashboard immediately updates to reflect the chosen mode. When "auto" is selected, the dashboard follows the operating system's dark/light preference and updates in real time if the system setting changes. The user's choice is remembered across page reloads.

**Why this priority**: This affects all users on every visit. A dark-only interface excludes users who prefer or need light mode for accessibility reasons. Auto mode provides the best experience by default.

**Independent Test**: Can be fully tested by switching between light, dark, and auto modes and verifying visual changes, persistence across reloads, and auto mode following system preference changes.

**Acceptance Scenarios**:

1. **Given** the dashboard is displaying in dark mode, **When** the user selects light mode, **Then** the dashboard immediately renders in light mode with appropriate colors for all elements
2. **Given** the user has selected "auto" mode, **When** the operating system switches from dark to light, **Then** the dashboard updates to light mode automatically
3. **Given** the user has selected a mode, **When** the user reloads the page, **Then** the previously selected mode is restored
4. **Given** the user has never selected a mode, **When** the dashboard loads for the first time, **Then** it defaults to auto mode (following system preference)

---

### User Story 2 - View recent data points for a configuration (Priority: P2)

A user wants to inspect the individual data points behind the chart and summary statistics for a specific configuration. They click a button or link on a configuration tile, and an overlay appears displaying a table of the most recent data points with columns for timestamp and metric values (TPS, latency, HTTP status). The overlay can be closed by clicking a close button, clicking outside the overlay, or pressing Escape.

**Why this priority**: This provides detailed insight that the chart alone cannot convey. It is a natural next step after viewing the overview but not essential for the core monitoring experience.

**Independent Test**: Can be fully tested by clicking the data button on any configuration tile and verifying the overlay displays a table with the correct data, and that the overlay can be dismissed.

**Acceptance Scenarios**:

1. **Given** a configuration tile with existing data points, **When** the user clicks the data button, **Then** an overlay appears showing a table of recent data points with timestamp, TPS, latency, and HTTP status columns
2. **Given** the overlay is open, **When** the user clicks the close button, clicks outside the overlay, or presses Escape, **Then** the overlay closes
3. **Given** a configuration tile with no data points, **When** the user clicks the data button, **Then** the overlay displays an empty state message indicating no data is available
4. **Given** the overlay is open, **When** the underlying data updates, **Then** the table reflects the most current data available at the time it was opened

---

### Edge Cases

- What happens when the user switches display modes while an overlay is open? The overlay should update its styling to match the new mode.
- What happens on a very small screen where the overlay table may not fit? The overlay should scroll horizontally or the table should be responsive.
- What happens if the system preference changes while the overlay is open in auto mode? Both the dashboard and overlay should update to reflect the new system preference.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The dashboard MUST offer three display mode options: light, dark, and auto
- **FR-002**: In auto mode, the dashboard MUST follow the operating system's dark/light preference
- **FR-003**: The dashboard MUST detect system preference changes in real time when in auto mode
- **FR-004**: The user's display mode selection MUST persist across page reloads
- **FR-005**: The dashboard MUST default to auto mode when no user preference has been saved
- **FR-006**: All dashboard elements (charts, tiles, text, overlays) MUST render correctly in both light and dark modes
- **FR-007**: Each configuration tile MUST display a clickable element that opens a data detail overlay
- **FR-008**: The overlay MUST display a table of the most recent data points for the selected configuration, including timestamp, TPS, latency, and HTTP status
- **FR-009**: The overlay MUST be dismissible via a close button, clicking outside the overlay, and pressing the Escape key
- **FR-010**: The overlay MUST display an appropriate empty state when no data points exist for the configuration
- **FR-011**: The overlay MUST visually adapt to the currently active display mode

### Key Entities

- **Display Mode Preference**: The user's selected mode (light, dark, or auto). Persisted locally per browser.
- **Data Point**: A single benchmark measurement with timestamp, TPS, latency, and HTTP status attributes. Belongs to a configuration.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Users can switch between light, dark, and auto modes in under 3 seconds, with the interface updating immediately
- **SC-002**: The selected display mode is retained when the user revisits the dashboard within the same browser
- **SC-003**: Users can open and close the data overlay for any configuration tile in under 2 seconds
- **SC-004**: The data overlay displays the correct values matching the underlying benchmark data for the selected configuration
- **SC-005**: All dashboard elements are legible and visually distinct in both light and dark modes

## Assumptions

- Users access the dashboard via a modern browser that supports the `prefers-color-scheme` media query and `localStorage`
- The number of recent data points shown in the overlay will match the data already available from the existing metrics API (no new API endpoint is assumed, but one may be needed)
- The overlay will show data points already available from the existing data source; no additional data collection is required
- The existing dashboard layout and chart rendering will remain unchanged aside from theme support
