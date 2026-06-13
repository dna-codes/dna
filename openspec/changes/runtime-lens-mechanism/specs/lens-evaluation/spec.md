## ADDED Requirements

### Requirement: Evaluate a lens definition against a data store

The system SHALL provide `evaluateLens(definition, store)` that takes a lens definition and a `DnaDataStore` and returns the matched result. For a data lens the result SHALL be a subgraph `{ nodes, links }`; for a schema lens the result SHALL be `{ resourceTypes, relationshipTypes }`. The evaluator SHALL work against any `DnaDataStore` implementation (Neo4j or in-memory).

#### Scenario: Data lens returns a subgraph
- **WHEN** `evaluateLens` is called with a `target: "data"` definition
- **THEN** it returns `{ nodes, links }` containing the instance records and links that match the definition

#### Scenario: Schema lens returns the type graph
- **WHEN** `evaluateLens` is called with a `target: "schema"` definition
- **THEN** it returns `{ resourceTypes, relationshipTypes }` for the matched portion of the type graph

### Requirement: Free bindings match any instance of a type

For a data lens slot bound only to a `type` (free), the evaluator SHALL include all instances of that type permitted by the rest of the definition. For a free edge bound to a relationship type, the evaluator SHALL include links of that relationship type between included nodes.

#### Scenario: A fully-free data lens matches the pattern everywhere
- **GIVEN** a data lens whose every slot is free and whose edges name relationship types
- **WHEN** it is evaluated
- **THEN** the result contains every instance subgraph matching that type/relationship-type shape

### Requirement: Pinned bindings seed the result from a specific instance

For a data lens slot with a `ref`, the evaluator SHALL resolve the anchor before traversal: a `ref.id` SHALL load that instance; a `ref.select` SHALL query and filter instances by the predicate (e.g. name, path-prefix, attribute). The resolved anchor(s) SHALL seed the result set.

#### Scenario: Anchor resolved by id
- **WHEN** a slot has `ref: { id: "grp_bizops" }`
- **THEN** the evaluator seeds the result with that instance and proceeds from it

#### Scenario: Anchor resolved by selector
- **WHEN** a slot has `ref: { select: { pathPrefix: "acme.finance" } }`
- **THEN** the evaluator seeds the result with every instance matching the predicate, with no dependency on specific instance ids

### Requirement: Scope controls how a grouping expands from its anchor

When a data lens declares a `scope` for a pinned anchor, the evaluator SHALL expand membership by traversing the listed `via` relationship types in the given `direction`, to the given `depth`, optionally filtered by `nodeTypes`. With no `scope`, a pinned lens SHALL return only the anchor and its directly-bound edges.

#### Scenario: Transitive expansion along relationship types
- **GIVEN** a scope `{ from: "anchor", via: ["reports_to"], direction: "in", depth: "transitive" }`
- **WHEN** the lens is evaluated
- **THEN** the result includes all nodes reachable from the anchor by inbound `reports_to` links, transitively, plus the links walked

#### Scenario: Node-type filter limits members
- **GIVEN** a scope with `nodeTypes: ["Person"]`
- **WHEN** expansion reaches non-`Person` nodes
- **THEN** those nodes are traversed for connectivity but excluded from the returned member set per the filter

### Requirement: Transitive traversal terminates on cycles

The evaluator SHALL maintain a visited set during traversal so that cyclic links do not cause non-termination, and each node SHALL appear at most once in the returned subgraph.

#### Scenario: A cycle does not loop forever
- **GIVEN** instances connected in a cycle via a traversed relationship type
- **WHEN** a transitive scope is evaluated over them
- **THEN** evaluation terminates and each node appears once in the result

### Requirement: Evaluation is separate from presentation

`evaluateLens` SHALL return data only (subgraph or type graph) and SHALL NOT perform rendering. Presentation (sentence interpolation, view-model shaping) SHALL consume the evaluator result. Migrating an existing view to the evaluator SHALL preserve its current output shape.

#### Scenario: Org-chart backed by the evaluator is unchanged
- **WHEN** `buildOrgChart` is reimplemented to call `evaluateLens` and shape the result
- **THEN** it produces an `OrgChartViewModel` identical to the previous implementation on the existing fixtures
