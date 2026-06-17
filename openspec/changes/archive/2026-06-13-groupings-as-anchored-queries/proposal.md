## Why

DNA kept conflating two different jobs under one word — "pack." One job is **distributing vocabulary** (getting the CRM or HR type definitions into a registry at setup time). The other is **slicing the live graph into business-meaningful regions** — "everything in Fulfillment," "everything the Engineering team touches." These are not the same thing, and treating them as one produced an over-engineered packaging model (install-time definer/composer bundles, dependencies, a marketplace) for what is actually a query.

The simplification: the grammar is fixed, **the graph is the single source of truth**, and a "grouping" is just a saved query — a subgraph **anchored at a node that already exists** (a `Group` for org units, a `Domain` for functional areas). You do not install "BizOps." BizOps emerges because there is a BizOps node and things connect to it. This is the core modeling principle (no structural hierarchy outside the graph) paying off: groupings fall out of the graph for free, and they overlap for free because one node can satisfy many anchors.

This change writes that down as doctrine and names the one decision it leaves open: whether a functional **subdomain** is a string namespace tag or a first-class `Domain` node.

## What Changes

- **New doctrine** (`design.md`) — graph-as-truth; the two senses of "pack" separated; groupings defined as node-anchored queries over the live graph; the grammar core (Structure / Behavior / Actors over the fixed primitives) affirmed as the fixed floor.
- **Home unified with grouping** — a node's canonical "home" is the *primary* `belongs_to` edge to a `Domain` node (cardinality 1), the same primitive groupings use. The dot-separated `path` becomes a **derived cache**, not an authoritative field. Every node has a mandatory home; the root `Domain` is the organization / tenant itself.
- **Pure (identity-less) groupings are saved lenses** — a grouping that doesn't earn its own `Domain` node is a lens object over existing anchors, not new edges. Whether a grouping earns a node is governed by the existing **identity test**.
- **Direction for the schemas** — drop the single-home containment arrays from `operational/domain.json`, demote `path` to a derived cache. Recorded as direction; the migration is a separate change.
- **No code in this change.** This captures settled thinking. The runtime grouping/lens mechanism and the schema migration are out of scope here.

## Capabilities

### New Capabilities

- `grouping-model`: A business-meaningful grouping is a node-anchored query over the live graph (subgraph reachable from / scoped to an anchor node), not an installed bundle of definitions. Groupings overlap because a node may satisfy multiple anchors.

## Impact

- Documentation/doctrine only — no package code changes.
- Sets the frame for two downstream changes: (1) the runtime grouping/query mechanism, and (2) the subdomain representation decision (`tag-vs-node`), to be explored next.
- Reframes the earlier "starter pack" / schema-folder work as **vocabulary distribution** (setup-time convenience), decoupled from runtime groupings.
