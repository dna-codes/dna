## MODIFIED Requirements

### Requirement: DNA structural primitives map to `GraphData` nodes

The org-chart lens SHALL map DNA structural primitives to `GraphData` nodes, where the organizational position primitive maps from operational `Position` (renamed from `Role`). Containment and membership edges SHALL reference `Position` and `Membership.position`. All other node/shape mappings are unchanged.

#### Scenario: Position nodes appear in the org chart
- **WHEN** `toOrgChartData` runs over an operational graph
- **THEN** it emits type-discriminated nodes for `Position` (not `Role`) and draws membership edges via `Membership.position`
