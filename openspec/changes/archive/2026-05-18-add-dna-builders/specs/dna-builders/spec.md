## ADDED Requirements

### Requirement: `@dna-codes/dna-core` exports a builder API for every Operational primitive

The package SHALL export `createOperationalDna`, `addResource`, `addPerson`, `addRole`, `addGroup`, `addMembership`, `addOperation`, `addTrigger`, `addRule`, `addTask`, and `addProcess` from its public entry point. Each `add*` builder MUST take an `OperationalDNA` and a primitive spec and return `{ dna, conflicts }`, where `dna` is a new `OperationalDNA` and `conflicts` is the list of `Conflict` entries produced by composing the new primitive into any existing same-named primitive. The factory `createOperationalDna(opts)` MUST return an empty-but-valid `OperationalDNA` ready to receive primitives.

#### Scenario: Creating an empty DNA
- **WHEN** `createOperationalDna({ domain: { name: 'lending' } })` is called
- **THEN** the result is a valid `OperationalDNA` whose `domain.name === 'lending'` and whose noun and activity collections are absent or empty

#### Scenario: Adding a Resource to an empty DNA
- **WHEN** `addResource(dna, { name: 'Loan', attributes: [{ name: 'amount', type: 'number', required: true }] })` is called on a DNA created via the factory
- **THEN** the returned `dna` contains exactly one Resource named `Loan` with the given attribute, `result.dna.domain.resources` contains exactly that Resource, and `result.conflicts` is empty

#### Scenario: Every Operational primitive has a builder
- **WHEN** the public exports of `@dna-codes/dna-core` are inspected
- **THEN** the set of exported `add*` functions covers Resource, Person, Role, Group, Membership, Operation, Trigger, Rule, Task, and Process

### Requirement: Builders are pure and immutable

Every builder MUST be a pure function: it MUST NOT mutate its input DNA, MUST NOT perform I/O, and MUST NOT depend on global state. Calling the same builder with the same input twice MUST produce deeply-equal output across calls.

#### Scenario: Input DNA is not mutated
- **WHEN** `addResource(dna, resource)` is called
- **THEN** the original `dna` reference is structurally unchanged afterward (`JSON.stringify(dna)` matches its pre-call value)

#### Scenario: Same input → same output
- **WHEN** `addResource(dna, resource)` is called twice with the same arguments
- **THEN** the two return values are deeply equal

### Requirement: Adding a primitive with an existing name composes via the merge rules

When a builder adds a primitive whose `name` already exists in the same collection of the input DNA, the builder MUST compose the new primitive into the existing one using the same rules `merge()` applies: list-shaped children union by name, scalar disagreements emit `Conflict` entries with the v1 recommendation policy, and the recommendation is written into the merged DNA. Builders MUST NOT throw on a duplicate name, MUST NOT silently overwrite, and MUST NOT discard the new primitive — the composed result and any conflicts MUST be returned to the caller.

#### Scenario: Adding a same-named Resource unions list-shaped children
- **WHEN** the input DNA contains `{ name: 'Loan', attributes: [{ name: 'amount', type: 'number' }] }` and `addResource` is called with `{ name: 'Loan', attributes: [{ name: 'status', type: 'enum', values: [...] }] }`
- **THEN** the returned DNA contains a single `Loan` Resource with both `amount` and `status` attributes, and the returned `conflicts` array is empty

#### Scenario: Adding a same-named Resource with conflicting scalars emits a Conflict
- **WHEN** the input DNA contains `{ name: 'Loan', description: 'Consumer loan' }` and `addResource` is called with `{ name: 'Loan', description: 'Mortgage product' }`
- **THEN** the returned `conflicts` array contains exactly one entry whose `path === 'resources.Loan.description'`, both values are listed, and the merged DNA carries the recommendation

### Requirement: Builders accept compile-time-typed input matching the Operational schema

Each builder's TypeScript input parameter MUST be typed against the corresponding Operational primitive shape (Resource, Person, Role, Group, Membership, Operation, Trigger, Rule, Task, Process). The types MUST reject calls that omit required fields or use the wrong type, at compile time, when consumers use TypeScript.

#### Scenario: Wrong field type fails at compile time
- **WHEN** a TypeScript caller invokes `addResource(dna, { name: 123, attributes: [] })` where `name` should be a string
- **THEN** the TypeScript compiler reports a type error and the call cannot be built

#### Scenario: Missing required field fails at compile time
- **WHEN** a TypeScript caller invokes `addOperation(dna, { target: 'Loan' })` and the schema requires `action`
- **THEN** the TypeScript compiler reports a type error citing the missing `action` field

