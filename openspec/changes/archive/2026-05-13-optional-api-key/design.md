## Context

The bench runner currently requires every endpoint to specify `apiKeyEnvVar`, which references an environment variable holding an API key. The key is always sent as a `Bearer` token in the `Authorization` header. This prevents benchmarking against unauthenticated endpoints like local LLM servers (Ollama, vLLM, LM Studio) or internal API gateways that use other auth mechanisms (mTLS, IP allowlisting, etc.).

The change is localized to the config/types layer and the HTTP request construction in the bench runner.

## Goals / Non-Goals

**Goals:**
- Allow endpoints to omit `apiKeyEnvVar` entirely
- Conditionally include the `Authorization: Bearer` header only when an API key is resolved
- Maintain backward compatibility: existing configs with `apiKeyEnvVar` continue to work unchanged

**Non-Goals:**
- Supporting alternative authentication schemes (API keys in query params, custom headers, mTLS, etc.)
- Changing the config file format beyond making one field optional
- Adding per-request header customization

## Decisions

**1. Make `apiKeyEnvVar` optional on `EndpointConfig`**
Change `apiKeyEnvVar: string` to `apiKeyEnvVar?: string` in `EndpointConfig`. This is the minimal type change. When omitted, no key is resolved and no `Authorization` header is sent.

*Alternative considered*: Add a separate `auth: "none" | "bearer"` field. Rejected because a single optional field is simpler and sufficient — if `apiKeyEnvVar` is absent, the intent is clear.

**2. Change `ResolvedEndpoint.apiKey` from `string` to `string | undefined`**
`resolveApiKeys()` sets `apiKey` to `undefined` when `apiKeyEnvVar` is absent, rather than throwing. The runner checks `apiKey` before adding the header.

*Alternative considered*: Remove `apiKey` from `ResolvedEndpoint` and check `apiKeyEnvVar` at request time. Rejected because it changes more code and loses the resolved value for debugging.

**3. Build headers object conditionally in runner**
Instead of always including `Authorization`, build the headers object with `Content-Type` unconditionally and add `Authorization` only when `endpoint.apiKey` is truthy. This applies to both streaming and non-streaming request paths.

## Risks / Trade-offs

- [Users accidentally omit `apiKeyEnvVar` on authenticated endpoints] → The request will fail with an auth error from the API, which is a clear signal. No silent data corruption.
- [No validation that an env var exists when `apiKeyEnvVar` IS specified but the var is empty] → This is already handled by the existing `resolveApiKeys()` check, which remains unchanged for the case when `apiKeyEnvVar` is present.
