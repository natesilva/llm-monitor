## Why

The bench command requires `apiKeyEnvVar` for every endpoint, making it impossible to benchmark APIs that don't require authentication (e.g., local LLM servers like Ollama, vLLM, or internal gateways). Users must either set a dummy env var or modify the codebase to work around this.

## What Changes

- Make `apiKeyEnvVar` optional in `EndpointConfig` (change type from `string` to `string | undefined`)
- Remove the validation error when `apiKeyEnvVar` is absent
- Make `resolveApiKeys()` skip key resolution for endpoints without `apiKeyEnvVar`
- Conditionally include the `Authorization` header in bench HTTP requests only when an API key is present
- Update `ResolvedEndpoint` so `apiKey` is optional (`string | undefined`)
- Update `config.example.yaml` and example configs to show `apiKeyEnvVar` as optional

## Capabilities

### New Capabilities
- `optional-api-key`: Support for endpoints that do not require API key authentication

### Modified Capabilities
- `yaml-import-loading`: Config loading must accept endpoints without `apiKeyEnvVar`

## Impact

- `src/shared/types.ts`: `EndpointConfig.apiKeyEnvVar` and `ResolvedEndpoint.apiKey` become optional
- `src/shared/config.ts`: `validateConfig()` and `resolveApiKeys()` updated for optional key
- `src/bench/runner.ts`: Conditional `Authorization` header
- `config.example.yaml`: Updated comments showing `apiKeyEnvVar` as optional
- Existing configs with `apiKeyEnvVar` are unaffected (non-breaking)
