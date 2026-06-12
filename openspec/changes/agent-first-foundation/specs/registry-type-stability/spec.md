## ADDED Requirements

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
