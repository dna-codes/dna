# starter-pack-registry Specification

## Purpose

Defines the starter-pack registry — named vocabularies of resource and relationship types (`operational`, `crm`, `hr`) that seed a fresh DNA store and supply the agent's pack-aware vocabulary. The registry is the single source of truth shared between the MCP server's seeded type registry and the dna-agent system prompt.

## Requirements

### Requirement: Pack registry defines named type vocabularies
The system SHALL provide a pack registry — a static map of named packs, each containing arrays of resource type and relationship type definitions. Initial packs SHALL be: `operational`, `crm`, `hr`. The registry SHALL be importable from `packages/mcp/src/packs/index.ts`.

#### Scenario: Registry exports all packs by name
- **WHEN** code imports from the pack registry
- **THEN** it can access each pack by its string key (`operational`, `crm`, `hr`)

#### Scenario: Each pack includes resource and relationship types
- **WHEN** a pack is accessed
- **THEN** it contains a `resourceTypes` array and a `relationshipTypes` array, each with the fields required by `DnaDataStore.resourceType.create` and `DnaDataStore.relationshipType.create`

### Requirement: Operational pack formalizes the existing default schema
The `operational` pack SHALL include all types currently defined in `default-schema.ts`: `person`, `position`, `department`, `company`, `process`, `step` as resource types; `fills`, `reports_to`, `belongs_to`, `assigned_to`, `next_step` as relationship types. The `operational` pack SHALL be the default when no pack is specified.

#### Scenario: Operational pack seeds org types
- **WHEN** the operational pack is seeded into a fresh store
- **THEN** the store contains resource types: person, position, department, company, process, step
- **THEN** the store contains relationship types: fills, reports_to, belongs_to, assigned_to, next_step

### Requirement: CRM pack seeds sales domain types
The `crm` pack SHALL include resource types for `contact`, `account`, `opportunity`, `deal`, `activity`; and relationship types `owned_by` (account→person), `belongs_to` (*→*), `converts_to` (opportunity→deal), `has_activity` (account→activity), `assigned_to` (opportunity→person).

#### Scenario: CRM pack seeds sales types
- **WHEN** the crm pack is seeded into a fresh store
- **THEN** the store contains resource types: contact, account, opportunity, deal, activity
- **THEN** the store contains relationship types: owned_by, belongs_to, converts_to, has_activity, assigned_to

### Requirement: HR pack seeds people-ops domain types
The `hr` pack SHALL include resource types for `employee`, `role`, `department`, `team`, `job-posting`; and relationship types `belongs_to` (*→*), `reports_to` (employee→employee), `applied_to` (person→job-posting), `holds` (employee→role), `member_of` (employee→team).

#### Scenario: HR pack seeds people-ops types
- **WHEN** the hr pack is seeded into a fresh store
- **THEN** the store contains resource types: employee, role, department, team, job-posting
- **THEN** the store contains relationship types: belongs_to, reports_to, applied_to, holds, member_of

### Requirement: Seeding is idempotent
The system SHALL skip any type that already exists in the store rather than throwing an error, matching the behavior of the existing `seedDefaultSchema` function.

#### Scenario: Re-seeding the same pack does not error
- **WHEN** a pack is seeded into a store that already contains those types
- **THEN** no error is thrown and the existing types are unchanged

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
