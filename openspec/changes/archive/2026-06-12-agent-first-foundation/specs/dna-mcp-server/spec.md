## ADDED Requirements

### Requirement: Package exists at `packages/mcp` as `@dna-codes/dna-mcp`

A new TypeScript package SHALL live at `packages/mcp/` in the monorepo, published as `@dna-codes/dna-mcp`. It SHALL declare `@dna-codes/dna-core` and `@dna-codes/dna-adapters` as runtime dependencies. It SHALL build with `tsc` and test with Jest, matching the existing workspace pattern.

#### Scenario: Package builds successfully
- **WHEN** `npm run build --workspace @dna-codes/dna-mcp` is invoked
- **THEN** TypeScript emits artifacts to `packages/mcp/dist/` without errors

#### Scenario: Package is wired into the root workspace
- **WHEN** the root `package.json` is read
- **THEN** the `workspaces` array includes `packages/mcp`

### Requirement: MCP server exposes type registry as readable resources

The server SHALL expose the registered `ResourceType` and `RelationshipType` records as MCP resources at `dna://schema/resource-types` and `dna://schema/relationship-types` respectively. Each resource SHALL return the current live records from the configured `DnaDataStore`.

#### Scenario: Resource types resource returns all registered types
- **WHEN** an MCP client reads `dna://schema/resource-types`
- **THEN** the response contains all `ResourceType` records currently in the store, including `id`, `name`, `category`, `attribute_schema`, `stability`, and `current_version`

#### Scenario: Relationship types resource returns all registered types
- **WHEN** an MCP client reads `dna://schema/relationship-types`
- **THEN** the response contains all `RelationshipType` records currently in the store, including `id`, `name`, `from_type`, `to_type`, `cardinality`, and `stability`

### Requirement: `get_type_registry` tool returns full type registry in one call

The server SHALL expose a `get_type_registry()` MCP tool that returns all `ResourceType` and `RelationshipType` records from the store in a single response, suitable for loading into an agent's context at conversation start.

#### Scenario: Tool returns both resource and relationship types
- **WHEN** an MCP client calls `get_type_registry()`
- **THEN** the response includes two arrays: `resourceTypes` and `relationshipTypes`, each containing all currently registered records

### Requirement: `query_instances` tool supports filtered instance lookup

The server SHALL expose a `query_instances({ type?, nameContains?, limit? })` MCP tool that returns `InstanceRecord` results matching the filter. `type` filters by ResourceType name; `nameContains` is a case-insensitive substring match on the instance name.

#### Scenario: Query by type returns matching instances
- **WHEN** an MCP client calls `query_instances({ type: "position" })`
- **THEN** the response contains only instances whose ResourceType name is `position`

#### Scenario: Query by nameContains returns matching instances
- **WHEN** an MCP client calls `query_instances({ nameContains: "Operations" })`
- **THEN** the response contains instances whose name includes "operations" (case-insensitive)

### Requirement: `get_links` tool traverses edges from a given instance

The server SHALL expose a `get_links({ fromId, relationshipType? })` MCP tool that returns all `LinkRecord` results originating from the given instance ID, optionally filtered by relationship type name.

#### Scenario: Get all links from an instance
- **WHEN** an MCP client calls `get_links({ fromId: "person:zoe" })`
- **THEN** the response contains all links where the `from` side is `person:zoe`

#### Scenario: Get links filtered by relationship type
- **WHEN** an MCP client calls `get_links({ fromId: "person:zoe", relationshipType: "fills" })`
- **THEN** the response contains only links of type `fills` originating from `person:zoe`

### Requirement: `patch_graph` tool validates and applies graph mutations

The server SHALL expose a `patch_graph({ ops: PatchOp[] })` MCP tool. Before committing, the server SHALL validate each operation against the registered type system via `DnaValidator`. If any operation is invalid the entire patch SHALL be rejected with a structured error listing each violation. On success, all operations SHALL be applied atomically.

`PatchOp` variants:
- `{ op: "add_instance", type: string, name: string, attributes?: object }`
- `{ op: "remove_instance", id: string }`
- `{ op: "update_instance", id: string, attributes: object }`
- `{ op: "add_link", type: string, from: string, to: string }`
- `{ op: "remove_link", id: string }`

#### Scenario: Valid patch is applied and returns updated IDs
- **WHEN** an MCP client calls `patch_graph` with a valid `add_instance` op for a registered ResourceType
- **THEN** the instance is written to the store and the response includes the new instance's `id`

#### Scenario: Invalid patch referencing an unregistered type is rejected
- **WHEN** an MCP client calls `patch_graph` with an `add_instance` op whose `type` does not exist in the registry
- **THEN** the server returns an error naming the unknown type and no changes are committed

#### Scenario: Invalid link referencing wrong endpoint types is rejected
- **WHEN** an MCP client calls `patch_graph` with an `add_link` op whose `from` instance type does not match the RelationshipType's declared `from_type`
- **THEN** the server returns a validation error and no changes are committed

### Requirement: `get_lens` tool returns a computed lens view-model

The server SHALL expose a `get_lens({ name: string })` MCP tool that runs the named lens transform over the current graph and returns the resulting view-model. Supported lens names in the foundation: `org-chart`.

#### Scenario: Org-chart lens returns a valid view-model
- **WHEN** an MCP client calls `get_lens({ name: "org-chart" })`
- **THEN** the response contains a structured org-chart view-model with root positions, reports, and holder names

#### Scenario: Unknown lens name returns an error
- **WHEN** an MCP client calls `get_lens({ name: "unknown-lens" })`
- **THEN** the server returns an error naming the unsupported lens

### Requirement: Auth middleware is present but passes all requests in the foundation

The MCP server request path SHALL include an auth middleware hook that, in the foundation, passes all requests through without validation. The hook interface SHALL be designed so a WorkOS auth-md implementation can be injected later without restructuring the server.

#### Scenario: Requests succeed without auth headers in foundation mode
- **WHEN** an MCP client sends a request with no authorization headers
- **THEN** the server processes the request normally

#### Scenario: Auth middleware is a pluggable hook
- **WHEN** the server is constructed with a custom `authMiddleware` option
- **THEN** that middleware is invoked for every incoming request before the MCP handler
