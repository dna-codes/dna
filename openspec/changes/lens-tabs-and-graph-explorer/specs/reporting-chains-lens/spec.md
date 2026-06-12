## ADDED Requirements

### Requirement: Reporting chains lens shows paths from each leaf to root

The system SHALL expose `GET /lens/reporting-chains` returning a list of chains, where each chain is an ordered array of position names from the leaf position up to the root (no `reports_to` outgoing link). The dna-agent SHALL proxy this at `GET /api/lens/reporting-chains` and render it in `ReportingChainsPanel`.

#### Scenario: Simple two-level chain
- **WHEN** Position A has `reports_to` → Position B and Position B has no `reports_to`
- **THEN** the lens returns one chain: ["A", "B"]

#### Scenario: Cycle detection
- **WHEN** the `reports_to` links form a cycle
- **THEN** the lens terminates chain traversal at the repeated node and does not loop infinitely

#### Scenario: No reporting relationships
- **WHEN** there are no `reports_to` links in the store
- **THEN** each position appears as a chain of length 1 (itself)

#### Scenario: No positions in graph
- **WHEN** there are no Position instances
- **THEN** the panel renders an empty state message
