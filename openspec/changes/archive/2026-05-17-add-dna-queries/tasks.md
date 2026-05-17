## 1. Pre-implementation (open questions resolved in design.md)

- [x] 1.1 Resolve Q1: confirm `getActorsForOperation` includes system Roles. Check `examples/manufacturing` (multiple system Roles with `resource:` links and access Rules) to verify the expected output shape.
- [x] 1.2 Resolve Q2: confirm `getDomain(dna)` is omitted. If any transport wrapper prototype finds it useful, revisit here before implementation.

## 2. Query module scaffolding

- [x] 2.1 Create `packages/core/src/queries/` directory with `index.ts` (re-exports only — no logic)
- [x] 2.2 Create per-primitive files: `resource.ts`, `person.ts`, `role.ts`, `group.ts`, `membership.ts`, `operation.ts`, `process.ts`, `task.ts`, `trigger.ts`, `rule.ts`, `actor.ts`, `membership-resolve.ts`
- [x] 2.3 Add `export * from './queries'` to `packages/core/src/index.ts`

## 3. Per-primitive getters

- [x] 3.1 `resource.ts` — `getResource(dna, name): Resource | null`, `getResources(dna): Resource[]`
- [x] 3.2 `person.ts` — `getPerson(dna, name): Person | null`, `getPersons(dna): Person[]`
- [x] 3.3 `role.ts` — `getRole(dna, name): Role | null`, `getRoles(dna): Role[]`
- [x] 3.4 `group.ts` — `getGroup(dna, name): Group | null`, `getGroups(dna): Group[]`
- [x] 3.5 `membership.ts` — `getMembership(dna, name): Membership | null`, `getMemberships(dna): Membership[]`
- [x] 3.6 `operation.ts` — `getOperation(dna, name): Operation | null`, `getOperations(dna): Operation[]`
- [x] 3.7 `process.ts` — `getProcess(dna, name): Process | null`, `getProcesses(dna): Process[]`
- [x] 3.8 `task.ts` — `getTask(dna, name): Task | null`, `getTasks(dna): Task[]`
- [x] 3.9 `trigger.ts` — `getTriggers(dna): Trigger[]` (no single-item getter — Trigger has no name field; dropped per design decision)
- [x] 3.10 `rule.ts` — `getRule(dna, name): Rule | null`, `getRules(dna): Rule[]`

## 4. Cross-reference resolvers

- [x] 4.1 `rule.ts` — `getRulesForOperation(dna, opName): Rule[]` — filters `dna.rules` where `rule.operation === opName`
- [x] 4.2 `trigger.ts` — `getTriggersForOperation(dna, opName): Trigger[]` — filters where trigger targets this operation
- [x] 4.3 `process.ts` — `getTriggersForProcess(dna, processName): Trigger[]` — filters where trigger targets this process
- [x] 4.4 `operation.ts` — `getOperationsForResource(dna, resourceName): Operation[]` — filters where `op.target === resourceName`
- [x] 4.5 `task.ts` — `getTasksForOperation(dna, opName): Task[]` — filters where `task.operation === opName`
- [x] 4.6 `actor.ts` — `getActorsForOperation(dna, opName): Array<Role | Person>` — finds access Rules for opName; resolves each `allow` entry's `role` / `person` string against `dna.domain.roles` / `dna.domain.persons`; omits unresolved refs
- [x] 4.7 `membership-resolve.ts` — `getMembershipsForRole(dna, roleName): Membership[]`, `getMembershipsForPerson(dna, personName): Membership[]`

## 5. Tests

- [x] 5.1 Per-primitive getter tests against a minimal inline DNA and the `bookshopInput` fixture: found-returns-value, not-found-returns-null, list-returns-all, empty-dna-returns-empty-array
- [x] 5.2 Cross-reference resolver tests using canonical domain fixtures (`examples/lending`, `examples/healthcare`, `examples/manufacturing`): correct primitives returned, dangling refs omitted silently, empty-match returns `[]`
- [x] 5.3 `getActorsForOperation` — verify system Roles are included when present in access Rules (use `examples/manufacturing` scheduled trigger + system Role)
- [x] 5.4 TypeScript type tests: confirm return types are `T | null` (not `T | undefined`) for single getters and `T[]` for list getters; no `any` escapes
- [x] 5.5 Run full `dna-core` test suite (`npm test -w @dna-codes/dna-core`) — all pre-existing tests must pass unchanged

## 6. Documentation

- [x] 6.1 Write `packages/core/docs/queries.md` — API surface, null/empty semantics, cross-reference resolution model, relationship to builders, common patterns for transport wrappers
- [x] 6.2 Add queries usage section to `packages/core/README.md` linking to `docs/queries.md`
- [x] 6.3 Update `packages/ingest/AGENTS.md` — note that new transport packages (`dna-mcp`, `dna-api`, `dna-cli`) should use the query API rather than traversing raw DNA

## 7. Release

- [x] 7.1 Bump `@dna-codes/dna-core` patch version (stays within current minor line — pure additive change; all siblings with `^x.y.0` ranges accept automatically)
- [ ] 7.2 Tag and push (pause before this — triggers publish workflow)
- [x] 7.3 Smoke-test from a fresh consumer: install the bumped `@dna-codes/dna-core`, call `getActorsForOperation` against the lending example, verify resolved Role and Person objects returned

