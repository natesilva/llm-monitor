## Context

The comparison chart renders error data points as red cross markers (scatter overlay datasets). Each error dataset has a label like `"<config> errors"` (e.g., `"OpenAI GPT-5.5 errors"`), but the tooltip callback ignores this label and only shows `Error: <message>` or `HTTP <status>`. Meanwhile, success point tooltips do include the config label (`"<config>: <value>ms"`). This inconsistency makes it hard to identify which config an error belongs to when multiple configs are active.

## Goals / Non-Goals

**Goals:**
- Include the configuration label in comparison chart error tooltips
- Make error tooltip format consistent with success tooltip format (both prefix with config label)

**Non-Goals:**
- Changing tile chart error tooltip format (already shows per-tile config context)
- Adding extra configuration details (model, baseUrl, temperature) to the tooltip
- Modifying the comparison API response or data model

## Decisions

**Extract config label from dataset label**: The error scatter dataset label follows the pattern `"<config> errors"`. We'll strip the ` errors` suffix to extract the config name, rather than passing it as a separate field on the data point. This avoids any API or data model changes.

Alternatives considered:
- *Add a `config` field to each error data point*: Would require changes to data mapping but provides cleaner separation. Rejected because the label already carries this info and adding fields is unnecessary.
- *Add config name to the raw error point object*: Similar to above, adds complexity for no additional benefit.

**Tooltip format**: `<config label>: Error: <message>` or `<config label>: HTTP <status>`. This mirrors the success tooltip format (`<config label>: <value>ms`) and keeps the config name as a consistent prefix.

## Risks / Trade-offs

- [Dataset label format coupling] The implementation depends on the `" errors"` suffix convention in dataset labels. If this convention changes, the extraction logic must also change. → Mitigation: The convention is only set in `renderComparison()` (line 444), so it's a single point of control.
