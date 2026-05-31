## 1. Package scaffold

- [x] 1.1 Create `packages/lenses/` directory with `package.json` (`@dna-codes/dna-lenses`, no runtime deps)
- [x] 1.2 Add `packages/lenses/` to the root `pnpm-workspace.yaml` (or equivalent workspace config)
- [x] 1.3 Create `packages/lenses/README.md` documenting the LensType format and the six core lenses

## 2. LensType base schema

- [x] 2.1 Create `packages/lenses/base.json` — JSON Schema Draft 2020-12, `$id: https://dna.codes/lenses/base`, required: `name`, `nodes[]`; optional: `edges[]`, `sentence`
- [x] 2.2 Define `$defs` in `base.json` for the node slot object (`slot?`, `type`) and edge object (`from`, `to`, `via`)

## 3. Layer lens definitions

- [x] 3.1 Create `packages/lenses/operational.json` — layer lens grouping all 10 operational resource types, no edges
- [x] 3.2 Create `packages/lenses/product.json` — layer lens grouping all product resource types (core + api + ui), no edges
- [x] 3.3 Create `packages/lenses/technical.json` — layer lens grouping all technical resource types, no edges

## 4. Subgraph lens definitions

- [x] 4.1 Create `packages/lenses/people.json` — two slots (person: Person, group: Group), one edge (Person_Group), sentence template
- [x] 4.2 Create `packages/lenses/access-control.json` — five slots (subject: User, assignment: Role, boundary: Domain, grant: Operation, target: Resource), four edges, sentence template
- [x] 4.3 Create `packages/lenses/execution.json` — three slots (process: Process, state: State, transition: Transition), two edges, sentence template

## 5. packages/core/ registration

- [x] 5.1 Add `lenses` object to `packages/core/src/index.ts` exporting all six core lens definitions (loaded from JSON files)
- [x] 5.2 Add `allLenses()` function to `packages/core/src/index.ts` returning all lens definitions as a flat array, parallel to `allSchemas()`
- [x] 5.3 Add `@dna-codes/dna-lenses` as a dependency in `packages/core/package.json`

## 6. Tests

- [x] 6.1 Add test block in `packages/core/src/index.test.ts` verifying `lenses` object has all six keys and each has a `$id`
- [x] 6.2 Add test verifying `allLenses()` returns exactly 6 items
- [x] 6.3 Add test validating each core lens against `base.json` using AJV (name, nodes[], edges shape)
- [x] 6.4 Add test verifying Access Control lens has 5 nodes and 4 edges
- [x] 6.5 Add test verifying all three layer lenses have nodes and no edges

## 7. Docs and README

- [x] 7.1 Update root `README.md` to document the Lens primitive, `packages/lenses/`, and the two-direction (query/command) model
- [x] 7.2 Update `packages/core/README.md` (if exists) to document the new `lenses` export and `allLenses()`
