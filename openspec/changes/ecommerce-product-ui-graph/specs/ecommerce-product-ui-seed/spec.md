## ADDED Requirements

### Requirement: A re-runnable ecommerce seed script exists

The repository SHALL provide an executable script (`scripts/seed-ecommerce.mjs`) that seeds a complete ecommerce graph into a running DNA MCP server over its `/mcp` JSON-RPC endpoint via `patch_graph`, transport-agnostic across the in-memory and Neo4j stores. It SHALL switch the session to Build mode before registering types, restore Operate mode when done, and register types only when absent (idempotent type registration).

#### Scenario: Seed runs against a running server

- **WHEN** an MCP server is running and `node scripts/seed-ecommerce.mjs <baseUrl>` is executed
- **THEN** the script SHALL complete without validation errors and leave the session in Operate mode

### Requirement: Seed creates a full operational layer

The seed SHALL create an operational layer that lights up the operational lenses: one `company`, multiple `department`s, multiple `position`s wired into a `reports_to` chain, `person`s linked by `fills`, and at least one `process` with `step`s wired by `next_step` and `assigned_to` a position.

#### Scenario: Operational lenses are populated

- **WHEN** the seed has run and `/lens/org-chart` is requested
- **THEN** it SHALL return a non-empty company→department→position tree with people holding positions

#### Scenario: Process flow is wired

- **WHEN** the seed has run
- **THEN** the graph SHALL contain a `process` whose `step`s are connected by `next_step` and each assigned to a `position`

### Requirement: Seed authors a product-UI graph

The seed SHALL author a product-UI graph using the materialized product types: one `App`, multiple `Module`s, `Workflow`s, `Page`s (each referencing a `Layout`), `Section`s, and `Component`s carrying a `type` and, where they surface data, a `resource` binding. It SHALL wire the tree with `contains` and connect product nodes to the operational layer with `realized_as` (e.g. Module→process, Page→step). It SHALL author `can_access` grants from roles/positions to product surfaces.

#### Scenario: App Preview renders the authored tree

- **WHEN** the seed has run and `/lens/product-app-preview` is requested
- **THEN** the view-model SHALL contain an `App` root nesting `Module → Workflow → Page → Section → Component`

#### Scenario: Orders page is bound to order data

- **WHEN** the seed has run
- **THEN** the Order Fulfillment Orders page SHALL have a table Component bound to `order`, and the lens `surfaceRecords` SHALL contain the seeded order rows

### Requirement: Seed creates business data for tables

The seed SHALL create business-data instances (`order`, `product`, `customer`) with display attributes so the product-UI tables have rows to render.

#### Scenario: Business data exists

- **WHEN** the seed has run
- **THEN** the store SHALL contain multiple `order`, `product`, and `customer` instances
