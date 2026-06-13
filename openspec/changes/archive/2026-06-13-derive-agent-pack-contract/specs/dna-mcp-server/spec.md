## MODIFIED Requirements

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

## ADDED Requirements

### Requirement: Package exports the patch-op JSON Schema and pack-prompt renderer

The `@dna-codes/dna-mcp` package SHALL export, from its public entry point, the patch-op JSON Schema used as `patch_graph`'s data contract and the pack-prompt renderer that produces a structured prompt block from a pack definition. These exports give downstream consumers (notably the dna-agent system prompt) a single shared source of truth for both the op contract and the pack vocabulary.

#### Scenario: Patch schema is exported and matches the tool contract

- **WHEN** a consumer imports the patch-op JSON Schema from `@dna-codes/dna-mcp`
- **THEN** the imported schema is the same contract advertised by the `patch_graph` tool's `input_schema`

#### Scenario: Schema stays congruent with the PatchOp type union

- **WHEN** the package test suite runs
- **THEN** a test asserts that every `op` variant in the `PatchOp` TypeScript union has a corresponding variant in the exported JSON Schema
