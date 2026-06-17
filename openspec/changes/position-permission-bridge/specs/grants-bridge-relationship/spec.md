## ADDED Requirements

### Requirement: `grants` relationship type bridges Membership to Permission

The system SHALL define a `grants` relationship type — a directed edge from an operational `Membership` to a product `Permission`. `grants` makes the org→app authorization causal chain a queryable subgraph: a Permission's `grants` in-edge names the Membership that justifies it ("Kyle can approve P&T allocations because he holds the Head position in the P&T group"). `grants` SHALL be registered in the core relationship/edge registry alongside `can_access` and `assigned_to`.

#### Scenario: grants is a registered relationship type
- **WHEN** the relationship/edge registry is loaded
- **THEN** `grants` is present with source `Membership` and target `Permission`

#### Scenario: Causal chain is traversable in both directions
- **WHEN** querying from a Membership
- **THEN** its `grants` out-edges enumerate the Permissions it grants
- **WHEN** querying from a Permission
- **THEN** its `grants` in-edge identifies the backing Membership (or is absent for an authored, unbacked Permission)

### Requirement: `grants` is preserved across re-projection

`grants` edges SHALL be treated like the authored governance edges (`can_access`/`assigned_to`) by the projection apply step: preserved on re-apply and never clobbered. When a `grants` edge's Membership or Permission endpoint vanishes, the edge SHALL be soft-handled (marked, not silently dropped) so the broken causal link stays reviewable.

#### Scenario: Re-apply preserves grants
- **WHEN** the projection apply runs again over an unchanged graph
- **THEN** existing `grants` edges remain intact and are not duplicated

#### Scenario: Vanished endpoint soft-handles the edge
- **WHEN** a Membership backing a `grants` edge is removed
- **THEN** the edge is marked rather than hard-deleted, matching governance-edge handling
