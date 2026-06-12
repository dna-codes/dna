## ADDED Requirements

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
