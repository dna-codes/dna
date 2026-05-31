## ADDED Requirements

### Requirement: The metamodel has two parallel base contracts — one for type schemas, one for lens definitions
The DNA metamodel SHALL maintain two parallel base schema contracts: the resource type base (shared via `meta/stability` composition in `packages/schemas/`) governing ResourceType and RelationshipType definitions, and the LensType base (`packages/lenses/base.json`) governing lens definitions. Both SHALL follow the same pattern: a shared base schema composed via `allOf` by all members of that concept family, with no `additionalProperties`/`unevaluatedProperties` locking (pure mixin). Neither base contract SHALL be collapsed into the other — they are peers.

#### Scenario: Resource type schemas compose meta/stability, not the lens base
- **WHEN** any resource type schema (operational, product, or technical) is read
- **THEN** it SHALL compose `https://dna.codes/schemas/meta/stability` and SHALL NOT reference `https://dna.codes/lenses/base`

#### Scenario: Lens definitions compose the lens base, not meta/stability
- **WHEN** any core lens definition is read
- **THEN** it SHALL compose `https://dna.codes/lenses/base` and SHALL NOT reference `https://dna.codes/schemas/meta/stability`

#### Scenario: Both base schemas are independently registered
- **WHEN** `availableSchemas()` is called
- **THEN** it SHALL contain `meta/stability`
- **WHEN** `allLenses()` is called
- **THEN** the base lens definition SHALL be accessible via `https://dna.codes/lenses/base`
