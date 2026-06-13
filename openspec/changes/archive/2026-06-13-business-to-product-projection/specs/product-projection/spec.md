## ADDED Requirements

### Requirement: Projection derives a product subgraph from a business subgraph

The system SHALL provide a pure function `project(businessSubgraph) → productSubgraph` that walks a business subgraph (`{ nodes, links }`, nodes carrying `_typeName`) and produces product nodes (`App`, `Module`, `Page`, `Component`, plus API `Namespace`/`Endpoint`) connected by `realized_as`, `contains`, and `exposes` edges. Adjacency between business levels SHALL be resolved by **node type** (a Domain's Processes are the Process-typed nodes adjacent to it, etc.), not by relationship-type name, so the walk is independent of the relationship vocabulary. The function SHALL write nothing to any store.

#### Scenario: Domain with processes projects to an App with modules

- **WHEN** the subgraph has a `Domain` adjacent to two `Process` nodes
- **THEN** `project` emits an `App` realizing the Domain that `contains` a `Module` for each Process, each `realized_as` its Process

#### Scenario: Operation projects to a Component and an Endpoint

- **WHEN** a `Task` is adjacent to an `Operation`
- **THEN** `project` emits a `Component` (realizing the Operation) under the Task's Page, and an `Endpoint` that `exposes` the Operation

### Requirement: Derived product nodes have stable identity

Each product node SHALL have a stable identity key derived from its realized business node, its UI level, and its containing parent, so the same business node reached under different parents yields distinct product nodes and the same input yields the same keys on every run.

#### Scenario: Identical input yields identical keys

- **WHEN** `project` runs twice on the same subgraph
- **THEN** the two product subgraphs have the same set of node keys

#### Scenario: Endpoints dedupe per operation

- **WHEN** an `Operation` is reached via two different `Task`s
- **THEN** exactly one `Endpoint` node is emitted for that Operation (keyed without a parent)

### Requirement: UI level is resolved by explicit override then type default

`project` SHALL resolve each business node's product level from an explicit per-node override when provided, otherwise from the type default (`Domain→app`, `Process→module`, `Task→page`, `Operation→component`).

#### Scenario: Default level applies with no override

- **WHEN** a `Process` has no override
- **THEN** it is realized at level `module`

#### Scenario: Explicit override changes the level

- **WHEN** a `Process` is overridden to level `page`
- **THEN** it is emitted at level `page` rather than `module`

### Requirement: Completeness state is derived from the forward invariant chain

`project` SHALL mark each node `planned` when its forward backing is missing — an App whose Domain has no Process, a Module whose Process has no Task, a Page whose Task has no Operation, a Component whose Operation declares no `changes` — and `complete` otherwise. The state SHALL be computed from the input, never authored.

#### Scenario: Process without tasks yields a planned module

- **WHEN** a `Process` has no adjacent `Task`
- **THEN** its `Module` is marked `planned`

#### Scenario: Operation without changes yields a planned component

- **WHEN** an `Operation` declares no `changes`
- **THEN** its `Component` is marked `planned`

### Requirement: API surface derives from the same walk

`project` SHALL emit one `Namespace` per `Domain` (realizing it) and one `Endpoint` per reached `Operation` (`exposes` it), with each Endpoint contained by its Domain's Namespace — the API and UI being two sinks of one traversal.

#### Scenario: Namespace groups the domain's endpoints

- **WHEN** a `Domain`'s processes reach two distinct `Operation`s
- **THEN** `project` emits one `Namespace` for the Domain containing two `Endpoint`s, one per Operation
