## Context

DNA models everything as resources and relationships — typed nodes and typed directed edges — with no behavioral state or structural hierarchy outside the graph. The live registry (`ResourceType` / `RelationshipType`) plus the instance graph (`InstanceRecord` / `LinkRecord`) is the system of record.

While working out how to organize schema files and starter packs, the word "pack" came to mean two unrelated things at once. Pulling them apart is the whole insight of this doctrine.

## The grammar core (fixed floor — affirmed, not changed here)

The primitives and their thematic super-roles are the closed, fixed grammar. Nothing below replaces them.

```
   STRUCTURE          BEHAVIOR              ACTORS
   what exists        how it changes        who makes it change
   ─────────          ───────────────       ───────────────────
   Resource           Operation             Person
   Group              Process / Task        Role
   Domain             Trigger / Rule        (agency is a SLOT, not a primitive)
   Membership         Action
```

These are the parts of speech. They are not installable and not grouped — they are the fixed floor. Everything below operates on instances built from this grammar.

## Decision 1 — Two senses of "pack," permanently separated

```
   VOCABULARY BUNDLE  (setup-time)        GROUPING  (query-time)
   ─────────────────────────────         ──────────────────────
   "give me the CRM words"               "show me everything in Fulfillment"
   distributes TYPE DEFINITIONS          selects INSTANCE NODES
   a one-time convenience                a living, re-runnable view
   ≈ schema folders / starter packs      ≈ Fulfillment / BizOps / Engineering
   schema-level                          graph-level
```

A vocabulary bundle is only how type definitions get *into* a registry. It has no runtime meaning and is not how a business user thinks about their graph. The business-meaningful slices — the things people actually want to "see all of" — are groupings, and they live entirely at the instance/graph level.

**Consequence:** the earlier schema-folder / starter-pack organization question is purely a distribution-ergonomics question. It does not constrain, and is not constrained by, how groupings work.

## Decision 2 — Graph as the single source of truth

There is one graph for an organization. All structure lives in it. No grouping, hierarchy, or membership exists as metadata beside the graph; if a grouping is real, it is expressible *as* the graph.

You do not install "BizOps." BizOps exists because there is a BizOps node and edges connect work, people, and resources to it. Remove the side-tables; the graph already carries the structure.

## Decision 3 — A grouping is a node-anchored query

Every business-meaningful grouping has:

- an **anchor** — a node that already exists in the graph, and
- a **membership rule** — the edges/scope that pull nodes into the grouping.

```
   "Engineering team"   →  ORG UNIT      →  anchor = a Group node
                                            rule   = traverse membership / owns / reports_to

   "Fulfillment"        →  FUNCTIONAL    →  anchor = a Domain node (or a namespace scope)
                                            rule   = belongs-to-domain edge / path scope
```

Both reduce to the same operation: *give me the subgraph anchored at node X.* Org-unit groupings come essentially for free — `Group` nodes and membership edges already exist. Functional groupings are the same shape with a different anchor type.

**Overlap is free and requires no coordination.** A single `Person` node can be reached from the Engineering `Group` *and* scoped to the Fulfillment domain. One node satisfies many anchors, so it appears in many groupings. There is nothing to install, reconcile, or de-duplicate — overlap is just multiple predicates matching the same node.

## Decision 4 — "Home" is one mechanism with grouping, not a separate one

"Domain" was overloaded the way "pack" was — it did two jobs at once:

```
   HOME / NAMESPACE                        GROUPING (anchored query)
   ─────────────────                       ─────────────────────────
   exactly ONE per node                    MANY per node
   "where was this Loan born?"             "show me everything in Fulfillment"
   canonical address · define-once · name  a business slice · a view
   a TREE (acme ▸ finance ▸ lending)       a WEB (overlapping)
```

A single-home tag cannot express a many-home web, which is why the two pre-existing
representations in the schemas conflict (see below). The resolution: **home is the
*primary* `belongs_to` edge** — the same edge primitive groupings use, distinguished
only by being canonical and cardinality-1.

```
   belongs_to[primary] ──▶ Domain     =  HOME       (exactly ONE · drives namespace + naming)
   belongs_to          ──▶ Domain     =  GROUPING   (MANY · identity-bearing slices)
   (no edge; saved lens)              =  GROUPING   (pure query · no identity — see Decision 5)
```

Home is a *role an edge plays* (the canonical one), not a separate kind of thing — the
same shape as "agency is a slot, not a primitive." One primitive (`belongs_to → Domain`),
three tiers of use.

**Source of truth vs. cache.** The `belongs_to[primary]` edge is authoritative. The
dot-separated `path` string (`acme.finance.lending`) is a **derived cache** regenerated
from the edge chain — kept for naming and fast prefix filtering, never authoritative.

