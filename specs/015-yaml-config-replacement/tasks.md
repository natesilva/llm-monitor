# Tasks: Replace config.ts with YAML Configuration

**Input**: Design documents from `/specs/015-yaml-config-replacement/`
**Prerequisites**: plan.md (required), spec.md (required), research.md, data-model.md, quickstart.md

**Tests**: Not explicitly requested in the feature specification. Test tasks are omitted.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

- **Single project**: `src/` at repository root
- Config and example files at repository root

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Create the new example files and update project-level configuration

- [ ] T001 Create `config.example.yaml` at project root with all available options documented via inline comments, mirroring the current `config.example.ts` content in YAML format (bench schedule, two example endpoints with apiKeyEnvVar, web section, db section)
- [ ] T002 [P] Update `.env.example` at project root to reference `config.yaml` instead of `config.jsonc` in the comment, and ensure all API key variable names from `config.example.yaml` are listed
- [ ] T003 [P] Update `.gitignore` at project root: add `config.yaml` entry, remove `/config.ts` entry
- [ ] T004 [P] Update `tsconfig.json` at project root: remove `config.example.ts` from the `include` array
- [ ] T005 [P] Update `package.json` at project root: change `web:dev` script from `bun --watch src/web/index.ts` to `bun --hot src/web/index.ts`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Replace the core config loader and amend the constitution so all user stories can build on consistent foundations

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [ ] T006 Rewrite `src/shared/config.ts`: replace `loadConfig(raw: AppConfig)` with `loadConfigFromYaml()` that reads the YAML file from `CONFIG_PATH` env var or default `config.yaml`, parses with `Bun.YAML.parse()`, applies defaults via `normalizeEndpoint()`, validates via `validateConfig()`, and returns `AppConfig`. Keep `resolveApiKeys()` unchanged. Remove the old `loadConfig()` export.
- [ ] T007 Amend `.specify/memory/constitution.md`: update the Architecture & Deployment > Configuration section to state "Configuration MUST be via a YAML configuration file. Sensitive values (API keys) MUST be referenced by environment variable name in the YAML file and resolved at runtime. A `.env` file may be used to set those environment variables during development." Bump version from 1.1.0 to 1.2.0 with amendment note.
- [ ] T008 Delete `config.example.ts` at project root (replaced by `config.example.yaml` from T001)

**Checkpoint**: Foundation ready — `loadConfigFromYaml()` is available for all entry points, constitution is consistent with the new approach

---

## Phase 3: User Story 1 - Configure the application via YAML (Priority: P1) 🎯 MVP

**Goal**: All three entry points read configuration from a YAML file instead of a TypeScript file

**Independent Test**: Place a valid `config.yaml` in the project root, run `bun run bench` and `bun run web`, verify both start correctly with values from the YAML file

### Implementation for User Story 1

- [ ] T009 [P] [US1] Update `src/bench/index.ts`: replace the `await import("../../config.ts")` block and `loadConfig(rawConfig.default)` call with `loadConfigFromYaml()`, update error message to reference `config.example.yaml` instead of `config.example.ts`
- [ ] T010 [P] [US1] Update `src/bench/cron.ts`: replace the `loadRawConfig()` function's `await import("../../config.ts")` block and `loadConfig(rawConfig.default)` call with `loadConfigFromYaml()`, update error message to reference `config.example.yaml` instead of `config.example.ts`
- [ ] T011 [P] [US1] Update `src/web/index.ts`: replace the `await import("../../config.ts")` block and `loadConfig(rawConfig.default)` call with `loadConfigFromYaml()`, update error message to reference `config.example.yaml` instead of `config.example.ts`

**Checkpoint**: At this point, the application loads all configuration from YAML. `bun run bench`, `bun run web`, and `bun run cron` all work with `config.yaml` instead of `config.ts`.

---

## Phase 4: User Story 2 - Reference environment variables for API keys (Priority: P2)

**Goal**: API keys are resolved from environment variables referenced by name in the YAML file, with clear errors when missing

**Independent Test**: Set `OPENAI_API_KEY` in the environment, run `bun run bench` with a YAML config referencing it, verify the endpoint is called. Unset the variable and verify a clear error message names the missing variable and endpoint.

**Note**: This user story requires no new code — the `resolveApiKeys()` function is unchanged. These tasks verify it works correctly with YAML-sourced config.

### Verification for User Story 2

