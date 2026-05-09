# Data Model: Persist Comparison Graph Selection

**Date**: 2026-05-09
**Feature**: Persist active configuration selection for the Comparison graph across page reloads

## Entities

No new entities. No schema changes. No server-side data changes.

## Client-Side State

| Storage Key | Type | Description |
|-------------|------|-------------|
| `"comparison-configs"` | `string` (JSON array) | Array of configuration label strings currently selected in the Comparison graph. Example: `["gpt-4o","claude-3"]` |

## Changes

| File | Change |
|------|--------|
| `src/web/static/app.js` | Add `saveComparisonSelection()` helper; call on toggle click; add `loadComparisonSelection()` call in `renderToggles()` before populating `activeConfigs` |
