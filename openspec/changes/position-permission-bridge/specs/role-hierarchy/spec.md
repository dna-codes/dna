## RENAMED Requirements

- FROM: `### Requirement: Role.parent resolution`
- TO: `### Requirement: Position.parent resolution`

- FROM: `### Requirement: Cycle detection in Role.parent chains`
- TO: `### Requirement: Cycle detection in Position.parent chains`

- FROM: `### Requirement: Role.cardinality declares per-scope-instance count limit`
- TO: `### Requirement: Position.cardinality declares per-scope-instance count limit`

- FROM: `### Requirement: Role.required declares per-scope-instance presence`
- TO: `### Requirement: Position.required declares per-scope-instance presence`

- FROM: `### Requirement: Role.excludes declares same-scope mutual exclusion`
- TO: `### Requirement: Position.excludes declares same-scope mutual exclusion`

- FROM: `### Requirement: Role cardinality, required, and excludes are modeling-layer declarations only`
- TO: `### Requirement: Position cardinality, required, and excludes are modeling-layer declarations only`

## MODIFIED Requirements

### Requirement: Position.parent resolution

A `Position.parent` value SHALL reference the `name` of another declared `Position` within the same Operational document. The validator SHALL emit an error naming the missing parent and the available Position names when the reference does not resolve. All hierarchy, scope-inheritance, cardinality, required, and excludes semantics previously defined for `Role` apply unchanged to `Position`; only the primitive name and the `positions[]`/`Membership.position` references change.

#### Scenario: Parent resolves to a declared Position
- **WHEN** an Operational document declares Positions `Underwriter` and `SeniorUnderwriter` with `SeniorUnderwriter.parent = "Underwriter"`
- **THEN** validation passes for the parent reference

#### Scenario: Parent does not resolve
- **WHEN** a Position declares `parent = "Manager"` and no Position named `Manager` exists in the document
- **THEN** validation fails with an error at path `positions/<child>/parent` whose message names `"Manager"` and lists the available Position names alphabetically and quoted

### Requirement: Action and Membership inheritance are explicitly out of scope

Position hierarchy SHALL NOT imply inheritance of `actions[]` or Memberships: children declare their own `actions[]`, and Memberships reference Positions by exact name via `Membership.position`.

#### Scenario: Membership references a Position by exact name
- **WHEN** a Membership references child Position `SeniorUnderwriter`
- **THEN** it does not implicitly apply to parent Position `Underwriter`, and vice versa
