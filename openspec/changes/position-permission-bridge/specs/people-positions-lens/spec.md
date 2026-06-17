## MODIFIED Requirements

### Requirement: People → Positions lens shows filled and vacant positions

The People → Positions lens SHALL show filled and vacant positions by traversing Person → `Membership.position` → `Position` over the operational graph. Its node slots and edges SHALL reference the operational `Position` resource type (renamed from `Role`); all other lens behavior is unchanged.

#### Scenario: Lens resolves positions via Position nodes
- **WHEN** the lens evaluates over an operational graph
- **THEN** it binds the middle slot to `Position` nodes and reports a position as vacant when no Person holds it via a Membership
