# DNA Agent

Business-leader UI for creating and operating company DNA through a natural language agent interface.

**Two panels:**
- Left: Conversation with the DNA Agent (Claude)
- Right: Live org-chart lens — updates automatically after graph patches

## Modes: Build & Operate

The agent runs in one of two modes, chosen at session setup and switchable from the header (the toggle replaces the old open/locked control):

- **🧬 Build** — model and mature resource & relationship *types*. The registry is open: the agent can create new types and promote them through the stability lifecycle (`experimental → beta → stable → deprecated`). Asking "how would this type behave?" produces a **narrated dry-run** — example instances described in chat, never committed to the graph. The lenses render the **type registry** (the grammar), not instances: **Schema Graph** (types as nodes, relationship types as edges), **Org Chart** (the `belongs_to`/`reports_to` structural spine, or types grouped by category when there's no containment), **Reporting Chains** (the `reports_to` relationship types), and **Job Descriptions** (a definition card per type — attributes, stability badge, and incoming/outgoing relationships).
- **⚙️ Operate** — run real operations on *instances*. The registry is locked (no new types); the agent maps every concept to an existing type and wires real resources/relationships. The full set of operational lenses (org-chart, pipeline, roster, …) is shown, plus the **App Preview** lens.

Mode lives in the MCP server's session-config and is read on load (`GET /api/session-config`); the header shows a brief loading state until it resolves. Switching mode does **not** reset the graph — only the agent's framing, the allowed patch ops, and the visible lenses change.

### App Preview lens (Operate mode)

The **App Preview** lens (`product-app-preview`) shows the **Product-UI graph** — the `App → Module → Workflow → Page → Section → Component` tree — through two render paths, picked automatically by the lens (`packages/mcp/src/lenses/product-app-preview.ts`):

- **Materialized (authored)** — when the store holds product instances (`App`/`Module`/`Workflow`/`Page`/`Section`/`Component`), the tree is read directly from those instances and their `contains` edges. Each `Component` exposes its UI `type` (the `@dna/ui-library` binding, e.g. `button`/`table`), each `Page` its `layout`, and a Component's `resource` binding drives the page's record table. This is what the ecommerce seed produces.
- **Derived (fallback)** — when nothing is materialized, the pure business→product `project()` (`@dna-codes/dna-core`) produces an `App → Module → Page` tree, exactly as before.

Either way it is **read-only** (building the view never writes), and the tree is rendered through the **two-grain access gate** from `@dna-codes/dna-react`:
- **Coarse** — each surface is wrapped in `<Surface>`; a surface the chosen subject cannot `can_access` (cascade-down over `contains`) is not rendered.
- **Fine** — each action control is wrapped in `<Operation>`; an operation the subject's roles cannot perform renders disabled.

A **Preview as** selector drives the subject: pick a role to see the app through its access, or "All access (author)" to bypass the coarse gate. Switching re-gates live without re-fetching.

**JSON-driven app shell.** The panel is a small renderer over the lens JSON: a left **sidebar** lists the App's pages grouped by Module (active page highlighted), and a content pane renders the selected Page — its **Sections**, each rendering its **Components** mapped to `@dna/ui-library` elements **by the node's `uiType`** (`button`→Button, `card`→Card, `select`→Select, `input`/`search`→Input, `badge`/`tag`, `checkbox`, `switch`, `table`→Table, …; unmapped types render a labeled placeholder). A `table` Component renders the bound resource's rows (from the lens's `surfaceRecords`, keyed by the component surface). Everything is styled with the ui-library `--ui-*` tokens + `data-ui-*` skin (a `Table` primitive was added to `@dna/ui-library` for this). Navigation is driven by the headless state machine from `@dna/ui-library` (`Machine.Root` + `Machine.Send`, XState under the hood): the selected page key rides in machine context; the sidebar items dispatch `NAVIGATE`. The first page is shown by default.

> **React dedupe:** `@dna/ui-library` carries a nested React 19 while this app pins React 18. `next.config.ts` (Turbopack + webpack alias) and the Jest `moduleNameMapper` force a single React instance so library-created elements are valid children here.

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

# With Neo4j (persistent — the graph survives restarts)
NEO4J_URI=bolt://localhost:7687 \
NEO4J_USERNAME=neo4j \
NEO4J_PASSWORD=devpassword \
DNA_MCP_PORT=3300 node packages/mcp/dist/bin.js
```

For a turnkey local Neo4j, bring up the service already defined in `packages/api/docker-compose.yml`
(`docker compose -f packages/api/docker-compose.yml up -d neo4j` → Bolt on `localhost:7687`,
user `neo4j` / password `devpassword`) and use the `NEO4J_*` values above. With Neo4j your graph
persists across restarts; the in-app **reset** still works — it wipes the database and reseeds the
pack (destructive), then keeps serving from Neo4j.

**2. Start the Next.js app:**

```bash
npm run dev --workspace apps/dna-agent
# Opens at http://localhost:3200
```

**3. (Optional) Load an example organization.** The packs register only *types*, so a
fresh store has empty lenses. Two ways to populate a complete worked example:

- **In the app** — the session-setup modal has an **Example organization** section. Pick
  **Shopwave (E-commerce)** and click **Load example**: the app resets the store and seeds
  the full graph (`POST /api/examples`), then opens in Operate mode.
- **From the CLI** — run the re-runnable seed against the MCP server:
  ```bash
  node scripts/seed-ecommerce.mjs http://localhost:3300
  ```

Both share one source — `apps/dna-agent/lib/examples/ecommerce-seed.mjs` (`EXAMPLES` +
`applyEcommerceSeed`) — so the example data lives in exactly one place. It seeds three
layers in one graph:

- **Operational** — company / departments / positions (+`reports_to`) / people (+`fills`) / processes / steps (+`next_step`, +`assigned_to`). Lights up org-chart, people-positions, reporting-chains, span-of-control, and job-descriptions.
- **Product UI** (authored) — `App → Module → Workflow → Page (Layout) → Section → Component`, wired by `contains`, connected to the operational layer by `realized_as`, governed by `can_access`. Components carry a UI `type` and, where they surface data, a `resource` binding (e.g. the Orders page's table is bound to `order`).
- **Business data** — `order` / `product` / `customer` instances so the product-UI tables have rows.

The script talks to the server over `patch_graph` (transport-agnostic: in-memory or Neo4j),
flips to Build mode before seeding, and restores Operate mode. The product UI types
(`App`/`Module`/…) and structural/governance relationship types (`contains`/`realized_as`/
`can_access`) are registered by the MCP server on boot (`seedProductTypes`). With Neo4j the
seeded graph persists across restarts. ⚠️ The in-app **reset** (e.g. choosing a pack in
session setup) wipes the store and reseeds the pack — re-run the seed afterwards.

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
