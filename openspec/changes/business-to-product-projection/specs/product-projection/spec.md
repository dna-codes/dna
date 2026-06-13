## ADDED Requirements

### Requirement: Projection derives the product subgraph from a business subgraph

A projection SHALL take a business subgraph anchored at a `Domain` and produce a product subgraph by walking `Domain → Process → Task → Operation → Resource`, materializing `App`, `Module`, `Workflow`/`Page`, `Section`, `Component`, and `Endpoint` nodes connected by `realized_as`, `contains`, and `exposes` edges. The projection SHALL consume the subgraph produced by the runtime lens evaluator; it SHALL NOT re-implement graph traversal.

#### Scenario: Domain with processes projects to an App with modules

- **WHEN** a `Domain` "Lending" has processes "Origination" and "Servicing"
- **THEN** the projection materializes an `App` realizing "Lending" containing a `Module` for each process

#### Scenario: Operation projects to a Component and an Endpoint

- **WHEN** a `Task` performs the `Operation` "Loan.Approve"
- **THEN** the projection materializes a `Component` whose UIOperation `calls` "Loan.Approve" and an `Endpoint` that `exposes` "Loan.Approve"

### Requirement: Derived product nodes have stable identity

Each derived product node SHALL have a stable identity keyed by its `realized_as` business node, its UI level, and its containing parent. Re-running the projection SHALL upsert structural edges against these identities — creating nodes that are newly implied, leaving unchanged nodes that already exist, and not duplicating any node.

#### Scenario: Re-running the projection is convergent

- **WHEN** the projection runs twice against an unchanged business graph
- **THEN** the second run creates no new product nodes and no duplicate edges

#### Scenario: Adding a business node adds exactly its product node

- **WHEN** a new `Task` is added to an existing `Process` and the projection re-runs
- **THEN** exactly one new `Page` (or the Task's resolved level) is materialized under the existing Module, and no other product node changes

### Requirement: Re-derivation preserves governance edges

The projection SHALL reconcile only structural edges (`realized_as`, `contains`, `exposes`, `calls`, `renders`). Authored governance edges attached to a product node (e.g. `can_access`, `assigned_to`) SHALL be preserved across re-derivation.

#### Scenario: Role assignment survives re-derivation

- **WHEN** a `Role` has a `can_access` edge to a derived `Module` and the projection re-runs
- **THEN** the `can_access` edge SHALL still exist after the run

#### Scenario: Business node removal does not silently drop governance

- **WHEN** a `Process` backing a `Module` that carries governance edges is removed and the projection re-runs
- **THEN** the `Module` SHALL be marked orphaned rather than hard-deleted, so its governance edges are reviewable

### Requirement: UI level is resolved by explicit binding then type default

For each business node, the projection SHALL resolve the product UI level from an explicit `realized_as` binding when present, otherwise from the type default (`Domain→App`, `Process→Module`, `Task→Page`, `Operation→Component`).

#### Scenario: Default level applies with no binding

- **WHEN** a `Process` has no explicit `realized_as` override
- **THEN** it is realized as a `Module`

#### Scenario: Explicit binding overrides the default

- **WHEN** a `Process` is bound `realized_as` a `Page`
- **THEN** it is realized as a single `Page` (its tasks become `Section`s) rather than a `Module`

### Requirement: Completeness state is derived from the forward invariant chain

The projection SHALL compute a completeness state for each derived node from its forward backing: a node is `complete` when its required forward link resolves (Domain has a Process, Process has a Task, Task performs an Operation, Operation declares changes), and `planned` otherwise. The state SHALL be derived (recomputed every run), never authored.

#### Scenario: Task without an Operation yields a planned action

- **WHEN** a `Task` has no `Operation` it performs
- **THEN** the derived `Page` exists but its action `Component` is marked `planned`

#### Scenario: Process without tasks yields a planned module

- **WHEN** a `Process` has no `Task`s
- **THEN** the derived `Module` is marked `planned`

#### Scenario: planned recomputes when the gap is filled

- **WHEN** a previously missing `Operation` is added so a `Task` now performs one and the projection re-runs
- **THEN** the corresponding `Component` is no longer `planned`
