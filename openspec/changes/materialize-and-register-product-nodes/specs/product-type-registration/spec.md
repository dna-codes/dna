## ADDED Requirements

### Requirement: Product UI/API types are registerable at runtime

The system SHALL provide `seedProductTypes(store)` that registers the product UI/API resource types (`App`, `Module`, `Workflow`, `Page`, `Section`, `Component`, `Element`, and the existing `Endpoint`/`Namespace`) and the structural relationship types (`contains`, `realized_as`, `exposes`) in a `DnaDataStore`, derived from the registered `product/ui/*` schemas. After it runs, those types SHALL be resolvable so product instances can be created.

#### Scenario: Product resource types are registered

- **WHEN** `seedProductTypes(store)` runs on an empty store
- **THEN** `store.resourceType.list()` includes `App`, `Module`, `Page`, `Section`, `Component`, and `Element`
- **THEN** an `App` instance can subsequently be created via `store.instance.create('App', …)`

#### Scenario: Structural relationship types are registered

- **WHEN** `seedProductTypes(store)` runs
- **THEN** `store.relationshipType.list()` includes `contains`, `realized_as`, and `exposes`

### Requirement: Registration is idempotent

`seedProductTypes` SHALL skip types that already exist (by name) and SHALL be safe to run repeatedly without creating duplicates.

#### Scenario: Re-running creates no duplicates

- **WHEN** `seedProductTypes(store)` is run twice
- **THEN** each product type exists exactly once in the registry
