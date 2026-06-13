## ADDED Requirements

### Requirement: Pack registry exposes a derived prompt renderer

The pack registry SHALL expose a function that renders a named pack's real `resourceTypes` and `relationshipTypes` definitions as a structured, human-readable prompt block. The rendered block SHALL be derived from the live `PackDefinition` (the same data used to seed the store) — no separate, hand-maintained vocabulary list. For each resource type the block SHALL include its `name`, `category`, and `description`. For each relationship type the block SHALL include its `name`, `from`→`to` endpoints, `cardinality`, and `description`. The renderer SHALL be importable from `packages/mcp/src/packs/` and re-exported from the package entry point so the agent can consume it.

#### Scenario: Renderer reflects the real pack definitions

- **WHEN** code calls the renderer with `operational`
- **THEN** the returned text lists every resource type in the operational pack with its category and description, and every relationship type with its `from`→`to` endpoints, cardinality, and description

#### Scenario: Renderer is the single source of truth

- **WHEN** a resource or relationship type is added to or changed in a pack definition under `packages/mcp/src/packs/`
- **THEN** the rendered prompt block reflects that change with no edits to any separate vocabulary table

#### Scenario: Renderer is importable from the package entry

- **WHEN** an external consumer imports from `@dna-codes/dna-mcp`
- **THEN** the pack-prompt renderer (and the `PACKS` definitions it reads) are available from the package's public exports
