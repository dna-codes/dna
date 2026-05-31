## Context

DNA's metamodel currently has two concept pairs: ResourceType/Resource (nodes) and RelationshipType/Relationship (edges). Both are defined as JSON Schema files in `packages/schemas/` and registered in `packages/core/`. There is no first-class concept for named graph patterns — views that select, traverse, or compose multiple nodes and edges.

Lenses are the third metamodel concept pair. A Lens is a named graph pattern that defines both a query (find matching subgraphs) and a command (assert a binding). The same LensType definition governs both directions. Three kinds of patterns all resolve to the same Lens structure:
- **Layer lenses** — zero edges, selects nodes by type membership (replaces implicit folder-based layers)
- **Traversal lenses** — one edge, single-hop traversal (Person → Group)
- **Subgraph lenses** — multiple nodes and edges, connected graph pattern (Access Control)

`packages/lenses/` is a new npm package (`@dna-codes/dna-lenses`) that mirrors the structure of `packages/schemas/` and is registered in `packages/core/` alongside schemas.

## Goals / Non-Goals

**Goals:**
- Define the LensType base schema (`base.json`) as the shared contract all lens definitions compose
- Establish `packages/lenses/` as a peer package to `packages/schemas/` with its own `$id` namespace (`https://dna.codes/lenses/`)
- Ship six core lens definitions covering the three layers and three key subgraph patterns
- Register lenses in `packages/core/` so they are discoverable and validatable alongside schemas
- Validate all core lens definitions against the LensType base at test time

**Non-Goals:**
- Runtime lens execution (Cypher compiler, `applyLens()`, Neo4j traversal) — deferred
- Domain-specific lens authoring in a DNA document (the `lenses:` block in a DNA doc) — deferred; this change establishes the format and base schema only
- Lens composition (a lens referencing other lenses via `composes:`) — deferred

## Decisions

### 1. `packages/lenses/` as a standalone package, not a subdirectory of `packages/schemas/`

Lenses are a distinct metamodel concept — not resource type definitions. Keeping them in a separate package (`@dna-codes/dna-lenses`) makes the boundary explicit, allows them to evolve independently, and makes the parallel structure of the metamodel visible: schemas define what exists, lenses define how you view it.

Alternatives considered:
- `packages/schemas/lenses/` — conflates type definitions with view definitions; lenses are not schemas for resources
- `docs/` — lenses are machine-readable artifacts with $ids and base schemas; they belong in packages, not docs

### 2. LensType base schema at `base.json` (no `meta/` subdirectory)

The LensType base is a single file. There is no need for a `meta/` subdirectory (unlike `packages/schemas/meta/stability.json` which is a mixin composed into many files). `base.json` is the shared contract; all lens definitions validate against it. Mirrors the `$id` convention: `https://dna.codes/lenses/base`.

### 3. Lens definition structure: `nodes[]` + `edges[]` + `sentence`

```json
{
  "$id": "https://dna.codes/lenses/access-control",
  "allOf": [{ "$ref": "https://dna.codes/lenses/base" }],
  "name": "Access Control",
  "sentence": "{{subject}} holds {{assignment}} within {{boundary}}, granting {{grant}} against {{target}}",
  "nodes": [
    { "slot": "subject",    "type": "User"      },
    { "slot": "assignment", "type": "Role"      },
    { "slot": "boundary",   "type": "Domain"    },
    { "slot": "grant",      "type": "Operation" },
    { "slot": "target",     "type": "Resource"  }
  ],
  "edges": [
    { "from": "subject",    "to": "assignment", "via": "User_Role"             },
    { "from": "assignment", "to": "boundary",   "via": "Role_Domain"           },
    { "from": "assignment", "to": "grant",      "via": "Role_Operation"        },
    { "from": "grant",      "to": "target",     "via": "Operation_Resource"    }
  ]
}
```

Layer lenses use `nodes[]` with no `edges[]`. Traversal lenses use one edge. Subgraph lenses use multiple edges. The format is degenerate across all three — no structural distinction needed.

Node type references and edge `via` values are plain strings (not `$ref`s) — same convention as operational primitives referencing each other by name in DNA documents. No cross-package JSON Schema dependency.

### 4. Registration in `packages/core/` as a flat `lenses` object

```typescript
export const lenses = {
  operational:   load('lenses/operational.json'),
  product:       load('lenses/product.json'),
  technical:     load('lenses/technical.json'),
  people:        load('lenses/people.json'),
  accessControl: load('lenses/access-control.json'),
  execution:     load('lenses/execution.json'),
}
```

Parallel to `schemas` but kept as a separate export. `allSchemas()` continues to walk `schemas` only; a new `allLenses()` utility walks `lenses`. Both are exported from `packages/core/index.ts`.

### 5. `$id` namespace: `https://dna.codes/lenses/<name>`

Parallel to `https://dna.codes/schemas/<layer>/<primitive>`. Clean separation: schemas describe types, lenses describe views.

## Risks / Trade-offs

- **Node/edge type references are unvalidated strings** — a lens can reference a ResourceType or RelationshipType that doesn't exist. Mitigation: deferred to runtime validation when the lens executor is built; for now, core lenses are manually verified to reference only canonical types.
- **No lens composition yet** — complex lenses cannot reuse atomic lenses by reference. Mitigation: atomic lenses (people, traversal-level) can be defined as standalone lens definitions; complex lenses duplicate the edge definitions until composition is added.
- **Layer lenses vs. the existing folder/section structure** — `operational.json` etc. are now explicit lens definitions, but the DNA document still uses `operational:` as a section key. These are complementary; the lens is the machine-readable definition, the section key remains for authoring. Full alignment deferred.

## Open Questions

- Should `packages/core/` publish the `lenses` object from the main export, or as a separate subpath (`@dna-codes/dna-core/lenses`)? For now: main export, same as `schemas`.
- Should the LensType base include a `stability` field (composing `meta/stability`)? Likely yes — lenses should be able to carry experimental/beta/stable markers — but deferred to keep this change focused.
