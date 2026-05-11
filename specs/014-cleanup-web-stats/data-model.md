# Data Model: Clean Up Web UI Stats Display

**Branch**: `014-cleanup-web-stats` | **Date**: 2026-05-11

## Entities

No new entities are introduced. This feature uses existing data structures without modification.

### Existing Entities Referenced

#### ConfigStats

Display-relevant fields (from `src/shared/types.ts`):

| Field | Type | Display Usage |
|-------|------|---------------|
| `avgTps` | `number` | Stat card: "Avg TPS" |
| `avgTt100tMs` | `number \| null` | Stat card: "Avg TT100T" (null → "N/A") |
| `tpsStdDev` | `number` | Stat card: "TPS StdDev" |
| `p50LatencyMs` | `number` | Not displayed in cards |
| `p95LatencyMs` | `number` | Not displayed in cards |
| `successRate` | `number` | Not displayed in cards |
| `p50TtftMs` | `number \| null` | Not displayed in cards |
| `p95TtftMs` | `number \| null` | Not displayed in cards |

#### ComparisonDataPoint

| Field | Type | Display Usage |
|-------|------|---------------|
| `timestamp` | `string` | X-axis of comparison chart |
| `tps` | `number` | Not used in comparison chart |
| `tt100tMs` | `number \| null` | Y-axis of comparison chart (null values filtered) |

## Validation Rules

- When `avgTt100tMs` is null, the stat card displays "N/A"
- Data points with null `tt100tMs` are excluded from the comparison chart dataset
- Exactly three stats must appear per tile card

## State Transitions

Not applicable — this feature has no mutable state.
