# AGENTS.md — `integration/neo4j`

Guidance for AI agents working with the Neo4j `DnaDataStore` adapter.

## What this is

`integration/neo4j` is one of two implementations of the `DnaDataStore`
contract from `@dna-codes/dna-core` (the other is `integration/memory`).
It persists runtime data into Neo4j using the registry triad shape —
labeled Instance nodes, typed Link edges, and seeded TypeDefinition /
RelationshipDef metadata nodes.

## DNA-awareness exception

Most integrations in this package are **pure I/O** — `integration/jira`,
`integration/google-drive`, the `integration/example` template. They
take URI / byte strings on their library API and never reference DNA
types. The pure-I/O rule keeps DNA translation out of the integration
boundary and into a dedicated input adapter.

`integration/neo4j` is a deliberate exception. It accepts an
`OperationalDNA` at `createClient` time and uses it to:

1. Seed `:TypeDefinition` and `:RelationshipDef` nodes in `migrate()`.
2. Resolve `typeName` arguments against the DNA's noun primitives.
3. Validate label safety (only labels matching the DNA's PascalCase
   pattern get interpolated into Cypher).

The reason: DNA-awareness *is* the entire point of a runtime-data store.
There is no external system supplying foreign content to translate —
the storage shape *is* a direct projection of the DNA. Making this
integration pure-I/O would force callers to hand-write the same
projection at every call site, with no isolation benefit.

The same exception applies to `integration/memory`, for the same reason.

## What NOT to do

- **Do not** interpolate caller-provided strings into Cypher without
  going through `validateLabel()` first. Cypher does not parameterize
  node labels or relationship types, so string interpolation is the only
  way to do it — and the only safe character set is the DNA's
  PascalCase noun-primitive pattern.
- **Do not** validate `data` payloads against the DNA inside the library
  API. Validation is the caller's responsibility, mirrored by every
  other DNA-aware adapter. The CLI's write commands validate before
  invoking the library — that is the canonical composition layer.
- **Do not** add per-DNA-primitive methods (`createLoan`, etc.). The
  interface is type-generic by design — `instance.create(typeName, data)`
  works for any Resource declared in the DNA. Per-primitive convenience
  belongs in a higher-level builder, not in the store.
- **Do not** swap the Link edge form for the intermediate-node form
  (`(a)-[:LINK_FROM]->(:Link)-[:LINK_TO]->(b)`) without proposing the
  change. It would be a breaking shape change for every consumer, even
  though the `link.*` interface methods could stay stable.

## When you make changes here

Behavior changes to this adapter usually need matching changes in
**three other places**:

1. The `DnaDataStore` interface in `@dna-codes/dna-core`, if you're
   adding / changing a method signature.
2. The `integration/memory` adapter, so memory and Neo4j stay in
   lockstep. Tests written against memory must continue to predict
   Neo4j behavior.
3. The Cypher unit tests (`cypher.test.ts`) if you touch any snippet
   builder.

## Tests

Unit tests for the Cypher builders and CLI run without a database.
Live round-trip tests are gated on `NEO4J_URI` and skip cleanly when
absent — never fail. When iterating against a real Neo4j instance, the
test file's `afterEach` cleans up everything the test created. If a test
crashes mid-run, leftover nodes carry the test's transient IDs; clean
them up with `MATCH (n) WHERE n._id STARTS WITH 'live-' DETACH DELETE n`
or equivalent.
