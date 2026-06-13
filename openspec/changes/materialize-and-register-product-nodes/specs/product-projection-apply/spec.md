## ADDED Requirements

### Requirement: Apply persists a projected product subgraph

The system SHALL provide `applyProjection(subgraph, store)` that persists a `ProductSubgraph` into a `DnaDataStore`: each `ProductNode` becomes an instance of its level's resource type carrying its stable projection key, and each `ProductEdge` (`contains`/`realized_as`/`exposes`) becomes a link.

#### Scenario: Nodes and structural links are persisted

- **WHEN** `applyProjection` runs on a subgraph with an App containing a Module
- **THEN** the store holds an `App` instance and a `Module` instance and a `contains` link between them

### Requirement: Apply is idempotent against stable identity

`applyProjection` SHALL upsert by the projection's stable identity key: a node whose key already exists SHALL be left in place, a node with a new key SHALL be created, and no node SHALL be duplicated across runs.

#### Scenario: Re-applying an unchanged subgraph is a no-op

- **WHEN** `applyProjection` runs twice on the same subgraph
- **THEN** the second run creates no new instances and no duplicate links

#### Scenario: Adding one business-derived node adds exactly one product instance

- **WHEN** a subgraph gains one new node (new key) and `applyProjection` re-runs
- **THEN** exactly one new product instance is created and existing ones are unchanged

### Requirement: Apply preserves authored governance edges

`applyProjection` SHALL reconcile only structural links (`contains`/`realized_as`/`exposes`). Authored governance edges (e.g. `can_access`, `assigned_to`) attached to a product instance SHALL be preserved across re-apply.

#### Scenario: A governance edge survives re-apply

- **WHEN** a product instance carries a `can_access` link and `applyProjection` re-runs
- **THEN** the `can_access` link still exists afterward

### Requirement: Vanished backing soft-deletes, not hard-deletes

When a previously-applied product node is absent from a new subgraph and the persisted instance carries authored governance edges, `applyProjection` SHALL mark it orphaned (soft-delete) rather than removing it, so its governance edges remain reviewable.

#### Scenario: Orphaned governed node is soft-deleted

- **WHEN** the business backing for a governed `Module` disappears and `applyProjection` re-runs
- **THEN** the `Module` instance is marked orphaned and is not hard-deleted
