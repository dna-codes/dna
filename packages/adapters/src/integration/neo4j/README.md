# integration/neo4j

A Neo4j-backed implementation of the `DnaDataStore` contract from
`@dna-codes/dna-core`. Stores the *runtime data* described by an
`OperationalDNA` — actual Loan records, Borrower records, the Links
between them — using the registry triad shape (TypeDefinition / Instance
/ Link) demonstrated in `examples/registry`.

```ts
import { createClient } from '@dna-codes/dna-adapters/integration/neo4j'
import type { OperationalDNA } from '@dna-codes/dna-core'

const dna: OperationalDNA = JSON.parse(readFileSync('./dna.json', 'utf-8'))

const store = createClient(
  {
    uri: process.env.NEO4J_URI!,
    username: process.env.NEO4J_USERNAME!,
    password: process.env.NEO4J_PASSWORD!,
  },
  dna,
)

await store.migrate()
const { id } = await store.instance.create('Loan', { amount: 1000, status: 'pending' })
const { id: borrowerId } = await store.instance.create('Borrower', { email: 'a@b.c' })
await store.link.create(
  { typeName: 'Loan', id },
  { typeName: 'Borrower', id: borrowerId },
  { role: 'primary_borrower' },
)
await store.close()
```

## Environment

Credentials are read from environment variables (the CLI requires them;
the library accepts the same shape via `Neo4jClientOptions`):

| Variable | Required | Description |
|---|---|---|
| `NEO4J_URI` | yes | Bolt URI — e.g. `bolt://localhost:7687` |
| `NEO4J_USERNAME` | yes | Basic-auth username |
| `NEO4J_PASSWORD` | yes | Basic-auth password |
| `NEO4J_DATABASE` | no | Database name. Defaults to the driver's configured default. |

## Storage shape

- **Instances** are labeled Neo4j nodes. The label equals the Instance's
  `typeName` (the Resource/Person/Role/Group name from the DNA). Reserved
  node properties: `_id`, `_typeName`, `_createdAt`, `_updatedAt`. The
  caller's `data` payload flattens into the remaining properties.
- **Links** are typed edges between Instance nodes:
  `(a:LabelA)-[:LINK {_id, role?, attributes?, createdAt}]->(b:LabelB)`.
  `attributes` is serialized as a JSON string property (Neo4j cannot
  store nested maps as edge properties); the library deserializes on read.
- **TypeDefinitions** and **RelationshipDefs** are dedicated metadata
  labels seeded by `migrate()`. They mirror `dna.domain.{resources,
  persons, roles, groups}` and `dna.relationships[]` respectively.

This is the **edge form** for Links — Neo4j's native edges carry the role
and attributes directly. An alternative *intermediate-node form*
(`(a)-[:LINK_FROM]->(:Link {...})-[:LINK_TO]->(b)`) was considered and
parked. If your domain develops a need for queryable many-to-many Link
metadata at scale, that promotion is a candidate for a future change.

## `migrate()` semantics

`migrate()` is idempotent. On every call it:

1. Creates `UNIQUE` constraints on `(:TypeDefinition) REQUIRE name`,
   `(:RelationshipDef) REQUIRE name`, and `(:<Label>) REQUIRE _id` for
   every noun-primitive label declared in the constructor DNA.
2. Creates indexes on `(:<Label>) ON _typeName` per label and on
   `()-[:LINK]-() ON _id`.
3. `MERGE`s one `:TypeDefinition` node per Resource/Person/Role/Group.
4. `MERGE`s one `:RelationshipDef` node per `dna.relationships[]` entry.

`migrate()` does **not** migrate existing Instance data when the DNA's
attribute schema changes. Data migration is domain-specific (it requires
choices the adapter can't make, like defaults for newly-required
attributes). Callers who need to reshape Instance data should
`list` → transform → `update`.

## Validation contract

The library API does **not** validate `data` payloads against the
relevant Resource's attribute schema. Validation is the caller's
responsibility — invoke `DnaValidator` from `@dna-codes/dna-core` before
`instance.create` / `instance.update` if you want validation. The
CLI (`cli.ts`) validates every write before invoking the library.

## Data shape constraints

Neo4j node and edge properties must be primitives, arrays of primitives,
or null. Nested objects are rejected by the driver. Callers passing
complex `data` payloads (an `address` object, for example) should
JSON-stringify the field themselves — the registry example does this for
its `attribute_schema` and `data` attributes. Link `attributes` are
JSON-stringified by the adapter and deserialized on read; this is the
only field the adapter transparently handles.

## ProcessStep is not modeled as nodes (v1)

`ProcessStep` is not promoted to a Neo4j node label in v1. If you persist
a `Process` Instance, its `steps` field carries the sub-objects as
data — opaque to Cypher. This is a parked design decision; a follow-on
change can promote steps to nodes if a use case demands step-level DAG
traversal in Cypher.

## CLI

```sh
integration-neo4j migrate              --dna ./dna.json
integration-neo4j instance:create      --type Loan --in ./loan.json --dna ./dna.json
integration-neo4j instance:get         --type Loan --id <id> --dna ./dna.json
integration-neo4j instance:list        --type Loan --dna ./dna.json
integration-neo4j link:create          --from-type Loan --from-id <l> --to-type Borrower --to-id <b> --role primary --dna ./dna.json
```

See `integration-neo4j help` for the complete command list.

## Tests

Unit tests for the Cypher snippet builders and CLI run without a
database. The live round-trip tests require a Neo4j instance and are
**skipped** when `NEO4J_URI` is not set:

```sh
NEO4J_URI=bolt://localhost:7687 \
NEO4J_USERNAME=neo4j \
NEO4J_PASSWORD=test \
npm test --workspace @dna-codes/dna-adapters -- --testPathPattern neo4j
```
