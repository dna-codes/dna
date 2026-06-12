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
