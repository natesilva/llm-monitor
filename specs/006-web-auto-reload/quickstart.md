# Quickstart: Web Auto-Reload

**Date**: 2026-05-08
**Feature**: Add auto-reload for web server on source file changes

## Usage

### Production (no auto-reload)

```sh
bun run web
```

### Development (auto-reload on file changes)

```sh
bun run web:dev
```


## Verification

1. Run `bun run web:dev`
2. Edit any file in `src/` (e.g., add a comment to `src/web/routes.ts`)
3. Observe the server automatically restarting in the terminal
4. Verify the web dashboard reflects the change (refresh browser if needed)
5. Run `bun run web` — confirm no file watching / auto-restart occurs
