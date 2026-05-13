## ADDED Requirements

### Requirement: Active configs always shown
The `/api/configs` endpoint SHALL include all config labels currently defined in `config.yaml` bench endpoints, regardless of whether they have benchmark data.

#### Scenario: Active config with no data
- **WHEN** a config label is defined in config.yaml but has no rows in benchmark_runs
- **THEN** the `/api/configs` response SHALL include that config label

#### Scenario: Active config with historical data
- **WHEN** a config label is defined in config.yaml and has rows in benchmark_runs
- **THEN** the `/api/configs` response SHALL include that config label

### Requirement: Recently removed configs shown temporarily
The `/api/configs` endpoint SHALL include config labels that are NOT defined in config.yaml but have at least one benchmark_runs row with a timestamp within the last 12 hours.

#### Scenario: Removed config with recent data
- **WHEN** a config label is not in config.yaml and has benchmark data from 6 hours ago
- **THEN** the `/api/configs` response SHALL include that config label

#### Scenario: Removed config with stale data
- **WHEN** a config label is not in config.yaml and its most recent benchmark_runs row is older than 12 hours
- **THEN** the `/api/configs` response SHALL NOT include that config label

#### Scenario: Removed config with no data
- **WHEN** a config label is not in config.yaml and has no rows in benchmark_runs
- **THEN** the `/api/configs` response SHALL NOT include that config label

### Requirement: Configs returned in alphabetical order
The `/api/configs` endpoint SHALL return config labels sorted alphabetically, consistent with the existing behavior.

#### Scenario: Multiple configs with mixed active/removed status
- **WHEN** active configs "Beta", "Delta" and removed-recent config "Alpha" are all eligible
- **THEN** the response SHALL return them in order: "Alpha", "Beta", "Delta"
