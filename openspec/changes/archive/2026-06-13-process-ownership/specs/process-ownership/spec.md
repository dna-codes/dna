## ADDED Requirements

### Requirement: operational pack includes owned_by relationship type
`packages/mcp/src/packs/operational.ts` SHALL export an `owned_by` entry in `relationshipTypes` with `from: 'process'`, `to: 'position'`, `cardinality: 'many-to-one'`, `attribute: 'owned_by'`, `inverse: 'owns'`, `stability: 'stable'`, and a description of "A process is owned and accountable to a position."

#### Scenario: owned_by appears in the operational pack relationship types
- **WHEN** `operational.relationshipTypes` is imported
- **THEN** it includes an entry with `name: 'owned_by'`, `from: 'process'`, `to: 'position'`

#### Scenario: owned_by cardinality is many-to-one
- **WHEN** `operational.relationshipTypes` is imported
- **THEN** the `owned_by` entry has `cardinality: 'many-to-one'`

#### Scenario: owned_by declares inverse owns
- **WHEN** `operational.relationshipTypes` is imported
- **THEN** the `owned_by` entry has `inverse: 'owns'`
