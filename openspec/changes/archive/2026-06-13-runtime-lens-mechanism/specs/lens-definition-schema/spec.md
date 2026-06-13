## ADDED Requirements

### Requirement: A lens definition declares its target graph

A lens definition SHALL declare `target: "schema" | "data"`. `target: "data"` lenses read/return the instance graph; `target: "schema"` lenses read/return the type graph. There SHALL be a single unified lens definition schema covering both, distinguished by `target` rather than by separate file shapes.

#### Scenario: Data lens declares its target
- **WHEN** a lens definition has `target: "data"`
- **THEN** validation treats its slots/edges as references to instances and permits pinning

#### Scenario: Schema lens declares its target
- **WHEN** a lens definition has `target: "schema"`
- **THEN** validation treats its slots/edges as references to types and rejects pinning

### Requirement: Slots and edges carry free or pinned bindings

A lens slot SHALL be `{ slot, type }` (free) and MAY add `ref` to pin it. `ref` SHALL be `{ id }` (a concrete instance) or `{ select }` (a predicate over instances). A lens edge SHALL name a relationship `via` and connect two declared slots. Pinning SHALL be permitted only on `target: "data"` lenses.

#### Scenario: Free slot validates
- **WHEN** a slot is `{ slot: "subject", type: "Person" }` with no `ref`
- **THEN** it validates as a free binding

#### Scenario: Pinned slot validates on a data lens
- **WHEN** a `target: "data"` lens has a slot `{ slot: "anchor", type: "Group", ref: { id: "grp_bizops" } }`
- **THEN** it validates as a pinned binding

#### Scenario: Pinning on a schema lens is rejected
- **WHEN** a `target: "schema"` lens declares a slot with a `ref`
- **THEN** validation fails

### Requirement: A grouping scope is part of the definition schema

The lens definition schema SHALL allow an optional `scope` entry referencing a pinned slot, with fields `from`, `via` (array of relationship type names), `direction` (`out | in | both`), `depth` (integer or `"transitive"`), and optional `nodeTypes`. A definition with at least one pinned slot constitutes a grouping.

#### Scenario: Scope fields validate
- **WHEN** a definition includes `scope: { from: "anchor", via: ["belongs_to"], direction: "in", depth: "transitive" }`
- **THEN** it validates against the lens definition schema

#### Scenario: Scope must reference a pinned slot
- **WHEN** a `scope.from` references a slot that is not pinned
- **THEN** validation fails

### Requirement: Existing all-free lens definitions remain valid

Existing lens definitions in `packages/core/lenses/*.json` (all-free slots, relationship-type edges, a `sentence`) SHALL validate against the unified schema as `target: "data"` rendering views without modification.

#### Scenario: Legacy lens validates unchanged
- **WHEN** an existing lens file such as `access-control.json` is validated against the unified schema
- **THEN** it validates as a data lens with all-free bindings and no pinning
