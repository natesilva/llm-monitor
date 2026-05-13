
## Cron Job CWD

The bench cron job (registered via `Bun.cron`) does **NOT** run with the project directory as its working directory. On macOS it runs via launchd with CWD `/`, on Linux via crontab with CWD as the user's home directory. **ALL file paths in cron-worker code MUST be resolved relative to the project root using `import.meta.dir`**, not `process.cwd()` or relative paths.

## Git

- Use Conventional Commits format for all commit messages (`type(scope): description`).

<!-- SPECKIT START -->
For additional context about technologies to be used, project structure,
shell commands, and other important information, read the current plan
at `specs/015-yaml-config-replacement/plan.md`
<!-- SPECKIT END -->
