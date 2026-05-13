## Why

When an error marker (red x) appears in the Comparison chart, hovering shows only the error message or HTTP status code — with no indication of which configuration produced the error. This is confusing when multiple configs are active, since users can't tell which config the error belongs to without cross-referencing the chart lines.

## What Changes

- Comparison chart error tooltips will include the configuration label (e.g., "OpenAI GPT-5.5: HTTP 500" instead of just "HTTP 500")
- Tooltip format for errors changes from `Error: <message>` to `<config label>: Error: <message>`, and from `HTTP <status>` to `<config label>: HTTP <status>`

## Capabilities

### New Capabilities

(none)

### Modified Capabilities

- `error-chart-visibility`: Tooltip for comparison chart error markers now includes the config label, matching the format already used for success data points

## Impact

- Frontend: `src/web/static/app.js` — tooltip callback in `renderComparison()` (lines ~498-515)
- No API changes needed — the config label is already available in `ctx.dataset.label` (formatted as `"<config> errors"`)
