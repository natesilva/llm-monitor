## ADDED Requirements

### Requirement: Endpoint can omit API key for unauthenticated access
The system SHALL allow an endpoint configuration to omit `apiKeyEnvVar`. When omitted, the bench runner SHALL NOT send an `Authorization` header with requests to that endpoint.

#### Scenario: Endpoint without apiKeyEnvVar
- **WHEN** an endpoint is configured without `apiKeyEnvVar`
- **THEN** the system accepts the configuration without error and sends HTTP requests without an `Authorization` header

#### Scenario: Endpoint with apiKeyEnvVar
- **WHEN** an endpoint is configured with `apiKeyEnvVar` set to a valid environment variable name
- **THEN** the system resolves the API key and sends `Authorization: Bearer <key>` as before

#### Scenario: Endpoint with apiKeyEnvVar but missing env var
- **WHEN** an endpoint is configured with `apiKeyEnvVar` set to a name that is not set or is empty in the environment
- **THEN** the system throws an error indicating the environment variable is missing

### Requirement: ResolvedEndpoint has optional apiKey
`ResolvedEndpoint.apiKey` SHALL be `string | undefined`. When `apiKeyEnvVar` is absent, `apiKey` SHALL be `undefined`.

#### Scenario: Resolved endpoint without API key
- **WHEN** `resolveApiKeys()` processes an endpoint without `apiKeyEnvVar`
- **THEN** the returned `ResolvedEndpoint` has `apiKey: undefined`

#### Scenario: Resolved endpoint with API key
- **WHEN** `resolveApiKeys()` processes an endpoint with `apiKeyEnvVar` pointing to a set environment variable
- **THEN** the returned `ResolvedEndpoint` has `apiKey` set to the variable's value
