## Why

DNA's metamodel has ResourceType/Resource and RelationshipType/Relationship as its node and edge primitives, but has no first-class concept for named graph patterns — the views that govern how resources and relationships are selected, traversed, and composed. Lenses fill this gap: a Lens is a named pattern of nodes and edges that defines both a query direction (find matching subgraphs) and a command direction (assert a binding), making layers, traversals, and multi-node compositions all one unified concept.

## What Changes

- **New package `packages/lenses/`** (`@dna-codes/dna-lenses`) — a peer to `packages/schemas/`, containing a LensType base schema and the core lens definitions that ship with DNA
- **LensType base schema** (`base.json`) — defines the shared contract for a lens: `name`, `nodes[]`, `edges[]`, `sentence` (optional). Every lens definition composes this base, mirroring how resource type schemas compose `meta/stability.json`
- **Core lens definitions** — six lenses covering layers and key subgraph patterns:
  - `operational.json` — layer lens grouping all operational resource types
  - `product.json` — layer lens grouping all product resource types
  - `technical.json` — layer lens grouping all technical resource types
  - `people.json` — traversal lens: Person → Group
  - `access-control.json` — subgraph lens: User → Role → Domain → Operation → Resource
  - `execution.json` — subgraph lens: Process → State → Transition
- **`packages/core/` registration** — lenses registered alongside schemas in `allSchemas()` / `index.ts`
- **`packages/schemas/` `$id` convention for lenses** — `https://dna.codes/lenses/<name>` (parallel to `https://dna.codes/schemas/...`)
- **DNA document `lenses:` block** — domain-specific lens definitions live inside a DNA document and validate against the same LensType base

## Capabilities

### New Capabilities

- `lens-primitive`: The Lens as a first-class DNA metamodel concept — a named graph pattern with nodes, edges, and sentence template, governing both query and command directions
- `lens-package`: The `packages/lenses/` npm package structure, LensType base schema, $id convention, and core registration in `packages/core/`
- `core-lenses`: The six core lens definitions shipped with DNA (three layer lenses + three subgraph lenses)

### Modified Capabilities

- `primitive-base-contract`: The shared base contract now applies to both resource type schemas (via `meta/stability`) and lens definitions (via LensType base) — two parallel base contracts in the metamodel

## Impact

- New package: `packages/lenses/` → `@dna-codes/dna-lenses`
- `packages/core/src/index.ts` — register lenses alongside schemas
- `packages/core/src/index.test.ts` — update schema/lens counts
- `README.md` — document the Lens primitive and `packages/lenses/`
- No breaking changes to existing packages
