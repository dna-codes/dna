## 1. Pre-implementation probes

Resolve the two open questions from design.md by reading repo state.

- [x] 1.1 Resolved: schema uses `rule_type` (no `subtype`). `packages/schemas/operational/rule.json` properties contain `rule_type` with enum `['access', 'condition']`. Registry Rules will use `rule_type:`.
- [x] 1.2 Resolved: examples carry inline `id` (UUID v4), `type` (lowercase primitive discriminator), and `version` (string `"1"`). Registry primitives carry the same.
- [x] 1.3 Confirmed convention: every example README leads with a one-line domain summary, then H2 `What this example demonstrates`, then H2 `What this example deliberately omits` cross-referencing other examples. Lending and healthcare both match.

## 2. Scaffold the example directory

- [x] 2.1 Create `examples/registry/` directory.
- [x] 2.2 Create an empty `examples/registry/operational.json` containing only the top-level `domain` envelope (`{ "name": "Registry", "path": "…", "description": "…" }`) plus empty Operational collections (`memberships: []`, `operations: []`, `triggers: []`, `rules: []`, `relationships: []`, `tasks: []`, `processes: []`).

## 3. Draft `operational.json` — noun primitives

Build the example incrementally and run `npm test --workspace=@dna-codes/dna-core -- --testPathPatterns examples` after each block to keep the example schema-valid the whole way.

- [x] 3.1 Draft three Resources (`TypeDefinition`, `Instance`, `Link`) with attributes. `TypeDefinition` MUST include a `category` enum attribute with values `[ "person", "role", "group", "resource", "domain" ]`, plus an `attribute_schema` (text or string) and a `status` enum (`draft`, `published`, `archived`). `Instance` MUST include a `type_def` reference attribute pointing at TypeDefinition and a `data` attribute (text). `Link` MUST include `from` and `to` reference attributes pointing at Instance plus an optional `role` and `attributes` payload.
- [x] 3.2 Draft two Persons (`Administrator`, `Operator`).
- [x] 3.3 Draft one Group (`Registry`).
- [x] 3.4 Draft four Roles: `TypeDesigner`, `DataManager`, `Viewer`, and `ValidationEngine`. `ValidationEngine` MUST have `system: true` and link via `resource:` to a Resource template (use a small `ValidationService` Resource if needed for the link, or wire to `Instance` — choose during drafting and note the decision in the README).
- [x] 3.5 Run the example test suite after step 3.4 and confirm the document still validates against the operational schema with only nouns declared.

## 4. Draft `operational.json` — activity primitives

- [x] 4.1 Draft four Memberships covering: `Administrator → TypeDesigner` (in Registry), `Administrator → DataManager`, `Operator → DataManager`, `Operator → Viewer`.
- [x] 4.2 Draft eight Operations: `TypeDefinition.Create`, `TypeDefinition.Publish`, `TypeDefinition.Archive`, `Instance.Create`, `Instance.Update`, `Instance.Delete`, `Link.Create`, `Link.Delete`. Each MUST list its `target`, `action` (PascalCase), and any state changes via `changes[]` where appropriate (e.g. `TypeDefinition.Publish` sets `status` to `published`).
- [x] 4.3 Draft five Triggers covering at least: one user-source (Administrator invokes `TypeDefinition.Create`), one operation-source on `TypeDefinition.Publish` whose `process:` field references `InstanceBootstrap`, one webhook-source (e.g. external system `Instance.Create`), one schedule-source (cron for validation sweep), and one user-source for `Link.Create`.
- [x] 4.4 Draft twelve Rules. At least one access Rule per Operation (covering who can invoke); two condition Rules named `TypeIsNotRole` (blocks Instance creation when `category == 'role'`) and `TypeIsPublished` (blocks Instance creation when `status != 'published'`); plus additional access Rules wiring `TypeDesigner` to TypeDefinition Operations, `DataManager` to Instance Operations, and `ValidationEngine` to `Instance.Update`. Use the Rule subtype field name pinned in task 1.1.
- [x] 4.5 Draft three Relationships: `InstanceOfType` (Instance.type_def → TypeDefinition, `many-to-one`, inverse `instances`), `LinkFrom` (Link.from → Instance, `many-to-one`, inverse `outbound_links`), `LinkTo` (Link.to → Instance, `many-to-one`, inverse `inbound_links`).
- [x] 4.6 Draft six Tasks (kebab-case names): one per Operation that needs human action (`design-type`, `publish-type`, `create-instance`, `update-instance`, `link-instances`, `validate-instance`). `validate-instance` is performed by the `ValidationEngine` Role.
- [x] 4.7 Draft three Processes: `TypeOnboarding` (design-type → publish-type), `InstanceBootstrap` (create-instance → validate-instance, where the validate step has `conditions: ["TypeIsPublished", "TypeIsNotRole"]`), and `LinkLifecycle` (link-instances). Each Process MUST declare `operator`, `startStep`, and a `steps[]` DAG.
- [x] 4.8 Run schema + cross-layer validation after each subtask; fix any reported errors before moving on.

