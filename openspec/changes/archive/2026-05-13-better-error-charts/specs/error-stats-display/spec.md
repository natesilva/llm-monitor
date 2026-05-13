## ADDED Requirements

### Requirement: Success rate display in tile stats
The per-config tile stats panel SHALL display the success rate as a percentage.

#### Scenario: Config with partial success
- **WHEN** a config tile renders and the API returns `successRate: 0.985`
- **THEN** the stats panel displays "98.5%" as the value with "Success Rate" as the label

#### Scenario: Config with full success
- **WHEN** a config tile renders and the API returns `successRate: 1`
- **THEN** the stats panel displays "100%" as the value with "Success Rate" as the label

#### Scenario: Config with zero success
- **WHEN** a config tile renders and the API returns `successRate: 0`
- **THEN** the stats panel displays "0%" as the value with "Success Rate" as the label

#### Scenario: Stats update on refresh
- **WHEN** the dashboard's automatic 60-second refresh cycle runs and the `successRate` value changes
- **THEN** the displayed percentage is updated to reflect the new value
