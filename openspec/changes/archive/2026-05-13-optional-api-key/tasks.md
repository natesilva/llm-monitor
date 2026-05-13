## 1. Type Changes

- [x] 1.1 Change `apiKeyEnvVar` from `string` to `string | undefined` (optional) in `EndpointConfig` in `src/shared/types.ts`
- [x] 1.2 Change `apiKey` from `string` to `string | undefined` in `ResolvedEndpoint` in `src/shared/types.ts`

## 2. Config Validation & Resolution

- [x] 2.1 Remove the `apiKeyEnvVar` required check from `validateConfig()` in `src/shared/config.ts`
- [x] 2.2 Update `resolveApiKeys()` to skip key resolution when `apiKeyEnvVar` is absent, setting `apiKey` to `undefined` instead of throwing

## 3. Bench Runner

- [x] 3.1 Update the non-streaming request in `src/bench/runner.ts` to conditionally include the `Authorization` header only when `endpoint.apiKey` is defined
- [x] 3.2 Update the streaming request in `src/bench/runner.ts` to conditionally include the `Authorization` header only when `endpoint.apiKey` is defined

## 4. Config Example

- [x] 4.1 Update `config.example.yaml` to show `apiKeyEnvVar` as optional with an inline comment

## 5. Tests

- [x] 5.1 Update `src/bench/runner.test.ts` to cover the unauthenticated endpoint case (no `apiKeyEnvVar`, no `Authorization` header sent)
- [x] 5.2 Add test for `resolveApiKeys()` returning `apiKey: undefined` when `apiKeyEnvVar` is absent
- [x] 5.3 Add test for `validateConfig()` accepting endpoints without `apiKeyEnvVar`
