# Feature Specification: Modernize Promise Handling

**Feature Branch**: `011-modernize-promise-handling`
**Created**: 2026-05-10
**Status**: Draft
**Input**: User description: "Modernize our code around `Promise` handling. - Do not use `.then` or `.catch`. - All Promises must be awaited. - If returning a Promise, use `return await somePromise`. Do not return an unawaited Promise because that will fuck up the stack trace."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - No .then/.catch Chains (Priority: P1)

As a developer working in the codebase, I want all Promise chains using `.then()` or `.catch()` replaced with `async/await` syntax so that control flow is linear, readable, and produces accurate stack traces on errors.

**Why this priority**: `.then()`/`.catch()` chains are the most visible source of degraded stack traces and harder-to-read control flow. Eliminating them is the foundational change.

**Independent Test**: Can be fully tested by searching the codebase for any remaining `.then(` or `.catch(` calls on Promises and verifying zero results.

**Acceptance Scenarios**:

1. **Given** a file contains `somePromise.then(handler)`, **When** the modernization is applied, **Then** the code uses `await somePromise` inside an `async` function with the handler logic inlined
2. **Given** a file contains `somePromise.catch(errorHandler)`, **When** the modernization is applied, **Then** the code uses `try/catch` with `await somePromise` in the `try` block and the error handling logic in the `catch` block
3. **Given** a file contains a chained `.then().catch()` pattern, **When** the modernization is applied, **Then** the code uses a single `try/catch` block wrapping the `await`ed call

---

### User Story 2 - All Promises Awaited (Priority: P2)

As a developer debugging a production issue, I want every Promise in the codebase to be `await`ed so that I never encounter silently swallowed rejections or floating Promises that mask real errors.

**Why this priority**: Un-awaited Promises can silently fail, producing no error output and making debugging extremely difficult. This is a correctness and observability issue.

**Independent Test**: Can be fully tested by running a linter rule that flags un-awaited Promises and verifying zero violations.

**Acceptance Scenarios**:

1. **Given** a function calls an async function without `await`, **When** the modernization is applied, **Then** the call is prefixed with `await`
2. **Given** a variable is assigned the result of an async call without `await`, **When** the modernization is applied, **Then** the assignment uses `await` (e.g., `const result = await asyncFn()`)
3. **Given** a fire-and-forget call is intentionally un-awaited, **When** the modernization is applied, **Then** the call is either `await`ed or explicitly annotated with a comment indicating the intentional fire-and-forget, and a void operator is used to make intent clear (`void someAsyncFn()`)

---

### User Story 3 - Return Await for Stack Traces (Priority: P3)

As a developer investigating a bug, I want all functions that return Promises to use `return await` so that the calling function appears in the error stack trace, making it possible to trace the full call chain.

**Why this priority**: While `return promise` and `return await promise` are functionally equivalent in many cases, `return await` preserves the intermediate frame in the stack trace, which is critical for debugging nested async calls.

**Independent Test**: Can be fully tested by causing a controlled rejection in a nested async call and verifying the stack trace includes all intermediate function names.

**Acceptance Scenarios**:

1. **Given** an async function contains `return somePromise`, **When** the modernization is applied, **Then** the code is changed to `return await somePromise`
2. **Given** an async function contains `return someFnThatReturnsPromise()`, **When** the modernization is applied, **Then** the code is changed to `return await someFnThatReturnsPromise()`
3. **Given** a non-async function returns a Promise (e.g., a passthrough wrapper), **When** the modernization is applied, **Then** the function is converted to `async` and uses `return await`

---

### Edge Cases

- What happens when a `.then()` chain has side-effect-only handlers that don't return values? The `.then()` is still converted to `await` with the handler logic inlined after the `await`.
- How does the system handle `.catch()` on non-Promise values (e.g., array `.catch` is not applicable — only Promise `.catch`)? Only Promise `.then()`/`.catch()` are targeted; other method calls named `.then` or `.catch` on non-Promise objects are left untouched.
- What about `.finally()` blocks? `.finally()` patterns are also modernized to use `try/finally` with `await`.
- What about `Promise.all`, `Promise.race`, `Promise.allSettled`, etc.? These are still valid — they are `await`ed as a whole (e.g., `await Promise.all([...])`), not replaced.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: All `.then()` calls on Promises MUST be replaced with `await` inside `async` functions
- **FR-002**: All `.catch()` calls on Promises MUST be replaced with `try/catch` blocks using `await`
- **FR-003**: All `.finally()` calls on Promises MUST be replaced with `try/finally` blocks using `await`
- **FR-004**: Every Promise-returning call MUST be `await`ed unless explicitly annotated as fire-and-forget with `void`
- **FR-005**: All `return <promise>` statements in `async` functions MUST be changed to `return await <promise>`
- **FR-006**: Functions that return un-awaited Promises and need `return await` MUST be converted to `async` functions if they are not already
- **FR-007**: Existing behavior and side effects MUST be preserved after modernization — no functional regressions
- **FR-008**: Fire-and-forget patterns (intentionally un-awaited Promises) MUST use `void` operator to explicitly suppress the un-awaited Promise warning and MUST include a comment explaining why it is fire-and-forget

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Zero instances of `.then(` or `.catch(` on Promises exist in the codebase after modernization
- **SC-002**: Linter reports zero un-awaited Promise violations after modernization
- **SC-003**: All `return` statements in `async` functions use `return await` rather than returning raw Promises
- **SC-004**: All existing tests pass without modification after the modernization is complete
- **SC-005**: Error stack traces from rejected Promises include all intermediate function names in the call chain

## Assumptions

- The codebase is TypeScript/JavaScript and supports `async/await` syntax
- A linter (e.g., ESLint with `@typescript-eslint/no-floating-promises` and `@typescript-eslint/no-misused-promises` or similar) is or can be configured to enforce these rules going forward
- Fire-and-forget patterns are rare; most un-awaited Promises are bugs rather than intentional
- Combinator methods (`Promise.all`, `Promise.race`, `Promise.allSettled`, `Promise.any`) are acceptable and are themselves `await`ed
- The existing test suite is sufficient to catch any regressions introduced during refactoring
