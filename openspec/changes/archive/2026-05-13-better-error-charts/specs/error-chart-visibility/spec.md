## ADDED Requirements

### Requirement: Error tooltips on tile chart points
The tile chart SHALL display a tooltip when hovering over an error data point (httpStatus outside 200-299) that shows the error message text.

#### Scenario: Hovering over an error point with an error message
- **WHEN** a user hovers over a red dot on a tile chart and the data point has a non-null errorMessage
- **THEN** the tooltip displays the error message text

#### Scenario: Hovering over an error point without an error message
- **WHEN** a user hovers over a red dot on a tile chart and the data point has a null or empty errorMessage
- **THEN** the tooltip displays the HTTP status code (e.g., "HTTP 500")

#### Scenario: Hovering over a success point
- **WHEN** a user hovers over a normal-colored dot on a tile chart
- **THEN** the tooltip displays standard TPS information without error details

### Requirement: Error legend entry on tile charts
Each tile chart SHALL include a legend entry with a red dot marker labeled "Error" so users understand the meaning of red dots.

#### Scenario: Tile chart with error data points
- **WHEN** a tile chart renders with at least one error data point
- **THEN** the chart displays a legend with two entries: the config label and "Error" with a red dot marker

#### Scenario: Tile chart with no error data points
- **WHEN** a tile chart renders with zero error data points
- **THEN** the chart displays only the config label in the legend (no "Error" entry)

### Requirement: Error markers in comparison chart
The comparison chart SHALL render error data points as visible markers on the time axis instead of silently dropping them.

#### Scenario: Config with errors in comparison view
- **WHEN** a config selected for comparison has error runs (httpStatus outside 200-299) within the time window
- **THEN** those error points SHALL appear as red cross markers at their timestamp positions in the comparison chart

#### Scenario: Config with no errors in comparison view
- **WHEN** a config selected for comparison has no error runs within the time window
- **THEN** no error markers appear for that config

### Requirement: Error messages in data overlay table
The data overlay table SHALL include an "Error" column that displays the error message for failed runs.

#### Scenario: Data point with error message
- **WHEN** the data overlay table renders a row where errorMessage is non-null and non-empty
- **THEN** the "Error" column displays the error message text

#### Scenario: Data point without error
- **WHEN** the data overlay table renders a row where errorMessage is null or empty
- **THEN** the "Error" column is empty

### Requirement: Error message in MetricsDataPoint API response
The `MetricsDataPoint` type and all API endpoints returning `MetricsDataPoint` SHALL include the `errorMessage` field from the database.

#### Scenario: Successful benchmark run
- **WHEN** a benchmark run has httpStatus in the 200-299 range
- **THEN** the corresponding MetricsDataPoint has `errorMessage: null`

#### Scenario: Failed benchmark run with error message
- **WHEN** a benchmark run has httpStatus outside 200-299 and a non-null error_message in the database
- **THEN** the corresponding MetricsDataPoint has `errorMessage` set to that error message string

#### Scenario: Failed benchmark run without error message
- **WHEN** a benchmark run has httpStatus outside 200-299 and a null error_message in the database
- **THEN** the corresponding MetricsDataPoint has `errorMessage: null`
