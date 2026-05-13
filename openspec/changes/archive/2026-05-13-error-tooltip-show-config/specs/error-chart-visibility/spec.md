## ADDED Requirements

### Requirement: Config label in comparison chart error tooltips
The comparison chart SHALL include the configuration label in error point tooltips, prefixed before the error detail, consistent with the success point tooltip format.

#### Scenario: Hovering over an error point with an error message
- **WHEN** a user hovers over a red cross marker on the comparison chart and the data point has a non-null errorMessage
- **THEN** the tooltip displays `<config label>: Error: <errorMessage>` (e.g., "OpenAI GPT-5.5: Error: rate limit exceeded")

#### Scenario: Hovering over an error point without an error message
- **WHEN** a user hovers over a red cross marker on the comparison chart and the data point has a null or empty errorMessage
- **THEN** the tooltip displays `<config label>: HTTP <statusCode>` (e.g., "OpenAI GPT-5.5: HTTP 500")

#### Scenario: Hovering over a success point (unchanged)
- **WHEN** a user hovers over a normal line data point on the comparison chart
- **THEN** the tooltip displays `<config label>: <tt100tMs>ms` (existing behavior, no change)