## 5. Write `examples/registry/README.md`

- [x] 5.1 Draft a `## What this example demonstrates` section listing: the TypeDefinition / Instance / Link triad, the `category` enum, the `ValidationEngine` system Role with `resource:` link, the `InstanceBootstrap` Process triggered by `TypeDefinition.Publish`, step-level `conditions[]` referencing condition Rules, three explicit `Relationship` primitives with cardinality + inverses, and the four-Membership access pattern.
- [x] 5.2 Draft a `## What this example deliberately omits` section pointing readers to other examples for: scoped Roles (lending), multi-Group Persons (marketplace), per-Person Role.scope (healthcare), parallel fan-out via `depends_on` (manufacturing), and Step.else routing (lending/marketplace). Explicitly note that `category` is *attribute-level* classification inside a platform's data, distinct from DNA's primitive-level Resource/Person/Role/Group/Domain distinction.

## 6. Update root `README.md`

- [x] 6.1 Append a row to the cross-domain examples table for `[\`examples/registry\`](./examples/registry)`. The Demonstrates column SHALL summarize: type-driven platform meta-pattern; TypeDefinition / Instance / Link triad; category enum dispatching condition Rules; system Role on Resource template; Process-level Trigger off config primitive lifecycle.

## 7. Add per-domain assertions in `packages/core/src/examples.test.ts`

- [x] 7.1 Append a `describe('examples — registry', () => { … })` block at the end of the file, following the structure of `describe('examples — lending', …)`.
- [x] 7.2 Inside the block, assert (each in its own `it(…)`):
    - `TypeDefinition` Resource exists in `domain.resources[]` and has a `category` attribute of `type === 'enum'` with values `person`, `role`, `group`, `resource`, `domain`.
    - `Instance` and `Link` Resources are present.
    - A Role named `ValidationEngine` exists in `domain.roles[]` with `system === true`.
    - A Trigger exists with `source === 'operation'`, `after === 'TypeDefinition.Publish'`, and `process === 'InstanceBootstrap'`.
    - A Process named `InstanceBootstrap` is declared in `processes[]`.
    - At least one Process step has `conditions[]` containing a name matching a Rule in `rules[]` whose subtype/rule_type is `condition`.
- [x] 7.3 Run `npm test --workspace=@dna-codes/dna-core` and confirm all six existing example blocks continue to pass alongside the new registry block.

## 8. Validation + cleanup

- [x] 8.1 Run `openspec validate add-registry-example --strict` and confirm the change still validates.
- [x] 8.2 Run `npm test --workspace=@dna-codes/dna-core` end-to-end and confirm the full suite passes.
- [x] 8.3 Diff the changed files; confirm no spurious edits crept into adapter / ingest / schemas packages.
- [ ] 8.4 Commit on `main` with a single descriptive message referencing GitHub issue #1.
- [ ] 8.5 Run `/opsx:archive add-registry-example` (separate session) to archive the change and sync `openspec/specs/cross-domain-examples/spec.md`.
