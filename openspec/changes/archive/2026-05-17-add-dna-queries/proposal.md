## Why

Every transport wrapper that sits on top of `dna-core` — an MCP server, a REST API, a CLI — needs to look up DNA primitives by name and resolve cross-references: "which rules apply to this operation?", "which actors can perform it?", "which triggers fire this process?". Today there are no canonical read functions for this; consumers navigate the raw `OperationalDNA` shape directly. This mirrors exactly the problem builders solved on the write side: each consumer rolls its own traversal logic, it drifts, and the same lookups get reimplemented across packages.

The builder change (`add-dna-builders`) gave `dna-core` a clean write API. The read side is still ad-hoc. Adding a symmetric query layer completes the `dna-core` API surface and makes transport wrappers trivial to build — each MCP tool, API route, or CLI subcommand calls one `dna-core` function rather than understanding the raw DNA structure.

## What Changes

- **NEW** `@dna-codes/dna-core` exports a query API, organized under `packages/core/src/queries/`, mirroring the `builders/` structure.
- **NEW** Per-primitive lookup pairs for every Operational primitive — a single-item getter returning `T | null` and a list getter returning `T[]`:
  `getResource` / `getResources`, `getPerson` / `getPersons`, `getRole` / `getRoles`, `getGroup` / `getGroups`, `getMembership` / `getMemberships`, `getOperation` / `getOperations`, `getProcess` / `getProcesses`, `getTask` / `getTasks`, `getTrigger` / `getTriggers`, `getRule` / `getRules`.
- **NEW** Cross-reference resolvers that traverse string-based DNA links and return resolved primitive objects:
  `getRulesForOperation(dna, opName)`, `getTriggersForOperation(dna, opName)`, `getTriggersForProcess(dna, processName)`, `getActorsForOperation(dna, opName)`, `getOperationsForResource(dna, resourceName)`, `getTasksForOperation(dna, opName)`, `getMembershipsForRole(dna, roleName)`, `getMembershipsForPerson(dna, personName)`.
- **NEW** All query functions are pure, read-only, and accept `OperationalDNA` — no mutation, no I/O, no external deps.
- **NEW** All queries exported from `@dna-codes/dna-core`'s entry point alongside the builders.
- **NEW** Documentation: `packages/core/docs/queries.md` plus a usage section in `packages/core/README.md`.

**Out of scope** (deferred): Product-layer / Technical-layer queries (separate change once those layers stabilize), query helpers for output adapters (those can refactor opportunistically post-1.0), a query DSL or filter API.

## Capabilities

### New Capabilities

- `dna-queries`: A canonical, pure query API in `@dna-codes/dna-core` for reading and traversing Operational DNA documents. Covers per-primitive lookups (single and list) for every Operational primitive, plus cross-reference resolution for the non-trivial relationships between primitives. Symmetric counterpart to the builder API. The foundation for any transport wrapper (`dna-mcp`, `dna-api`, `dna-cli`) that needs to expose DNA operations without embedding raw traversal logic.

### Modified Capabilities

<!-- None. This is purely additive. -->

## Impact

- **`@dna-codes/dna-core`**: gains the queries module. Backwards-compatible — pure addition. Patch bump following the established pre-1.0 pattern.
- **All other packages**: no required changes. Output adapters (`output/markdown`, `output/mermaid`) traverse DNA directly today; they may opportunistically refactor to use queries post-1.0, but that is not part of this change.
- **Unblocks**: `@dna-codes/dna-mcp`, `@dna-codes/dna-api`, `@dna-codes/dna-cli` — each transport wrapper calls query functions rather than understanding raw DNA structure. The queries module is the complete read-side contract those packages build on.
