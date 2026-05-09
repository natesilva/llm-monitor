# Data Model: Web Auto-Reload

**Date**: 2026-05-08
**Feature**: Add auto-reload for web server on source file changes

## Entities

No new entities. No schema changes. No data flow changes.

## Changes

| File | Change |
|------|--------|
| package.json | Add `"web:dev": "bun --hot src/web/index.ts"` script |
| Makefile | Add `web-dev` target |
