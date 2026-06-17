## ADDED Requirements

### Requirement: Operational `Position` resource type

The operational layer SHALL define a `Position` resource type — the organizational position a Person fills (e.g. Underwriter, Doctor, LeadCounsel, Head of P&T). `Position` replaces the former operational `Role` primitive and carries every field that `Role` carried unchanged: `name`, optional `attributes[]`, optional `actions[]`, `description`, `domain`, `scope`, `parent`, `system`, `resource`, `cardinality`, `required`, `excludes`. Its schema `$id` SHALL be `.../operational/position`, its `type` const SHALL be `"position"`, and it SHALL be declared in a Domain's `positions[]` collection.

#### Scenario: Position schema replaces Role schema
- **WHEN** the operational schemas are loaded
- **THEN** a `position` schema exists at `$id` `.../operational/position` with `type` const `"position"`
- **AND** no `role` schema remains in the operational layer

#### Scenario: Position carries all former Role constraint fields
- **WHEN** a Position declares `scope`, `parent`, `cardinality`, `required`, or `excludes`
- **THEN** the validator applies the same well-formedness checks previously applied to Role (scope resolves to a Group, parent has no cycles and narrower-or-equal scope, `excludes` is symmetric and shares scope, `system: true` is incompatible with cardinality/required/excludes/membership)

#### Scenario: System Position is ineligible for Membership
- **WHEN** a Position declares `system: true`
- **THEN** no Membership may reference it, exactly as for the former system Role

### Requirement: `Membership` references a Position

A `Membership` SHALL reference its middle term via the field `position` (replacing `role`). The triad is Person + Position + Group, where `group` remains optional. `Membership.position` SHALL reference a declared Position by name; `Membership.role` SHALL no longer be valid.

#### Scenario: Membership uses position field
- **WHEN** a Membership is authored as `{ name, person, position, group? }`
- **THEN** it validates and the validator resolves `position` against declared Positions

#### Scenario: Legacy role field is rejected
- **WHEN** a Membership is authored with a `role` field
- **THEN** validation fails (unevaluated property), signalling the rename

### Requirement: Operation target resolution includes Position

Operation `target` resolution SHALL resolve across `Resource | Person | Position | Group`. An Operation whose target is a Position (e.g. `Underwriter.Activate`) SHALL resolve to the declared Position.

#### Scenario: Operation targets a Position
- **WHEN** an Operation declares `target: "Underwriter"` and `Underwriter` is a declared Position
- **THEN** the validator resolves the target to that Position
