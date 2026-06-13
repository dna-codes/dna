# registry-type-stability Specification

## Purpose
TBD - created by archiving change add-resource-type-stability. Update Purpose after archive.
## Requirements
### Requirement: Registry types carry a stability lifecycle marker
Every registry type — both `ResourceType` and `RelationshipType` records — SHALL carry a `stability` field whose value is one of `experimental`, `beta`, `stable`, or `deprecated`. The field SHALL be defined as a single shared string union (`Stability`) in `@dna-codes/dna-core` and stored on both the `ResourceType` and `RelationshipType` records. It expresses how settled the type's design is, independent of its data.

#### Scenario: Resource type exposes a stability value
- **WHEN** a `ResourceType` record is read from the registry
- **THEN** it SHALL include a `stability` field equal to one of `experimental`, `beta`, `stable`, or `deprecated`

#### Scenario: Relationship type exposes a stability value
- **WHEN** a `RelationshipType` record is read from the registry
- **THEN** it SHALL include a `stability` field equal to one of `experimental`, `beta`, `stable`, or `deprecated`

#### Scenario: Invalid stability value is rejected
- **WHEN** a registry type is created or updated with a `stability` value outside the four allowed strings
- **THEN** the operation SHALL fail with an error naming the invalid value

### Requirement: Stability is a property of the concept, not the schema version
The `stability` marker SHALL describe the type's stable identity (the *concept*), not any single schema revision, and SHALL be independent of the numeric schema `version`/`current_version`. Changing a type's `stability` SHALL NOT, by itself, increment its schema version, and incrementing a type's schema version SHALL NOT change its `stability`. Identity fields that are immutable today (`name` on resource types; `name`/`from`/`to` on relationship types) SHALL remain immutable and are not versioned.

#### Scenario: Schema version bump preserves stability
- **WHEN** a registry type's `attribute_schema` changes and `current_version` increments
- **THEN** the type's `stability` SHALL remain unchanged unless explicitly set in the same operation

#### Scenario: Stability transition does not bump schema version
- **WHEN** a registry type's `stability` transitions (e.g. `experimental` → `beta`) without any `attribute_schema` change
- **THEN** `current_version` SHALL NOT increment

### Requirement: Stability is a mutable lifecycle flag that can transition
The `stability` value on the live `ResourceType`/`RelationshipType` record SHALL be mutable and transition independently of schema-version bumps. The registry SHALL permit transitions in both directions (e.g. `experimental` → `beta` → `stable`, and any state → `deprecated`).

#### Scenario: Graduating a type's stability
- **WHEN** a registry type at `stability: experimental` is transitioned to `stable`
- **THEN** subsequent reads of that type SHALL report `stability: stable`

### Requirement: Version history records the stability in effect at write-time
Each immutable history record — `ResourceTypeVersion` and `RelationshipTypeVersion` — SHALL capture the `stability` value that was in effect when that version was written, so version history is self-describing.

#### Scenario: Version snapshot carries its stability
- **WHEN** a `ResourceTypeVersion` or `RelationshipTypeVersion` is created during a schema mutation
- **THEN** the snapshot SHALL record the type's `stability` at that moment

### Requirement: Foundational types seed as stable
When the registry is seeded, the four foundational resource types (Person, Role, Group, Resource) SHALL be created with `stability: stable`.

#### Scenario: Foundational types are stable on first boot
- **WHEN** `seedFromDna` bootstraps the four foundational types on first boot
- **THEN** each of Person, Role, Group, and Resource SHALL have `stability: stable`

### Requirement: Tenant types default to experimental
Resource and relationship types seeded from a DNA document (`domain.*[]` collections and `relationships[]`) SHALL default to `stability: experimental` when the authored definition does not declare a stability. When the authored definition declares a `stability`, the declared value SHALL be used instead. Because the `is_seed` flag does not distinguish foundational types from tenant types (both are seeded), the seeding logic SHALL identify foundational types by their well-known identity (Person, Role, Group, Resource) rather than by `is_seed` alone.

#### Scenario: Undeclared tenant resource type defaults to experimental
- **WHEN** a DNA document declares a Resource with no `stability` field and the registry seeds it
- **THEN** the resulting `ResourceType` SHALL have `stability: experimental`

#### Scenario: Undeclared tenant relationship type defaults to experimental
- **WHEN** a DNA document declares a relationship with no `stability` field and the registry seeds it
- **THEN** the resulting `RelationshipType` SHALL have `stability: experimental`

#### Scenario: Declared stability is honored at seed time
- **WHEN** a DNA document declares a Resource or relationship with `stability: beta` and the registry seeds it
- **THEN** the resulting type SHALL have `stability: beta`

### Requirement: Stability persists and round-trips across data stores
Both the in-memory and Neo4j `DnaDataStore` implementations SHALL persist `stability` on `ResourceType`, `RelationshipType`, and their version records, and return it on reads. Records persisted before this field existed SHALL be read with a default value — `stable` for the four foundational types, `experimental` otherwise.

#### Scenario: Stability round-trips through a data store
- **WHEN** a registry type with `stability: beta` is written and then read back from a data store
- **THEN** the read record SHALL report `stability: beta`

#### Scenario: Legacy record without stability gets a default
- **WHEN** a registry-type record persisted before this change (lacking `stability`) is read
- **THEN** the store SHALL return `stability: stable` for a foundational type and `experimental` otherwise

### Requirement: Agent-initiated type creation defaults to `stability: experimental`

When a `ResourceType` or `RelationshipType` is created through the `patch_graph` MCP tool without an explicit `stability` value, the MCP server SHALL default the `stability` to `experimental`. This applies to all types created via the agent conversation flow.

#### Scenario: Type created via patch_graph without explicit stability defaults to experimental
- **WHEN** an MCP client calls `patch_graph` with an `add_resource_type` op that omits `stability`
- **THEN** the created `ResourceType` record has `stability: "experimental"`

#### Scenario: Type created with explicit stability respects the provided value
- **WHEN** an MCP client calls `patch_graph` with an `add_resource_type` op that includes `stability: "beta"`
- **THEN** the created `ResourceType` record has `stability: "beta"`

### Requirement: `patch_graph` supports `add_resource_type` and `add_relationship_type` operations

The `patch_graph` tool SHALL accept two additional `PatchOp` variants for creating new types in the registry:

- `{ op: "add_resource_type", name: string, category: NounCategory, description?: string, stability?: Stability, attribute_schema?: AttributeSchema }`
- `{ op: "add_relationship_type", name: string, from_type: string, to_type: string, description?: string, stability?: Stability }`

Both SHALL validate that `name` is unique within their respective type collections before committing.

#### Scenario: New resource type is added to the registry via patch
- **WHEN** an MCP client calls `patch_graph` with `{ op: "add_resource_type", name: "Squad", category: "group" }`
- **THEN** a new `ResourceType` named `Squad` with `category: "group"` and `stability: "experimental"` is added to the store

#### Scenario: Duplicate type name is rejected
- **WHEN** an MCP client calls `patch_graph` with `{ op: "add_resource_type", name: "Position" }` and a `Position` type already exists
- **THEN** the server returns an error naming the conflict and no changes are committed

