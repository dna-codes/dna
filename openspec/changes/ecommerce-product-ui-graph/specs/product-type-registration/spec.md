## MODIFIED Requirements

### Requirement: Product UI/API types are registerable at runtime

The system SHALL provide `seedProductTypes(store)` that registers the product UI/API resource types (`App`, `Module`, `Workflow`, `Page`, `Section`, `Component`, `Element`, `Layout`, and the existing `Endpoint`/`Namespace`) and the structural relationship types (`contains`, `realized_as`, `exposes`) in a `DnaDataStore`, derived from the registered `product/*` schemas. After it runs, those types SHALL be resolvable so product instances can be created.

#### Scenario: Product resource types are registered

- **WHEN** `seedProductTypes(store)` runs on an empty store
- **THEN** `store.resourceType.list()` includes `App`, `Module`, `Page`, `Section`, `Component`, `Element`, and `Layout`
- **THEN** an `App` instance can subsequently be created via `store.instance.create('App', …)`

#### Scenario: Layout type is registered and instantiable

- **WHEN** `seedProductTypes(store)` runs
- **THEN** `store.resourceType.list()` includes `Layout`
- **THEN** a `Layout` instance can be created via `store.instance.create('Layout', …)`

#### Scenario: Structural relationship types are registered

- **WHEN** `seedProductTypes(store)` runs on an empty store
- **THEN** `store.relationshipType.list()` includes `contains`, `realized_as`, and `exposes`
