# Registry — example DNA

A type-driven resource management platform — the meta-pattern behind mass-tort case management, healthcare records, low-code workflow builders, and any system whose end users define their own entity types. The other six examples model concrete verticals; this one models the *platform* that hosts them, using only DNA's existing Operational primitives.

## What this example demonstrates

- **TypeDefinition / Instance / Link triad**: three Resources capture the entire config-vs-instance pattern. `TypeDefinition` is the config template, `Instance` is the validated runtime record, `Link` is the typed relationship. No new primitives — just three Resources with intentional attribute schemas.
- **`category` enum on TypeDefinition**: a single enum attribute (`person | role | group | resource | domain`) classifies what kind of noun each type produces, mirroring DNA's noun-primitive distinction *at the platform's data layer*. Condition Rules (`TypeIsNotRole`) dispatch on this attribute to enforce platform invariants without per-category Resources.
- **System Role with `resource:` link**: `ValidationEngine` is `system: true` and links to a `ValidationService` Resource — the same pattern as `NightlyDelinquencySweep` (lending) and the manufacturing system Roles, applied here to a registry-validation context. It's wired into the `Instance.Update` access Rule and the `validate-instance` Task.
- **Process-level Trigger off a config-primitive lifecycle Operation**: `InstanceBootstrap` fires from a `source: operation` Trigger whose `after` is `TypeDefinition.Publish` — config-primitive lifecycle events drive downstream SOPs, same pattern as mass-tort's `SettlementDisbursement` triggered by `Settlement.Accept`.
- **Step-level `conditions[]` referencing named condition Rules**: `InstanceBootstrap.validate` declares `conditions: ["TypeIsPublished", "TypeIsNotRole"]` — the step only runs if both Rules evaluate true. Demonstrates Rule reuse across access enforcement and Process gating.
- **Three explicit Relationships with cardinality + inverse**: `InstanceOfType`, `LinkFrom`, `LinkTo` declare the registry's traversal graph (`many-to-one` with inverse edges named `instances`, `outbound_links`, `inbound_links`) — exactly the muscle a platform's relationship engine needs, even though the same FKs are already present as `reference` attributes on the Resources.
- **Four-Membership access pattern**: Administrator holds both TypeDesigner and DataManager; Operator holds DataManager and Viewer. Demonstrates a Person template eligible for multiple Roles inside the same Group.
- **Multiple access Rules on one Operation**: `Instance.Update` is governed by two separate access Rules (`InstanceUpdateByDataManager`, `InstanceUpdateByValidationEngine`) so the human and system wirings stay visible side-by-side.

## What this example deliberately omits

- **Scoped Roles outside Registry** — every Role here scopes to the single Registry Group. See `lending` (Underwriter scoped to BankDepartment) or `healthcare` (Roles scoped to Patient).
- **Multi-Group Persons** — the Operator doesn't span Groups. See `marketplace` for the same Person template across two Groups.
- **Per-Person Role.scope** — no Role here scopes to a Person. See `healthcare` (AttendingPhysician.scope = Patient).
- **Parallel fan-out via `depends_on`** — every step has at most one upstream dependency. See `manufacturing` for true DAG fan-out + fan-in.
- **`Step.else` routing** — no conditional branching to a sibling Step. See `lending` (abort) and `healthcare`/`marketplace` (named-sibling routing).
- **Role.cardinality / Role.excludes** — no per-scope-instance Role-count constraints. See `healthcare` (`AttendingPhysician.cardinality = "one"`, `excludes: ["ConsultingSpecialist"]`).
- **The category enum is not DNA's primitive system.** `category` is *attribute-level* classification inside the platform's own data model — it tells the platform whether a given TypeDefinition produces person-shaped, role-shaped, or resource-shaped data *for the platform's users*. It is distinct from DNA's primitive-level Resource/Person/Role/Group/Domain distinction, which lives one level up in the DNA document itself. The whole point of this example is that DNA's primitives are expressive enough to *model* a platform whose data layer offers its own noun typology, without DNA needing to expose its primitives as runtime-definable.
