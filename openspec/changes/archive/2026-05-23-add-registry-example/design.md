## Context

DNA's six existing cross-domain examples each model a concrete vertical (lending, healthcare, etc.). They demonstrate the **language** but not the **meta-pattern** that emerges when a platform uses DNA's Operational primitives to implement type-driven, config-vs-instance architecture: a runtime registry where TypeDefinitions describe what data can exist, Instances are validated records of those types, and Links capture typed relationships (both plain references and role assignments). This is the architecture behind mass-tort case management, healthcare records, low-code workflow builders, and similar platforms — and every team that builds one re-discovers the same mapping from "resource type with schema" → DNA Resources and "role as attributed relationship" → DNA Roles + Memberships.

Constraints we work within:
- The Operational schema is frozen for this change. No new primitives, no schema fields, no adapter changes — the goal is to demonstrate that DNA *already* expresses the pattern, not to extend it.
- The example must follow the conventions of the existing six: directory at `examples/<domain>/`, single `operational.json` document, README with `## What this example demonstrates` / `## What this example deliberately omits` sections.
- The example must pass both schema conformance and cross-layer validation in `packages/core/src/examples.test.ts` and exercise primitives the other six don't (TypeDefinition with a `category` enum, a system Role, a Process-level Trigger driven by an `operation`-source Trigger off `TypeDefinition.Publish`).
- Stakeholders: end users browsing `examples/` for guidance, framework authors mapping their concepts to DNA, and the platform's own validator (the suite of per-domain shape assertions guards against silent capability loss).

## Goals / Non-Goals

**Goals:**
- Add `examples/registry/` as a 7th canonical example demonstrating type-driven platform architecture using DNA's existing primitives.
- Show how three Resources (TypeDefinition / Instance / Link) plus a category enum capture the noun-primitive duality (resource / person / role / group / domain) without requiring schema extensions.
- Exercise primitives and patterns under-represented in the existing six: a system Role on a Resource template (`ValidationEngine`), an `operation`-source Process Trigger off a config primitive's lifecycle Operation (`InstanceBootstrap` after `TypeDefinition.Publish`), and condition Rules referenced from Process step `conditions[]` (TypeIsNotRole, TypeIsPublished).
- Validate that the Operational schema is sufficient for platforms that don't hardcode their domain model.

**Non-Goals:**
- Introducing a `Registry` primitive or any schema extension. The point is that *no extension is needed*.
- Modeling instance-level data (specific TypeDefinitions like `loan` or `patient`). The example stays at the meta-platform level — instance-level concerns belong in product/technical layers.
- Building a tutorial or step-by-step walkthrough. This is an example DNA document with a README, not docs.
- Bumping versions or touching any package. The change is purely additive at the repo-root `examples/` directory plus a test file.

## Decisions

### D1: Three Resources (TypeDefinition / Instance / Link) instead of a single `Registry` Resource

We model the meta-platform with three Resources rather than one because each plays a distinct role in the type system:

- **TypeDefinition** is the *config template* — it carries a `category` enum that classifies what kind of noun it produces, plus its own attribute schema.
- **Instance** is the *runtime record* validated against a TypeDefinition.
- **Link** is the *typed relationship* — it can represent a plain reference (`belongs_to`) or a role assignment (`lead_counsel`, with role-specific attributes).

Alternatives considered:
- *Single `Registry` Resource with sub-collections.* Collapses the three concerns into one and obscures the per-Resource lifecycle (a TypeDefinition has a `Publish` Operation; an Instance has `Create`/`Update`/`Delete`; a Link has `Create`/`Delete`). Rejected — splits map naturally to distinct Operations and Rules, which is the point of using DNA primitives.
- *TypeDefinition only, with Instances/Links modeled as attributes.* Loses Operation granularity and forces ad-hoc Rule writing per attribute path. Rejected.

### D2: `category` is an enum attribute on TypeDefinition, not a separate Resource per category

The `category` field on TypeDefinition takes one of `person | role | group | resource | domain`. Behavior that differs per category is enforced via **condition Rules** referencing the attribute:

- `TypeIsNotRole` — condition Rule blocking Instance creation when `category == 'role'` (role assignments are Links, not Instances).
- `TypeIsPublished` — condition Rule blocking Instance creation against unpublished TypeDefinitions.

