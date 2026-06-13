# span-of-control-lens Specification

## Purpose
TBD - created by archiving change lens-tabs-and-graph-explorer. Update Purpose after archive.
## Requirements
### Requirement: Span-of-control lens shows direct and indirect report counts per position

The system SHALL expose `GET /lens/span-of-control` returning a list of positions with `directReports` (number of positions with a `reports_to` link pointing directly to this position) and `totalReports` (all positions reachable transitively via `reports_to`). The dna-agent SHALL proxy this at `GET /api/lens/span-of-control` and render it in `SpanOfControlPanel`.

#### Scenario: Position with direct reports only
- **WHEN** two positions report directly to a manager position and the reporters have no reports of their own
- **THEN** the manager shows directReports: 2, totalReports: 2

#### Scenario: Position with indirect reports
- **WHEN** a VP has a Director who has two Managers
- **THEN** the VP shows directReports: 1, totalReports: 3

#### Scenario: Leaf position
- **WHEN** a position has no positions reporting to it
- **THEN** it shows directReports: 0, totalReports: 0

#### Scenario: No positions
- **WHEN** there are no Position instances
- **THEN** the panel renders an empty state message

