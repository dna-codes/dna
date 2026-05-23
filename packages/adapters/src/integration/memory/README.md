# integration/memory

An in-memory implementation of the `DnaDataStore` contract from
`@dna-codes/dna-core`. Zero runtime dependencies. The recommended test
double for any package that depends on `DnaDataStore` (transport wrappers,
DNA-driven applications, integration tests).

```ts
import { createClient } from '@dna-codes/dna-adapters/integration/memory'
import type { OperationalDNA } from '@dna-codes/dna-core'

const dna: OperationalDNA = {
  domain: {
    name: 'lending',
    resources: [{ name: 'Loan', attributes: [{ name: 'amount', type: 'number' }] }],
    persons: [{ name: 'Borrower' }],
  },
}

const store = createClient(dna)
await store.migrate()

const { id } = await store.instance.create('Loan', { amount: 1000, status: 'pending' })
const loan = await store.instance.get('Loan', id)
// → { id, amount: 1000, status: 'pending' }

const { id: borrowerId } = await store.instance.create('Borrower', { email: 'a@b.c' })
await store.link.create(
  { typeName: 'Loan', id },
  { typeName: 'Borrower', id: borrowerId },
  { role: 'primary_borrower' },
)
```

## Storage shape

Mirrors the registry triad demonstrated in `examples/registry`:

- **TypeDefinitions** — seeded by `migrate()` from the DNA's
  `domain.resources/persons/roles/groups`. Internal-only; not directly
  observable via the public API.
- **Instances** — keyed by `(typeName, id)`. Same `id` across different
  types does not collide.
- **Links** — typed connections between two Instances, each with its own
  unique ID. Optional `role` discriminator and optional `attributes`
  payload (mirrors the registry example's `Link.role` and
  `Link.attributes`).

## Test-double role

This adapter implements the same `DnaDataStore` contract as
`integration/neo4j`, with the same per-type-label uniqueness, the same
`migrate()` seeding (memoized in-process), and the same Link semantics.
Tests written against `integration/memory` exercise the same behaviors
the Neo4j adapter promises — modulo network and persistence.

Any package in the `@dna-codes` monorepo that depends on `DnaDataStore`
SHOULD use this adapter as its test double rather than mocking the
interface.

## What this adapter does NOT do

- It does not validate `data` payloads against the DNA. Validation is the
  caller's responsibility (or the composition layer's, e.g. the Neo4j
  adapter's CLI).
- It does not persist anything across process restarts. By design.
- It does not enforce that Link `from`/`to` references point at extant
  Instances. Callers who care can list first.
