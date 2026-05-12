## 1. Rewrite config loading

- [x] 1.1 Replace `Bun.file()` / `file.text()` / `Bun.YAML.parse()` in `loadConfigFromYaml()` with dynamic `import(CONFIG_PATH)`, extracting `default` export as the raw config object
- [x] 1.2 Update error handling: catch import errors and throw user-friendly messages (file not found, invalid YAML)

## 2. Verification

- [x] 2.1 Run `bun run typecheck` to confirm no type errors
- [x] 2.2 Run `bun run lint` to confirm no lint errors
- [x] 2.3 Run `bun test` to confirm all tests pass with the new import-based loading
