# grouping-model Specification

## Purpose

A business-meaningful grouping (e.g. "Fulfillment", "Engineering team") is a node-anchored query over the live graph — the subgraph reachable from / scoped to an anchor node that already exists (a `Group` for org units, a `Domain` for functional areas) — not an installed bundle of definitions. The graph is the single source of truth, so groupings fall out of it for free and overlap for free because one node may satisfy multiple anchors. A node's canonical "home" is its primary `belongs_to` edge to a `Domain` node, with `path` demoted to a derived cache; identity-less groupings are saved lenses, and vocabulary distribution (getting type definitions into a registry) is kept distinct from grouping.

## Requirements

### Requirement: A grouping is a node-anchored query, not an installed bundle

A business-meaningful grouping (e.g. "Fulfillment", "Engineering team") SHALL be defined as a query over the live graph that is anchored at an existing graph node. A grouping SHALL NOT require a predefined, installed bundle of type definitions in order to exist. The set of nodes in a grouping is the result of evaluating the grouping's membership rule against the current graph.

#### Scenario: An org-unit grouping resolves by traversal from a Group node
- **WHEN** a grouping is anchored at a `Group` node representing a team
- **THEN** the grouping's members are the nodes reachable from that `Group` by its membership/ownership edges, with no separately installed pack

#### Scenario: A grouping requires no install step
- **WHEN** an anchor node and the relevant edges exist in the graph
- **THEN** the grouping is queryable immediately, without registering or installing a "pack" object

### Requirement: Groupings overlap without coordination

A single instance node MAY belong to multiple groupings simultaneously. Membership in one grouping SHALL NOT exclude membership in another, and groupings SHALL NOT require de-duplication or reconciliation against each other. Overlap is the result of one node satisfying multiple anchors' membership rules.

#### Scenario: One node appears in two groupings
- **GIVEN** a `Person` node reachable from an Engineering `Group` anchor
- **AND** the same `Person` node scoped to a Fulfillment functional anchor
- **WHEN** both groupings are evaluated
- **THEN** the `Person` appears in both results, and neither grouping is modified to account for the other

### Requirement: A node's home is its primary domain edge; path is derived

Every instance node SHALL have exactly one canonical "home": a `belongs_to` edge marked primary, pointing to a `Domain` node. The home edge SHALL be the source of truth for the node's namespace. The dot-separated `path` string SHALL be a value derived from the home edge chain (a cache for naming and prefix filtering), and SHALL NOT be an independent authoritative field.

#### Scenario: Home is a single primary edge
- **WHEN** a node's namespace is queried
- **THEN** it resolves through the node's one `belongs_to[primary]` edge to a `Domain` node, not through a standalone string field

#### Scenario: Path is recomputed from the edge on re-home
- **GIVEN** a node whose `path` cache reads `acme.finance`
- **WHEN** its `belongs_to[primary]` edge is repointed to a different `Domain`
- **THEN** the `path` cache is recomputed from the new edge chain, and the edge — not the old string — governs the result

### Requirement: Every node has a mandatory home rooted at the tenant

A node SHALL NOT be rootless. Every node's home chain SHALL terminate at the root `Domain` representing the organization / tenant. The tenant root SHALL serve as the guaranteed namespace for define-once.

#### Scenario: Home chain terminates at the tenant
- **WHEN** the `parent` chain of a node's home `Domain` is followed to its end
- **THEN** it terminates at the organization / tenant `Domain` (e.g. `acme`)

### Requirement: A grouping earns a Domain node only by the identity test

A grouping SHALL be modeled as a first-class `Domain` node (with members joined by `belongs_to` edges) only if it has its own attributes, its own relationships, and an identity independent of its members. A grouping that does not meet the identity test SHALL be modeled as a saved lens over existing anchors, not as new edges or a new node.

#### Scenario: Identity-less grouping is a lens, not a node
- **WHEN** a grouping (e.g. "everything under acme.finance") has no attributes, relationships, or identity of its own
- **THEN** it is represented as a saved lens over the home tree, and no `Domain` node is created for it

#### Scenario: Identity-bearing grouping earns a node
- **GIVEN** a grouping with its own owner and charter (e.g. a "Fulfillment" initiative)
- **THEN** it MAY be modeled as a `Domain` node, with members joined by `belongs_to` edges

### Requirement: A grouping is a data lens with a pinned anchor

Lenses SHALL be classified by what they return: a **schema lens** reads/returns the type graph (`resource_type` nodes, `relationship_type` edges); a **data lens** reads/returns the instance graph (`resource` + `relationship`). Within a data lens, each slot/edge binding SHALL be either *free* (bound to a type, matching any instance) or *pinned* (bound to a specific instance). A grouping SHALL be expressed as a data lens with at least one pinned anchor; it SHALL NOT be a separate construct from lenses.

#### Scenario: A free data lens is a rendering view
- **WHEN** a data lens binds every slot to a type and provides a sentence
- **THEN** it matches and renders instance subgraphs of that shape (a rendering view)

#### Scenario: A pinned data lens is a grouping
- **WHEN** a data lens pins a slot to a specific instance node and traverses from it
- **THEN** it yields the anchored subgraph (a grouping), using the same lens construct

#### Scenario: A schema lens returns the model
- **WHEN** a schema lens binds slots to `resource_type` and edges to `relationship_type`
- **THEN** it returns the type graph (the model / ER view), and pinning does not apply

### Requirement: Vocabulary distribution is separate from grouping

The mechanism that distributes type definitions into a registry (a "starter pack" / vocabulary bundle) SHALL be distinct from the grouping mechanism. A vocabulary bundle SHALL operate at the type/registry level and SHALL NOT define a runtime grouping of instance nodes.

#### Scenario: Installing vocabulary does not create a grouping
- **WHEN** a vocabulary bundle adds `ResourceType` and `RelationshipType` records to the registry
- **THEN** no grouping (node selection) is created as a side effect of that installation
</content>
</invoke>
