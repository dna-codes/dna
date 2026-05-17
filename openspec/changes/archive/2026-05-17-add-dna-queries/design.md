## Context

The `add-dna-builders` change gave `dna-core` a complete write API — `addResource`, `addOperation`, `addProcess`, etc. — as pure, immutable functions over `OperationalDNA`. The read side was explicitly deferred. It now has a concrete forcing function: transport wrappers.

Any package that exposes DNA through a transport layer (MCP tools, HTTP routes, CLI subcommands) needs to answer questions like:

- "Give me the operation named `Loan.Approve`."
- "Which rules govern `Loan.Approve`?"
- "Which roles and persons are allowed to perform `Loan.Approve`?"
- "What triggers fire the `LoanApproval` process?"
- "What operations target the `Loan` resource?"

Today there is no canonical answer. Each consumer would traverse `dna.operations.find(o => o.name === name)` or `dna.rules.filter(r => r.operation === opName)` directly. That is: raw shape knowledge scattered across transport wrappers. The cross-reference resolvers are especially non-trivial — resolving "which actors can perform operation X" requires finding access Rules, pulling each `allow` entry's `role` or `person` string, and looking those up in `dna.domain.roles` / `dna.domain.persons`. Without a canonical implementation, every transport wrapper does this differently.

The queries module is the symmetric counterpart to builders: builders are the canonical write API; queries are the canonical read API. Both live in `dna-core` because both are pure functions over DNA primitives with no transport or I/O concerns.

## Goals / Non-Goals

**Goals:**

- One canonical query module exported from `@dna-codes/dna-core` covering every Operational primitive with both single-item and list variants.
- Cross-reference resolvers for the non-trivial relationships (Rules → Operations, Triggers → Operations/Processes, Tasks → Operations, Memberships → Roles/Persons, and the reverse).
- Pure, read-only functions: no mutation of input, no I/O, no external dependencies.
- Consistent null/empty semantics: single-item getters return `T | null`; list getters return `T[]` (possibly empty). No throws for not-found.
- All queries exported from `@dna-codes/dna-core` entry point alongside builders.

**Non-Goals:**

- Product-layer / Technical-layer queries. Those layers are still evolving; revisit once they stabilize, following the same pattern as builders.
- A query DSL or filter API (`where`, `select`, `orderBy`). Plain functions are enough for the transport use cases; a filter layer can compose on top later.
- Refactoring output adapters to use queries. `output/markdown` and `output/mermaid` traverse DNA directly today; that refactor is out of scope and can happen opportunistically post-1.0.
- Caching or memoization. DNA documents are small (single-digit MB at worst); linear scans are negligible. Add only if profiling shows otherwise.
- "Smart" resolution that infers missing data. Queries are lookups, not LLM tools. If a referenced name doesn't exist in the DNA, it is omitted from the result.

## Decisions

### D1: `T | null` for single lookups; `T[]` for lists

```ts
getOperation(dna, 'Loan.Approve')   // → Operation | null
getOperations(dna)                  // → Operation[]
```

Single-item getters return `null` when not found. Callers decide how to handle missing — throw, return a 404, surface a CLI error. Queries don't make that decision.

List getters return an empty array for no results. They never return `null` — an empty collection is an honest answer.

