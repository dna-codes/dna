# AGENTS.md — `integration/memory`

Guidance for AI agents working with the in-memory `DnaDataStore` adapter.

## What this is

`integration/memory` is one of two implementations of the `DnaDataStore`
contract from `@dna-codes/dna-core`. It is in-memory only and zero-dep.
It exists for two reasons:

1. **Test double** for any package that depends on `DnaDataStore`. Tests
   should construct a memory client with a fixture DNA rather than mocking
   the interface — the memory client implements the same semantics the
   Neo4j adapter promises (per-type-label uniqueness, Link edge semantics,
   `migrate()` idempotency), so green tests against memory predict green
   tests against Neo4j.
2. **Local-development substitute** when a Neo4j instance is not
   available.

## DNA-awareness exception

Most integrations in this package are **pure I/O** — they take URI / byte
strings on their library API and never reference DNA types. `memory` is a
deliberate exception: it accepts an `OperationalDNA` at `createClient`
time and uses it to seed TypeDefinition / RelationshipDef metadata in
`migrate()`. The rationale is the same as for `integration/neo4j`:
DNA-awareness is the whole point of a runtime-data store. There is no
"input adapter" intermediating between the DNA and this storage shape
because the storage shape *is* a direct projection of the DNA.

Contrast with `integration/jira` and `integration/google-drive`, which
ferry bytes between an external system and DNA-aware composition code in
their CLIs — those remain pure I/O on the library surface.

## What NOT to do

- Do not add per-DNA-primitive methods (`createLoan`, `getBorrower`,
  etc.). The interface is type-generic by design — `instance.create(typeName, data)`
  works for any Resource declared in the DNA.
- Do not validate `data` payloads against the DNA inside the adapter.
  Validation is the caller's responsibility. The Neo4j adapter's CLI is
  the canonical validation site; library callers who want validation
  invoke `DnaValidator` from `@dna-codes/dna-core` before the store call.
- Do not add persistence (e.g. dumping to a JSON file). If a caller wants
  persistence, they should use `integration/neo4j` or a future
  Postgres / SQLite implementation. Keeping `memory` truly in-memory
  preserves its test-double role.

## When you make changes here

Any behavior change to the memory adapter is also a behavior change to
the **interface contract** — because the interface is what
`integration/neo4j` and any future implementation must conform to. If you
add a method, signature, or invariant to memory, the same change is owed
to:

1. The `DnaDataStore` interface in `@dna-codes/dna-core`.
2. The `integration/neo4j` adapter (so memory and Neo4j stay in lockstep).
3. The shared test fixtures (so the parameterized test suite covers the
   new surface).
