# Quickstart: Persist Comparison Graph Selection

**Feature**: `010-persist-comparison-selection`

## Verification Steps

1. Start the web server: `bun run web:dev`
2. Open the dashboard in a browser
3. Deselect one or more configurations in the Comparison graph toggle buttons
4. Reload the page
5. Verify the same configurations are still deselected
6. Clear browser localStorage (`localStorage.removeItem("comparison-configs")` in DevTools console)
7. Reload the page — all configurations should be selected (default behavior)

## Manual Test: Stale Config Handling

1. In DevTools console: `localStorage.setItem("comparison-configs", '["nonexistent-config"]')`
2. Reload the page
3. Verify: all real configurations are selected (stale entry ignored, empty set falls back to "select all")
