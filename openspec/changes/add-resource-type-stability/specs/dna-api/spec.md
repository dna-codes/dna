## ADDED Requirements

### Requirement: GraphQL registry exposes type stability
The dna-api GraphQL schema SHALL define a single `Stability` enum with members `EXPERIMENTAL`, `BETA`, `STABLE`, and `DEPRECATED`, mirroring the core `Stability` string union and shared by both registry type kinds. The resource-type and relationship-type registry objects SHALL each expose a non-null `stability: Stability!` field, and their version-history objects SHALL expose the stability recorded for that version.

#### Scenario: Resource-type query returns stability
- **WHEN** a client queries a resource type from the registry
- **THEN** the response SHALL include a `stability` field equal to one of `EXPERIMENTAL`, `BETA`, `STABLE`, or `DEPRECATED`

#### Scenario: Relationship-type query returns stability
- **WHEN** a client queries a relationship type from the registry
- **THEN** the response SHALL include a `stability` field equal to one of `EXPERIMENTAL`, `BETA`, `STABLE`, or `DEPRECATED`

#### Scenario: Version-history record exposes its stability
- **WHEN** a client queries a resource type's or relationship type's version history
- **THEN** each version entry SHALL include the `stability` recorded when that version was written

### Requirement: Create and update inputs accept stability
The mutation inputs that create or update a resource type or relationship type SHALL accept an optional `stability` value. On create, when `stability` is omitted, the seeding defaults SHALL apply (`stable` for foundational types, otherwise `experimental`). On update, omitting `stability` SHALL leave the existing value unchanged.

#### Scenario: Create with explicit stability
- **WHEN** a client creates a resource type with `stability: BETA`
- **THEN** the created type SHALL report `stability: BETA`

#### Scenario: Create without stability uses default
- **WHEN** a client creates a non-foundational resource type or a relationship type without specifying `stability`
- **THEN** the created type SHALL report `stability: EXPERIMENTAL`

### Requirement: Dedicated mutations transition stability without a schema change
The dna-api SHALL provide mutations to transition the `stability` of a resource type and of a relationship type (e.g. `setResourceTypeStability(id, stability)` and `setRelationshipTypeStability(id, stability)`) that update the lifecycle marker without changing the type's `attribute_schema` or incrementing `current_version`.

#### Scenario: Resource-type transition mutation updates only stability
- **WHEN** a client invokes `setResourceTypeStability` on a resource type at `current_version` N to set `stability: STABLE`
- **THEN** the type SHALL report `stability: STABLE` and `current_version` SHALL remain N

#### Scenario: Relationship-type transition mutation updates only stability
- **WHEN** a client invokes `setRelationshipTypeStability` on a relationship type at `current_version` N to set `stability: STABLE`
- **THEN** the type SHALL report `stability: STABLE` and `current_version` SHALL remain N
