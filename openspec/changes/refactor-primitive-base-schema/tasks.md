## 1. Pre-implementation (open questions)

- [ ] 1.1 Resolve Q1: confirm `ajv-formats` is added for UUID format validation — check if already present in `@dna-codes/dna-core` devDeps or installed transitively
- [ ] 1.2 Resolve Q2: confirm `name` pattern constraints stay per-primitive (not hoisted to base-primitive.json) — verify no naming pattern is shared across all primitives

## 2. `@dna-codes/dna-schemas` — base schema + primitive updates

- [ ] 2.1 Create `operational/base-primitive.json` — declares `id` (uuid), `type` (string), `name` (string), `version` (string) as required; `description` as optional
- [ ] 2.2 Update `operational/resource.json` — add `allOf: [$ref base-primitive]`, add `"type": { "const": "resource" }` to properties, replace `additionalProperties: false` with `unevaluatedProperties: false`
- [ ] 2.3 Update `operational/person.json` — same pattern, `"type": { "const": "person" }`
- [ ] 2.4 Update `operational/role.json` — same pattern, `"type": { "const": "role" }`
- [ ] 2.5 Update `operational/group.json` — same pattern, `"type": { "const": "group" }`
- [ ] 2.6 Update `operational/membership.json` — same pattern, `"type": { "const": "membership" }`
- [ ] 2.7 Update `operational/operation.json` — same pattern, `"type": { "const": "operation" }`
- [ ] 2.8 Update `operational/trigger.json` — same pattern, `"type": { "const": "trigger" }`
- [ ] 2.9 Update `operational/rule.json` — same pattern, `"type": { "const": "rule" }`
- [ ] 2.10 Update `operational/task.json` — same pattern, `"type": { "const": "task" }`
- [ ] 2.11 Update `operational/process.json` — same pattern, `"type": { "const": "process" }`
- [ ] 2.12 Update `operational/relationship.json` — same pattern, `"type": { "const": "relationship" }`
- [ ] 2.13 Bump `@dna-codes/dna-schemas` minor version

## 3. `@dna-codes/dna-core` — TypeScript types

- [ ] 3.1 Add `BasePrimitive` interface to `packages/core/src/types/operational.ts` — `id: string`, `type: string`, `name: string`, `version: string`, `description?: string`
- [ ] 3.2 Extend `Resource`, `Person`, `Role`, `Group`, `Membership` with `BasePrimitive`; narrow `type` to its literal on each
- [ ] 3.3 Extend `Operation`, `Trigger`, `Rule`, `Task`, `Process`, `Relationship` with `BasePrimitive`; narrow `type` to its literal on each
- [ ] 3.4 Add `src/version.ts` exporting `OPERATIONAL_SCHEMA_VERSION = '0.1'` (or current appropriate value)

## 4. `@dna-codes/dna-core` — builders

- [ ] 4.1 Add `uuid` generation utility to `builders/shared.ts` using `crypto.randomUUID()`
- [ ] 4.2 Update `addResource` — stamp `id`, `type: 'resource'`, `version` when not present
- [ ] 4.3 Update `addPerson` — stamp `id`, `type: 'person'`, `version`
- [ ] 4.4 Update `addRole` — stamp `id`, `type: 'role'`, `version`
- [ ] 4.5 Update `addGroup` — stamp `id`, `type: 'group'`, `version`
- [ ] 4.6 Update `addMembership` — stamp `id`, `type: 'membership'`, `version`
- [ ] 4.7 Update `addOperation` — stamp `id`, `type: 'operation'`, `version`
- [ ] 4.8 Update `addTrigger` — stamp `id`, `type: 'trigger'`, `version`
- [ ] 4.9 Update `addRule` — stamp `id`, `type: 'rule'`, `version`
- [ ] 4.10 Update `addTask` — stamp `id`, `type: 'task'`, `version`
- [ ] 4.11 Update `addProcess` — stamp `id`, `type: 'process'`, `version`
- [ ] 4.12 Update `addRelationship` — stamp `id`, `type: 'relationship'`, `version`

## 5. Migrate example documents and fixtures

- [ ] 5.1 Migrate `examples/lending/operational.json` — add `id`, `type`, `version` to every primitive
- [ ] 5.2 Migrate `examples/healthcare/operational.json`
- [ ] 5.3 Migrate `examples/manufacturing/operational.json`
- [ ] 5.4 Migrate `examples/education/operational.json`
- [ ] 5.5 Migrate `examples/marketplace/operational.json`
- [ ] 5.6 Migrate `examples/mass-tort/operational.json`
- [ ] 5.7 Update `packages/core/src/fixtures/bookshop.ts` — add base fields to every primitive in `bookshopInput`

## 6. Tests

- [ ] 6.1 Update builder tests — assert that returned primitives carry `id` (valid UUID), `type`, `version`; assert caller-supplied `id` is preserved
- [ ] 6.2 Update query tests — assert base fields are present on returned objects from `getResource`, `getOperation`, etc.
- [ ] 6.3 Add schema validation tests for `base-primitive.json` — missing required fields fail, unknown fields fail via `unevaluatedProperties`
- [ ] 6.4 Add TypeScript compile-time test — `Resource.type` is narrowed to `'resource'`; assigning `'operation'` to `Resource.type` fails tsc
- [ ] 6.5 Run full test suite (`npm test -w @dna-codes/dna-core`) — all tests pass

## 7. Release

- [ ] 7.1 Bump `@dna-codes/dna-schemas` minor version — introducing `version: "1"` on all primitives is a new schema minor version; any future primitive field shape change that increments `version` MUST be at least a minor bump (breaking field changes → major)
- [ ] 7.2 Bump `@dna-codes/dna-core` minor version
- [ ] 7.3 Tag and push (pause before this — triggers publish workflow)
