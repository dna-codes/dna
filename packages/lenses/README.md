# @dna-codes/dna-lenses

Core lens definitions for DNA — named graph patterns that govern both query and command directions.

## What is a Lens?

A **Lens** is the third DNA metamodel concept (alongside ResourceType/Resource and RelationshipType/Relationship). It is a named pattern of typed node slots and directed edges that defines:

- **Query direction** — find all subgraphs in the graph matching this pattern
- **Command direction** — assert a specific binding of this pattern into the graph

Both directions use the same definition. Three structural kinds all resolve to the same Lens format:

| Kind | Nodes | Edges | Example |
|------|-------|-------|---------|
| Layer | ≥1 | 0 | `operational` |
| Traversal | 2 | 1 | `people` |
| Subgraph | ≥2 | ≥2 | `access-control` |

## LensType Format

Every lens file composes `base.json` via `allOf` and uses the `https://dna.codes/lenses/` `$id` namespace.

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "$id": "https://dna.codes/lenses/<name>",
  "allOf": [{ "$ref": "https://dna.codes/lenses/base" }],
  "name": "Human-Readable Name",
  "sentence": "{{subject}} holds {{assignment}} within {{boundary}}",
  "nodes": [
    { "slot": "subject",    "type": "User" },
    { "slot": "assignment", "type": "Role" },
    { "slot": "boundary",   "type": "Domain" }
  ],
  "edges": [
    { "from": "subject", "to": "assignment", "via": "User_Role" },
    { "from": "assignment", "to": "boundary", "via": "Role_Domain" }
  ]
}
```

**Fields:**
- `nodes[]` — required. Each entry has a `type` (ResourceType name) and an optional `slot` (name used in edges and sentence templates).
- `edges[]` — optional. Each entry has `from`, `to` (slot names), and `via` (RelationshipType name).
- `sentence` — optional. Human-readable template with `{{slot}}` markers.

Node type and edge `via` values are plain strings — no cross-package JSON Schema `$ref` dependencies.

## Core Lenses

### Layer lenses (no edges)

| File | Name | Nodes |
|------|------|-------|
| `operational.json` | Operational | Person, Group, Role, Membership, Domain, Resource, Operation, Action, Process, Rule, Task, Trigger |
| `product.json` | Product | User, Role, Resource, Operation, Action, Field, Endpoint, Namespace, Param, Schema, Block, Layout, Page, Route |
| `technical.json` | Technical | Cell, Connection, Construct, Environment, Node, Output, Provider, Variable, View, Zone |

### Subgraph lenses

| File | Name | Nodes | Edges |
|------|------|-------|-------|
| `people.json` | People | person (Person), group (Group) | Person_Group |
| `access-control.json` | Access Control | subject (User), assignment (Role), boundary (Domain), grant (Operation), target (Resource) | User_Role, Role_Domain, Role_Operation, Operation_Resource |
| `execution.json` | Execution | process (Process), task (Task), trigger (Trigger) | Process_Task, Trigger_Process |

## Usage

Lenses are registered in `@dna-codes/dna-core` and available via:

```typescript
import { lenses, allLenses } from '@dna-codes/dna-core'

lenses.accessControl  // Access Control lens definition
lenses.operational    // Operational layer lens

allLenses()           // all six lens definitions as a flat array
```