### Requirement: Builders validate against the JSON Schema by default; callers may opt out

Each builder MUST accept an options bag with `validate?: boolean`, defaulting to `true`. When `validate` is `true` (the default), the builder MUST validate its primitive input against the published JSON Schema (`@dna-codes/dna-schemas`) before composing it into the result, and MUST throw with a clear error message when the input does not validate. When `validate` is `false`, the builder MUST skip JSON-Schema validation (used by callers in hot paths such as `merge()`'s emit loop where inputs are already known to validate).

#### Scenario: Default behavior validates input
- **WHEN** `addResource(dna, { name: 'Loan', attributes: [{ name: 'amount', type: 'enum' }] })` is called without an explicit `validate` option, and the schema requires enum attributes to declare a `values` array
- **THEN** the builder throws an error whose message identifies the offending field

#### Scenario: Opt-out skips runtime validation
- **WHEN** `addResource(dna, resource, { validate: false })` is called
- **THEN** the builder does not invoke the JSON-Schema validator; the call returns regardless of whether the primitive matches the schema

### Requirement: Builders never break the Operational schema contract

A DNA produced by any sequence of builder calls (starting from `createOperationalDna(...)`) MUST validate against the `@dna-codes/dna-schemas` Operational schema. Builders MUST NOT introduce fields outside the published schema and MUST NOT produce structurally invalid DNA when given valid inputs.

#### Scenario: Builder-composed DNA validates
- **WHEN** a non-trivial DNA is composed via the builders (a domain plus several Resources, Persons, Roles, Groups, Memberships, Operations, Triggers, Rules, Tasks, and a Process) using valid inputs
- **THEN** running `DnaValidator.validate(result, 'operational')` returns `valid: true`

#### Scenario: Builders do not add inline provenance / source fields to the DNA
- **WHEN** the result of any builder is inspected
- **THEN** no `_provenance`, `_source`, or other non-schema field appears anywhere in the DNA tree

### Requirement: `merge()` is refactored to consume the builders without behavior change

The `merge()` function in `@dna-codes/dna-core` MUST be refactored to construct its merged DNA via the builder API. The observable behavior of `merge()` (identity-by-name unification, conflict reporting, cross-reference resolution, provenance map shape, empty-input handling, determinism) MUST remain identical to its pre-refactor behavior; every existing `merge()` test MUST pass unchanged.

#### Scenario: Existing merge tests pass after the refactor
- **WHEN** the test suite under `packages/core/src/merge/` is run after the refactor
- **THEN** every test passes without modification

### Requirement: `input-json` and `input-text/layered/constructor` are refactored to consume the builders

`@dna-codes/dna-input-json` and `@dna-codes/dna-input-text` MUST refactor their internal DNA-assembly code paths to use the builder API.

`@dna-codes/dna-input-json`'s public adapter signature and observable behavior MUST be preserved; every existing test for the adapter MUST pass unchanged.

`@dna-codes/dna-input-text`'s layered constructor MUST drop its `duplicate_name` tool-call error code — the new behavior is for same-named tool calls to compose into the existing primitive (matching the builder semantics). The constructor's `result()` MUST surface composed-on-add conflicts produced over the lifetime of the constructor's tool calls, so callers can audit. Every other guard rail (duplicate-call-by-signature, unknown-target, finalize-retry, iteration cap) MUST be preserved. Tests that asserted the old `duplicate_name` behavior MUST be updated to assert the new compose-on-add behavior; every other test MUST pass unchanged.

#### Scenario: input-json existing tests pass
- **WHEN** the test suite under `packages/input-json/src/` is run after the refactor
- **THEN** every test passes without modification

#### Scenario: Layered constructor composes same-named tool calls
- **WHEN** the LLM calls the same primitive-adding tool twice with the same `name` and different child collections (e.g. different `attributes[]` entries)
- **THEN** the tool call succeeds, the composed primitive carries the union of both calls' children, and `result().conflicts` is empty (no scalar disagreements)

#### Scenario: Layered constructor surfaces conflicts on scalar disagreement
- **WHEN** the LLM calls the same primitive-adding tool twice with the same `name` and conflicting scalar fields (e.g. different `description`)
- **THEN** the tool call succeeds, `result().conflicts` contains an entry for the disagreement with both values and a recommendation, and the composed primitive reflects the recommendation

#### Scenario: Other layered constructor guard rails are preserved
- **WHEN** the test suite under `packages/input-text/src/layered/` is run after the refactor
- **THEN** every test that did NOT assert the `duplicate_name` error code passes without modification
