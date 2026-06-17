## ADDED Requirements

### Requirement: Domain is a thin node, not a container of primitives

A `Domain` SHALL be a thin, identity-bearing node carrying only its own metadata — `name` (required), and optional `description`, `owner`, and `parent`. The `Domain` schema SHALL NOT declare containment arrays (`resources`, `persons`, `roles`, `groups`) and SHALL NOT nest child domains via an inline `domains` array. Membership of a primitive in a domain SHALL be expressed by the primitive referencing its home domain, not by the domain enumerating its members.

#### Scenario: Domain schema rejects containment arrays
- **WHEN** an operational document declares a `Domain` with a `resources`, `persons`, `roles`, `groups`, or nested `domains` array
- **THEN** the document SHALL fail schema validation against `operational/domain.json`

#### Scenario: A thin Domain validates
- **WHEN** a `Domain` is declared with `{ name, description?, owner?, parent? }` and no member arrays
- **THEN** it SHALL validate against the `Domain` schema

### Requirement: The domain tree is expressed by parent edges

A document's domains SHALL be a flat collection of `Domain` nodes, and the hierarchy SHALL be expressed by each non-root domain naming its `parent` domain. Exactly one domain SHALL be the root (no `parent`); the root `Domain` represents the organization / tenant.

#### Scenario: Child domain names its parent
- **GIVEN** a flat `domains` collection containing `acme` (no parent) and `finance` (parent `acme`)
- **WHEN** the domain tree is resolved
- **THEN** `finance` SHALL resolve as a child of the tenant root `acme` via its `parent` reference, with no inline nesting

#### Scenario: A rootless tree is invalid
- **WHEN** every domain in the collection names a `parent` (no tenant root exists)
- **THEN** the document SHALL be rejected as having no organization / tenant root

### Requirement: Primitives declare their home domain by reference

Every operational primitive type definition (Resource, Person, Role, Group, and the activity primitives) SHALL be authored in a top-level document collection (`resources[]`, `persons[]`, `roles[]`, `groups[]`, etc.), and SHALL declare its home by a `domain` reference naming the home `Domain`. The `domain` reference SHALL be the authored form of the node's primary `belongs_to` edge.

#### Scenario: A primitive lives at the top level with a home reference
- **WHEN** a `Resource` named `Loan` is authored with `domain: "lending"`
- **THEN** it SHALL appear in the document's top-level `resources[]` collection and resolve its home to the `lending` `Domain`

#### Scenario: Membership is not duplicated on the domain
- **WHEN** a primitive declares `domain: "lending"`
- **THEN** the `lending` `Domain` SHALL NOT also list that primitive in any container array (no double-booking of membership)

### Requirement: Path is a derived cache, not an authoritative field

The dot-separated `path` SHALL be a value derived from a domain's `parent` chain (a cache for naming and prefix filtering). `path` SHALL NOT be required, and SHALL NOT be the authoritative source for a domain's place in the tree; the `parent` chain governs. When `path` is present it SHALL be treated as derived.

#### Scenario: Path is optional and derivable
- **WHEN** a `Domain` is authored with a `parent` and no `path`
- **THEN** its `path` SHALL be derivable from the `parent` chain (e.g. `acme.finance`) without being authored

#### Scenario: Parent governs over a stale path
- **GIVEN** a `Domain` whose authored `path` disagrees with its `parent` chain
- **THEN** the resolved namespace SHALL follow the `parent` chain, treating `path` as a regenerable cache

### Requirement: Seeding reads primitives from top-level collections

`seedFromDna` SHALL discover tenant `ResourceType` definitions from the document's top-level `resources[]` / `persons[]` / `roles[]` / `groups[]` collections (mapped to their noun categories), not from `dna.domain.{resources,persons,roles,groups}`. The four foundational resource types and the `relationships[]`-derived relationship types SHALL continue to seed as before.

#### Scenario: Top-level nouns seed as resource types
- **WHEN** `seedFromDna` runs on a document whose top-level `resources[]` contains `Loan`
- **THEN** a `ResourceType` named `Loan` (category `resource`) SHALL be created in the registry

#### Scenario: Domain-nested nouns are no longer a seed source
- **WHEN** `seedFromDna` runs on a document that (legacy) carries nouns only under `domain.resources[]`
- **THEN** those nouns SHALL NOT be seeded as resource types, because the domain containment arrays are no longer read
