---
name: lenses-vs-compositions-priority
description: Compositions are for building/spec (how DNA derives meaning); Lenses are for runtime query. Compositions are the current design priority.
metadata:
  type: project
---

Compositions and Lenses serve different jobs in the DNA metamodel:

- **Compositions** — how DNA derives meaning from its own graph. Named projections (Access Control, People, Execution) built by binding several lenses into a slot/sentence template. These define *the language*. Current priority.
- **Lenses** — single named traversals (node → node along a relationship) used at runtime query time. Atoms that compositions are built from. Deferred until the composition layer is defined.

**Why:** The project is in language-definition mode, not runtime mode. Compositions belong in the spec; lenses fall out of compositions (each slot is a named lens) and belong downstream.

**Priority order:**
1. Define compositions structurally (slots + edge vocab + machine-readable form alongside schemas)
2. Lenses emerge from that as the atomic building blocks — not the organizing principle
3. Runtime executor (`applyLens`, `compose`, Cypher compiler) deferred

**Gating decision:** The canonical edge vocabulary (which concepts-metamodel nodes survive reconciliation with the current DSL) must be settled before compositions can be made machine-readable. Key open question: where does the new Product Core `User`/`Role` land in the Access Control composition vs. operational `Person`/`Membership`.

**How to apply:** When exploring or proposing work on lenses/compositions, lead with compositions as the spec-level concern. Frame lenses as a byproduct or downstream concern, not the organizing unit.