**Why:** Mirrors TypeScript standard library conventions (`Array.find` → `T | undefined`; we use `null` to signal "intentionally absent" consistent with how DNA's own schema uses it). Transport wrappers pattern-match on `null` naturally: `if (!op) return { error: 'not found' }`.

**Alternative considered:** Throw `NotFoundError`. Rejected — throws require try/catch at every call site in transport wrappers, which are already handling their own error formats. `null` is cheaper to handle and doesn't mix error-handling concerns.

### D2: Cross-reference resolution is best-effort string lookup

DNA cross-references are plain strings validated by `dna-core`, not JSON Schema `$ref`s. Queries resolve them by name-equality:

```ts
getRulesForOperation(dna, 'Loan.Approve')
// → dna.rules.filter(r => r.operation === 'Loan.Approve')

getActorsForOperation(dna, 'Loan.Approve')
// → find access Rules for 'Loan.Approve'
//   → for each allow entry, look up role by name in dna.domain.roles,
//     or person by name in dna.domain.persons
//   → return resolved Role | Person objects; skip dangling references
```

Dangling references (a Rule points to a role name that doesn't exist in `dna.domain.roles`) are silently omitted. The `DnaValidator` is the place to catch those — queries don't re-validate.

**Why:** Queries run after validation. If a DNA passes `DnaValidator`, references are sound; omitting dangling references in queries is defense-in-depth, not the primary guard.

**Alternative considered:** Return `{ resolved: Array<Role | Person>, unresolved: string[] }` to surface dangling refs. Rejected for v1 — adds wrapper shape overhead at every call site in transport wrappers. If a caller needs to surface unresolved refs explicitly, they can diff the `allow` entries against the returned actors themselves.

### D3: File structure mirrors `builders/`

```
packages/core/src/queries/
  index.ts             ← public re-exports
  resource.ts          ← getResource / getResources
  person.ts            ← getPerson / getPersons
  role.ts              ← getRole / getRoles
  group.ts             ← getGroup / getGroups
  membership.ts        ← getMembership / getMemberships
  operation.ts         ← getOperation / getOperations / getOperationsForResource
  process.ts           ← getProcess / getProcesses / getTriggersForProcess
  task.ts              ← getTask / getTasks / getTasksForOperation
  trigger.ts           ← getTrigger / getTriggers / getTriggersForOperation
  rule.ts              ← getRule / getRules / getRulesForOperation
  actor.ts             ← getActorsForOperation (cross-primitive resolver)
  membership-resolve.ts← getMembershipsForRole / getMembershipsForPerson
```

Each file owns both the plain getters and the cross-reference resolvers for its primitive. `actor.ts` is the exception — `getActorsForOperation` spans Roles, Persons, and Rules so it lives in its own file rather than creating an import cycle.

**Why:** Mirrors `builders/` exactly for predictability. One-file-per-primitive means test layout is 1:1 with source.

### D4: Naming convention is explicit and unsurprising

| Pattern | Example | Returns |
|---|---|---|
| `get{Primitive}(dna, name)` | `getOperation(dna, 'Loan.Approve')` | `T \| null` |
| `get{Primitives}(dna)` | `getOperations(dna)` | `T[]` |
| `get{Primitives}For{Context}(dna, name)` | `getRulesForOperation(dna, 'Loan.Approve')` | `T[]` |

No abbreviations, no overloading. Each function does one thing. Transport wrappers map these directly to tool names, route handlers, or CLI subcommands without renaming.

### D5: Operational layer only — defer Product and Technical

Product and Technical query APIs are out of scope for the same reason as builders: those layers are still evolving. When they stabilize, `packages/core/src/queries/` gains new files following the same pattern. No schema changes needed here.

### D6: Versioning — patch bump following established pre-1.0 pattern

`@dna-codes/dna-core` patch bump (stays within the current minor line). Pure addition; no behavioral changes to existing exports. Every sibling with a `^x.y.0` dep range picks it up automatically with no cascade.

## Risks / Trade-offs

- **[Risk]** Cross-reference semantics are implicit. If the DNA model evolves how it expresses actor permissions (e.g. Rules gain a new `allow` variant), `getActorsForOperation` may need updating. → **Mitigation**: cross-reference resolver tests use the canonical domain fixtures (`examples/lending`, `examples/healthcare`, etc.); if a model change breaks those fixtures, the tests fail first.
- **[Trade-off]** Output adapters (`output/markdown`, `output/mermaid`) continue traversing raw DNA after this change lands. They are not wrong to do so — they need every field, not named lookups. Refactoring them is a separate concern.
- **[Trade-off]** The `actor.ts` cross-primitive file breaks the strict one-primitive-per-file pattern. The alternative — putting `getActorsForOperation` in `rule.ts` or `operation.ts` — creates an import from one file to another within the same queries directory. An isolated file with a clear name is cleaner.

## Open Questions

- **Q1**: Should `getActorsForOperation` also surface system Roles (i.e., `role.system === true`)? System Roles are valid `allow` entries in access Rules. Leaning yes — the function returns whatever the Rule permits, and callers filter by `role.system` if they need only human actors.
- **Q2**: Should there be a `getDomain(dna)` convenience that returns `dna.domain` directly, or is that too thin to be worth adding? Leaning no — `dna.domain` is a direct property access; a function wrapper adds ceremony with no safety value.
