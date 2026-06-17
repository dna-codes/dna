## ADDED Requirements

### Requirement: The Neo4j adapter can clear the entire graph

The Neo4j adapter SHALL provide an operation that clears the entire graph — deleting all nodes (type-metadata nodes, instance nodes, and the seed marker) and their relationships — while leaving schema constraints/indexes intact (a subsequent `migrate()` is idempotent). After the operation the store SHALL report an empty graph and SHALL report `hasBeenSeeded()` as false, so it can be re-migrated and reseeded.

#### Scenario: Clear empties the graph

- **WHEN** a Neo4j store holding types, instances, and links has its clear operation invoked
- **THEN** `resourceType.list()`, `relationshipType.list()`, and `link.list()` return empty, and listing instances of any former type returns none

#### Scenario: Clear drops the seed marker

- **WHEN** a seeded Neo4j store (`hasBeenSeeded()` is true) is cleared
- **THEN** `hasBeenSeeded()` returns false afterward

#### Scenario: Clear leaves the store usable

- **WHEN** a cleared store is re-`migrate()`d and reseeded
- **THEN** seeding succeeds and the store reports the reseeded types
