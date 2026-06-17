## MODIFIED Requirements

### Requirement: A grouping is a node-anchored query, not an installed bundle

A grouping SHALL be expressed as a node-anchored query over the graph rather than an installed bundle. Where grouping membership references the organizational position a Person fills, it SHALL reference the operational `Position` primitive (and `Membership.position`), not the former `Role` primitive. All other grouping semantics are unchanged.

#### Scenario: Grouping references Position via Membership
- **WHEN** a grouping resolves people by the positions they fill
- **THEN** it traverses `Membership.position` to declared `Position` nodes
