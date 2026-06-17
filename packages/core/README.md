# `@dna-codes/dna-core`

The TypeScript home for DNA — typed bindings for the JSON schemas, a typed builder API for **constructing** Operational DNA programmatically, a canonical **query API** for **reading** Operational DNA, a `DnaValidator` for **validating** any DNA against the canonical schemas (with cross-layer checks), and a pure `merge()` utility for composing multiple DNA chunks into one with conflict reporting.

The raw JSON schemas live in [`@dna-codes/dna-schemas`](../schemas/) and are pulled in as a dependency.

| Layer | What it captures | Analogous to |
|---|---|---|
| **Operational DNA** | What the business does | Domain-Driven Design |
| **Product DNA** | What gets built | OpenAPI + Atomic Design |
| **Technical DNA** | How it gets built | Terraform / AWS SAM |

DNA is a *contract*, not a runtime. Producers (authoring agents, humans) emit JSON that conforms to these schemas; consumers (validators, viewers, code-generation cells) read the JSON and do something useful with it.

- [`docs/operational.md`](./docs/operational.md) — authoring contract for operational DNA
- [`docs/product.md`](./docs/product.md) — authoring contract for product DNA (core + api + ui)
- [`docs/technical.md`](./docs/technical.md) — authoring contract for technical DNA
- [`docs/builders.md`](./docs/builders.md) — full reference for the builder API
- [`docs/queries.md`](./docs/queries.md) — full reference for the query API
- [`docs/merge.md`](./docs/merge.md) — `merge()` reference for composing DNA from multiple chunks
- [`AGENTS.md`](./AGENTS.md) — agent contract for working with DNA at large

## Contents

