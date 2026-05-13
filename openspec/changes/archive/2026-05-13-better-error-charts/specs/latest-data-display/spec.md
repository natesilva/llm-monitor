## MODIFIED Requirements

### Requirement: Latest data timestamp display
The dashboard SHALL display a "Latest data" indicator next to the existing "Last updated" indicator in the header, showing the timestamp of the most recent benchmark run. The data overlay table SHALL include an "Error" column showing the `errorMessage` field from `MetricsDataPoint`.

#### Scenario: Latest data is available
- **WHEN** the dashboard refreshes and the `/api/latest-data` endpoint returns a non-null `latestTimestamp`
- **THEN** the system displays "Latest data: <formatted time>" where the time is the latest benchmark run timestamp formatted using the browser's locale

#### Scenario: No benchmark data exists
- **WHEN** the dashboard refreshes and the `/api/latest-data` endpoint returns `latestTimestamp: null`
- **THEN** the system displays "Latest data: No data yet"

#### Scenario: Timestamp updates on each refresh cycle
- **WHEN** the dashboard's automatic 60-second refresh cycle runs
- **THEN** the "Latest data" indicator is updated with the current value from the API

#### Scenario: Data overlay shows error column with error message
- **WHEN** the data overlay table renders a data point with a non-null errorMessage
- **THEN** the "Error" column displays the error message text

#### Scenario: Data overlay shows error column without error message
- **WHEN** the data overlay table renders a data point with a null errorMessage
- **THEN** the "Error" column is empty
