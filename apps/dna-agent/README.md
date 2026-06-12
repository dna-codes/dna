# DNA Agent

Business-leader UI for creating and operating company DNA through a natural language agent interface.

**Two panels:**
- Left: Conversation with the DNA Agent (Claude)
- Right: Live org-chart lens — updates automatically after graph patches

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
