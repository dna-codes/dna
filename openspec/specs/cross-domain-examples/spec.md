# cross-domain-examples Specification

## Purpose

A capability covering the repo's set of canonical example DNA documents under `examples/<domain>/operational.json`, the per-example README convention, the root-README cross-domain table, and the per-domain shape assertions in `packages/core/src/examples.test.ts`. This change adds the `registry` example's requirements as the inaugural set; future cross-domain examples extend the same capability.

## Requirements

### Requirement: Registry example exists at `examples/registry/operational.json`

The repository SHALL include a registry example DNA document at `examples/registry/operational.json` that validates against the published `operational` schema in `@dna-codes/dna-schemas` and against the cross-layer validator, and that demonstrates a type-driven, config-vs-instance platform meta-pattern using only existing Operational primitives.

#### Scenario: The example validates against the operational schema

- **WHEN** `examples.test.ts` loads `examples/registry/operational.json` and runs `DnaValidator.validate(doc, 'operational')`
- **THEN** the result is `{ valid: true, errors: [] }`

#### Scenario: The example passes cross-layer validation

- **WHEN** `examples.test.ts` loads `examples/registry/operational.json` and runs `DnaValidator.validateCrossLayer({ operational: doc })`
- **THEN** the result is `{ valid: true, errors: [] }`

#### Scenario: The example carries base-contract fields on every primitive

- **WHEN** any top-level Operational primitive in `examples/registry/operational.json` (resources, persons, roles, groups, memberships, operations, triggers, rules, relationships, tasks, processes entries) is inspected
- **THEN** it carries `id`, `type`, and `version` fields conforming to the `primitive-base-contract` capability

### Requirement: Registry example models the TypeDefinition / Instance / Link triad

The registry example SHALL declare three top-level Resources named `TypeDefinition`, `Instance`, and `Link`, representing config templates, runtime records, and typed relationships respectively. TypeDefinition SHALL include an enum attribute named `category` whose values cover the noun-primitive classifications of the platform (`person`, `role`, `group`, `resource`, `domain`).

#### Scenario: TypeDefinition / Instance / Link Resources are present

- **WHEN** the example is loaded and its `domain.resources[]` is inspected
- **THEN** Resources with `name` equal to `TypeDefinition`, `Instance`, and `Link` are all present

#### Scenario: TypeDefinition has a `category` enum attribute

- **WHEN** the `TypeDefinition` Resource's `attributes[]` is inspected
- **THEN** it contains an entry with `name === 'category'`, `type === 'enum'`, and `values` covering `person`, `role`, `group`, `resource`, and `domain`

### Requirement: Registry example exercises a system Role on a Resource template

The registry example SHALL declare a Role named `ValidationEngine` with `system: true`, linked via the `resource:` field to a noun template, demonstrating the system-actor pattern in a config-driven platform context.

#### Scenario: ValidationEngine Role is system-flagged

- **WHEN** the example's `domain.roles[]` is inspected
- **THEN** an entry with `name === 'ValidationEngine'` exists with `system === true`

### Requirement: Registry example exercises a Process-level Trigger off a config-primitive lifecycle Operation

The registry example SHALL declare a Process named `InstanceBootstrap` triggered by an Operation-source Trigger whose `after` field references `TypeDefinition.Publish`, demonstrating that DNA's Process-level Trigger mechanism works for config-driven workflows.

#### Scenario: InstanceBootstrap Process is triggered by TypeDefinition.Publish

- **WHEN** the example's `triggers[]` and `processes[]` collections are inspected
- **THEN** a Trigger exists with `source === 'operation'`, `after === 'TypeDefinition.Publish'`, and `process === 'InstanceBootstrap'`, and a Process named `InstanceBootstrap` is declared in `processes[]`

### Requirement: Registry example references condition Rules from Process step `conditions[]`

The registry example SHALL include at least one Process step whose `conditions[]` references a named condition-type Rule (such as `TypeIsNotRole` or `TypeIsPublished`), demonstrating step-level gating via Rule reference rather than inline expression.

#### Scenario: A Process step references a named condition Rule

- **WHEN** the example's `processes[].steps[]` is inspected
- **THEN** at least one step has a `conditions` array containing a string that matches the `name` of a Rule in `rules[]` whose `subtype` (or `rule_type`, per the prevailing schema field name) is `condition`

### Requirement: Registry example README documents what it demonstrates and omits

The repository SHALL include `examples/registry/README.md` following the convention established by `examples/lending/README.md`: a `## What this example demonstrates` section listing the specific DNA capabilities exercised, and a `## What this example deliberately omits` section pointing readers to other examples for orthogonal capabilities.

#### Scenario: README has the conventional two sections

- **WHEN** `examples/registry/README.md` is opened
- **THEN** it contains both an H2 header titled `What this example demonstrates` and an H2 header titled `What this example deliberately omits`

#### Scenario: README's "demonstrates" section names the meta-pattern explicitly

- **WHEN** the `## What this example demonstrates` section is read
- **THEN** it mentions the TypeDefinition / Instance / Link triad, the `category` enum, the `ValidationEngine` system Role, and the `InstanceBootstrap` Process triggered by `TypeDefinition.Publish`

### Requirement: Root README's cross-domain examples table lists the registry example

The repository's root `README.md` SHALL include a row in its cross-domain examples table linking to `./examples/registry` with a one-line "Demonstrates" summary covering the type-driven meta-pattern.

#### Scenario: README table row exists

- **WHEN** the cross-domain examples table in the root `README.md` is read
- **THEN** it contains a row whose first column links to `./examples/registry` and whose summary mentions a type-driven platform, TypeDefinition/Instance/Link, or the config-vs-instance pattern

### Requirement: Per-domain shape assertions guard against silent registry-capability loss

`packages/core/src/examples.test.ts` SHALL include a `describe('examples — registry', …)` block with assertions that the registry example exercises its registry-specific shapes (TypeDefinition with `category` enum, ValidationEngine system Role, InstanceBootstrap Process triggered by TypeDefinition.Publish, a Process step referencing a named condition Rule). Failure of any assertion SHALL fail the `@dna-codes/dna-core` workspace test suite with a clear message identifying the missing capability.

#### Scenario: Registry block runs and asserts the registry-specific shapes

- **WHEN** `npm test --workspace=@dna-codes/dna-core` is run
- **THEN** the `examples — registry` describe block executes and all its assertions pass on the checked-in example

#### Scenario: Removing a registry-specific feature trips an assertion

- **WHEN** a developer removes the `ValidationEngine` Role (or the `category` attribute, or the `InstanceBootstrap` Trigger) from `examples/registry/operational.json`
- **THEN** at least one assertion in the `examples — registry` describe block fails with a message naming the missing capability