```
   SOURCE OF TRUTH                         DERIVED (cache)
   belongs_to[primary] ──▶ (finance)       path = "acme.finance"   ← naming + fast prefix filter
       └ parent ──▶ (acme)                 recomputed when re-homed
```

Buys: domains with identity (ownable, describable, dependencies between domains),
O(1) renames, referential integrity, home/grouping unified. Costs: cardinality-1
enforcement on the primary edge, ancestor resolution via traversal (or the cache),
cache regeneration on re-home.

**Every node has a home (mandatory).** A rootless node is illegal. The root `Domain`
is the **organization / tenant itself** (e.g. `acme`); every node ultimately chains to
it via `parent`. A mandatory home is what keeps the `path` cache always well-defined and
gives define-once a guaranteed namespace. This resolves the earlier "is there a mandatory
Core domain?" question: yes — and it is the tenant root, not a separate framework domain.

## Decision 5 — Pure (identity-less) groupings are saved lenses

A grouping that does **not** earn its own `Domain` node — no owner, no charter, no
attributes of its own — is **not** modeled as edges. It is a **saved lens object**
(`packages/core/lenses/*.json`, surfaced through the `lenses` registry): a named anchor
plus a traversal/scope. This reuses existing infrastructure and adds no primitive.

Whether a grouping earns a node is the **identity test** we already use for resource_types:

> A subdomain becomes a first-class `Domain` node only if it has its own attributes, its
> own relationships, and an identity independent of its members. Otherwise it is a saved
> lens (a query over the home tree and existing anchors) — no node needed.

- "Everything under `acme.finance`" → lens over the home path. No node.
- "Engineering team" → already a `Group` node. Traverse. (Free.)
- "Fulfillment" *with an owner, budget, charter* → earns a `Domain` node; members join by `belongs_to`.

## What this implies for the existing schemas

The schemas currently double-book domain membership, and both encodings are single-home —
incompatible with the overlap this doctrine makes a law:

```
   (A) STRING TAG       resource.domain = "acme.finance.lending"   ← one home, authoritative today
   (B) CONTAINMENT      Domain { resources:[…], persons:[…], … }   ← one home, authoritative today
   (C) NODE + EDGES     (Resource)──belongs_to──▶(Domain)          ← the model above (not built yet)
```

- **Drop the containment arrays** from `operational/domain.json` (`resources`, `persons`, `roles`, `groups`). They duplicate the tag and enforce single-home.
- **Demote `path`** from authoritative field to derived cache of the `belongs_to[primary]` edge.
- **`Domain` becomes a thin, identity-bearing node** (name, path, description, owner) reached by `belongs_to` edges.

These schema changes are noted here as direction; the migration is a separate change.

## Non-Goals (this change)

- The concrete runtime query/traversal mechanism for evaluating a grouping or lens.
- The schema migration itself (dropping containment, deriving `path`) — direction only.
- Any change to the grammar primitives or thematic roles.
- Any change to vocabulary distribution / schema-folder layout.

## Decision 6 — Lenses are schema lenses or data lenses; a grouping is a data lens

A grouping is not a separate construct. The four things a lens can reference —
`resource_type`, `resource`, `relationship_type`, `relationship` — are the cells of one
2×2 (node/edge × schema/data), and a lens is graph-generic:

```
              NODES                     EDGES
   SCHEMA     resource_type             relationship_type     ← the TYPE graph (model / ER view)
   DATA       resource (instance)       relationship (inst.)  ← the INSTANCE graph (the data)
```

Every lens expresses its pattern in **schema vocabulary** (types + relationship types).
The split is about what a lens **returns**:

- **Schema lens** — reads/returns the type graph. The model / ER / registry view. Always
  type-level; pinning does not apply.
- **Data lens** — reads/returns the instance graph. Within it, each slot/edge binding is
  *free* (bound to a type → matches any) or *pinned* (bound to a specific instance → an
  anchor).

```
   SCHEMA LENS   → the model itself                    (always type-level; no pinning)
   DATA LENS     → instances matching the pattern
        ├ all free + sentence   = a rendering view     (today's lenses, e.g. access-control)
        ├ pinned anchor         = a GROUPING (Decision 5)
        └ pinned edge           = audit one path
```

So a **grouping is a data lens with a pinned anchor**, and the saved-lens home for
identity-less groupings (Decision 5) is just such a lens. Presentation (`sentence` / render)
is an optional facet of either kind.

## Remaining open question

- **One schema or two:** do free and pinned bindings live in the *same* lens schema (a slot
  accepts `type` *or* `id`), or do schema-lenses and data-lenses get distinct shapes for
  legibility? Unifying is more powerful; splitting reads cleaner. To resolve when the runtime
  lens/grouping mechanism is designed.
