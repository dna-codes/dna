# core-lenses Specification

## Purpose
Defines the six core lens definitions shipped as part of `@dna-codes/dna-core`. Core lenses group resource types by metamodel layer and capture the canonical traversal and authorization subgraphs used across DNA documents.

## Requirements

### Requirement: Three layer lenses group resource types by metamodel layer
There SHALL be three layer lens definitions — `operational.json`, `product.json`, and `technical.json` — each grouping the canonical ResourceTypes belonging to that metamodel layer. Layer lenses SHALL have `nodes[]` entries with no `slot` (since no traversal or sentence interpolation is needed) and an empty `edges[]`. They make the implicit folder-based layer structure explicit and machine-readable.

#### Scenario: Operational layer lens groups all operational resource types
- **WHEN** `packages/core/lenses/operational.json` is read
- **THEN** its `nodes[]` SHALL include entries for `Person`, `Group`, `Role`, `Membership`, `Action`, `Process`, `State`, `Resource`, `Event`, and `Transition`

#### Scenario: Layer lens has no edges
- **WHEN** any of the three layer lens definitions is read
- **THEN** its `edges[]` SHALL be empty or absent

#### Scenario: Layer lenses have distinct $ids
- **WHEN** the three layer lenses are read
- **THEN** their `$id` values SHALL be `https://dna.codes/lenses/operational`, `https://dna.codes/lenses/product`, and `https://dna.codes/lenses/technical` respectively

### Requirement: A People lens defines the Person-to-Group traversal
There SHALL be a `people.json` lens defining a single-hop traversal from `Person` to `Group` via `Person_Group`. It SHALL declare two named slots (`person`, `group`) and one edge. It SHALL carry a sentence template.

#### Scenario: People lens has correct structure
- **WHEN** `packages/core/lenses/people.json` is read
- **THEN** it SHALL have two node slots (`person: Person`, `group: Group`) and one edge (`person → group via Person_Group`)

#### Scenario: People lens has a sentence template
- **WHEN** `packages/core/lenses/people.json` is read
- **THEN** its `sentence` field SHALL reference both `{{person}}` and `{{group}}`

### Requirement: An Access Control lens defines the five-node authorization subgraph
There SHALL be an `access-control.json` lens defining the authorization subgraph: `User → Role → Domain` (boundary), `Role → Operation` (grant), `Operation → Resource` (target). It SHALL declare five named slots and four edges. It SHALL carry a sentence template covering all five slots.

#### Scenario: Access Control lens has five nodes
- **WHEN** `packages/core/lenses/access-control.json` is read
- **THEN** its `nodes[]` SHALL have exactly five entries with slots `subject` (User), `assignment` (Role), `boundary` (Domain), `grant` (Operation), `target` (Resource)

#### Scenario: Access Control lens has four edges
- **WHEN** `packages/core/lenses/access-control.json` is read
- **THEN** its `edges[]` SHALL have exactly four entries connecting the five slots

#### Scenario: Access Control lens has a complete sentence template
- **WHEN** `packages/core/lenses/access-control.json` is read
- **THEN** its `sentence` SHALL reference all five slot names

### Requirement: An Execution lens defines the process-state-transition subgraph
There SHALL be an `execution.json` lens defining the execution subgraph: `Process → State → Transition`. It SHALL declare three named slots and two edges. It SHALL carry a sentence template.

#### Scenario: Execution lens has three nodes
- **WHEN** `packages/core/lenses/execution.json` is read
- **THEN** its `nodes[]` SHALL have exactly three entries with types `Process`, `State`, and `Transition`

#### Scenario: Execution lens has two edges
- **WHEN** `packages/core/lenses/execution.json` is read
- **THEN** its `edges[]` SHALL have exactly two entries

#### Scenario: All six core lenses are registered in packages/core/
- **WHEN** `allLenses()` is called from `@dna-codes/dna-core`
- **THEN** it SHALL return exactly six lens definitions: `operational`, `product`, `technical`, `people`, `accessControl`, `execution`
