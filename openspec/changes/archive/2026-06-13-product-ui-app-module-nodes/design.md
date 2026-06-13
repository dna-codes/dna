## Context

This is the foundation of a three-change arc that makes the Product UI and API **first-class regions of the DNA graph**, derived from the business graph but carrying their own identity and governance. The shared doctrine below is referenced by `business-to-product-projection` and `product-ui-governance`.

`product-ui-graph-model` already registers `workflow`, `page`, `section`, `component`, `element`, `ui-operation` as graph resource types with `contains`/`triggers`/`calls`/`renders`/`requires` edges. `product-core-identity` registers `User`/`Role` (projections of Operational `Person`/`Role`), and notably `Role.permissions[]` is already "a derived rollup from Operational access Rules — not an authored source of truth." That is exactly the pattern this arc generalizes: **a node with real identity whose structural facts are derived from the business graph, while still being the subject of independently-authored edges.**

## Goals / Non-Goals

**Goals:**
- Add the missing top rungs (`App`, `Module`) and API rungs (`Endpoint`, `Service`) as graph resource types.
- Add the `realized_as` binding so a product node names the business node it surfaces, with the *level* configurable per node (a Process can be a Module or a Page).
- Keep everything on-doctrine: nodes + typed edges, no structure outside the graph.

**Non-Goals:**
- The derivation/projection that *creates* these nodes from the business graph (→ `business-to-product-projection`).
- Access edges binding users/roles to these nodes (→ `product-ui-governance`).
- Any runtime rendering or the `data-ui-planned` gap visuals.

## Decisions

### The three-plane model (shared doctrine)

One graph, three planes that meet at shared nodes:

```
 ACTORS / GOVERNANCE      PRODUCT (UI + API)            BUSINESS (Operational)
 User ─assigned_to─▶ App ◀─realized_as─ Domain (Function)
 Role ─can_access─▶ Module ◀─realized_as─ sub-Domain / Process
   │                  │ contains
   │ can_access ─▶  Page ◀─realized_as─ Process / Step
   │                  │ contains
   └─ requires ─▶ Component ─triggers▶ UIOperation ─calls▶ Operation ◀─performs─ Step
                                            │                  │ changes
 Endpoint ─exposes▶ Operation ◀────────────┘            Resource ◀─renders─ ...
 Service ─contains▶ Endpoint
```

The **seam** between Product and Business is a small set of edges — `calls` (UIOperation→Operation), `exposes` (Endpoint→Operation), `renders` (→Resource), and the new `realized_as` (product node → the business node it surfaces). Behavior binds at `Operation`; data binds at `Resource`.

### Decision: relationships are lens edges; API types are reused, not duplicated

The Product UI graph model is expressed as **edges in `packages/core/lenses/product-ui.json`** (`{ from, to, via }`), not a separate relationship registry — so `realized_as`, `exposes`, and the new `contains` rungs are added there. The API layer already ships `product/api/endpoint` (names its `Operation` via an `operation` field) and `product/api/namespace` (groups resources, maps from a Domain). This change **reuses** both rather than adding `Endpoint`/`Service` primitives: `exposes` is the derived edge from the endpoint's `operation` field, and `Namespace realized_as Domain` mirrors `App realized_as Domain`. Only `App` and `Module` are genuinely new node types.

### Decision: `realized_as` is a per-node binding with a type default

Rather than a fixed rule (Process always → Workflow), each product node may carry one `realized_as` edge to the business node it surfaces. The *projection level* (is this Process a Module or a Page?) is therefore data in the graph, with a type-default applied when no explicit binding overrides it. This is what lets the same business graph render as a wizard (Step→Page) or a board (Step→Section).

*Why an edge over an attribute:* `realized_as` is a relationship between two existing nodes (product ↔ business); modeling it as a typed edge keeps it queryable both ways ("what surfaces this Process?" / "what business backs this Page?") and on-doctrine.

### Decision: stable identity is required of derived product nodes

Although `business-to-product-projection` does the deriving, this change must define product nodes so they *can* carry a stable identity — keyed by `(realized_as target business node) + (UI level)`. That key is what lets re-derivation upsert structural edges idempotently while leaving authored governance edges untouched (see the edge-ownership rule below). The schemas therefore make `realized_as` the identity-bearing reference.

### Decision: two edge classes with distinct ownership (shared doctrine)

| Class | Edges | Owner | On re-derivation |
|---|---|---|---|
| Structural | `contains`, `realized_as`, `calls`, `renders`, `exposes`, `triggers` | the projection | idempotent re-sync |
| Governance | `can_access`, `assigned_to`, `requires` | humans / agents | never clobbered |

This change introduces only structural types; `product-ui-governance` adds the governance class. The rule is stated here once so all three changes share it.

## Risks / Trade-offs

- **Hierarchy ambiguity** (a Module containing Workflows vs Pages directly) → allow `contains` from `Module` to both `Workflow` and `Page`, mirroring how `Page` already contains both `Section` and `Component`.
- **`realized_as` to multiple levels** → a Process could in principle be realized both as a Module and as a Page in different apps. Cardinality is many-to-many; identity is per (business node, level, containing parent) so the two don't collide.
- **API plane scope creep** → keep `Endpoint`/`Service` minimal (name + `exposes`); full request/response schema derivation is out of scope for this change.

## Resolved Questions

- **App binding** → An `App` may bind (`realized_as`) to **any grouping anchor** (a `Domain` or a `Group`), not only a `Domain`. An App is the product face of a grouping, per the `grouping-model` doctrine; the anchor is whatever node the grouping is anchored at.
