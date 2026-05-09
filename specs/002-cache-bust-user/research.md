# Research: Cache-Bust Request User

**Date**: 2026-05-08
**Feature**: Add unique per-request `user` value to benchmark requests

## Decision 1: Which Request Field to Use for Cache-Busting

**Decision**: Use the `user` field in the OpenAI chat completions request body.

**Rationale**:
- The `user` field is an official part of the OpenAI chat completions API spec
- OpenAI and compatible providers use `user` as a component of their cache key
- It's semantically appropriate — each benchmark request is a distinct "user" interaction
- No risk of breaking API compatibility — the field is optional and widely supported

**Alternatives considered**:
- Random seed parameter: Not part of the OpenAI API spec; not universally supported
- Varying the prompt content: Would invalidate benchmark consistency (same prompt must be used for fair comparisons)
- Custom header: Not part of the OpenAI API spec; may be ignored or rejected by some providers

## Decision 2: Unique Value Generation Strategy

**Decision**: Use `crypto.randomUUID()` for the `user` value.

**Rationale**:
- UUIDs provide 122 bits of entropy — effectively impossible for a cache to match
- Available natively in Bun runtime (no dependencies)
- Compact (36 chars), URL-safe, and standard format
- No timestamp component needed — UUID v4 randomness alone is sufficient

**Alternatives considered**:
- `Date.now() + Math.random()`: Less entropy, more verbose, non-standard format
- Incrementing counter: Predictable across runs; doesn't prevent cross-session caching
- Hash of timestamp + endpoint: Deterministic — could still hit cache if same timestamp

## Decision 3: Scope of Change — Store the User Value?

**Decision**: Do not store the `user` value in the database.

**Rationale**:
- The `user` value is only needed at request time to bust the cache
- Storing it adds no analytical value — it's a throwaway identifier
- No schema changes needed (Constitution principle IV compliance)
- Keeps the change minimal and focused

**Alternatives considered**:
- Store `user` value in `benchmark_runs` table: Adds a column, migration, query changes — unnecessary complexity