- [ ] T012 [US2] Verify `resolveApiKeys()` in `src/shared/config.ts` still works correctly with the new YAML-parsed `EndpointConfig[]` (it should be unchanged, but confirm the `apiKeyEnvVar` field flows through from YAML → normalizeEndpoint → resolveApiKeys without type mismatches)
- [ ] T013 [US2] Verify `loadEndpoints()` in `src/bench/config.ts` still works correctly with the new `loadConfigFromYaml()` output (it should be unchanged since it still receives `EndpointConfig[]`)

**Checkpoint**: API key resolution from environment variables works identically to the previous `config.ts` approach. Missing env vars produce clear, actionable error messages.

---

## Phase 5: User Story 3 - Use example files as a starting point (Priority: P3)

**Goal**: A new user can copy `config.example.yaml` and `.env.example`, fill in values, and have a working application

**Independent Test**: Copy `config.example.yaml` to `config.yaml`, copy `.env.example` to `.env`, fill in a real API key, run `bun run bench` and verify it works

### Verification for User Story 3

- [ ] T014 [US3] Verify `config.example.yaml` at project root contains all configurable options with inline YAML comments documenting each field and its default value (created in T001 — validate completeness here)
- [ ] T015 [US3] Verify `.env.example` at project root lists all environment variable names referenced in `config.example.yaml` with placeholder values and comments (updated in T002 — validate completeness here)

**Checkpoint**: New users can go from zero to running application by copying two example files and editing them.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Final validation

- [ ] T016 Run `bun run lint` and `bun run typecheck` to verify no lint or type errors
- [ ] T017 Run `bun test` to verify all existing tests pass with the new config loading
- [ ] T018 Run quickstart.md validation: copy `config.example.yaml` to `config.yaml`, copy `.env.example` to `.env`, set a real API key, run `bun run bench` and verify it completes successfully

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — can start immediately
- **Foundational (Phase 2)**: Depends on Phase 1 (T001 must exist before T006 can be tested)
- **User Story 1 (Phase 3)**: Depends on Phase 2 (loadConfigFromYaml must exist)
- **User Story 2 (Phase 4)**: Depends on Phase 3 (entry points must use new loader)
- **User Story 3 (Phase 5)**: Depends on Phase 1 (example files from T001, T002)
- **Polish (Phase 6)**: Depends on all prior phases

### User Story Dependencies

- **User Story 1 (P1)**: Depends on Foundational (Phase 2) — no dependencies on other stories
- **User Story 2 (P2)**: Depends on User Story 1 — verifies the chain works end-to-end
- **User Story 3 (P3)**: Depends on Phase 1 only — can run in parallel with US1/US2 but logically follows them

### Within Each User Story

- Core implementation before verification
- Verification tasks confirm existing behavior is preserved

### Parallel Opportunities

- T002, T003, T004, T005 can all run in parallel (different files, no dependencies)
- T009, T010, T011 can all run in parallel (different entry point files, same pattern)
- T014, T015 can run in parallel (different files)
- T016, T017 can run in parallel (different commands)

---

## Parallel Example: Phase 1

```bash
# Launch all Phase 1 tasks together:
Task: "Update .env.example at project root"
Task: "Update .gitignore at project root"
Task: "Update tsconfig.json at project root"
Task: "Update package.json at project root"
```

## Parallel Example: User Story 1

```bash
# Launch all US1 entry point updates together:
Task: "Update src/bench/index.ts"
Task: "Update src/bench/cron.ts"
Task: "Update src/web/index.ts"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup (create example YAML, update project config files)
2. Complete Phase 2: Foundational (rewrite config loader, amend constitution)
3. Complete Phase 3: User Story 1 (update all entry points)
4. **STOP and VALIDATE**: Run `bun run bench` and `bun run web` with a `config.yaml` file
5. App is functional — YAML config replaces config.ts

### Incremental Delivery

1. Phase 1 + Phase 2 → Core infrastructure ready
2. Phase 3 (US1) → App runs on YAML → **MVP!**
3. Phase 4 (US2) → API key resolution verified → Deploy/Demo
4. Phase 5 (US3) → Example files validated → Deploy/Demo
5. Phase 6 → All checks pass → Complete

### Parallel Team Strategy

With multiple developers:

1. Team completes Phase 1 + Phase 2 together
2. Once Foundational is done:
   - Developer A: T009 (bench/index.ts)
   - Developer B: T010 (bench/cron.ts)
   - Developer C: T011 (web/index.ts)
3. Then verify US2/US3 in parallel

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- US2 and US3 are primarily verification tasks since the implementation in US1 + Foundational covers their requirements
- The `resolveApiKeys()` and `loadEndpoints()` functions are intentionally unchanged — US2 verifies they still work
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
