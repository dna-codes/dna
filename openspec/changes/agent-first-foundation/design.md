## Context

DNA's `DnaDataStore` interface (backed by Neo4j or in-memory) already stores `ResourceType` and `RelationshipType` records as first-class versioned entities alongside `InstanceRecord` and `LinkRecord` data. `apps/graph-studio` already reads from Neo4j via this interface and renders six lens views. The missing layer is an agent interface: a way for business leaders to query and mutate the graph in natural language, with the type registry as the constraint system.

This change builds two new packages that sit on top of the existing store without modifying it:

1. `packages/mcp` — wraps `DnaDataStore` in the MCP protocol
2. `apps/dna-agent` — a Next.js app where business leaders talk to a Claude agent connected to the MCP server

## Goals / Non-Goals

**Goals:**
- Prove the end-to-end loop: natural language → type registry lookup → patch graph → live lens re-render
- Keep `packages/mcp` as a pure transport wrapper — no business logic, no DNA semantics beyond what `DnaDataStore` already provides
- Agent grammar is driven by the registered type system at runtime, not hardcoded knowledge
- Pushback is LLM reasoning over the full registry in context (no embeddings required — registries are small)
- All new code is isolated to `packages/mcp` and `apps/dna-agent`; zero changes to existing packages

**Non-Goals:**
- Production auth (WorkOS auth-md is stubbed — middleware shape is wired, real validation is a follow-on)
- Full lens suite (org chart only in foundation; other lenses are additive later)
- Type promotion workflow (experimental → stable is manual for now)
- MCP-UI / rich rendered responses (agent can link to Graph Studio for visual views)
- Multi-company tenancy (foundation targets a single configured company)

## Decisions

### 1. `packages/mcp` as a standalone HTTP server, not embedded in `dna-api`

`dna-api` is a GraphQL server that generates a schema from an `OperationalDNA` document. The MCP server serves a different contract: it exposes the *live type registry and instance graph* via MCP protocol tools. These are different surfaces for different clients (LLMs vs. human-facing GraphQL clients). Combining them would couple MCP tool semantics to GraphQL schema generation, making both harder to evolve independently.

**Alternative considered:** Add MCP routes to `dna-api`. Rejected because `dna-api` generates its schema at startup from a static DNA document; the MCP server needs to reflect the live, runtime-mutable type registry.

### 2. `apps/dna-agent` as a new Next.js app, not an extension of `apps/graph-studio`

Graph Studio is a developer/builder tool for inspecting DNA fixtures. The agent UI is a business-leader tool for creating and operating DNA. Different audiences, different interaction models, different trust levels. Separating them keeps Graph Studio's fixture-based approach stable and gives the agent UI room to evolve its UX independently.

**Alternative considered:** Add an agent panel to Graph Studio. Rejected — it would mix developer and business-leader surfaces in a single app and would require modifying an existing stable app.

### 3. Full type registry loaded into agent context at conversation start

When a conversation begins, the agent calls `get_type_registry()` and receives all `ResourceType` and `RelationshipType` records. For the registry sizes expected (10–100 types), this fits comfortably in a single tool call response and eliminates round-trips during patch generation.

**Alternative considered:** Lazy per-query type lookup. Rejected because the agent needs to reason holistically about overlap and conflict across all types — loading the full registry enables that reasoning without multiple tool calls.

### 4. Pushback via LLM reasoning, not vector similarity

The agent has the full type registry in context when a user proposes a new type. Claude can reason about semantic overlap ("Squad looks like Group or Team") without embeddings. This avoids an additional infrastructure dependency (vector store, embedding model) and is accurate enough for the small registry sizes in scope.

**Alternative considered:** Semantic vector search over type names and descriptions. Deferred — may be worth revisiting at scale (100+ types), but adds infrastructure complexity that is premature for the foundation.

### 5. New types created at `stability: experimental`

When a business leader proposes a new type and the agent proceeds (after surfacing any conflicts), the type is created with `stability: experimental`. This signals "this is provisional" without blocking use. The stability lifecycle (`experimental → beta → stable`) is already defined in `registry-type-stability` and requires no modification.

### 6. Auth-md stubbed — middleware shape present, no real validation

The MCP server includes an auth middleware hook in its request path, but in the foundation the middleware passes all requests through. The shape is wired so the follow-on WorkOS integration only needs to fill in the validation logic, not restructure the server.

## Risks / Trade-offs

- **Neo4j required at runtime** → Mitigation: in-memory adapter works for dev and tests, identical to Graph Studio's pattern. Document the env vars clearly.
- **Agent may generate structurally valid but semantically odd patches** (e.g. linking a `person` to a `person` via `reports_to`) → Mitigation: `DnaValidator` rejects schema-invalid patches; for semantically odd but schema-valid patches, the live lens update makes the consequence immediately visible to the user.
- **Pushback quality depends on Claude's reasoning** → Mitigation: the type registry is loaded verbatim into context; Claude reliably detects name/description overlap. If a false positive occurs, the user can explicitly override and proceed.
- **Single-company scope in foundation** → Mitigation: the company ID is a configurable env var; multi-tenancy is an additive layer on the MCP server's auth middleware in a follow-on.

## Open Questions

- Should the agent conversation history persist across page loads (e.g., stored in Neo4j or local browser storage), or is each session ephemeral? Foundation can be ephemeral; persistence is a follow-on.
- Should `patch_graph` ops be presented to the user for confirmation before commit, or committed immediately with an undo mechanism? Foundation commits immediately and shows the live lens update as confirmation.