Alternative: introduce one Resource per category (`PersonType`, `ResourceType`, …). Rejected — five Resources for category dispatch is mechanical bloat and forfeits the demonstration that DNA's `enum` attribute plus condition Rules already handle this.

### D3: `ValidationEngine` is a system Role, not a system Person

`ValidationEngine` is the automated actor that runs schema validation on `Instance.Update`. Marking it `system: true` and giving it a `resource:` link aligns it with the existing `NightlyDelinquencySweep` (lending) and the manufacturing system Roles, demonstrating the same pattern in a registry context.

Alternative: Person with `Administrator` and a side-channel automation marker. Rejected — DNA already has `Role.system` for exactly this; using a Person here would model the automation as a human and confuse the access-control reading of the Rules.

### D4: Process-level Trigger on `TypeDefinition.Publish`, not on `Instance.Create`

`InstanceBootstrap` fires on `TypeDefinition.Publish` so the demonstration matches the mass-tort `SettlementDisbursement` pattern: a config-primitive lifecycle event kicks off a downstream SOP. Putting the Trigger on `Instance.Create` would make it indistinguishable from per-event reaction and miss the "config drives orchestration" point.

### D5: Three Relationships explicitly named, even though they could be inferred from `reference` attributes

Three top-level `Relationship` primitives are declared: `InstanceOfType` (Instance.type_def → TypeDefinition), `LinkFrom` (Link.from → Instance), `LinkTo` (Link.to → Instance). They're redundant with the `reference`-typed attributes that hold the same FK, but DNA's `Relationship` primitive is what makes cardinality (`many-to-one`) and the inverse direction (`instances`, `outbound_links`, `inbound_links`) first-class. This is exactly the muscle a platform's relationship engine needs and is under-demonstrated in the existing six examples.

### D6: Keep all `Rule.operation` references using the `Target.Action` shorthand

Twelve Rules reference Operations by `Target.Action` (`TypeDefinition.Publish`, `Instance.Create`, etc.) per the convention in the published 0.8.0 schema. The recent rename from `subtype` to `rule_type` (commit `1be03bb`) is upstream-only at time of this design; the example will be written against whichever field the published `@dna-codes/dna-schemas` version recognizes at implementation time — `subtype` if 0.6.0, `rule_type` if a newer release is published before implementation lands. The tasks file pins this decision to the schema-version probe in task §1.

## Risks / Trade-offs

- **[Risk] The example bloats the test runtime.** → Mitigation: ~400 lines of JSON across one example is comparable to `mass-tort` (the largest existing example). The `examples.test.ts` suite runs in well under 5s today; one more domain is negligible.
- **[Risk] The `category` enum overlaps conceptually with DNA's noun primitives, which could mislead readers into thinking they're equivalent.** → Mitigation: the README's "What this example deliberately omits" section explicitly calls out that `category` is *attribute-level* classification inside a platform's data model and is distinct from DNA's primitive-level distinction between Resource/Person/Role/Group/Domain. The condition Rules referencing `category` reinforce that it's data, not metadata.
- **[Risk] Schema-field naming churn (`subtype` vs `rule_type`).** → Mitigation: task §1 probes the installed `@dna-codes/dna-schemas` version and pins the field name before drafting the Rules block. The example always conforms to the version checked into the repo.
- **[Risk] Three Relationships feel redundant against three `reference` attributes.** → Trade-off accepted: the redundancy is the point — it demonstrates the `Relationship` primitive's cardinality + inverse semantics, which `reference` attributes alone don't capture.

## Migration Plan

No migration. The change is additive: new files at `examples/registry/`, one row in the root README, ~20 lines appended to `examples.test.ts`. Rollback is `git revert` of the implementing commit.

## Open Questions

- **Q1 (resolved at implementation time):** Does the current `@dna-codes/dna-schemas` checked into the repo use `subtype` or `rule_type` on `Rule`? Resolved by inspecting `packages/schemas/operational/rule.json` in task §1.1.
- **Q2 (resolved at implementation time):** Does the published example need `id` / `type` / `version` base-contract fields on every primitive, or does the loader stamp them? Resolved by checking the other six examples — if they carry the fields, registry does too.
