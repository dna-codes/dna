## MODIFIED Requirements

### Requirement: Span-of-control lens shows direct and indirect report counts per position

The span-of-control lens SHALL show direct and indirect report counts per position by traversing the `Position.parent` hierarchy (renamed from `Role.parent`). Its node slots SHALL reference the operational `Position` resource type; all other counting behavior is unchanged.

#### Scenario: Counts derived from Position hierarchy
- **WHEN** the lens evaluates over an operational graph
- **THEN** direct and indirect report counts are computed from `Position.parent` edges
