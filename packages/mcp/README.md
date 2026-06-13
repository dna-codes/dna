# @dna-codes/dna-mcp

DNA MCP Server — exposes the DNA type registry and instance graph via the [Model Context Protocol](https://modelcontextprotocol.io/). Wraps `DnaDataStore`; designed for agent-first DNA creation and operation by business leaders.

## MCP surface

### Tools

| Tool | Description |
|---|---|
| `get_type_registry()` | Returns all `ResourceType` and `RelationshipType` records in one call |
| `query_instances({ type?, nameContains?, limit? })` | Find instances filtered by type and/or name substring |
| `get_links({ fromId, relationshipType? })` | Traverse edges from a given instance |
| `get_lens({ name })` | Run a lens transform — foundation supports `org-chart` |
| `patch_graph({ ops[] })` | Validated graph mutations — see PatchOp variants below |

### Resources

| Resource | Description |
|---|---|
| `dna://schema/resource-types` | All registered ResourceType records |
| `dna://schema/relationship-types` | All registered RelationshipType records |

### REST endpoints (for UI integration)

| Path | Description |
|---|---|
| `GET /lens/org-chart` | Org-chart view-model as JSON |
| `GET /session-config` | Returns `{ pack, mode }` |
| `POST /session-config` | Accepts `{ mode }` to switch mode at runtime (no graph reset) |
| `POST /reset` | Accepts `{ pack, mode }` to reseed the store and start a fresh session |

## Session mode

A session runs in one of two modes (`McpServerOptions.initialMode`, default `build`):

- **`build`** — type-focused. The registry is **open**: `add_resource_type` / `add_relationship_type` ops are allowed, and types are matured through the stability lifecycle (`experimental → beta → stable → deprecated`).
- **`operate`** — instance-focused. The registry is **locked**: type-schema ops are rejected with `"Type registry is locked in Operate mode — switch to Build mode to add or change types."`. Instance ops (`add_instance` / `add_link`) are allowed in both modes.

Locking is derived from mode — there is no separate lock flag.

## PatchOp variants

```typescript
{ op: "add_instance", type: string, name: string, attributes?: object }
{ op: "remove_instance", id: string, type: string }
{ op: "update_instance", id: string, type: string, attributes: object }
{ op: "add_link", type: string, from: string, to: string }
{ op: "remove_link", id: string }
{ op: "add_resource_type", name: string, category: NounCategory, description?: string, stability?: Stability }
{ op: "add_relationship_type", name: string, from_type: string, to_type: string, description?: string, stability?: Stability }
```

New types default to `stability: "experimental"` when `stability` is omitted.

## Agent contract exports

The package exports a single source of truth for the two things that shape an LLM agent's reliability — the system-prompt vocabulary and the `patch_graph` data contract — so the agent never re-derives or drifts from what the server seeds and validates:

| Export | Description |
|---|---|
| `PACKS`, `DEFAULT_PACK`, `PackName`, `PackDefinition` | The starter-pack registry — the real `resourceTypes`/`relationshipTypes` seeded into the store |
| `renderPackForPrompt(packName)` | Renders a pack's live definitions as a structured prompt block (resources as `name · category — desc`; relationships as `name · from→to · cardinality — desc`). The dna-agent system prompt consumes this instead of a hand-maintained vocabulary table |
| `patchGraphInputShape` | The Zod raw shape registered as the `patch_graph` tool input; the MCP SDK converts it to the JSON Schema advertised to clients |
| `PATCH_OPS_SCHEMA`, `PATCH_GRAPH_INPUT_SCHEMA` | The same contract as plain JSON Schema (derived from `patchGraphInputShape` via Zod v4's `z.toJSONSchema`), for downstream consumers |
| `patchOpSchema`, `PATCH_OP_NAMES` | The discriminated-union op schema and the list of op discriminators |

`add_instance` and `add_link` op shapes mirror the reference example documents (`resource → { type, name, … }`, `relationship → { type, from, to }`), so the agent emits familiar, well-structured ops.

## Auth middleware

The server accepts an optional `authMiddleware` hook. In the foundation it passes all requests through. To add WorkOS auth-md, inject a middleware at construction time:

```typescript
import { createMcpServer } from '@dna-codes/dna-mcp'

const server = createMcpServer({
  dataStore,
  authMiddleware: (req, res, next) => {
    // validate token, then call next() or res.writeHead(401).end()
    next()
  },
})
```

## Local development

```bash
# In-memory store (no Neo4j required)
DNA_MCP_PORT=3300 node dist/bin.js

# Neo4j store
NEO4J_URI=bolt://localhost:7687 \
NEO4J_USERNAME=neo4j \
NEO4J_PASSWORD=password \
DNA_MCP_PORT=3300 node dist/bin.js
```

## Running tests

```bash
npm test --workspace packages/mcp
```
