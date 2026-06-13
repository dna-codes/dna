# dna-mcp-server Specification

## Purpose
TBD - created by archiving change agent-first-foundation. Update Purpose after archive.
## Requirements
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

The server SHALL expose a `patch_graph({ ops: PatchOp[] })` MCP tool. The tool's input SHALL declare a JSON Schema data contract for `ops` (replacing any untyped `array<any>` shape), so that agent clients such as Anthropic receive a structural contract for every operation. The schema SHALL define `ops` as an array of op variants discriminated by a `const` `op` field, where the instance and link variants mirror the shape of the reference example documents (`add_instance` carries `type`, `name`, optional `attributes`; `add_link` carries `type`, `from`, `to`). Before committing, the server SHALL validate each operation against the registered type system. If any operation is invalid the entire patch SHALL be rejected with a structured error listing each violation. On success, all operations SHALL be applied atomically. The JSON Schema constrains generation; runtime validation remains the guarantee of correctness.

`PatchOp` variants:
- `{ op: "add_instance", type: string, name: string, attributes?: object }`
- `{ op: "remove_instance", id: string, type: string }`
- `{ op: "update_instance", id: string, type: string, attributes: object }`
- `{ op: "add_link", type: string, from: string, to: string }`
- `{ op: "remove_link", id: string }`
- `{ op: "add_resource_type", name: string, category: string, description?: string, stability?: string, attribute_schema?: array }`
- `{ op: "add_relationship_type", name: string, from_type: string, to_type: string, description?: string, stability?: string }`

#### Scenario: Tool advertises a structured input schema

- **WHEN** an MCP client lists tools and inspects `patch_graph`
- **THEN** the tool's `input_schema` describes `ops` as a typed array of op variants (not an untyped `array<any>`), with `add_instance` and `add_link` variants matching the example resource/relationship shapes

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

### Requirement: Package exports the patch-op JSON Schema and pack-prompt renderer

The `@dna-codes/dna-mcp` package SHALL export, from its public entry point, the patch-op JSON Schema used as `patch_graph`'s data contract and the pack-prompt renderer that produces a structured prompt block from a pack definition. These exports give downstream consumers (notably the dna-agent system prompt) a single shared source of truth for both the op contract and the pack vocabulary.

#### Scenario: Patch schema is exported and matches the tool contract

- **WHEN** a consumer imports the patch-op JSON Schema from `@dna-codes/dna-mcp`
- **THEN** the imported schema is the same contract advertised by the `patch_graph` tool's `input_schema`

#### Scenario: Schema stays congruent with the PatchOp type union

- **WHEN** the package test suite runs
- **THEN** a test asserts that every `op` variant in the `PatchOp` TypeScript union has a corresponding variant in the exported JSON Schema

