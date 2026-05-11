# Quickstart: Clean Up Web UI Stats Display

**Branch**: `014-cleanup-web-stats` | **Date**: 2026-05-11

## Prerequisites

- Running LLM Monitor web server (`llm-monitor-web`)
- At least one benchmark run with data in the database
- Browser access to the dashboard

## Verification Steps

### 1. Stat Card Verification

1. Open the dashboard in a browser
2. Navigate to the "Per-Configuration (48h)" section
3. For each configuration tile with data, verify exactly three stats are shown:
   - **Avg TPS** — a numeric value
   - **Avg TT100T** — a numeric value with "ms" suffix, or "N/A" if unavailable
   - **TPS StdDev** — a numeric value

### 2. Comparison Graph Verification

1. Select two or more configurations using the toggle buttons
2. Verify the comparison chart renders with:
   - Y-axis label reading "TT100T (ms)"
   - Data points plotted as TT100T values in milliseconds
   - A "lower is better" note visible below the chart
3. Verify that configurations with no TT100T data do not cause errors

### 3. Auto-Refresh Verification

1. Wait for the 60-second auto-refresh interval
2. Verify the three stat values update without adding or removing any stat items
3. Verify the comparison chart updates without changing the metric type
