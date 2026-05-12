## ADDED Requirements

### Requirement: Latest data timestamp endpoint
The system SHALL provide a `GET /api/latest-data` endpoint that returns the timestamp of the most recent benchmark run across all configs.

#### Scenario: Data exists in the database
- **WHEN** a GET request is made to `/api/latest-data` and at least one benchmark run exists
- **THEN** the system returns HTTP 200 with JSON `{ "latestTimestamp": "<ISO 8601 string>" }` where the value is the maximum `timestamp` from the `benchmark_runs` table

#### Scenario: No data in the database
- **WHEN** a GET request is made to `/api/latest-data` and no benchmark runs exist
- **THEN** the system returns HTTP 200 with JSON `{ "latestTimestamp": null }`
