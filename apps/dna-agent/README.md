# DNA Agent

Business-leader UI for creating and operating company DNA through a natural language agent interface.

**Two panels:**
- Left: Conversation with the DNA Agent (Claude)
- Right: Live org-chart lens — updates automatically after graph patches

## Modes: Build & Operate

The agent runs in one of two modes, chosen at session setup and switchable from the header (the toggle replaces the old open/locked control):

- **🧬 Build** — model and mature resource & relationship *types*. The registry is open: the agent can create new types and promote them through the stability lifecycle (`experimental → beta → stable → deprecated`). Asking "how would this type behave?" produces a **narrated dry-run** — example instances described in chat, never committed to the graph. The lenses render the **type registry** (the grammar), not instances: **Schema Graph** (types as nodes, relationship types as edges), **Org Chart** (the `belongs_to`/`reports_to` structural spine, or types grouped by category when there's no containment), **Reporting Chains** (the `reports_to` relationship types), and **Job Descriptions** (a definition card per type — attributes, stability badge, and incoming/outgoing relationships).
- **⚙️ Operate** — run real operations on *instances*. The registry is locked (no new types); the agent maps every concept to an existing type and wires real resources/relationships. The full set of operational lenses (org-chart, pipeline, roster, …) is shown.

Mode lives in the MCP server's session-config and is read on load (`GET /api/session-config`); the header shows a brief loading state until it resolves. Switching mode does **not** reset the graph — only the agent's framing, the allowed patch ops, and the visible lenses change.

## Setup

```bash
cp .env.example .env.local
# Fill in ANTHROPIC_API_KEY and DNA_MCP_URL
```

## Running

The DNA Agent app requires the MCP server to be running separately.

**1. Start the MCP server** (from repo root):

```bash
# In-memory (dev/demo — data resets on restart)
DNA_MCP_PORT=3300 node packages/mcp/dist/bin.js

# With Neo4j (persistent)
NEO4J_URI=bolt://localhost:7687 \
NEO4J_USERNAME=neo4j \
NEO4J_PASSWORD=password \
DNA_MCP_PORT=3300 node packages/mcp/dist/bin.js
```

**2. Start the Next.js app:**

```bash
npm run dev --workspace apps/dna-agent
# Opens at http://localhost:3200
```

## Environment variables

| Variable | Description |
|---|---|
| `ANTHROPIC_API_KEY` | Anthropic API key for Claude |
| `DNA_MCP_URL` | URL of the DNA MCP Server (e.g. `http://localhost:3300/mcp`) |

## Architecture

```
Browser ──► Next.js app (port 3200)
              │
              ├─ /api/chat ──► Anthropic SDK ──► Claude
              │                    │ MCP client
              │                    └──────────────────► DNA MCP Server (port 3300)
              │                                              │
              └─ /api/lens/org-chart ──► GET /lens/org-chart┘
                                              │
                                          DnaDataStore
                                        (Neo4j or memory)
```

### System prompt

`lib/system-prompt.ts` builds Claude's system prompt. The active-pack vocabulary
is **derived** from `@dna-codes/dna-mcp`'s `renderPackForPrompt(packName)` — the
same pack definitions seeded into the MCP server's type registry — so the prompt
can't drift from what the server validates. There is no hand-maintained pack
table in the app. The `patch_graph` tool the agent calls advertises a JSON Schema
data contract (also from `@dna-codes/dna-mcp`) whose `add_instance`/`add_link`
ops mirror the reference example documents.
