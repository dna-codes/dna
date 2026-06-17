## ADDED Requirements

### Requirement: Apply upserts Permission by stable identity

The projection apply step SHALL register the `Permission` product resource type and upsert its nodes idempotently. A `Permission` SHALL be keyed by its `{principal, role, scope}` identity so that re-apply, and reconciliation between a derived and a hand-authored Permission of the same tuple, never create a duplicate. `scope` is a namespaced entity reference — apply registers no separate `Scope` type.

#### Scenario: Re-apply does not duplicate permissions
- **WHEN** apply runs twice over an unchanged projection
- **THEN** each `Permission{principal, role, scope}` exists exactly once

#### Scenario: Derived permission reconciles onto an authored one
- **WHEN** a hand-authored `Permission{principal, role, scope}` exists and apply later derives the same tuple
- **THEN** apply reconciles onto the existing node and adds the `grants` edge rather than creating a second Permission

### Requirement: Apply preserves and soft-handles `grants` edges

The apply step SHALL treat `grants` edges like the authored governance edges (`can_access`/`assigned_to`): preserved across re-apply, never clobbered. When a `grants` edge's `Membership` or `Permission` endpoint vanishes, apply SHALL soft-handle the edge (mark it) rather than hard-delete it, keeping the broken causal link reviewable.

#### Scenario: grants preserved on re-apply
- **WHEN** apply runs again over an unchanged graph
- **THEN** existing `grants` edges remain intact and unduplicated

#### Scenario: Vanished membership soft-handles grants
- **WHEN** the Membership backing a `grants` edge is removed and apply runs
- **THEN** the `grants` edge is marked rather than hard-deleted