- [Installation](#installation)
- [Quick start — build, then validate](#quick-start--build-then-validate)
- [Constructing Operational DNA](#constructing-operational-dna)
  - [Builders — the canonical way to construct DNA](#builders--the-canonical-way-to-construct-dna)
  - [`merge()` — compose multiple chunks at once](#merge--compose-multiple-chunks-at-once)
  - [Builders vs. `merge()` — when to reach for which](#builders-vs-merge--when-to-reach-for-which)
- [Querying Operational DNA](#querying-operational-dna)
- [Validating Operational DNA](#validating-operational-dna)
  - [`DnaValidator` — the validator](#dnavalidator--the-validator)
    - [Per-document validation](#per-document-validation)
    - [Cross-layer validation](#cross-layer-validation)
    - [`availableSchemas()`](#availableschemas)
  - [Validating untrusted input](#validating-untrusted-input)
- [Recipes](#recipes)
  - [Build then validate](#build-then-validate)
  - [Audit conflicts produced during construction](#audit-conflicts-produced-during-construction)
  - [Merge multiple sources, then validate](#merge-multiple-sources-then-validate)
  - [Skip validation in hot paths](#skip-validation-in-hot-paths)
  - [Inspect what the validator covers](#inspect-what-the-validator-covers)
- [API reference (other exports)](#api-reference-other-exports)
  - [`schemas` — typed access to every per-primitive JSON Schema](#schemas--typed-access-to-every-per-primitive-json-schema)
  - [`documents` — per-layer aggregate schemas](#documents--per-layer-aggregate-schemas)
  - [`lenses` — core lens definitions](#lenses--core-lens-definitions)
  - [`allLenses()` — flat array](#alllenses--flat-array)
  - [`allSchemas()` — flat array](#allschemas--flat-array)
  - [`resolveSchemaFile(family, name)`](#resolveschemafilefamily-name)
  - [`SCHEMA_ROOT`, `layerDirs`](#schema_root-layerdirs)
  - [Raw JSON schemas](#raw-json-schemas)
  - [TypeScript types for every primitive](#typescript-types-for-every-primitive)
- [Using schemas from non-JS languages](#using-schemas-from-non-js-languages)
- [Primitive vocabulary](#primitive-vocabulary)
- [What this package does *not* include](#what-this-package-does-not-include)
- [Versioning](#versioning)
- [License](#license)

## Installation

```bash
npm install @dna-codes/dna-core
```

## Quick start — build, then validate

End-to-end: construct a small Operational DNA from scratch via the builders, validate it, get back a green light.

```ts
import {
  createOperationalDna,
  addResource,
  addPerson,
  addRole,
  addOperation,
  addTrigger,
  addRule,
  addTask,
  DnaValidator,
} from '@dna-codes/dna-core'

// 1. Start from an empty domain.
let dna = createOperationalDna({ domain: { name: 'lending', path: 'acme.lending' } })

// 2. Compose primitives via the builders. Each call returns
//    { dna, conflicts }; same-name composes via the merge engine.
;({ dna } = addResource(dna, {
  name: 'Loan',
  attributes: [
    { name: 'amount', type: 'number', required: true },
    { name: 'status', type: 'enum', values: ['pending', 'active', 'repaid'] },
  ],
  actions: [
    { name: 'Apply',   type: 'write' },
    { name: 'Approve', type: 'write' },
  ],
}))
;({ dna } = addPerson(dna, { name: 'Borrower' }))
;({ dna } = addRole(dna, { name: 'Underwriter' }))
;({ dna } = addOperation(dna, { name: 'Loan.Apply',   target: 'Loan', action: 'Apply' }))
;({ dna } = addOperation(dna, { name: 'Loan.Approve', target: 'Loan', action: 'Approve' }))
;({ dna } = addTrigger(dna, { operation: 'Loan.Apply', source: 'user' }))
;({ dna } = addRule(dna, { operation: 'Loan.Approve', type: 'access', allow: [{ role: 'Underwriter' }] }))
;({ dna } = addTask(dna, { name: 'approve-loan', actor: 'Underwriter', operation: 'Loan.Approve' }))

// 3. Validate.
const validator = new DnaValidator()
const schemaResult = validator.validate(dna, 'operational')
const crossResult = validator.validateCrossLayer({ operational: dna })

if (!schemaResult.valid) console.error(schemaResult.errors)
if (!crossResult.valid)  console.error(crossResult.errors)
// Both green for the DNA above.
```

That covers the two responsibilities — builders give you a typed, schema-aware way to construct DNA, and `DnaValidator` confirms the result holds together at the JSON-Schema level *and* across primitive references.

---

## Constructing Operational DNA

### Builders — the canonical way to construct DNA

`createOperationalDna(opts)` returns an empty DNA shell. Eleven `add*` builders compose primitives into it: every Operational primitive (Resource, Person, Role, Group, Membership, Operation, Trigger, Rule, Task, Process) plus `addRelationship`. Every `add*` has the same shape:

```ts
function addResource(
  dna: OperationalDNA,
  resource: Resource,
  opts?: { validate?: boolean }
): { dna: OperationalDNA; conflicts: Conflict[] }
```

**Properties guaranteed by every builder:**

- **Pure & immutable** — never mutates the input DNA. Same input, same output, every time.
- **Compose-on-duplicate** — same-name composes via the merge engine. List-shaped children union by name; scalar disagreements emit `Conflict` entries. Builders never throw on a duplicate name.
- **Default-on schema validation** — catches malformations TypeScript can't express (regex patterns like `^[A-Z][a-zA-Z0-9]*$` on `Resource.name`, conditional requirements like `values` when `Attribute.type === 'enum'`, the source-of-truth enum lists). Pass `{ validate: false }` for hot paths where input is already known valid.
- **Compile-time typed** — input parameters are typed against each primitive's schema. Misuse fails at build time, not just at runtime.

```ts
// Compile-time error: name must be a string
addResource(dna, { name: 123 })

// Compile-time error: action is required on Operation
addOperation(dna, { target: 'Loan' })

// Runtime error: enum requires `values`
addResource(dna, { name: 'Loan', attributes: [{ name: 'status', type: 'enum' }] })
// throws: "operational/resource input failed validation: /attributes/0 must have required property 'values'"
```

**Auditing compose-on-add disagreements:**

```ts
let r = addResource(dna, { name: 'Loan', description: 'Consumer loan' })
const r2 = addResource(r.dna, { name: 'Loan', description: 'Mortgage product' })
// r2.conflicts contains:
//   { path: 'resources.Loan.description',
//     values: [{ value: 'Consumer loan', source: ... }, { value: 'Mortgage product', source: ... }],
//     recommendation: { value: 'Mortgage product', reason: 'stable-order: tied on all heuristics; first-observed wins' },
//     kind: 'scalar' }
```

Full reference and patterns: [`docs/builders.md`](./docs/builders.md).

### `merge()` — compose multiple chunks at once

Compose multiple Operational DNA chunks into one. Pure, deterministic, no I/O — designed for the multi-source ingest case (`@dna-codes/dna-ingest` calls this as its fan-in step) but usable on its own.

```ts
import { merge } from '@dna-codes/dna-core'

const result = merge([
  { dna: chunkA, source: { uri: 'file:///sop.md',  loadedAt: '2025-01-01T00:00:00.000Z' } },
  { dna: chunkB, source: { uri: 'gdrive://policy', loadedAt: '2025-06-01T00:00:00.000Z' } },
])

result.dna          // merged OperationalDNA — validates against the operational schema
result.conflicts    // Conflict[] — scalar disagreements + unresolved-ref warnings
result.provenance   // dotted-path → contributing sources, e.g. 'resources.Loan' → [...]
```

Same-named primitives unify across chunks. List-shaped children union by name. Scalar disagreements use the v1 recommendation policy:

1. Value backed by the most distinct sources wins.
2. Tie-break by most recent `loadedAt`.
3. Tie-break by longest non-empty string representation.
4. Final tie-break: stable input order.

The recommendation is written into the merged DNA so the result is always schema-valid; the full list of competing values + sources rides along in `Conflict.values` for review. Cross-references (`Operation.target`, `Membership.{person,role,group}`, `Trigger.operation`, `Task.{actor,operation}`, `Step.task`, `Rule.operation`) resolve against the merged noun set; unresolved references surface as `Conflict` entries with `kind: 'unresolved-reference'` (the referencing primitive is still emitted so a reviewer can fix the source documents).

Full reference: [`docs/merge.md`](./docs/merge.md).

### Builders vs. `merge()` — when to reach for which

| Use case | Reach for |
|---|---|
| Building DNA from code (fixtures, tests, a custom adapter, programmatic composition) | **Builders** |
| Composing N chunks produced by separate sources (input adapters, multi-document ingest) | **`merge()`** |
| Adding one primitive to an existing DNA, audit-able with conflict reporting | **Builders** |
| Resolving cross-references after composition | Both — `merge()` does it as its final step; builders rely on the same engine |

Both share the same composition engine internally; pick the surface that matches your call shape.

---

## Querying Operational DNA

The query API is the canonical read side of `dna-core` — the symmetric counterpart to the builders. Every function is pure, read-only, and accepts an `OperationalDNA` document.

```ts
import {
  getOperation, getOperations,
  getResource,  getResources,
  getRole,      getRoles,
  getActorsForOperation,
  getRulesForOperation,
  getTasksForOperation,
  getOperationsForResource,
  getTriggersForProcess,
  getMembershipsForRole,
  // … and more
} from '@dna-codes/dna-core'

// Single-item getters return T | null
const op = getOperation(dna, 'Loan.Approve')  // Operation | null

// List getters return T[] (never null)
const ops = getOperations(dna)                 // Operation[]

// Cross-reference resolvers
const actors = getActorsForOperation(dna, 'Loan.Approve')
// → Array<Role | Person> — human and system actors, dangling refs silently omitted

const rules = getRulesForOperation(dna, 'Loan.Approve')
// → Rule[]  — access + condition rules for this operation
```

Transport wrappers (`dna-mcp`, `dna-api`, `dna-cli`) should use these functions rather than traversing raw DNA directly. See [`docs/queries.md`](./docs/queries.md) for the full API reference and common patterns.

---

## Validating Operational DNA

### `DnaValidator` — the validator

AJV-backed. All DNA schemas (per-primitive + per-layer aggregates) pre-registered. No setup beyond `new DnaValidator()`.

```ts
import { DnaValidator } from '@dna-codes/dna-core'

const validator = new DnaValidator()
```

#### Per-document validation

`validate(doc, schemaId)` validates a document against any registered schema, by short or full ID:

```ts
import operational from './dna/lending/operational.json'

validator.validate(operational, 'operational')                        // full document
validator.validate(operational.domain.resources[0], 'operational/resource')  // single primitive
```

The result is `{ valid: boolean; errors: ErrorObject[] }` — AJV's standard error shape. Common interpretation pattern:

```ts
const result = validator.validate(operational, 'operational')
if (!result.valid) {
  for (const err of result.errors) {
    console.error(`  ${err.instancePath || '/'}  ${err.message}`)
    if (err.params) console.error(`    params:`, err.params)
  }
}
```

Common error classes you'll see (and why each exists):

| Error | What triggered it |
|---|---|
| `must have required property 'X'` | A required field is missing. Check the primitive's schema in `@dna-codes/dna-schemas` for the required list. |
| `must match pattern "^[A-Z][a-zA-Z0-9]*$"` | A name doesn't match its naming convention. PascalCase for nouns; PascalCase verbs for actions; kebab-case for tasks/processes. |
| `must be equal to one of the allowed values` | An enum field got an unknown value (e.g. `Attribute.type: 'invalid'` or `Trigger.source: 'manual'`). |
| `must NOT have additional properties` | An unknown field on a primitive (typo, or a field that belongs on a different primitive). |
| `must have required property 'values'` (on an Attribute) | `Attribute.type === 'enum'` requires a `values` array — schema's conditional rule. |
| `must have required property 'schedule'` (on a Trigger) | `Trigger.source === 'schedule'` requires a `schedule` cron expression. |

#### Cross-layer validation

Schema validation alone confirms shape, not consistency. `validateCrossLayer()` walks references *between* primitives and across layers:

```ts
const result = validator.validateCrossLayer({
  operational,
  productCore,   // optional
  productApi,    // optional
  productUi,     // optional
  technical,     // optional
})
```

Examples of what cross-layer catches:

- **Operational:** `Operation.target` references a noun that doesn't exist; `Task.actor` references a Role/Person not declared; `Process.steps[].task` references an undeclared Task; `Membership.person` / `.role` / `.group` references a primitive not declared; Role.scope/.parent cycles; Role exclusion pairs whose effective scopes don't intersect; etc.
- **Operational → Product Core:** every Product Core Resource/Operation must be present in Operational (Product Core never invents).
- **Product API → upstream:** every API Resource/Operation must trace back to Product Core (preferred) or Operational (fallback).
- **Product UI → Product API:** every Page Resource and Block Operation must be declared in Product API.
- **Technical:** every Construct's provider must be declared; every Cell's constructs must be declared.

The result is `{ valid: boolean; errors: { layer, path, message }[] }`. The errors are designed to be human-readable directly:

```
operational    operations/Loan.Approve/target    Operation "Loan.Approve" target "Loanz" is not a declared
                                                 Resource, Person, Role, Group, or Process; available
                                                 targets: "Loan", "Borrower", "Underwriter"
```

#### `availableSchemas()`

```ts
validator.availableSchemas()
// → ['https://dna.codes/schemas/operational/resource', 'operational/resource', ...]
```

Useful for diagnostics; both the full `$id` and the short form (without the `https://dna.codes/schemas/` prefix) are registered for every schema.

### Validating untrusted input

```ts
function validateOperationalDna(json: unknown):
  | { ok: true; dna: OperationalDNA }
  | { ok: false; errors: { schema?: ErrorObject[]; cross?: CrossLayerError[] } } {
  const validator = new DnaValidator()
  const schema = validator.validate(json, 'operational')
  if (!schema.valid) return { ok: false, errors: { schema: schema.errors } }
  const cross = validator.validateCrossLayer({ operational: json })
  if (!cross.valid) return { ok: false, errors: { cross: cross.errors } }
  return { ok: true, dna: json as OperationalDNA }
}
```

Schema validation tells you *the shape is right*. Cross-layer validation tells you *the references hold together*. Both run together when you need full confidence.

---

## Recipes

### Build then validate

Already shown in the quick start. The pattern:

```ts
let dna = createOperationalDna({ domain: { name: 'd' } })
;({ dna } = addX(dna, ...))
const validator = new DnaValidator()
const r = validator.validate(dna, 'operational')
```

The builders' default-on schema validation already ensures every individual primitive validates; the post-hoc `DnaValidator.validate(dna, 'operational')` confirms the *aggregate* document is well-formed and `validateCrossLayer({ operational: dna })` confirms references resolve.

### Audit conflicts produced during construction

```ts
let dna = createOperationalDna({ domain: { name: 'd' } })
const accumulated: Conflict[] = []
for (const r of incomingResources) {
  const result = addResource(dna, r)
  dna = result.dna
  accumulated.push(...result.conflicts)
}
if (accumulated.length > 0) {
  console.warn(`composed ${accumulated.length} disagreements:`)
  for (const c of accumulated) {
    console.warn(`  ${c.path}: ${c.values.length} values, picked: ${JSON.stringify(c.recommendation.value)} (${c.recommendation.reason})`)
  }
}
```

### Merge multiple sources, then validate

```ts
import { merge, DnaValidator } from '@dna-codes/dna-core'

const result = merge([
  { dna: chunkFromDrive,   source: { uri: 'gdrive://abc',     loadedAt: '...' } },
  { dna: chunkFromSopFile, source: { uri: 'file:///sop.md',   loadedAt: '...' } },
])

const validator = new DnaValidator()
const schemaResult = validator.validate(result.dna, 'operational')
const crossResult  = validator.validateCrossLayer({ operational: result.dna })

if (!schemaResult.valid || !crossResult.valid || result.conflicts.length > 0) {
  // Decide whether to ship the partial DNA, raise an alert, or fail the run.
}
```

### Skip validation in hot paths

Builders default to `validate: true`. For inner loops processing many primitives that are already known to validate (e.g., re-emitting a previously-validated DNA), opt out:

```ts
;({ dna } = addResource(dna, knownGoodResource, { validate: false }))
```

`merge()` is also a hot path: it calls into the same composition engine via builders without re-validating per primitive — it's designed for chunks that are already schema-valid by construction.

### Inspect what the validator covers

```ts
const validator = new DnaValidator()
console.log(validator.availableSchemas().filter(id => !id.startsWith('https://')))
// → ['operational/action', 'operational/resource', 'operational',
//    'product/core/resource', 'product/api/endpoint', ...]
```

---

## API reference (other exports)

### `schemas` — typed access to every per-primitive JSON Schema

```ts
import { schemas } from '@dna-codes/dna-core'

schemas.operational.resource       // Resource schema (Draft 2020-12)
schemas.product.core.role          // Product Core Role schema
schemas.product.api.endpoint       // Product API Endpoint schema
schemas.product.ui.app             // Product UI App schema (top of the UI hierarchy)
schemas.product.ui.module          // Product UI Module schema
schemas.product.web.page           // Product UI Page schema
schemas.technical.cell             // Technical Cell schema

schemas.operational.resource.$id
// → 'https://dna.codes/schemas/operational/resource'
```

### `documents` — per-layer aggregate schemas

```ts
import { documents } from '@dna-codes/dna-core'

documents.operational              // shape of operational.json
documents.productCore              // shape of product.core.json
documents.productApi               // shape of product.api.json
documents.productUi                // shape of product.ui.json
documents.technical                // shape of technical.json
```

### `lenses` — core lens definitions

All six core lens definitions, keyed by camelCase name. The raw JSON files live in `packages/core/lenses/` and ship with this package. Lenses are named graph patterns (nodes + edges) governing both query and command directions.

```ts
import { lenses, allLenses } from '@dna-codes/dna-core'

lenses.operational    // layer lens: all operational resource types
lenses.product        // layer lens: all product resource types
lenses.technical      // layer lens: all technical resource types
lenses.people         // traversal lens: Person → Group
lenses.accessControl  // subgraph lens: User → Role → Domain / Operation → Resource
lenses.execution      // subgraph lens: Process → Task ← Trigger

lenses.accessControl.$id
// → 'https://dna.codes/lenses/access-control'

lenses.accessControl.nodes.length  // 5
lenses.accessControl.edges.length  // 4
```

### `allLenses()` — flat array

Returns all six core lens definitions as a flat array, parallel to `allSchemas()`:

```ts
import { allLenses } from '@dna-codes/dna-core'

const all = allLenses()  // LensDefinition[] — 6 items
all.map(l => l.$id)
// → ['https://dna.codes/lenses/operational', ..., 'https://dna.codes/lenses/execution']
```

### `evaluateLens()` — run a lens against a data store

`evaluateLens(definition, store)` turns a declarative lens definition into a matched
result against any `DnaDataStore` (Neo4j or in-memory). A **data lens** returns an
instance subgraph `{ nodes, links }` (each node stamped with `_typeName`); a **schema
lens** returns `{ resourceTypes, relationshipTypes }`. Presentation (sentence
interpolation, view-model shaping) is a separate step that consumes the result.

A lens slot is **free** (bound to a `type` → matches any instance) or **pinned**
(`ref: { id }` or `ref: { select: { name | pathPrefix | attribute } }`). A **grouping**
is a data lens with a pinned anchor plus a `scope` describing how membership expands:

```ts
import { evaluateLens, validateLensDefinition } from '@dna-codes/dna-core'

const grouping = {
  $id: 'lens:bizops', name: 'BizOps', target: 'data',
  nodes: [{ slot: 'anchor', type: 'Domain', ref: { select: { pathPrefix: 'acme.bizops' } } }],
  scope: [{ from: 'anchor', via: ['belongs_to'], direction: 'in', depth: 'transitive' }],
}
validateLensDefinition(grouping)        // { valid: true, errors: [] }
const { nodes, links } = await evaluateLens(grouping, store)
```

Definitions are validated against the `meta/lens` JSON Schema (plus two semantic
rules: pinning is data-only, and every `scope.from` must name a pinned slot).
Definitions that omit `target` default to `data`, so the bundled all-free lens
files validate and evaluate unchanged. The bespoke `buildOrgChart` view is backed
by this evaluator; the remaining mcp lenses (`reporting-chains`, `span-of-control`,
`pipeline`, `people-positions`, `accounts`, `job-descriptions`) migrate to it
incrementally.

### `allSchemas()` — flat array

Convenient for bulk-registering with a JSON Schema validator:

```ts
import Ajv from 'ajv'
import { allSchemas } from '@dna-codes/dna-core'

const ajv = new Ajv({ strict: false, allErrors: true })
for (const s of allSchemas()) ajv.addSchema(s)
```

### `resolveSchemaFile(family, name)`

Returns the on-disk path of a schema file, or `null` if it doesn't exist:

```ts
resolveSchemaFile('operational', 'resource')      // → '/abs/.../resource.json'
resolveSchemaFile('product', 'api/endpoint')      // → '/abs/.../api/endpoint.json'
resolveSchemaFile('operational', 'ghost')         // → null
```

### `SCHEMA_ROOT`, `layerDirs`

Filesystem roots for consumers that walk the tree themselves:

```ts
SCHEMA_ROOT                        // .../node_modules/@dna-codes/dna-schemas
layerDirs.operational              // .../schemas/operational
layerDirs.product                  // .../schemas/product
layerDirs.technical                // .../schemas/technical
```

### Raw JSON schemas

To import an individual schema directly, depend on [`@dna-codes/dna-schemas`](../schemas/):

```ts
import resourceSchema from '@dna-codes/dna-schemas/operational/resource.json'
```

### TypeScript types for every primitive

The package exports per-primitive types alongside the runtime API. Useful for typing function signatures, fixtures, or your own builders:

```ts
import type {
  OperationalDNA,
  Resource, Attribute, Action,
  Person, Group, Role, RoleScope,
  Membership,
  Operation, OperationChange,
  Trigger, TriggerSource,
  Rule, RuleAllowEntry, RuleCondition, RuleConditionOperator, RuleType,
  Task,
  Process, ProcessStep,
  Relationship, RelationshipCardinality,
  Domain,
  Conflict, ConflictRecommendation, ConflictValue, Source, Provenance,
  MergeChunk, MergeResult,
} from '@dna-codes/dna-core'
```

A contract test in this package re-validates each schema's `examples[]` through the corresponding TypeScript type at build time — if a JSON Schema gains a field the TypeScript type is missing, the build fails.

---

## Using schemas from non-JS languages

Install [`@dna-codes/dna-schemas`](../schemas/) directly — zero dependencies, ships only the JSON files:

```
node_modules/@dna-codes/dna-schemas/
  operational/*.json              # 15 primitive + 1 aggregate
  product/core/*.json             # 5 primitives
  product/api/*.json              # 4 primitives
  product/web/*.json              # 4 primitives
  product/product.{core,api,ui}.json   # 3 aggregates
  technical/*.json                # 11 primitives + 1 aggregate
```

Schemas cross-reference each other by absolute URI (e.g. `https://dna.codes/schemas/operational/attribute`), so your validator must register **all** schemas before validating any one of them. The `allSchemas()` helper does this for you in JS; reproduce the same load-everything-then-validate pattern in your target language's validator.

## Primitive vocabulary

| Layer | Primitives |
|---|---|
| Operational | `Resource`, `Action`, `Operation`, `Attribute`, `Domain`, `Relationship`, `Trigger`, `Rule`, `Person`, `Role`, `Group`, `Membership`, `Task`, `Process` |
| Product | `Resource`, `Action`, `Operation`, `Layout`, `Page`, `Route`, `Block`, `Field`, `Namespace`, `Endpoint`, `Schema`, `Param` |
| Technical | `Environment`, `Cell`, `Construct`, `Provider`, `Variable`, `Output`, `Script`, `View`, `Node`, `Connection`, `Zone` |

Operational is modeled around the **Actor > Action > Subject** triad. `Resource` and `Action` appear at both the Operational and Product layers by design — a Product `Resource` is the surface projection of an Operational `Resource`, likewise for `Action`. The Actor is a `Role` (or `Person`) referenced by `Rule` (access), `Task` (assignment), `Membership` (eligibility), and `Process` (operator), rather than declared on the Operation itself. State mutations live on `Operation.changes`; there is no separate Outcome primitive. See each layer's doc in [`docs/`](./docs/) for full semantics.

## Product-UI governance — two-grain access

Product structural surfaces (`App`/`Module`/`Workflow`/`Page`) are access-controlled in **two composed grains**:

- **Coarse** — `can_access` (`Role`|`User` → surface) grants whether a *whole surface* is reachable. `assigned_to` (`User` → `App`) records which app a user is *homed* in. Both are the **authored governance edge class**: created by humans/agents, **never derived**, and preserved across projection re-runs (unlike `Role.permissions[]`, a derived rollup). `seedProductTypes()` registers these relationship types; `applyProjection()` never creates, removes, or rewrites the edges themselves.
- **Fine** — operation-level access `Rules` (gated in the UI by `<Operation>` in `@dna-codes/dna-react`) decide whether an individual control is enabled within a visible surface.

`resolveStructuralAccess(graph, surfaceId, subjects)` is the pure resolver for the coarse grain. Access **cascades down** `contains`: a grant on an `App` reaches its `Module`s/`Page`s unless a more specific `can_access` on a contained node overrides it (widening or narrowing). Default is deny.

```ts
import { resolveStructuralAccess, lintEmptySurfaces } from '@dna-codes/dna-core'

resolveStructuralAccess(
  {
    grants:   [{ subject: 'Underwriter', surface: 'app:lending' }],
    contains: [{ parent: 'app:lending', child: 'mod:origination' }],
  },
  'mod:origination',
  ['Underwriter'],               // current user id + role names
) // → true (inherited from the App grant)
```

`lintEmptySurfaces(input)` flags a role granted `can_access` to a surface whose exposed operations it can never perform — a "coarse access, no fine access" contradiction worth surfacing.

## What this package does *not* include

- **The raw JSON schemas.** Those live in [`@dna-codes/dna-schemas`](../schemas/) (core depends on it).
- **A CLI.** See [`@cell/cba`](../cba) (command: `cba`) for the full authoring lifecycle.
- **Cell runtimes.** Cells are separate consumers of DNA — see `technical/cells/*`.
- **Multi-source orchestration.** `@dna-codes/dna-ingest` fans many sources into one DNA via the `merge()` from this package.

## Versioning

DNA schemas are the contract; breaking changes require a major version bump. `$id` URIs (`https://dna.codes/schemas/<layer>/<primitive>`) are stable identifiers and will not change without a deprecation path.

## License

MIT.
